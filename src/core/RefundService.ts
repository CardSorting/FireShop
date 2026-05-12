import type { 
  IOrderRepository, 
  IPaymentProcessor,
  IProductRepository 
} from '@domain/repositories';
import { 
  Order 
} from '@domain/models';
import { OrderNotFoundError } from '@domain/errors';
import { assertValidOrderStatusTransition } from '@domain/rules';
import { AuditService } from './AuditService';
import { logger } from '@utils/logger';

export class RefundService {
  constructor(
    private orderRepo: IOrderRepository,
    private payment: IPaymentProcessor,
    private audit: AuditService,
    private productRepo?: IProductRepository
  ) {}

  async processRefund(orderId: string, amount: number, actor: { id: string, email: string }): Promise<void> {
    const order = await this.orderRepo.getById(orderId);
    if (!order) throw new OrderNotFoundError(orderId);

    if (!order.paymentTransactionId) {
        throw new Error('Cannot refund order without a payment transaction ID.');
    }

    // Production Hardening: Determine full vs partial refund
    const isFullRefund = amount >= order.total;
    const nextStatus = isFullRefund ? 'refunded' : 'partially_refunded';

    // Validate status transition before processing payment
    assertValidOrderStatusTransition(order.status, nextStatus as any);

    const result = await this.payment.refundPayment(order.paymentTransactionId, amount);
    if (result.success) {
        await this.orderRepo.updateStatus(orderId, nextStatus as any);

        // Production Hardening: Restock inventory on full refund
        if (isFullRefund && this.productRepo) {
            try {
                const restockUpdates = order.items
                    .filter(item => !item.isDigital)
                    .map(item => ({
                        id: item.productId,
                        variantId: item.variantId,
                        delta: item.quantity // positive delta = restock
                    }));
                if (restockUpdates.length > 0) {
                    await this.productRepo.batchUpdateStock(restockUpdates);
                    logger.info(`[RefundService] Restocked ${restockUpdates.length} products for order ${orderId}`);
                }
            } catch (restockErr) {
                logger.error(`CRITICAL: Refund succeeded but inventory restock failed for order ${orderId}`, restockErr);
                // Don't throw — the refund itself succeeded
            }
        }

        await this.audit.record({
            userId: actor.id,
            userEmail: actor.email,
            action: 'order_refunded',
            targetId: orderId,
            details: { amount, status: nextStatus, isFullRefund }
        });
    } else {
        throw new Error('Payment processor failed to issue refund.');
    }
  }
}
