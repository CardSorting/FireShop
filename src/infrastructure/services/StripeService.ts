/**
 * [LAYER: INFRASTRUCTURE]
 * Industrialized Stripe Service for End-to-End Payment Flows.
 * Firestore Implementation for event tracking.
 */
import Stripe from 'stripe';
import { PaymentFailedError } from '@domain/errors';
import { logger } from '@utils/logger';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase/firebase';

export class StripeService {
  private stripe: Stripe;
  private readonly collectionName = 'stripe_webhook_events';

  constructor() {
    const secretKey = process.env.STRIPE_SECRET_KEY?.trim();
    if (!secretKey) {
      logger.warn('STRIPE_SECRET_KEY is missing. Stripe integration will be disabled.');
    }
    this.stripe = new Stripe(secretKey || '', {
      apiVersion: '2025-02-11-preview' as any,
      typescript: true,
    });
  }

  /**
   * Creates a Payment Intent for the checkout flow.
   */
  async createPaymentIntent(params: {
    amount: number;
    currency: string;
    orderId?: string;
    userId: string;
    metadata?: Record<string, string>;
    idempotencyKey?: string;
  }): Promise<{ clientSecret: string; id: string }> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: params.amount,
        currency: params.currency,
        metadata: {
          ...params.metadata,
          userId: params.userId,
          orderId: params.orderId || '',
        },
        automatic_payment_methods: {
          enabled: true,
        },
      }, {
        idempotencyKey: params.idempotencyKey,
      });

      if (!paymentIntent.client_secret) {
        throw new PaymentFailedError('Failed to generate Stripe client secret.');
      }

      return {
        clientSecret: paymentIntent.client_secret,
        id: paymentIntent.id,
      };
    } catch (error) {
      logger.error('Stripe PaymentIntent creation failed', error);
      throw new PaymentFailedError(error instanceof Error ? error.message : 'Stripe communication error');
    }
  }

  /**
   * Verifies a webhook signature and returns the event.
   */
  constructEvent(payload: string | Buffer, signature: string): Stripe.Event {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
    if (!webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET is not configured.');
    }

    try {
      return this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch (err) {
      logger.error('Stripe webhook signature verification failed', err);
      throw new Error(`Webhook Error: ${err instanceof Error ? err.message : 'Unknown'}`);
    }
  }

  /**
   * Checks if a webhook event has already been processed.
   */
  async isEventProcessed(eventId: string): Promise<boolean> {
    const docSnap = await getDoc(doc(db, this.collectionName, eventId));
    return docSnap.exists();
  }

  /**
   * Marks a webhook event as processed.
   */
  async markEventProcessed(eventId: string, type: string): Promise<void> {
    await setDoc(doc(db, this.collectionName, eventId), {
      id: eventId,
      type,
      processedAt: Timestamp.now(),
    });
  }

  /**
   * Retrieves a Payment Intent by ID.
   */
  async getPaymentIntent(id: string): Promise<Stripe.PaymentIntent> {
    return this.stripe.paymentIntents.retrieve(id);
  }
}
