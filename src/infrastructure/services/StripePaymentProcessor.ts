import type { IPaymentProcessor } from '@domain/repositories';
import { PaymentFailedError } from '@domain/errors';
import Stripe from 'stripe';

export class StripePaymentProcessor implements IPaymentProcessor {
  private stripe: Stripe;

  constructor() {
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
        return { success: true, transactionId: paymentIntent.id };
      }

      throw new PaymentFailedError(
        `Stripe payment not completed (status: ${paymentIntent.status}).`
      );
    } catch (error: any) {
      const message = error.message || 'Stripe payment request failed.';
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

      return { success: refund.status === 'succeeded' || refund.status === 'pending' };
    } catch (error: any) {
      const message = error.message || 'Stripe refund request failed.';
      throw new PaymentFailedError(message);
    }
  }
}
