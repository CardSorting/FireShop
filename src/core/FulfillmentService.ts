/**
 * [LAYER: CORE]
 * Handles logistical operations, carrier manifestation, and fulfillment event recording.
 */
import * as crypto from 'node:crypto';
import type { 
  IOrderRepository, 
  IShippingRepository 
} from '@domain/repositories';
import { 
  Order, 
  OrderStatus, 
  Fulfillment, 
  OrderFulfillmentEvent, 
  OrderFulfillmentEventType,
  ShippingLabel,
  CarrierManifest,
  ShippingRule,
  LogisticsPerformance
} from '@domain/models';
import { OrderNotFoundError } from '@domain/errors';
import { logger } from '@utils/logger';

export class FulfillmentService {
  constructor(
    private orderRepo: IOrderRepository,
    private shippingRepo?: IShippingRepository
  ) {}

  private readonly DEFAULT_RULES: ShippingRule[] = [
    { id: '1', name: 'Standard Post', conditions: { maxWeightLbs: 1 }, preferredCarrier: 'USPS', preferredService: 'Ground Advantage', priority: 10 },
    { id: '2', name: 'Bulk Freight', conditions: { minWeightLbs: 10 }, preferredCarrier: 'UPS', preferredService: 'Ground', priority: 20 },
    { id: '3', name: 'High Value Security', conditions: { minValueCents: 50000 }, preferredCarrier: 'FedEx', preferredService: 'Home Delivery', priority: 30 }
  ];

  async autoAssignShippingMethod(orderId: string): Promise<{ carrier: string; service: string }> {
    const order = await this.orderRepo.getById(orderId);
    if (!order) throw new OrderNotFoundError(orderId);
    
    const weightLbs = order.items.reduce((sum, i) => sum + (i.quantity * 0.5), 0);
    const value = order.total;

    const rules = [...this.DEFAULT_RULES].sort((a, b) => b.priority - a.priority);
    for (const rule of rules) {
       const wMatch = (!rule.conditions.minWeightLbs || weightLbs >= rule.conditions.minWeightLbs) && (!rule.conditions.maxWeightLbs || weightLbs <= rule.conditions.maxWeightLbs);
       const vMatch = (!rule.conditions.minValueCents || value >= rule.conditions.minValueCents) && (!rule.conditions.maxValueCents || value <= rule.conditions.maxValueCents);
       if (wMatch && vMatch) return { carrier: rule.preferredCarrier, service: rule.preferredService };
    }

    return { carrier: 'USPS', service: 'Ground Advantage' };
  }

  // RETIRED: Labels cannot be created directly in the backend. 
  // Use Pirate Ship CSV export instead.
  /*
  async prepareBatchLabels(orderIds: string[]): Promise<ShippingLabel[]> {
    ...
  }
  */

  async createCarrierManifest(carrier: string, orderIds: string[]): Promise<CarrierManifest> {
    const orders = await Promise.all(orderIds.map(id => this.orderRepo.getById(id)));
    const fulfillmentIds = orders.flatMap(o => o?.fulfillments.filter(f => f.trackingCarrier === carrier).map(f => f.id) || []);
    
    return {
      id: crypto.randomUUID(),
      carrier,
      fulfillmentIds,
      totalLabels: fulfillmentIds.length,
      totalWeightLbs: orders.length * 2.5,
      status: 'draft',
      createdAt: new Date()
    };
  }

