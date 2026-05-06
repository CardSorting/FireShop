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
  IInventoryLevelRepository,
  IInventoryLocationRepository,
  IGeocodingService
} from '@domain/repositories';
import type { Order, Address, OrderItem, OrderStatus } from '@domain/models';
import { 
  PaymentFailedError, 
  CheckoutInProgressError, 
  ProductNotFoundError, 
  CartEmptyError,
  CheckoutReconciliationError 
} from '@domain/errors';
import { 
  assertValidShippingAddress, 
  assertValidOrderItems, 
  calculateCartTotal, 
  calculateShipping, 
  calculateTax,
  deriveEstimatedDeliveryDate 
} from '@domain/rules';
import { DiscountService } from '../DiscountService';
import { AuditService } from '../AuditService';
import { logger } from '@utils/logger';
import { FulfillmentService } from '@core/order/FulfillmentService';

export class CheckoutService {
  constructor(
    private orderRepo: IOrderRepository,
    private productRepo: IProductRepository,
    private cartRepo: ICartRepository,
    private discountRepo: IDiscountRepository,
    private payment: IPaymentProcessor,
    private audit: AuditService,
    private locker: ILockProvider,
    private fulfillmentService: FulfillmentService,
    private checkoutGateway?: ICheckoutGateway,
    private shippingRepo?: IShippingRepository,
    private inventoryLevelRepo?: IInventoryLevelRepository,
    private inventoryLocationRepo?: IInventoryLocationRepository,
    private geocodingService?: IGeocodingService
  ) {}

  async finalizeTrustedCheckout(
    userId: string,
    shippingAddress: Address,
    paymentMethodId: string,
    idempotencyKey?: string,
    discountCode?: string
  ): Promise<Order> {
    assertValidShippingAddress(shippingAddress);
    if (!paymentMethodId.trim()) {
      throw new PaymentFailedError('Payment method is required to finalize checkout.');
    }

    const trustedIdempotencyKey = idempotencyKey?.trim() || `trusted-checkout:${userId}:${crypto.randomUUID()}`;
    if (this.checkoutGateway) {
      return this.checkoutGateway.finalizeCheckout({
        userId,
        shippingAddress,
        paymentMethodId,
        idempotencyKey: trustedIdempotencyKey,
        discountCode,
      });
    }

    throw new PaymentFailedError(
      'Checkout finalization requires a trusted backend endpoint. Browser-side payment capture is disabled for production safety.'
    );
  }

