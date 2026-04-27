/**
 * [LAYER: CORE]
 */
import type {
  IOrderRepository,
  IProductRepository,
  ICartRepository,
  IPaymentProcessor,
  ILockProvider,
  ICheckoutGateway,
} from '@domain/repositories';
import type {
  AdminDashboardSummary,
  AnalyticsData,
  CustomerSummary,
  Order,
  OrderStatus,
  Address,
  User,
} from '@domain/models';
import { AuditService } from './AuditService';
import {
  assertValidOrderItems,
  assertValidOrderStatusTransition,
  assertValidShippingAddress,
  calculateCartTotal,
  canPlaceOrder,
} from '@domain/rules';
import { coalesceCartStockDeductions } from '@domain/rules';
import {
  CartEmptyError,
  CheckoutReconciliationError,
  CheckoutInProgressError,
  InsufficientStockError,
  OrderNotFoundError,
  PaymentFailedError,
  ProductNotFoundError,
} from '@domain/errors';
import { logger } from '@utils/logger';

class InMemoryLockProvider implements ILockProvider {
  private locks = new Set<string>();

  async acquireLock(resourceId: string, owner: string, ttlMs?: number): Promise<boolean> {
    void owner;
    void ttlMs;
    if (this.locks.has(resourceId)) return false;
    this.locks.add(resourceId);
    return true;
  }

  async releaseLock(resourceId: string, owner: string): Promise<void> {
    void owner;
    this.locks.delete(resourceId);
  }
}

export class OrderService {
  constructor(
    private orderRepo: IOrderRepository,
    private productRepo: IProductRepository,
    private cartRepo: ICartRepository,
    private payment: IPaymentProcessor,
    private audit: AuditService,
    private locker: ILockProvider = new InMemoryLockProvider(),
    private checkoutGateway?: ICheckoutGateway
  ) {}

  async finalizeTrustedCheckout(
    userId: string,
    shippingAddress: Address,
    paymentMethodId: string,
    idempotencyKey?: string
  ): Promise<Order> {
    assertValidShippingAddress(shippingAddress);
    if (!paymentMethodId.trim()) {
      throw new PaymentFailedError('Payment method is required to finalize checkout.');
    }

    const trustedIdempotencyKey = idempotencyKey?.trim() || `trusted-checkout:${userId}:${crypto.randomUUID()}`;
    if (this.checkoutGateway) {
      return this.checkoutGateway.finalizeCheckout({
        userId,
        shippingAddress,
        paymentMethodId,
        idempotencyKey: trustedIdempotencyKey,
      });
    }

    throw new PaymentFailedError(
      'Checkout finalization requires a trusted backend endpoint. Browser-side payment capture is disabled for production safety.'
    );
  }

