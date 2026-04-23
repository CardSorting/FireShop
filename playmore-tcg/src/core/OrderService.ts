/**
 * [LAYER: CORE]
 */
import type {
  IOrderRepository,
  IProductRepository,
  ICartRepository,
  IPaymentProcessor,
} from '@domain/repositories';
import type { Order, OrderStatus, Address } from '@domain/models';
import { calculateCartTotal, canPlaceOrder } from '@domain/rules';
import {
  CartEmptyError,
  InsufficientStockError,
  ProductNotFoundError,
} from '@domain/errors';
import { SovereignLocker } from '@infrastructure/sqlite/SovereignLocker';

export class OrderService {
  constructor(
    private orderRepo: IOrderRepository,
    private productRepo: IProductRepository,
    private cartRepo: ICartRepository,
    private payment: IPaymentProcessor,
    private locker: SovereignLocker = new SovereignLocker()
  ) {}

  async placeOrder(userId: string, shippingAddress: Address, paymentMethodId?: string): Promise<Order> {
    const lockId = `checkout_${userId}`;
    const acquired = await this.locker.acquireLock(lockId, userId, 30000); // 30 second lock
    if (!acquired) {
      throw new Error('Checkout is already in progress for this user.');
    }

    try {
      const cart = await this.cartRepo.getByUserId(userId);
      if (!cart || cart.items.length === 0) {
        throw new CartEmptyError();
      }

    // Build stock map and verify availability
    const stockMap = new Map<string, number>();
    for (const item of cart.items) {
      const product = await this.productRepo.getById(item.productId);
      if (!product) throw new ProductNotFoundError(item.productId);
      stockMap.set(item.productId, product.stock);
    }

    if (!canPlaceOrder(cart.items, stockMap)) {
      throw new InsufficientStockError(
        'multiple',
        0,
        0
      );
    }

    // BroccoliQ Level 6: Builder's Punch (Coalescing)
    if (this.productRepo.batchUpdateStock) {
      await this.productRepo.batchUpdateStock(
        cart.items.map(item => ({ id: item.productId, delta: -item.quantity }))
      );
    } else {
      // Deduct stock iteratively (fallback)
      for (const item of cart.items) {
        await this.productRepo.updateStock(item.productId, -item.quantity);
      }
    }

    const total = calculateCartTotal(cart.items);

    // Process payment (External boundary)
    const paymentResult = await this.payment.processPayment({
      amount: total,
      orderId: 'pending', // Order not physically created yet
      paymentMethodId,
    });

    if (!paymentResult.success || !paymentResult.transactionId) {
      // BroccoliDB Agent Shadow: Rollback the unit of work (Compensating Transaction)
      console.warn(`[OrderService] Payment failed for ${userId}. Rolling back stock deduction.`);
      if (this.productRepo.batchUpdateStock) {
        await this.productRepo.batchUpdateStock(
          cart.items.map(item => ({ id: item.productId, delta: item.quantity })) // Positive delta to restore
        );
      } else {
        for (const item of cart.items) {
          await this.productRepo.updateStock(item.productId, item.quantity);
        }
      }
      throw new Error('Payment processing failed. Your cart stock has been restored.');
    }

    // Agent Shadow: Commit phase (Atomic Flush equivalent)
    // Create order only after successful payment
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

  async updateOrderStatus(id: string, status: OrderStatus): Promise<void> {
    return this.orderRepo.updateStatus(id, status);
  }
}