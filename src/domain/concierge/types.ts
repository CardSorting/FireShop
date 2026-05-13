export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ClientChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ConciergeContext {
  currentPage?: string;
  cartContents?: any[];
  userSession?: {
    id: string;
    email: string;
    name?: string;
  };
  orderHistory?: any[];
  inventoryState?: any;
  activePromotions?: any[];
  shippingPolicy?: string;
  returnPolicy?: string;
}

export type EscalationCategory = 
  | 'order_status' 
  | 'shipping_delay' 
  | 'return_refund' 
  | 'product_question' 
  | 'inventory_question' 
  | 'checkout_issue' 
  | 'damaged_missing' 
  | 'complaint' 
  | 'other';

export interface ConciergeEscalation {
  summary: string;
  category: EscalationCategory;
  urgency: 'low' | 'medium' | 'high' | 'urgent';
  reason: string;
  customerSentiment: 'happy' | 'neutral' | 'frustrated' | 'angry';
}

export const sanitizeClientMessages = (messages: any[]): ClientChatMessage[] => {
  return messages
    .filter(m => (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content.trim().length > 0)
    .map(m => {
      let content = m.content.trim();
      // Security Hardening: Strip internal tool-calling tokens from user messages
      // to prevent "Instruction Injection" where a user tries to pre-signal a tool.
      if (m.role === 'user') {
        content = content.replace(/\[/g, '【').replace(/\]/g, '】');
        // Prevent common injection keywords
        const forbiddenPatterns = [
          /ignore (all )?previous instructions/gi,
          /system prompt/gi,
          /you are now/gi,
          /new role/gi,
          /developer mode/gi
        ];
        forbiddenPatterns.forEach(pattern => {
          content = content.replace(pattern, '[REDACTED_INJECTION_ATTEMPT]');
        });
      }
      return {
        role: m.role as 'user' | 'assistant',
        content,
      };
    });
};