  async placeOrder(
    userId: string,
    shippingAddress: Address,
    paymentMethodId?: string,
    idempotencyKey?: string
  ): Promise<Order> {
    if (this.checkoutGateway && paymentMethodId) {
      return this.finalizeTrustedCheckout(userId, shippingAddress, paymentMethodId, idempotencyKey);
    }

    assertValidShippingAddress(shippingAddress);
    const lockId = `checkout_${userId}`;
    const checkoutAttemptId = crypto.randomUUID();
    const checkoutIdempotencyKey = idempotencyKey?.trim() || `checkout:${userId}:${checkoutAttemptId}`;
    const acquired = await this.locker.acquireLock(lockId, userId, 30000); // 30 second lock
    if (!acquired) {
      throw new CheckoutInProgressError();
    }

    try {
      const cart = await this.cartRepo.getByUserId(userId);
      if (!cart || cart.items.length === 0) {
        throw new CartEmptyError();
      }

      assertValidOrderItems(cart.items);

      // Build stock map and verify availability
      const stockMap = new Map<string, number>();
      for (const item of cart.items) {
        const product = await this.productRepo.getById(item.productId);
        if (!product) throw new ProductNotFoundError(item.productId);
        stockMap.set(item.productId, product.stock);
      }

      if (!canPlaceOrder(cart.items, stockMap)) {
        throw new InsufficientStockError('multiple', 0, 0);
      }

      // BroccoliQ Level 6: Builder's Punch (Coalescing)
      const stockDeductions = coalesceCartStockDeductions(cart.items);

      if (this.productRepo.batchUpdateStock) {
        await this.productRepo.batchUpdateStock(stockDeductions);
      } else {
        // Deduct stock iteratively (fallback)
        for (const update of stockDeductions) {
          await this.productRepo.updateStock(update.id, update.delta);
        }
      }

      const total = calculateCartTotal(cart.items);

      // Process payment (External boundary)
      const paymentResult = await this.payment.processPayment({
        amount: total,
        orderId: checkoutAttemptId,
        paymentMethodId,
        idempotencyKey: checkoutIdempotencyKey,
      });

      if (!paymentResult.success || !paymentResult.transactionId) {
        // BroccoliDB Agent Shadow: Rollback the unit of work (Compensating Transaction)
        if (this.productRepo.batchUpdateStock) {
          await this.productRepo.batchUpdateStock(
            stockDeductions.map((update) => ({ id: update.id, delta: -update.delta }))
          );
        } else {
          for (const update of stockDeductions) {
            await this.productRepo.updateStock(update.id, -update.delta);
          }
        }
        throw new PaymentFailedError();
      }

      // Agent Shadow: Commit phase (Atomic Flush equivalent)
      // Create order only after successful payment
      try {
        const order = await this.orderRepo.create({
          userId,
          items: cart.items.map((item) => ({
            productId: item.productId,
            name: item.name,
            quantity: item.quantity,
            unitPrice: item.priceSnapshot,
          })),
          total,
          status: 'confirmed', // Created directly as confirmed
          shippingAddress,
          paymentTransactionId: paymentResult.transactionId,
          notes: [],
          riskScore: 0, // Assigned by repository logic
        });

        // Clear cart
        await this.cartRepo.clear(userId);

        return order;
      } catch (err) {
        // [AUDIT] CRITICAL: Payment succeeded but DB record failed.
        // We must log this to a persistent store that is unlikely to fail, or at least log to console.
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        await this.audit.record({
          userId,
          userEmail: 'system-reconciliation@playmore.tcg',
          action: 'checkout_reconciliation_required',
          targetId: paymentResult.transactionId || 'unknown',
          details: {
            error: errorMessage,
            userId,
            total,
            items: cart.items.length,
          }
        }).catch(auditErr => {
          logger.error('CRITICAL: Failed to even record reconciliation audit!', auditErr);
        });

        throw new CheckoutReconciliationError(
          `Payment ${paymentResult.transactionId} succeeded, but checkout finalization failed: ${errorMessage}. Please contact support with your transaction ID.`
        );
      }
    } finally {
      await this.locker.releaseLock(lockId, userId);
    }
  }

  async getOrders(userId: string): Promise<Order[]> {
    return this.orderRepo.getByUserId(userId);
  }

  async getOrder(id: string): Promise<Order | null> {
    return this.orderRepo.getById(id);
  }

  async getAllOrders(options?: {
    status?: OrderStatus;
    query?: string;
    limit?: number;
    cursor?: string;
  }): Promise<{ orders: Order[]; nextCursor?: string }> {
    return this.orderRepo.getAll(options);
  }


