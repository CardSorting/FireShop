/**
 * [LAYER: CORE]
 * Handles order status updates, batch operations, and system maintenance tasks.
 */
import type { 
  IOrderRepository 
} from '@domain/repositories';
import { 
  OrderStatus 
} from '@domain/models';
import { OrderNotFoundError } from '@domain/errors';
import { assertValidOrderStatusTransition } from '@domain/rules';
import { AuditService } from './AuditService';
import { logger } from '@utils/logger';

export class OrderManagementService {
  constructor(
    private orderRepo: IOrderRepository,
    private audit: AuditService
  ) {}

  async updateOrderStatus(id: string, status: OrderStatus, actor: { id: string, email: string }): Promise<void> {
    const order = await this.orderRepo.getById(id);
    if (!order) throw new OrderNotFoundError(id);
    if (order.reconciliationRequired) {
      throw new Error('Order requires manual reconciliation and is locked.');
    }
    assertValidOrderStatusTransition(order.status, status);
    await this.orderRepo.updateStatus(id, status);
    await this.audit.record({ userId: actor.id, userEmail: actor.email, action: 'order_status_changed', targetId: id, details: { from: order.status, to: status } });
  }

  async batchUpdateOrderStatus(ids: string[], status: OrderStatus, actor: { id: string, email: string }): Promise<void> {
    if (this.orderRepo.batchUpdateStatus) {
      await this.orderRepo.batchUpdateStatus(ids, status);
    } else {
      for (const id of ids) {
        await this.updateOrderStatus(id, status, actor);
      }
    }
    await this.audit.record({ 
      userId: actor.id, 
      userEmail: actor.email, 
      action: 'order_status_changed', 
      targetId: 'batch', 
      details: { ids, to: status } 
    });
  }

  async markHeartbeat(orderId: string, userId: string, email: string): Promise<void> {
    return this.orderRepo.markHeartbeat(orderId, userId, email);
  }

  async cleanupExpiredOrders(expirationMinutes: number = 60): Promise<{ count: number }> {
    logger.info(`[OrderManagementService] Cleaning up expired pending orders (cutoff: ${expirationMinutes}m)...`);
    const cutoff = new Date();
    cutoff.setMinutes(cutoff.getMinutes() - expirationMinutes);
    
    const { orders } = await this.orderRepo.getAll({ status: 'pending', to: cutoff });
    for (const order of orders) {
      await this.orderRepo.updateStatus(order.id, 'cancelled');
      await this.audit.record({ userId: 'system', userEmail: 'system@dreambees.art', action: 'order_status_changed', targetId: order.id, details: { from: 'pending', to: 'cancelled', reason: 'expired' } });
    }
    return { count: orders.length };
  }
}