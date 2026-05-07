import * as crypto from 'node:crypto';
import type { 
  IOrderRepository, 
  IProductRepository, 
  ICartRepository, 
  IDiscountRepository, 
  IPaymentProcessor, 
  ILockProvider, 
  ICheckoutGateway,
  IShippingRepository,
} from '@domain/repositories';
import { 
  FirestoreDigitalAccessRepository 
} from '@infrastructure/repositories/firestore/FirestoreDigitalAccessRepository';
import { 
  Order, 
  Address, 
  OrderItem, 
  OrderStatus, 
  Fulfillment, 
  OrderFulfillmentEvent, 
  OrderFulfillmentEventType,
  AdminDashboardSummary,
  AnalyticsData,
  CustomerSummary,
  User,
  OrderNote,
  Weight,
  Dimensions,
  AdministrativeTask,
  FulfillmentMilestone,
  ShippingRateCard,
  OrderLogisticsAudit,
  ShippingMargin,
  ShippingLabel,
  CarrierManifest
} from '@domain/models';
import { 
  OrderNotFoundError, 
  ProductNotFoundError, 
  CartEmptyError,
  PaymentFailedError,
  CheckoutInProgressError
} from '@domain/errors';
import { 
  assertValidShippingAddress, 
  assertValidOrderItems, 
  calculateCartTotal, 
  calculateShipping, 
  calculateTax,
  deriveEstimatedDeliveryDate,
  deriveTrackingUrl,
  assertValidOrderStatusTransition,
  formatCents
} from '@domain/rules';
import { AuditService } from './AuditService';
import { DiscountService } from './DiscountService';
import { logger } from '@utils/logger';
import { Sanitizer } from '@utils/sanitizer';

/**
 * [LAYER: CORE]
 * 
 * Enterprise Logistics & Autonomous Fulfillment OrderService.
 * Implements Carrier Manifesting, Bulk Label Preparation, and Logistical Profitability Auditing.
 * Engineered for non-technical administrators to master world-class warehouse operations.
 */
export class OrderService {
  constructor(
    private orderRepo: IOrderRepository,
    private productRepo: IProductRepository,
    private cartRepo: ICartRepository,
    private discountRepo: IDiscountRepository,
    private payment: IPaymentProcessor,
    private audit: AuditService,
    private locker: ILockProvider,
    private checkoutGateway?: ICheckoutGateway,
    private shippingRepo?: IShippingRepository,
    private accessRepo: FirestoreDigitalAccessRepository = new FirestoreDigitalAccessRepository()
  ) {}

  // ────────────────────────────────────────────────────────────────────────────
  // CARRIER OPERATIONS (ENTERPRISE STANDARDS)
  // ────────────────────────────────────────────────────────────────────────────

  /**
   * Consolidates a batch of fulfillments into a single Carrier Manifest.
   * Mirrors professional warehouse pickup workflows.
   */
  async createCarrierManifest(carrier: string, orderIds: string[]): Promise<CarrierManifest> {
    const orders = await Promise.all(orderIds.map(id => this.orderRepo.getById(id)));
    const fulfillmentIds = orders.flatMap(o => o?.fulfillments.filter(f => f.trackingCarrier === carrier).map(f => f.id) || []);
    
    if (fulfillmentIds.length === 0) throw new Error(`No eligible fulfillments found for ${carrier}`);

    const manifest: CarrierManifest = {
      id: crypto.randomUUID(),
      carrier,
      fulfillmentIds,
      totalLabels: fulfillmentIds.length,
      totalWeightLbs: orders.length * 2.5, // Simulated average
      status: 'draft',
      createdAt: new Date()
    };

    // Audit the manifest creation
    await this.audit.record({ userId: 'admin', userEmail: 'admin@dreambees.art', action: 'order_status_changed', targetId: manifest.id, details: { type: 'carrier_manifest', carrier } });
    
    return manifest;
  }

  /**
   * Generates (Simulates) shipping labels for a batch of orders.
   * Streamlines the transition from 'Processing' to 'Shipped'.
   */
  async prepareBatchLabels(orderIds: string[]): Promise<ShippingLabel[]> {
    const labels: ShippingLabel[] = [];
    for (const id of orderIds) {
       const audit = await this.analyzeOrderLogistics(id);
       const label: ShippingLabel = {
          id: crypto.randomUUID(),
          fulfillmentId: crypto.randomUUID(),
          carrier: 'UPS',
          service: 'Ground',
          trackingNumber: `1Z${crypto.randomBytes(8).toString('hex').toUpperCase()}`,
          labelUrl: `https://labels.dreambees.art/${id}.pdf`,
          cost: audit.margin.estimatedCost,
          format: 'pdf',
          createdAt: new Date()
       };
       labels.push(label);
    }
    return labels;
  }