  async getAdminDashboardSummary(): Promise<AdminDashboardSummary> {
    const [orderStats, productStats, { orders: latestOrders }, lowStockProducts] = await Promise.all([
      this.orderRepo.getDashboardStats(),
      this.productRepo.getStats(),
      this.orderRepo.getAll({ limit: 10 }),
      this.productRepo.getLowStockProducts(8),
    ]);

    const fulfillmentCounts: AdminDashboardSummary['fulfillmentCounts'] = {
      to_review: orderStats.orderCountsByStatus.pending,
      ready_to_ship: orderStats.orderCountsByStatus.confirmed,
      in_transit: orderStats.orderCountsByStatus.shipped,
      completed: orderStats.orderCountsByStatus.delivered,
      cancelled: orderStats.orderCountsByStatus.cancelled,
    };

    const attentionItems: AdminDashboardSummary['attentionItems'] = [
      ...(fulfillmentCounts.to_review > 0
        ? [
            {
              id: 'orders-to-review',
              label: `${fulfillmentCounts.to_review} orders need review`,
              description: 'Confirm paid orders so staff know what to prepare next.',
              href: '/admin/orders',
              priority: 'high' as const,
            },
          ]
        : []),
      ...(fulfillmentCounts.ready_to_ship > 0
        ? [
            {
              id: 'orders-ready-to-ship',
              label: `${fulfillmentCounts.ready_to_ship} orders ready to ship`,
              description: 'Pack these orders and advance them to shipped.',
              href: '/admin/orders',
              priority: 'high' as const,
            },
          ]
        : []),
      ...(productStats.healthCounts.out_of_stock > 0 || productStats.healthCounts.low_stock > 0
        ? [
            {
              id: 'inventory-low-stock',
              label: `${productStats.healthCounts.out_of_stock + productStats.healthCounts.low_stock} products need stock attention`,
              description: 'Review products that are unavailable or close to selling out.',
              href: '/admin/inventory',
              priority: productStats.healthCounts.out_of_stock > 0 ? ('high' as const) : ('medium' as const),
            },
          ]
        : []),
    ];

    const totalOrders = Object.values(orderStats.orderCountsByStatus).reduce((a, b) => a + b, 0);

    return {
      productCount: productStats.totalProducts,
      lowStockCount: productStats.healthCounts.low_stock,
      outOfStockCount: productStats.healthCounts.out_of_stock,
      totalRevenue: orderStats.totalRevenue,
      averageOrderValue: totalOrders > 0 ? orderStats.totalRevenue / totalOrders : 0,
      dailyRevenue: orderStats.dailyRevenue,
      orderCountsByStatus: orderStats.orderCountsByStatus,
      fulfillmentCounts,
      recentOrders: latestOrders,
      lowStockProducts,
      attentionItems,
    };
  }

  async updateOrderStatus(id: string, status: OrderStatus, actor: { id: string, email: string }): Promise<void> {
    const order = await this.orderRepo.getById(id);
    if (!order) throw new OrderNotFoundError(id);
    assertValidOrderStatusTransition(order.status, status);

    // BroccoliQ Level 7: Inventory Restocking Logic
    // Status update happens first — if it fails, no stock has changed yet (H-3 fix)
    await this.orderRepo.updateStatus(id, status);
    await this.audit.record({
      userId: actor.id,
      userEmail: actor.email,
      action: 'order_status_changed',
      targetId: id,
      details: { from: order.status, to: status }
    });

    if (status === 'cancelled' && order.status !== 'cancelled') {
      const restockingUpdates = order.items.map(item => ({
        id: item.productId,
        delta: item.quantity
      }));
      try {
        if (this.productRepo.batchUpdateStock) {
          await this.productRepo.batchUpdateStock(restockingUpdates);
        } else {
          await Promise.all(restockingUpdates.map(u => this.productRepo.updateStock(u.id, u.delta)));
        }
        await this.audit.record({
          userId: actor.id,
          userEmail: actor.email,
          action: 'order_status_changed',
          targetId: id,
          details: { note: 'Inventory restocked automatically', items: restockingUpdates.length }
        });
      } catch (err) {
        logger.error(`Critical Failure: Could not restock inventory for cancelled order ${id}`, err);
      }
    }
  }

  async batchUpdateOrderStatus(ids: string[], status: OrderStatus, actor: { id: string, email: string }): Promise<void> {
    const orders = await Promise.all(ids.map((id) => this.orderRepo.getById(id)));
    for (const order of orders) {
      if (order) assertValidOrderStatusTransition(order.status, status);
    }

    if (status === 'cancelled') {
      const restockingUpdates: { id: string, delta: number }[] = [];
      for (const order of orders) {
        if (order && order.status !== 'cancelled') {
          order.items.forEach(item => {
            restockingUpdates.push({ id: item.productId, delta: item.quantity });
          });
        }
      }

      if (restockingUpdates.length > 0) {
        try {
          if (this.productRepo.batchUpdateStock) {
            await this.productRepo.batchUpdateStock(restockingUpdates);
          } else {
            await Promise.all(restockingUpdates.map(u => this.productRepo.updateStock(u.id, u.delta)));
          }
        } catch (err) {
          logger.error('Failed to restock inventory in batch cancellation', err);
        }
      }
    }

    if (this.orderRepo.batchUpdateStatus) {
      await this.orderRepo.batchUpdateStatus(ids, status);
    } else {
      await Promise.all(ids.map((id) => this.orderRepo.updateStatus(id, status)));
    }

    await Promise.all(ids.map(id => 
      this.audit.record({
        userId: actor.id,
        userEmail: actor.email,
        action: 'order_status_changed',
        targetId: id,
        details: { to: status, batch: true }
      })
    ));
  }