  async initiateCheckout(
    userId: string,
    shippingAddress: Address,
    discountCode?: string,
    idempotencyKey?: string,
    paymentIntentId?: string,
    fulfillmentMethod: 'shipping' | 'pickup' | 'delivery' = 'shipping'
  ): Promise<Order> {
    // Deep Audit: Geospatial address resolution for delivery verification
    if (fulfillmentMethod === 'delivery' && !shippingAddress.coordinates && this.geocodingService) {
      try {
        const coords = await this.geocodingService.geocode(shippingAddress);
        if (coords) shippingAddress.coordinates = coords;
      } catch (err) {
        logger.error('Geocoding failure during checkout', err);
      }
    }

    assertValidShippingAddress(shippingAddress);
    const lockId = `checkout_lock:${userId}`;
    const checkoutAttemptId = crypto.randomUUID();
    const checkoutIdempotencyKey = idempotencyKey?.trim() || `checkout_init:${userId}:${checkoutAttemptId}`;

    const existingOrder = await this.orderRepo.getByIdempotencyKey(checkoutIdempotencyKey);
    if (existingOrder) return existingOrder;

    const acquired = await this.locker.acquireLock(lockId, userId, 45000);
    if (!acquired) {
      throw new CheckoutInProgressError();
    }

    try {
      const cart = await this.cartRepo.getByUserId(userId);
      if (!cart || cart.items.length === 0) {
        throw new CartEmptyError();
      }

      assertValidOrderItems(cart.items);

      let discountAmount = 0;
      let validDiscountCode: string | undefined;
      let isFreeShipping = false;

      if (discountCode) {
        const subtotal = calculateCartTotal(cart.items);
        const validation = await new DiscountService(this.discountRepo, this.audit, this.orderRepo).validateDiscount(discountCode, subtotal, userId);
        if (validation.valid) {
          discountAmount = validation.discountAmount || 0;
          validDiscountCode = validation.discount?.code;
          isFreeShipping = !!validation.isFreeShipping;
        }
      }

      const verifiedItems: OrderItem[] = [];
      const stockDeductions: { id: string; variantId?: string; delta: number }[] = [];

      for (const item of cart.items) {
        const product = await this.productRepo.getById(item.productId);
        if (!product) throw new ProductNotFoundError(item.productId);

        let price = product.price;
        let variantTitle = undefined;
        let imageUrl = product.imageUrl;

        if (item.variantId) {
          const variant = product.variants?.find(v => v.id === item.variantId);
          if (!variant) throw new Error(`Variant ${item.variantId} not found`);
          price = variant.price;
          variantTitle = variant.title;
          if (variant.imageUrl) imageUrl = variant.imageUrl;
          stockDeductions.push({ id: item.productId, variantId: item.variantId, delta: item.quantity });
        } else {
          stockDeductions.push({ id: item.productId, delta: item.quantity });
        }

        verifiedItems.push({
          productId: item.productId,
          variantId: item.variantId,
          variantTitle,
          productHandle: product.handle,
          name: product.name,
          quantity: item.quantity,
          unitPrice: price,
          imageUrl,
          digitalAssets: product.digitalAssets,
          isDigital: product.isDigital,
          shippingClassId: product.shippingClassId,
          fulfilledQty: 0,
          hsCode: (item.variantId ? product.variants?.find(v => v.id === item.variantId)?.hsCode : undefined) || product.hsCode,
        });
      }

      if (this.productRepo.batchUpdateStock) {
        await this.productRepo.batchUpdateStock(stockDeductions);
      } else {
        for (const update of stockDeductions) {
          if (update.variantId) await this.productRepo.updateVariantStock(update.variantId, update.delta);
          else await this.productRepo.updateStock(update.id, update.delta);
        }
      }

      const fulfillmentLocationId = await this.fulfillmentService.assignFulfillmentLocation({ 
        userId, 
        shippingAddress, 
        items: cart.items,
        method: fulfillmentMethod
      });

      if (fulfillmentLocationId && this.inventoryLevelRepo) {
        for (const item of cart.items) {
          await this.inventoryLevelRepo.adjustQuantity(
            item.productId, 
            fulfillmentLocationId, 
            -item.quantity, 
            `Checkout initiated (Order: ${checkoutAttemptId})`
          ).catch(err => logger.error('Failed to adjust location inventory during checkout', { productId: item.productId, fulfillmentLocationId, err }));
        }
      }

      const subtotal = verifiedItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
      let shipping = subtotal >= 10000 ? 0 : 599;
      let shippingClassId = undefined;

      if (this.shippingRepo) {
        const [rates, zones] = await Promise.all([
          this.shippingRepo.getAllRates(),
          this.shippingRepo.getAllZones()
        ]);
        const shippingResult = calculateShipping(
          verifiedItems.map(i => ({ productId: i.productId, quantity: i.quantity, priceSnapshot: i.unitPrice, shippingClassId: i.shippingClassId })),
          shippingAddress,
          rates,
          zones
        );
        shipping = shippingResult.amount;
        if (isFreeShipping) shipping = 0;
        shippingClassId = shippingResult.shippingClassId;
      }

      // Override shipping cost based on fulfillment strategy
      if (fulfillmentMethod === 'pickup') {
        shipping = 0;
      } else if (fulfillmentMethod === 'delivery' && fulfillmentLocationId) {
        // Find delivery fee for specific location
        const loc = await this.inventoryLocationRepo?.findById(fulfillmentLocationId);
        if (loc?.deliveryFee !== undefined) {
          shipping = loc.deliveryFee;
        } else {
          shipping = 499; // Default local delivery fee
        }
      }

      const taxAmount = calculateTax({ subtotal, shipping, discount: discountAmount, address: shippingAddress });
      const total = Math.max(0, subtotal + shipping + taxAmount - discountAmount);

      const order = await this.orderRepo.create({
        userId,
        items: verifiedItems,
        total,
        status: 'pending',
        shippingAddress,
        paymentTransactionId: paymentIntentId || null,
        idempotencyKey: checkoutIdempotencyKey,
        discountCode: validDiscountCode,
        discountAmount,
        shippingAmount: shipping,
        taxAmount,
        fulfillmentLocationId,
        fulfillmentMethod,
        shippingClassId,
        fulfillments: [],
        notes: [{
          id: crypto.randomUUID(),
          authorId: 'system',
          authorEmail: 'system-checkout@dreambees.art',
          text: 'Checkout initiated. Awaiting payment confirmation.',
          createdAt: new Date(),
        }],
        riskScore: 0,
        estimatedDeliveryDate: deriveEstimatedDeliveryDate({ createdAt: new Date(), status: 'pending' } as any),
        fulfillmentEvents: [this.fulfillmentService.createFulfillmentEvent('initial', 'order_placed')],
      });

      await this.audit.record({
        userId,
        userEmail: 'system-checkout@dreambees.art',
        action: 'order_placed',
        targetId: order.id,
        details: { 
          status: 'pending', 
          total, 
          items: verifiedItems.length,
          idempotencyKey: checkoutIdempotencyKey,
          fingerprint: crypto.createHash('sha256').update(`${userId}:${total}:${checkoutIdempotencyKey}`).digest('hex')
        }
      });

      if (validDiscountCode) {
        const discount = await this.discountRepo.getByCode(validDiscountCode);
        if (discount) await this.discountRepo.incrementUsage(discount.id);
      }

      return order;
    } catch (error) {
      logger.error('Order initiation failed', { userId, error });
      throw error;
    } finally {
      await this.locker.releaseLock(lockId, userId);
    }
  }

