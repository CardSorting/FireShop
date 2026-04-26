import type { IPaymentProcessor } from '@domain/repositories';
import { PaymentFailedError } from '@domain/errors';

export class StripePaymentProcessor implements IPaymentProcessor {
  async processPayment(params: {
    amount: number;
    orderId: string;
    paymentMethodId?: string;
    idempotencyKey: string;
  }): Promise<{ success: boolean; transactionId: string | null }> {
    if (!params.paymentMethodId) {
      throw new PaymentFailedError('Payment method is required for real processing.');
    }

    throw new PaymentFailedError(
      'Browser-side payment capture is disabled. Configure a trusted backend payment endpoint before enabling checkout.'
    );
  }
}