  async getCustomerSummaries(users: User[]): Promise<CustomerSummary[]> {
    const summaries = await Promise.all(
      users.map(async (user) => {
        try {
          const orders = await this.orderRepo.getByUserId(user.id);
        const spent = orders
          .filter((o) => o.status !== 'cancelled')
          .reduce((sum, o) => sum + o.total, 0);
        const lastOrder = orders.length > 0 
          ? new Date(Math.max(...orders.map(o => o.createdAt.getTime())))
          : null;
        
        const joinedTime = user.createdAt.getTime();

        let segment: CustomerSummary['segment'] = 'new';
        if (spent > 100000) segment = 'big_spender';
        else if (orders.length > 5) segment = 'active';
        else if (orders.length === 0 && (Date.now() - joinedTime) > 30 * 24 * 60 * 60 * 1000) segment = 'inactive';

          return {
            id: user.id,
            name: user.displayName || user.email.split('@')[0],
            email: user.email,
            orders: orders.length,
            spent,
            lastOrder,
            joined: user.createdAt,
            segment
          };
        } catch (err) {
          logger.error(`Failed to summarize customer ${user.email}:`, err);
          throw err;
        }

      })
    );

    return summaries.sort((a, b) => b.spent - a.spent);
  }
  async getAnalyticsData(): Promise<AnalyticsData> {
    const [orderStats, topProducts] = await Promise.all([
      this.orderRepo.getDashboardStats(),
      this.orderRepo.getTopProducts(10),
    ]);

    const yesterdayRevenue = orderStats.dailyRevenue[5] || 0;
    const todayRevenue = orderStats.dailyRevenue[6] || 0;
    const revenueGrowth = yesterdayRevenue > 0 
      ? Math.round(((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100)
      : 0;

    const cancelledCount = orderStats.orderCountsByStatus['cancelled'] || 0;
    const completedOrders = Object.values(orderStats.orderCountsByStatus).reduce((a, b) => a + b, 0) - cancelledCount;
    const averageOrderValue = completedOrders > 0 ? Math.round(orderStats.totalRevenue / completedOrders) : 0;

    return {
      totalRevenue: orderStats.totalRevenue,
      dailyRevenue: orderStats.dailyRevenue,
      revenueGrowth,
      averageOrderValue,
      topProducts: topProducts.map(p => ({
        name: p.name,
        revenue: p.revenue,
        sales: p.sales,
        // Hardened Analysis: Growth calculated via relative sales velocity vs global average
        growth: Math.round((p.sales / (orderStats.totalRevenue / 100)) * 100)
      }))
    };
  }

  async addOrderNote(
    orderId: string,
    text: string,
    actor: { id: string, email: string }
  ): Promise<import('@domain/models').OrderNote> {
    const order = await this.orderRepo.getById(orderId);
    if (!order) throw new OrderNotFoundError(orderId);

    const note: import('@domain/models').OrderNote = {
      id: crypto.randomUUID(),
      authorId: actor.id,
      authorEmail: actor.email,
      text,
      createdAt: new Date(),
    };

    await this.orderRepo.updateNotes(orderId, [...order.notes, note]);

    await this.audit.record({
      userId: actor.id,
      userEmail: actor.email,
      action: 'order_status_changed',
      targetId: orderId,
      details: { type: 'internal_note', noteId: note.id }
    });

    return note;
  }

  async updateOrderFulfillment(
    orderId: string,
    data: { trackingNumber?: string; shippingCarrier?: string },
    actor: { id: string, email: string }
  ): Promise<void> {
    const order = await this.orderRepo.getById(orderId);
    if (!order) throw new OrderNotFoundError(orderId);

    await this.orderRepo.updateFulfillment(orderId, data);

    await this.audit.record({
      userId: actor.id,
      userEmail: actor.email,
      action: 'order_status_changed',
      targetId: orderId,
      details: {
        type: 'fulfillment_update',
        tracking: data.trackingNumber,
        carrier: data.shippingCarrier
      }
    });
  }
}



