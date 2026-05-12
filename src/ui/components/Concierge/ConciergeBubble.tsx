'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, 
  X, 
  Send, 
  Loader2, 
  Sparkles, 
  ShoppingBag, 
  ArrowRight,
  ChevronDown,
  Minimize2,
  AlertCircle,
  RefreshCw,
  ShieldCheck
} from 'lucide-react';
import { usePathname } from 'next/navigation';
import { ClientChatMessage } from '@domain/concierge/types';

interface ConciergeBubbleProps {
  initialContext?: any;
  productInfo?: {
    name: string;
    id: string;
    description?: string;
  };
}

export const ConciergeBubble: React.FC<ConciergeBubbleProps> = ({ initialContext, productInfo }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ClientChatMessage[]>([
    { role: 'assistant', content: 'Hi! I\'m the DreamBees Concierge. How can I help you today?' }
  ]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showQuickReplies, setShowQuickReplies] = useState(true);
  const [isError, setIsError] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  const QUICK_REPLIES = [
    { label: '📦 Track my order', text: 'I want to track my order' },
    productInfo 
      ? { label: `🍎 Ask about ${productInfo.name}`, text: `Tell me more about ${productInfo.name}` }
      : { label: '🍎 Ask about a product', text: 'I have a question about a product' },
    initialContext?.cartContents?.length > 1
      ? { label: '🛒 Compare items in my cart', text: 'Can you help me compare the items I have in my cart?' }
      : { label: '🚚 Shipping & returns', text: 'What are your shipping and return policies?' },
    { label: '👋 Talk to support', text: 'I need to speak with a human' },
  ];

  useEffect(() => {
    // Personalized greeting if we have user info
    if (initialContext?.userSession?.name) {
      setMessages([
        { 
          role: 'assistant', 
          content: `Welcome back, ${initialContext.userSession.name}! How can I help you today?` 
        }
      ]);
    }
  }, [initialContext?.userSession?.id]);
  
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (e?: React.FormEvent, overrideValue?: string) => {
    e?.preventDefault();
    const messageText = overrideValue || inputValue.trim();
    if (!messageText || isLoading) return;

    const userMessage: ClientChatMessage = { role: 'user', content: messageText };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setShowQuickReplies(false);
    setIsError(false);

    try {
      const response = await fetch('/api/concierge/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          context: {
            ...initialContext,
            currentPage: pathname,
          },
          sessionId: sessionId || undefined
        })
      });

      if (!response.ok) throw new Error('Failed to send message');

      const data = await response.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.message }]);
      if (data.sessionId) setSessionId(data.sessionId);
    } catch (error) {
      console.error('Concierge Error:', error);
      setIsError(true);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'I\'m sorry, I\'m having trouble connecting right now. Please try again or contact us directly if the issue persists.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleOpen = () => setIsOpen(!isOpen);

  return (
    <div className="fixed bottom-6 right-6 z-9999 flex flex-col items-end gap-4 font-sans antialiased">
      {/* Chat Window */}
      {isOpen && (
        <div className="w-[400px] max-w-[92vw] h-[640px] max-h-[85vh] bg-white rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] border border-gray-100 flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-500 ease-out">
          {/* Header */}
          <div className="bg-white px-8 py-6 flex justify-between items-center border-b border-gray-50">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-gray-900 rounded-[1.25rem] flex items-center justify-center shadow-lg shadow-gray-200">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-gray-900 font-black text-sm tracking-tight leading-none mb-1">Concierge</h3>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-green-500 rounded-full" />
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Support Online</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
               <button 
                onClick={toggleOpen}
                className="p-2.5 hover:bg-gray-50 rounded-2xl transition-colors text-gray-400 hover:text-gray-900"
                aria-label="Minimize Chat"
              >
                <Minimize2 className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto px-6 py-8 space-y-6 styled-scrollbar bg-gray-50/20"
          >
            {messages.map((msg, i) => (
              <div 
                key={i} 
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
              >
                <div 
                  className={`max-w-[85%] px-5 py-4 rounded-3xl text-[14px] leading-relaxed font-medium ${
                    msg.role === 'user' 
                      ? 'bg-gray-900 text-white rounded-tr-none shadow-md' 
                      : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none shadow-sm'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            
            {showQuickReplies && messages.length === 1 && (
              <div className="flex flex-col gap-2.5 pt-4 animate-in fade-in slide-in-from-top-2 duration-700 delay-300">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-1 mb-1">Suggested for you</p>
                {QUICK_REPLIES.map((reply, i) => (
                  <button
                    key={i}
                    onClick={() => handleSendMessage(undefined, reply.text)}
                    className="text-left px-5 py-4 rounded-[1.25rem] bg-white border border-gray-100 text-xs font-bold text-gray-700 hover:border-gray-900 hover:bg-gray-50 transition-all shadow-sm active:scale-95 group flex items-center justify-between"
                  >
                    {reply.label}
                    <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                  </button>
                ))}
              </div>
            )}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white px-5 py-4 rounded-3xl rounded-tl-none shadow-sm border border-gray-100">
                  <div className="flex gap-1.5 items-center">
                    <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                    <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Concierge is thinking</span>
                  </div>
                </div>
              </div>
            )}

            {isError && (
              <div className="flex flex-col items-center gap-4 pt-4">
                 <div className="flex items-center gap-2 px-4 py-3 bg-red-50 text-red-700 rounded-2xl text-xs font-bold border border-red-100">
                   <AlertCircle className="h-4 w-4" />
                   Connection lost. Let's try that again.
                 </div>
                 <button 
                  onClick={() => handleSendMessage()}
                  className="flex items-center gap-2 px-6 py-2.5 bg-gray-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg active:scale-95"
                >
                  <RefreshCw className="h-3 w-3" />
                  Retry
                </button>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="px-6 py-6 bg-white border-t border-gray-50">
            <form 
              onSubmit={handleSendMessage}
              className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-3xl p-1.5 focus-within:ring-4 focus-within:ring-gray-100 focus-within:border-gray-200 transition-all shadow-inner"
            >
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask anything..."
                disabled={isLoading}
                className="flex-1 bg-transparent border-none text-sm px-4 focus:ring-0 placeholder:text-gray-400 font-medium disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!inputValue.trim() || isLoading}
                className="h-12 w-12 bg-gray-900 text-white rounded-2xl shadow-xl shadow-gray-200 hover:bg-black disabled:opacity-50 disabled:shadow-none transition-all active:scale-90 flex items-center justify-center"
              >
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
              </button>
            </form>
            <div className="flex justify-center pt-4">
               <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest flex items-center gap-1.5">
                 <ShieldCheck className="h-3 w-3" />
                 Safe & Secure Support
               </p>
            </div>
          </div>
        </div>
      )}

      {/* Toggle Button */}
      <button
        onClick={toggleOpen}
        className={`h-16 w-16 rounded-[1.75rem] flex items-center justify-center text-white shadow-[0_15px_40px_-10px_rgba(0,0,0,0.2)] transition-all duration-500 active:scale-90 group relative ${
          isOpen 
            ? 'bg-white text-gray-400 border border-gray-100 -rotate-90' 
            : 'bg-gray-900 hover:bg-black'
        }`}
        aria-label={isOpen ? "Close Chat" : "Open Concierge"}
      >
        {isOpen ? <ChevronDown className="h-8 w-8" /> : <MessageSquare className="h-8 w-8" />}
        {!isOpen && (
          <div className="absolute -top-1 -right-1 h-5 w-5 bg-primary-600 rounded-full border-[3px] border-white flex items-center justify-center shadow-lg animate-bounce">
             <Sparkles className="h-2.5 w-2.5 text-white" />
          </div>
        )}
      </button>
    </div>
  );
};
