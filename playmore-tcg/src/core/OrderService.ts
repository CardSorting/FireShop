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

export class OrderService {
  constructor(
    private orderRepo: IOrderRepository,
    private productRepo: IProductRepository,
    private cartRepo: ICartRepository,
    private payment: IPaymentProcessor
  ) {}

  async placeOrder(userId: string, shippingAddress: Address, paymentMethodId?: string): Promise<Order> {
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

    // Deduct stock
    for (const item of cart.items) {
      await this.productRepo.updateStock(item.productId, -item.quantity);
    }

    const total = calculateCartTotal(cart.items);

    // Create order
    const order = await this.orderRepo.create({
      userId,
      items: cart.items.map((item) => ({
        productId: item.productId,
        name: item.name,
        quantity: item.quantity,
        unitPrice: item.priceSnapshot,
      })),
      total,
      status: 'pending',
      shippingAddress,
      paymentTransactionId: null,
    });

    // Process payment
    const paymentResult = await this.payment.processPayment({
      amount: total,
      orderId: order.id,
      paymentMethodId,
    });

    if (paymentResult.success && paymentResult.transactionId) {
      await this.orderRepo.updateStatus(order.id, 'confirmed');
      // Update order locally for return
      order.status = 'confirmed';
      order.paymentTransactionId = paymentResult.transactionId;
    }

    // Clear cart
    await this.cartRepo.clear(userId);

    return { ...order, status: 'confirmed', paymentTransactionId: paymentResult.transactionId };
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