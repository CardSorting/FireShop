import * as crypto from 'node:crypto';
import type { 
  IOrderRepository, 
  IProductRepository, 
  ICartRepository, 
  IDiscountRepository, 
  IPaymentProcessor, 
  ILockProvider, 
  ICheckoutGateway,
  IShippingRepository,
} from '@domain/repositories';
import { 
  FirestoreDigitalAccessRepository 
} from '@infrastructure/repositories/firestore/FirestoreDigitalAccessRepository';
import { 
  Order, 
  Address, 
  OrderItem, 
  OrderStatus, 
  Fulfillment, 
  OrderFulfillmentEvent, 
  OrderFulfillmentEventType,
  AdminDashboardSummary,
  AnalyticsData,
  CustomerSummary,
  User,
  OrderNote
} from '@domain/models';
import { 
  OrderNotFoundError, 
  ProductNotFoundError, 
  CartEmptyError,
  PaymentFailedError,
  CheckoutInProgressError
} from '@domain/errors';
import { 
  assertValidShippingAddress, 
  assertValidOrderItems, 
  calculateCartTotal, 
  calculateShipping, 
  calculateTax,
  deriveEstimatedDeliveryDate,
  deriveTrackingUrl,
  assertValidOrderStatusTransition,
  formatCents
} from '@domain/rules';
import { AuditService } from './AuditService';
import { DiscountService } from './DiscountService';
import { logger } from '@utils/logger';
import { Sanitizer } from '@utils/sanitizer';

/**
 * [LAYER: CORE]
 * 
 * Singular-Warehouse Optimized OrderService.
 * Flattened for maximum throughput, eliminating logistics-routing overhead.
 * Favors automated state progression and 'one-click' administrative actions.
 */
export class OrderService {
  constructor(
    private orderRepo: IOrderRepository,
    private productRepo: IProductRepository,
    private cartRepo: ICartRepository,
    private discountRepo: IDiscountRepository,
    private payment: IPaymentProcessor,
    private audit: AuditService,
    private locker: ILockProvider,
    private checkoutGateway?: ICheckoutGateway,
    private shippingRepo?: IShippingRepository,
    private accessRepo: FirestoreDigitalAccessRepository = new FirestoreDigitalAccessRepository()
  ) {}

  // ────────────────────────────────────────────────────────────────────────────
  // CHECKOUT & PAYMENT (AUTOMATED)
  // ────────────────────────────────────────────────────────────────────────────

