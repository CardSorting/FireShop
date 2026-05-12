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
    .map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content.trim(),
    }));
};
