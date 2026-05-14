import * as crypto from 'node:crypto';
import type {
  ICartRepository,
  IDiscountRepository,
  ILockProvider,
  IOrderRepository,
  IPaymentProcessor,
  IProductRepository,
  IShippingRepository,
} from '@domain/repositories';
import type { Address, Order, OrderStatus } from '@domain/models';
import { CartEmptyError, CheckoutInProgressError, OrderNotFoundError, PaymentFailedError } from '@domain/errors';
import {
  assertValidOrderItems,
  assertValidShippingAddress,
  calculateCartTotal,
  calculateShipping,
  calculateTax,
  coalesceStockUpdates,
  deriveEstimatedDeliveryDate,
} from '@domain/rules';
import { runTransaction, getUnifiedDb } from '@infrastructure/firebase/bridge';
import { AuditService } from '../AuditService';
import { DiscountService } from '../DiscountService';
import { logger } from '@utils/logger';
import type { FulfillmentMethod } from './types';

export class OrderCheckoutService {
  private readonly RESERVATION_TTL_MS = 15 * 60 * 1000;

  constructor(
    private orderRepo: IOrderRepository,
    private productRepo: IProductRepository,
    private cartRepo: ICartRepository,
    private discountRepo: IDiscountRepository,
    private payment: IPaymentProcessor,
    private audit: AuditService,
    private locker: ILockProvider,
    private shippingRepo?: IShippingRepository
  ) {}

