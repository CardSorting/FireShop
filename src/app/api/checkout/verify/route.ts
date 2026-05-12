import { NextResponse } from 'next/server';
import { getServerServices } from '@infrastructure/server/services';
import { jsonError, requireSessionUser, requireString } from '@infrastructure/server/apiGuards';
import { StripeService } from '@infrastructure/services/StripeService';
import { logger } from '@utils/logger';

/**
 * [LAYER: INTERFACE]
 * Success-Page Verification Route (Speed-of-Light UI Feedback)
 * This route allows the client to immediately verify payment status 
 * without waiting for the asynchronous webhook.
 */
export async function GET(request: Request) {
  try {
    const user = await requireSessionUser();
    const { searchParams } = new URL(request.url);
    const paymentIntentId = requireString(searchParams.get('payment_intent'), 'payment_intent');

    const services = await getServerServices();
    const stripeService = new StripeService();
    
    // 1. Fetch PI from Stripe for authoritative status
    const pi = await stripeService.getPaymentIntent(paymentIntentId);
    
    if (pi.status === 'succeeded') {
        // 2. Authoritatively finalize if not already done by webhook
        // (OrderService.finalizeOrderPayment is idempotent)
        const order = await services.orderService.finalizeOrderPayment(paymentIntentId, pi);
        
        // Production Hardening: Verify the calling user owns this order.
        // Without this check, any authenticated user could verify/finalize any order.
        if (order.userId !== user.id) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }
        
        return NextResponse.json({
            success: true,
            orderId: order.id,
            status: order.status
        });
    }

    return NextResponse.json({
        success: false,
        status: pi.status,
        message: 'Payment not yet succeeded.'
    });

  } catch (error) {
    logger.error('Checkout verification failed', error);
    return jsonError(error, 'Verification failed');
  }
}
