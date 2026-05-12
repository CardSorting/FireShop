/**
 * [LAYER: CORE]
 * Concierge Service handles the business logic for the storefront assistant.
 * It processes chat sessions to extract support insights and operator suggestions.
 */
import { SupportTicket, TicketMessage } from '@domain/models';
import { logger } from '@utils/logger';
import { createHermesChatCompletion } from '@infrastructure/services/HermesService';
import { getDb } from '@infrastructure/firebase/firebase';
import { collection, addDoc, serverTimestamp, updateDoc, doc, getDoc, query, where, orderBy, limit, getDocs } from 'firebase/firestore';

export interface ConciergeSession {
  id?: string;
  userId?: string;
  customerEmail?: string;
  customerName?: string;
  transcript: Array<{ role: string; content: string }>;
  context: any;
  summary?: string;
  category?: string;
  urgency?: 'low' | 'medium' | 'high';
  sentiment?: 'positive' | 'neutral' | 'frustrated' | 'angry';
  customerNeed?: string;
  recommendedAction?: string;
  escalationNeeded?: boolean;
  escalationReason?: string;
  evidenceQuotes?: string[];
  confidence?: 'low' | 'medium' | 'high';
  relatedProductIds?: string[];
  relatedOrderIds?: string[];
  insights?: string[];
  suggestions?: Array<{
    action: string;
    why: string;
    expectedOutcome: string;
    risk: string;
    confidence: string;
    source: string;
  }>;
  ticketId?: string;
  status: 'active' | 'completed' | 'analyzed' | 'resolved' | 'failed';
  responseStatus?: 'waiting_on_store' | 'waiting_on_customer' | 'handled_by_concierge';
  assignedOperator?: string;
  isRepeatIssue?: boolean;
  repeatFrequency?: number;
  events?: Array<{
    type: 'joined' | 'escalated' | 'note_added' | 'resolved' | 'analyzed' | 'reopened';
    timestamp: any;
    label: string;
    description?: string;
    operator?: string;
  }>;
  createdAt: any;
  updatedAt: any;
}

