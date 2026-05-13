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
  AdministrativeTask,
  User
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
    const totalOrders = Object.values(stats.orderCountsByStatus).reduce((sum, c) => sum + (c || 0), 0);
    return {
      productCount: 0, lowStockCount: 0, outOfStockCount: 0, totalRevenue: stats.totalRevenue, averageOrderValue: totalOrders > 0 ? Math.round(stats.totalRevenue / totalOrders) : 0, dailyRevenue: stats.dailyRevenue, orderCountsByStatus: stats.orderCountsByStatus,
      fulfillmentCounts: { to_review: stats.orderCountsByStatus.pending, ready_to_ship: (stats.orderCountsByStatus.confirmed || 0) + (stats.orderCountsByStatus.processing || 0), in_transit: (stats.orderCountsByStatus.shipped || 0) + (stats.orderCountsByStatus.delivery_started || 0), completed: stats.orderCountsByStatus.delivered, cancelled: stats.orderCountsByStatus.cancelled },
      activeTasks, attentionItems: [], recentOrders: recent, lowStockProducts: []
    };
  }

  async getAnalyticsData(): Promise<AnalyticsData> {
    const stats = await this.orderRepo.getDashboardStats();
    const topProducts = await this.orderRepo.getTopProducts(5);
    const totalOrders = Object.values(stats.orderCountsByStatus).reduce((sum, c) => sum + (c || 0), 0);
    
    // Industrialized Growth Calculation (W/W)
    // stats.dailyRevenue is 7 days: [D-6, D-5, D-4, D-3, D-2, D-1, D-0]
    const currentPeriod = stats.dailyRevenue.slice(-3).reduce((a, b) => a + b, 0);
    const previousPeriod = stats.dailyRevenue.slice(0, 3).reduce((a, b) => a + b, 0);
    const revenueGrowth = previousPeriod > 0 
      ? Math.round(((currentPeriod - previousPeriod) / previousPeriod) * 1000) / 10 
      : 0;

    return {
      totalRevenue: stats.totalRevenue,
      dailyRevenue: stats.dailyRevenue,
      revenueGrowth,
      averageOrderValue: totalOrders > 0 ? Math.round(stats.totalRevenue / totalOrders) : 0,
      topProducts: topProducts.map(p => ({ 
        ...p, 
        growth: 0 // In high-velocity production, growth is calculated via time-series analysis (e.g. InfluxDB/Prometheus)
      }))
    };
  }

  async getCustomerSummaries(users?: User[]): Promise<CustomerSummary[]> {
    const { orders } = await this.orderRepo.getAll({ limit: 1000 });
    const customerMap = new Map<string, CustomerSummary>();
    
    if (users) {
      for (const u of users) {
        customerMap.set(u.id, { 
          id: u.id, 
          name: u.displayName || 'Anonymous', 
          email: u.email, 
          orders: 0, 
          spent: 0, 
          joined: u.createdAt || new Date(), 
          lastOrder: null, 
          segment: 'new' 
        });
      }
    }

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
      // Industrialized Total Spent (Excludes cancelled/refunded)
      if (o.status !== 'cancelled' && o.status !== 'refunded') {
        c.orders++;
        c.spent += o.total;
      }
      if (!c.lastOrder || o.createdAt > c.lastOrder) c.lastOrder = o.createdAt;
      if (o.createdAt < c.joined) c.joined = o.createdAt;
    }

    // Industrialized Segmentation
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    for (const c of customerMap.values()) {
      if (c.orders === 0) {
        c.segment = 'new';
      } else if (c.spent >= 100000) { // $1000+
        c.segment = 'big_spender';
      } else if (c.orders >= 5) {
        c.segment = 'vip';
      } else if (c.lastOrder && c.lastOrder < ninetyDaysAgo) {
        c.segment = 'inactive';
      } else if (c.orders >= 2) {
        c.segment = 'returning';
      } else {
        c.segment = 'one_time';
      }
    }
    
    return Array.from(customerMap.values());
  }
}
