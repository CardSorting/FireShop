'use client';

import { useState, useRef, useEffect } from 'react';
import { 
  MessageCircle, 
  Send, 
  X, 
  Loader2, 
  Sparkles,
  ShoppingBag,
  ArrowRight,
  User,
  ChevronDown,
  Minimize2,
  AlertCircle,
  RefreshCw,
  Package,
  Ruler,
  RotateCcw,
  Zap,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck, 
  Clock, 
  Flame, 
  History as HistoryIcon, 
  Heart,
  Image as ImageIcon
} from 'lucide-react';
import { usePathname } from 'next/navigation';
import { ClientChatMessage } from '@domain/concierge/types';
import { ConciergeSettings } from '@domain/concierge/settings';
import { useCart } from '@ui/hooks/useCart';
import { useAuth } from '@ui/hooks/useAuth';

interface ConciergeBubbleProps {
  initialContext?: {
    userSession?: {
      id: string;
      email: string;
      name?: string;
    };
    cartContents: {
      productId: string;
      name: string;
      quantity: number;
      price: number;
    }[];
    shippingPolicy: string;
    returnPolicy: string;
  };
  productInfo?: {
    name: string;
    id: string;
  };
}

export function ConciergeBubble({ initialContext, productInfo }: ConciergeBubbleProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ClientChatMessage[]>([
    { 
      role: 'assistant', 
      content: "Hi! I'm Sarah from the studio. How can I help you find something special today?" 
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showActivityToast, setShowActivityToast] = useState(false);
  const [connStatus, setConnStatus] = useState<'online' | 'reconnecting' | 'offline'>('online');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [settings, setSettings] = useState<ConciergeSettings | null>(null);
  const [isDealReached, setIsDealReached] = useState(false);
  const [agreedPercentage, setAgreedPercentage] = useState<number | null>(null);
  const [isOffering, setIsOffering] = useState(false);
  const [offerValue, setOfferValue] = useState('');
  const [statusMessage, setStatusMessage] = useState('Online');
  const [inventoryState, setInventoryState] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const { cart, subtotal } = useCart();
  const { user } = useAuth();
  
  useEffect(() => {
    if (typeof window !== 'undefined' && document.title) {
      const title = document.title.split('|')[0].trim();
      const fetchStock = async () => {
        try {
          const res = await fetch(`/api/products?query=${encodeURIComponent(title)}&limit=1`);
          if (res.ok) {
            const { products } = await res.json();
            if (products.length > 0) setInventoryState(products[0]);
          }
        } catch (err) {}
      };
      fetchStock();
    }
  }, [pathname]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

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
          }
        }
      } catch (err) {} finally {
        setIsSyncing(false);
      }
    };
    syncSession();
  }, []);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/concierge/settings');
        if (res.ok) setSettings(await res.json());
      } catch (err) {}
    };
    fetchSettings();
  }, []);

  const handleSendMessage = async (e: React.FormEvent | null, manualContent?: string) => {
    if (e) e.preventDefault();
    const content = manualContent || inputValue;
    if (!content.trim() || isLoading) return;

    const userMsg: ClientChatMessage = { role: 'user', content };
    setMessages(prev => [...prev, userMsg]);
    if (!manualContent) setInputValue('');
    setIsLoading(true);
    setStatusMessage('Sarah is typing...');

    try {
      const res = await fetch('/api/concierge/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: [...messages, userMsg],
          sessionId,
          context: {
            currentPage: pathname,
            pageTitle: document.title,
            cartValue: subtotal,
            cartContents: cart?.items || [],
            userSession: user ? { id: user.id, email: user.email, name: user.displayName || user.email } : undefined
          }
        })
      });

      if (!res.ok) throw new Error();

      const headerSessionId = res.headers.get('X-Concierge-Session-Id');
      if (headerSessionId && !sessionId) {
        setSessionId(headerSessionId);
        localStorage.setItem('dream_concierge_session', headerSessionId);
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      const chunks: string[] = [];
      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader!.read();
        if (done) break;
        const fullContent = chunks.join('') + decoder.decode(value);
        chunks.push(decoder.decode(value));

        if (fullContent.includes('[BARTER_SUCCESS:')) {
          const match = fullContent.match(/\[BARTER_SUCCESS:\s*(\d+)%\]/);
          if (match) {
            setAgreedPercentage(parseInt(match[1]));
            setIsDealReached(true);
          }
        }

        setMessages(prev => {
          const last = [...prev];
          last[last.length - 1] = { 
            role: 'assistant', 
            content: fullContent.replace(/\[BARTER_SUCCESS:.*?\]/g, '') 
          };
          return last;
        });
      }
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: "Still here, just a bit of studio noise on the line—one moment..." }]);
    } finally {
      setIsLoading(false);
      setStatusMessage('Online');
    }
  };

  const toggleOpen = () => setIsOpen(!isOpen);

  return (
    <div className="fixed bottom-4 right-4 z-9999 flex flex-col items-end gap-3 font-sans antialiased">
      {isOpen && (
        <div className="w-[340px] max-w-[92vw] h-[480px] max-h-[75vh] bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden animate-in slide-in-from-bottom-2 fade-in duration-300 relative">
          
          {/* Nano Header */}
          <div className="bg-gray-900 px-3 py-2 text-white relative overflow-hidden flex items-center justify-between">
            <div className="flex items-center gap-2 relative z-10">
              <div className="relative">
                <div className="h-7 w-7 rounded-full bg-white flex items-center justify-center text-[10px] font-black text-gray-900 overflow-hidden">S</div>
                <div className="absolute -bottom-0.5 -right-0.5 h-2 w-2 bg-green-500 rounded-full border border-gray-900" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-[11px] font-black leading-none">Sarah</h3>
                  <span className="text-[6px] font-black text-primary-300 uppercase bg-primary-900/40 px-1 py-0.5 rounded-sm">Live</span>
                </div>
                <span className="text-[6px] font-black uppercase text-gray-500 tracking-tighter">100% Rate • 9-6 Studio</span>
              </div>
            </div>
            <button onClick={toggleOpen} className="p-1 hover:bg-white/10 rounded-full transition-colors relative z-10">
              <Minimize2 className="h-3 w-3 text-gray-500" />
            </button>
            <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')] grayscale invert" />
          </div>

          {/* Scarcity Banner */}
          {inventoryState?.stock < 5 && (
            <div className="bg-amber-500/5 border-b border-amber-500/10 px-3 py-1 flex items-center justify-center gap-2">
              <Zap className="h-2 w-2 text-amber-600" />
              <span className="text-[7px] font-black text-amber-700 uppercase">High Demand • {inventoryState.stock} left</span>
            </div>
          )}

          {/* Chat Area */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5 styled-scrollbar bg-white">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-1 duration-300`}>
                <div className={`max-w-[85%] px-3 py-2 rounded-xl text-[12px] leading-snug font-medium ${
                  msg.role === 'user' ? 'bg-gray-900 text-white rounded-tr-none' : 'bg-gray-50 text-gray-800 border border-gray-100 rounded-tl-none'
                }`}>
                  {msg.content.includes('[OFFER:') ? (
                    <div className="border p-4 rounded-2xl text-center space-y-3 bg-white shadow-sm my-1">
                      <div className="text-[8px] font-black uppercase text-primary-600 tracking-widest">New Studio Offer</div>
                      <div className="text-2xl font-black text-gray-900">{msg.content.match(/\[OFFER:\s*(.*?)\s*,/)?.[1]}</div>
                      <div className="flex gap-1.5">
                        <button onClick={() => { setIsDealReached(true); handleSendMessage(null, "I accept!"); }} className="flex-1 py-2 bg-gray-900 text-white rounded-lg text-[8px] font-black uppercase">Accept</button>
                        <button onClick={() => setIsOffering(true)} className="flex-1 py-2 bg-white border border-gray-200 rounded-lg text-[8px] font-black uppercase">Counter</button>
                      </div>
                    </div>
                  ) : msg.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-50 px-3 py-2 rounded-xl flex items-center gap-2">
                  <Loader2 className="h-2 w-2 text-primary-400 animate-spin" />
                  <span className="text-[8px] font-black text-gray-400 uppercase">{statusMessage}</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Mini Footer + Input */}
          <div className="p-3 bg-white border-t border-gray-50">
            <div className="flex items-center justify-between mb-2 px-1">
              <div className="flex gap-2">
                <div className="flex items-center gap-1"><ShieldCheck className="h-1.5 w-1.5 text-green-500" /><span className="text-[6px] font-bold uppercase text-gray-300">Secure</span></div>
                <div className="flex items-center gap-1"><CheckCircle2 className="h-1.5 w-1.5 text-gray-300" /><span className="text-[6px] font-bold uppercase text-gray-300">Verified</span></div>
              </div>
              <span className="text-[6px] font-bold uppercase text-gray-300 italic">Studio Support</span>
            </div>
            
            {isOffering ? (
              <div className="flex gap-1.5 animate-in slide-in-from-bottom-2 duration-300">
                <input type="number" value={offerValue} onChange={(e) => setOfferValue(e.target.value)} placeholder="Amount" className="flex-1 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-xs font-black outline-none focus:border-gray-900" />
                <button onClick={() => { handleSendMessage(null, `I'd like to offer $${offerValue}`); setOfferValue(''); setIsOffering(false); }} className="px-4 bg-gray-900 text-white rounded-lg text-[8px] font-black uppercase">Send</button>
              </div>
            ) : (
              <form onSubmit={handleSendMessage} className="relative">
                <input value={inputValue} onChange={(e) => setInputValue(e.target.value)} placeholder="Message Sarah..." className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-2.5 pr-10 text-[12px] outline-none focus:border-gray-900" />
                <button type="submit" disabled={!inputValue.trim()} className="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 bg-gray-900 text-white rounded-lg shadow-md disabled:opacity-0 transition-opacity">
                  <Send className="h-3 w-3" />
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      <button onClick={toggleOpen} className="h-14 w-14 bg-gray-900 rounded-full shadow-2xl flex items-center justify-center text-white hover:scale-105 active:scale-95 transition-all relative">
        {isOpen ? <X className="h-5 w-5" /> : <MessageCircle className="h-6 w-6" />}
        {!isOpen && messages.length > 1 && <div className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 border-2 border-white rounded-full"></div>}
      </button>
    </div>
  );
}
