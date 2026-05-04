import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getServerServices } from '@infrastructure/server/services';
import { StripeService } from '@infrastructure/services/StripeService';
import { logger } from '@utils/logger';

export async function POST(request: Request) {
  const body = await request.text();
  const signature = (await headers()).get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }

  const stripeService = new StripeService();
  let event;

  try {
    event = stripeService.constructEvent(body, signature);
  } catch (err) {
    logger.error('Webhook signature verification failed', err);
    return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 });
  }

  const services = await getServerServices();

  try {
    // 1. Atomic Idempotency Check: Prevent duplicate processing of the same event
    const alreadyProcessed = await stripeService.tryProcessEvent(event.id, event.type);
    if (alreadyProcessed) {
      logger.info(`Webhook event ${event.id} already processed. Skipping.`);
      return Response.json({ received: true, duplicate: true });
    }

    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object;
        logger.info(`Processing payment_intent.succeeded: ${paymentIntent.id}`);
        
        await services.orderService.finalizeOrderPayment(paymentIntent.id, paymentIntent);
        break;
      }
      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object;
        logger.warn(`Processing payment_intent.payment_failed: ${paymentIntent.id}`);
        
        const order = await services.orderRepo.getByPaymentTransactionId(paymentIntent.id);
        if (order && order.status === 'pending') {
            await services.orderService.updateOrderStatus(order.id, 'cancelled', { 
                id: 'system', 
                email: 'stripe-webhook@dreambees.art' 
            });
        }
        break;
      }
      default:
        logger.info(`Unhandled event type: ${event.type}`);
    }

    return Response.json({ received: true });
  } catch (error) {
    logger.error('Error processing Stripe webhook', error);
    return NextResponse.json({ error: 'Internal server error processing webhook' }, { status: 500 });
  }
}

// Stripe webhooks need raw body, so we disable the default body parser if necessary
// In Next.js App Router, request.text() is already raw enough.