  async initiateCheckout(
    userId: string,
    shippingAddress: Address,
    discountCode?: string,
    idempotencyKey?: string,
    paymentIntentId?: string,
    fulfillmentMethod: 'shipping' | 'pickup' | 'delivery' = 'shipping'
  ): Promise<Order> {
    assertValidShippingAddress(shippingAddress);
    const lockId = `checkout_lock:${userId}`;
    const checkoutAttemptId = crypto.randomUUID();
    const checkoutIdempotencyKey = idempotencyKey?.trim() || `checkout_init:${userId}:${checkoutAttemptId}`;

    const existingOrder = await this.orderRepo.getByIdempotencyKey(checkoutIdempotencyKey);
    if (existingOrder) return existingOrder;

    const acquired = await this.locker.acquireLock(lockId, userId, 45000);
    if (!acquired) throw new CheckoutInProgressError();

    try {
      const cart = await this.cartRepo.getByUserId(userId);
      if (!cart || cart.items.length === 0) throw new CartEmptyError();
      assertValidOrderItems(cart.items);

      let discountAmount = 0;
      let validDiscountCode: string | undefined;
      let isFreeShipping = false;

      if (discountCode) {
        const subtotal = calculateCartTotal(cart.items);
        const validation = await new DiscountService(this.discountRepo, this.audit, this.orderRepo).validateDiscount(discountCode, subtotal, userId);
        if (validation.valid) {
          discountAmount = validation.discountAmount || 0;
          validDiscountCode = validation.discount?.code;
          isFreeShipping = !!validation.isFreeShipping;
        }
      }

      const verifiedItems: OrderItem[] = [];
      const stockDeductions: { id: string; variantId?: string; delta: number }[] = [];

      for (const item of cart.items) {
        const product = await this.productRepo.getById(item.productId);
        if (!product) throw new ProductNotFoundError(item.productId);

        let price = product.price;
        let variantTitle = undefined;
        let imageUrl = product.imageUrl;

        if (item.variantId) {
          const variant = product.variants?.find(v => v.id === item.variantId);
          if (!variant) throw new Error(`Variant ${item.variantId} not found`);
          price = variant.price;
          variantTitle = variant.title;
          if (variant.imageUrl) imageUrl = variant.imageUrl;
          stockDeductions.push({ id: item.productId, variantId: item.variantId, delta: item.quantity });
        } else {
          stockDeductions.push({ id: item.productId, delta: item.quantity });
        }

        verifiedItems.push({
          productId: item.productId,
          variantId: item.variantId,
          variantTitle,
          productHandle: product.handle,
          name: product.name,
          quantity: item.quantity,
          unitPrice: price,
          imageUrl,
          digitalAssets: product.digitalAssets,
          isDigital: product.isDigital,
          shippingClassId: product.shippingClassId,
          fulfilledQty: 0,
          hsCode: (item.variantId ? product.variants?.find(v => v.id === item.variantId)?.hsCode : undefined) || product.hsCode,
        });
      }

      for (const update of stockDeductions) {
        if (update.variantId) await this.productRepo.updateVariantStock(update.variantId, update.delta);
        else await this.productRepo.updateStock(update.id, update.delta);
      }

      const subtotal = verifiedItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
      let shipping = (subtotal >= 10000 || isFreeShipping || fulfillmentMethod === 'pickup') ? 0 : 599;

      const taxAmount = calculateTax({ subtotal, shipping, discount: discountAmount, address: shippingAddress });
      const total = Math.max(0, subtotal + shipping + taxAmount - discountAmount);

      const order = await this.orderRepo.create({
        userId,
        items: verifiedItems,
        total,
        status: 'pending',
        shippingAddress,
        paymentTransactionId: paymentIntentId || null,
        idempotencyKey: checkoutIdempotencyKey,
        discountCode: validDiscountCode,
        discountAmount,
        shippingAmount: shipping,
        taxAmount,
        fulfillmentLocationId: 'primary',
        fulfillmentMethod,
        fulfillments: [],
        notes: [{
          id: crypto.randomUUID(),
          authorId: 'system',
          authorEmail: 'system@dreambees.art',
          text: 'Order received. Singular Warehouse routing active.',
          createdAt: new Date(),
        }],
        riskScore: 0,
        estimatedDeliveryDate: deriveEstimatedDeliveryDate({ createdAt: new Date(), status: 'pending' } as any),
        fulfillmentEvents: [{
           id: crypto.randomUUID(),
           type: 'order_placed',
           label: 'Order Placed',
           description: 'Your order has been received.',
           at: new Date()
        }],
      });

      return order;
    } finally {
      await this.locker.releaseLock(lockId, userId);
    }
  }

