/**
 * [LAYER: CORE]
 */
import type {
  IOrderRepository,
  IProductRepository,
  ICartRepository,
  IDiscountRepository,
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
  Discount,
} from '@domain/models';
import { AuditService } from './AuditService';
import {
  assertValidOrderItems,
  assertValidOrderStatusTransition,
  assertValidShippingAddress,
  calculateCartTotal,
  canPlaceOrder,
  deriveEstimatedDeliveryDate,
  deriveOrderFulfillmentEvents,
  deriveTrackingUrl,
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
    private discountRepo: IDiscountRepository,
    private payment: IPaymentProcessor,
    private audit: AuditService,
    private locker: ILockProvider = new InMemoryLockProvider(),
    private checkoutGateway?: ICheckoutGateway
  ) { }

  async finalizeTrustedCheckout(
    userId: string,
    shippingAddress: Address,
    paymentMethodId: string,
    idempotencyKey?: string,
    discountCode?: string
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
        discountCode,
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
    idempotencyKey?: string,
    discountCode?: string
  ): Promise<Order> {
    if (this.checkoutGateway && paymentMethodId) {
      return this.finalizeTrustedCheckout(userId, shippingAddress, paymentMethodId, idempotencyKey, discountCode);
    }

    assertValidShippingAddress(shippingAddress);
    const lockId = `checkout_${userId}`;
    const checkoutAttemptId = crypto.randomUUID();
    const checkoutIdempotencyKey = idempotencyKey?.trim() || `checkout:${userId}:${checkoutAttemptId}`;

    // IDEMPOTENCY CHECK: Check if order already exists
    const existingOrder = await this.orderRepo.getByIdempotencyKey(checkoutIdempotencyKey);
    if (existingOrder) return existingOrder;

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

      // Validate Discount
      let discountAmount = 0;
      let validDiscountCode: string | undefined;
      if (discountCode) {
        const discount = await this.discountRepo.getByCode(discountCode);
        if (discount && discount.status === 'active') {
          const now = new Date();
          if (now >= discount.startsAt && (!discount.endsAt || now <= discount.endsAt)) {
            const subtotal = calculateCartTotal(cart.items);
            discountAmount = discount.type === 'percentage' 
              ? Math.floor(subtotal * (discount.value / 100))
              : discount.value;
            validDiscountCode = discount.code;
          }
        }
      }

      // Build stock and price map (Real-time Source of Truth)
      const stockMap = new Map<string, number>();
      const priceMap = new Map<string, number>();
      const nameMap = new Map<string, string>();
      const imageMap = new Map<string, string>();
      const digitalAssetsMap = new Map<string, any[]>();

      for (const item of cart.items) {
        const product = await this.productRepo.getById(item.productId);
        if (!product) throw new ProductNotFoundError(item.productId);
        stockMap.set(item.productId, product.stock);
        priceMap.set(item.productId, product.price);
        nameMap.set(item.productId, product.name);
        imageMap.set(item.productId, product.imageUrl);
        if (product.digitalAssets) {
          digitalAssetsMap.set(item.productId, product.digitalAssets);
        }
      }

      if (!canPlaceOrder(cart.items, stockMap)) {
        throw new InsufficientStockError('multiple', 0, 0);
      }

      // Deduct stock (Compensating transaction pattern)
      const stockDeductions = coalesceCartStockDeductions(cart.items);
      if (this.productRepo.batchUpdateStock) {
        await this.productRepo.batchUpdateStock(stockDeductions);
      } else {
        for (const update of stockDeductions) {
          await this.productRepo.updateStock(update.id, update.delta);
        }
      }

      // Recalculate Subtotal using verified prices
      let subtotal = 0;
      for (const item of cart.items) {
        const price = priceMap.get(item.productId) || 0;
        subtotal += price * item.quantity;
      }
      const shipping = subtotal >= 10000 ? 0 : 599;
      const total = Math.max(0, subtotal + shipping - discountAmount);

      // Process payment (External boundary)
      const paymentResult = await this.payment.processPayment({
        amount: total,
        orderId: checkoutAttemptId,
        paymentMethodId,
        idempotencyKey: checkoutIdempotencyKey,
      });

      if (!paymentResult.success || !paymentResult.transactionId) {
        // Rollback stock
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

      // Commit phase
      try {
        const order = await this.orderRepo.create({
          userId,
          items: cart.items.map((item) => ({
            productId: item.productId,
            name: nameMap.get(item.productId) || item.name,
            quantity: item.quantity,
            unitPrice: priceMap.get(item.productId) || 0,
            imageUrl: imageMap.get(item.productId) || item.imageUrl,
            digitalAssets: digitalAssetsMap.get(item.productId),
          })),
          total,
          status: 'confirmed',
          shippingAddress,
          paymentTransactionId: paymentResult.transactionId,
          idempotencyKey: checkoutIdempotencyKey,
          discountCode: validDiscountCode,
          discountAmount,
          notes: [],
          riskScore: 0,
        });

        // Clear cart and increment discount usage
        await Promise.all([
          this.cartRepo.clear(userId),
          validDiscountCode ? this.discountRepo.getByCode(validDiscountCode).then((d: Discount | null) => d && this.discountRepo.incrementUsage(d.id)) : Promise.resolve(),
          this.audit.record({
            userId,
            userEmail: 'system-checkout@playmore.tcg',
            action: 'order_placed',
            targetId: order.id,
            details: { total, items: cart.items.length, discount: validDiscountCode }
          })
        ]);

        return order;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        await this.audit.record({
          userId,
          userEmail: 'system-reconciliation@playmore.tcg',
          action: 'checkout_reconciliation_required',
          targetId: paymentResult.transactionId || 'unknown',
          details: { error: errorMessage, userId, total, items: cart.items.length, idempotencyKey: checkoutIdempotencyKey }
        }).catch(auditErr => logger.error('CRITICAL: Reconciliation audit failed', auditErr));

        throw new CheckoutReconciliationError(
          `Payment ${paymentResult.transactionId} succeeded, but DB record failed: ${errorMessage}.`
        );
      }
    } finally {
      await this.locker.releaseLock(lockId, userId);
    }
  }

  async getOrders(userId: string): Promise<Order[]> {
    const orders = await this.orderRepo.getByUserId(userId);
    return orders.map((order) => this.enrichOrderForCustomerView(order));
  }

  async getOrder(id: string): Promise<Order | null> {
    const order = await this.orderRepo.getById(id);
    return order ? this.enrichOrderForCustomerView(order) : null;
  }

  async getOrdersForCustomerView(
    userId: string,
    options?: {
      status?: OrderStatus | 'all';
      query?: string;
      from?: Date;
      to?: Date;
      sort?: 'newest' | 'oldest' | 'total_desc' | 'total_asc' | 'status';
    }
  ): Promise<Order[]> {
    const orders = (await this.orderRepo.getByUserId(userId)).map((order) => this.enrichOrderForCustomerView(order));
    const q = options?.query?.trim().toLowerCase() ?? '';

    const filtered = orders.filter((order) => {
      const matchesStatus = !options?.status || options.status === 'all' || order.status === options.status;
      const matchesQuery = !q
        || order.id.toLowerCase().includes(q)
        || order.items.some((item) => item.name.toLowerCase().includes(q));
      const createdAt = order.createdAt.getTime();
      const matchesFrom = !options?.from || createdAt >= options.from.getTime();
      const matchesTo = !options?.to || createdAt <= options.to.getTime();
      return matchesStatus && matchesQuery && matchesFrom && matchesTo;
    });

    const sort = options?.sort ?? 'newest';
    return [...filtered].sort((a, b) => {
      if (sort === 'oldest') return a.createdAt.getTime() - b.createdAt.getTime();
      if (sort === 'total_desc') return b.total - a.total;
      if (sort === 'total_asc') return a.total - b.total;
      if (sort === 'status') return a.status.localeCompare(b.status);
      return b.createdAt.getTime() - a.createdAt.getTime();
    });
  }

  private enrichOrderForCustomerView(order: Order): Order {
    return {
      ...order,
      trackingUrl: order.trackingUrl ?? deriveTrackingUrl(order),
      estimatedDeliveryDate: order.estimatedDeliveryDate ?? deriveEstimatedDeliveryDate(order),
      fulfillmentEvents: order.fulfillmentEvents ?? deriveOrderFulfillmentEvents(order),
    };
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
    const toDate = (value: Date | string): Date => value instanceof Date ? value : new Date(value);
    const summaries = await Promise.all(
      users.map(async (user) => {
        try {
          const orders = await this.orderRepo.getByUserId(user.id);
          const spent = orders
            .filter((o) => o.status !== 'cancelled')
            .reduce((sum, o) => sum + o.total, 0);
          const lastOrder = orders.length > 0
            ? new Date(Math.max(...orders.map(o => toDate(o.createdAt).getTime())))
            : null;

          const joined = toDate(user.createdAt);
          const joinedTime = joined.getTime();

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
            joined,
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



