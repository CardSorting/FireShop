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
import type { AdminDashboardSummary, Order, OrderStatus, Address } from '@domain/models';
import {
  assertValidOrderItems,
  assertValidOrderStatusTransition,
  assertValidShippingAddress,
  calculateCartTotal,
  classifyFulfillmentBucket,
  classifyInventoryHealth,
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

class InMemoryLockProvider implements ILockProvider {
  private locks = new Set<string>();

  async acquireLock(resourceId: string): Promise<boolean> {
    if (this.locks.has(resourceId)) return false;
    this.locks.add(resourceId);
    return true;
  }

  async releaseLock(resourceId: string): Promise<void> {
    this.locks.delete(resourceId);
  }
}

export class OrderService {
  constructor(
    private orderRepo: IOrderRepository,
    private productRepo: IProductRepository,
    private cartRepo: ICartRepository,
    private payment: IPaymentProcessor,
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
        });

        // Clear cart
        await this.cartRepo.clear(userId);

        return order;
      } catch (err) {
        throw new CheckoutReconciliationError(
          err instanceof Error
            ? `Payment ${paymentResult.transactionId} succeeded, but checkout finalization failed: ${err.message}`
            : `Payment ${paymentResult.transactionId} succeeded, but checkout finalization failed.`
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
    limit?: number;
    cursor?: string;
  }): Promise<{ orders: Order[]; nextCursor?: string }> {
    return this.orderRepo.getAll(options);
  }

  async getAdminDashboardSummary(): Promise<AdminDashboardSummary> {
    const [{ orders }, { products }] = await Promise.all([
      this.orderRepo.getAll({ limit: 100 }),
      this.productRepo.getAll({ limit: 100 }),
    ]);

    const orderCountsByStatus: AdminDashboardSummary['orderCountsByStatus'] = {
      pending: 0,
      confirmed: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
    };
    const fulfillmentCounts: AdminDashboardSummary['fulfillmentCounts'] = {
      to_review: 0,
      ready_to_ship: 0,
      in_transit: 0,
      completed: 0,
      cancelled: 0,
    };

    for (const order of orders) {
      orderCountsByStatus[order.status] += 1;
      fulfillmentCounts[classifyFulfillmentBucket(order.status)] += 1;
    }

    const revenueOrders = orders.filter((order) => order.status !== 'cancelled');
    const totalRevenue = revenueOrders.reduce((sum, order) => sum + order.total, 0);
    const lowStockProducts = products
      .filter((product) => classifyInventoryHealth(product.stock) !== 'healthy')
      .sort((a, b) => a.stock - b.stock || a.name.localeCompare(b.name))
      .slice(0, 8);
    const outOfStockCount = products.filter(
      (product) => classifyInventoryHealth(product.stock) === 'out_of_stock'
    ).length;
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
      ...(lowStockProducts.length > 0
        ? [
            {
              id: 'inventory-low-stock',
              label: `${lowStockProducts.length} products need stock attention`,
              description: 'Review products that are unavailable or close to selling out.',
              href: '/admin/inventory',
              priority: outOfStockCount > 0 ? ('high' as const) : ('medium' as const),
            },
          ]
        : []),
    ];

    return {
      productCount: products.length,
      lowStockCount: products.filter((product) => classifyInventoryHealth(product.stock) === 'low_stock').length,
      outOfStockCount,
      totalRevenue,
      averageOrderValue:
        revenueOrders.length > 0 ? Math.round(totalRevenue / revenueOrders.length) : 0,
      orderCountsByStatus,
      fulfillmentCounts,
      attentionItems,
      recentOrders: orders.slice(0, 8),
      lowStockProducts,
    };
  }

  async updateOrderStatus(id: string, status: OrderStatus): Promise<void> {
    const order = await this.orderRepo.getById(id);
    if (!order) throw new OrderNotFoundError(id);
    assertValidOrderStatusTransition(order.status, status);
    return this.orderRepo.updateStatus(id, status);
  }

  async batchUpdateOrderStatus(ids: string[], status: OrderStatus): Promise<void> {
    const orders = await Promise.all(ids.map((id) => this.orderRepo.getById(id)));
    for (const order of orders) {
      if (order) assertValidOrderStatusTransition(order.status, status);
    }

    if (this.orderRepo.batchUpdateStatus) {
      return this.orderRepo.batchUpdateStatus(ids, status);
    }
    await Promise.all(ids.map((id) => this.orderRepo.updateStatus(id, status)));
  }
}