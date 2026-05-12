/**
 * [LAYER: INFRASTRUCTURE]
 * Adapter for a trusted server-side checkout finalization endpoint.
 */
import type { ICheckoutGateway } from '@domain/repositories';
import type { Address, Order, OrderItem, OrderNote, OrderStatus } from '@domain/models';
import { PaymentFailedError } from '@domain/errors';

const CHECKOUT_TIMEOUT_MS = 15_000;

function isOrderStatus(value: unknown): value is OrderStatus {
  return typeof value === 'string'
    && ['draft', 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded', 'partially_refunded', 'ready_for_pickup', 'delivery_started'].includes(value);
}

function isAddress(value: unknown): value is Address {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const candidate = value as Partial<Address>;
  return typeof candidate.street === 'string'
    && typeof candidate.city === 'string'
    && typeof candidate.state === 'string'
    && typeof candidate.zip === 'string'
    && typeof candidate.country === 'string';
}

function isOrderItem(value: unknown): value is OrderItem {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const candidate = value as Partial<OrderItem>;
  return typeof candidate.productId === 'string'
    && typeof candidate.name === 'string'
    && Number.isInteger(candidate.quantity)
    && Number.isInteger(candidate.unitPrice);
}

function parseTrustedOrder(value: unknown): Order {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new PaymentFailedError('Trusted checkout returned an invalid order response.');
  }

  const candidate = value as Record<string, unknown>;
  if (typeof candidate.id !== 'string'
    || typeof candidate.userId !== 'string'
    || !Array.isArray(candidate.items)
    || !candidate.items.every(isOrderItem)
    || !Number.isInteger(candidate.total)
    || !isOrderStatus(candidate.status)
    || !isAddress(candidate.shippingAddress)
    || !(typeof candidate.paymentTransactionId === 'string' || candidate.paymentTransactionId === null)
    || typeof candidate.riskScore !== 'number'
    || typeof candidate.createdAt !== 'string'
    || typeof candidate.updatedAt !== 'string') {
    throw new PaymentFailedError('Trusted checkout returned an invalid order response.');
  }

  const orderItems = candidate.items as OrderItem[];
  const orderTotal = candidate.total as number;
  const orderStatus = candidate.status as OrderStatus;
  const shippingAddress = candidate.shippingAddress as Address;
  const paymentTransactionId = candidate.paymentTransactionId as string | null;
  const riskScore = candidate.riskScore as number;
  const createdAt = candidate.createdAt as string;
  const updatedAt = candidate.updatedAt as string;

  const notes: OrderNote[] = Array.isArray(candidate.notes) ? (candidate.notes as OrderNote[]) : [];

  return {
    id: candidate.id,
    userId: candidate.userId,
    items: orderItems,
    total: orderTotal,
    status: orderStatus,
    shippingAddress,
    paymentTransactionId,
    idempotencyKey: typeof candidate.idempotencyKey === 'string' ? candidate.idempotencyKey : undefined,
    discountCode: typeof candidate.discountCode === 'string' ? candidate.discountCode : undefined,
    discountAmount: typeof candidate.discountAmount === 'number' ? candidate.discountAmount : undefined,
    riskScore,
    notes,
    shippingAmount: typeof candidate.shippingAmount === 'number' ? candidate.shippingAmount : 0,
    taxAmount: typeof candidate.taxAmount === 'number' ? candidate.taxAmount : 0,
    fulfillmentLocationId: typeof candidate.fulfillmentLocationId === 'string' ? candidate.fulfillmentLocationId : 'primary',
    fulfillmentMethod: (candidate.fulfillmentMethod as any) || 'shipping',
    fulfillments: Array.isArray(candidate.fulfillments) ? candidate.fulfillments : [],
    createdAt: new Date(createdAt),
    updatedAt: new Date(updatedAt),
  };
}

export class TrustedCheckoutGateway implements ICheckoutGateway {
  constructor(private readonly endpoint: string | undefined = process.env.CHECKOUT_ENDPOINT) { }

  async finalizeCheckout(params: Parameters<ICheckoutGateway['finalizeCheckout']>[0]): Promise<Order> {
    if (!this.endpoint) {
      throw new PaymentFailedError(
        'Checkout finalization endpoint is not configured for this deployment.'
      );
    }

    let endpointUrl: URL;
    try {
      endpointUrl = new URL(this.endpoint);
    } catch {
      throw new PaymentFailedError('Trusted checkout endpoint is invalid.');
    }

    if (endpointUrl.protocol !== 'https:' && endpointUrl.protocol !== 'http:') {
      throw new PaymentFailedError('Trusted checkout endpoint protocol is not supported.');
    }

    if (endpointUrl.username || endpointUrl.password) {
      throw new PaymentFailedError('Trusted checkout endpoint must not include credentials.');
    }

    if (process.env.NODE_ENV === 'production' && endpointUrl.protocol !== 'https:') {
      throw new PaymentFailedError('Trusted checkout endpoint must use HTTPS in production.');
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), CHECKOUT_TIMEOUT_MS);

    let response: Response;
    try {
      response = await fetch(endpointUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': params.idempotencyKey,
        },
        body: JSON.stringify(params),
        signal: controller.signal,
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new PaymentFailedError('Trusted checkout finalization timed out. Please try again.');
      }
      throw new PaymentFailedError('Trusted checkout finalization could not be reached. Please try again.');
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      throw new PaymentFailedError('Trusted checkout finalization failed. Please try again.');
    }

    const responseType = response.headers.get('content-type') ?? '';
    if (!responseType.toLowerCase().includes('application/json')) {
      throw new PaymentFailedError('Trusted checkout returned an invalid response type.');
    }

    return parseTrustedOrder(await response.json().catch(() => null));
  }
}