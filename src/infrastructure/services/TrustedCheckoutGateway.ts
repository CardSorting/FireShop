/**
 * [LAYER: INFRASTRUCTURE]
 * Adapter for a trusted server-side checkout finalization endpoint.
 */
import type { ICheckoutGateway } from '@domain/repositories';
import type { Order } from '@domain/models';
import { PaymentFailedError } from '@domain/errors';

export class TrustedCheckoutGateway implements ICheckoutGateway {
  constructor(private readonly endpoint: string | undefined = process.env.CHECKOUT_ENDPOINT) { }

  async finalizeCheckout(params: Parameters<ICheckoutGateway['finalizeCheckout']>[0]): Promise<Order> {
    if (!this.endpoint) {
      throw new PaymentFailedError(
        'Checkout finalization endpoint is not configured for this deployment.'
      );
    }

    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': params.idempotencyKey,
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      throw new PaymentFailedError('Trusted checkout finalization failed. Please try again.');
    }

    return response.json() as Promise<Order>;
  }
}