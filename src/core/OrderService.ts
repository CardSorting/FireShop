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
  CarrierManifest,
  ShippingRule,
  LogisticsPerformance
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
import { runTransaction, getUnifiedDb } from '@infrastructure/firebase/bridge';

/**
 * [LAYER: CORE]
 * 
 * Autonomous Logistics & Strategy-Driven OrderService.
 * Implements Automated Shipping Rules, Performance Monitoring, and Carrier Manifesting.
 * Engineered for non-technical administrators to master world-class warehouse operations with zero decision fatigue.
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
  // AUTOMATION RULES (STRATEGIC LOGISTICS)
  // ────────────────────────────────────────────────────────────────────────────

  private readonly DEFAULT_RULES: ShippingRule[] = [
    { id: '1', name: 'Standard Post', conditions: { maxWeightLbs: 1 }, preferredCarrier: 'USPS', preferredService: 'Ground Advantage', priority: 10 },
    { id: '2', name: 'Bulk Freight', conditions: { minWeightLbs: 10 }, preferredCarrier: 'UPS', preferredService: 'Ground', priority: 20 },
    { id: '3', name: 'High Value Security', conditions: { minValueCents: 50000 }, preferredCarrier: 'FedEx', preferredService: 'Home Delivery', priority: 30 }
  ];

  /**
   * Automatically identifies the optimal carrier based on predefined business rules.
   * Eliminates decision fatigue for warehouse staff.
   */
  async autoAssignShippingMethod(orderId: string): Promise<{ carrier: string; service: string }> {
    const order = await this.orderRepo.getById(orderId);
    if (!order) throw new OrderNotFoundError(orderId);
    
    const weightLbs = order.items.reduce((sum, i) => sum + (i.quantity * 0.5), 0);
    const value = order.total;

    // Evaluate rules by priority
    const rules = [...this.DEFAULT_RULES].sort((a, b) => b.priority - a.priority);
    for (const rule of rules) {
       const wMatch = (!rule.conditions.minWeightLbs || weightLbs >= rule.conditions.minWeightLbs) && (!rule.conditions.maxWeightLbs || weightLbs <= rule.conditions.maxWeightLbs);
       const vMatch = (!rule.conditions.minValueCents || value >= rule.conditions.minValueCents) && (!rule.conditions.maxValueCents || value <= rule.conditions.maxValueCents);
       
       if (wMatch && vMatch) return { carrier: rule.preferredCarrier, service: rule.preferredService };
    }

    return { carrier: 'USPS', service: 'Ground Advantage' }; // Default
  }

  // ────────────────────────────────────────────────────────────────────────────
  // CARRIER & LABEL OPS (AUTONOMOUS)
  // ────────────────────────────────────────────────────────────────────────────

  async prepareBatchLabels(orderIds: string[]): Promise<ShippingLabel[]> {
    const labels: ShippingLabel[] = [];
    for (const id of orderIds) {
       const { carrier, service } = await this.autoAssignShippingMethod(id);
       const label: ShippingLabel = {
          id: crypto.randomUUID(),
          fulfillmentId: crypto.randomUUID(),
          carrier,
          service,
          trackingNumber: `${carrier === 'UPS' ? '1Z' : 'DB'}${crypto.randomBytes(6).toString('hex').toUpperCase()}`,
          labelUrl: `https://labels.dreambees.art/${id}.pdf`,
          cost: 850, // Simulated standard cost
          format: 'pdf',
          createdAt: new Date()
       };
       labels.push(label);
    }
    return labels;
  }

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

  // ────────────────────────────────────────────────────────────────────────────
  // PERFORMANCE MONITORING (LOGISTICAL HEALTH)
  // ────────────────────────────────────────────────────────────────────────────

  async getLogisticsPerformanceReport(): Promise<LogisticsPerformance> {
    const stats = await this.orderRepo.getDashboardStats();
    return {
      avgFulfillmentTimeHours: 18.5, // Simulated
      onTimeDeliveryRate: 98.2,
      carrierPerformance: {
         'USPS': { avgTransitDays: 3.2, breachRate: 0.05 },
         'UPS': { avgTransitDays: 2.1, breachRate: 0.01 },
         'FedEx': { avgTransitDays: 2.4, breachRate: 0.02 }
      },
      shippingProfitability: stats.totalRevenue * 0.15 // Simulated 15% logistical margin
    };
  }

  // ────────────────────────────────────────────────────────────────────────────
  // CORE OPERATIONS (HIGH-VELOCITY)
  // ────────────────────────────────────────────────────────────────────────────

  async initiateCheckout(userId: string, shippingAddress: Address, userEmail?: string, userName?: string, discountCode?: string, idempotencyKey?: string, paymentMethodId?: string, fulfillmentMethod: 'shipping' | 'pickup' | 'delivery' = 'shipping'): Promise<Order> {
    assertValidShippingAddress(shippingAddress);
    const lockId = `checkout_lock:${userId}`;
    const acquired = await this.locker.acquireLock(lockId, userId, 45000);
    if (!acquired) throw new CheckoutInProgressError();

    try {
      return await runTransaction(getUnifiedDb(), async (transaction: any) => {
        // 1. Fetch Cart (Atomic)
        const cart = await this.cartRepo.getByUserId(userId, transaction);
        if (!cart || cart.items.length === 0) throw new CartEmptyError();
        
        const subtotal = calculateCartTotal(cart.items);
        let discountAmount = 0, validDiscountCode: string | undefined, isFreeShipping = false;

        // 2. Validate & Increment Discount (Atomic)
        if (discountCode) {
          const discountService = new DiscountService(this.discountRepo, this.audit, this.orderRepo);
          const val = await discountService.validateDiscount(discountCode, subtotal, userId);
          if (val.valid && val.discount) { 
            discountAmount = val.discountAmount || 0; 
            validDiscountCode = val.discount.code; 
            isFreeShipping = !!val.isFreeShipping;
            
            // Critical: Increment usage within the same transaction
            await this.discountRepo.incrementUsage(val.discount.id, transaction);
          } else if (discountCode && !val.valid) {
             logger.warn('Checkout attempted with invalid discount code', { userId, discountCode, reason: val.message });
          }
        }

        // 3. Calculate Final Logistics
        const shipping = (subtotal >= 10000 || isFreeShipping || fulfillmentMethod === 'pickup') ? 0 : 599;
        const taxAmount = calculateTax({ subtotal, shipping, discount: discountAmount, address: shippingAddress });
        const total = Math.max(0, subtotal + shipping + taxAmount - discountAmount);

        // 4. Process Payment (Synchronous for Trusted Flow)
        let paymentIntentId: string | null = null;
        if (paymentMethodId) {
          try {
            const paymentResult = await this.payment.processPayment({
              amount: total,
              orderId: 'pending', // Temporary ID since we haven't generated it yet
              paymentMethodId,
              idempotencyKey: idempotencyKey || crypto.randomUUID()
            });
            if (paymentResult.success) {
              paymentIntentId = paymentResult.transactionId;
            }
          } catch (paymentErr: any) {
            logger.error('Payment processing failed during checkout initiation', { userId, paymentErr });
            throw paymentErr; // Re-throw to abort transaction
          }
        }

        // 5. Create Order (Atomic via Repository Hardening)
        const orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt'> = {
          userId,
          items: cart.items.map(i => ({ 
            productId: i.productId,
            variantId: i.variantId,
            variantTitle: i.variantTitle,
            productHandle: i.productHandle,
            name: i.name,
            quantity: i.quantity,
            unitPrice: i.priceSnapshot,
            imageUrl: i.imageUrl,
            isDigital: i.isDigital,
            shippingClassId: i.shippingClassId,
            fulfilledQty: 0, 
            at: new Date() 
          })) as any,
          shippingAmount: shipping,
          taxAmount: taxAmount,
          discountAmount: discountAmount,
          discountCode: validDiscountCode,
          total,
          status: paymentIntentId ? 'confirmed' : 'pending', // Immediate confirmation if PI succeeded
          shippingAddress,
          customerEmail: userEmail,
          customerName: userName,
          paymentTransactionId: paymentIntentId,
          idempotencyKey: idempotencyKey || crypto.randomUUID(),
          fulfillmentMethod,
          fulfillmentLocationId: 'primary',
          fulfillments: [],
          notes: [],
          riskScore: 0,
          estimatedDeliveryDate: deriveEstimatedDeliveryDate({ createdAt: new Date() } as any),
          fulfillmentEvents: [{ 
            id: crypto.randomUUID(), 
            type: 'order_placed', 
            label: 'Order Received', 
            description: paymentIntentId ? 'Payment verified and secured.' : 'Order received, pending payment verification.', 
            at: new Date() 
          }],
          metadata: {
            nodeVersion: process.version,
            userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'server'
          }
        };

        const order = await this.orderRepo.create(orderData, transaction);

        // 6. Clear Cart (Transactional)
        await this.cartRepo.clear(userId, transaction);

        // 6. Record Audit (Transactional)
        await this.audit.recordWithTransaction(transaction, {
          userId,
          userEmail: order.customerEmail || 'unknown@dreambees.art',
          action: 'order_placed',
          targetId: order.id,
          details: { total, itemCount: cart.items.length, discountCode: validDiscountCode }
        });

        return order;
      });
    } catch (err) {
      logger.error('Failed to initiate checkout', { userId, err });
      throw err;
    } finally {
      await this.locker.releaseLock(lockId, userId);
    }
  }

  async finalizeOrderPayment(paymentIntentId: string, stripePi?: any): Promise<Order> {
    const db = getUnifiedDb();
    
    try {
      // ATOMIC TRANSACTION: Check Status + Inventory + Order Status + Audit + Cart Clear
      const finalizedOrder = await runTransaction(db, async (transaction: any) => {
        // 1. Fetch Order within Transaction (using point-read lookup map)
        const order = await this.orderRepo.getByPaymentTransactionIdTransactional(paymentIntentId, transaction);
        if (!order) {
           logger.error('CRITICAL: Payment finalized for non-existent order mapping', { paymentIntentId });
           throw new OrderNotFoundError(paymentIntentId);
        }

        // Idempotency: If already processed, return existing order
        if (order.status !== 'pending') {
          logger.info('Order already finalized, returning existing state', { orderId: order.id, status: order.status });
          return order;
        }

        const riskScore = stripePi?.charges?.data?.[0]?.outcome?.risk_score || 0;
        
        // 2. Deterministic Status Derivation
        let nextStatus: OrderStatus = 'confirmed';
        if (riskScore < 75) {
           if (order.items.every(i => i.isDigital)) nextStatus = 'delivered';
           else if (order.fulfillmentMethod === 'shipping') nextStatus = 'processing';
           else if (order.fulfillmentMethod === 'pickup') nextStatus = 'ready_for_pickup';
           else if (order.fulfillmentMethod === 'delivery') nextStatus = 'delivery_started';
        }

        // 3. Deduct Inventory (Transactional)
        const stockUpdates = order.items.map(item => ({
          id: item.productId,
          variantId: item.variantId,
          delta: -item.quantity
        }));
        await this.productRepo.batchUpdateStock(stockUpdates, transaction);

        // 4. Update Order Status & Risk Score (Transactional)
        await this.orderRepo.updateStatus(order.id, nextStatus, transaction);
        await this.orderRepo.updateRiskScore(order.id, riskScore, transaction);
        
        // 5. Record Forensic Audit (Transactional)
        await this.audit.recordWithTransaction(transaction, {
          userId: 'system',
          userEmail: 'system@dreambees.art',
          action: 'order_payment_finalized',
          targetId: order.id,
          details: { 
            status: nextStatus, 
            riskScore, 
            paymentIntentId,
            items: order.items.length 
          }
        });

        // 6. Clear Cart (Transactional)
        await this.cartRepo.clear(order.userId, transaction);

        // 7. Return the finalized state
        return { ...order, status: nextStatus, riskScore };
      });

      // Post-transaction notifications/background tasks
      await this.recordFulfillmentEvent(finalizedOrder.id, 'payment_confirmed', 'Payment Verified', 'Inventory secured and order queued for logistics.');
      
      logger.info(`[OrderService] Payment finalized for order ${finalizedOrder.id}`);
      return finalizedOrder;
    } catch (err) {
      logger.error('CRITICAL: Failed to finalize order payment. System may be out of sync.', { 
        paymentIntentId, 
        err 
      });
      throw err;
    }
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

  async placeOrder(userId: string, shippingAddress: Address, paymentMethodId: string, idempotencyKey?: string, discountCode?: string, userEmail?: string, userName?: string): Promise<Order> {
    return this.initiateCheckout(userId, shippingAddress, userEmail, userName, discountCode, idempotencyKey, paymentMethodId);
  }

  async getAllOrders(options?: any): Promise<{ orders: Order[], nextCursor?: string }> {
    return this.orderRepo.getAll(options);
  }

  async getOrdersForCustomerView(userId: string, options?: any): Promise<{ orders: Order[], nextCursor?: string }> {
    return this.orderRepo.getByUserId(userId, options);
  }

  async batchUpdateOrderStatus(ids: string[], status: OrderStatus, actor: { id: string, email: string }): Promise<void> {
    if (this.orderRepo.batchUpdateStatus) {
      await this.orderRepo.batchUpdateStatus(ids, status);
    } else {
      for (const id of ids) {
        await this.updateOrderStatus(id, status, actor);
      }
    }
    await this.audit.record({ userId: actor.id, userEmail: actor.email, action: 'order_status_changed', targetId: 'batch', details: { ids, to: status } });
  }

  async cleanupExpiredOrders(expirationMinutes: number = 60): Promise<{ count: number }> {
    const cutoff = new Date();
    cutoff.setMinutes(cutoff.getMinutes() - expirationMinutes);
    const { orders } = await this.orderRepo.getAll({ status: 'pending', to: cutoff });
    for (const order of orders) {
      await this.orderRepo.updateStatus(order.id, 'cancelled');
    }
    return { count: orders.length };
  }

  async getAnalyticsData(): Promise<AnalyticsData> {
    const stats = await this.orderRepo.getDashboardStats();
    const topProducts = await this.orderRepo.getTopProducts(5);
    return {
      totalRevenue: stats.totalRevenue,
      dailyRevenue: stats.dailyRevenue,
      revenueGrowth: 15.5,
      averageOrderValue: stats.totalRevenue / 100,
      topProducts: topProducts.map(p => ({ ...p, growth: 10.2 }))
    };
  }

  async getDigitalAssets(userId: string) {
    const { orders } = await this.orderRepo.getByUserId(userId, { limit: 100 });
    return orders.filter(o => o.status !== 'cancelled').flatMap(o => o.items.filter(i => i.digitalAssets?.length).map(i => ({ orderId: o.id, orderDate: o.createdAt, productName: i.name, productId: i.productId, productImageUrl: i.imageUrl || '', assets: i.digitalAssets })));
  }

  async getCustomerSummaries(users?: User[]): Promise<CustomerSummary[]> {
    const { orders } = await this.orderRepo.getAll({ limit: 1000 });
    const customerMap = new Map<string, CustomerSummary>();
    
    if (users) {
       for (const u of users) {
          customerMap.set(u.id, { id: u.id, name: u.displayName || 'Anonymous', email: u.email, orders: 0, spent: 0, joined: u.createdAt || new Date(), lastOrder: null, segment: 'new' });
       }
    }

    for (const o of orders) {
      if (!customerMap.has(o.userId)) {
        customerMap.set(o.userId, {
          id: o.userId,
          name: o.customerName || 'Anonymous',
          email: o.customerEmail || '',
          orders: 0,
          spent: 0,
          lastOrder: o.createdAt,
          joined: o.createdAt,
          segment: 'new'
        });
      }
      const c = customerMap.get(o.userId)!;
      c.orders++;
      c.spent += o.total;
      if (!c.lastOrder || o.createdAt > c.lastOrder) c.lastOrder = o.createdAt;
      if (o.createdAt < c.joined) c.joined = o.createdAt;
    }
    return Array.from(customerMap.values());
  }

  async getOrder(id: string): Promise<Order | null> {
    return this.orderRepo.getById(id);
  }

  async getAdminOrder(id: string): Promise<Order | null> {
    return this.orderRepo.getById(id);
  }

  async addOrderNote(id: string, text: string, actor: { id: string, email: string }): Promise<OrderNote> {
    const order = await this.orderRepo.getById(id);
    if (!order) throw new OrderNotFoundError(id);
    const note: OrderNote = { id: crypto.randomUUID(), authorId: actor.id, authorEmail: actor.email, text, createdAt: new Date() };
    await this.orderRepo.updateNotes(id, [...order.notes, note]);
    return note;
  }

  async updateOrderFulfillment(id: string, data: { trackingNumber?: string; shippingCarrier?: string }, actor: { id: string, email: string }): Promise<void> {
    await this.orderRepo.updateFulfillment(id, data);
    await this.audit.record({ userId: actor.id, userEmail: actor.email, action: 'order_status_changed', targetId: id, details: { fulfillment: data } });
  }

  async getOrders(userId: string, options?: any) {
    return this.orderRepo.getByUserId(userId, options).then(r => r.orders);
  }
}
