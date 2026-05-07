/**
 * [LAYER: CORE]
 * Specialized for high-velocity data retrieval and administrative reporting.
 */
import type { 
  IOrderRepository 
} from '@domain/repositories';
import { 
  Order, 
  OrderStatus, 
  AdminDashboardSummary,
  AnalyticsData,
  CustomerSummary,
  AdministrativeTask
} from '@domain/models';
import { Sanitizer } from '@utils/sanitizer';

export class OrderQueryService {
  constructor(private orderRepo: IOrderRepository) {}

  async getOrder(id: string): Promise<Order | null> {
    const order = await this.orderRepo.getById(id);
    return order ? Sanitizer.order(order) : null;
  }

  async getAllOrders(options?: any): Promise<{ orders: Order[], nextCursor?: string }> {
    return this.orderRepo.getAll(options);
  }

  async getOrdersForCustomerView(userId: string, options?: any): Promise<{ orders: Order[], nextCursor?: string }> {
    return this.orderRepo.getByUserId(userId, options);
  }

  async getDigitalAssets(userId: string) {
     const { orders } = await this.orderRepo.getByUserId(userId, { limit: 100 });
     return orders.filter(o => o.status !== 'cancelled').flatMap(o => o.items.filter(i => i.digitalAssets?.length).map(i => ({ orderId: o.id, orderDate: o.createdAt, productName: i.name, productId: i.productId, productImageUrl: i.imageUrl || '', assets: i.digitalAssets })));
  }

  async getActiveViewers(orderId: string): Promise<Array<{ userId: string, email: string, lastActive: Date }>> {
    return this.orderRepo.getActiveViewers(orderId);
  }

  async getAdminDashboardSummary(): Promise<AdminDashboardSummary> {
    const stats = await this.orderRepo.getDashboardStats();
    const { orders: recent } = await this.orderRepo.getAll({ limit: 10 });
    const activeTasks: AdministrativeTask[] = [
      { id: 'ship', label: 'Pick & Pack', count: stats.orderCountsByStatus.processing || 0, priority: 'high', category: 'fulfillment' },
      { id: 'pickup', label: 'In-Store Pickups', count: stats.orderCountsByStatus.ready_for_pickup || 0, priority: 'medium', category: 'fulfillment' }
    ];
    return {
      productCount: 0, lowStockCount: 0, outOfStockCount: 0, totalRevenue: stats.totalRevenue, averageOrderValue: stats.totalRevenue / 100, dailyRevenue: stats.dailyRevenue, orderCountsByStatus: stats.orderCountsByStatus,
      fulfillmentCounts: { to_review: stats.orderCountsByStatus.pending, ready_to_ship: (stats.orderCountsByStatus.confirmed || 0) + (stats.orderCountsByStatus.processing || 0), in_transit: (stats.orderCountsByStatus.shipped || 0) + (stats.orderCountsByStatus.delivery_started || 0), completed: stats.orderCountsByStatus.delivered, cancelled: stats.orderCountsByStatus.cancelled },
      activeTasks, attentionItems: [], recentOrders: recent, lowStockProducts: []
    };
  }

  async getAnalyticsData(): Promise<AnalyticsData> {
    const stats = await this.orderRepo.getDashboardStats();
    const topProducts = await this.orderRepo.getTopProducts(5);
    return {
      totalRevenue: stats.totalRevenue,
      dailyRevenue: stats.dailyRevenue,
      revenueGrowth: 15.5, // Simulated
      averageOrderValue: stats.totalRevenue / 100,
      topProducts: topProducts.map(p => ({ ...p, growth: 10.2 }))
    };
  }

  async getCustomerSummaries(): Promise<CustomerSummary[]> {
    const { orders } = await this.orderRepo.getAll({ limit: 1000 });
    const customerMap = new Map<string, CustomerSummary>();
    
    for (const o of orders) {
      if (!customerMap.has(o.userId)) {
        customerMap.set(o.userId, {
          id: o.userId,
          name: o.customerName || 'Anonymous',
          email: o.customerEmail || '',
          orders: 0,
          spent: 0,
          lastOrder: o.createdAt,
          joined: o.createdAt,
          segment: 'new'
        });
      }
      const c = customerMap.get(o.userId)!;
      c.orders++;
      c.spent += o.total;
      if (o.createdAt > c.lastOrder!) c.lastOrder = o.createdAt;
      if (o.createdAt < c.joined) c.joined = o.createdAt;
    }
    
    return Array.from(customerMap.values());
  }
}
