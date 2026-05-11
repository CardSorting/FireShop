     1|/**
     2| * [LAYER: CORE]
     3| * Handles order status updates, batch operations, and system maintenance tasks.
     4| */
     5|import type { 
     6|  IOrderRepository 
     7|} from '@domain/repositories';
     8|import { 
     9|  OrderStatus 
    10|} from '@domain/models';
    11|import { OrderNotFoundError } from '@domain/errors';
    12|import { assertValidOrderStatusTransition } from '@domain/rules';
    13|import { AuditService } from './AuditService';
    14|import { logger } from '@utils/logger';
    15|
    16|export class OrderManagementService {
    17|  constructor(
    18|    private orderRepo: IOrderRepository,
    19|    private audit: AuditService
    20|  ) {}
    21|
    22|  async updateOrderStatus(id: string, status: OrderStatus, actor: { id: string, email: string }): Promise<void> {
    23|    const order = await this.orderRepo.getById(id);
    24|    if (!order) throw new OrderNotFoundError(id);
    25|    assertValidOrderStatusTransition(order.status, status);
    26|    await this.orderRepo.updateStatus(id, status);
    27|    await this.audit.record({ userId: actor.id, userEmail: actor.email, action: 'order_status_changed', targetId: id, details: { from: order.status, to: status } });
    28|  }
    29|
    30|  async batchUpdateOrderStatus(ids: string[], status: OrderStatus, actor: { id: string, email: string }): Promise<void> {
    31|    if (this.orderRepo.batchUpdateStatus) {
    32|      await this.orderRepo.batchUpdateStatus(ids, status);
    33|    } else {
    34|      for (const id of ids) {
    35|        await this.updateOrderStatus(id, status, actor);
    36|      }
    37|    }
    38|    await this.audit.record({ 
    39|      userId: actor.id, 
    40|      userEmail: actor.email, 
    41|      action: 'order_status_changed', 
    42|      targetId: 'batch', 
    43|      details: { ids, to: status } 
    44|    });
    45|  }
    46|
    47|  async markHeartbeat(orderId: string, userId: string, email: string): Promise<void> {
    48|    return this.orderRepo.markHeartbeat(orderId, userId, email);
    49|  }
    50|
    51|  async cleanupExpiredOrders(expirationMinutes: number = 60): Promise<{ count: number }> {
    52|    logger.info(`[OrderManagementService] Cleaning up expired pending orders (cutoff: ${expirationMinutes}m)...`);
    53|    const cutoff = new Date();
    54|    cutoff.setMinutes(cutoff.getMinutes() - expirationMinutes);
    55|    
    56|    const { orders } = await this.orderRepo.getAll({ status: 'pending', to: cutoff });
    57|    for (const order of orders) {
    58|      await this.orderRepo.updateStatus(order.id, 'cancelled');
    59|      await this.audit.record({ userId: 'system', userEmail: 'system@dreambees.art', action: 'order_status_changed', targetId: order.id, details: { from: 'pending', to: 'cancelled', reason: 'expired' } });
    60|    }
    61|    return { count: orders.length };
    62|  }
    63|}
    64|