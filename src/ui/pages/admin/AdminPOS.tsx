'use client';

/**
 * [LAYER: UI]
 * High-velocity Point of Sale (POS) terminal.
 * Designed for touch-screens and barcode scanner throughput.
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Barcode, 
  Search, 
  UserPlus, 
  CreditCard, 
  Banknote, 
  Trash2, 
  Plus, 
  Minus,
  Settings,
  X,
  ChevronRight,
  Maximize2
} from 'lucide-react';
import { useServices } from '../../hooks/useServices';
import { useToast, useAdminPageTitle } from '../../components/admin/AdminComponents';
import { formatCurrency } from '@utils/formatters';
import type { Product, CartItem } from '@domain/models';

export function AdminPOS() {
  useAdminPageTitle('POS Terminal');
  const services = useServices();
  const { toast } = useToast();
  
  const [query, setQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  
  // Barcode Scanning logic
  const scanBuffer = useRef('');
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        if (scanBuffer.current.length > 3) {
          handleBarcode(scanBuffer.current);
          scanBuffer.current = '';
        }
      } else if (e.key.length === 1) {
        scanBuffer.current += e.key;
        // Clear buffer if no key for 100ms (to distinguish from manual typing)
        setTimeout(() => { scanBuffer.current = ''; }, 100);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleBarcode = (code: string) => {
    toast('info', `Scanned barcode: ${code}`);
    // Logic to find product by barcode and add to cart
  };

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(i => i.productId === product.id);
      if (existing) {
        return prev.map(i => i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, {
        productId: product.id,
        name: product.name,
        priceSnapshot: product.price,
        quantity: 1,
        imageUrl: product.imageUrl
      }];
    });
  };

  const subtotal = cart.reduce((sum, i) => sum + i.priceSnapshot * i.quantity, 0);

  return (
    <div className="fixed inset-0 z-50 flex bg-gray-50 text-gray-900 overflow-hidden select-none">
      {/* ── Left Side: Product Discovery ── */}
      <div className="flex-1 flex flex-col min-w-0 bg-white">
        <header className="h-16 flex items-center justify-between px-6 border-b shrink-0 bg-white z-10">
          <div className="flex items-center gap-4 flex-1 max-w-xl">
             <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input 
                  autoFocus
                  placeholder="Scan barcode or search products..."
                  className="w-full bg-gray-100 rounded-2xl pl-12 pr-4 py-3 text-sm font-medium focus:bg-white focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
             </div>
          </div>
          <div className="flex items-center gap-3 ml-4">
             <button className="p-3 rounded-xl hover:bg-gray-100 transition"><Settings className="h-5 w-5 text-gray-500" /></button>
             <button className="p-3 rounded-xl hover:bg-gray-100 transition"><Maximize2 className="h-5 w-5 text-gray-500" /></button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 scrollbar-hide">
           <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {/* Common Items / Quick Actions */}
              <button className="aspect-square flex flex-col items-center justify-center gap-3 rounded-3xl bg-indigo-50 text-indigo-600 border-2 border-indigo-100 hover:bg-indigo-100 transition active:scale-95 group">
                 <div className="h-12 w-12 rounded-2xl bg-white shadow-sm flex items-center justify-center group-hover:scale-110 transition">
                    <Plus className="h-6 w-6" />
                 </div>
                 <span className="text-xs font-bold uppercase tracking-widest">Custom Item</span>
              </button>
              
              {/* Product Grid */}
              {Array.from({ length: 14 }).map((_, i) => (
                <button 
                  key={i}
                  className="aspect-square flex flex-col items-center justify-between p-4 rounded-3xl bg-white border-2 border-gray-100 hover:border-primary-500 hover:shadow-xl hover:shadow-primary-500/10 transition group active:scale-95"
                >
                   <div className="h-24 w-24 rounded-2xl overflow-hidden bg-gray-50 mb-2">
                      <div className="h-full w-full bg-linear-to-br from-gray-100 to-gray-200" />
                   </div>
                   <div className="text-center w-full">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Set Name</p>
                      <p className="text-xs font-bold text-gray-900 truncate">Example Product Name</p>
                      <p className="text-sm font-black text-primary-600 mt-1">$4.99</p>
                   </div>
                </button>
              ))}
           </div>
        </main>
      </div>

      {/* ── Right Side: Cart & Checkout ── */}
      <div className="w-[420px] bg-gray-900 flex flex-col shadow-2xl z-20">
         <header className="h-16 flex items-center justify-between px-6 border-b border-white/10 shrink-0">
            <div className="flex items-center gap-2">
               <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
               <span className="text-xs font-bold text-white uppercase tracking-widest">Terminal 01</span>
            </div>
            <button className="flex items-center gap-2 rounded-xl bg-white/5 px-3 py-1.5 text-[10px] font-bold text-white uppercase tracking-widest hover:bg-white/10 transition">
               <UserPlus className="h-3.5 w-3.5" />
               Add Customer
            </button>
         </header>

         <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 scrollbar-hide">
            {cart.length === 0 ? (
               <div className="h-full flex flex-col items-center justify-center text-center opacity-30">
                  <Barcode className="h-16 w-16 text-white mb-4" />
                  <p className="text-white text-sm font-bold uppercase tracking-widest">Empty Cart</p>
                  <p className="text-white/50 text-xs mt-2">Scan an item to begin</p>
               </div>
            ) : (
               cart.map((item, i) => (
                  <div key={i} className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl group border border-transparent hover:border-white/10 transition">
                     <div className="h-12 w-12 rounded-xl bg-white/10 shrink-0" />
                     <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-white truncate">{item.name}</p>
                        <p className="text-xs text-white/40 font-bold mt-0.5">{formatCurrency(item.priceSnapshot)}</p>
                     </div>
                     <div className="flex items-center gap-3">
                        <button className="text-white/30 hover:text-white transition"><Minus className="h-4 w-4" /></button>
                        <span className="text-sm font-bold text-white w-4 text-center">{item.quantity}</span>
                        <button className="text-white/30 hover:text-white transition"><Plus className="h-4 w-4" /></button>
                     </div>
                  </div>
               ))
            )}
         </div>

         <footer className="p-6 bg-white/5 border-t border-white/10 space-y-4">
            <div className="space-y-2">
               <div className="flex justify-between text-white/50 text-xs font-bold uppercase tracking-widest">
                  <span>Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
               </div>
               <div className="flex justify-between text-white/50 text-xs font-bold uppercase tracking-widest">
                  <span>Tax (0%)</span>
                  <span>$0.00</span>
               </div>
               <div className="flex justify-between text-white text-2xl font-black pt-2">
                  <span>Total</span>
                  <span className="text-primary-400">{formatCurrency(subtotal)}</span>
               </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3 pt-2">
               <button className="flex flex-col items-center justify-center gap-2 h-20 rounded-2xl bg-white/5 text-white hover:bg-white/10 transition group">
                  <Banknote className="h-6 w-6 text-emerald-400 group-hover:scale-110 transition" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Cash</span>
               </button>
               <button className="flex flex-col items-center justify-center gap-2 h-20 rounded-2xl bg-primary-600 text-white hover:bg-primary-700 transition shadow-lg shadow-primary-500/20 group">
                  <CreditCard className="h-6 w-6 group-hover:scale-110 transition" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Card</span>
               </button>
            </div>

            <button 
              disabled={cart.length === 0}
              className="w-full bg-white text-gray-900 h-16 rounded-2xl font-black text-lg uppercase tracking-widest hover:bg-gray-100 transition active:scale-[0.98] disabled:opacity-30 disabled:pointer-events-none shadow-xl"
            >
               Pay Now
            </button>
         </footer>
      </div>
    </div>
  );
}
