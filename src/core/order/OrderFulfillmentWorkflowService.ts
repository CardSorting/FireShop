import * as crypto from 'node:crypto';
import type { IOrderRepository } from '@domain/repositories';
import type { Order, OrderFulfillmentEvent, OrderFulfillmentEventType, OrderStatus } from '@domain/models';
import { OrderNotFoundError } from '@domain/errors';
import { assertValidOrderStatusTransition, deriveTrackingUrl } from '@domain/rules';
import type { OrderActor } from './types';

export class OrderFulfillmentWorkflowService {
  constructor(private orderRepo: IOrderRepository) {}

  async advanceFulfillment(orderId: string, trackingNumber?: string, _actor?: OrderActor): Promise<void> {
    const order = await this.orderRepo.getById(orderId);
    if (!order) throw new OrderNotFoundError(orderId);

    if (order.fulfillmentMethod === 'shipping' && trackingNumber) {
      assertValidOrderStatusTransition(order.status, 'shipped');
      await this.orderRepo.updateStatus(orderId, 'shipped');
      await this.orderRepo.updateFulfillment(orderId, {
        trackingNumber,
        shippingCarrier: 'Carrier',
        trackingUrl: deriveTrackingUrl({ ...order, trackingNumber } as Order) || ''
      });
      await this.recordFulfillmentEvent(orderId, 'in_transit', 'Dispatched', `Track: ${trackingNumber}`);
      return;
    }

    const next: Record<string, OrderStatus> = {
      confirmed: 'processing',
      processing: 'shipped',
      ready_for_pickup: 'delivered',
      delivery_started: 'delivered'
    };
    const nextStatus = next[order.status];
    if (!nextStatus) return;

    assertValidOrderStatusTransition(order.status, nextStatus);
    await this.orderRepo.updateStatus(orderId, nextStatus);
    await this.recordFulfillmentEvent(orderId, nextStatus as OrderFulfillmentEventType, 'Progressed', `Moved to ${nextStatus}`);
  }

  async recordFulfillmentEvent(
    orderId: string,
    type: OrderFulfillmentEventType,
    label: string,
    description: string
  ): Promise<void> {
    const event: OrderFulfillmentEvent = {
      id: crypto.randomUUID(),
      type,
      label,
      description,
      at: new Date()
    };
    await this.orderRepo.addFulfillmentEvent(orderId, event);
  }
}
