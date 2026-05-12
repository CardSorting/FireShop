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
import { ConciergeSettings } from '@domain/concierge/settings';
import { useCart } from '@ui/hooks/useCart';
import { useAuth } from '@ui/hooks/useAuth';

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
  const [settings, setSettings] = useState<ConciergeSettings | null>(null);
  const [isDealReached, setIsDealReached] = useState(false);
  const [agreedPercentage, setAgreedPercentage] = useState<number | null>(null);
  const [isOffering, setIsOffering] = useState(false);
  const [offerValue, setOfferValue] = useState('');
  const [statusMessage, setStatusMessage] = useState('Concierge is online');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const { cart, subtotal } = useCart();
  const { user } = useAuth();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Handle Personalized Greeting & Memory
  // Handle Session Syncing & Persistence
  useEffect(() => {
    const syncSession = async () => {
      const storedSessionId = localStorage.getItem('dream_concierge_session');
      if (!storedSessionId) return;

      setIsSyncing(true);
      try {
        const res = await fetch(`/api/admin/concierge/sessions?id=${storedSessionId}`);
        if (res.ok) {
          const session = await res.json();
          if (session && session.status !== 'resolved') {
            setSessionId(storedSessionId);
            setMessages(session.transcript || []);
            setConnStatus('online');
          } else {
             localStorage.removeItem('dream_concierge_session');
          }
        }
      } catch (err) {
        setConnStatus('offline');
      } finally {
        setIsSyncing(false);
      }
    };
    syncSession();
  }, []);

  // Fetch Settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/concierge/settings');
        if (res.ok) {
          const data = await res.json();
          setSettings(data);
        }
      } catch (err) {
        console.error('Failed to fetch concierge settings', err);
      }
    };
    fetchSettings();
  }, []);

  const handleSendMessage = async (e: React.FormEvent | null, manualContent?: string) => {
    if (e) e.preventDefault();
    const content = manualContent || inputValue;
    if (!content.trim() || isLoading) return;

    const userMsg: ClientChatMessage = { role: 'user', content: content };
    setMessages(prev => [...prev, userMsg]);
    if (!manualContent) setInputValue('');
    setIsLoading(true);
    
    // Set a personalized status message for bartering
    if (content.toLowerCase().includes('offer') || content.toLowerCase().includes('deal')) {
      setStatusMessage('Checking with the shop owner...');
    } else {
      setStatusMessage('Concierge is typing...');
    }

    try {
      const res = await fetch('/api/concierge/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: [...messages, userMsg],
          sessionId: sessionId,
          context: {
            currentPage: pathname,
            pageTitle: document.title,
            cartValue: subtotal,
            cartContents: cart?.items || [],
            userSession: user ? {
              id: user.id,
              email: user.email,
              name: user.displayName || user.email
            } : undefined
          }
        })
      });

      if (!res.ok) throw new Error('Connection failed');

      // Update Session ID from header
      const headerSessionId = res.headers.get('X-Concierge-Session-Id');
      if (headerSessionId && !sessionId) {
        setSessionId(headerSessionId);
        localStorage.setItem('dream_concierge_session', headerSessionId);
      }

      // Handle Streaming
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let assistantMsg = '';
      
      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader!.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        assistantMsg += chunk;

        // Detect Barter Success in stream (for immediate UI feedback)
        if (assistantMsg.includes('[BARTER_SUCCESS:')) {
          const match = assistantMsg.match(/\[BARTER_SUCCESS:\s*(\d+)%\]/);
          if (match) {
            setAgreedPercentage(parseInt(match[1]));
            setIsDealReached(true);
          }
        }

        setMessages(prev => {
          const last = [...prev];
          last[last.length - 1] = { 
            role: 'assistant', 
            content: assistantMsg.replace(/\[BARTER_SUCCESS:.*?\]/g, '') 
          };
          return last;
        });
      }

      setConnStatus('online');
      setStatusMessage('Concierge is online');
    } catch (error) {
      setConnStatus('reconnecting');
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "I'm having a little trouble connecting right now. Still here, just trying to reconnect to the store..." 
      }]);
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
                   <div className={`h-2 w-2 rounded-full ${connStatus === 'online' ? 'bg-green-500' : 'bg-gray-300'} animate-pulse`} />
                   <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                     {isLoading ? statusMessage : (connStatus === 'online' ? 'Concierge is online' : 'Reconnecting...')}
                   </span>
                </div>
                <div className="flex items-center gap-1.5 mt-1 bg-primary-50/50 self-start px-2 py-0.5 rounded-full border border-primary-100/50">
                  <div className="h-1 w-1 bg-primary-400 rounded-full animate-ping" />
                  <span className="text-[8px] font-black text-primary-700 uppercase tracking-tighter">3 people looking at this item</span>
                </div>
                <h3 className="text-2xl font-black leading-tight mt-1">Helpful Support</h3>
                <div className="flex items-center gap-2 mt-2">
                  <div className="h-6 w-6 rounded-full bg-primary-100 flex items-center justify-center text-[10px] font-black text-primary-600 border border-primary-200">S</div>
                  <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Managed by Sarah • Replies in minutes</span>
                </div>
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

          {/* Deal Celebration Overlay */}
          {isDealReached && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in zoom-in duration-500 overflow-hidden">
               {/* Festive Particles */}
               {[...Array(12)].map((_, i) => (
                 <div 
                   key={i}
                   className="absolute h-2 w-2 rounded-full bg-primary-400 animate-bounce"
                   style={{ 
                     left: `${Math.random() * 100}%`, 
                     top: `${Math.random() * 100}%`,
                     animationDelay: `${Math.random() * 2}s`,
                     opacity: 0.6
                   }}
                 />
               ))}
               
               <div className="bg-white rounded-4xl p-8 text-center shadow-2xl border border-primary-100 max-w-[240px] relative z-10">
                  <div className="h-16 w-16 bg-green-50 rounded-full flex items-center justify-center text-green-600 mx-auto mb-4 animate-bounce">
                    <Sparkles className="h-8 w-8" />
                  </div>
                  <h4 className="text-xl font-black text-gray-900 mb-2">It's a Deal!</h4>
                  <p className="text-xs font-bold text-gray-500 mb-6">You've unlocked a {agreedPercentage}% "Neighbor Discount". We're excited to get this piece out to you!</p>
                  <button 
                    onClick={() => setIsDealReached(false)}
                    className="w-full py-3 bg-gray-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all"
                  >
                    Thanks, neighbor!
                  </button>
               </div>
            </div>
          )}
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
                    {msg.content.includes('[OFFER:') ? (
                      <div className={`border p-6 rounded-3xl text-center space-y-4 shadow-sm animate-in zoom-in duration-300 relative overflow-hidden ${
                        msg.content.includes('[FINAL_OFFER]') 
                          ? 'bg-red-50 border-red-100 ring-2 ring-red-100' 
                          : 'bg-primary-50 border-primary-100'
                      }`}>
                        {msg.content.includes('[FINAL_OFFER]') && (
                          <div className="absolute -right-12 top-4 rotate-45 bg-red-600 text-white text-[8px] font-black uppercase tracking-[0.2em] px-12 py-1 shadow-lg">
                            Final
                          </div>
                        )}
                        <div className={`text-[10px] font-black uppercase tracking-widest ${
                          msg.content.includes('[FINAL_OFFER]') ? 'text-red-600' : 'text-primary-600'
                        }`}>
                          {msg.content.includes('[FINAL_OFFER]') ? 'Best & Final Offer' : 'New Offer Received'}
                        </div>
                        <div className="text-3xl font-black text-gray-900">
                          {msg.content.match(/\[OFFER:\s*(.*?)\s*,/)?.[1] || '---'}
                        </div>
                        <div className="text-[11px] font-bold text-gray-500 italic">
                          {msg.content.replace(/\[OFFER:.*?\]/g, '').replace('[FINAL_OFFER]', '').trim() || "What do you think?"}
                        </div>
                        
                        {/* Transactional Actions */}
                        {msg.role === 'assistant' && !isDealReached && (
                          <div className="flex gap-2 pt-2 animate-in slide-in-from-bottom-2 duration-500 delay-300">
                            <button 
                              onClick={() => {
                                const match = msg.content.match(/percentage:\s*(\d+)%/);
                                if (match) {
                                  const pct = match[1];
                                  handleSendMessage(null, "I accept this offer! Let's do it.");
                                  // The success token will be detected in the next response or we can trigger celebration
                                  setAgreedPercentage(parseInt(pct));
                                  setIsDealReached(true);
                                }
                              }}
                              className="flex-1 py-3 bg-gray-900 text-white rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-black transition-all"
                            >
                              Accept Deal
                            </button>
                            {!msg.content.includes('[FINAL_OFFER]') && (
                              <button 
                                onClick={() => setIsOffering(true)}
                                className="flex-1 py-3 bg-white border border-gray-200 text-gray-900 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-gray-50 transition-all"
                              >
                                Counter
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      msg.content
                    )}
                  </div>
                </div>
              ))}

              {/* Conversion Assistance Actions */}
              {!isLoading && messages.length < 3 && (
                <div className="pt-4 grid grid-cols-1 gap-2 animate-in fade-in duration-700">
                  <button 
                    onClick={() => {
                      const productMatch = document.title.split('|')[0].trim();
                      handleSendMessage(null, `Is the ${productMatch} still available? It looks amazing.`);
                    }}
                    className="w-full text-left p-4 rounded-2xl bg-gray-50 border border-gray-100 hover:border-gray-900 transition-all group flex items-center gap-3"
                  >
                    <Zap className="h-4 w-4 text-gray-400 group-hover:text-gray-900" />
                    <span className="text-xs font-bold text-gray-600 group-hover:text-gray-900">Is this still available?</span>
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
                  {settings?.isBarteringEnabled && (
                    <button 
                      onClick={() => setIsOffering(true)}
                      className="w-full text-left p-4 rounded-2xl bg-primary-50 border border-primary-100 hover:border-primary-600 transition-all group flex items-center gap-3"
                    >
                      <Sparkles className="h-4 w-4 text-primary-400 group-hover:text-primary-600" />
                      <span className="text-xs font-bold text-primary-600 group-hover:text-primary-700">Make an offer (Barter)</span>
                      <ArrowRight className="h-3 w-3 ml-auto opacity-0 group-hover:opacity-100 transition-all text-primary-600" />
                    </button>
                  )}
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
          <div className="p-8 bg-white border-t border-gray-50">
            {isOffering ? (
              <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Make your offer</span>
                    <span className="text-[9px] font-bold text-primary-500 italic mt-0.5">Tip: Offers within 15% are most likely to be accepted.</span>
                  </div>
                  <button onClick={() => setIsOffering(false)} className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-900 transition-colors">Cancel</button>
                </div>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-black">$</span>
                    <input 
                      type="number"
                      value={offerValue}
                      onChange={(e) => setOfferValue(e.target.value)}
                      placeholder="Enter amount..."
                      className={`w-full bg-gray-50 border rounded-2xl pl-8 pr-4 py-4 text-sm font-black focus:ring-0 transition-all ${
                        offerValue && parseFloat(offerValue) < (subtotal / 200) 
                          ? 'border-red-200 focus:border-red-400' 
                          : 'border-gray-100 focus:border-gray-900'
                      }`}
                    />
                    {offerValue && parseFloat(offerValue) < (subtotal / 200) && (
                      <div className="absolute left-0 -top-6 text-[8px] font-black text-red-500 uppercase tracking-widest animate-in fade-in slide-in-from-bottom-1">
                        ⚠️ Offer is a bit low for our studio
                      </div>
                    )}
                  </div>
                  <button 
                    onClick={() => {
                      if (offerValue) {
                        handleSendMessage(null, `I'd like to offer $${offerValue} for this.`);
                        setOfferValue('');
                        setIsOffering(false);
                      }
                    }}
                    className="px-8 py-4 bg-gray-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-black transition-all active:scale-95"
                  >
                    Send Offer
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSendMessage} className="relative group">
                <input 
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Ask a question..."
                  disabled={isLoading}
                  className="w-full bg-gray-50 border border-gray-100 rounded-3xl px-8 py-5 pr-16 text-[14px] font-medium focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all placeholder:text-gray-300 group-hover:bg-white group-hover:shadow-lg disabled:opacity-50"
                />
                <button 
                  type="submit"
                  disabled={isLoading || !inputValue.trim()}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-3 bg-gray-900 text-white rounded-2xl shadow-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-0"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            )}
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
