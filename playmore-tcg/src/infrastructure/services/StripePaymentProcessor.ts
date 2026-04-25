import type { IPaymentProcessor } from '@domain/repositories';

export class StripePaymentProcessor implements IPaymentProcessor {
  async processPayment(params: {
    amount: number;
    orderId: string;
    paymentMethodId?: string;
  }): Promise<{ success: boolean; transactionId: string | null }> {
    if (!params.paymentMethodId) {
      throw new Error('Payment method is required for real processing.');
    }

    throw new Error(
      'Browser-side payment capture is disabled. Configure a trusted backend payment endpoint before enabling checkout.'
    );
  }
}
