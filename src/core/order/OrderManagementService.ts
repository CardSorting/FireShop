import * as crypto from 'node:crypto';
import type { 
  IOrderRepository, 
  IProductRepository, 
  ICartRepository, 
  IDiscountRepository 
} from '@domain/repositories';
import type { 
  OrderStatus, 
  AdminDashboardSummary, 
  AnalyticsData, 
  CustomerSummary, 
  User, 
  OrderNote 
} from '@domain/models';
import { OrderNotFoundError } from '@domain/errors';
import { assertValidOrderStatusTransition } from '@domain/rules';
import { AuditService } from '../AuditService';
import { logger } from '@utils/logger';
import { FulfillmentService } from '@core/order/FulfillmentService';

export class OrderManagementService {
  constructor(
    private orderRepo: IOrderRepository,
    private productRepo: IProductRepository,
    private cartRepo: ICartRepository,
    private discountRepo: IDiscountRepository,
    private audit: AuditService,
    private fulfillmentService: FulfillmentService
  ) {}

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
    await this.fulfillmentService.recordFulfillmentEvent(id, status);

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

    await Promise.all(ids.map(id => this.fulfillmentService.recordFulfillmentEvent(id, status)));

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

  async approveHeldOrder(orderId: string, actor: { id: string, email: string }): Promise<void> {
    const order = await this.orderRepo.getById(orderId);
    if (!order) throw new OrderNotFoundError(orderId);
    if (order.status !== 'pending') throw new Error('Only pending orders can be approved');

    await this.orderRepo.updateStatus(orderId, 'confirmed');
    await this.fulfillmentService.recordFulfillmentEvent(orderId, 'payment_confirmed');

    const noteId = crypto.randomUUID();
    await this.orderRepo.updateNotes(orderId, [
      ...order.notes,
      {
        id: noteId,
        authorId: actor.id,
        authorEmail: actor.email,
        text: 'Order approved after manual review.',
        createdAt: new Date(),
      }
    ]);

    await this.audit.record({
      userId: actor.id,
      userEmail: actor.email,
      action: 'order_status_changed',
      targetId: orderId,
      details: { from: 'pending', to: 'confirmed', type: 'manual_approval', noteId }
    });
  }

  async addOrderNote(
    orderId: string,
    text: string,
    actor: { id: string, email: string }
  ): Promise<OrderNote> {
    const order = await this.orderRepo.getById(orderId);
    if (!order) throw new OrderNotFoundError(orderId);

    const note: OrderNote = {
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

  async cleanupExpiredOrders(expirationMinutes: number = 60): Promise<number> {
    const cutoff = new Date(Date.now() - expirationMinutes * 60 * 1000);
    const { orders: expired } = await this.orderRepo.getAll({ 
      status: 'pending', 
      to: cutoff,
      limit: 100 
    });

    if (expired.length === 0) return 0;
    
    logger.info(`Cleaning up ${expired.length} expired pending orders.`);
    const ids = expired.map(o => o.id);
    
    await this.batchUpdateOrderStatus(ids, 'cancelled', { 
        id: 'system', 
        email: 'cleanup-service@dreambees.art' 
    });

    return expired.length;
  }

  async getCustomerSummaries(users: User[]): Promise<CustomerSummary[]> {
    const toDate = (value: Date | string): Date => value instanceof Date ? value : new Date(value);
    const summaries = await Promise.all(
      users.map(async (user) => {
        try {
          const { orders } = await this.orderRepo.getByUserId(user.id, { limit: 1000 });
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
}
