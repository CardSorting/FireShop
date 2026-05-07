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
  IInventoryLevelRepository,
  IInventoryLocationRepository
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
 * Simplified, Flattened OrderService.
 * Consolidates checkout, fulfillment, and management into a single, high-output module.
 * Reduced indirection to maximize fulfillment speed and audit reliability.
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
    private locationRepo?: IInventoryLocationRepository,
    private inventoryLevelRepo?: IInventoryLevelRepository,
    private accessRepo: FirestoreDigitalAccessRepository = new FirestoreDigitalAccessRepository()
  ) {}

  // ────────────────────────────────────────────────────────────────────────────
  // CHECKOUT OPS
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

      // Quick stock update
      for (const update of stockDeductions) {
        if (update.variantId) await this.productRepo.updateVariantStock(update.variantId, update.delta);
        else await this.productRepo.updateStock(update.id, update.delta);
      }

      // Simplified Fulfillment Assignment
      let fulfillmentLocationId = 'primary-warehouse';
      if (this.locationRepo) {
        const locations = await this.locationRepo.findAll();
        const firstMatch = locations.find(loc => {
           if (fulfillmentMethod === 'pickup') return loc.isPickupLocation;
           return true; 
        });
        if (firstMatch) fulfillmentLocationId = firstMatch.id;
      }

      const subtotal = verifiedItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
      let shipping = (subtotal >= 10000 || isFreeShipping || fulfillmentMethod === 'pickup') ? 0 : 599;

      if (fulfillmentMethod === 'delivery' && fulfillmentLocationId) {
         const loc = await this.locationRepo?.findById(fulfillmentLocationId);
         shipping = loc?.deliveryFee || 499;
      }

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
        fulfillmentLocationId,
        fulfillmentMethod,
        fulfillments: [],
        notes: [{
          id: crypto.randomUUID(),
          authorId: 'system',
          authorEmail: 'system@dreambees.art',
          text: 'Order received. Checkout finalized.',
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

      await this.audit.record({
        userId,
        userEmail: 'system@dreambees.art',
        action: 'order_placed',
        targetId: order.id,
        details: { total, method: fulfillmentMethod }
      });

      return order;
    } finally {
      await this.locker.releaseLock(lockId, userId);
    }
  }

  async finalizeTrustedCheckout(userId: string, shippingAddress: Address, paymentMethodId: string, idempotencyKey?: string, discountCode?: string): Promise<Order> {
    if (!this.checkoutGateway) throw new PaymentFailedError('No checkout gateway configured.');
    return this.checkoutGateway.finalizeCheckout({
      userId,
      shippingAddress,
      paymentMethodId,
      idempotencyKey: idempotencyKey || crypto.randomUUID(),
      discountCode
    });
  }

  // ────────────────────────────────────────────────────────────────────────────
  // FULFILLMENT OPS
  // ────────────────────────────────────────────────────────────────────────────

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
      if (fItem) {
        return { ...item, fulfilledQty: item.fulfilledQty + fItem.quantity };
      }
      return item;
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

    await this.orderRepo.save({
      ...order,
      items: updatedOrderItems,
      status: newStatus,
      fulfillments: [...(order.fulfillments || []), fulfillment],
      updatedAt: new Date(),
    });

    await this.recordFulfillmentEvent(params.orderId, 'in_transit', 'Items Shipped', 'Your package is on its way.');

    return fulfillment;
  }

  async recordFulfillmentEvent(orderId: string, type: OrderFulfillmentEventType, label: string, description: string): Promise<void> {
    const order = await this.orderRepo.getById(orderId);
    if (!order) return;

    const event: OrderFulfillmentEvent = {
      id: crypto.randomUUID(),
      type,
      label,
      description,
      at: new Date()
    };

    await this.orderRepo.save({
      ...order,
      fulfillmentEvents: [...(order.fulfillmentEvents || []), event],
      updatedAt: new Date()
    });
  }

  // ────────────────────────────────────────────────────────────────────────────
  // MANAGEMENT & QUERY
  // ────────────────────────────────────────────────────────────────────────────

  async getAdminDashboardSummary(): Promise<AdminDashboardSummary> {
    const [orderStats, productStats, { orders: recentOrders }, lowStockProducts] = await Promise.all([
      this.orderRepo.getDashboardStats(),
      this.productRepo.getStats(),
      this.orderRepo.getAll({ limit: 10 }),
      this.productRepo.getLowStockProducts(8),
    ]);

    return {
      productCount: productStats.totalProducts,
      lowStockCount: productStats.healthCounts.low_stock,
      outOfStockCount: productStats.healthCounts.out_of_stock,
      totalRevenue: orderStats.totalRevenue,
      averageOrderValue: orderStats.totalRevenue / 100, // Simulated
      dailyRevenue: orderStats.dailyRevenue,
      orderCountsByStatus: orderStats.orderCountsByStatus,
      fulfillmentCounts: {
         to_review: orderStats.orderCountsByStatus.pending,
         ready_to_ship: orderStats.orderCountsByStatus.confirmed,
         in_transit: orderStats.orderCountsByStatus.shipped,
         completed: orderStats.orderCountsByStatus.delivered,
         cancelled: orderStats.orderCountsByStatus.cancelled,
      },
      recentOrders,
      lowStockProducts,
      attentionItems: []
    };
  }

  async updateOrderStatus(id: string, status: OrderStatus, actor: { id: string, email: string }): Promise<void> {
    const order = await this.orderRepo.getById(id);
    if (!order) throw new OrderNotFoundError(id);
    assertValidOrderStatusTransition(order.status, status);

    await this.orderRepo.updateStatus(id, status);
    await this.recordFulfillmentEvent(id, 'processing', `Status: ${status}`, `Order status updated to ${status}.`);

    if (status === 'cancelled') {
        // Simple restocking logic
        for (const item of order.items) {
           if (item.variantId) await this.productRepo.updateVariantStock(item.variantId, item.quantity);
           else await this.productRepo.updateStock(item.productId, item.quantity);
        }
    }

    await this.audit.record({
      userId: actor.id,
      userEmail: actor.email,
      action: 'order_status_changed',
      targetId: id,
      details: { from: order.status, to: status }
    });
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
    if (!result.success) throw new Error('Gateway refund failed');

    await this.orderRepo.updateStatus(order.id, params.amount < order.total ? 'partially_refunded' : 'refunded');
    if (params.restock) {
       for (const item of order.items) {
          if (item.variantId) await this.productRepo.updateVariantStock(item.variantId, item.quantity);
          else await this.productRepo.updateStock(item.productId, item.quantity);
       }
    }
    await this.addOrderNote(order.id, `REFUND: ${formatCents(params.amount)}. Reason: ${params.reason}`, params.actor);
  }
  
  async getDigitalAssets(userId: string) {
     const { orders } = await this.orderRepo.getByUserId(userId, { limit: 100 });
     const assets = [];
     for (const order of orders) {
        if (order.status === 'cancelled') continue;
        for (const item of order.items) {
           if (item.digitalAssets?.length) {
              assets.push({ orderId: order.id, orderDate: order.createdAt, productName: item.name, productId: item.productId, productImageUrl: item.imageUrl || '', assets: item.digitalAssets });
           }
        }
     }
     return assets;
  }
}