  async initiateCheckout(
    userId: string,
    shippingAddress: Address,
    userEmail?: string,
    userName?: string,
    discountCode?: string,
    idempotencyKey?: string,
    paymentMethodId?: string,
    fulfillmentMethod: FulfillmentMethod = 'shipping'
  ): Promise<Order> {
    assertValidShippingAddress(shippingAddress);
    const lockId = `checkout_lock:${userId}`;
    const lockResult = this.normalizeLockResult(await this.locker.acquireLock(lockId, userId, 45000));
    if (!lockResult.success) throw new CheckoutInProgressError();

    try {
      if (idempotencyKey) {
        const existing = await this.orderRepo.getByIdempotencyKey(idempotencyKey);
        if (existing) {
          logger.info('Duplicate checkout attempt, returning existing order', { userId, idempotencyKey });
          return existing;
        }
      }

      const order = await runTransaction(getUnifiedDb(), async (transaction: any) => {
        const cart = await this.cartRepo.getByUserId(userId, transaction);
        if (!cart || cart.items.length === 0) throw new CartEmptyError();

        assertValidOrderItems(cart.items);
        const subtotal = calculateCartTotal(cart.items);

        const productMap = new Map<string, any>();
        for (const item of cart.items) {
          const product = await this.productRepo.getById(item.productId, transaction);
          if (!product) throw new Error(`Product ${item.name} is no longer available.`);
          productMap.set(item.productId, product);

          let currentPrice = product.price;
          if (item.variantId) {
            const variant = product.variants?.find((v: any) => v.id === item.variantId);
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

        let discountAmount = 0;
        let validDiscountCode: string | undefined;
        let isFreeShipping = false;

        if (discountCode) {
          const discountService = new DiscountService(this.discountRepo, this.audit, this.orderRepo);
          const validation = await discountService.validateDiscount(discountCode, subtotal, userId, transaction);
          if (validation.valid && validation.discount) {
            discountAmount = validation.discountAmount || 0;
            validDiscountCode = validation.discount.code;
            isFreeShipping = !!validation.isFreeShipping;

            await this.discountRepo.incrementUsage(validation.discount.id, transaction);

            if (validation.discount.oncePerCustomer) {
              await this.orderRepo.recordUserDiscountUsage(userId, validation.discount.code, transaction);
            }
          } else if (!validation.valid) {
            logger.warn('Checkout attempted with invalid discount code', { userId, discountCode, reason: validation.message });
          }
        }

        const [allRates, allZones] = this.shippingRepo
          ? await Promise.all([this.shippingRepo.getAllRates(), this.shippingRepo.getAllZones()])
          : [[], []];

        const shippingResult = calculateShipping(cart.items, shippingAddress, allRates, allZones);
        const shipping = (subtotal >= 10000 || isFreeShipping || fulfillmentMethod === 'pickup') ? 0 : shippingResult.amount;
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
        const orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt'> = {
          userId,
          items: cart.items.map(item => {
            const product = productMap.get(item.productId);
            return {
              productId: item.productId,
              variantId: item.variantId,
              variantTitle: item.variantTitle,
              productHandle: item.productHandle,
              name: item.name,
              quantity: item.quantity,
              unitPrice: item.priceSnapshot,
              imageUrl: item.imageUrl,
              isDigital: item.isDigital,
              digitalAssets: item.isDigital ? (product?.digitalAssets || []) : [],
              shippingClassId: item.shippingClassId,
              fulfilledQty: 0,
              at: new Date()
            };
          }) as any,
          shippingAmount: shipping,
          taxAmount,
          discountAmount,
          discountCode: validDiscountCode,
          total,
          status: 'pending',
          shippingAddress,
          shippingClassId: shippingResult.shippingClassId,
          shippingCarrier: shippingResult.carrier,
          customerEmail: userEmail,
          customerName: userName,
          paymentTransactionId: null,
          idempotencyKey: idempotencyKey || crypto.randomUUID(),
          fulfillmentMethod,
          fulfillmentLocationId: 'primary',
          fulfillments: [],
          notes: [],
          customerNote: cart.note,
          metadata: {
            shippingRateName: shippingResult.rateName,
            shippingServiceCode: shippingResult.serviceCode,
            inventoryReserved: stockUpdates.length > 0,
            inventoryReservationReleased: false,
            inventoryReservationFinalized: false,
            inventoryReservationExpiresAt: reservationExpiresAt,
            fencingToken: lockResult.fencingToken,
          },
          riskScore: 0,
          estimatedDeliveryDate: deriveEstimatedDeliveryDate({ createdAt: new Date() } as any),
          fulfillmentEvents: [{
            id: crypto.randomUUID(),
            type: 'order_placed',
            label: 'Order Received',
            description: 'Order received, pending payment verification.',
            at: new Date()
          }],
        };

        const createdOrder = await this.orderRepo.create(orderData, transaction);
        await this.cartRepo.clear(userId, transaction);
        await this.audit.recordWithTransaction(transaction, {
          userId,
          userEmail: userEmail || 'unknown@dreambees.art',
          action: 'order_placed',
          targetId: createdOrder.id,
          details: { total, itemCount: cart.items.length, discountCode: validDiscountCode, hasCustomerNote: !!cart.note },
          correlationId: idempotencyKey || undefined
        });

        return createdOrder;
      });

      if (!paymentMethodId) return order;

      try {
        const paymentResult = await this.payment.processPayment({
          amount: order.total,
          orderId: order.id,
          paymentMethodId,
          idempotencyKey: idempotencyKey || order.idempotencyKey || crypto.randomUUID()
        });

        if (paymentResult.success && paymentResult.transactionId) {
          await this.orderRepo.updateStatus(order.id, 'confirmed');
          await this.orderRepo.updatePaymentTransactionId(order.id, paymentResult.transactionId);
          return { ...order, status: 'confirmed' as OrderStatus, paymentTransactionId: paymentResult.transactionId };
        }
      } catch (paymentErr: any) {
        logger.error('Payment processing failed, cancelling pending order', { userId, orderId: order.id, paymentErr });
        await this.orderRepo.updateStatus(order.id, 'cancelled').catch(err => {
          logger.error('FATAL: Rollback failed for order after payment failure', { orderId: order.id, err });
        });

        if (order.discountCode) {
          const discount = await this.discountRepo.getByCode(order.discountCode);
          if (discount) {
            await this.discountRepo.decrementUsage(discount.id).catch(err => {
              logger.error('FATAL: Failed to rollback discount usage', { discountId: discount.id, err });
            });
          }
        }

        throw paymentErr;
      }

      return order;
    } catch (err) {
      logger.error('Failed to initiate checkout', { userId, err });
      throw err;
    } finally {
      await this.locker.releaseLock(lockId, userId, lockResult.fencingToken ?? undefined);
    }
  }

  async finalizeOrderPayment(paymentIntentId: string, stripePi?: any): Promise<Order> {
    const db = getUnifiedDb();
    if (stripePi && stripePi.status && stripePi.status !== 'succeeded') {
      throw new PaymentFailedError('Cannot finalize an order for a payment that has not succeeded.');
    }

    try {
      const finalizedOrder = await runTransaction(db, async (transaction: any) => {
        const order = await this.orderRepo.getByPaymentTransactionIdTransactional(paymentIntentId, transaction);
        if (!order) {
          logger.error('CRITICAL: Payment finalized for non-existent order mapping', { paymentIntentId });
          throw new OrderNotFoundError(paymentIntentId);
        }

        if (order.status !== 'pending') {
          logger.info('Order already finalized, returning existing state', { orderId: order.id, status: order.status });
          return order;
        }

        const expectedToken = Number(stripePi?.metadata?.fencingToken || 0);
        const currentToken = Number(order.metadata?.fencingToken || 0);
        if (expectedToken !== currentToken) {
          logger.warn('Fencing token mismatch detected', { orderId: order.id, expectedToken, currentToken });
          await this.orderRepo.updateStatus(order.id, 'reconciling', transaction);
          await this.orderRepo.markForReconciliation(order.id, [
            `Fencing token mismatch: Stripe PI token ${expectedToken} does not match Order token ${currentToken}.`,
            'This suggests a race condition or manual intervention superseded the checkout lease.'
          ]);
          return order;
        }

        const riskScore = stripePi?.charges?.data?.[0]?.outcome?.risk_score || 0;
        let nextStatus: OrderStatus = 'confirmed';
        if (riskScore < 75) {
          if (order.items.every(item => item.isDigital)) nextStatus = 'delivered';
          else if (order.fulfillmentMethod === 'shipping') nextStatus = 'processing';
          else if (order.fulfillmentMethod === 'pickup') nextStatus = 'ready_for_pickup';
          else if (order.fulfillmentMethod === 'delivery') nextStatus = 'delivery_started';
        }

        const physicalItems = order.items.filter(item => !item.isDigital);
        const hasReservation = Boolean(order.metadata?.inventoryReserved);
        if (physicalItems.length > 0 && !hasReservation) {
          throw new PaymentFailedError('Cannot finalize physical order without an inventory reservation.');
        }

        await this.orderRepo.updateStatus(order.id, nextStatus, transaction);
        await this.orderRepo.updateRiskScore(order.id, riskScore, transaction);
        await this.orderRepo.updateMetadata(order.id, {
          ...(order.metadata || {}),
          inventoryReservationFinalized: hasReservation,
        }, transaction);

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
          },
          correlationId: (stripePi?.metadata?.correlationId as string) || paymentIntentId
        });

        await this.cartRepo.clear(order.userId, transaction);
        await this.orderRepo.addFulfillmentEvent(order.id, {
          id: crypto.randomUUID(),
          type: 'payment_confirmed',
          label: 'Payment Verified',
          description: physicalItems.length === 0
            ? 'Payment confirmed. Digital assets are now available for download.'
            : 'Inventory secured and order queued for logistics.',
          at: new Date()
        }, transaction);

        return { ...order, status: nextStatus, riskScore };
      });

      logger.info(`[OrderService] Payment finalized for order ${finalizedOrder.id}`);
      return finalizedOrder;
    } catch (err) {
      logger.error('CRITICAL: Failed to finalize order payment. System may be out of sync.', { paymentIntentId, err });
      throw err;
    }
  }

  private normalizeLockResult(result: { success: boolean; fencingToken: number | null } | boolean): { success: boolean; fencingToken: number | null } {
    if (typeof result === 'boolean') return { success: result, fencingToken: null };
    return result;
  }
}
