import * as crypto from 'node:crypto';
import type { IOrderRepository, IProductRepository } from '@domain/repositories';
import type { CarrierManifest, LogisticsPerformance, Order, ShippingLabel, ShippingRule } from '@domain/models';
import { OrderNotFoundError } from '@domain/errors';
import { calculateShippingCost } from '@domain/rules';

export class OrderLogisticsService {
  private readonly DEFAULT_RULES: ShippingRule[] = [
    { id: '1', name: 'Standard Post', conditions: { maxWeightLbs: 1 }, preferredCarrier: 'USPS', preferredService: 'Ground Advantage', priority: 10 },
    { id: '2', name: 'Bulk Freight', conditions: { minWeightLbs: 10 }, preferredCarrier: 'UPS', preferredService: 'Ground', priority: 20 },
    { id: '3', name: 'High Value Security', conditions: { minValueCents: 50000 }, preferredCarrier: 'FedEx', preferredService: 'Home Delivery', priority: 30 }
  ];

  constructor(
    private orderRepo: IOrderRepository,
    private productRepo: IProductRepository
  ) {}

  async autoAssignShippingMethod(orderId: string): Promise<{ carrier: string; service: string }> {
    const order = await this.orderRepo.getById(orderId);
    if (!order) throw new OrderNotFoundError(orderId);

    const weightLbs = await this.calculateOrderWeight(order, 0.1);
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

  // RETIRED: Labels cannot be created directly in the backend. 
  // Use exportOrdersToPirateShipCsv instead.
  /*
  async prepareBatchLabels(orderIds: string[]): Promise<ShippingLabel[]> {
    ...
  }
  */

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
      totalWeightLbs: (await Promise.all(orders.map(o => this.calculateOrderWeight(o, 0.1)))).reduce((sum, w) => sum + w, 0),
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

  async exportOrdersToPirateShipCsv(
    orderIds: string[], 
    packageDimensions?: { length: string; width: string; height: string },
    tareWeightLbs: number = 0.1
  ): Promise<string> {
    const orders = (await Promise.all(orderIds.map(id => this.orderRepo.getById(id)))).filter(Boolean) as Order[];
    
    const headers = [
      'Order ID',
      'Recipient Name',
      'Recipient Email',
      'Recipient Phone',
      'Recipient Company',
      'Address Line 1', 
      'Address Line 2', 
      'City', 
      'State Code', 
      'Zipcode', 
      'Country Code',
      'Order Items Summary',
      'Total Weight (Lbs)',
      'Total Weight (Oz)',
      'Length (in)',
      'Width (in)',
      'Height (in)',
      'Customs Description',
      'Customs Value (USD)',
      'Customs HS Code',
      'Rubber Stamp 1 (Order #)',
      'Rubber Stamp 2 (Items)',
      'Notes'
    ];

    const rows = await Promise.all(orders.map(async (order) => {
      const addr = order.shippingAddress;
      const itemSummary = order.items.map(i => `${i.name} x${i.quantity}`).join(', ');
      const weightLbs = await this.calculateOrderWeight(order, tareWeightLbs);
      const weightOz = weightLbs * 16;
      
      // Extraction from parameters, metadata or defaults
      const length = packageDimensions?.length || order.metadata?.packageLength || '6'; 
      const width = packageDimensions?.width || order.metadata?.packageWidth || '4';
      const height = packageDimensions?.height || order.metadata?.packageHeight || '1';
      const company = (order.metadata?.company || '').slice(0, 35); // Pirate Ship limit
      
      // Robust Address Sanitization: Truncate and clean for carrier compatibility
      const addr1 = addr.street.slice(0, 35);
      const address2 = (order.metadata?.address2 || '').slice(0, 35);
      
      const phone = (addr.phone || order.metadata?.phone || '').replace(/[^0-9+]/g, '');
      
      const isInternational = addr.country !== 'US';
      const customsDesc = isInternational ? (order.metadata?.customsDescription || 'Artistic Goods').slice(0, 40) : '';
      const customsValue = isInternational ? (order.total / 100).toFixed(2) : '';
      const hsCode = isInternational ? (order.items[0]?.hsCode || order.metadata?.hsCode || '') : '';
      
      // World-Class Detail: Include what the customer actually paid for
      const shippingChoice = order.shippingClassId || 'Standard Shipping';

      return [
        order.id,
        (order.customerName || 'Customer').slice(0, 35),
        order.customerEmail || '',
        phone,
        company,
        addr1,
        address2,
        addr.city.slice(0, 30),
        (addr.state || '').toUpperCase().slice(0, 2), // Standard State Code
        (addr.zip || addr.zipCode || '').slice(0, 10),
        (addr.country || 'US').toUpperCase().slice(0, 2),
        itemSummary,
        weightLbs.toFixed(2),
        weightOz.toFixed(2),
        length,
        width,
        height,
        customsDesc,
        customsValue,
        hsCode,
        `#${order.id.slice(0, 8).toUpperCase()}`,
        shippingChoice, // Stamp 2: Tell the merchant what service to buy
        order.notes.length > 0 ? order.notes[order.notes.length - 1].text : ''
      ].map(val => {
        const s = String(val ?? '');
        if (s.includes(',') || s.includes('"') || s.includes('\n')) {
          return `"${s.replace(/"/g, '""')}"`;
        }
        return s;
      }).join(',');
    }));

    return [headers.join(','), ...rows].join('\n');
  }

  private async calculateOrderWeight(order: Order, tareWeightLbs: number): Promise<number> {
    let totalWeightLbs = 0;
    
    for (const item of order.items) {
      if (item.isDigital) continue;
      
      try {
        const product = await this.productRepo.getById(item.productId);
        if (product && product.weightGrams) {
          totalWeightLbs += (product.weightGrams * 0.00220462) * item.quantity;
        } else {
          totalWeightLbs += item.quantity * 0.5;
        }
      } catch (err) {
        totalWeightLbs += item.quantity * 0.5;
      }
    }
    
    return totalWeightLbs + tareWeightLbs;
  }
}
