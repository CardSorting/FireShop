'use client';

/**
 * [LAYER: UI]
 */
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useServices } from '../hooks/useServices';
import type { Product } from '@domain/models';
import { ArrowRight, Sparkles, Shield, Truck, ShieldCheck, LifeBuoy, Star, Zap, TrendingUp } from 'lucide-react';
import { ProductCard } from '../components/ProductCard';
import { ProductCardSkeleton } from '../components/ProductCard/ProductCardSkeleton';
import { useCart } from '../hooks/useCart';
import { HiveCell, FloatingBee } from '../components/Logo';

export function HomePage() {
  const services = useServices();
  const { addItem } = useCart();
  const [featured, setFeatured] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | undefined>(undefined);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    
    const loadInitial = async () => {
      try {
        const result = await services.productService.getProducts({ limit: 8 });
        setFeatured(result.products);
        setNextCursor(result.nextCursor);
        setHasMore(!!result.nextCursor);
        setError(null);
      } catch (err: any) {
        if (err.name === 'AbortError') return;
        setError(err instanceof Error ? err.message : 'Failed to load featured products');
      } finally {
        setLoading(false);
      }
    };

    void loadInitial();
    return () => controller.abort();
  }, [services]);

  const handleLoadMore = async () => {
    if (loadingMore || !hasMore || !nextCursor) return;
    setLoadingMore(true);
    try {
      const result = await services.productService.getProducts({ 
        limit: 8,
        cursor: nextCursor
      });
      
      setFeatured(prev => {
        const existingIds = new Set(prev.map(p => p.id));
        const newProducts = result.products.filter(p => !existingIds.has(p.id));
        return [...prev, ...newProducts];
      });
      
      setNextCursor(result.nextCursor);
      setHasMore(!!result.nextCursor);
    } catch (err) {
      console.error('Load more failed', err);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleQuickAdd = async (productId: string) => {
    try {
      await addItem(productId, 1);
      window.dispatchEvent(new CustomEvent('open-cart'));
    } catch (err) {
      console.error('Quick add failed', err);
    }
  };

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gray-900 text-white">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-linear-to-br from-gray-950 via-gray-900 to-primary-900 opacity-95 z-10"></div>
          <div className="absolute inset-0 hero-pattern z-15 opacity-50"></div>
          <img src="https://images.unsplash.com/photo-1613771404721-1f92d799e49f?w=1600&h=800&fit=crop" alt="Art Background" className="w-full h-full object-cover" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32 relative z-20 text-center lg:text-left flex flex-col lg:flex-row items-center gap-12">
          <div className="flex-1 space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-primary-200 text-xs font-black uppercase tracking-widest">
              <Sparkles className="w-3 h-3" /> New Artist Drops
            </div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-[1.1]">
              Art You Can <br />
              <span className="text-transparent bg-clip-text bg-linear-to-r from-primary-400 to-primary-200">Collect & Hold</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-300 font-medium max-w-2xl mx-auto lg:mx-0 leading-relaxed">
              Handcrafted Artist Trading Cards, stunning prints, and premium TCG accessories — all made by independent artists and inspired by the fandoms you love.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
              <Link
                href="/products"
                className="w-full sm:w-auto inline-flex justify-center items-center gap-2 bg-white text-gray-900 px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-gray-100 hover:scale-105 transition-all shadow-xl shadow-white/10"
              >
                Shop All Art
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/collections/artist-cards"
                className="w-full sm:w-auto inline-flex justify-center items-center gap-2 bg-gray-800 text-white border border-gray-700 px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-gray-700 transition-all"
              >
                Artist Trading Cards
              </Link>
            </div>
          </div>
          <div className="flex-1 hidden lg:block">
            <div className="grid grid-cols-2 gap-4 translate-x-8">
               <div className="space-y-4 pt-12">
                 <div className="aspect-4/5 rounded-3xl overflow-hidden shadow-2xl border-4 border-white/10">
                   <img src="https://images.unsplash.com/photo-1643330683233-ff2ac89b002c?q=80&w=600&auto=format&fit=crop" className="w-full h-full object-cover" alt="Card feature" />
                 </div>
               </div>
               <div className="space-y-4">
                 <div className="aspect-4/5 rounded-3xl overflow-hidden shadow-2xl border-4 border-white/10">
                   <img src="https://images.unsplash.com/photo-1622814324203-b0ecadfc9122?w=600&auto=format&fit=crop" className="w-full h-full object-cover" alt="Box feature" />
                 </div>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Benefits Bar */}
      <section className="py-8 border-b border-gray-100 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="flex items-center justify-center sm:justify-start gap-4 p-4 group">
              <div className="w-12 h-12 rounded-full bg-primary-50 flex items-center justify-center shrink-0 transition-transform group-hover:scale-110">
                <HiveCell className="w-6 h-6 text-primary-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-sm">Handcrafted</h3>
                <p className="text-xs text-gray-500 font-medium">By indie artists</p>
              </div>
            </div>
            <div className="flex items-center justify-center sm:justify-start gap-4 p-4 group">
              <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center shrink-0 transition-transform group-hover:scale-110">
                <Truck className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-sm">Fast Shipping</h3>
                <p className="text-xs text-gray-500 font-medium">Free on orders $50+</p>
              </div>
            </div>
            <div className="flex items-center justify-center sm:justify-start gap-4 p-4 group">
              <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center shrink-0 transition-transform group-hover:scale-110">
                <Star className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-sm">Top Rated</h3>
                <p className="text-xs text-gray-500 font-medium">Over 10,000+ reviews</p>
              </div>
            </div>
            <div className="flex items-center justify-center sm:justify-start gap-4 p-4 group">
              <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center shrink-0 transition-transform group-hover:scale-110">
                <LifeBuoy className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-sm">The Hive Help</h3>
                <p className="text-xs text-gray-500 font-medium">Art experts ready</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Collections */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 relative">
            <FloatingBee className="absolute -top-12 left-1/2 -translate-x-32 w-12 h-12 hidden lg:block opacity-40 rotate-12" />
            <h2 className="text-3xl md:text-5xl font-black text-gray-900 tracking-tighter mb-4 honey-drip inline-block">Browse the Hive</h2>
            <FloatingBee className="absolute -top-8 left-1/2 translate-x-24 w-8 h-8 hidden lg:block opacity-30 -rotate-12" />
            <p className="text-gray-500 font-medium mt-4">Curated collection of handcrafted art, custom prints, and gear.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-16">
            <Link href="/collections/artist-cards" className="group relative aspect-square transition-transform duration-500 hover:scale-105">
              <div className="hexagon absolute inset-0 overflow-hidden shadow-2xl bg-gray-200 ring-4 ring-white">
                <img src="https://images.unsplash.com/photo-1620336655174-3268cb1b7470?w=600&auto=format&fit=crop" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="Artist Cards" />
                <div className="absolute inset-0 bg-linear-to-t from-gray-900 via-gray-900/20 to-transparent"></div>
              </div>
              <div className="absolute inset-x-0 bottom-8 px-8 flex items-center justify-center text-center">
                <h3 className="text-xl font-black text-white uppercase tracking-widest drop-shadow-lg">Artist Cards</h3>
              </div>
            </Link>
            <Link href="/collections/prints" className="group relative aspect-square transition-transform duration-500 hover:scale-105 md:-translate-y-8">
              <div className="hexagon absolute inset-0 overflow-hidden shadow-2xl bg-gray-200 ring-4 ring-white">
                <img src="https://images.unsplash.com/photo-1614138096645-a90e3cd4eece?w=600&auto=format&fit=crop" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="Prints" />
                <div className="absolute inset-0 bg-linear-to-t from-gray-900 via-gray-900/20 to-transparent"></div>
              </div>
              <div className="absolute inset-x-0 bottom-8 px-8 flex items-center justify-center text-center">
                <h3 className="text-xl font-black text-white uppercase tracking-widest drop-shadow-lg">Art Prints</h3>
              </div>
            </Link>
            <Link href="/collections/accessories" className="group relative aspect-square transition-transform duration-500 hover:scale-105">
              <div className="hexagon absolute inset-0 overflow-hidden shadow-2xl bg-gray-200 ring-4 ring-white">
                <img src="https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&auto=format&fit=crop" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="Accessories" />
                <div className="absolute inset-0 bg-linear-to-t from-gray-900 via-gray-900/20 to-transparent"></div>
              </div>
              <div className="absolute inset-x-0 bottom-8 px-8 flex items-center justify-center text-center">
                <h3 className="text-xl font-black text-white uppercase tracking-widest drop-shadow-lg">TCG Accessories</h3>
              </div>
            </Link>
          </div>
        </div>
      </section>


      {/* Featured Products */}
      <section className="py-24 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tighter mb-4">The Sweetest Picks</h2>
              <p className="text-gray-500 font-medium">Handpicked from the hive. Most loved art this week.</p>
            </div>
            <Link href="/collections/all" className="group mt-4 sm:mt-0 flex items-center gap-2 text-sm font-black uppercase tracking-widest text-primary-600 hover:text-primary-700">
              View All <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-16">
              {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-sm text-red-600 font-bold flex items-center gap-3">
              <Shield className="w-5 h-5" /> {error}
            </div>
          ) : (
            <div className="space-y-20">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-16">
                {featured.map((p, i) => (
                  <ProductCard 
                    key={p.id} 
                    product={p} 
                    onAddToCart={handleQuickAdd}
                    priority={i < 4}
                  />
                ))}
              </div>

              {hasMore && (
                <div className="flex justify-center pt-8">
                  <button
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    className="group relative inline-flex items-center gap-3 px-10 py-4 bg-white border-2 border-gray-900 rounded-2xl text-sm font-black uppercase tracking-widest text-gray-900 hover:bg-gray-900 hover:text-white transition-all shadow-xl shadow-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loadingMore ? (
                      <>
                        <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        Loading Items...
                      </>
                    ) : (
                      <>
                        Load More <Zap className="w-4 h-4 text-amber-500 group-hover:text-white transition-colors" />
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