  async finalizeOrderPayment(paymentIntentId: string, stripePi?: any): Promise<Order> {
    const order = await this.orderRepo.getByPaymentTransactionId(paymentIntentId);
    if (!order) throw new Error(`Order not found for payment intent ${paymentIntentId}`);
    if (order.status !== 'pending') return order;

    const riskScore = stripePi?.charges?.data?.[0]?.outcome?.risk_score || 0;
    
    // AUTO-ADVANCE: Move straight to the actionable fulfillment state for the admin
    let nextStatus: OrderStatus = 'confirmed';
    if (riskScore < 75) {
       const allDigital = order.items.every(i => i.isDigital);
       if (allDigital) {
          nextStatus = 'delivered'; // Instant fulfillment for digital assets
       } else if (order.fulfillmentMethod === 'shipping') {
          nextStatus = 'processing';
       } else if (order.fulfillmentMethod === 'pickup') {
          nextStatus = 'ready_for_pickup';
       } else if (order.fulfillmentMethod === 'delivery') {
          nextStatus = 'delivery_started';
       }
    }

    await this.orderRepo.updateStatus(order.id, nextStatus);
    
    if (nextStatus === 'delivered' && order.items.every(i => i.isDigital)) {
       await this.recordFulfillmentEvent(order.id, 'delivered', 'Digital Delivery Complete', 'Your digital assets are now accessible in your account.');
    } else {
       await this.recordFulfillmentEvent(order.id, nextStatus === 'processing' ? 'processing' : 'payment_confirmed', 'Payment Confirmed', 'Your payment was successful.');
    }
    
    await this.cartRepo.clear(order.userId);
    await this.orderRepo.updateRiskScore(order.id, riskScore);

    return { ...order, status: nextStatus };
  }

  async reconcilePaymentIntent(paymentIntentId: string): Promise<Order> {
    const order = await this.orderRepo.getByPaymentTransactionId(paymentIntentId);
    if (!order || order.status !== 'pending') return order as any;
    
    const stripeService = new (await import('@infrastructure/services/StripeService')).StripeService();
    const pi = await stripeService.getPaymentIntent(paymentIntentId);
    if (pi.status === 'succeeded') return this.finalizeOrderPayment(paymentIntentId, pi);
    return order;
  }

  // ────────────────────────────────────────────────────────────────────────────
  // FULFILLMENT OPS (FRICTIONLESS)
  // ────────────────────────────────────────────────────────────────────────────

  /**
   * Universal 'Easy Button' for admins.
   * Auto-detects carrier, fulfills items, or advances pickup/delivery states.
   */
  async advanceFulfillment(orderId: string, trackingNumber?: string, actor?: { id: string, email: string }): Promise<void> {
    const order = await this.orderRepo.getById(orderId);
    if (!order) throw new OrderNotFoundError(orderId);

    const userActor = actor || { id: 'admin', email: 'admin@dreambees.art' };

    // Case 1: Shipping Order with tracking provided
    if (order.fulfillmentMethod === 'shipping' && trackingNumber) {
       // Auto-detect carrier
       let carrier = 'Other';
       if (/^1Z[A-Z0-9]{16}$/i.test(trackingNumber)) carrier = 'UPS';
       else if (/^[0-9]{12,15}$/.test(trackingNumber)) carrier = 'FedEx';
       else if (/^[0-9]{20,22}$/.test(trackingNumber)) carrier = 'USPS';

       const itemsToFulfill = order.items
         .filter(i => i.quantity > i.fulfilledQty)
         .map(i => ({ productId: i.productId, variantId: i.variantId, quantity: i.quantity - i.fulfilledQty }));

       if (itemsToFulfill.length > 0) {
          await this.createFulfillment({
             orderId,
             items: itemsToFulfill,
             trackingNumber,
             shippingCarrier: carrier,
             actor: userActor
          });
       }
       return;
    }

    // Case 2: State-based advancement (Pickup/Delivery)
    const nextStates: Partial<Record<OrderStatus, OrderStatus>> = {
       confirmed: order.fulfillmentMethod === 'pickup' ? 'ready_for_pickup' : (order.fulfillmentMethod === 'delivery' ? 'delivery_started' : 'processing'),
       processing: 'shipped',
       ready_for_pickup: 'delivered',
       delivery_started: 'delivered'
    };

    const next = nextStates[order.status];
    if (next) {
       await this.updateOrderStatus(orderId, next, userActor);
       const labels: any = { ready_for_pickup: 'Ready for Pickup', delivery_started: 'Out for Delivery', delivered: 'Delivered' };
       if (labels[next]) await this.recordFulfillmentEvent(orderId, next as any, labels[next], `Your order has been moved to ${next}.`);
    }
  }

