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
      
      // Determine carrier from tracking number pattern
      const tn = trackingNumber.toUpperCase().replace(/[^A-Z0-9]/g, '');
      let carrier = 'Other';
      if (/^\d{12}$|^\d{15}$/.test(tn)) carrier = 'FedEx';
      else if (/^1Z[A-Z0-9]{16}$/.test(tn)) carrier = 'UPS';
      else if (/^\d{20,22}$|^[A-Z]{2}\d{9}[A-Z]{2}$/.test(tn)) carrier = 'USPS';
      else if (/^\d{10}$/.test(tn)) carrier = 'DHL';

      await this.orderRepo.updateStatus(orderId, 'shipped');
      await this.orderRepo.updateFulfillment(orderId, {
        trackingNumber,
        shippingCarrier: carrier,
        trackingUrl: deriveTrackingUrl({ ...order, trackingNumber } as Order) || ''
      });
      await this.recordFulfillmentEvent(orderId, 'in_transit', 'Dispatched', `Tracked via ${carrier}: ${trackingNumber}`);
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