  async finalizeOrderPayment(paymentIntentId: string, stripePi?: any): Promise<Order> {
    const order = await this.orderRepo.getByPaymentTransactionId(paymentIntentId);
    if (!order) throw new Error(`Order not found for payment intent ${paymentIntentId}`);
    if (order.status === 'confirmed') return order;
    
    if (order.status === 'cancelled') {
        await this.audit.record({
            userId: order.userId,
            userEmail: 'system-reconciliation@dreambees.art',
            action: 'payment_received_on_cancelled_order',
            targetId: order.id,
            details: { paymentIntentId, status: 'manual_review_required' }
        });
        throw new Error(`Payment received for already cancelled order ${order.id}. Manual review required.`);
    }

    const riskLevel = stripePi?.charges?.data?.[0]?.outcome?.risk_level || 'unknown';
    const riskScore = stripePi?.charges?.data?.[0]?.outcome?.risk_score || 0;

    try {
        const status: OrderStatus = riskScore > 75 ? 'pending' : 'confirmed';
        await this.orderRepo.updateStatus(order.id, status);
        
        if (status === 'confirmed') {
            await this.fulfillmentService.recordFulfillmentEvent(order.id, 'payment_confirmed');
        }

        await this.cartRepo.clear(order.userId);
        
        if (order.discountCode) {
            const discount = await this.discountRepo.getByCode(order.discountCode);
            if (discount) await this.discountRepo.incrementUsage(discount.id);
        }

        const noteId = crypto.randomUUID();
        const riskNote = status === 'pending' 
            ? `PAYMENT HELD FOR REVIEW: High risk detected (${riskLevel}: ${riskScore}).` 
            : `Payment confirmed via Stripe (PI: ${paymentIntentId}). Risk: ${riskLevel} (${riskScore}).`;

        await this.orderRepo.updateNotes(order.id, [
            ...order.notes,
            {
                id: noteId,
                authorId: 'system',
                authorEmail: 'stripe-webhook@dreambees.art',
                text: riskNote,
                createdAt: new Date(),
            }
        ]);

        await this.audit.record({
          userId: order.userId,
          userEmail: 'system-webhook@dreambees.art',
          action: 'order_status_changed',
          targetId: order.id,
          details: { 
              from: order.status, 
              to: status, 
              stripeId: paymentIntentId,
              risk: { level: riskLevel, score: riskScore },
              noteId
          }
        });

        await this.orderRepo.updateRiskScore(order.id, riskScore);
        return { ...order, status };
    } catch (error) {
        logger.error('Finalize order payment failed', { paymentIntentId, error });
        throw error;
    }
  }

  async reconcilePaymentIntent(paymentIntentId: string): Promise<Order> {
    const order = await this.orderRepo.getByPaymentTransactionId(paymentIntentId);
    if (!order) throw new Error(`No order found for payment intent ${paymentIntentId}`);
    if (order.status !== 'pending') return order;

    const stripeService = new (await import('@infrastructure/services/StripeService')).StripeService();
    const pi = await stripeService.getPaymentIntent(paymentIntentId);

    if (pi.status === 'succeeded') {
      return this.finalizeOrderPayment(paymentIntentId);
    } else if (pi.status === 'canceled' || pi.status === 'requires_payment_method') {
      // Note: In a real app, this would call updateOrderStatus from OrderManagementService
      // For now, we'll keep it simple or assume OrderService handles the delegation
      throw new Error('Reconciliation requires high-level status update delegation');
    }

    return order;
  }
}
