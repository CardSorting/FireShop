import { NextResponse } from 'next/server';
import { getServerServices } from '@infrastructure/server/services';
import { 
    assertRateLimit, 
    jsonError, 
    readJsonObject, 
    requireSessionUser, 
    parseShippingAddress, 
    optionalString,
    parseIdempotencyKey
} from '@infrastructure/server/apiGuards';
import { StripeService } from '@infrastructure/services/StripeService';
import { logger } from '@utils/logger';

/**
 * [LAYER: INTERFACE]
 * Production-Hardened Payment Intent Route with Forensic Rollback
 */
export async function POST(request: Request) {
  try {
    // 1. Production Gates
    const user = await requireSessionUser();
    await assertRateLimit(request, 'checkout_init', 5, 60000); // 5 attempts per minute

    const services = await getServerServices();
    const body = await readJsonObject(request);
    
    const shippingAddress = parseShippingAddress(body.shippingAddress);
    const discountCode = optionalString(body.discountCode, 'discountCode');
    const idempotencyKey = parseIdempotencyKey(body.idempotencyKey);
    
    // 2. Initiate checkout (Deduct stock, create PENDING order)
    // Wrapped in a DB transaction inside the service
    let order;
    try {
        order = await services.orderService.initiateCheckout(
            user.id,
            shippingAddress,
            discountCode,
            idempotencyKey,
            'TBD' // Placeholder
        );
    } catch (err) {
        return jsonError(err, 'Failed to reserve inventory for checkout');
    }

    // 3. Create Stripe Payment Intent
    const stripeService = new StripeService();
    try {
        const { clientSecret, id: paymentIntentId } = await stripeService.createPaymentIntent({
          amount: order.total,
          currency: 'usd',
          userId: user.id,
          orderId: order.id,
          idempotencyKey: idempotencyKey, // Crucial for redundant request protection
          metadata: {
            orderId: order.id,
            userId: user.id,
            checkoutKey: idempotencyKey || 'none',
          }
        });

        // 4. Update order with actual Payment Intent ID
        await services.orderRepo.updatePaymentTransactionId(order.id, paymentIntentId);

        return NextResponse.json({
          clientSecret,
          paymentIntentId,
          orderId: order.id,
          amount: order.total,
        });
    } catch (stripeErr) {
        // FORENSIC ROLLBACK: If Stripe fails, we MUST cancel the order and restock immediately
        // to prevent inventory "hanging" in a pending state unnecessarily.
        logger.error(`CRITICAL: Stripe PI creation failed for order ${order.id}. Rolling back.`, stripeErr);
        
        await services.orderService.updateOrderStatus(order.id, 'cancelled', { 
            id: 'system', 
            email: 'system-rollback@dreambees.art' 
        }).catch(rollbackErr => {
            logger.error(`FATAL: Rollback failed for order ${order.id}. Manual reconciliation required.`, rollbackErr);
        });

        throw stripeErr;
    }
  } catch (error) {
    return jsonError(error, 'Checkout initiation failed');
  }
}
