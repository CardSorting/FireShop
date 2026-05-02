'use client';

/**
 * [LAYER: UI]
 * Global Command Palette for high-velocity card discovery.
 * Accessible via ⌘+K (Mac) or Ctrl+K (Windows).
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Search, Sparkles, Archive, Layers3, X, Command, 
  ShoppingCart, ArrowRight, Zap, Truck, ShieldCheck, 
  Users, LockKeyhole, CreditCard, RefreshCcw 
} from 'lucide-react';
import { useServices } from '../hooks/useServices';
import { useCart } from '../hooks/useCart';
import { useWishlist } from '../hooks/useWishlist';
import { formatCurrency } from '@utils/formatters';
import type { Product, ProductCategory } from '@domain/models';

export function SearchCommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  
  const router = useRouter();
  const services = useServices();
  const { addItem } = useCart();
  const { recentlyViewed } = useWishlist();
  const inputRef = useRef<HTMLInputElement>(null);

  // Toggle palette with ⌘+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      } else if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 10);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      setQuery('');
      setResults([]);
    }
  }, [isOpen]);

  // Quick Search Logic
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        // In a real app, this would hit a dedicated /api/search/quick endpoint
        const result = await services.productService.getProducts({ 
          query: query.trim(),
          limit: 6 
        });
        setResults(result.products);
        setSelectedIndex(0);
      } catch (err) {
        console.error('Search failed', err);
      } finally {
        setLoading(false);
      }
    }, 150); // Debounce

    return () => clearTimeout(timer);
  }, [query, services.productService]);

  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Load recent searches and categories
  useEffect(() => {
    const saved = localStorage.getItem('search:recent');
    if (saved) setRecentSearches(JSON.parse(saved));

    const loadCategories = async () => {
      try {
        const data = await services.taxonomyService.getCategories();
        setCategories(data);
      } catch (err) {
        console.error('Failed to load categories', err);
      }
    };
    void loadCategories();
  }, [services.taxonomyService]);

  const saveSearch = (term: string) => {
    const updated = [term, ...recentSearches.filter(t => t !== term)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('search:recent', JSON.stringify(updated));
  };

  const handleSelect = useCallback((product: Product) => {
    saveSearch(product.name);
    setIsOpen(false);
    router.push(`/products/${product.handle || product.id}`);
  }, [router, recentSearches]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % (results.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + results.length) % (results.length || 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[selectedIndex]) {
        handleSelect(results[selectedIndex]);
      } else if (query.trim()) {
        saveSearch(query.trim());
        setIsOpen(false);
        router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-100 flex items-start justify-center pt-[15vh] px-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200" 
        onClick={() => setIsOpen(false)} 
      />
      
      {/* Palette Container */}
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl shadow-black/20 border border-gray-100 overflow-hidden animate-in zoom-in-95 slide-in-from-top-4 duration-200 ring-1 ring-black/5">
        <header className="flex items-center px-6 border-b">
          <Search className="h-5 w-5 text-primary-600" />
          <input
            ref={inputRef}
            type="text"
            className="flex-1 h-20 border-none focus:ring-0 text-lg font-black placeholder:text-gray-400 text-gray-900 px-4"
            placeholder="Search for cards, sets, or categories..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <div className="flex items-center gap-2">
            <kbd className="hidden sm:flex h-6 items-center gap-1 rounded-md border bg-gray-50 px-2 font-mono text-[10px] font-bold text-gray-500">
              <Command className="h-2.5 w-2.5" /> K
            </kbd>
            <button 
              onClick={() => setIsOpen(false)}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <X className="h-5 w-5 text-gray-400" />
            </button>
          </div>
        </header>

        <main className="max-h-[60vh] overflow-y-auto scrollbar-hide">
          {query.length === 0 ? (
            <div className="p-8 space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <section>
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-6">Trending Searches</h3>
                  <div className="flex flex-wrap gap-2">
                    {['Charizard', 'Pikachu', 'Base Set', 'Sealed Box', 'PSA 10'].map((term) => (
                      <button
                        key={term}
                        onClick={() => setQuery(term)}
                        className="px-4 py-2 rounded-xl bg-gray-50 text-xs font-bold text-gray-700 hover:bg-primary-50 hover:text-primary-600 transition-all border border-transparent hover:border-primary-100"
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                </section>

                {recentSearches.length > 0 && (
                  <section>
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-6 flex items-center justify-between">
                      Recent Searches
                      <button 
                        onClick={() => { setRecentSearches([]); localStorage.removeItem('search:recent'); }}
                        className="text-[9px] hover:text-red-500 transition-colors"
                      >
                        Clear
                      </button>
                    </h3>
                    <div className="space-y-1">
                      {recentSearches.map((term) => (
                        <button
                          key={term}
                          onClick={() => setQuery(term)}
                          className="w-full text-left px-4 py-3 rounded-xl hover:bg-gray-50 text-xs font-bold text-gray-700 flex items-center gap-3 group"
                        >
                          <RefreshCcw className="w-3.5 h-3.5 text-gray-300 group-hover:text-primary-500" />
                          {term}
                        </button>
                      ))}
                    </div>
                  </section>
                )}
              </div>

              <section>
                <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-6">Discovery Shortcuts</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {categories.slice(0, 4).map((cat, i) => {
                    const icons = [Sparkles, Archive, Layers3, Zap];
                    const colors = [
                      'bg-amber-50 text-amber-600',
                      'bg-blue-50 text-blue-600',
                      'bg-purple-50 text-purple-600',
                      'bg-primary-50 text-primary-600'
                    ];
                    const Icon = icons[i % icons.length];
                    const colorClass = colors[i % colors.length];

                    return (
                      <button
                        key={cat.id}
                        onClick={() => { setIsOpen(false); router.push(`/collections/${cat.slug}`); }}
                        className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-gray-50/50 hover:bg-white transition-all border border-transparent hover:border-gray-100 hover:shadow-xl group"
                      >
                        <div className={`p-3 rounded-xl ${colorClass} transition-colors group-hover:scale-110 duration-300`}>
                          <Icon className="h-6 w-6" />
                        </div>
                        <span className="text-xs font-black text-gray-900 truncate w-full text-center">{cat.name}</span>
                      </button>
                    );
                  })}
                </div>
              </section>

              {recentlyViewed.length > 0 && (
                <section>
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-6">Continue Browsing</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {recentlyViewed.slice(0, 4).map((product) => (
                      <button
                        key={product.id}
                        onClick={() => handleSelect(product)}
                        className="flex items-center gap-4 p-4 rounded-xl bg-white border border-gray-100 hover:border-primary-200 hover:shadow-lg transition-all group"
                      >
                        <div className="h-14 w-14 rounded-lg bg-gray-50 overflow-hidden border">
                          <img src={product.imageUrl} alt="" className="h-full w-full object-cover group-hover:scale-110 transition duration-500" />
                        </div>
                        <div className="flex-1 text-left min-w-0">
                          <p className="text-sm font-black text-gray-900 truncate group-hover:text-primary-600 transition-colors">{product.name}</p>
                          <p className="text-[10px] font-bold text-primary-600">{formatCurrency(product.price)}</p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-primary-600 transition-all group-hover:translate-x-1" />
                      </button>
                    ))}
                  </div>
                </section>
              )}
            </div>
          ) : results.length > 0 ? (
            <div className="p-2">
              <h3 className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-gray-400">Products</h3>
              {results.map((product, index) => (
                <button
                  key={product.id}
                  onClick={() => handleSelect(product)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all group ${
                    selectedIndex === index ? 'bg-primary-50 ring-1 ring-primary-100' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="h-12 w-12 rounded-lg bg-gray-100 overflow-hidden shrink-0 ring-1 ring-gray-100 group-hover:ring-primary-200 transition-all">
                    <img src={product.imageUrl} alt="" className="h-full w-full object-cover group-hover:scale-110 transition duration-500" />
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className={`text-sm font-black truncate transition-colors ${
                        selectedIndex === index ? 'text-primary-900' : 'text-gray-900'
                      }`}>
                        {product.name}
                      </p>
                      {index === 0 && (
                        <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-amber-50 text-amber-600 text-[8px] font-black uppercase tracking-widest ring-1 ring-amber-100">
                          <Zap className="h-2 w-2 fill-current" /> Trending
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{product.category}</span>
                      <span className="text-gray-200">•</span>
                      <span className="text-xs font-black text-primary-600 tracking-tight">{formatCurrency(product.price)}</span>
                    </div>
                  </div>
                  <ArrowRight className={`h-4 w-4 transition-all duration-300 ${
                    selectedIndex === index ? 'text-primary-600 translate-x-0 opacity-100' : 'text-gray-200 -translate-x-4 opacity-0'
                  }`} />
                </button>
              ))}
            </div>
          ) : !loading && query.length > 1 ? (
            <div className="p-12 text-center">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-gray-50 mb-4">
                <Search className="h-8 w-8 text-gray-300" />
              </div>
              <p className="text-sm font-bold text-gray-900">No results found for "{query}"</p>
              <p className="text-xs text-gray-500 mt-1">Try searching for card names, sets, or attributes.</p>
            </div>
          ) : (
            <div className="p-12 text-center animate-pulse">
               <div className="flex justify-center gap-2">
                 <div className="h-2 w-2 rounded-full bg-primary-200" />
                 <div className="h-2 w-2 rounded-full bg-primary-400 animate-bounce" />
                 <div className="h-2 w-2 rounded-full bg-primary-200" />
               </div>
            </div>
          )}
        </main>

        <footer className="px-6 py-4 bg-gray-50 border-t flex items-center justify-between">
           <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400">
                 <kbd className="flex h-4 min-w-[16px] items-center justify-center rounded border bg-white px-1 shadow-sm">↑↓</kbd>
                 Navigate
              </div>
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400">
                 <kbd className="flex h-4 min-w-[16px] items-center justify-center rounded border bg-white px-1 shadow-sm">Enter</kbd>
                 Select
              </div>
           </div>
           <p className="text-[10px] font-bold text-gray-400 italic">PlayMore Discovery Engine v1.0</p>
        </footer>
      </div>
    </div>
  );
}
