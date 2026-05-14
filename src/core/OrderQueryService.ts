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
  User,
  AdminActionItem
} from '@domain/models';
import type { ProductService } from './ProductService';
import { Sanitizer } from '@utils/sanitizer';

export class OrderQueryService {
  constructor(
    private orderRepo: IOrderRepository,
    private productService?: ProductService
  ) {}

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
    const activeTasks: AdministrativeTask[] = [];
    
    if ((stats.orderCountsByStatus.processing || 0) > 0) {
      activeTasks.push({ id: 'ship', label: 'Pick & Pack', count: stats.orderCountsByStatus.processing, priority: 'high', category: 'fulfillment' });
    }
    if ((stats.orderCountsByStatus.confirmed || 0) > 0) {
      activeTasks.push({ id: 'confirm', label: 'Await Fulfillment', count: stats.orderCountsByStatus.confirmed, priority: 'medium', category: 'fulfillment' });
    }
    if ((stats.orderCountsByStatus.ready_for_pickup || 0) > 0) {
      activeTasks.push({ id: 'pickup', label: 'In-Store Pickups', count: stats.orderCountsByStatus.ready_for_pickup, priority: 'medium', category: 'fulfillment' });
    }

    const attentionItems: AdminActionItem[] = [];
    if ((stats.orderCountsByStatus.pending || 0) > 10) {
      attentionItems.push({ 
        id: 'backlog', 
        label: 'Pending Backlog', 
        description: 'High volume of orders awaiting confirmation.', 
        href: '/admin/orders?status=pending',
        priority: 'high'
      });
    }

    const totalOrders = Object.values(stats.orderCountsByStatus).reduce((sum, c) => sum + (c || 0), 0);
    
    const productStats = this.productService ? await this.productService.getProductManagementOverview() : null;

    const days = Object.keys(stats.dailyRevenue).sort().reverse().slice(0, 7).reverse();
    const dailyRevenue = days.map(day => stats.dailyRevenue[day] || 0);

    return {
      productCount: productStats?.totalProducts || 0, 
      lowStockCount: productStats?.lowStockCount || 0, 
      outOfStockCount: productStats?.outOfStockCount || 0, 
      totalRevenue: stats.totalRevenue, 
      averageOrderValue: totalOrders > 0 ? Math.round(stats.totalRevenue / totalOrders) : 0, 
      dailyRevenue,
      orderCountsByStatus: stats.orderCountsByStatus,
      fulfillmentCounts: { 
        to_review: stats.orderCountsByStatus.pending || 0, 
        ready_to_ship: (stats.orderCountsByStatus.confirmed || 0) + (stats.orderCountsByStatus.processing || 0), 
        in_transit: (stats.orderCountsByStatus.shipped || 0) + (stats.orderCountsByStatus.delivery_started || 0), 
        completed: stats.orderCountsByStatus.delivered || 0, 
        cancelled: (stats.orderCountsByStatus.cancelled || 0) + (stats.orderCountsByStatus.refunded || 0) 
      },
      activeTasks, 
      attentionItems, 
      recentOrders: recent, 
      lowStockProducts: productStats?.productsNeedingAttention.slice(0, 5) || []
    };
  }

  async getAnalyticsData(): Promise<AnalyticsData> {
    const stats = await this.orderRepo.getDashboardStats();
    const topProducts = await this.orderRepo.getTopProducts(5);
    const totalOrders = Object.values(stats.orderCountsByStatus).reduce((sum, c) => sum + (c || 0), 0);
    
    // stats.dailyRevenue is Record<string, number>: { "2026-05-14": 5000, ... }
    const days = Object.keys(stats.dailyRevenue).sort().reverse(); // [Today, Yesterday, ...]
    const currentWeekRevenue = days.slice(0, 7).reduce((sum, day) => sum + (stats.dailyRevenue[day] || 0), 0);
    const previousWeekRevenue = days.slice(7, 14).reduce((sum, day) => sum + (stats.dailyRevenue[day] || 0), 0);
    
    const revenueGrowth = previousWeekRevenue > 0 
      ? Math.round(((currentWeekRevenue - previousWeekRevenue) / previousWeekRevenue) * 1000) / 10 
      : 0;

    const dailyRevenueArray = days.slice(0, 7).reverse().map(day => stats.dailyRevenue[day] || 0);


    return {
      totalRevenue: stats.totalRevenue,
      dailyRevenue: dailyRevenueArray,
      revenueGrowth,
      averageOrderValue: totalOrders > 0 ? Math.round(stats.totalRevenue / totalOrders) : 0,

      topProducts: topProducts.map(p => ({ 
        ...p, 
        growth: 0 // In high-velocity production, growth is calculated via time-series analysis (e.g. InfluxDB/Prometheus)
      }))
    };
  }

  async getCustomerSummaries(users?: User[]): Promise<CustomerSummary[]> {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    
    // Industrialized: Fetch orders within a specific window to prevent OOM on legacy stores
    const { orders } = await this.orderRepo.getAll({ 
      from: ninetyDaysAgo, 
      limit: 2000 
    });
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

    // Industrialized Segmentation (reusing ninetyDaysAgo from above)

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

  async getLogisticsInsights() {
    const stats = await this.orderRepo.getLogisticsStats();
    
    // Industrialized Insight Mapping
    return {
      ...stats,
      health: {
        fulfillment: stats.avgFulfillmentTimeHours < 24 ? 'healthy' : stats.avgFulfillmentTimeHours < 48 ? 'warning' : 'critical',
        delivery: stats.onTimeDeliveryRate > 95 ? 'healthy' : stats.onTimeDeliveryRate > 85 ? 'warning' : 'critical',
        profitability: stats.shippingProfitability >= 0 ? 'healthy' : 'warning'
      },
      recommendations: stats.onTimeDeliveryRate < 90 ? ['Audit carrier performance for breach patterns', 'Adjust estimated delivery windows'] : []
    };
  }
}
