import type { IOrderRepository } from '@domain/repositories';
import type { Order } from '@domain/models';
import { StorageService } from '@infrastructure/services/StorageService';
import { Sanitizer } from '@utils/sanitizer';
import { logger } from '@utils/logger';

export class OrderReadService {
  constructor(private orderRepo: IOrderRepository) {}

  async getAllOrders(options?: any): Promise<{ orders: Order[]; nextCursor?: string }> {
    const result = await this.orderRepo.getAll(options);
    return {
      ...result,
      orders: result.orders.map(order => Sanitizer.order(order))
    };
  }

  async getOrdersForCustomerView(userId: string, options?: any): Promise<{ orders: Order[]; nextCursor?: string }> {
    const result = await this.orderRepo.getByUserId(userId, options);
    return {
      ...result,
      orders: result.orders.map(order => Sanitizer.order(order))
    };
  }

  async getDigitalAssets(userId: string) {
    const allOrders: Order[] = [];
    let cursor: string | undefined;

    do {
      const page = await this.orderRepo.getByUserId(userId, { limit: 50, cursor });
      allOrders.push(...page.orders);
      cursor = page.nextCursor;
    } while (cursor);

    const digitalItems = allOrders
      .filter(order => order.status !== 'cancelled' && order.status !== 'refunded' && order.status !== 'reconciling')
      .flatMap(order => order.items
        .filter(item => item.digitalAssets?.length)
        .map(item => ({
          orderId: order.id,
          orderDate: order.createdAt,
          productName: item.name,
          productId: item.productId,
          productImageUrl: item.imageUrl || '',
          assets: item.digitalAssets
        }))
      );

    return digitalItems;
  }

  async getOrder(id: string, requestingUserId?: string): Promise<Order | null> {
    const order = await this.orderRepo.getById(id);
    if (order && requestingUserId && order.userId !== requestingUserId) return null;
    return order;
  }

  async getOrders(userId: string, options?: any): Promise<{ orders: Order[]; nextCursor?: string }> {
    return this.orderRepo.getByUserId(userId, options);
  }

  async getAdminOrder(orderId: string): Promise<Order | null> {
    return this.orderRepo.getById(orderId);
  }

  async getAdminOverview(): Promise<{
    totalCount: number;
    pendingCount: number;
    fulfillmentCount: number;
    reconcilingCount: number;
  }> {
    const orders = await this.orderRepo.getAll({ limit: 1000 }); // Simple implementation
    return {
      totalCount: orders.orders.length,
      pendingCount: orders.orders.filter(o => o.status === 'confirmed').length,
      fulfillmentCount: orders.orders.filter(o => o.status === 'processing').length,
      reconcilingCount: orders.orders.filter(o => o.status === 'reconciling').length,
    };
  }
}
