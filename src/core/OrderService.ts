/**
 * [LAYER: CORE]
 */
import * as crypto from 'node:crypto';
import type {
  IOrderRepository,
  IProductRepository,
  ICartRepository,
  IDiscountRepository,
  IPaymentProcessor,
  ILockProvider,
  ICheckoutGateway,
  ITaxonomyRepository,
} from '@domain/repositories';
import { FirestoreDigitalAccessRepository } from '@infrastructure/repositories/firestore/FirestoreDigitalAccessRepository';
import type {
  AdminDashboardSummary,
  AnalyticsData,
  CustomerSummary,
  Order,
  OrderStatus,
  Address,
  User,
  Discount,
  CartItem,
  OrderItem
} from '@domain/models';
import { AuditService } from './AuditService';
import { Sanitizer } from '@utils/sanitizer';
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
    private checkoutGateway?: ICheckoutGateway,
    private accessRepo: FirestoreDigitalAccessRepository = new FirestoreDigitalAccessRepository()
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

  async initiateCheckout(
    userId: string,
    shippingAddress: Address,
    discountCode?: string,
    idempotencyKey?: string,
    paymentIntentId?: string
  ): Promise<Order> {
    assertValidShippingAddress(shippingAddress);
    const lockId = `checkout_lock:${userId}`;
    const checkoutIdempotencyKey = idempotencyKey?.trim() || `checkout_init:${userId}:${crypto.randomUUID()}`;

    // 1. Check for existing order by idempotency key before acquiring lock
    const existingOrder = await this.orderRepo.getByIdempotencyKey(checkoutIdempotencyKey);
    if (existingOrder) return existingOrder;

    const acquired = await this.locker.acquireLock(lockId, userId, 45000); // 45s for safety
    if (!acquired) {
      throw new CheckoutInProgressError();
    }

    try {
      {
        const cart = await this.cartRepo.getByUserId(userId);
        if (!cart || cart.items.length === 0) {
          throw new CartEmptyError();
        }

        assertValidOrderItems(cart.items);

        // Calculate discount
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
          });
        }

        // Final stock check & deduct (ATOMIC)
        if (this.productRepo.batchUpdateStock) {
          await this.productRepo.batchUpdateStock(stockDeductions);
        } else {
          for (const update of stockDeductions) {
            if (update.variantId) await this.productRepo.updateVariantStock(update.variantId, update.delta);
            else await this.productRepo.updateStock(update.id, update.delta);
          }
        }

        const subtotal = verifiedItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
        const shipping = subtotal >= 10000 ? 0 : 599;
        const total = Math.max(0, subtotal + shipping - discountAmount);

        // Commit Order to Repository
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
          notes: [{
            id: crypto.randomUUID(),
            authorId: 'system',
            authorEmail: 'system-checkout@dreambees.art',
            text: 'Checkout initiated. Awaiting payment confirmation.',
            createdAt: new Date(),
          }],
          riskScore: 0,
        });

        await this.audit.record({
          userId,
          userEmail: 'system-checkout@dreambees.art',
          action: 'order_placed',
          targetId: order.id,
          details: { 
            status: 'pending', 
            total, 
            items: verifiedItems.length,
            idempotencyKey: checkoutIdempotencyKey,
            fingerprint: crypto.createHash('sha256').update(`${userId}:${total}:${checkoutIdempotencyKey}`).digest('hex')
          }
        });

        return order;
      }
    } catch (error) {
      logger.error('Order initiation failed', { userId, error });
      throw error;
    } finally {
      await this.locker.releaseLock(lockId, userId);
    }
  }

  async finalizeOrderPayment(paymentIntentId: string, stripePi?: any): Promise<Order> {
    const order = await this.orderRepo.getByPaymentTransactionId(paymentIntentId);
    if (!order) {
      throw new Error(`Order not found for payment intent ${paymentIntentId}`);
    }

    if (order.status === 'confirmed') return order;
    
    // Safety check: If order was already cancelled (e.g. timeout), this is a reconciliation conflict
    if (order.status === 'cancelled') {
        await this.audit.record({
            userId: order.userId,
            userEmail: 'system-reconciliation@dreambees.art',
            action: 'payment_received_on_cancelled_order',
            targetId: order.id,
            details: { paymentIntentId, status: 'manual_review_required' }
        });
        throw new Error(`Payment received for already cancelled order ${order.id}. Manual review required.`);
    }

    // Extract Risk Scores if available
    const riskLevel = stripePi?.charges?.data?.[0]?.outcome?.risk_level || 'unknown';
    const riskScore = stripePi?.charges?.data?.[0]?.outcome?.risk_score || 0;

    try {
        await this.orderRepo.updateStatus(order.id, 'confirmed');
        await this.cartRepo.clear(order.userId);
        
        if (order.discountCode) {
            const discount = await this.discountRepo.getByCode(order.discountCode);
            if (discount) await this.discountRepo.incrementUsage(discount.id);
        }

        const noteId = crypto.randomUUID();
        await this.orderRepo.updateNotes(order.id, [
            ...order.notes,
            {
                id: noteId,
                authorId: 'system',
                authorEmail: 'stripe-webhook@dreambees.art',
                text: `Payment confirmed via Stripe (PI: ${paymentIntentId}). Risk: ${riskLevel} (${riskScore}).`,
                createdAt: new Date(),
            }
        ]);

        await this.audit.record({
          userId: order.userId,
          userEmail: 'system-webhook@dreambees.art',
          action: 'order_status_changed',
          targetId: order.id,
          details: { 
              from: order.status, 
              to: 'confirmed', 
              stripeId: paymentIntentId,
              risk: { level: riskLevel, score: riskScore },
              noteId
          }
        });

        // Update risk score on order if it's high
        if (riskScore > 50) {
            await this.orderRepo.updateRiskScore(order.id, riskScore);
        }

        return { ...order, status: 'confirmed' };
    } catch (error) {
        logger.error('Finalize order payment failed', { paymentIntentId, error });
        throw error;
    }
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

    const existingOrder = await this.orderRepo.getByIdempotencyKey(checkoutIdempotencyKey);
    if (existingOrder) return existingOrder;

    const acquired = await this.locker.acquireLock(lockId, userId, 30000); 
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

      // Build source of truth map (Variant Aware)
      const verifiedItems: OrderItem[] = [];
      const stockMap = new Map<string, number>();

      for (const item of cart.items) {
        const product = await this.productRepo.getById(item.productId);
        if (!product) throw new ProductNotFoundError(item.productId);

        let price = product.price;
        let stock = product.stock;
        let name = product.name;
        let imageUrl = product.imageUrl;
        let variantTitle = undefined;

        if (item.variantId) {
          const variant = product.variants?.find(v => v.id === item.variantId);
          if (!variant) throw new Error(`Variant ${item.variantId} not found for product ${item.productId}`);
          price = variant.price;
          stock = variant.stock;
          variantTitle = variant.title;
          if (variant.imageUrl) imageUrl = variant.imageUrl;
        }

        const itemKey = item.variantId || item.productId;
        stockMap.set(itemKey, stock);

        verifiedItems.push({
          productId: item.productId,
          variantId: item.variantId,
          variantTitle: variantTitle,
          productHandle: product.handle,
          name: name,
          quantity: item.quantity,
          unitPrice: price,
          imageUrl: imageUrl,
          digitalAssets: product.digitalAssets,
        });
      }

      // Final stock check
      for (const item of cart.items) {
        const itemKey = item.variantId || item.productId;
        const currentStock = stockMap.get(itemKey) ?? 0;
        if (currentStock < item.quantity) {
          throw new InsufficientStockError(itemKey, item.quantity, currentStock);
        }
      }

      // Deduct stock (Atomic Batch)
      const stockDeductions = coalesceCartStockDeductions(cart.items);
      if (this.productRepo.batchUpdateStock) {
        await this.productRepo.batchUpdateStock(stockDeductions);
      } else {
        for (const update of stockDeductions) {
          if (update.variantId) {
            await this.productRepo.updateVariantStock(update.variantId, update.delta);
          } else {
            await this.productRepo.updateStock(update.id, update.delta);
          }
        }
      }

      const subtotal = verifiedItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
      const shipping = subtotal >= 10000 ? 0 : 599;
      const total = Math.max(0, subtotal + shipping - discountAmount);

      // Process payment
      const paymentResult = await this.payment.processPayment({
        amount: total,
        orderId: checkoutAttemptId,
        paymentMethodId,
        idempotencyKey: checkoutIdempotencyKey,
      });

      if (!paymentResult.success || !paymentResult.transactionId) {
        // Rollback stock
        const rollbackUpdates = stockDeductions.map(u => ({ ...u, delta: -u.delta }));
        if (this.productRepo.batchUpdateStock) {
          await this.productRepo.batchUpdateStock(rollbackUpdates);
        } else {
          for (const update of rollbackUpdates) {
            if (update.variantId) {
              await this.productRepo.updateVariantStock(update.variantId, update.delta);
            } else {
              await this.productRepo.updateStock(update.id, update.delta);
            }
          }
        }
        throw new PaymentFailedError();
      }

      // Commit Order
      try {
        const order = await this.orderRepo.create({
          userId,
          items: verifiedItems,
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

        await Promise.all([
          this.cartRepo.clear(userId),
          validDiscountCode ? this.discountRepo.getByCode(validDiscountCode).then((d: Discount | null) => d && this.discountRepo.incrementUsage(d.id)) : Promise.resolve(),
          this.audit.record({
            userId,
            userEmail: 'system-checkout@dreambees.art',
            action: 'order_placed',
            targetId: order.id,
            details: { total, items: verifiedItems.length, discount: validDiscountCode }
          })
        ]);

        return order;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        await this.audit.record({
          userId,
          userEmail: 'system-reconciliation@dreambees.art',
          action: 'checkout_reconciliation_required',
          targetId: paymentResult.transactionId || 'unknown',
          details: { error: errorMessage, userId, total, items: verifiedItems.length, idempotencyKey: checkoutIdempotencyKey }
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
    return orders
      .map((order) => this.enrichOrderForCustomerView(order))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
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
        || order.items.some((item) => item.name.toLowerCase().includes(q) || item.variantTitle?.toLowerCase().includes(q));
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
    const enriched = {
      ...order,
      trackingUrl: order.trackingUrl ?? deriveTrackingUrl(order),
      estimatedDeliveryDate: order.estimatedDeliveryDate ?? deriveEstimatedDeliveryDate(order),
      fulfillmentEvents: order.fulfillmentEvents ?? deriveOrderFulfillmentEvents(order),
    };
    return Sanitizer.order(enriched);
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

    const totalOrders = Object.values(orderStats.orderCountsByStatus).reduce((a: number, b: number) => a + b, 0);

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
        variantId: item.variantId,
        delta: item.quantity
      }));
      try {
        if (this.productRepo.batchUpdateStock) {
          await this.productRepo.batchUpdateStock(restockingUpdates);
        } else {
          for (const u of restockingUpdates) {
            if (u.variantId) await this.productRepo.updateVariantStock(u.variantId, u.delta);
            else await this.productRepo.updateStock(u.id, u.delta);
          }
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
      const restockingUpdates: { id: string, variantId?: string, delta: number }[] = [];
      for (const order of orders) {
        if (order && order.status !== 'cancelled') {
          order.items.forEach(item => {
            restockingUpdates.push({ id: item.productId, variantId: item.variantId, delta: item.quantity });
          });
        }
      }

      if (restockingUpdates.length > 0) {
        try {
          if (this.productRepo.batchUpdateStock) {
            await this.productRepo.batchUpdateStock(restockingUpdates);
          } else {
            for (const u of restockingUpdates) {
              if (u.variantId) await this.productRepo.updateVariantStock(u.variantId, u.delta);
              else await this.productRepo.updateStock(u.id, u.delta);
            }
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

    return summaries.sort((a: any, b: any) => b.spent - a.spent);
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
    const completedOrders = Object.values(orderStats.orderCountsByStatus).reduce((a: number, b: number) => a + b, 0) - cancelledCount;
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

  async reconcilePaymentIntent(paymentIntentId: string): Promise<Order> {
    const order = await this.orderRepo.getByPaymentTransactionId(paymentIntentId);
    if (!order) throw new Error(`No order found for payment intent ${paymentIntentId}`);

    if (order.status !== 'pending') return order;

    const stripeService = new (await import('@infrastructure/services/StripeService')).StripeService();
    const pi = await stripeService.getPaymentIntent(paymentIntentId);

    if (pi.status === 'succeeded') {
      return this.finalizeOrderPayment(paymentIntentId);
    } else if (pi.status === 'canceled' || pi.status === 'requires_payment_method') {
      await this.updateOrderStatus(order.id, 'cancelled', { id: 'system', email: 'reconciliation@dreambees.art' });
      return { ...order, status: 'cancelled' };
    }

    return order;
  }

  async cleanupExpiredOrders(expirationMinutes: number = 60): Promise<number> {
    // 1. Fetch all pending orders older than expirationMinutes
    const cutoff = new Date(Date.now() - expirationMinutes * 60 * 1000);
    
    // This is a bit inefficient without a specialized repo method, but for now we'll filter
    const { orders } = await this.orderRepo.getAll({ status: 'pending', limit: 100 });
    const expired = orders.filter(o => o.createdAt < cutoff);

    if (expired.length === 0) return 0;

    logger.info(`Cleaning up ${expired.length} expired pending orders.`);

    for (const order of expired) {
      try {
        await this.updateOrderStatus(order.id, 'cancelled', { id: 'system', email: 'cleanup-service@dreambees.art' });
      } catch (err) {
        logger.error(`Failed to cleanup order ${order.id}`, err);
      }
    }

    return expired.length;
  }

  async getDigitalAssets(userId: string): Promise<Array<{
    orderId: string;
    orderDate: Date;
    productName: string;
    productId: string;
    productImageUrl: string;
    assets: any[];
  }>> {
    const orders = await this.orderRepo.getByUserId(userId);
    const digitalAssets: any[] = [];

    for (const order of orders) {
      if (order.status === 'cancelled') continue;
      
      for (const item of order.items) {
        if (item.digitalAssets && item.digitalAssets.length > 0) {
          const logs = await this.accessRepo.getLogsByUserAndAssets(userId, item.digitalAssets.map((a: any) => a.id));
          
          digitalAssets.push({
            orderId: order.id,
            orderDate: order.createdAt,
            productName: item.name,
            productId: item.productId,
            productImageUrl: item.imageUrl || '',
            assets: item.digitalAssets.map((a: any) => ({
              ...a,
              lastDownloadedAt: logs.find(l => l.assetId === a.id)?.createdAt || null
            }))
          });
        }
      }
    }

    return digitalAssets.sort((a, b) => b.orderDate.getTime() - a.orderDate.getTime());
  }
}
