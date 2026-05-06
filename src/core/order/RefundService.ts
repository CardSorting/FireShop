import type { 
  IOrderRepository, 
  IProductRepository, 
  IPaymentProcessor 
} from '@domain/repositories';
import { OrderNotFoundError } from '@domain/errors';
import { formatCents } from '@domain/rules';
import { AuditService } from '../AuditService';
import * as crypto from 'node:crypto';
import type { OrderStatus } from '@domain/models';

export class RefundService {
  constructor(
    private orderRepo: IOrderRepository,
    private productRepo: IProductRepository,
    private payment: IPaymentProcessor,
    private audit: AuditService
  ) {}

  async refundOrder(params: {
    orderId: string;
    amount: number;
    reason: string;
    restock: boolean;
    actor: { id: string, email: string };
  }): Promise<void> {
    const order = await this.orderRepo.getById(params.orderId);
    if (!order) throw new OrderNotFoundError(params.orderId);
    if (!order.paymentTransactionId) throw new Error('Order has no payment transaction');
    if (params.amount > order.total) throw new Error('Refund amount exceeds order total');

    const result = await this.payment.refundPayment(order.paymentTransactionId, params.amount);
    if (!result.success) throw new Error('Payment refund failed at gateway');

    const isPartial = params.amount < order.total;
    const newStatus: OrderStatus = isPartial ? 'partially_refunded' : 'refunded';

    await this.orderRepo.updateStatus(order.id, newStatus);
    
    if (params.restock) {
      const restockUpdates = order.items.map(item => ({
        id: item.productId,
        variantId: item.variantId,
        delta: item.quantity
      }));
      if (this.productRepo.batchUpdateStock) {
        await this.productRepo.batchUpdateStock(restockUpdates);
      } else {
        for (const update of restockUpdates) {
          if (update.variantId) {
            await this.productRepo.updateVariantStock(update.variantId, update.delta);
          } else {
            await this.productRepo.updateStock(update.id, update.delta);
          }
        }
      }
    }

    const noteId = crypto.randomUUID();
    await this.orderRepo.updateNotes(order.id, [
      ...order.notes,
      {
        id: noteId,
        authorId: params.actor.id,
        authorEmail: params.actor.email,
        text: `REFUND ISSUED: ${formatCents(params.amount)}. Reason: ${params.reason}. ${params.restock ? 'Inventory restocked.' : 'No restock.'}`,
        createdAt: new Date(),
      }
    ]);

    await this.audit.record({
      userId: params.actor.id,
      userEmail: params.actor.email,
      action: 'order_refunded',
      targetId: order.id,
      details: { 
        amount: params.amount, 
        reason: params.reason, 
        restock: params.restock, 
        status: newStatus,
        noteId
      }
    });
  }
}
