import { NextResponse } from 'next/server';
import { getServerServices } from '@infrastructure/server/services';
import { jsonError, requireSessionUser, requireString } from '@infrastructure/server/apiGuards';
import { StripeService } from '@infrastructure/services/StripeService';
import { logger } from '@utils/logger';
import { DomainError, OrderNotFoundError, UnauthorizedError } from '@domain/errors';

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
    const order = await services.orderRepo.getByPaymentTransactionId(paymentIntentId);
    if (!order) throw new OrderNotFoundError(paymentIntentId);
    if (order.userId !== user.id) throw new UnauthorizedError();
    if (pi.metadata?.orderId && pi.metadata.orderId !== order.id) {
      throw new DomainError('Payment intent metadata does not match this order.');
    }
    
    if (pi.status === 'succeeded') {
        // 2. Authoritatively finalize if not already done by webhook
        // (OrderService.finalizeOrderPayment is idempotent)
        const finalizedOrder = await services.orderService.finalizeOrderPayment(paymentIntentId, pi);
        
        return NextResponse.json({
            success: true,
            orderId: finalizedOrder.id,
            status: finalizedOrder.status
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
