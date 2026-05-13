import type { IPaymentProcessor } from '@domain/repositories';
import { PaymentFailedError } from '@domain/errors';
import Stripe from 'stripe';
import { AuditService } from '@core/AuditService';

export class StripePaymentProcessor implements IPaymentProcessor {
  private stripe: Stripe;
  private audit: AuditService;

  constructor(auditService?: AuditService) {
    this.audit = auditService || new AuditService();
    const secretKey = process.env.STRIPE_SECRET_KEY?.trim() || '';
    this.stripe = new Stripe(secretKey, {
      apiVersion: '2025-02-11-preview' as any,
      typescript: true,
    });
  }

  async processPayment(params: {
    amount: number;
    orderId: string;
    paymentMethodId?: string;
    idempotencyKey: string;
  }): Promise<{ success: boolean; transactionId: string | null }> {
    if (!params.paymentMethodId) {
      throw new PaymentFailedError('Payment method is required for processing.');
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      throw new PaymentFailedError('Stripe processor is not configured. Set STRIPE_SECRET_KEY.');
    }

    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.trunc(params.amount),
        currency: 'usd',
        confirm: true,
        payment_method: params.paymentMethodId,
        automatic_payment_methods: {
          enabled: true,
          allow_redirects: 'never', // For synchronous processing in this context
        },
        description: `DreamBeesArt order ${params.orderId}`,
        metadata: { orderId: params.orderId },
      }, {
        idempotencyKey: params.idempotencyKey,
      });

      if (paymentIntent.status === 'succeeded' || paymentIntent.status === 'requires_capture') {
        await this.audit.record({
          userId: 'system',
          userEmail: 'payments@dreambees.art',
          action: 'order_payment_finalized',
          targetId: params.orderId,
          details: { transactionId: paymentIntent.id, amount: params.amount, status: paymentIntent.status }
        });
        return { success: true, transactionId: paymentIntent.id };
      }

      throw new PaymentFailedError(
        `Stripe payment not completed (status: ${paymentIntent.status}).`
      );
    } catch (error: any) {
      const message = error.message || 'Stripe payment request failed.';
      // Forensic: Record payment failure
      await this.audit.record({
        userId: 'system',
        userEmail: 'payments-alerts@dreambees.art',
        action: 'order_payment_finalized', // Reusing for failed attempts
        targetId: params.orderId,
        details: { error: message, amount: params.amount, status: 'failed' }
      });
      throw new PaymentFailedError(message);
    }
  }

  async refundPayment(transactionId: string, amount: number, idempotencyKey: string): Promise<{ success: boolean }> {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new PaymentFailedError('Stripe processor is not configured.');
    }

    try {
      const refund = await this.stripe.refunds.create({
        payment_intent: transactionId,
        amount: Math.trunc(amount),
      }, {
        idempotencyKey,
      });

      const success = refund.status === 'succeeded' || refund.status === 'pending';
      await this.audit.record({
        userId: 'system',
        userEmail: 'refunds@dreambees.art',
        action: 'order_refunded',
        targetId: transactionId,
        details: { amount, status: refund.status, success }
      });
      return { success };
    } catch (error: any) {
      const message = error.message || 'Stripe refund request failed.';
      throw new PaymentFailedError(message);
    }
  }
}