  /**
   * Generates a high-fidelity packing slip for warehouse staff.
   */
  async generatePackingSlip(orderId: string): Promise<{
    orderId: string;
    customer: { name: string; email: string };
    shipping: Address;
    items: Array<{ name: string; variant?: string; quantity: number; sku?: string; location: string }>;
    summary: string;
  }> {
    const order = await this.orderRepo.getById(orderId);
    if (!order) throw new OrderNotFoundError(orderId);

    return {
      orderId: order.id,
      customer: { name: order.shippingAddress.street, email: order.userId }, // Simplified for refactor
      shipping: order.shippingAddress,
      items: order.items.map(item => ({
        name: item.name,
        variant: item.variantTitle,
        quantity: item.quantity,
        sku: item.productId, // Simulated
        location: 'A1-Z1' // Simulated singular warehouse location
      })),
      summary: `${order.items.length} items to pick. Fulfillment Method: ${order.fulfillmentMethod}`
    };
  }

  async createFulfillment(params: {
    orderId: string;
    items: Array<{ productId: string; variantId?: string; quantity: number }>;
    trackingNumber: string;
    shippingCarrier: string;
    actor: { id: string, email: string };
  }): Promise<Fulfillment> {
    const order = await this.orderRepo.getById(params.orderId);
    if (!order) throw new OrderNotFoundError(params.orderId);

    const updatedOrderItems = order.items.map(item => {
      const fItem = params.items.find(fi => fi.productId === item.productId && fi.variantId === item.variantId);
      return fItem ? { ...item, fulfilledQty: item.fulfilledQty + fItem.quantity } : item;
    });

    const fulfillment: Fulfillment = {
      id: crypto.randomUUID(),
      orderId: params.orderId,
      items: params.items,
      trackingNumber: params.trackingNumber,
      trackingCarrier: params.shippingCarrier,
      trackingUrl: deriveTrackingUrl({ trackingNumber: params.trackingNumber, shippingCarrier: params.shippingCarrier } as any),
      status: 'shipped',
      shippedAt: new Date(),
      deliveredAt: null,
      createdAt: new Date(),
    };

    const allFulfilled = updatedOrderItems.every(i => i.fulfilledQty >= i.quantity);
    const newStatus: OrderStatus = allFulfilled ? 'shipped' : order.status;

    await this.orderRepo.save({ ...order, items: updatedOrderItems, status: newStatus, fulfillments: [...(order.fulfillments || []), fulfillment], updatedAt: new Date() });
    await this.recordFulfillmentEvent(params.orderId, 'in_transit', 'Items Shipped', `Shipped via ${params.shippingCarrier}. Track: ${params.trackingNumber}`);
    
    return fulfillment;
  }

  async recordFulfillmentEvent(orderId: string, type: OrderFulfillmentEventType, label: string, description: string): Promise<void> {
    const order = await this.orderRepo.getById(orderId);
    if (!order) return;
    const event: OrderFulfillmentEvent = { id: crypto.randomUUID(), type, label, description, at: new Date() };
    await this.orderRepo.save({ ...order, fulfillmentEvents: [...(order.fulfillmentEvents || []), event], updatedAt: new Date() });
  }

  // ────────────────────────────────────────────────────────────────────────────
  // MANAGEMENT & AUDIT
  // ────────────────────────────────────────────────────────────────────────────

  async getAdminDashboardSummary(): Promise<AdminDashboardSummary> {
    const stats = await this.orderRepo.getDashboardStats();
    const { orders: recent } = await this.orderRepo.getAll({ limit: 10 });
    return {
      productCount: 0, lowStockCount: 0, outOfStockCount: 0,
      totalRevenue: stats.totalRevenue,
      averageOrderValue: stats.totalRevenue / 100,
      dailyRevenue: stats.dailyRevenue,
      orderCountsByStatus: stats.orderCountsByStatus,
      fulfillmentCounts: {
         to_review: stats.orderCountsByStatus.pending,
         ready_to_ship: stats.orderCountsByStatus.confirmed + (stats.orderCountsByStatus.processing || 0),
         in_transit: stats.orderCountsByStatus.shipped + (stats.orderCountsByStatus.delivery_started || 0),
         completed: stats.orderCountsByStatus.delivered,
         cancelled: stats.orderCountsByStatus.cancelled,
      },
      recentOrders: recent,
      lowStockProducts: [], attentionItems: []
    };
  }