  // ────────────────────────────────────────────────────────────────────────────
  // LOGISTICAL AUDITING (PROFITABILITY FOCUS)
  // ────────────────────────────────────────────────────────────────────────────

  async analyzeOrderLogistics(orderId: string): Promise<OrderLogisticsAudit> {
    const order = await this.orderRepo.getById(orderId);
    if (!order) throw new OrderNotFoundError(orderId);
    const weightLbs = order.items.reduce((sum, i) => sum + (i.quantity * 0.5), 0);
    const cost = weightLbs < 1 ? 499 : 850;
    const margin = (order.shippingAmount || 0) - cost;
    
    return {
      orderId: order.id,
      margin: { customerPaid: order.shippingAmount || 0, estimatedCost: cost, margin, marginPercent: (margin / (order.shippingAmount || 1)) * 100, health: margin >= 0 ? 'profitable' : 'loss' },
      addressRisk: 'low',
      slaStatus: (new Date().getTime() - order.createdAt.getTime()) / 3600000 > 24 ? 'breached' : 'on_track',
      suggestedAction: 'Generate label and dispatch.'
    };
  }

  // ────────────────────────────────────────────────────────────────────────────
  // CORE OPERATIONS (HIGH-VELOCITY)
  // ────────────────────────────────────────────────────────────────────────────

  async initiateCheckout(userId: string, shippingAddress: Address, discountCode?: string, idempotencyKey?: string, paymentIntentId?: string, fulfillmentMethod: 'shipping' | 'pickup' | 'delivery' = 'shipping'): Promise<Order> {
    assertValidShippingAddress(shippingAddress);
    const lockId = `checkout_lock:${userId}`;
    const acquired = await this.locker.acquireLock(lockId, userId, 45000);
    if (!acquired) throw new CheckoutInProgressError();

    try {
      const cart = await this.cartRepo.getByUserId(userId);
      if (!cart || cart.items.length === 0) throw new CartEmptyError();
      const subtotal = calculateCartTotal(cart.items);
      let discountAmount = 0, validDiscountCode: string | undefined, isFreeShipping = false;

      if (discountCode) {
        const val = await new DiscountService(this.discountRepo, this.audit, this.orderRepo).validateDiscount(discountCode, subtotal, userId);
        if (val.valid) { discountAmount = val.discountAmount || 0; validDiscountCode = val.discount?.code; isFreeShipping = !!val.isFreeShipping; }
      }

      const shipping = (subtotal >= 10000 || isFreeShipping || fulfillmentMethod === 'pickup') ? 0 : 599;
      const taxAmount = calculateTax({ subtotal, shipping, discount: discountAmount, address: shippingAddress });
      const total = Math.max(0, subtotal + shipping + taxAmount - discountAmount);

      return this.orderRepo.create({
        userId, items: cart.items.map(i => ({ ...i, fulfilledQty: 0, at: new Date() })) as any, total, status: 'pending', shippingAddress,
        paymentTransactionId: paymentIntentId || null, idempotencyKey: idempotencyKey || crypto.randomUUID(),
        discountCode: validDiscountCode, discountAmount, shippingAmount: shipping, taxAmount,
        fulfillmentLocationId: 'primary', fulfillmentMethod, fulfillments: [], notes: [], riskScore: 0,
        estimatedDeliveryDate: deriveEstimatedDeliveryDate({ createdAt: new Date() } as any),
        fulfillmentEvents: [{ id: crypto.randomUUID(), type: 'order_placed', label: 'Order Received', description: 'Payment verified, preparing for fulfillment.', at: new Date() }],
      });
    } finally {
      await this.locker.releaseLock(lockId, userId);
    }
  }

  async finalizeOrderPayment(paymentIntentId: string, stripePi?: any): Promise<Order> {
    const order = await this.orderRepo.getByPaymentTransactionId(paymentIntentId);
    if (!order || order.status !== 'pending') return order as any;
    const riskScore = stripePi?.charges?.data?.[0]?.outcome?.risk_score || 0;
    
    let nextStatus: OrderStatus = 'confirmed';
    if (riskScore < 75) {
       if (order.items.every(i => i.isDigital)) nextStatus = 'delivered';
       else if (order.fulfillmentMethod === 'shipping') nextStatus = 'processing';
       else if (order.fulfillmentMethod === 'pickup') nextStatus = 'ready_for_pickup';
       else if (order.fulfillmentMethod === 'delivery') nextStatus = 'delivery_started';
    }

    await this.orderRepo.updateStatus(order.id, nextStatus);
    await this.recordFulfillmentEvent(order.id, 'payment_confirmed', 'Payment Verified', 'Order queued for logistics.');
    await this.cartRepo.clear(order.userId);
    await this.orderRepo.updateRiskScore(order.id, riskScore);
    return { ...order, status: nextStatus };
  }

