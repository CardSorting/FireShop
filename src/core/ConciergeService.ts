/**
 * [LAYER: CORE]
 * Concierge Service handles the business logic for the storefront assistant.
 * It processes chat sessions to extract support insights and operator suggestions.
 */
import { SupportTicket, TicketMessage } from '@domain/models';
import { logger } from '@utils/logger';
import { createHermesChatCompletion } from '@infrastructure/services/HermesService';
import { getUnifiedDb, collection, addDoc, serverTimestamp, updateDoc, doc, getDoc, query, where, orderBy, limit, getDocs } from '@infrastructure/firebase/bridge';

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
  customerOutcome?: 'resolved' | 'escalated' | 'abandoned' | 'converted';
  operatorOutcome?: 'suggestion_accepted' | 'suggestion_dismissed' | 'resolved_manually';
  isConverted?: boolean;
  assignedOperator?: string;
  isRepeatIssue?: boolean;
  repeatFrequency?: number;
  followUpDate?: string;
  isSnoozed?: boolean;
  operatorFeedback?: Array<{
    suggestionIndex: number;
    feedback: 'helpful' | 'not_useful';
    note?: string;
  }>;
  events?: Array<{
    type: 'joined' | 'escalated' | 'note_added' | 'resolved' | 'analyzed' | 'reopened' | 'outcome_tracked' | 'assigned' | 'reminder_set';
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
      
      const db = getUnifiedDb();
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
          const summaries = sessionsSnap.docs.map((doc: any) => doc.data().summary).join("; ");
          memoryPrompt = `\n### CUSTOMER HISTORY\nThe customer has ${repeatFrequency} previous sessions. Recent issues: ${summaries}. Be aware of this if they mention recurring problems.\n`;
        }
      }

      const analysisPrompt = `
        Analyze the following ecommerce support chat transcript.${memoryPrompt}
        
        ### OPERATIONAL GUIDELINES
        1. FACTS vs ASSUMPTIONS: Clearly distinguish what the customer stated (Facts) vs what we are interpreting (Patterns).
        2. AMBIGUITY: If a customer mentions "it" or "this order" without specific details, recommend asking for clarification.
        3. HONESTY: Never guess inventory or policy. If uncertain, flag it for manual review.
        4. CONVERSION: Identify high-intent signals like "does this run large" or "how fast is shipping to X".
        5. TONE: Avoid "AI certainty". Use "Customers frequently mentioned..." or "A recurring pattern was detected...".

        Return the result in JSON format:
        {
          "summary": "Plain-language summary of the customer struggle",
          "category": "order_status" | "shipping_delay" | "return_refund" | "product_question" | "inventory_question" | "checkout_issue" | "damaged_missing_item" | "complaint" | "other",
          "urgency": "low" | "medium" | "high",
          "sentiment": "positive" | "neutral" | "frustrated" | "angry",
          "customerNeed": "What the customer is trying to achieve",
          "recommendedAction": "A calm next step for the operator (e.g. 'Clarify order date', 'Check back-stock')",
          "escalationNeeded": boolean,
          "escalationReason": "The specific evidence-backed reason for human follow-up",
          "evidenceQuotes": ["Direct customer quotes grounding this analysis"],
          "confidence": "low" | "medium" | "high",
          "uncertaintyNote": "Explain why we might be unsure (e.g. 'Customer was vague about product ID')",
          "relatedProductIds": [],
          "relatedOrderIds": [],
          "insights": ["Observation based on evidence", "Recurring friction pattern"],
          "suggestions": [
            {
              "action": "The suggested fix",
              "why": "The evidence-backed reason (e.g. 'Seen in 4 previous sessions')",
              "expectedOutcome": "Benefit of the fix",
              "risk": "Low" | "Medium" | "High",
              "confidence": "Low" | "Medium" | "High",
              "source": "Supporting signal",
              "impact": "conversion" | "support_burden" | "loyalty",
              "isAssumption": boolean
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
    const db = getUnifiedDb();
    
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
      messages: transcript.map((m: any, i: number) => ({
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

  /**
   * Generates store-wide operational intelligence by analyzing recent sessions.
   * This powers the "Operational Digest" and "Strategic Observation" in the Admin panel.
   */
  async generateStoreDigest() {
    try {
      const db = getUnifiedDb();
      // Fetch last 50 analyzed sessions
      const sessionsQuery = query(
        collection(db, 'conciergeSessions'),
        where('status', 'in', ['analyzed', 'resolved']),
        orderBy('createdAt', 'desc'),
        limit(50)
      );
      const sessionsSnap = await getDocs(sessionsQuery);
      const summaries = sessionsSnap.docs.map((d: any) => ({
        summary: d.data().summary,
        category: d.data().category,
        outcome: d.data().customerOutcome
      }));

      const digestPrompt = `
        Analyze the following recent customer session summaries for a DreamBees store.
        Identify the most significant friction points and strategic opportunities.
        
        SESSIONS:
        ${JSON.stringify(summaries)}

        Return a JSON object with:
        {
          "strategicObservation": "A high-level natural language observation about store health (e.g. '14% of customers hesitating due to shipping')",
          "digestItems": [
            { "title": "Short Title", "desc": "Contextual description", "action": "Recommended Fix", "type": "conversion" | "support_burden" }
          ],
          "trustScore": number (0-100)
        }
      `;

      const result = await createHermesChatCompletion([], digestPrompt, 'Generate Store Intelligence Digest');
      return JSON.parse(result);
    } catch (error) {
      logger.error('Failed to generate store digest', error);
      return null;
    }
  }
}

export const conciergeService = new ConciergeService();
