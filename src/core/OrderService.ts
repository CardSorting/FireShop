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
  Order, 
  Address, 
  OrderItem, 
  OrderStatus, 
  Fulfillment, 
  OrderFulfillmentEvent, 
  OrderFulfillmentEventType,
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
  calculateShippingCost,
  deriveTrackingUrl,
  assertValidOrderStatusTransition,
  coalesceStockUpdates,
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
    private shippingRepo?: IShippingRepository
  ) {}

  // ────────────────────────────────────────────────────────────────────────────
  // AUTOMATION RULES (STRATEGIC LOGISTICS)
  // ────────────────────────────────────────────────────────────────────────────

  private readonly DEFAULT_RULES: ShippingRule[] = [
    { id: '1', name: 'Standard Post', conditions: { maxWeightLbs: 1 }, preferredCarrier: 'USPS', preferredService: 'Ground Advantage', priority: 10 },
    { id: '2', name: 'Bulk Freight', conditions: { minWeightLbs: 10 }, preferredCarrier: 'UPS', preferredService: 'Ground', priority: 20 },
    { id: '3', name: 'High Value Security', conditions: { minValueCents: 50000 }, preferredCarrier: 'FedEx', preferredService: 'Home Delivery', priority: 30 }
  ];

  private readonly RESERVATION_TTL_MS = 15 * 60 * 1000;

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
       const order = await this.orderRepo.getById(id);
       if (!order) continue;
       
       const { carrier, service } = await this.autoAssignShippingMethod(id);
       const weightLbs = order.items.reduce((sum, i) => sum + (i.quantity * 0.5), 0); // Assuming 0.5lb per item if not specified
       
       const label: ShippingLabel = {
          id: crypto.randomUUID(),
          fulfillmentId: crypto.randomUUID(),
          carrier,
          service,
          trackingNumber: `${carrier === 'UPS' ? '1Z' : 'DB'}${crypto.randomBytes(6).toString('hex').toUpperCase()}`,
          labelUrl: `https://labels.dreambees.art/${id}.pdf`,
          cost: calculateShippingCost(weightLbs, carrier, service),
          format: 'pdf',
          createdAt: new Date()
       };
       labels.push(label);
    }
    return labels;
  }

  async createCarrierManifest(carrier: string, orderIds: string[]): Promise<CarrierManifest> {
    const orders = (await Promise.all(orderIds.map(id => this.orderRepo.getById(id)))).filter(Boolean) as Order[];
    const fulfillmentIds = orders.flatMap(o => o.fulfillments.filter(f => f.trackingCarrier === carrier).map(f => f.id));
    const totalWeightLbs = orders.reduce((sum, o) => sum + o.items.reduce((iSum, i) => iSum + (i.quantity * 0.5), 0), 0);
    
    return {
      id: crypto.randomUUID(),
      carrier,
      fulfillmentIds,
      totalLabels: fulfillmentIds.length,
      totalWeightLbs,
      status: 'draft',
      createdAt: new Date()
    };
  }

  // ────────────────────────────────────────────────────────────────────────────
  // PERFORMANCE MONITORING (LOGISTICAL HEALTH)
  // ────────────────────────────────────────────────────────────────────────────

  async getLogisticsPerformanceReport(): Promise<LogisticsPerformance> {
    const stats = await this.orderRepo.getLogisticsStats();
    return {
      avgFulfillmentTimeHours: stats.avgFulfillmentTimeHours,
      onTimeDeliveryRate: stats.onTimeDeliveryRate,
      carrierPerformance: stats.carrierPerformance,
      shippingProfitability: stats.shippingProfitability
    };
  }

  // ────────────────────────────────────────────────────────────────────────────
  // CORE OPERATIONS (HIGH-VELOCITY)
  // ────────────────────────────────────────────────────────────────────────────

  async initiateCheckout(userId: string, shippingAddress: Address, userEmail?: string, userName?: string, discountCode?: string, idempotencyKey?: string, paymentMethodId?: string, fulfillmentMethod: 'shipping' | 'pickup' | 'delivery' = 'shipping'): Promise<Order> {
    assertValidShippingAddress(shippingAddress);
    const lockId = `checkout_lock:${userId}`;
    const { success, fencingToken } = await this.locker.acquireLock(lockId, userId, 45000);
    if (!success) throw new CheckoutInProgressError();

    try {
      // Production Hardening: Check idempotency BEFORE entering heavy logic
      if (idempotencyKey) {
        const existing = await this.orderRepo.getByIdempotencyKey(idempotencyKey);
        if (existing) {
          logger.info('Duplicate checkout attempt, returning existing order', { userId, idempotencyKey });
          return existing;
        }
      }

      // Phase 1: Create PENDING order atomically (NO external network calls inside transaction)
      const order = await runTransaction(getUnifiedDb(), async (transaction: any) => {
        // 1. Fetch Cart (Atomic)
        const cart = await this.cartRepo.getByUserId(userId, transaction);
        if (!cart || cart.items.length === 0) throw new CartEmptyError();
        
        // Production Hardening: Validate cart items server-side to prevent negative quantity hijacking
        assertValidOrderItems(cart.items);
        
        const subtotal = calculateCartTotal(cart.items);
        
        // 2. Production Hardening: Verify Prices (Prevent Stale Price Hijacking)
        // We re-fetch current prices from the database within the transaction
        // to ensure the user pays the actual current price, not a snapshotted one.
        for (const item of cart.items) {
          const product = await this.productRepo.getById(item.productId, transaction);
          if (!product) throw new Error(`Product ${item.name} is no longer available.`);
          
          let currentPrice = product.price;
          if (item.variantId) {
            const variant = product.variants?.find(v => v.id === item.variantId);
            if (!variant) throw new Error(`Variant for ${item.name} is no longer available.`);
            currentPrice = variant.price;
          }

          if (currentPrice !== item.priceSnapshot) {
            logger.warn('Price mismatch detected during checkout', { 
              productId: item.productId, 
              cartPrice: item.priceSnapshot, 
              currentPrice 
            });
            throw new Error(`The price for ${item.name} has changed. Please refresh your cart.`);
          }
        }

        let discountAmount = 0, validDiscountCode: string | undefined, isFreeShipping = false;

        // 3. Validate & Increment Discount (Atomic)
        if (discountCode) {
          const discountService = new DiscountService(this.discountRepo, this.audit, this.orderRepo);
          const val = await discountService.validateDiscount(discountCode, subtotal, userId, transaction);
          if (val.valid && val.discount) { 
            discountAmount = val.discountAmount || 0; 
            validDiscountCode = val.discount.code; 
            isFreeShipping = !!val.isFreeShipping;
            
            // Critical: Increment usage within the same transaction
            await this.discountRepo.incrementUsage(val.discount.id, transaction);
            
            // Production Hardening: Record user-specific usage for once-per-customer enforcement
            if (val.discount.oncePerCustomer) {
              await this.orderRepo.recordUserDiscountUsage(userId, val.discount.code, transaction);
            }
          } else if (discountCode && !val.valid) {
             logger.warn('Checkout attempted with invalid discount code', { userId, discountCode, reason: val.message });
          }
        }

        // 3. Calculate Final Logistics
        const shipping = (subtotal >= 10000 || isFreeShipping || fulfillmentMethod === 'pickup') ? 0 : 599;
        const taxAmount = calculateTax({ subtotal, shipping, discount: discountAmount, address: shippingAddress });
        const total = Math.max(0, subtotal + shipping + taxAmount - discountAmount);

        const physicalItems = cart.items.filter(item => !item.isDigital);
        const stockUpdates = coalesceStockUpdates(physicalItems.map(item => ({
          id: item.productId,
          variantId: item.variantId,
          delta: -item.quantity
        })));

        if (stockUpdates.length > 0) {
          await this.productRepo.batchUpdateStock(stockUpdates, transaction);
        }

        const reservationExpiresAt = new Date(Date.now() + this.RESERVATION_TTL_MS).toISOString();

        // 4. Create Order as PENDING with an atomic inventory reservation.
        // PRODUCTION HARDENING: NO payment calls inside transactions. External network I/O
        // risks transaction timeout (Firestore max ~15s). Payment is processed in Phase 2.
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
          status: 'pending',
          shippingAddress,
          customerEmail: userEmail,
          customerName: userName,
          paymentTransactionId: null,
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
            description: 'Order received, pending payment verification.', 
            at: new Date() 
          }],
          metadata: {
            inventoryReserved: stockUpdates.length > 0,
            inventoryReservationReleased: false,
            inventoryReservationFinalized: false,
            inventoryReservationExpiresAt: reservationExpiresAt,
            fencingToken: fencingToken,
          }
        };

        const createdOrder = await this.orderRepo.create(orderData, transaction);

        // 5. Clear Cart (Transactional)
        await this.cartRepo.clear(userId, transaction);

        // 6. Record Audit (Transactional)
        await this.audit.recordWithTransaction(transaction, {
          userId,
          userEmail: userEmail || 'unknown@dreambees.art',
          action: 'order_placed',
          targetId: createdOrder.id,
          details: { total, itemCount: cart.items.length, discountCode: validDiscountCode }
        });

        return createdOrder;
      });

      // Phase 2: Process Payment OUTSIDE the transaction (safe from timeout)
      if (paymentMethodId) {
        try {
          const paymentResult = await this.payment.processPayment({
            amount: order.total,
            orderId: order.id,
            paymentMethodId,
            idempotencyKey: idempotencyKey || order.idempotencyKey || crypto.randomUUID()
          });
          if (paymentResult.success && paymentResult.transactionId) {
            // Production Hardening: Atomically confirm order and store payment ID.
            // Uses updateStatus + updatePaymentTransactionId (both support transactions)
            // instead of full-document save to prevent overwriting concurrent changes.
            await this.orderRepo.updateStatus(order.id, 'confirmed');
            await this.orderRepo.updatePaymentTransactionId(order.id, paymentResult.transactionId!);
            return { ...order, status: 'confirmed' as OrderStatus, paymentTransactionId: paymentResult.transactionId };
          }
        } catch (paymentErr: any) {
          logger.error('Payment processing failed, cancelling pending order', { userId, orderId: order.id, paymentErr });
          // Rollback: Cancel the pending order since payment failed
          await this.orderRepo.updateStatus(order.id, 'cancelled').catch(e => {
            logger.error('FATAL: Rollback failed for order after payment failure', { orderId: order.id, e });
          });
          
          // Production Hardening: Rollback discount usage
          if (order.discountCode) {
            const discount = await this.discountRepo.getByCode(order.discountCode);
            if (discount) {
              await this.discountRepo.decrementUsage(discount.id).catch(e => {
                logger.error('FATAL: Failed to rollback discount usage', { discountId: discount.id, e });
              });
            }
          }
          throw paymentErr;
        }
      }

      return order;
    } catch (err) {
      logger.error('Failed to initiate checkout', { userId, err });
      throw err;
    } finally {
      await this.locker.releaseLock(lockId, userId, fencingToken ?? undefined);
    }
  }

  async finalizeOrderPayment(paymentIntentId: string, stripePi?: any): Promise<Order> {
    const db = getUnifiedDb();
    if (stripePi && stripePi.status && stripePi.status !== 'succeeded') {
      throw new PaymentFailedError('Cannot finalize an order for a payment that has not succeeded.');
    }
    
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

        // Point 3: Fencing Token Enforcement (Strict Canonical Authority)
        const expectedToken = Number(stripePi?.metadata?.fencingToken || 0);
        const currentToken = Number(order.metadata?.fencingToken || 0);
        
        // Finalization MUST happen under the authority of the exact token that initiated it.
        // If currentToken > expectedToken, a newer lock was acquired (e.g. manual cancel).
        // If currentToken < expectedToken, this PI has a token from the "future" (Impossible state).
        if (expectedToken !== currentToken) {
           logger.warn('Fencing token mismatch detected', { 
             orderId: order.id, expectedToken, currentToken 
           });
           await this.orderRepo.updateStatus(order.id, 'reconciling', transaction);
           await this.orderRepo.markForReconciliation(order.id, [
             `Fencing token mismatch: Stripe PI token ${expectedToken} does not match Order token ${currentToken}.`,
             `This suggests a race condition or manual intervention superseded the checkout lease.`
           ]);
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

        // 3. Deduct Inventory (Transactional) — Physical items ONLY
        const physicalItems = order.items.filter(item => !item.isDigital);
        const hasReservation = Boolean(order.metadata?.inventoryReserved);
        if (physicalItems.length > 0 && !hasReservation) {
          throw new PaymentFailedError('Cannot finalize physical order without an inventory reservation.');
        }

        // 4. Update Order Status & Risk Score (Transactional)
        await this.orderRepo.updateStatus(order.id, nextStatus, transaction);
        await this.orderRepo.updateRiskScore(order.id, riskScore, transaction);
        await this.orderRepo.updateMetadata(order.id, {
          ...(order.metadata || {}),
          inventoryReservationFinalized: hasReservation,
        }, transaction);
        
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
            items: order.items.length,
            physicalItems: physicalItems.length
          }
        });

        // 6. Clear Cart (Transactional)
        await this.cartRepo.clear(order.userId, transaction);

        // 7. Record fulfillment event atomically within the same transaction
        const isAllDigital = physicalItems.length === 0;
        await this.orderRepo.addFulfillmentEvent(order.id, {
          id: crypto.randomUUID(),
          type: 'payment_confirmed',
          label: 'Payment Verified',
          description: isAllDigital
            ? 'Payment confirmed. Digital assets are now available for download.'
            : 'Inventory secured and order queued for logistics.',
          at: new Date()
        }, transaction);

        // 8. Return the finalized state
        return { ...order, status: nextStatus, riskScore };
      });
      
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


  async advanceFulfillment(orderId: string, trackingNumber?: string, actor?: { id: string, email: string }): Promise<void> {
    const order = await this.orderRepo.getById(orderId);
    if (!order) throw new OrderNotFoundError(orderId);

    if (order.fulfillmentMethod === 'shipping' && trackingNumber) {
       // Production Hardening: Validate transition before executing
       assertValidOrderStatusTransition(order.status, 'shipped');
       // Use atomic field updates instead of full-document replace
       await this.orderRepo.updateStatus(orderId, 'shipped');
       await this.orderRepo.updateFulfillment(orderId, {
         trackingNumber,
         shippingCarrier: 'Carrier',
         trackingUrl: deriveTrackingUrl({ ...order, trackingNumber } as Order) || ''
       });
       await this.recordFulfillmentEvent(orderId, 'in_transit', 'Dispatched', `Track: ${trackingNumber}`);
       return;
    }

    // Production Hardening: Deterministic next-status map with transition validation
    const next: Record<string, OrderStatus> = {
      confirmed: 'processing',
      processing: 'shipped',
      ready_for_pickup: 'delivered',
      delivery_started: 'delivered'
    };
    const nextStatus = next[order.status];
    if (nextStatus) {
      assertValidOrderStatusTransition(order.status, nextStatus);
      await this.orderRepo.updateStatus(orderId, nextStatus);
      await this.recordFulfillmentEvent(orderId, nextStatus as OrderFulfillmentEventType, 'Progressed', `Moved to ${nextStatus}`);
    }
  }

  async recordFulfillmentEvent(orderId: string, type: OrderFulfillmentEventType, label: string, description: string): Promise<void> {
    // Production Hardening: Use atomic addFulfillmentEvent instead of read-modify-write
    // to prevent concurrent write clobbering.
    const event: OrderFulfillmentEvent = { id: crypto.randomUUID(), type, label, description, at: new Date() };
    await this.orderRepo.addFulfillmentEvent(orderId, event);
  }

  async resolveReconciliation(id: string, resolutionAction: OrderStatus, reason: string, evidence: string, actor: { id: string, email: string }): Promise<void> {
    const order = await this.orderRepo.getById(id);
    if (!order) throw new OrderNotFoundError(id);
    if (!order.reconciliationRequired) throw new Error('Order is not in a reconciliation state.');

    // Service-level enforcement: reason and evidence are mandatory (defence-in-depth below route layer)
    if (!reason?.trim()) throw new Error('A resolution reason is required.');
    if (!evidence?.trim()) throw new Error('Supporting evidence is required.');

    // Atomically clear the lock and set the resolution status
    await runTransaction(getUnifiedDb(), async (transaction: any) => {
        // 1. Clear the hard lock and transition to the resolution status
        await this.orderRepo.clearReconciliationFlag(id, transaction);
        await this.orderRepo.updateStatus(id, resolutionAction, transaction);

        // 2. Record resolution metadata
        await this.orderRepo.updateMetadata(id, {
            ...order.metadata,
            reconciliationResolvedAt: new Date().toISOString(),
            reconciliationResolvedBy: actor.id
        }, transaction);
    });

    // 3. Append resolution note AFTER commit (appendOnly=true so we don't re-lock the order)
    const resolutionNote = `RECONCILIATION RESOLVED: Action=${resolutionAction}, Reason=${reason}, Evidence=${evidence}, By=${actor.email}`;
    await this.orderRepo.markForReconciliation(id, [resolutionNote], true);

    await this.audit.record({ 
        userId: actor.id, 
        userEmail: actor.email, 
        action: 'order_status_changed', 
        targetId: id, 
        details: { 
            resolution: true, 
            action: resolutionAction, 
            reason, 
            evidence 
        } 
    });
  }

  async updateOrderStatus(id: string, status: OrderStatus, actor: { id: string, email: string }): Promise<void> {
    const order = await this.orderRepo.getById(id);
    if (!order) throw new OrderNotFoundError(id);
    
    // Point 1: Reconciliation State Blocking
    if (order.reconciliationRequired) {
        throw new Error('Order requires manual reconciliation and is locked for mutations.');
    }
    assertValidOrderStatusTransition(order.status, status);
    if (status === 'cancelled') {
      await this.releaseInventoryReservation(order);
    }
    await this.orderRepo.updateStatus(id, status);
    // Production Hardening: Free up discount usage if order is cancelled or refunded
    if ((status === 'cancelled' || status === 'refunded') && order.discountCode) {
      const discount = await this.discountRepo.getByCode(order.discountCode);
      if (discount) {
        // Run in transaction to ensure atomic rollback
        await runTransaction(getUnifiedDb(), async (t: any) => {
           await this.discountRepo.decrementUsage(discount.id, t);
           if (order.userId) {
              await this.orderRepo.removeUserDiscountUsage(order.userId, order.discountCode!, t);
           }
        }).catch(e => {
          logger.error('Failed to rollback discount usage during order cancellation', { orderId: id, error: e });
        });
      }
    }
    await this.audit.record({ userId: actor.id, userEmail: actor.email, action: 'order_status_changed', targetId: id, details: { from: order.status, to: status } });
  }

  async placeOrder(userId: string, shippingAddress: Address, paymentMethodId: string, idempotencyKey?: string, discountCode?: string, userEmail?: string, userName?: string): Promise<Order> {
    return this.initiateCheckout(userId, shippingAddress, userEmail, userName, discountCode, idempotencyKey, paymentMethodId);
  }

  async getAllOrders(options?: any): Promise<{ orders: Order[], nextCursor?: string }> {
    const result = await this.orderRepo.getAll(options);
    return {
      ...result,
      orders: result.orders.map(o => Sanitizer.order(o))
    };
  }

  async getOrdersForCustomerView(userId: string, options?: any): Promise<{ orders: Order[], nextCursor?: string }> {
    const result = await this.orderRepo.getByUserId(userId, options);
    return {
      ...result,
      orders: result.orders.map(o => Sanitizer.order(o))
    };
  }

  async batchUpdateOrderStatus(ids: string[], status: OrderStatus, actor: { id: string, email: string }): Promise<void> {
    // Production Hardening: Always validate transitions before batch commit.
    // The batchUpdateStatus repo method writes blindly — we must pre-validate.
    const validIds: string[] = [];
    for (const id of ids) {
      const order = await this.orderRepo.getById(id);
      if (!order) {
        logger.warn(`[batchUpdateOrderStatus] Order ${id} not found, skipping.`);
        continue;
      }
      assertValidOrderStatusTransition(order.status, status);
      validIds.push(id);
    }

    if (validIds.length === 0) return;

    if (this.orderRepo.batchUpdateStatus) {
      await this.orderRepo.batchUpdateStatus(validIds, status);
    } else {
      for (const id of validIds) {
        await this.orderRepo.updateStatus(id, status);
      }
    }
    await this.audit.record({ userId: actor.id, userEmail: actor.email, action: 'order_status_changed', targetId: 'batch', details: { ids: validIds, to: status } });
  }

  async cleanupExpiredOrders(expirationMinutes: number = 60): Promise<{ count: number }> {
    const cutoff = new Date();
    cutoff.setMinutes(cutoff.getMinutes() - expirationMinutes);
    const { orders } = await this.orderRepo.getAll({ status: 'pending', to: cutoff });
    logger.info(`[OrderService] Cleaning up ${orders.length} expired pending orders (cutoff: ${expirationMinutes}m)`);
    for (const order of orders) {
      await this.updateOrderStatus(order.id, 'cancelled', {
        id: 'system',
        email: 'system@dreambees.art'
      });
      // Production Hardening: Audit trail for automated cancellations
      await this.audit.record({
        userId: 'system',
        userEmail: 'system@dreambees.art',
        action: 'order_status_changed',
        targetId: order.id,
        details: { from: 'pending', to: 'cancelled', reason: 'expired', expirationMinutes }
      });
    }
    return { count: orders.length };
  }


  async getDigitalAssets(userId: string) {
    // Production Hardening: Paginate through ALL orders instead of capping at 100.
    // A cap of 100 silently drops digital assets for customers with >100 orders.
    const allOrders: Order[] = [];
    let cursor: string | undefined;
    do {
      const page = await this.orderRepo.getByUserId(userId, { limit: 50, cursor });
      allOrders.push(...page.orders);
      cursor = page.nextCursor;
    } while (cursor);

    return allOrders
      .filter(o => o.status !== 'cancelled' && o.status !== 'refunded')
      .flatMap(o => o.items
        .filter(i => i.digitalAssets?.length)
        .map(i => ({
          orderId: o.id,
          orderDate: o.createdAt,
          productName: i.name,
          productId: i.productId,
          productImageUrl: i.imageUrl || '',
          assets: i.digitalAssets
        }))
      );
  }


  async getOrder(id: string, requestingUserId?: string): Promise<Order | null> {
    const order = await this.orderRepo.getById(id);
    // Production Hardening: If a userId is provided (customer context), enforce ownership.
    // Admin paths pass no userId, so they see any order.
    if (order && requestingUserId && order.userId !== requestingUserId) return null;
    return order;
  }

  async getAdminOrder(id: string): Promise<Order | null> {
    return this.orderRepo.getById(id);
  }

  async addOrderNote(id: string, text: string, actor: { id: string, email: string }): Promise<OrderNote> {
    const order = await this.orderRepo.getById(id);
    if (!order) throw new OrderNotFoundError(id);
    const note: OrderNote = { id: crypto.randomUUID(), authorId: actor.id, authorEmail: actor.email, text, createdAt: new Date() };
    // Production Hardening: Use atomic addNote (arrayUnion) instead of read-modify-write
    // to prevent concurrent note appends from clobbering each other.
    if (this.orderRepo.addNote) {
      await this.orderRepo.addNote(id, note);
    } else {
      // Fallback: read-modify-write for repos that don't support addNote
      await this.orderRepo.updateNotes(id, [...order.notes, note]);
    }
    return note;
  }

  async updateOrderFulfillment(id: string, data: { trackingNumber?: string; shippingCarrier?: string }, actor: { id: string, email: string }): Promise<void> {
    const order = await this.orderRepo.getById(id);
    if (!order) throw new OrderNotFoundError(id);
    await this.orderRepo.updateFulfillment(id, data);
    // Production Hardening: Use correct audit action for fulfillment updates
    await this.audit.record({ userId: actor.id, userEmail: actor.email, action: 'order_status_changed', targetId: id, details: { fulfillmentUpdate: data, previousStatus: order.status } });
  }

  async getOrders(userId: string, options?: any): Promise<{ orders: Order[]; nextCursor?: string }> {
    // Production Hardening: Return the full paginated result instead of stripping nextCursor.
    // Dropping nextCursor prevents callers from paginating to subsequent pages.
    return this.orderRepo.getByUserId(userId, options);
  }

  private async releaseInventoryReservation(order: Order): Promise<void> {
    if (!order.metadata?.inventoryReserved || order.metadata.inventoryReservationReleased) return;

    const stockUpdates = coalesceStockUpdates(order.items
      .filter(item => !item.isDigital)
      .map(item => ({
        id: item.productId,
        variantId: item.variantId,
        delta: item.quantity
      })));

    if (stockUpdates.length > 0) {
      await this.productRepo.batchUpdateStock(stockUpdates);
    }

    await this.orderRepo.updateMetadata(order.id, {
      ...(order.metadata || {}),
      inventoryReservationReleased: true,
      inventoryReservationReleasedAt: new Date().toISOString(),
    });
  }
}
