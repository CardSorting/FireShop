import { NextRequest, NextResponse } from 'next/server';
import { sanitizeClientMessages } from '@domain/concierge/types';
import { createHermesChatCompletionStream } from '@infrastructure/services/HermesService';
import { logger } from '@utils/logger';
import { z } from 'zod';
import { DEFAULT_CONCIERGE_SETTINGS } from '@domain/concierge/settings';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { getDb } from '@infrastructure/firebase/firebase';
import { collection, addDoc, serverTimestamp, updateDoc, doc, arrayUnion } from 'firebase/firestore';
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
    const db = getDb();
    let activeSessionId = sessionId;

    if (!activeSessionId) {
      const sessionRef = await addDoc(collection(db, 'conciergeSessions'), {
        userId: context?.userSession?.id || 'anonymous',
        customerEmail: context?.userSession?.email || 'anonymous',
        customerName: context?.userSession?.name || 'Anonymous User',
        context: context || {},
        transcript: sanitizedMessages,
        status: 'active',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      activeSessionId = sessionRef.id;
    } else {
      const sessionRef = doc(db, 'conciergeSessions', activeSessionId);
      await updateDoc(sessionRef, {
        transcript: sanitizedMessages,
        updatedAt: serverTimestamp(),
      });
    }

    // Prepare context string for the AI
    let contextString = `Session ID: ${activeSessionId}\n`;
    if (context) {
      if (context.currentPage) contextString += `Current Page: ${context.currentPage}\n`;
      if (context.cartContents && context.cartContents.length > 0) {
        contextString += `Cart Contents: ${JSON.stringify(context.cartContents)}\n`;
      }
      if (context.userSession) {
        contextString += `Customer: ${context.userSession.name || context.userSession.email} (${context.userSession.id})\n`;
      }
      if (context.activePromotions && context.activePromotions.length > 0) {
        contextString += `Active Promotions: ${JSON.stringify(context.activePromotions)}\n`;
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

    // Add session ID to headers so client can track it
    const responseHeaders = new Headers(hermesRes.headers);
    responseHeaders.set('X-Concierge-Session-Id', activeSessionId);

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
        // After stream is done, check for barter success
        const barterMatch = fullResponse.match(/\[BARTER_SUCCESS:\s*(\d+)%\]/);
        if (barterMatch && activeSessionId) {
          const percentage = parseInt(barterMatch[1]);
          try {
            const discount = await discountService.createBarterDiscount(percentage, activeSessionId);
            const db = getDb();
            const sessionRef = doc(db, 'conciergeSessions', activeSessionId);
            await updateDoc(sessionRef, {
              status: 'analyzed',
              customerOutcome: 'converted',
              isConverted: true,
              events: arrayUnion({
                type: 'outcome_tracked',
                timestamp: new Date().toISOString(),
                label: 'Barter Success',
                description: `Customer agreed to ${percentage}% discount. Code: ${discount.code}`
              })
            });
            
            // Note: Since the stream is already finished, we can't easily "inject" into the middle.
            // But we can append a final message or have the client handle the replacement.
            // For now, we'll append the success confirmation to the session transcript.
            await updateDoc(sessionRef, {
              transcript: arrayUnion({ 
                role: 'assistant', 
                content: `Perfect! I've generated your unique code: ${discount.code}. You can use this at checkout. It expires in 24 hours.` 
              })
            });
          } catch (err) {
            logger.error('Failed to fulfill barter', err);
          }
        }
      }
    });

    return new Response(hermesRes.body?.pipeThrough(transformer), {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Concierge-Session-Id': activeSessionId
      },
    });
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
