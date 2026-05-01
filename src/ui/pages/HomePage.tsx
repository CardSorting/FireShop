'use client';

/**
 * [LAYER: UI]
 */
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useServices } from '../hooks/useServices';
import type { Product } from '@domain/models';
import { ArrowRight, Sparkles, Shield, Truck, ShieldCheck, LifeBuoy, Star, Zap } from 'lucide-react';

export function HomePage() {
  const services = useServices();
  const [featured, setFeatured] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    services.productService.getProducts({ limit: 4 })
      .then((result) => {
        if (!mounted) return;
        setFeatured(result.products);
        setError(null);
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : 'Failed to load featured products');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [services]);

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gray-900 text-white">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-linear-to-br from-gray-900 to-primary-900 opacity-90 z-10"></div>
          <img src="https://images.unsplash.com/photo-1613771404721-1f92d799e49f?w=1600&h=800&fit=crop" alt="TCG Background" className="w-full h-full object-cover" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32 relative z-20 text-center lg:text-left flex flex-col lg:flex-row items-center gap-12">
          <div className="flex-1 space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-primary-200 text-xs font-black uppercase tracking-widest">
              <Sparkles className="w-3 h-3" /> New Arrivals Season
            </div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-[1.1]">
              Elevate Your <br />
              <span className="text-transparent bg-clip-text bg-linear-to-r from-primary-400 to-primary-200">Collection Today</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-300 font-medium max-w-2xl mx-auto lg:mx-0 leading-relaxed">
              Shop authentic booster boxes, graded singles, and premium accessories. Rated 4.9/5 by over 10,000 competitive players and collectors.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
              <Link
                href="/products"
                className="w-full sm:w-auto inline-flex justify-center items-center gap-2 bg-white text-gray-900 px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-gray-100 hover:scale-105 transition-all shadow-xl shadow-white/10"
              >
                Shop All Cards
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/products?category=sealed"
                className="w-full sm:w-auto inline-flex justify-center items-center gap-2 bg-gray-800 text-white border border-gray-700 px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-gray-700 transition-all"
              >
                Browse Sealed
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
            <div className="flex items-center justify-center sm:justify-start gap-4 p-4">
              <div className="w-12 h-12 rounded-full bg-primary-50 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-6 h-6 text-primary-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-sm">Authentic Guarantee</h3>
                <p className="text-xs text-gray-500 font-medium">100% verified products</p>
              </div>
            </div>
            <div className="flex items-center justify-center sm:justify-start gap-4 p-4">
              <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                <Truck className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-sm">Express Shipping</h3>
                <p className="text-xs text-gray-500 font-medium">Free on orders $50+</p>
              </div>
            </div>
            <div className="flex items-center justify-center sm:justify-start gap-4 p-4">
              <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
                <Star className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-sm">Top Rated</h3>
                <p className="text-xs text-gray-500 font-medium">Over 10,000+ reviews</p>
              </div>
            </div>
            <div className="flex items-center justify-center sm:justify-start gap-4 p-4">
              <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center shrink-0">
                <LifeBuoy className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-sm">24/7 Support</h3>
                <p className="text-xs text-gray-500 font-medium">TCG experts ready</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Collections */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tighter mb-4">Shop by Category</h2>
            <p className="text-gray-500 font-medium">Everything you need to build the ultimate deck.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Link href="/products?category=Singles" className="group rounded-4xl overflow-hidden relative aspect-square shadow-md border border-gray-200">
              <img src="https://images.unsplash.com/photo-1620336655174-3268cb1b7470?w=600&auto=format&fit=crop" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="Singles" />
              <div className="absolute inset-0 bg-linear-to-t from-gray-900 via-gray-900/40 to-transparent"></div>
              <div className="absolute inset-x-0 bottom-0 p-8 flex items-end justify-between">
                <div>
                  <h3 className="text-2xl font-black text-white mb-2">Rare Singles</h3>
                  <p className="text-gray-300 text-sm font-medium">Complete your deck</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-white text-gray-900 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <ArrowRight className="w-5 h-5" />
                </div>
              </div>
            </Link>
            <Link href="/products?category=sealed" className="group rounded-4xl overflow-hidden relative aspect-square shadow-md border border-gray-200">
              <img src="https://images.unsplash.com/photo-1614138096645-a90e3cd4eece?w=600&auto=format&fit=crop" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="Sealed" />
              <div className="absolute inset-0 bg-linear-to-t from-gray-900 via-gray-900/40 to-transparent"></div>
              <div className="absolute inset-x-0 bottom-0 p-8 flex items-end justify-between">
                <div>
                  <h3 className="text-2xl font-black text-white mb-2">Sealed Product</h3>
                  <p className="text-gray-300 text-sm font-medium">Boosters & Elite Boxes</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-white text-gray-900 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <ArrowRight className="w-5 h-5" />
                </div>
              </div>
            </Link>
            <Link href="/products?category=accessories" className="group rounded-4xl overflow-hidden relative aspect-square shadow-md border border-gray-200">
              <img src="https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&auto=format&fit=crop" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="Accessories" />
              <div className="absolute inset-0 bg-linear-to-t from-gray-900 via-gray-900/40 to-transparent"></div>
              <div className="absolute inset-x-0 bottom-0 p-8 flex items-end justify-between">
                <div>
                  <h3 className="text-2xl font-black text-white mb-2">Accessories</h3>
                  <p className="text-gray-300 text-sm font-medium">Sleeves, binders, mats</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-white text-gray-900 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <ArrowRight className="w-5 h-5" />
                </div>
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
              <h2 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tighter mb-4">Trending Now</h2>
              <p className="text-gray-500 font-medium">The most sought-after items this week.</p>
            </div>
            <Link href="/products" className="group mt-4 sm:mt-0 flex items-center gap-2 text-sm font-black uppercase tracking-widest text-primary-600 hover:text-primary-700">
              View All <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="animate-pulse space-y-4">
                  <div className="aspect-4/5 bg-gray-100 rounded-3xl" />
                  <div className="h-4 bg-gray-100 rounded w-1/3" />
                  <div className="h-6 bg-gray-100 rounded w-3/4" />
                  <div className="h-6 bg-gray-100 rounded w-1/4" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-sm text-red-600 font-bold flex items-center gap-3">
              <Shield className="w-5 h-5" /> {error}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {featured.map((p) => (
                <Link
                  key={p.id}
                  href={`/products/${p.id}`}
                  className="group relative block"
                >
                  <div className="aspect-4/5 rounded-3xl overflow-hidden bg-gray-50 border border-gray-100 mb-4 relative z-10 transition-transform duration-500 group-hover:-translate-y-2 group-hover:shadow-2xl">
                    <img
                      src={p.imageUrl}
                      alt={p.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-x-0 bottom-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                       <button className="w-full py-3 bg-white/90 backdrop-blur-md rounded-xl text-xs font-black uppercase tracking-widest text-gray-900 shadow-lg hover:bg-white transition-colors">
                         Quick View
                       </button>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[10px] text-primary-600 font-black uppercase tracking-widest">
                        {p.category}
                      </p>
                      <div className="flex items-center text-gray-400">
                        <Star className="w-3 h-3 text-amber-400 fill-current" />
                        <span className="text-[10px] font-bold ml-1">4.8</span>
                      </div>
                    </div>
                    <h3 className="font-bold text-gray-900 text-base line-clamp-1 mb-1 group-hover:text-primary-600 transition-colors">
                      {p.name}
                    </h3>
                    <p className="text-lg font-black text-gray-900">
                      ${(p.price / 100).toFixed(2)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
