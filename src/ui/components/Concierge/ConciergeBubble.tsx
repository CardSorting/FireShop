'use client';

import { useState, useRef, useEffect } from 'react';
import { 
  MessageCircle, 
  Send, 
  X, 
  Loader2, 
  Sparkles,
  ShoppingBag,
  Clock,
  ArrowRight,
  User,
  ChevronDown,
  Minimize2,
  AlertCircle,
  RefreshCw,
  ShieldCheck,
  Package,
  Ruler,
  RotateCcw,
  Zap,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { usePathname } from 'next/navigation';
import { ClientChatMessage } from '@domain/concierge/types';

export function ConciergeBubble() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ClientChatMessage[]>([
    { 
      role: 'assistant', 
      content: "Hi! I'm your DreamBees concierge. Whether you need help with an order, sizing advice for our plushies, or just want to compare products, I'm here to help." 
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [connStatus, setConnStatus] = useState<'online' | 'reconnecting' | 'offline'>('online');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Handle Personalized Greeting & Memory
  useEffect(() => {
    const checkReturning = async () => {
      const storedSessionId = localStorage.getItem('dream_concierge_session');
      if (storedSessionId) {
        setSessionId(storedSessionId);
        setIsSyncing(true);
        // Simulate sync
        setTimeout(() => {
          setIsSyncing(false);
          setMessages([{
            role: 'assistant',
            content: "Welcome back! I've synced your previous session. Is there anything else you need help with today?"
          }]);
        }, 800);
      }
    };
    checkReturning();
  }, []);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMsg: ClientChatMessage = { role: 'user', content: inputValue };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/concierge/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: userMsg.content,
          sessionId: sessionId,
          context: {
            currentPath: pathname,
            pageTitle: document.title,
            cartValue: 124.50 // Mocked cart value
          }
        })
      });

      if (!res.ok) throw new Error('Connection failed');

      const data = await res.json();
      if (data.sessionId && !sessionId) {
        setSessionId(data.sessionId);
        localStorage.setItem('dream_concierge_session', data.sessionId);
      }

      setMessages(prev => [...prev, { role: 'assistant', content: data.message }]);
      setConnStatus('online');
    } catch (error) {
      setConnStatus('reconnecting');
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "I'm having a little trouble connecting right now. Still here, just trying to reconnect to the store..." 
      }]);
      // Attempt retry
      setTimeout(() => setConnStatus('online'), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = (text: string) => {
    setInputValue(text);
  };

  const toggleOpen = () => setIsOpen(!isOpen);

  return (
    <div className="fixed bottom-6 right-6 z-9999 flex flex-col items-end gap-4 font-sans antialiased">
      {/* Chat Window */}
      {isOpen && (
        <div className="w-[400px] max-w-[92vw] h-[640px] max-h-[85vh] bg-white rounded-4xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] border border-gray-100 flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-500 ease-out">
          
          {/* Calm Header */}
          <div className="bg-gray-900 px-8 py-8 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <Sparkles className="h-20 w-20 text-white" />
            </div>
            <div className="relative z-10 flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2 mb-2">
                   {connStatus === 'online' ? (
                     <div className="h-2 w-2 bg-green-400 rounded-full animate-pulse"></div>
                   ) : (
                     <div className="h-2 w-2 bg-amber-400 rounded-full animate-pulse"></div>
                   )}
                   <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                     {connStatus === 'online' ? 'Concierge Online' : 'Reconnecting...'}
                   </span>
                </div>
                <h3 className="text-2xl font-black leading-tight">Helpful Support</h3>
              </div>
              <button 
                onClick={toggleOpen}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <Minimize2 className="h-5 w-5 text-gray-400" />
              </button>
            </div>
          </div>

          {/* Syncing Overlay */}
          {isSyncing && (
            <div className="flex-1 flex flex-col items-center justify-center p-10 text-center animate-pulse">
               <Loader2 className="h-8 w-8 text-gray-200 mb-4 animate-spin" />
               <p className="text-xs font-black text-gray-300 uppercase tracking-widest">Restoring Session...</p>
            </div>
          )}

          {/* Messages Area */}
          {!isSyncing && (
            <div className="flex-1 overflow-y-auto p-8 space-y-6 styled-scrollbar bg-white">
              {messages.map((msg, i) => (
                <div 
                  key={i} 
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
                >
                  <div 
                    className={`max-w-[85%] px-6 py-4 rounded-3xl text-[14px] leading-relaxed font-medium ${
                      msg.role === 'user' 
                        ? 'bg-gray-900 text-white rounded-tr-none shadow-md' 
                        : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none shadow-sm'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}

              {/* Conversion Assistance Actions */}
              {!isLoading && messages.length < 3 && (
                <div className="pt-4 grid grid-cols-1 gap-2 animate-in fade-in duration-700">
                  <button 
                    onClick={() => handleQuickAction("Can you help me compare these two items?")}
                    className="w-full text-left p-4 rounded-2xl bg-gray-50 border border-gray-100 hover:border-gray-900 transition-all group flex items-center gap-3"
                  >
                    <Zap className="h-4 w-4 text-gray-400 group-hover:text-gray-900" />
                    <span className="text-xs font-bold text-gray-600 group-hover:text-gray-900">Compare products</span>
                    <ArrowRight className="h-3 w-3 ml-auto opacity-0 group-hover:opacity-100 transition-all" />
                  </button>
                  <button 
                    onClick={() => handleQuickAction("Tell me about shipping to my region.")}
                    className="w-full text-left p-4 rounded-2xl bg-gray-50 border border-gray-100 hover:border-gray-900 transition-all group flex items-center gap-3"
                  >
                    <Package className="h-4 w-4 text-gray-400 group-hover:text-gray-900" />
                    <span className="text-xs font-bold text-gray-600 group-hover:text-gray-900">Shipping & Delivery</span>
                    <ArrowRight className="h-3 w-3 ml-auto opacity-0 group-hover:opacity-100 transition-all" />
                  </button>
                </div>
              )}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white px-5 py-4 rounded-3xl rounded-tl-none shadow-sm border border-gray-100">
                    <div className="flex gap-1.5 items-center">
                      <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce"></span>
                      <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                      <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}

          {/* Reassurance Footer */}
          <div className="px-8 py-4 bg-gray-50/50 border-t border-gray-50 flex items-center justify-between">
             <div className="flex items-center gap-2">
                <ShieldCheck className="h-3 w-3 text-green-500" />
                <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">Secure Store Checkout</span>
             </div>
             <div className="flex items-center gap-2">
                <CheckCircle2 className="h-3 w-3 text-gray-400" />
                <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">Support Updated</span>
             </div>
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
                placeholder="Ask us anything..."
                className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-medium px-4 py-2 text-gray-800 placeholder:text-gray-400"
              />
              <button
                type="submit"
                disabled={!inputValue.trim() || isLoading}
                className="h-12 w-12 bg-gray-900 text-white rounded-2xl shadow-xl shadow-gray-200 hover:bg-black disabled:opacity-50 disabled:shadow-none transition-all active:scale-95 flex items-center justify-center"
              >
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Toggle Button */}
      <button 
        onClick={toggleOpen}
        className="h-16 w-16 bg-gray-900 rounded-full shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5)] flex items-center justify-center text-white hover:scale-105 active:scale-95 transition-all group relative"
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-7 w-7" />}
        {!isOpen && messages.length > 1 && (
          <div className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 border-2 border-white rounded-full animate-bounce"></div>
        )}
      </button>
    </div>
  );
}
