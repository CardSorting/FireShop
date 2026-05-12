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
import { runTransaction, getUnifiedDb } from '@infrastructure/firebase/bridge';
import { AuditService } from './AuditService';
import { logger } from '@utils/logger';

export class RefundService {
  constructor(
    private orderRepo: IOrderRepository,
    private payment: IPaymentProcessor,
    private audit: AuditService,
    private productRepo?: IProductRepository,
    private discountRepo?: import('@domain/repositories').IDiscountRepository,
    private locker?: import('@domain/repositories').ILockProvider
  ) {}

  async processRefund(orderId: string, amount: number, actor: { id: string, email: string }, refundAttemptId?: string): Promise<void> {
    // 0. Production Hardening: Acquire distributed lock to prevent double-refund races
    const lockId = `refund_lock:${orderId}`;
    let fencingToken: number | null = null;
    if (this.locker) {
        const { success, fencingToken: token } = await this.locker.acquireLock(lockId, actor.id, 60000);
        if (!success) throw new Error('A refund is already in progress for this order.');
        fencingToken = token;
    }

    try {
      const order = await this.orderRepo.getById(orderId);
      if (!order) throw new OrderNotFoundError(orderId);

      // Point 7: Reconciliation Abuse Block — no refunds on locked orders
      if (order.reconciliationRequired || order.status === 'reconciling') {
        throw new Error('Cannot process refund: order requires manual reconciliation.');
      }

      if (!order.paymentTransactionId) {
        throw new Error('Cannot refund order without a payment transaction ID.');
      }

      // Production Hardening: Validate refund amount is positive and does not exceed order total
      if (!Number.isFinite(amount) || amount <= 0) {
        throw new Error('Refund amount must be a positive number.');
      }
      if (order.total <= 0) {
        throw new Error('This order has no refundable balance.');
      }
      const safeAmount = Math.min(Math.trunc(amount), order.total);

      // Production Hardening: Determine full vs partial refund
      const isFullRefund = safeAmount >= order.total;
      const nextStatus = isFullRefund ? 'refunded' : 'partially_refunded';

      // Validate status transition before processing payment
      assertValidOrderStatusTransition(order.status, nextStatus as any);

      // Point 2: Deterministic Idempotency Keys (Granular)
      // Format: refund:{orderId}:{refundAttemptId}:{amount}
      const attemptId = refundAttemptId || `att_${Date.now()}`;
      const refundIdempotencyKey = `refund:${orderId}:${attemptId}:${safeAmount}`;
      
      const result = await this.payment.refundPayment(order.paymentTransactionId, safeAmount, refundIdempotencyKey);
      
      if (result.success) {
        try {
          // Production Hardening: Perform all post-payment state mutations ATOMICALLY 
          await runTransaction(getUnifiedDb(), async (transaction: any) => {
            // 1. Update Order Status
            await this.orderRepo.updateStatus(orderId, nextStatus as any, transaction);

            // 2. Restock inventory (physical items only)
            if (isFullRefund && this.productRepo) {
              const restockUpdates = order.items
                .filter(item => !item.isDigital)
                .map(item => ({
                  id: item.productId,
                  variantId: item.variantId,
                  delta: item.quantity // positive delta = restock
                }));
              if (restockUpdates.length > 0) {
                await this.productRepo.batchUpdateStock(restockUpdates, transaction);
              }
            }

            // 3. Rollback discount usage
            if (isFullRefund && order.discountCode && this.discountRepo) {
              const discount = await this.discountRepo.getByCode(order.discountCode, transaction);
              if (discount) {
                await this.discountRepo.decrementUsage(discount.id, transaction);
              }
            }

            // 4. Record Audit (Transactional)
            await this.audit.recordWithTransaction(transaction, {
              userId: actor.id,
              userEmail: actor.email,
              action: 'order_refunded',
              targetId: orderId,
              details: { amount: safeAmount, status: nextStatus, isFullRefund, idempotencyKey: refundIdempotencyKey }
            });
          });
        } catch (dbError) {
          // Point 7: Refund Partial Failure (Stripe success, DB fail)
          // CRITICAL: We MUST mark the order as requiring manual reconciliation.
          logger.error(`CRITICAL: Stripe refund succeeded but DB update failed for order ${orderId}. Marking for RECONCILIATION.`, dbError);
          
          await this.orderRepo.updateStatus(orderId, 'reconciling');
          await this.orderRepo.markForReconciliation(orderId, [
            `Stripe refund of ${safeAmount} succeeded (Key: ${refundIdempotencyKey}) but DB transaction failed.`,
            `Error: ${dbError instanceof Error ? dbError.message : 'Unknown'}`
          ]);
          
          throw new Error('Refund succeeded in Stripe but failed to update order state. Order marked for reconciliation.');
        }
        
        logger.info(`[RefundService] Refund processed and state synchronized for order ${orderId}`);
      } else {
        // Production Hardening: Audit the failed refund attempt for forensic traceability
        await this.audit.record({
          userId: actor.id,
          userEmail: actor.email,
          action: 'order_refunded',
          targetId: orderId,
          details: { amount: safeAmount, status: 'failed', isFullRefund, error: 'Payment processor rejected refund' }
        }).catch(() => {}); // swallow audit failure — don't mask the primary error
        throw new Error('Payment processor failed to issue refund.');
      }
    } finally {
      if (this.locker) {
        await this.locker.releaseLock(lockId, actor.id, fencingToken ?? undefined).catch(err => {
          logger.error(`Failed to release refund lock for ${orderId}`, err);
        });
      }
    }
  }
}
