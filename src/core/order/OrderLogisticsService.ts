import * as crypto from 'node:crypto';
import type { IOrderRepository } from '@domain/repositories';
import type { CarrierManifest, LogisticsPerformance, Order, ShippingLabel, ShippingRule } from '@domain/models';
import { OrderNotFoundError } from '@domain/errors';
import { calculateShippingCost } from '@domain/rules';

export class OrderLogisticsService {
  private readonly DEFAULT_RULES: ShippingRule[] = [
    { id: '1', name: 'Standard Post', conditions: { maxWeightLbs: 1 }, preferredCarrier: 'USPS', preferredService: 'Ground Advantage', priority: 10 },
    { id: '2', name: 'Bulk Freight', conditions: { minWeightLbs: 10 }, preferredCarrier: 'UPS', preferredService: 'Ground', priority: 20 },
    { id: '3', name: 'High Value Security', conditions: { minValueCents: 50000 }, preferredCarrier: 'FedEx', preferredService: 'Home Delivery', priority: 30 }
  ];

  constructor(private orderRepo: IOrderRepository) {}

  async autoAssignShippingMethod(orderId: string): Promise<{ carrier: string; service: string }> {
    const order = await this.orderRepo.getById(orderId);
    if (!order) throw new OrderNotFoundError(orderId);

    const weightLbs = this.calculateOrderWeight(order);
    const rules = [...this.DEFAULT_RULES].sort((a, b) => b.priority - a.priority);

    for (const rule of rules) {
      const weightMatches = (!rule.conditions.minWeightLbs || weightLbs >= rule.conditions.minWeightLbs)
        && (!rule.conditions.maxWeightLbs || weightLbs <= rule.conditions.maxWeightLbs);
      const valueMatches = (!rule.conditions.minValueCents || order.total >= rule.conditions.minValueCents)
        && (!rule.conditions.maxValueCents || order.total <= rule.conditions.maxValueCents);

      if (weightMatches && valueMatches) {
        return { carrier: rule.preferredCarrier, service: rule.preferredService };
      }
    }

    return { carrier: 'USPS', service: 'Ground Advantage' };
  }

  async prepareBatchLabels(orderIds: string[]): Promise<ShippingLabel[]> {
    const labels: ShippingLabel[] = [];

    for (const id of orderIds) {
      const order = await this.orderRepo.getById(id);
      if (!order) continue;

      const { carrier, service } = await this.autoAssignShippingMethod(id);
      const weightLbs = this.calculateOrderWeight(order);

      labels.push({
        id: crypto.randomUUID(),
        fulfillmentId: crypto.randomUUID(),
        carrier,
        service,
        trackingNumber: `${carrier === 'UPS' ? '1Z' : 'DB'}${crypto.randomBytes(6).toString('hex').toUpperCase()}`,
        labelUrl: `https://labels.dreambees.art/${id}.pdf`,
        cost: calculateShippingCost(weightLbs, carrier, service),
        format: 'pdf',
        createdAt: new Date()
      });
    }

    return labels;
  }

  async createCarrierManifest(carrier: string, orderIds: string[]): Promise<CarrierManifest> {
    const orders = (await Promise.all(orderIds.map(id => this.orderRepo.getById(id)))).filter(Boolean) as Order[];
    const fulfillmentIds = orders.flatMap(order =>
      order.fulfillments.filter(fulfillment => fulfillment.trackingCarrier === carrier).map(fulfillment => fulfillment.id)
    );

    return {
      id: crypto.randomUUID(),
      carrier,
      fulfillmentIds,
      totalLabels: fulfillmentIds.length,
      totalWeightLbs: orders.reduce((sum, order) => sum + this.calculateOrderWeight(order), 0),
      status: 'draft',
      createdAt: new Date()
    };
  }

  async getLogisticsPerformanceReport(): Promise<LogisticsPerformance> {
    const stats = await this.orderRepo.getLogisticsStats();
    return {
      avgFulfillmentTimeHours: stats.avgFulfillmentTimeHours,
      onTimeDeliveryRate: stats.onTimeDeliveryRate,
      carrierPerformance: stats.carrierPerformance,
      shippingProfitability: stats.shippingProfitability
    };
  }

  private calculateOrderWeight(order: Order): number {
    return order.items.reduce((sum, item) => sum + item.quantity * 0.5, 0);
  }
}
