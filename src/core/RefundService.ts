/**
 * [LAYER: CORE]
 * Manages order refunds, payment reversals, and related audit trails.
 */
import type { 
  IOrderRepository, 
  IPaymentProcessor 
} from '@domain/repositories';
import { 
  Order 
} from '@domain/models';
import { OrderNotFoundError } from '@domain/errors';
import { AuditService } from './AuditService';

export class RefundService {
  constructor(
    private orderRepo: IOrderRepository,
    private payment: IPaymentProcessor,
    private audit: AuditService
  ) {}

  async processRefund(orderId: string, amount: number, actor: { id: string, email: string }): Promise<void> {
    const order = await this.orderRepo.getById(orderId);
    if (!order) throw new OrderNotFoundError(orderId);

    if (!order.paymentTransactionId) {
        throw new Error('Cannot refund order without a payment transaction ID.');
    }

    const result = await this.payment.refundPayment(order.paymentTransactionId, amount);
    if (result.success) {
        await this.orderRepo.updateStatus(orderId, 'refunded');
        await this.audit.record({
            userId: actor.id,
            userEmail: actor.email,
            action: 'order_refunded',
            targetId: orderId,
            details: { amount, status: 'refunded' }
        });
    } else {
        throw new Error('Payment processor failed to issue refund.');
    }
  }
}
