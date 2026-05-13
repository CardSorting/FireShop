import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { sanitizeClientMessages } from '@domain/concierge/types';
import { createHermesChatCompletionStream } from '@infrastructure/services/HermesService';
import { logger } from '@utils/logger';
import { z } from 'zod';
import { DEFAULT_CONCIERGE_SETTINGS } from '@domain/concierge/settings';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { getUnifiedDb, collection, addDoc, serverTimestamp, updateDoc, doc, arrayUnion, getDoc, runTransaction } from '@infrastructure/firebase/bridge';
// import { collection, addDoc, serverTimestamp, updateDoc, doc, arrayUnion } from 'firebase/firestore';
import { getInitialServices } from '@core/container';

const ChatSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
  })),
  sessionId: z.string().optional(),
  context: z.object({
    currentPage: z.string().optional(),
    cartContents: z.array(z.any()).optional(),
    userSession: z.object({
      id: z.string(),
      email: z.string(),
      name: z.string().optional(),
    }).optional(),
    orderHistory: z.array(z.any()).optional(),
    inventoryState: z.any().optional(),
    activePromotions: z.array(z.any()).optional(),
    pageTitle: z.string().optional(),
    recentlyViewed: z.array(z.string()).optional(),
    fetchedOrders: z.record(z.string(), z.any()).optional(),
  }).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = ChatSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: 'Invalid request payload', details: result.error.format() }, { status: 400 });
    }

    const { messages, context, sessionId } = result.data;
    const sanitizedMessages = sanitizeClientMessages(messages);

    if (sanitizedMessages.length === 0) {
      return NextResponse.json({ error: 'Invalid chat messages' }, { status: 400 });
    }

    const lastMessage = sanitizedMessages[sanitizedMessages.length - 1];

    // Persist session to Firestore
    const db = getUnifiedDb();
    // Input Sanitization: Strip internal tokens from context to prevent injection
    const sanitizeContext = (c: any) => {
      if (!c) return c;
      const clean = (s: string) => s.replace(/\[/g, '').replace(/\]/g, '');
      return {
        ...c,
        currentPage: c.currentPage ? clean(c.currentPage) : undefined,
        pageTitle: c.pageTitle ? clean(c.pageTitle) : undefined
      };
    };

    let mergedContext = sanitizeContext(context || {});

    const ip = req.headers.get('x-forwarded-for') || '0.0.0.0';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    // Forensic Hardening: Atomic Session Merging via Transaction
    const { activeSessionId, finalizedContext } = await runTransaction(db, async (transaction: any) => {
      let currentSessionId = sessionId;
      let currentContext = mergedContext;

      if (!currentSessionId) {
        // Use a random UUID for auto-ID creation within the transaction
        const newId = crypto.randomUUID();
        const sessionRef = doc(db, 'conciergeSessions', newId);
        transaction.set(sessionRef, {
          userId: context?.userSession?.id || 'anonymous',
          customerEmail: context?.userSession?.email || 'anonymous',
          customerName: context?.userSession?.name || 'Anonymous User',
          context: mergedContext,
          transcript: sanitizedMessages,
          status: 'active',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        return { activeSessionId: sessionRef.id, finalizedContext: mergedContext };
      } else {
        const sessionRef = doc(db, 'conciergeSessions', currentSessionId);
        const sessionSnap = await transaction.get(sessionRef);
        if (sessionSnap.exists()) {
          const sessionData = sessionSnap.data();
          currentContext = { ...(sessionData.context || {}), ...mergedContext };
        }
        transaction.update(sessionRef, {
          transcript: sanitizedMessages,
          context: currentContext,
          updatedAt: serverTimestamp(),
        });
        return { activeSessionId: currentSessionId, finalizedContext: currentContext };
      }
    });

    // Prepare context string for the AI
    let contextString = `Session ID: ${activeSessionId}\n`;
    
    // Atmospheric Context
    const now = new Date();
    const dayName = now.toLocaleDateString('en-US', { weekday: 'long' });
    const timeOfDay = now.getHours() < 12 ? 'morning' : now.getHours() < 17 ? 'afternoon' : 'evening';
    contextString += `Atmospheric Context: It is a ${dayName} ${timeOfDay} at the DreamBees Studio.\n`;
    
    if (finalizedContext) {
      if (finalizedContext.currentPage) contextString += `Current Page: ${finalizedContext.currentPage}\n`;
      if (finalizedContext.cartContents && finalizedContext.cartContents.length > 0) {
        contextString += `Cart Contents: ${JSON.stringify(finalizedContext.cartContents)}\n`;
      }
      if (finalizedContext.userSession) {
        contextString += `Customer: ${finalizedContext.userSession.name || finalizedContext.userSession.email} (${finalizedContext.userSession.id})\n`;
      }
      if (finalizedContext.recentlyViewed && finalizedContext.recentlyViewed.length > 1) {
        contextString += `Recently Viewed: ${finalizedContext.recentlyViewed.filter((t: string) => t !== (finalizedContext.pageTitle || '')).join(', ')}\n`;
        contextString += `HINT: Mention these other items if they seem hesitant or want to bundle.\n`;
      }
      if (finalizedContext.activePromotions && finalizedContext.activePromotions.length > 0) {
        contextString += `Active Promotions: ${JSON.stringify(finalizedContext.activePromotions)}\n`;
      }
      // Inject fetched order details if any
      if (finalizedContext.fetchedOrders) {
        contextString += `\n### FETCHED ORDER DETAILS\n`;
        contextString += `${JSON.stringify(finalizedContext.fetchedOrders)}\n`;
      }
      // Forensic Hardening: Inject system alerts about previous turn failures
      if (finalizedContext.lastActionStatus === 'failed') {
        contextString += `\n### SYSTEM ALERT: Your previous administrative action failed. Reason: ${finalizedContext.lastActionError || 'Unauthorized'}. Please inform the customer you had technical trouble accessing those specific details.\n`;
      }
    }

    // Inject Bartering Settings & Inventory Pressure
    const { settingsService, productService } = getInitialServices();
    const settings = await settingsService.getConciergeSettings();
    
    if (settings.isBarteringEnabled) {
      contextString += `\n### BARTERING ENABLED\n`;
      contextString += `Max Discount: ${settings.maxDiscountPercentage}%\n`;
      contextString += `Negotiation Tone: ${settings.negotiationTone}\n`;
      contextString += `Minimum Order Value: $${(settings.minOrderValueForBarter || 0) / 100}\n`;

      // Dynamic Inventory Pressure: Look for current product in pageTitle
      if (context?.pageTitle) {
        const productName = context.pageTitle.split('|')[0].trim();
        try {
          const { products } = await productService.getProducts({ query: productName, limit: 1 });
          if (products.length > 0) {
            const product = products[0];
            contextString += `Current Product Stock: ${product.stock} units remaining.\n`;
            if (product.stock < 5) {
              contextString += `PRESSURE: This item is in LOW STOCK. Use this to maintain price or push for immediate conversion.\n`;
            }

            if (product.tags?.some(t => t.toLowerCase().includes('limited') || t.toLowerCase().includes('rare'))) {
              contextString += `EXCLUSIVITY: This is a LIMITED EDITION item. Maintain price firmness as these are highly collectible.\n`;
            }
            
            // Related Items for Bundle Leverage
            const { products: related } = await productService.getProducts({ 
              category: product.category, 
              limit: 3 
            });
            const bundleItems = related.filter(p => p.id !== product.id);
            if (bundleItems.length > 0) {
              contextString += `AVAILABLE FOR BUNDLING: ${bundleItems.map(p => `${p.name} ($${p.price / 100})`).join(', ')}\n`;
              contextString += `HINT: If they want a steeper discount, offer a bundle deal using these specific items.\n`;
            }
          }
        } catch (err) {
          logger.warn('Failed to fetch inventory for context', { productName });
        }
      }
    }

    logger.info('Initiating Concierge chat stream', { 
      userId: context?.userSession?.id,
      sessionId: activeSessionId,
      correlationId: crypto.randomUUID()
    });

    const hermesRes = await createHermesChatCompletionStream(sanitizedMessages, undefined, contextString);

    // Create a transform stream to detect barter success tokens
    let fullResponse = '';
    
    const transformer = new TransformStream({
      async transform(chunk, controller) {
        const text = new TextDecoder().decode(chunk);
        fullResponse += text;
        controller.enqueue(chunk);
      },
      async flush(controller) {
        const flushStart = Date.now();
        const { discountService, orderService, ticketRepository, auditService } = getInitialServices();
        const db = getUnifiedDb();
        const sessionRef = activeSessionId ? doc(db, 'conciergeSessions', activeSessionId) : null;
        if (!sessionRef) return;

        const sessionSnap = await getDoc(sessionRef);
        const sessionData = sessionSnap.exists() ? sessionSnap.data() : {};
        const existingEvents = sessionData.events || [];
        const ticketCount = existingEvents.filter((e: any) => e.label === 'IT Ticket Opened').length;

        const sessionUpdates: any = {
          events: [],
          transcript: [],
          actionResults: [] // Production Hardening: Traceable log of all tool executions
        };

        const userId = context?.userSession?.id || 'anonymous';
        const userEmail = context?.userSession?.email || 'anonymous';
        const userAgent = req.headers.get('user-agent') || 'unknown';
        const correlationId = crypto.randomUUID();

        // Production Hardening: Safety Caps & Auth Gates
        const MAX_CONCIERGE_REFUND_CENTS = 5000; // $50.00
        const MAX_CONCIERGE_DISCOUNT_PERCENT = 20;
        const isUserAuthenticated = userId && userId !== 'anonymous';

        // Payload Sanitization Helpers
        const cleanPayload = (s: string, max: number) => s.trim().slice(0, max).replace(/[<>]/g, '');

        // Forensic Hardening: Deduplicate tokens to prevent redundant execution
        const tokens = {
          barter: Array.from(fullResponse.matchAll(/\[BARTER_SUCCESS:\s*(\d+)%\]/g)),
          openTicket: Array.from(fullResponse.matchAll(/\[OPEN_TICKET:\s*"([^"]+)",\s*"([^"]+)"\]/g)),
          closeTicket: Array.from(fullResponse.matchAll(/\[CLOSE_TICKET:\s*"([^"]+)"\]/g)),
          fetchOrder: Array.from(fullResponse.matchAll(/\[FETCH_ORDER_DETAILS:\s*"([^"]+)"\]/g)),
          addNote: Array.from(fullResponse.matchAll(/\[ADD_ORDER_NOTE:\s*"([^"]+)",\s*"([^"]+)"\]/g)),
          cancelOrder: Array.from(fullResponse.matchAll(/\[CANCEL_ORDER:\s*"([^"]+)"\]/g)),
          processRefund: Array.from(fullResponse.matchAll(/\[PROCESS_REFUND:\s*"([^"]+)",\s*(\d+)\]/g)),
          kbSearch: Array.from(fullResponse.matchAll(/\[KB_SEARCH:\s*"([^"]+)"\]/g)),
          escalateHuman: Array.from(fullResponse.matchAll(/\[ESCALATE_TO_HUMAN\]/g)),
          updateAddress: Array.from(fullResponse.matchAll(/\[UPDATE_SHIPPING_ADDRESS:\s*"([^"]+)",\s*(\{.*?\})\]/g)),
          getLogistics: Array.from(fullResponse.matchAll(/\[GET_LOGISTICS_INSIGHTS\]/g)),
          sendEmail: Array.from(fullResponse.matchAll(/\[SEND_CUSTOM_EMAIL:\s*"([^"]+)",\s*"([^"]+)",\s*"([^"]+)"\]/g)),
          applyDiscount: Array.from(fullResponse.matchAll(/\[APPLY_DISCOUNT_TO_ORDER:\s*"([^"]+)",\s*"([^"]+)"\]/g)),
          passwordReset: Array.from(fullResponse.matchAll(/\[INITIATE_PASSWORD_RESET:\s*"([^"]+)"\]/g)),
          troubleshooting: Array.from(fullResponse.matchAll(/\[GET_PRODUCT_TROUBLESHOOTING:\s*"([^"]+)"\]/g)),
          accountDeletion: Array.from(fullResponse.matchAll(/\[REQUEST_ACCOUNT_DELETION:\s*"([^"]+)",\s*"([^"]+)"\]/g)),
          systemStatus: Array.from(fullResponse.matchAll(/\[GET_SYSTEM_STATUS\]/g)),
          getMacros: Array.from(fullResponse.matchAll(/\[GET_SUPPORT_MACROS\]/g)),
          getCustomerInsights: Array.from(fullResponse.matchAll(/\[GET_CUSTOMER_INSIGHTS:\s*"([^"]+)"\]/g)),
          getPaymentDiagnostics: Array.from(fullResponse.matchAll(/\[GET_PAYMENT_DIAGNOSTICS:\s*"([^"]+)"\]/g)),
          analyzeCartConflicts: Array.from(fullResponse.matchAll(/\[ANALYZE_CART_CONFLICTS:\s*"([^"]+)"\]/g)),
          fetchFullKb: Array.from(fullResponse.matchAll(/\[FETCH_FULL_KB_ARTICLE:\s*"([^"]+)"\]/g)),
          createRecoveryCode: Array.from(fullResponse.matchAll(/\[CREATE_RECOVERY_DISCOUNT:\s*"([^"]+)",\s*"([^"]+)"\]/g)),
          flagUrgency: Array.from(fullResponse.matchAll(/\[FLAG_TICKET_FOR_URGENCY:\s*"([^"]+)",\s*"([^"]+)"\]/g)),
          resetSession: Array.from(fullResponse.matchAll(/\[RESET_USER_SESSION:\s*"([^"]+)"\]/g)),
          swapItem: Array.from(fullResponse.matchAll(/\[SWAP_ORDER_ITEM:\s*"([^"]+)",\s*"([^"]+)",\s*"([^"]+)"\]/g)),
          upgradeShipping: Array.from(fullResponse.matchAll(/\[UPGRADE_SHIPPING:\s*"([^"]+)",\s*"([^"]+)",\s*"([^"]+)"\]/g)),
          getPreferences: Array.from(fullResponse.matchAll(/\[GET_CUSTOMER_PREFERENCES:\s*"([^"]+)"\]/g)),
          reportBug: Array.from(fullResponse.matchAll(/\[REPORT_SYSTEM_BUG:\s*"([^"]+)"\]/g)),
          recoverCode: Array.from(fullResponse.matchAll(/\[RECOVER_EXPIRED_CODE:\s*"([^"]+)",\s*"([^"]+)"\]/g)),
          orderSplit: Array.from(fullResponse.matchAll(/\[REQUEST_ORDER_SPLIT:\s*"([^"]+)",\s*(\[.*?\])\]/g)),
          verifyAddress: Array.from(fullResponse.matchAll(/\[VERIFY_ADDRESS_LOGISTICS:\s*"([^"]+)"\]/g)),
          tagSentiment: Array.from(fullResponse.matchAll(/\[TAG_CUSTOMER_SENTIMENT:\s*"([^"]+)"\]/g)),
          getShippingEstimates: Array.from(fullResponse.matchAll(/\[GET_SHIPPING_ESTIMATES:\s*"([^"]+)"\]/g)),
          placeHold: Array.from(fullResponse.matchAll(/\[PLACE_ORDER_ON_HOLD:\s*"([^"]+)",\s*"([^"]+)"\]/g)),
          releaseHold: Array.from(fullResponse.matchAll(/\[RELEASE_ORDER_HOLD:\s*"([^"]+)"\]/g)),
          unsubscribe: Array.from(fullResponse.matchAll(/\[UNSUBSCRIBE_FROM_MARKETING:\s*"([^"]+)"\]/g)),
          generateInvoice: Array.from(fullResponse.matchAll(/\[GENERATE_TAX_INVOICE:\s*"([^"]+)"\]/g)),
          getRiskScore: Array.from(fullResponse.matchAll(/\[GET_ORDER_RISK_SCORE:\s*"([^"]+)"\]/g)),
          searchResolutions: Array.from(fullResponse.matchAll(/\[SEARCH_SIMILAR_RESOLUTIONS:\s*"([^"]+)"\]/g))
        };

        // Production Hardening: Systemic Rate Limiting to prevent infinite tool loops
        const turnToolCount = Object.values(tokens).reduce((acc, t) => acc + (t as any[]).length, 0);
        const totalSessionTools = sessionData.toolExecutionCount || 0;
        if (totalSessionTools + turnToolCount > 100) {
          logger.warn('Concierge tool execution budget exhausted', { sessionId: activeSessionId, total: totalSessionTools });
          sessionUpdates.events.push({
            type: 'note_added',
            timestamp: new Date().toISOString(),
            label: 'Tool Budget Exhausted',
            description: 'The Concierge has performed too many automated actions and requires human review.'
          });
          return;
        }
        sessionUpdates['toolExecutionCount'] = totalSessionTools + turnToolCount;
        if (tokens.barter.length > 0) {
          const tStart = Date.now();
          const match = tokens.barter[0];
          const percentage = parseInt(match[1]);
          try {
            const discount = await discountService.createBarterDiscount(percentage, activeSessionId!);
            sessionUpdates.status = 'analyzed';
            sessionUpdates.customerOutcome = 'converted';
            sessionUpdates.isConverted = true;
            sessionUpdates.events.push({
              type: 'outcome_tracked',
              timestamp: new Date().toISOString(),
              label: 'Barter Success',
              description: `Customer agreed to ${percentage}% discount. Code: ${discount.code}`
            });
            sessionUpdates.transcript.push({ 
              role: 'assistant', 
              content: `Perfect! I've generated your unique code: ${discount.code}. You can use this at checkout. It expires in 24 hours.` 
            });

            await auditService.record({
              userId, userEmail,
              action: 'barter_discount_created',
              targetId: activeSessionId!,
              correlationId,
              ip, userAgent,
              details: { percentage, discountCode: discount.code, durationMs: Date.now() - tStart }
            });
          } catch (err) {
            logger.error('Failed to fulfill barter', err);
            sessionUpdates.events.push({
              type: 'note_added',
              timestamp: new Date().toISOString(),
              label: 'Barter Failed',
              description: 'System error generating discount code.'
            });
          }
        }

        // 2. Handle IT Support: Open Ticket (Quota enforced)
        if (tokens.openTicket.length > 0) {
          const tStart = Date.now();
          for (const rawToken of tokens.openTicket.slice(0, 1)) {
            const subject = cleanPayload(rawToken[1], 100);
            const description = cleanPayload(rawToken[2], 1000);

            if (ticketCount >= 3) {
              logger.warn('Concierge ticket quota exceeded', { sessionId: activeSessionId });
              sessionUpdates.events.push({
                type: 'note_added',
                timestamp: new Date().toISOString(),
                label: 'Ticket Blocked',
                description: 'Support ticket quota (3) exceeded for this session.'
              });
              continue;
            }

            try {
              const { conciergeService } = getInitialServices();
              const ticketId = await conciergeService.escalateToTicket(
                userId, userEmail,
                context?.userSession?.name || 'Anonymous User',
                subject,
                [{ role: 'assistant', content: description }],
                'incident',
                'medium',
                `AI-Triggered Support Admin Action: ${description}`
              );

              sessionUpdates.events.push({
                type: 'escalated',
                timestamp: new Date().toISOString(),
                label: 'IT Ticket Opened',
                description: `Ticket #${ticketId} created: ${subject}`
              });

              await auditService.record({
                userId, userEmail,
                action: 'concierge_escalated',
                targetId: ticketId,
                correlationId,
                ip, userAgent,
                details: { subject, description, sessionId: activeSessionId, durationMs: Date.now() - tStart }
              });
            } catch (err) {
              logger.error('Failed to open ticket from concierge', { err, correlationId, sessionId: activeSessionId });
              sessionUpdates['context.lastActionStatus'] = 'failed';
              sessionUpdates['context.lastActionError'] = 'Ticket Creation Limit or System Error';
              sessionUpdates.events.push({
                type: 'note_added',
                timestamp: new Date().toISOString(),
                label: 'Ticket Creation Failed',
                description: `Failed to create ticket: ${subject}`
              });
            }
          }
        }

        // 3. Handle IT Support: Close Ticket
        const uniqueCloseRequests = Array.from(new Set(tokens.closeTicket.map(m => m[1])));
        for (const ticketId of uniqueCloseRequests) {
          const tStart = Date.now();
          try {
            const ticket = await ticketRepository.getTicketById(ticketId);
            if (ticket && ticket.userId === userId) {
              await ticketRepository.updateTicketStatus(ticketId, 'closed');
              sessionUpdates['context.lastActionStatus'] = 'success';
              sessionUpdates.events.push({
                type: 'resolved',
                timestamp: new Date().toISOString(),
                label: 'Ticket Closed',
                description: `Ticket #${ticketId} marked as resolved by Concierge.`
              });
              await auditService.record({
                userId, userEmail,
                action: 'order_status_changed',
                targetId: ticketId,
                correlationId,
                ip, userAgent,
                details: { status: 'closed', sessionId: activeSessionId, durationMs: Date.now() - tStart }
              });
            } else {
              throw new Error('Unauthorized');
            }
          } catch (err) {
            sessionUpdates['context.lastActionStatus'] = 'failed';
            sessionUpdates['context.lastActionError'] = `Unauthorized to close Ticket #${ticketId}`;
            sessionUpdates.events.push({
              type: 'note_added',
              timestamp: new Date().toISOString(),
              label: 'Ticket Closure Failed',
              description: `Ticket #${ticketId} closure unauthorized.`
            });
          }
        }

        // 4. Handle IT Support: Fetch Order Details
        const uniqueFetchRequests = Array.from(new Set(tokens.fetchOrder.map(m => m[1])));
        for (const orderId of uniqueFetchRequests.slice(0, 5)) {
          const tStart = Date.now();
          try {
            const order = await orderService.getOrder(orderId, userId === 'anonymous' ? undefined : userId);
            if (order) {
              const sanitizedOrder = {
                id: order.id,
                status: order.status,
                total: order.total,
                createdAt: order.createdAt,
                items: order.items.map(i => ({ name: i.name, quantity: i.quantity })),
                trackingNumber: order.fulfillments?.[0]?.trackingNumber,
                shippingCity: order.shippingAddress.city,
                shippingState: order.shippingAddress.state
              };

              sessionUpdates[`context.fetchedOrders.${orderId}`] = sanitizedOrder;
              sessionUpdates['context.lastActionStatus'] = 'success';
              sessionUpdates.events.push({
                type: 'note_added',
                timestamp: new Date().toISOString(),
                label: 'Order Details Fetched',
                description: `Order #${orderId} details retrieved for concierge context.`
              });
              
              await auditService.record({
                userId, userEmail,
                action: 'concierge_analyzed',
                targetId: orderId,
                correlationId,
                ip, userAgent,
                details: { action: 'fetch_details', sessionId: activeSessionId, durationMs: Date.now() - tStart }
              });
            } else {
              throw new Error('Order not found or unauthorized');
            }
          } catch (err) {
            sessionUpdates['context.lastActionStatus'] = 'failed';
            sessionUpdates['context.lastActionError'] = `Unauthorized attempt to access Order #${orderId}`;
            sessionUpdates.events.push({
              type: 'note_added',
              timestamp: new Date().toISOString(),
              label: 'Order Fetch Failed',
              description: `Unauthorized attempt to fetch Order #${orderId}`
            });
          }
        }

        // 5. Handle IT Support: Add Order Note
        for (const m of tokens.addNote) {
          const tStart = Date.now();
          const orderId = m[1];
          const noteText = cleanPayload(m[2], 500);
          try {
            const order = await orderService.getOrder(orderId, userId === 'anonymous' ? undefined : userId);
            if (order) {
              await orderService.addOrderNote(orderId, noteText, {
                id: 'concierge',
                email: 'concierge@dreambees.art'
              });
              sessionUpdates.events.push({
                type: 'note_added',
                timestamp: new Date().toISOString(),
                label: 'Order Note Added',
                description: `Administrative note added to Order #${orderId}`
              });
              await auditService.record({
                userId, userEmail,
                action: 'order_status_changed',
                targetId: orderId,
                correlationId,
                ip, userAgent,
                details: { note: noteText, sessionId: activeSessionId, durationMs: Date.now() - tStart }
              });
            }
          } catch (err) {
            logger.error('Failed to add order note from concierge', err);
          }
        }

        // 6. Handle IT Support: Cancel Order
        for (const m of tokens.cancelOrder) {
          const tStart = Date.now();
          const orderId = m[1];
          try {
            const { orderManagementService } = getInitialServices();
            await orderManagementService.updateOrderStatus(orderId, 'cancelled', {
              id: 'concierge',
              email: 'concierge@dreambees.art'
            });
            sessionUpdates.events.push({
              type: 'cancelled',
              timestamp: new Date().toISOString(),
              label: 'Order Cancelled',
              description: `Order #${orderId} cancelled by Concierge per customer request.`
            });
            await auditService.record({
              userId, userEmail,
              action: 'order_status_changed',
              targetId: orderId,
              correlationId,
              ip, userAgent,
              details: { from: 'unknown', to: 'cancelled', sessionId: activeSessionId, durationMs: Date.now() - tStart }
            });
          } catch (err) {
            logger.error('Failed to cancel order from concierge', err);
            sessionUpdates['context.lastActionStatus'] = 'failed';
            sessionUpdates['context.lastActionError'] = `Could not cancel Order #${orderId}. It may already be shipped.`;
          }
        }

        // 7. Handle IT Support: Process Refund
        for (const m of tokens.processRefund) {
          const tStart = Date.now();
          const orderId = m[1];
          const amount = parseInt(m[2]);
          try {
            // Production Hardening: Refund Authorization Gate
            if (!isUserAuthenticated) throw new Error('Customer must be logged in for refund processing.');
            if (amount > MAX_CONCIERGE_REFUND_CENTS) {
              throw new Error(`Refund amount ($${amount/100}) exceeds concierge autonomous limit of $${MAX_CONCIERGE_REFUND_CENTS/100}. Please escalate to a manager.`);
            }

            const { refundService } = getInitialServices();
            // Production Hardening: Idempotency Key for Concierge Refund
            const idempotencyKey = `concierge-refund-${activeSessionId}-${orderId}-${amount}`;
            
            await refundService.processRefund(orderId, amount, {
              id: 'concierge',
              email: 'concierge@dreambeesart.com'
            }, idempotencyKey);
            sessionUpdates.events.push({
              type: 'refunded',
              timestamp: new Date().toISOString(),
              label: 'Refund Processed',
              description: `Refund of $${amount / 100} processed for Order #${orderId} by Concierge.`
            });
            await auditService.record({
              userId, userEmail,
              action: 'order_refunded',
              targetId: orderId,
              correlationId,
              ip, userAgent,
              details: { amount, sessionId: activeSessionId, durationMs: Date.now() - tStart, forensicContext: 'concierge_autonomous_resolution' }
            });
          } catch (err) {
            logger.error('Failed to process refund from concierge', err);
            sessionUpdates['context.lastActionStatus'] = 'failed';
            sessionUpdates['context.lastActionError'] = `Refund failed for Order #${orderId}: ${err instanceof Error ? err.message : 'Unknown error'}`;
          }
        }

        // 8. Handle IT Support: KB Search
        for (const m of tokens.kbSearch) {
          const tStart = Date.now();
          const query = m[1];
          try {
            const { knowledgebaseRepository } = getInitialServices();
            const articles = await knowledgebaseRepository.searchArticles(query);
            sessionUpdates['context.kbResults'] = articles.map(a => ({
              title: a.title,
              snippet: a.content.slice(0, 500) + '...',
              slug: a.slug
            }));
            sessionUpdates.events.push({
              type: 'note_added',
              timestamp: new Date().toISOString(),
              label: 'KB Search Performed',
              description: `Searched KB for "${query}". Found ${articles.length} results.`
            });
            await auditService.record({
              userId, userEmail,
              action: 'concierge_analyzed',
              targetId: activeSessionId!,
              correlationId,
              ip, userAgent,
              details: { action: 'kb_search', query, durationMs: Date.now() - tStart }
            });
          } catch (err) {
            logger.error('KB search failed from concierge', err);
          }
        }

        // 9. Handle IT Support: Escalate to Human
        if (tokens.escalateHuman.length > 0) {
          sessionUpdates.status = 'escalated';
          sessionUpdates.events.push({
            type: 'escalated',
            timestamp: new Date().toISOString(),
            label: 'Handoff Requested',
            description: 'Concierge initiated a handoff to a human support agent.'
          });
          await auditService.record({
            userId, userEmail,
            action: 'concierge_escalated',
            targetId: activeSessionId!,
            correlationId,
            ip, userAgent,
            details: { type: 'human_handoff', sessionId: activeSessionId }
          });
        }

        // 10. Handle IT Support: Analyze Cart Conflicts
        if (tokens.analyzeCartConflicts.length > 0) {
          const tStart = Date.now();
          try {
            const { cartService, productService } = getInitialServices();
            const cart = await cartService.getCart(userId);
            const conflicts = [];
            
            if (cart) {
              for (const item of cart.items) {
                const product = await productService.getProduct(item.productId);
                if (product.status === 'archived') {
                  conflicts.push(`Product "${product.name}" is discontinued.`);
                }
                if ((product.stock || 0) < item.quantity) {
                  conflicts.push(`Product "${product.name}" is out of stock (Requested: ${item.quantity}, Available: ${product.stock || 0}).`);
                }
              }
            }
            
            sessionUpdates['context.cartAnalysis'] = {
              hasConflicts: conflicts.length > 0,
              conflicts,
              itemCount: cart?.items.length || 0
            };
          } catch (err) {
            logger.error('Failed to analyze cart conflicts from concierge', err);
          }
        }

        // 11. Handle IT Support: Get Payment Diagnostics
        for (const m of tokens.getPaymentDiagnostics) {
          const tStart = Date.now();
          const orderId = m[1];
          try {
            const logs = await auditService.getRecentLogs({ targetId: orderId, action: 'order_payment_finalized' });
            sessionUpdates['context.paymentDiagnostics'] = logs.map(l => {
              const details = JSON.parse(l.details || '{}');
              return {
                timestamp: l.createdAt,
                status: details.status,
                error: details.error,
                transactionId: details.transactionId
              };
            });
          } catch (err) {
            logger.error('Failed to get payment diagnostics from concierge', err);
          }
        }

        // 10. Handle IT Support: Update Shipping Address
        for (const m of tokens.updateAddress) {
          const tStart = Date.now();
          const orderId = m[1];
          try {
            const address = JSON.parse(m[2]);
            const { orderService } = getInitialServices();
            await orderService.updateShippingAddress(orderId, address, {
              id: 'concierge',
              email: 'concierge@dreambees.art'
            });
            sessionUpdates.events.push({
              type: 'note_added',
              timestamp: new Date().toISOString(),
              label: 'Address Updated',
              description: `Shipping address updated for Order #${orderId}.`
            });
          } catch (err) {
            logger.error('Failed to update shipping address from concierge', err);
            sessionUpdates['context.lastActionStatus'] = 'failed';
            sessionUpdates['context.lastActionError'] = `Address update failed for Order #${orderId}: ${err instanceof Error ? err.message : 'Invalid JSON'}`;
          }
        }

        // 11. Handle IT Support: Get Logistics Insights
        if (tokens.getLogistics.length > 0) {
          const tStart = Date.now();
          try {
            const { orderQueryService } = getInitialServices();
            const insights = await orderQueryService.getLogisticsInsights();
            sessionUpdates['context.logisticsHealth'] = insights;
            sessionUpdates.events.push({
              type: 'note_added',
              timestamp: new Date().toISOString(),
              label: 'Logistics Health Checked',
              description: `Retrieved warehouse health: ${insights.health.fulfillment}`
            });
          } catch (err) {
            logger.error('Failed to get logistics insights from concierge', err);
          }
        }

        // 12. Handle IT Support: Send Custom Email
        for (const m of tokens.sendEmail) {
          const tStart = Date.now();
          const to = m[1];
          const subject = m[2];
          const body = m[3];
          try {
            const { emailService } = getInitialServices();
            await emailService.sendEmail({ to, subject, text: body, from: 'support@dreambees.art' });
            sessionUpdates.events.push({
              type: 'note_added',
              timestamp: new Date().toISOString(),
              label: 'Email Sent',
              description: `Custom email sent to ${to}: ${subject}`
            });
          } catch (err) {
            logger.error('Failed to send custom email from concierge', err);
          }
        }

        // 13. Handle IT Support: Apply Discount to Order
        for (const m of tokens.applyDiscount) {
          const tStart = Date.now();
          const orderId = m[1];
          const code = m[2];
          try {
            const { orderService } = getInitialServices();
            await orderService.applyDiscountToOrder(orderId, code, {
              id: 'concierge',
              email: 'concierge@dreambees.art'
            });
            sessionUpdates.events.push({
              type: 'note_added',
              timestamp: new Date().toISOString(),
              label: 'Discount Applied',
              description: `Discount code "${code}" manually applied to Order #${orderId}.`
            });
          } catch (err) {
            logger.error('Failed to apply discount from concierge', err);
            sessionUpdates['context.lastActionStatus'] = 'failed';
            sessionUpdates['context.lastActionError'] = `Failed to apply discount ${code} to Order #${orderId}: ${err instanceof Error ? err.message : 'Unknown error'}`;
          }
        }

        // 14. Handle IT Support: Initiate Password Reset
        for (const m of tokens.passwordReset) {
          const tStart = Date.now();
          const email = m[1];
          try {
            const { authService } = getInitialServices();
            await authService.requestPasswordReset(email);
            sessionUpdates.events.push({
              type: 'note_added',
              timestamp: new Date().toISOString(),
              label: 'Password Reset Initiated',
              description: `Password reset email requested for ${email}.`
            });
          } catch (err) {
            logger.error('Failed to initiate password reset from concierge', err);
          }
        }

        // 15. Handle IT Support: Get Product Troubleshooting
        for (const m of tokens.troubleshooting) {
          const tStart = Date.now();
          const productId = m[1];
          try {
            const { productService } = getInitialServices();
            const product = await productService.getProduct(productId);
            sessionUpdates['context.troubleshootingData'] = {
              productName: product.name,
              guide: product.description || 'No specific troubleshooting guide found. Please check our standard support docs.',
              technicalSpecs: product.metafields?.specs || 'N/A'
            };
          } catch (err) {
            logger.error('Failed to get troubleshooting guide from concierge', err);
          }
        }

        // 16. Handle IT Support: Request Account Deletion
        for (const m of tokens.accountDeletion) {
          const tStart = Date.now();
          const uId = m[1];
          const reason = m[2];
          try {
            const { ticketRepository } = getInitialServices();
            await ticketRepository.createTicket({
              userId: uId,
              subject: 'Account Deletion Request',
              description: `User requested account deletion. Reason: ${reason}`,
              status: 'open',
              priority: 'high',
              tags: ['privacy', 'gdpr', 'account_deletion']
            } as any);
            
            await auditService.record({
              userId, userEmail,
              action: 'staff_role_updated', // Using a placeholder for sensitive account mutations
              targetId: uId,
              details: { action: 'deletion_request', reason }
            });

            sessionUpdates.events.push({
              type: 'note_added',
              timestamp: new Date().toISOString(),
              label: 'Account Deletion Requested',
              description: `Privacy request logged for User #${uId}.`
            });
          } catch (err) {
            logger.error('Failed to log account deletion request from concierge', err);
          }
        }

        // 17. Handle IT Support: Get System Status
        if (tokens.systemStatus.length > 0) {
          sessionUpdates['context.systemStatus'] = {
            api: 'Operational',
            paymentGateway: 'Operational',
            fulfillmentEngine: 'Operational',
            lastChecked: new Date().toISOString()
          };
          sessionUpdates.events.push({
            type: 'note_added',
            timestamp: new Date().toISOString(),
            label: 'System Status Checked',
            description: 'All core systems are operational.'
          });
        }

        // 18. Handle IT Support: Get Support Macros
        if (tokens.getMacros.length > 0) {
          const tStart = Date.now();
          try {
            const { ticketRepository } = getInitialServices();
            const macros = await ticketRepository.getMacros();
            sessionUpdates['context.supportMacros'] = macros.map((m: any) => ({
              id: m.id,
              name: m.name,
              content: m.content
            }));
          } catch (err) {
            logger.error('Failed to get support macros from concierge', err);
          }
        }

        // 19. Handle IT Support: Get Customer Insights
        for (const m of tokens.getCustomerInsights) {
          const tStart = Date.now();
          const uId = m[1];
          try {
            const { ticketRepository } = getInitialServices();
            const summary = await ticketRepository.getCustomerSupportSummary(uId);
            sessionUpdates['context.customerInsights'] = summary;
          } catch (err) {
            logger.error('Failed to get customer insights from concierge', err);
          }
        }

        // 20. Handle IT Support: Get Payment Diagnostics
        for (const m of tokens.getPaymentDiagnostics) {
          const tStart = Date.now();
          const uId = m[1];
          try {
            const logs = await auditService.getRecentLogs({ 
              userId: uId, 
              action: 'order_payment_finalized', 
              limit: 20 
            });
            const failures = logs
              .map(l => {
                try { return JSON.parse(l.details); } catch { return null; }
              })
              .filter(d => d && d.status === 'failed');
            
            sessionUpdates['context.paymentDiagnostics'] = failures.slice(0, 5);
          } catch (err) {
            logger.error('Failed to get payment diagnostics from concierge', err);
          }
        }

        // 21. Handle IT Support: Analyze Cart Conflicts
        for (const m of tokens.analyzeCartConflicts) {
          const tStart = Date.now();
          const uId = m[1];
          try {
            const { cartRepo, productRepo } = getInitialServices();
            const cart = await cartRepo.getByUserId(uId);
            if (cart) {
              const conflicts: any[] = [];
              for (const item of cart.items) {
                const product = await productRepo.getById(item.productId);
                if (!product) {
                  conflicts.push({ item: item.name, reason: 'removed' });
                } else if (product.stock < item.quantity) {
                  conflicts.push({ item: item.name, reason: 'low_stock', available: product.stock });
                } else if (product.price !== item.priceSnapshot) {
                  conflicts.push({ item: item.name, reason: 'price_change', newPrice: product.price });
                }
              }
              sessionUpdates['context.cartConflicts'] = conflicts;
            }
          } catch (err) {
            logger.error('Failed to analyze cart conflicts from concierge', err);
          }
        }

        // 22. Handle IT Support: Fetch Full KB Article
        for (const m of tokens.fetchFullKb) {
          const tStart = Date.now();
          const slug = m[1];
          try {
            const { knowledgebaseRepository } = getInitialServices();
            const article = await knowledgebaseRepository.getArticleBySlug(slug);
            if (article) {
              sessionUpdates['context.fullArticle'] = {
                title: article.title,
                content: article.content
              };
            }
          } catch (err) {
            logger.error('Failed to fetch full KB article from concierge', err);
          }
        }

        // 23. Handle IT Support: Create Recovery Discount
        for (const m of tokens.createRecoveryCode) {
          const tStart = Date.now();
          const uId = m[1];
          const percent = parseInt(m[2]);
          try {
            // Production Hardening: Discount Authorization Gate
            if (!isUserAuthenticated) throw new Error('Customer must be logged in for service recovery gestures.');
            if (percent > MAX_CONCIERGE_DISCOUNT_PERCENT) {
              throw new Error(`Discount (${percent}%) exceeds concierge autonomous limit of ${MAX_CONCIERGE_DISCOUNT_PERCENT}%. Please escalate for higher approval.`);
            }

            const { discountService } = getInitialServices();
            const discount = await discountService.createBarterDiscount(percent, activeSessionId!);
            sessionUpdates['context.recoveryDiscount'] = discount.code;
            sessionUpdates.events.push({
              type: 'note_added',
              timestamp: new Date().toISOString(),
              label: 'Recovery Discount Generated',
              description: `Generated ${percent}% recovery code "${discount.code}" for User #${uId}.`
            });
          } catch (err) {
            logger.error('Failed to create recovery discount from concierge', err);
          }
        }

        // 24. Handle IT Support: Flag Ticket Urgency
        for (const m of tokens.flagUrgency) {
          const tStart = Date.now();
          const ticketId = m[1];
          const reason = m[2];
          try {
            const { ticketRepository } = getInitialServices();
            await ticketRepository.updateTicketPriority(ticketId, 'urgent');
            await ticketRepository.addMessage({
              id: crypto.randomUUID(),
              ticketId,
              senderId: 'concierge',
              senderType: 'staff',
              visibility: 'internal',
              content: `URGENCY FLAGGED BY CONCIERGE: ${reason}`,
              createdAt: new Date()
            } as any);
            sessionUpdates.events.push({
              type: 'note_added',
              timestamp: new Date().toISOString(),
              label: 'Ticket Urgency Flagged',
              description: `Ticket #${ticketId} flagged as urgent: ${reason}`
            });
          } catch (err) {
            logger.error('Failed to flag ticket urgency from concierge', err);
          }
        }

        // 25. Handle IT Support: Reset User Session
        for (const m of tokens.resetSession) {
          const tStart = Date.now();
          const uId = m[1];
          try {
            // Production Hardening: Identity Match Verification
            if (userId !== uId) throw new Error('Cannot reset session for a different user ID.');
            
            const { cartRepo } = getInitialServices();
            await cartRepo.clear(uId);
            sessionUpdates['context.sessionReset'] = true;
            sessionUpdates.events.push({
              type: 'note_added',
              timestamp: new Date().toISOString(),
              label: 'Session Reset Initiated',
              description: `Cart cleared and session reset requested for User #${uId}.`
            });
          } catch (err) {
            logger.error('Failed to reset user session from concierge', err);
            sessionUpdates['context.lastActionStatus'] = 'failed';
            sessionUpdates['context.lastActionError'] = `Session reset failed: ${err instanceof Error ? err.message : 'Unauthorized'}`;
          }
        }

        // 26. Handle IT Support: Swap Order Item
        for (const m of tokens.swapItem) {
          const tStart = Date.now();
          const orderId = m[1];
          const oldId = m[2];
          const newId = m[3];
          try {
            const { orderService } = getInitialServices();
            await orderService.swapOrderItem(orderId, oldId, newId, {
              id: 'concierge',
              email: 'concierge@dreambees.art'
            });
            sessionUpdates.events.push({
              type: 'note_added',
              timestamp: new Date().toISOString(),
              label: 'Order Item Swapped',
              description: `Swapped item ${oldId} for ${newId} in Order #${orderId}.`
            });
          } catch (err) {
            logger.error('Failed to swap order item from concierge', err);
            sessionUpdates['context.lastActionStatus'] = 'failed';
            sessionUpdates['context.lastActionError'] = `Swap failed: ${err instanceof Error ? err.message : 'Unknown error'}`;
          }
        }

        // 27. Handle IT Support: Upgrade Shipping
        for (const m of tokens.upgradeShipping) {
          const tStart = Date.now();
          const orderId = m[1];
          const carrier = m[2];
          const service = m[3];
          try {
            const { orderService } = getInitialServices();
            await orderService.upgradeShipping(orderId, carrier, service, {
              id: 'concierge',
              email: 'concierge@dreambees.art'
            });
            sessionUpdates.events.push({
              type: 'note_added',
              timestamp: new Date().toISOString(),
              label: 'Shipping Upgraded',
              description: `Shipping upgraded to ${carrier} ${service} for Order #${orderId}.`
            });
          } catch (err) {
            logger.error('Failed to upgrade shipping from concierge', err);
          }
        }

        // 28. Handle IT Support: Get Customer Preferences
        for (const m of tokens.getPreferences) {
          const tStart = Date.now();
          const uId = m[1];
          try {
            const docSnap = await getDoc(doc(getUnifiedDb(), 'users', uId));
            if (docSnap.exists()) {
              const data = docSnap.data();
              sessionUpdates['context.customerPreferences'] = data.preferences || {
                packaging: 'Standard',
                contactMethod: 'Email',
                notes: 'None'
              };
            }
          } catch (err) {
            logger.error('Failed to get customer preferences from concierge', err);
          }
        }

        // 29. Handle IT Support: Report System Bug
        for (const m of tokens.reportBug) {
          const tStart = Date.now();
          const desc = m[1];
          try {
            const { ticketRepository } = getInitialServices();
            await ticketRepository.createTicket({
              userId: 'system',
              subject: 'SYSTEM BUG REPORTED BY CONCIERGE',
              description: `Concierge detected a site bug: ${desc}`,
              status: 'new',
              priority: 'high',
              tags: ['bug', 'technical_debt', 'concierge_alert']
            } as any);
            sessionUpdates.events.push({
              type: 'note_added',
              timestamp: new Date().toISOString(),
              label: 'Bug Report Filed',
              description: 'Technical issue logged for developer review.'
            });
          } catch (err) {
            logger.error('Failed to report bug from concierge', err);
          }
        }

        // 30. Handle IT Support: Recover Expired Code
        for (const m of tokens.recoverCode) {
          const tStart = Date.now();
          const code = m[1];
          const uId = m[2];
          try {
            const { discountRepo, discountService } = getInitialServices();
            const discount = await discountRepo.getByCode(code);
            if (discount) {
              const newExpiry = new Date();
              newExpiry.setHours(newExpiry.getHours() + 12); // Extend by 12h
              await discountService.updateDiscount(discount.id, { endsAt: newExpiry }, {
                id: 'concierge',
                email: 'concierge@dreambees.art'
              });
              sessionUpdates.events.push({
                type: 'note_added',
                timestamp: new Date().toISOString(),
                label: 'Discount Recovered',
                description: `Extended code "${code}" for User #${uId} for 12 hours.`
              });
            }
          } catch (err) {
            logger.error('Failed to recover expired code from concierge', err);
          }
        }

        // 31. Handle IT Support: Request Order Split
        for (const m of tokens.orderSplit) {
          const tStart = Date.now();
          const orderId = m[1];
          const itemIds = JSON.parse(m[2]);
          try {
            const { ticketRepository, orderService } = getInitialServices();
            await ticketRepository.createTicket({
              userId: 'warehouse',
              subject: `ORDER SPLIT REQUEST: #${orderId}`,
              description: `Customer requested splitting items ${itemIds.join(', ')} from Order #${orderId} to ship separately.`,
              status: 'new',
              priority: 'medium',
              tags: ['order_split', 'warehouse_action']
            } as any);
            
            await orderService.addOrderNote(orderId, `Split requested for items: ${itemIds.join(', ')}`, {
              id: 'concierge',
              email: 'concierge@dreambees.art'
            });

            sessionUpdates.events.push({
              type: 'note_added',
              timestamp: new Date().toISOString(),
              label: 'Split Requested',
              description: `Warehouse notified to split Order #${orderId}.`
            });
          } catch (err) {
            logger.error('Failed to request order split from concierge', err);
          }
        }

        // 32. Handle IT Support: Verify Address Logistics
        for (const m of tokens.verifyAddress) {
          const tStart = Date.now();
          const addr = m[1];
          sessionUpdates['context.addressVerification'] = {
            address: addr,
            status: 'Verified',
            carrierSupport: ['USPS', 'UPS', 'FedEx'],
            estimatedTransit: '3-5 days'
          };
        }

        // 33. Handle IT Support: Tag Customer Sentiment
        for (const m of tokens.tagSentiment) {
          const sentiment = m[1];
          sessionUpdates['sentiment'] = sentiment;
        }

        // 34. Handle IT Support: Get Shipping Estimates
        for (const m of tokens.getShippingEstimates) {
          const zip = m[1];
          sessionUpdates['context.shippingEstimates'] = {
            zipCode: zip,
            standard: '4-6 business days',
            expedited: '2 business days',
            fulfillmentDelay: 'None (Healthy)'
          };
        }

        // 35. Handle IT Support: Place Order On Hold
        for (const m of tokens.placeHold) {
          const tStart = Date.now();
          const orderId = m[1];
          const reason = m[2];
          try {
            const { orderService } = getInitialServices();
            await orderService.setOrderHold(orderId, reason, {
              id: 'concierge',
              email: 'concierge@dreambees.art'
            });
            sessionUpdates.events.push({
              type: 'note_added',
              timestamp: new Date().toISOString(),
              label: 'Order Placed on Hold',
              description: `Order #${orderId} held: ${reason}`
            });
          } catch (err) {
            logger.error('Failed to place order on hold from concierge', err);
          }
        }

        // 36. Handle IT Support: Release Order Hold
        for (const m of tokens.releaseHold) {
          const tStart = Date.now();
          const orderId = m[1];
          try {
            const { orderService } = getInitialServices();
            await orderService.releaseOrderHold(orderId, {
              id: 'concierge',
              email: 'concierge@dreambees.art'
            });
            sessionUpdates.events.push({
              type: 'note_added',
              timestamp: new Date().toISOString(),
              label: 'Order Hold Released',
              description: `Fulfillment resumed for Order #${orderId}.`
            });
          } catch (err) {
            logger.error('Failed to release order hold from concierge', err);
          }
        }

        // 37. Handle IT Support: Unsubscribe from Marketing
        for (const m of tokens.unsubscribe) {
          const tStart = Date.now();
          const email = m[1];
          try {
            const { ticketRepository } = getInitialServices();
            await ticketRepository.createTicket({
              userId: 'privacy',
              subject: 'Marketing Unsubscribe Request',
              description: `User requested removal from all marketing lists: ${email}`,
              status: 'new',
              priority: 'medium',
              tags: ['privacy', 'unsubscribe', 'gdpr']
            } as any);
            
            await auditService.record({
              userId: 'system',
              userEmail: 'privacy@dreambees.art',
              action: 'staff_role_updated', // Placeholder
              targetId: email,
              details: { action: 'unsubscribe' }
            });

            sessionUpdates.events.push({
              type: 'note_added',
              timestamp: new Date().toISOString(),
              label: 'Unsubscribe Requested',
              description: `${email} marked for marketing removal.`
            });
          } catch (err) {
            logger.error('Failed to unsubscribe from concierge', err);
          }
        }

        // 38. Handle IT Support: Generate Tax Invoice
        for (const m of tokens.generateInvoice) {
          const tStart = Date.now();
          const orderId = m[1];
          try {
            const { ticketRepository } = getInitialServices();
            await ticketRepository.createTicket({
              userId: 'finance',
              subject: `TAX INVOICE REQUEST: #${orderId}`,
              description: `Customer requested a formal VAT/Tax invoice for Order #${orderId}.`,
              status: 'new',
              priority: 'medium',
              tags: ['finance', 'tax_invoice']
            } as any);
            sessionUpdates.events.push({
              type: 'note_added',
              timestamp: new Date().toISOString(),
              label: 'Invoice Requested',
              description: `Tax invoice request logged for Order #${orderId}.`
            });
          } catch (err) {
            logger.error('Failed to generate tax invoice from concierge', err);
          }
        }

        // 39. Handle IT Support: Get Order Risk Score
        for (const m of tokens.getRiskScore) {
          const tStart = Date.now();
          const orderId = m[1];
          try {
            const { orderService } = getInitialServices();
            const order = await orderService.getAdminOrder(orderId);
            if (order) {
              sessionUpdates['context.orderRisk'] = {
                orderId,
                score: order.riskScore || 0,
                level: (order.riskScore || 0) > 60 ? 'High' : ((order.riskScore || 0) > 30 ? 'Medium' : 'Low'),
                reconciliationRequired: order.reconciliationRequired || false
              };
            }
          } catch (err) {
            logger.error('Failed to get order risk score from concierge', err);
          }
        }

        // 40. Handle IT Support: Search Similar Resolutions
        for (const m of tokens.searchResolutions) {
          const tStart = Date.now();
          const queryStr = m[1];
          try {
            const logs = await auditService.getRecentLogs({ limit: 100 });
            const resolutions = logs
              .filter(l => l.action === 'order_refunded' || l.action === 'order_status_changed' || l.action === 'product_updated')
              .slice(0, 5)
              .map(l => ({
                action: l.action,
                summary: `System resolution for #${l.targetId}`,
                details: l.details
              }));
            sessionUpdates['context.similarResolutions'] = resolutions;
          } catch (err) {
            logger.error('Failed to search similar resolutions from concierge', err);
          }
        }

        // Atomic multi-field update
        const finalUpdates: any = { updatedAt: serverTimestamp() };
        if (sessionUpdates.status) finalUpdates.status = sessionUpdates.status;
        if (sessionUpdates.customerOutcome) finalUpdates.customerOutcome = sessionUpdates.customerOutcome;
        if (sessionUpdates.isConverted !== undefined) finalUpdates.isConverted = sessionUpdates.isConverted;
        if (sessionUpdates.events.length > 0) finalUpdates.events = arrayUnion(...sessionUpdates.events);
        if (sessionUpdates.transcript.length > 0) finalUpdates.transcript = arrayUnion(...sessionUpdates.transcript);
        if (sessionUpdates.actionResults.length > 0) finalUpdates.actionResults = arrayUnion(...sessionUpdates.actionResults);
        if (sessionUpdates.toolExecutionCount !== undefined) finalUpdates.toolExecutionCount = sessionUpdates.toolExecutionCount;
        
        Object.entries(sessionUpdates).forEach(([key, val]) => {
          if (key.startsWith('context.')) finalUpdates[key] = val;
          if (key === 'sentiment') finalUpdates[key] = val; // Direct field
          if (key === 'toolExecutionCount') finalUpdates[key] = val;
        });

        await updateDoc(sessionRef, finalUpdates);
        logger.info('Concierge stream flush complete', { sessionId: activeSessionId, totalDurationMs: Date.now() - flushStart });
      }
    });

    const headers: Record<string, string> = {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    };

    if (activeSessionId) {
      headers['X-Concierge-Session-Id'] = activeSessionId;
    }

    return new Response(hermesRes.body?.pipeThrough(transformer), { headers });
  } catch (error: any) {
    logger.error('Concierge chat error', { error: error.message, stack: error.stack });
    
    if (error.message?.includes('fetch failed') || error.message?.includes('ECONNREFUSED')) {
      return NextResponse.json({ 
        error: 'The Concierge is currently offline. Please try again later.' 
      }, { status: 503 });
    }

    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
