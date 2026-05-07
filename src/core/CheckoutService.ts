/**
 * [LAYER: CORE]
 * Handles the checkout lifecycle: initiation, payment finalization, and order placement.
 */
import * as crypto from 'node:crypto';
import type { 
  IOrderRepository, 
  IProductRepository, 
  ICartRepository, 
  IDiscountRepository, 
  IPaymentProcessor, 
  ILockProvider, 
  ICheckoutGateway 
} from '@domain/repositories';
import { 
  Order, 
  Address, 
  OrderStatus 
} from '@domain/models';
import { 
  CartEmptyError,
  CheckoutInProgressError
} from '@domain/errors';
import { 
  assertValidShippingAddress, 
  calculateCartTotal, 
  calculateTax,
  deriveEstimatedDeliveryDate 
} from '@domain/rules';
import { AuditService } from './AuditService';
import { DiscountService } from './DiscountService';
import { logger } from '@utils/logger';
import { runTransaction, getUnifiedDb } from '@infrastructure/firebase/bridge';

export class CheckoutService {
  constructor(
    private orderRepo: IOrderRepository,
    private productRepo: IProductRepository,
    private cartRepo: ICartRepository,
    private discountRepo: IDiscountRepository,
    private payment: IPaymentProcessor,
    private audit: AuditService,
    private locker: ILockProvider,
    private checkoutGateway?: ICheckoutGateway
  ) {}

  async placeOrder(userId: string, shippingAddress: Address, paymentMethodId: string, idempotencyKey?: string, discountCode?: string): Promise<Order> {
    return this.initiateCheckout(userId, shippingAddress, discountCode, idempotencyKey, paymentMethodId);
  }

  async initiateCheckout(userId: string, shippingAddress: Address, discountCode?: string, idempotencyKey?: string, paymentIntentId?: string, fulfillmentMethod: 'shipping' | 'pickup' | 'delivery' = 'shipping'): Promise<Order> {
    assertValidShippingAddress(shippingAddress);
    const lockId = `checkout_lock:${userId}`;
    const acquired = await this.locker.acquireLock(lockId, userId, 45000);
    if (!acquired) throw new CheckoutInProgressError();

    try {
      return await runTransaction(getUnifiedDb(), async (transaction: any) => {
        const cart = await this.cartRepo.getByUserId(userId, transaction);
        if (!cart || cart.items.length === 0) throw new CartEmptyError();
        
        const subtotal = calculateCartTotal(cart.items);
        let discountAmount = 0, validDiscountCode: string | undefined, isFreeShipping = false;

        if (discountCode) {
          const discountService = new DiscountService(this.discountRepo, this.audit, this.orderRepo);
          const val = await discountService.validateDiscount(discountCode, subtotal, userId);
          if (val.valid && val.discount) { 
            discountAmount = val.discountAmount || 0; 
            validDiscountCode = val.discount.code; 
            isFreeShipping = !!val.isFreeShipping;
            await this.discountRepo.incrementUsage(val.discount.id, transaction);
          }
        }

        const shipping = (subtotal >= 10000 || isFreeShipping || fulfillmentMethod === 'pickup') ? 0 : 599;
        const taxAmount = calculateTax({ subtotal, shipping, discount: discountAmount, address: shippingAddress });
        const total = Math.max(0, subtotal + shipping + taxAmount - discountAmount);

        const orderId = crypto.randomUUID();
        const order: Order = {
          id: orderId,
          userId,
          items: cart.items.map(i => ({ ...i, fulfilledQty: 0, at: new Date() })) as any,
          shippingAmount: shipping,
          taxAmount: taxAmount,
          discountAmount: discountAmount,
          discountCode: validDiscountCode,
          total,
          status: 'pending',
          shippingAddress,
          paymentTransactionId: paymentIntentId || null,
          idempotencyKey: idempotencyKey || crypto.randomUUID(),
          fulfillmentMethod,
          fulfillmentLocationId: 'primary',
          fulfillments: [],
          notes: [],
          riskScore: 0,
          estimatedDeliveryDate: deriveEstimatedDeliveryDate({ createdAt: new Date() } as any),
          fulfillmentEvents: [{ 
            id: crypto.randomUUID(), 
            type: 'order_placed', 
            label: 'Order Received', 
            description: 'Payment verified, preparing for fulfillment.', 
            at: new Date() 
          }],
          createdAt: new Date(),
          updatedAt: new Date(),
          metadata: {
            nodeVersion: process.version,
            userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'server'
          }
        };

        await this.orderRepo.save(order, transaction);
        await this.cartRepo.clear(userId);
        await this.audit.recordWithTransaction(transaction, {
          userId,
          userEmail: 'user@example.com',
          action: 'order_placed',
          targetId: orderId,
          details: { total, itemCount: cart.items.length, discountCode: validDiscountCode }
        });

        return order;
      });
    } finally {
      await this.locker.releaseLock(lockId, userId);
    }
  }

  async finalizeOrderPayment(paymentIntentId: string, stripePi?: any): Promise<Order> {
    const order = await this.orderRepo.getByPaymentTransactionId(paymentIntentId);
    if (!order || order.status !== 'pending') return order as any;
    
    const riskScore = stripePi?.charges?.data?.[0]?.outcome?.risk_score || 0;
    let nextStatus: OrderStatus = 'confirmed';
    if (riskScore < 75) {
       if (order.items.every(i => i.isDigital)) nextStatus = 'delivered';
       else if (order.fulfillmentMethod === 'shipping') nextStatus = 'processing';
       else if (order.fulfillmentMethod === 'pickup') nextStatus = 'ready_for_pickup';
       else if (order.fulfillmentMethod === 'delivery') nextStatus = 'delivery_started';
    }

    try {
      await runTransaction(getUnifiedDb(), async (transaction: any) => {
        const stockUpdates = order.items.map(item => ({
          id: item.productId,
          variantId: item.variantId,
          delta: -item.quantity
        }));
        await this.productRepo.batchUpdateStock(stockUpdates, transaction);
        await this.orderRepo.updateStatus(order.id, nextStatus, transaction);
        await this.orderRepo.updateRiskScore(order.id, riskScore);
        
        await this.audit.recordWithTransaction(transaction, {
          userId: 'system',
          userEmail: 'system@dreambees.art',
          action: 'order_payment_finalized',
          targetId: order.id,
          details: { status: nextStatus, riskScore, paymentIntentId, items: order.items.length }
        });

        await this.cartRepo.clear(order.userId);
      });

      return { ...order, status: nextStatus, riskScore };
    } catch (err) {
      logger.error('Failed to finalize order payment', { orderId: order.id, paymentIntentId, err });
      throw err;
    }
  }
}
