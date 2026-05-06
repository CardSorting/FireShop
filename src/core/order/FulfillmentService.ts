import * as crypto from 'node:crypto';
import type { 
  IOrderRepository, 
  IShippingRepository, 
  IInventoryLocationRepository, 
  IInventoryLevelRepository 
} from '@domain/repositories';
import type { 
  Order, 
  Fulfillment, 
  OrderFulfillmentEvent, 
  OrderFulfillmentEventType, 
  OrderStatus, 
  Address 
} from '@domain/models';
import { OrderNotFoundError } from '@domain/errors';
import { deriveTrackingUrl } from '@domain/rules';
import { AuditService } from '../AuditService';
import { logger } from '@utils/logger';

export class FulfillmentService {
  constructor(
    private orderRepo: IOrderRepository,
    private audit: AuditService,
    private locationRepo?: IInventoryLocationRepository,
    private inventoryLevelRepo?: IInventoryLevelRepository
  ) {}

  async createFulfillment(params: {
    orderId: string;
    items: Array<{ productId: string; variantId?: string; quantity: number }>;
    trackingNumber: string;
    shippingCarrier: string;
    actor: { id: string, email: string };
  }): Promise<Fulfillment> {
    const order = await this.orderRepo.getById(params.orderId);
    if (!order) throw new OrderNotFoundError(params.orderId);

    const updatedOrderItems = [...order.items];
    for (const fItem of params.items) {
      const idx = updatedOrderItems.findIndex(i => i.productId === fItem.productId && i.variantId === fItem.variantId);
      if (idx === -1) throw new Error(`Product ${fItem.productId} not found in order`);
      
      const item = updatedOrderItems[idx];
      const remaining = item.quantity - item.fulfilledQty;
      if (fItem.quantity > remaining) {
        throw new Error(`Cannot fulfill ${fItem.quantity} of ${item.name} (only ${remaining} remaining)`);
      }
      
      updatedOrderItems[idx] = { ...item, fulfilledQty: item.fulfilledQty + fItem.quantity };
    }

    const fulfillment: Fulfillment = {
      id: crypto.randomUUID(),
      orderId: params.orderId,
      items: params.items,
      trackingNumber: params.trackingNumber,
      trackingCarrier: params.shippingCarrier,
      trackingUrl: deriveTrackingUrl({ trackingNumber: params.trackingNumber, shippingCarrier: params.shippingCarrier } as any),
      status: 'shipped',
      shippedAt: new Date(),
      deliveredAt: null,
      createdAt: new Date(),
    };

    const allFulfilled = updatedOrderItems.every(i => i.fulfilledQty >= i.quantity);
    const newStatus: OrderStatus = allFulfilled ? 'shipped' : order.status;

    await this.orderRepo.save({
      ...order,
      items: updatedOrderItems,
      status: newStatus,
      fulfillments: [...(order.fulfillments || []), fulfillment],
      updatedAt: new Date(),
    });

    await this.recordFulfillmentEvent(params.orderId, 'shipped');

    await this.audit.record({
      userId: params.actor.id,
      userEmail: params.actor.email,
      action: 'order_status_changed',
      targetId: params.orderId,
      details: { 
          type: 'fulfillment_created', 
          fulfillmentId: fulfillment.id, 
          allFulfilled,
          tracking: params.trackingNumber 
      }
    });

    return fulfillment;
  }

  async updateOrderFulfillment(
    orderId: string,
    data: { trackingNumber?: string; shippingCarrier?: string },
    actor: { id: string, email: string }
  ): Promise<void> {
    const order = await this.orderRepo.getById(orderId);
    if (!order) throw new OrderNotFoundError(orderId);

    const trackingUrl = data.trackingNumber ? deriveTrackingUrl({ trackingNumber: data.trackingNumber } as any) : null;
    await this.orderRepo.updateFulfillment(orderId, { ...data, trackingUrl });

    if (data.trackingNumber) {
        await this.recordFulfillmentEvent(orderId, 'label_created');
    }

    await this.audit.record({
      userId: actor.id,
      userEmail: actor.email,
      action: 'order_status_changed',
      targetId: orderId,
      details: {
        type: 'fulfillment_update',
        tracking: data.trackingNumber,
        carrier: data.shippingCarrier,
        note: 'Fulfillment information updated and persistent event recorded.'
      }
    });
  }

  async assignFulfillmentLocation(params: { userId: string, shippingAddress: Address, items?: any[] }): Promise<string> {
    if (this.locationRepo && this.inventoryLevelRepo && params.items?.length) {
      try {
        const firstItem = params.items[0];
        const levels = await this.inventoryLevelRepo.findByProduct(firstItem.productId);
        const available = levels.find(l => l.availableQty >= firstItem.quantity);
        if (available) return available.locationId;
      } catch (err) {
        logger.error('Failed to assign stock-aware location', err);
      }
    }

    if (this.locationRepo) {
      const defaultLoc = await this.locationRepo.findDefault();
      if (defaultLoc) return defaultLoc.id;
    }
    return 'primary-warehouse';
  }

  createFulfillmentEvent(orderId: string, statusOrType: OrderStatus | OrderFulfillmentEventType): OrderFulfillmentEvent {
    const mapping: Record<string, OrderFulfillmentEventType> = {
      pending: 'order_placed',
      confirmed: 'payment_confirmed',
      shipped: 'in_transit',
      delivered: 'delivered',
      cancelled: 'cancelled',
      processing: 'processing',
    };

    const type = (mapping[statusOrType] || statusOrType) as OrderFulfillmentEventType;
    const labels: Record<OrderFulfillmentEventType, string> = {
      order_placed: 'Order placed',
      payment_confirmed: 'Payment confirmed',
      processing: 'Preparing shipment',
      label_created: 'Shipping label created',
      in_transit: 'In transit',
      delivered: 'Delivered',
      cancelled: 'Order cancelled',
    };

    const descriptions: Record<OrderFulfillmentEventType, string> = {
      order_placed: 'We have received your order request.',
      payment_confirmed: 'Your payment was authorized and captured.',
      processing: 'Your items are being picked and packed.',
      label_created: 'A shipping label has been generated.',
      in_transit: 'Your package is on its way.',
      delivered: 'Your package has been delivered.',
      cancelled: 'The order has been cancelled.',
    };

    return {
      id: `${orderId === 'initial' ? crypto.randomUUID() : orderId}-${type}-${Date.now()}`,
      type,
      label: labels[type] || 'Status update',
      description: descriptions[type] || `Order status changed to ${type}`,
      at: new Date(),
    };
  }

  async recordFulfillmentEvent(orderId: string, statusOrType: OrderStatus | OrderFulfillmentEventType): Promise<void> {
    const event = this.createFulfillmentEvent(orderId, statusOrType);
    if (this.orderRepo.addFulfillmentEvent) {
      await this.orderRepo.addFulfillmentEvent(orderId, event);
    }
  }
}
