import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { sanitizeClientMessages } from '@domain/concierge/types';
import { createHermesChatCompletionStream } from '@infrastructure/services/HermesService';
import { logger } from '@utils/logger';
import { z } from 'zod';
import { DEFAULT_CONCIERGE_SETTINGS } from '@domain/concierge/settings';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { getUnifiedDb, collection, addDoc, serverTimestamp, updateDoc, doc, arrayUnion, getDoc } from '@infrastructure/firebase/bridge';
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
    let activeSessionId = sessionId;
    let mergedContext = context || {};

    if (!activeSessionId) {
      const sessionRef = await addDoc(collection(db, 'conciergeSessions'), {
        userId: context?.userSession?.id || 'anonymous',
        customerEmail: context?.userSession?.email || 'anonymous',
        customerName: context?.userSession?.name || 'Anonymous User',
        context: mergedContext,
        transcript: sanitizedMessages,
        status: 'active',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      activeSessionId = sessionRef.id;
    } else {
      const sessionRef = doc(db, 'conciergeSessions', activeSessionId);
      const sessionSnap = await getDoc(sessionRef);
      if (sessionSnap.exists()) {
        const sessionData = sessionSnap.data();
        mergedContext = { ...(sessionData.context || {}), ...mergedContext };
      }
      await updateDoc(sessionRef, {
        transcript: sanitizedMessages,
        context: mergedContext,
        updatedAt: serverTimestamp(),
      });
    }

    // Prepare context string for the AI
    let contextString = `Session ID: ${activeSessionId}\n`;
    
    // Atmospheric Context
    const now = new Date();
    const dayName = now.toLocaleDateString('en-US', { weekday: 'long' });
    const timeOfDay = now.getHours() < 12 ? 'morning' : now.getHours() < 17 ? 'afternoon' : 'evening';
    contextString += `Atmospheric Context: It is a ${dayName} ${timeOfDay} at the DreamBees Studio.\n`;
    
    if (mergedContext) {
      if (mergedContext.currentPage) contextString += `Current Page: ${mergedContext.currentPage}\n`;
      if (mergedContext.cartContents && mergedContext.cartContents.length > 0) {
        contextString += `Cart Contents: ${JSON.stringify(mergedContext.cartContents)}\n`;
      }
      if (mergedContext.userSession) {
        contextString += `Customer: ${mergedContext.userSession.name || mergedContext.userSession.email} (${mergedContext.userSession.id})\n`;
      }
      if (mergedContext.recentlyViewed && mergedContext.recentlyViewed.length > 1) {
        contextString += `Recently Viewed: ${mergedContext.recentlyViewed.filter((t: string) => t !== (mergedContext.pageTitle || '')).join(', ')}\n`;
        contextString += `HINT: Mention these other items if they seem hesitant or want to bundle.\n`;
      }
      if (mergedContext.activePromotions && mergedContext.activePromotions.length > 0) {
        contextString += `Active Promotions: ${JSON.stringify(mergedContext.activePromotions)}\n`;
      }
      // Inject fetched order details if any
      if (mergedContext.fetchedOrders) {
        contextString += `\n### FETCHED ORDER DETAILS\n`;
        contextString += `${JSON.stringify(mergedContext.fetchedOrders)}\n`;
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
      sessionId: activeSessionId
    });

    const hermesRes = await createHermesChatCompletionStream(sanitizedMessages, undefined, contextString);

    // Create a transform stream to detect barter success tokens
    const { discountService } = getInitialServices();
    let fullResponse = '';
    
    const transformer = new TransformStream({
      async transform(chunk, controller) {
        const text = new TextDecoder().decode(chunk);
        fullResponse += text;
        controller.enqueue(chunk);
      },
      async flush(controller) {
        const { discountService, orderService, ticketRepository } = getInitialServices();
        const db = getUnifiedDb();
        const sessionRef = activeSessionId ? doc(db, 'conciergeSessions', activeSessionId) : null;
        if (!sessionRef) return;

        const sessionUpdates: any = {
          events: [],
          transcript: []
        };

        const userId = context?.userSession?.id || 'anonymous';

        // 1. Handle Barter Success
        const barterMatch = fullResponse.match(/\[BARTER_SUCCESS:\s*(\d+)%\]/);
        if (barterMatch) {
          const percentage = parseInt(barterMatch[1]);
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

        // 2. Handle IT Support: Open Ticket
        const openTicketMatch = fullResponse.match(/\[OPEN_TICKET:\s*"([^"]+)",\s*"([^"]+)"\]/);
        if (openTicketMatch) {
          const subject = openTicketMatch[1];
          const description = openTicketMatch[2];
          try {
            const ticketId = crypto.randomUUID();
            await ticketRepository.createTicket({
              id: ticketId,
              userId: userId,
              customerEmail: context?.userSession?.email || 'anonymous',
              customerName: context?.userSession?.name || 'Anonymous User',
              subject,
              status: 'new',
              priority: 'medium',
              type: 'incident',
              tags: ['concierge_it_support'],
              messages: [
                {
                  id: crypto.randomUUID(),
                  ticketId,
                  senderId: 'concierge',
                  senderType: 'system',
                  visibility: 'public',
                  content: description,
                  createdAt: new Date()
                }
              ],
              createdAt: new Date(),
              updatedAt: new Date()
            } as any);

            sessionUpdates.events.push({
              type: 'escalated',
              timestamp: new Date().toISOString(),
              label: 'IT Ticket Opened',
              description: `Ticket #${ticketId} created: ${subject}`
            });
          } catch (err) {
            logger.error('Failed to open ticket from concierge', err);
            sessionUpdates.events.push({
              type: 'note_added',
              timestamp: new Date().toISOString(),
              label: 'Ticket Creation Failed',
              description: `Failed to create ticket: ${subject}`
            });
          }
        }

        // 3. Handle IT Support: Close Ticket
        const closeTicketMatch = fullResponse.match(/\[CLOSE_TICKET:\s*"([^"]+)"\]/);
        if (closeTicketMatch) {
          const ticketId = closeTicketMatch[1];
          try {
            // Security Hardening: Verify ticket belongs to user before closing
            const ticket = await ticketRepository.getTicketById(ticketId);
            if (ticket && ticket.userId === userId) {
              await ticketRepository.updateTicketStatus(ticketId, 'closed');
              sessionUpdates.events.push({
                type: 'resolved',
                timestamp: new Date().toISOString(),
                label: 'Ticket Closed',
                description: `Ticket #${ticketId} marked as resolved by Concierge.`
              });
            } else {
              throw new Error('Unauthorized or ticket not found');
            }
          } catch (err) {
            logger.error('Failed to close ticket from concierge', err);
            sessionUpdates.events.push({
              type: 'note_added',
              timestamp: new Date().toISOString(),
              label: 'Ticket Closure Failed',
              description: `Ticket #${ticketId} could not be closed (Unauthorized).`
            });
          }
        }

        // 4. Handle IT Support: Fetch Order Details
        const fetchOrderMatch = fullResponse.match(/\[FETCH_ORDER_DETAILS:\s*"([^"]+)"\]/);
        if (fetchOrderMatch) {
          const orderId = fetchOrderMatch[1];
          try {
            // Forensic Hardening: Enforce ownership on fetch
            const order = await orderService.getOrder(orderId, userId === 'anonymous' ? undefined : userId);
            if (order) {
              // Context Hardening: Strip sensitive forensics before re-injecting to AI context
              const sanitizedOrder = {
                id: order.id,
                status: order.status,
                total: order.total,
                createdAt: order.createdAt,
                items: order.items.map(i => ({ name: i.name, quantity: i.quantity })),
                shippingStatus: order.status, // Fallback
                estimatedDelivery: order.estimatedDeliveryDate,
                trackingNumber: order.fulfillments?.[0]?.trackingNumber,
                shippingCity: order.shippingAddress.city,
                shippingState: order.shippingAddress.state
              };

              sessionUpdates[`context.fetchedOrders.${orderId}`] = sanitizedOrder;
              sessionUpdates.events.push({
                type: 'note_added',
                timestamp: new Date().toISOString(),
                label: 'Order Details Fetched',
                description: `Order #${orderId} details retrieved for concierge context.`
              });
            } else {
              throw new Error('Order not found or unauthorized');
            }
          } catch (err) {
            logger.error('Failed to fetch order details for concierge', err);
            sessionUpdates.events.push({
              type: 'note_added',
              timestamp: new Date().toISOString(),
              label: 'Order Fetch Failed',
              description: `Unauthorized attempt to fetch Order #${orderId}`
            });
          }
        }

        // 5. Handle IT Support: Add Order Note
        const addNoteMatch = fullResponse.match(/\[ADD_ORDER_NOTE:\s*"([^"]+)",\s*"([^"]+)"\]/);
        if (addNoteMatch) {
          const orderId = addNoteMatch[1];
          const noteText = addNoteMatch[2];
          try {
            // Security Hardening: Ensure user owns the order before allowing a note
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
            }
          } catch (err) {
            logger.error('Failed to add order note from concierge', err);
          }
        }

        // Production Hardening: Atomic multi-field update
        const finalUpdates: any = { updatedAt: serverTimestamp() };
        if (sessionUpdates.status) finalUpdates.status = sessionUpdates.status;
        if (sessionUpdates.customerOutcome) finalUpdates.customerOutcome = sessionUpdates.customerOutcome;
        if (sessionUpdates.isConverted !== undefined) finalUpdates.isConverted = sessionUpdates.isConverted;
        
        // Append events and transcript if they exist
        if (sessionUpdates.events.length > 0) finalUpdates.events = arrayUnion(...sessionUpdates.events);
        if (sessionUpdates.transcript.length > 0) finalUpdates.transcript = arrayUnion(...sessionUpdates.transcript);
        
        // Add any specific dynamic context updates
        Object.entries(sessionUpdates).forEach(([key, val]) => {
          if (key.startsWith('context.')) finalUpdates[key] = val;
        });

        await updateDoc(sessionRef, finalUpdates);
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