  async getLogisticsPerformanceReport(): Promise<LogisticsPerformance> {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    
    // Industrialized: Fetch recent orders to calculate real performance
    const { orders } = await this.orderRepo.getAll({ from: ninetyDaysAgo, limit: 1000 });
    
    let totalFulfillmentHours = 0;
    let fulfilledCount = 0;
    let onTimeCount = 0;
    let shippingRevenue = 0;
    const estimatedCost = 0;

    const carrierStats: Record<string, { totalTransitDays: number; count: number; breaches: number }> = {};

    for (const order of orders) {
      shippingRevenue += (order.shippingAmount || 0);
      
      const placedAt = order.createdAt.getTime();
      const confirmedEvent = order.fulfillmentEvents?.find(e => e.type === 'payment_confirmed');
      const shippedEvent = order.fulfillmentEvents?.find(e => e.type === 'in_transit');
      const deliveredEvent = order.fulfillmentEvents?.find(e => e.type === 'delivered');

      if (shippedEvent && confirmedEvent) {
        const diffHours = (shippedEvent.at.getTime() - confirmedEvent.at.getTime()) / (1000 * 60 * 60);
        totalFulfillmentHours += diffHours;
        fulfilledCount++;
      }

      if (deliveredEvent && order.estimatedDeliveryDate) {
        if (deliveredEvent.at.getTime() <= order.estimatedDeliveryDate.getTime()) {
          onTimeCount++;
        }
      }

      if (order.shippingCarrier) {
        const carrier = order.shippingCarrier;
        if (!carrierStats[carrier]) carrierStats[carrier] = { totalTransitDays: 0, count: 0, breaches: 0 };
        
        if (shippedEvent && deliveredEvent) {
          const transitDays = (deliveredEvent.at.getTime() - shippedEvent.at.getTime()) / (1000 * 60 * 60 * 24);
          carrierStats[carrier].totalTransitDays += transitDays;
          carrierStats[carrier].count++;
          if (transitDays > 5) carrierStats[carrier].breaches++; // Industrialized threshold
        }
      }
    }

    const performance: LogisticsPerformance = {
      avgFulfillmentTimeHours: fulfilledCount > 0 ? Math.round(totalFulfillmentHours / fulfilledCount * 10) / 10 : 24,
      onTimeDeliveryRate: orders.length > 0 ? Math.round((onTimeCount / orders.length) * 1000) / 10 : 100,
      carrierPerformance: {},
      shippingProfitability: shippingRevenue - estimatedCost // In a real app, estimatedCost would come from a carrier API
    };

    for (const [carrier, stats] of Object.entries(carrierStats)) {
      performance.carrierPerformance[carrier] = {
        avgTransitDays: stats.count > 0 ? Math.round(stats.totalTransitDays / stats.count * 10) / 10 : 0,
        breachRate: stats.count > 0 ? Math.round((stats.breaches / stats.count) * 1000) / 10 : 0
      };
    }

    return performance;
  }

  async advanceFulfillment(orderId: string, trackingNumber?: string): Promise<void> {
    const order = await this.orderRepo.getById(orderId);
    if (!order) throw new OrderNotFoundError(orderId);

    // Point 1 & 8: Fulfillment Idempotency & Reconciliation Blocking
    if (order.reconciliationRequired || order.status === 'reconciling') {
        throw new Error('Order requires reconciliation and cannot be fulfilled.');
    }
    if (order.status === 'cancelled' || order.status === 'refunded') {
        throw new Error(`Order is ${order.status} and cannot be fulfilled.`);
    }

    if (order.fulfillmentMethod === 'shipping' && trackingNumber) {
       // Production Hardening: Use atomic field updates instead of full-document replace
       await this.orderRepo.updateStatus(orderId, 'shipped');
       await this.orderRepo.updateFulfillment(orderId, {
         trackingNumber,
         shippingCarrier: order.shippingCarrier || 'Standard',
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
    const status = next[order.status];
    if (status) { 
      await this.orderRepo.updateStatus(orderId, status); 
      await this.recordFulfillmentEvent(orderId, status as any, 'Progressed', `Moved to ${status}`); 
    }
  }

  async recordFulfillmentEvent(orderId: string, type: OrderFulfillmentEventType, label: string, description: string): Promise<void> {
    // Production Hardening: Use atomic addFulfillmentEvent instead of read-modify-write
    // to prevent concurrent write clobbering.
    const event: OrderFulfillmentEvent = { id: crypto.randomUUID(), type, label, description, at: new Date() };
    await this.orderRepo.addFulfillmentEvent(orderId, event);
  }
}