export class ConciergeService {
  /**
   * Finalizes a concierge session by analyzing it for insights and suggestions.
   * This is Layer 2 & 3 of the architecture.
   */
  async analyzeSession(sessionId: string, transcript: Array<{ role: string; content: string }>) {
    try {
      logger.info('Analyzing Concierge session', { sessionId });
      
      const db = getDb();
      const sessionDoc = await getDoc(doc(db, 'conciergeSessions', sessionId));
      const sessionData = sessionDoc.data() as ConciergeSession;

      // Get previous sessions for memory if we have a userId
      let memoryPrompt = "";
      let repeatFrequency = 0;
      if (sessionData?.userId && sessionData.userId !== 'anonymous') {
        const sessionsQuery = query(
          collection(db, 'conciergeSessions'),
          where('userId', '==', sessionData.userId),
          where('status', 'in', ['analyzed', 'resolved']),
          orderBy('createdAt', 'desc'),
          limit(5)
        );
        const sessionsSnap = await getDocs(sessionsQuery);
        repeatFrequency = sessionsSnap.size;
        if (!sessionsSnap.empty) {
          const summaries = sessionsSnap.docs.map(doc => doc.data().summary).join("; ");
          memoryPrompt = `\n### CUSTOMER HISTORY\nThe customer has ${repeatFrequency} previous sessions. Recent issues: ${summaries}. Be aware of this if they mention recurring problems.\n`;
        }
      }

      const analysisPrompt = `
        Analyze the following ecommerce support chat transcript.${memoryPrompt}
        
        Return the result in JSON format:
        {
          "summary": "Concise summary of the user's struggle",
          "category": "order_status" | "shipping_delay" | "return_refund" | "product_question" | "inventory_question" | "checkout_issue" | "damaged_missing_item" | "complaint" | "other",
          "urgency": "low" | "medium" | "high",
          "sentiment": "positive" | "neutral" | "frustrated" | "angry",
          "customerNeed": "What the customer is trying to achieve",
          "recommendedAction": "Clear next step for the operator",
          "escalationNeeded": boolean,
          "escalationReason": "Why this needs human attention",
          "evidenceQuotes": ["Quote 1", "Quote 2"],
          "confidence": "low" | "medium" | "high",
          "relatedProductIds": [],
          "relatedOrderIds": [],
          "insights": ["Specific observation 1", "Specific observation 2"],
          "suggestions": [
            {
              "action": "Actionable fix",
              "why": "Specific signal",
              "expectedOutcome": "Benefit",
              "risk": "Low" | "Medium" | "High",
              "confidence": "Low" | "Medium" | "High",
              "source": "Signal or quote"
            }
          ]
        }
      `;

      const analysisResult = await createHermesChatCompletion(
        transcript as any,
        analysisPrompt,
        'Analyze for Layer 2 Support Intelligence and Layer 3 Operator Suggestions.'
      );

      let parsedResult;
      try {
        parsedResult = JSON.parse(analysisResult);
      } catch (e) {
        logger.error('Failed to parse analysis result JSON', { analysisResult });
        parsedResult = { summary: analysisResult, insights: [], suggestions: [] };
      }

      // Update the session in Firestore
      const sessionRef = doc(db, 'conciergeSessions', sessionId);
      await updateDoc(sessionRef, {
        summary: parsedResult.summary,
        category: parsedResult.category,
        urgency: parsedResult.urgency,
        sentiment: parsedResult.sentiment,
        customerNeed: parsedResult.customerNeed,
        recommendedAction: parsedResult.recommendedAction,
        escalationNeeded: parsedResult.escalationNeeded,
        escalationReason: parsedResult.escalationReason,
        relatedProductIds: parsedResult.relatedProductIds,
        relatedOrderIds: parsedResult.relatedOrderIds,
        evidenceQuotes: parsedResult.evidenceQuotes,
        insights: parsedResult.insights,
        suggestions: parsedResult.suggestions,
        status: 'analyzed',
        isRepeatIssue: repeatFrequency > 0,
        repeatFrequency: repeatFrequency,
        updatedAt: serverTimestamp()
      });

      // If escalation is needed, automatically create a ticket
      if (parsedResult.escalationNeeded) {
        const sessionDoc = await getDoc(sessionRef);
        const sessionData = sessionDoc.data();
        if (sessionData) {
          await this.escalateToTicket(
            sessionData.userId,
            sessionData.customerEmail,
            sessionData.customerName,
            `Concierge Escalation: ${parsedResult.summary}`,
            transcript,
            parsedResult.category,
            parsedResult.urgency,
            parsedResult.escalationReason
          );
        }
      }

      logger.info('Concierge session analyzed successfully', { sessionId });
      return parsedResult;
    } catch (error: any) {
      logger.error('Failed to analyze Concierge session', { sessionId, error: error.message });
      throw error;
    }
  }

  /**
   * Escalates a chat session to a support ticket.
   */
  async escalateToTicket(userId: string, email: string, name: string, subject: string, transcript: any[], category?: string, urgency?: string, reason?: string): Promise<string> {
    const db = getDb();
    
    // Create the ticket
    const ticketData = {
      userId,
      customerEmail: email,
      customerName: name,
      subject,
      status: 'new',
      priority: urgency || 'medium',
      type: category === 'product_question' ? 'question' : 'incident',
      tags: ['concierge_escalation', category || 'other'],
      metadata: {
        escalationReason: reason,
        conciergeCategory: category,
        conciergeUrgency: urgency
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      messages: transcript.map((m, i) => ({
        id: `msg_${i}`,
        senderId: m.role === 'user' ? userId : 'system',
        senderType: m.role === 'user' ? 'customer' : 'system',
        visibility: 'public',
        content: m.content,
        createdAt: new Date()
      }))
    };

    const ticketRef = await addDoc(collection(db, 'tickets'), ticketData);
    logger.info('Escalated Concierge session to ticket', { ticketId: ticketRef.id, userId });
    
    return ticketRef.id;
  }
}

export const conciergeService = new ConciergeService();
