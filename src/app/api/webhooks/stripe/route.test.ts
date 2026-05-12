import { beforeEach, describe, expect, it, vi } from 'vitest';

const constructEvent = vi.fn();
const tryProcessEvent = vi.fn();
const finalizeOrderPayment = vi.fn();

vi.mock('next/headers', () => ({
  headers: vi.fn(async () => new Headers({ 'stripe-signature': 'sig' })),
}));

vi.mock('@infrastructure/services/StripeService', () => ({
  StripeService: vi.fn(() => ({
    constructEvent,
    tryProcessEvent,
  })),
}));

vi.mock('@infrastructure/server/services', () => ({
  getServerServices: vi.fn(async () => ({
    orderService: { finalizeOrderPayment },
    orderRepo: { getByPaymentTransactionId: vi.fn() },
  })),
}));

describe('Stripe webhook replay handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    constructEvent.mockReturnValue({
      id: 'evt_1',
      type: 'payment_intent.succeeded',
      data: { object: { id: 'pi_1' } },
    });
  });

  it('does not finalize duplicate webhook events', async () => {
    tryProcessEvent.mockResolvedValue(true);
    const { POST } = await import('./route');

    const response = await POST(new Request('https://example.test/api/webhooks/stripe', { method: 'POST', body: '{}' }));
    const body = await response.json();

    expect(body.duplicate).toBe(true);
    expect(finalizeOrderPayment).not.toHaveBeenCalled();
  });
});