  async updateOrderStatus(id: string, status: OrderStatus, actor: { id: string, email: string }): Promise<void> {
    const order = await this.orderRepo.getById(id);
    if (!order) throw new OrderNotFoundError(id);
    assertValidOrderStatusTransition(order.status, status);
    await this.orderRepo.updateStatus(id, status);
    if (status === 'cancelled') {
       for (const item of order.items) {
          if (item.variantId) await this.productRepo.updateVariantStock(item.variantId, item.quantity);
          else await this.productRepo.updateStock(item.productId, item.quantity);
       }
    }
  }

  async addOrderNote(orderId: string, text: string, actor: { id: string, email: string }): Promise<OrderNote> {
    const order = await this.orderRepo.getById(orderId);
    if (!order) throw new OrderNotFoundError(orderId);
    const note: OrderNote = { id: crypto.randomUUID(), authorId: actor.id, authorEmail: actor.email, text, createdAt: new Date() };
    await this.orderRepo.updateNotes(orderId, [...order.notes, note]);
    return note;
  }

  async getOrder(id: string): Promise<Order | null> {
    const order = await this.orderRepo.getById(id);
    return order ? Sanitizer.order(order) : null;
  }

  async getOrders(userId: string, options?: any): Promise<Order[]> {
    const { orders } = await this.orderRepo.getByUserId(userId, options);
    return orders.map(o => Sanitizer.order(o));
  }

  async getAllOrders(options?: any): Promise<{ orders: Order[]; nextCursor?: string }> {
    return this.orderRepo.getAll(options);
  }

  async refundOrder(params: { orderId: string; amount: number; reason: string; restock: boolean; actor: any }): Promise<void> {
    const order = await this.orderRepo.getById(params.orderId);
    if (!order || !order.paymentTransactionId) throw new Error('Invalid order for refund');
    const result = await this.payment.refundPayment(order.paymentTransactionId, params.amount);
    if (result.success) {
       await this.orderRepo.updateStatus(order.id, params.amount < order.total ? 'partially_refunded' : 'refunded');
       if (params.restock) {
          for (const item of order.items) {
             if (item.variantId) await this.productRepo.updateVariantStock(item.variantId, item.quantity);
             else await this.productRepo.updateStock(item.productId, item.quantity);
          }
       }
       await this.addOrderNote(order.id, `REFUND: ${formatCents(params.amount)}. Reason: ${params.reason}`, params.actor);
    }
  }

  async getDigitalAssets(userId: string) {
     const { orders } = await this.orderRepo.getByUserId(userId, { limit: 100 });
     return orders.filter(o => o.status !== 'cancelled').flatMap(o => o.items.filter(i => i.digitalAssets?.length).map(i => ({ orderId: o.id, orderDate: o.createdAt, productName: i.name, productId: i.productId, productImageUrl: i.imageUrl || '', assets: i.digitalAssets })));
  }

  /**
   * Optimized fulfillment queue for warehouse management.
   */
  async getFulfillmentQueue(): Promise<{
    shipping: Order[];
    pickup: Order[];
    localDelivery: Order[];
  }> {
    const { orders } = await this.orderRepo.getAll({ limit: 100 });
    return {
      shipping: orders.filter(o => o.fulfillmentMethod === 'shipping' && (o.status === 'processing' || o.status === 'confirmed')),
      pickup: orders.filter(o => o.fulfillmentMethod === 'pickup' && o.status === 'confirmed'),
      localDelivery: orders.filter(o => o.fulfillmentMethod === 'delivery' && o.status === 'confirmed'),
    };
  }
}
