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
          transcript: []
        };

        const userId = context?.userSession?.id || 'anonymous';
        const userEmail = context?.userSession?.email || 'anonymous';
        const correlationId = crypto.randomUUID();

        // Payload Sanitization Helpers
        const cleanPayload = (s: string, max: number) => s.trim().slice(0, max).replace(/[<>]/g, '');

        // Forensic Hardening: Deduplicate tokens to prevent redundant execution
        const tokens = {
          barter: Array.from(fullResponse.matchAll(/\[BARTER_SUCCESS:\s*(\d+)%\]/g)),
          openTicket: Array.from(fullResponse.matchAll(/\[OPEN_TICKET:\s*"([^"]+)",\s*"([^"]+)"\]/g)),
          closeTicket: Array.from(fullResponse.matchAll(/\[CLOSE_TICKET:\s*"([^"]+)"\]/g)),
          fetchOrder: Array.from(fullResponse.matchAll(/\[FETCH_ORDER_DETAILS:\s*"([^"]+)"\]/g)),
          addNote: Array.from(fullResponse.matchAll(/\[ADD_ORDER_NOTE:\s*"([^"]+)",\s*"([^"]+)"\]/g))
        };

        // 1. Handle Barter Success
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

        // Atomic multi-field update
        const finalUpdates: any = { updatedAt: serverTimestamp() };
        if (sessionUpdates.status) finalUpdates.status = sessionUpdates.status;
        if (sessionUpdates.customerOutcome) finalUpdates.customerOutcome = sessionUpdates.customerOutcome;
        if (sessionUpdates.isConverted !== undefined) finalUpdates.isConverted = sessionUpdates.isConverted;
        if (sessionUpdates.events.length > 0) finalUpdates.events = arrayUnion(...sessionUpdates.events);
        if (sessionUpdates.transcript.length > 0) finalUpdates.transcript = arrayUnion(...sessionUpdates.transcript);
        
        Object.entries(sessionUpdates).forEach(([key, val]) => {
          if (key.startsWith('context.')) finalUpdates[key] = val;
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
