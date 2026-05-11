     1|/**
     2| * [LAYER: CORE]
     3| * Handles the checkout lifecycle: initiation, payment finalization, and order placement.
     4| */
     5|import * as crypto from 'node:crypto';
     6|import type { 
     7|  IOrderRepository, 
     8|  IProductRepository, 
     9|  ICartRepository, 
    10|  IDiscountRepository, 
    11|  IPaymentProcessor, 
    12|  ILockProvider, 
    13|  ICheckoutGateway 
    14|} from '@domain/repositories';
    15|import { 
    16|  Order, 
    17|  Address, 
    18|  OrderStatus 
    19|} from '@domain/models';
    20|import { 
    21|  CartEmptyError,
    22|  CheckoutInProgressError
    23|} from '@domain/errors';
    24|import { 
    25|  assertValidShippingAddress, 
    26|  calculateCartTotal, 
    27|  calculateTax,
    28|  deriveEstimatedDeliveryDate 
    29|} from '@domain/rules';
    30|import { AuditService } from './AuditService';
    31|import { DiscountService } from './DiscountService';
    32|import { logger } from '@utils/logger';
    33|import { runTransaction, getUnifiedDb } from '@infrastructure/firebase/bridge';
    34|
    35|export class CheckoutService {
    36|  constructor(
    37|    private orderRepo: IOrderRepository,
    38|    private productRepo: IProductRepository,
    39|    private cartRepo: ICartRepository,
    40|    private discountRepo: IDiscountRepository,
    41|    private payment: IPaymentProcessor,
    42|    private audit: AuditService,
    43|    private locker: ILockProvider,
    44|    private checkoutGateway?: ICheckoutGateway
    45|  ) {}
    46|
    47|  async placeOrder(userId: string, shippingAddress: Address, paymentMethodId: string, idempotencyKey?: string, discountCode?: string): Promise<Order> {
    48|    return this.initiateCheckout(userId, shippingAddress, discountCode, idempotencyKey, paymentMethodId);
    49|  }
    50|
    51|  async initiateCheckout(userId: string, shippingAddress: Address, discountCode?: string, idempotencyKey?: string, paymentIntentId?: string, fulfillmentMethod: 'shipping' | 'pickup' | 'delivery' = 'shipping'): Promise<Order> {
    52|    assertValidShippingAddress(shippingAddress);
    53|    const lockId = `checkout_lock:${userId}`;
    54|    const acquired = await this.locker.acquireLock(lockId, userId, 45000);
    55|    if (!acquired) throw new CheckoutInProgressError();
    56|
    57|    try {
    58|      return await runTransaction(getUnifiedDb(), async (transaction: any) => {
    59|        const cart = await this.cartRepo.getByUserId(userId, transaction);
    60|        if (!cart || cart.items.length === 0) throw new CartEmptyError();
    61|        
    62|        const subtotal = calculateCartTotal(cart.items);
    63|        let discountAmount = 0, validDiscountCode: string | undefined, isFreeShipping = false;
    64|
    65|        if (discountCode) {
    66|          const discountService = new DiscountService(this.discountRepo, this.audit, this.orderRepo);
    67|          const val = await discountService.validateDiscount(discountCode, subtotal, userId);
    68|          if (val.valid && val.discount) { 
    69|            discountAmount = val.discountAmount || 0; 
    70|            validDiscountCode = val.discount.code; 
    71|            isFreeShipping = !!val.isFreeShipping;
    72|            await this.discountRepo.incrementUsage(val.discount.id, transaction);
    73|          }
    74|        }
    75|
    76|        const shipping = (subtotal >= 10000 || isFreeShipping || fulfillmentMethod === 'pickup') ? 0 : 599;
    77|        const taxAmount = calculateTax({ subtotal, shipping, discount: discountAmount, address: shippingAddress });
    78|        const total = Math.max(0, subtotal + shipping + taxAmount - discountAmount);
    79|
    80|        const orderId = crypto.randomUUID();
    81|        const order: Order = {
    82|          id: orderId,
    83|          userId,
    84|          items: cart.items.map(i => ({ ...i, fulfilledQty: 0, at: new Date() })) as any,
    85|          shippingAmount: shipping,
    86|          taxAmount: taxAmount,
    87|          discountAmount: discountAmount,
    88|          discountCode: validDiscountCode,
    89|          total,
    90|          status: 'pending',
    91|          shippingAddress,
    92|          paymentTransactionId: paymentIntentId || null,
    93|          idempotencyKey: idempotencyKey || crypto.randomUUID(),
    94|          fulfillmentMethod,
    95|          fulfillmentLocationId: 'primary',
    96|          fulfillments: [],
    97|          notes: [],
    98|          riskScore: 0,
    99|          estimatedDeliveryDate: deriveEstimatedDeliveryDate({ createdAt: new Date() } as any),
   100|          fulfillmentEvents: [{ 
   101|            id: crypto.randomUUID(), 
   102|            type: 'order_placed', 
   103|            label: 'Order Received', 
   104|            description: 'Payment verified, preparing for fulfillment.', 
   105|            at: new Date() 
   106|          }],
   107|          createdAt: new Date(),
   108|          updatedAt: new Date(),
   109|          metadata: {
   110|            nodeVersion: process.version,
   111|            userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'server'
   112|          }
   113|        };
   114|
   115|        await this.orderRepo.save(order, transaction);
   116|        await this.cartRepo.clear(userId);
   117|        await this.audit.recordWithTransaction(transaction, {
   118|          userId,
   119|          userEmail: 'user@example.com',
   120|          action: 'order_placed',
   121|          targetId: orderId,
   122|          details: { total, itemCount: cart.items.length, discountCode: validDiscountCode }
   123|        });
   124|
   125|        return order;
   126|      });
   127|    } finally {
   128|      await this.locker.releaseLock(lockId, userId);
   129|    }
   130|  }
   131|
   132|  async finalizeOrderPayment(paymentIntentId: string, stripePi?: any): Promise<Order> {
   133|    const order = await this.orderRepo.getByPaymentTransactionId(paymentIntentId);
   134|    if (!order || order.status !== 'pending') return order as any;
   135|    
   136|    const riskScore = stripePi?.charges?.data?.[0]?.outcome?.risk_score || 0;
   137|    let nextStatus: OrderStatus = 'confirmed';
   138|    if (riskScore < 75) {
   139|       if (order.items.every(i => i.isDigital)) nextStatus = 'delivered';
   140|       else if (order.fulfillmentMethod === 'shipping') nextStatus = 'processing';
   141|       else if (order.fulfillmentMethod === 'pickup') nextStatus = 'ready_for_pickup';
   142|       else if (order.fulfillmentMethod === 'delivery') nextStatus = 'delivery_started';
   143|    }
   144|
   145|    try {
   146|      await runTransaction(getUnifiedDb(), async (transaction: any) => {
   147|        const stockUpdates = order.items.map(item => ({
   148|          id: item.productId,
   149|          variantId: item.variantId,
   150|          delta: -item.quantity
   151|        }));
   152|        await this.productRepo.batchUpdateStock(stockUpdates, transaction);
   153|        await this.orderRepo.updateStatus(order.id, nextStatus, transaction);
   154|        await this.orderRepo.updateRiskScore(order.id, riskScore);
   155|        
   156|        await this.audit.recordWithTransaction(transaction, {
   157|          userId: 'system',
   158|          userEmail: 'system@dreambees.art',
   159|          action: 'order_payment_finalized',
   160|          targetId: order.id,
   161|          details: { status: nextStatus, riskScore, paymentIntentId, items: order.items.length }
   162|        });
   163|
   164|        await this.cartRepo.clear(order.userId);
   165|      });
   166|
   167|      return { ...order, status: nextStatus, riskScore };
   168|    } catch (err) {
   169|      logger.error('Failed to finalize order payment', { orderId: order.id, paymentIntentId, err });
   170|      throw err;
   171|    }
   172|  }
   173|}
   174|