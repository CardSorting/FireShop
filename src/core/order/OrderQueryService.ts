import type { 
  IOrderRepository, 
  ICartRepository 
} from '@domain/repositories';
import { FirestoreDigitalAccessRepository } from '@infrastructure/repositories/firestore/FirestoreDigitalAccessRepository';
import type { Order, OrderStatus } from '@domain/models';
import { Sanitizer } from '@utils/sanitizer';

export class OrderQueryService {
  constructor(
    private orderRepo: IOrderRepository,
    private cartRepo: ICartRepository,
    private accessRepo: FirestoreDigitalAccessRepository
  ) {}

  async getOrder(id: string): Promise<Order | null> {
    const order = await this.orderRepo.getById(id);
    return order ? this.enrichOrderForCustomerView(order) : null;
  }

  async getAllOrders(options?: {
    status?: OrderStatus;
    query?: string;
    limit?: number;
    cursor?: string;
  }): Promise<{ orders: Order[]; nextCursor?: string }> {
    return this.orderRepo.getAll(options);
  }

  async getOrdersForCustomerView(
    userId: string,
    options?: {
      status?: OrderStatus | 'all';
      query?: string;
      from?: string | Date;
      to?: string | Date;
      sort?: 'newest' | 'oldest' | 'total_desc' | 'total_asc' | 'status';
      limit?: number;
      cursor?: string;
    }
  ): Promise<Order[]> {
    const fromDate = options?.from ? (options.from instanceof Date ? options.from : new Date(options.from)) : undefined;
    const toDate = options?.to ? (options.to instanceof Date ? options.to : new Date(options.to)) : undefined;

    const { orders } = await this.orderRepo.getByUserId(userId, {
      status: options?.status,
      limit: options?.limit ?? 100,
      cursor: options?.cursor,
      from: fromDate,
      to: toDate,
    });

    const enriched = orders.map((order) => this.enrichOrderForCustomerView(order));
    const q = options?.query?.trim().toLowerCase() ?? '';

    const filtered = q 
      ? enriched.filter((order) => 
          order.id.toLowerCase().includes(q)
          || order.items.some((item) => item.name.toLowerCase().includes(q) || item.variantTitle?.toLowerCase().includes(q))
        )
      : enriched;

    const sort = options?.sort ?? 'newest';
    return [...filtered].sort((a, b) => {
      if (sort === 'oldest') return a.createdAt.getTime() - b.createdAt.getTime();
      if (sort === 'total_desc') return b.total - a.total;
      if (sort === 'total_asc') return a.total - b.total;
      if (sort === 'status') return a.status.localeCompare(b.status);
      return b.createdAt.getTime() - a.createdAt.getTime();
    });
  }

  enrichOrderForCustomerView(order: Order): Order {
    const enriched = {
      ...order,
      fulfillmentEvents: order.fulfillmentEvents || [],
    };
    return Sanitizer.order(enriched);
  }

  async getDigitalAssets(userId: string): Promise<Array<{
    orderId: string;
    orderDate: Date;
    productName: string;
    productId: string;
    productImageUrl: string;
    assets: any[];
  }>> {
    const result = await this.orderRepo.getByUserId(userId, { limit: 1000 });
    const digitalAssets: any[] = [];

    for (const order of result.orders) {
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