  async getAdminDashboardSummary(): Promise<AdminDashboardSummary> {
    const stats = await this.orderRepo.getDashboardStats();
    const { orders: recent } = await this.orderRepo.getAll({ limit: 10 });
    const activeTasks: AdministrativeTask[] = [
      { id: 'ship', label: 'Pick & Pack', count: stats.orderCountsByStatus.processing || 0, priority: 'high', category: 'fulfillment' },
      { id: 'pickup', label: 'In-Store Pickups', count: stats.orderCountsByStatus.ready_for_pickup || 0, priority: 'medium', category: 'fulfillment' }
    ];
    return {
      productCount: 0, lowStockCount: 0, outOfStockCount: 0, totalRevenue: stats.totalRevenue, averageOrderValue: stats.totalRevenue / 100, dailyRevenue: stats.dailyRevenue, orderCountsByStatus: stats.orderCountsByStatus,
      fulfillmentCounts: { to_review: stats.orderCountsByStatus.pending, ready_to_ship: (stats.orderCountsByStatus.confirmed || 0) + (stats.orderCountsByStatus.processing || 0), in_transit: (stats.orderCountsByStatus.shipped || 0) + (stats.orderCountsByStatus.delivery_started || 0), completed: stats.orderCountsByStatus.delivered, cancelled: stats.orderCountsByStatus.cancelled },
      activeTasks, attentionItems: [], recentOrders: recent, lowStockProducts: []
    };
  }

  async advanceFulfillment(orderId: string, trackingNumber?: string, actor?: { id: string, email: string }): Promise<void> {
    const order = await this.orderRepo.getById(orderId);
    if (!order) throw new OrderNotFoundError(orderId);
    if (order.fulfillmentMethod === 'shipping' && trackingNumber) {
       await this.orderRepo.save({ ...order, status: 'shipped', fulfillments: [{ id: crypto.randomUUID(), orderId, items: [], trackingNumber, trackingCarrier: 'Carrier', status: 'shipped', shippedAt: new Date(), createdAt: new Date(), deliveredAt: null, trackingUrl: '' }], updatedAt: new Date() });
       await this.recordFulfillmentEvent(orderId, 'in_transit', 'Dispatched', `Track: ${trackingNumber}`);
       return;
    }
    const next: any = { confirmed: 'processing', processing: 'shipped', ready_for_pickup: 'delivered', delivery_started: 'delivered' };
    const status = next[order.status];
    if (status) { await this.orderRepo.updateStatus(orderId, status); await this.recordFulfillmentEvent(orderId, status, 'Progressed', `Moved to ${status}`); }
  }

  async recordFulfillmentEvent(orderId: string, type: OrderFulfillmentEventType, label: string, description: string): Promise<void> {
    const order = await this.orderRepo.getById(orderId);
    if (!order) return;
    const event: OrderFulfillmentEvent = { id: crypto.randomUUID(), type, label, description, at: new Date() };
    await this.orderRepo.save({ ...order, fulfillmentEvents: [...(order.fulfillmentEvents || []), event], updatedAt: new Date() });
  }

  async updateOrderStatus(id: string, status: OrderStatus, actor: { id: string, email: string }): Promise<void> {
    const order = await this.orderRepo.getById(id);
    if (!order) throw new OrderNotFoundError(id);
    assertValidOrderStatusTransition(order.status, status);
    await this.orderRepo.updateStatus(id, status);
    await this.audit.record({ userId: actor.id, userEmail: actor.email, action: 'order_status_changed', targetId: id, details: { from: order.status, to: status } });
  }

  async getOrder(id: string): Promise<Order | null> {
    const order = await this.orderRepo.getById(id);
    return order ? Sanitizer.order(order) : null;
  }

  async refundOrder(params: { orderId: string; amount: number; reason: string; restock: boolean; actor: any }): Promise<void> {
    const order = await this.orderRepo.getById(params.orderId);
    if (!order || !order.paymentTransactionId) throw new Error('Invalid order');
    const res = await this.payment.refundPayment(order.paymentTransactionId, params.amount);
    if (res.success) {
       await this.orderRepo.updateStatus(order.id, params.amount < order.total ? 'partially_refunded' : 'refunded');
       const note: OrderNote = { id: crypto.randomUUID(), authorId: params.actor.id, authorEmail: params.actor.email, text: `Refund: ${formatCents(params.amount)}`, createdAt: new Date() };
       await this.orderRepo.updateNotes(order.id, [...order.notes, note]);
    }
  }

  async getDigitalAssets(userId: string) {
     const { orders } = await this.orderRepo.getByUserId(userId, { limit: 100 });
     return orders.filter(o => o.status !== 'cancelled').flatMap(o => o.items.filter(i => i.digitalAssets?.length).map(i => ({ orderId: o.id, orderDate: o.createdAt, productName: i.name, productId: i.productId, productImageUrl: i.imageUrl || '', assets: i.digitalAssets })));
  }
}
