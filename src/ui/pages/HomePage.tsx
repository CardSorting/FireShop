'use client';

/**
 * [LAYER: UI]
 */
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useServices } from '../hooks/useServices';
import type { Product, KnowledgebaseArticle } from '@domain/models';
import { ArrowRight, Sparkles, Shield, Truck, ShieldCheck, LifeBuoy, Star, Zap, TrendingUp, BookOpen } from 'lucide-react';
import { ProductCard } from '../components/ProductCard';
import { ProductCardSkeleton } from '../components/ProductCard/ProductCardSkeleton';
import { useCart } from '../hooks/useCart';
import { HiveCell, FloatingBee } from '../components/Logo';
import Image from 'next/image';

export function HomePage() {
  const services = useServices();
  const { addItem } = useCart();
  const [featured, setFeatured] = useState<Product[]>([]);
  const [latestPosts, setLatestPosts] = useState<KnowledgebaseArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | undefined>(undefined);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loadMoreControllerRef = useRef<AbortController | null>(null);

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    
    const loadInitial = async () => {
      try {
        const result = await services.productService.getProducts({ limit: 8, signal: controller.signal });
        if (!controller.signal.aborted) {
          setFeatured(result.products);
          setNextCursor(result.nextCursor);
          setHasMore(!!result.nextCursor);
          setError(null);
        }
      } catch (err: any) {
        if (err.name === 'AbortError') return;
        if (!controller.signal.aborted) {
          setError(err instanceof Error ? err.message : 'Failed to load featured products');
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    const loadBlog = async () => {
      try {
        const posts = await services.knowledgebaseService.getArticles({ 
          type: 'blog', 
          status: 'published',
          signal: controller.signal
        });
        if (!controller.signal.aborted) {
          setLatestPosts(posts.articles.slice(0, 3));
        }
      } catch (err: any) {
        if (err.name === 'AbortError') return;
        console.error('Failed to load blog posts for home', err);
      }
    };

    void loadInitial();
    void loadBlog();
    return () => {
      controller.abort();
      loadMoreControllerRef.current?.abort();
    };
  }, [services]);

  const handleLoadMore = async () => {
    if (loadingMore || !hasMore || !nextCursor) return;
    
    loadMoreControllerRef.current?.abort();
    const controller = new AbortController();
    loadMoreControllerRef.current = controller;
    
    setLoadingMore(true);
    try {
      const result = await services.productService.getProducts({ 
        limit: 8,
        cursor: nextCursor,
        signal: controller.signal
      });
      
      if (!controller.signal.aborted) {
        setFeatured(prev => {
          const existingIds = new Set(prev.map(p => p.id));
          const newProducts = result.products.filter(p => !existingIds.has(p.id));
          return [...prev, ...newProducts];
        });
        
        setNextCursor(result.nextCursor);
        setHasMore(!!result.nextCursor);
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      console.error('Load more failed', err);
    } finally {
      if (!controller.signal.aborted) {
        setLoadingMore(false);
      }
    }
  };

  const handleQuickAdd = async (productId: string) => {
    try {
      await addItem(productId, 1);
      window.dispatchEvent(new CustomEvent('cart:open'));
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
          <div className="absolute inset-0 z-16 pointer-events-none overflow-hidden">
            {mounted && [...Array(20)].map((_, i) => (
              <div 
                key={i} 
                className="pollen" 
                style={{ 
                  left: `${Math.random() * 100}%`, 
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 5}s`,
                  animationDuration: `${4 + Math.random() * 6}s`
                }} 
              />
            ))}
          </div>
          <Image 
            src="/assets/generated/pro_circuit_handbook_featured_1778177228003.png" 
            alt="Handcrafted Artist Trading Cards and fandom-inspired art prints collection" 
            fill
            priority
            sizes="100vw"
            className="object-cover" 
          />
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
                className="w-full sm:w-auto inline-flex justify-center items-center gap-2 btn-honey-glazed text-white px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-primary-500/20"
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
                 <div className="relative aspect-4/5 rounded-3xl overflow-hidden shadow-2xl border-4 border-white/10">
                   <Image 
                    src="/assets/generated/charizard_ex_holo_1778177088908.png" 
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover" 
                    alt="Premium handcrafted Artist Trading Card featuring intricate custom artwork" 
                   />
                 </div>
               </div>
               <div className="space-y-4">
                 <div className="relative aspect-4/5 rounded-3xl overflow-hidden shadow-2xl border-4 border-white/10">
                   <Image 
                    src="/assets/generated/scarlet_violet_booster_box_1778177072594.png" 
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover" 
                    alt="Limited edition TCG accessory box for protecting card collections" 
                   />
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

      {/* Featured Collections - Minimalist Strategy */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-16 border-l-4 border-primary-500 pl-8">
            <h2 className="text-4xl font-black text-gray-900 tracking-tight mb-2 uppercase">Browse the Hive</h2>
            <p className="text-gray-500 font-medium">Curated collection of handcrafted art, custom prints, and gear.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
            {[
              { 
                href: "/collections/artist-cards", 
                title: "Artist Cards", 
                sub: "Hand-drawn originals",
                img: "/assets/generated/viral_blog_strategy_featured_1778177344526.png",
                delay: "reveal-delay-1"
              },
              { 
                href: "/collections/prints", 
                title: "Art Prints", 
                sub: "Museum-grade quality",
                img: "/assets/generated/generic_tcg_strategy_1778177431609.png",
                delay: "reveal-delay-2"
              },
              { 
                href: "/collections/accessories", 
                title: "TCG Accessories", 
                sub: "Premium protection",
                img: "/assets/generated/generic_collecting_1778177444345.png",
                delay: "reveal-delay-3"
              }
            ].map((col) => (
              <Link key={col.href} href={col.href} className={`group block opacity-0 reveal-up ${col.delay}`}>
                <div className="relative aspect-3/2 overflow-hidden rounded-2xl bg-gray-100 mb-6 border border-gray-100 transition-all duration-500 group-hover:shadow-2xl group-hover:shadow-primary-500/10">
                  <Image 
                    src={col.img} 
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover transition-transform duration-1000 group-hover:scale-110" 
                    alt={`Shop ${col.title}: ${col.sub}`} 
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                    {col.title}
                    <ArrowRight className="w-4 h-4 opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-primary-600" />
                  </h3>
                  <p className="text-sm font-bold text-gray-400 uppercase tracking-tighter mt-1">{col.sub}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <div className="honey-drip-divider" />

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
                  <div key={p.id} className={`opacity-0 reveal-up`} style={{ animationDelay: `${i * 0.1}s` }}>
                    <ProductCard 
                      product={p} 
                      onAddToCart={handleQuickAdd}
                      priority={i < 4}
                    />
                  </div>
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

      {/* Journal Highlights */}
      <section className="py-24 bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-end justify-between mb-16">
            <div className="border-l-4 border-amber-400 pl-8">
              <h2 className="text-4xl font-black text-gray-900 tracking-tight mb-2 uppercase">The Journal</h2>
              <p className="text-gray-500 font-medium text-lg">Strategy, stories, and art from the hive.</p>
            </div>
            <Link href="/blog" className="hidden sm:flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-primary-600 hover:text-primary-700 transition-colors group">
              Enter the Journal <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {latestPosts.map((post) => (
              <Link 
                key={post.id} 
                href={`/blog/${post.slug}`}
                className="group flex flex-col bg-white rounded-3xl overflow-hidden border border-gray-100 hover:border-primary-100 hover:shadow-2xl hover:shadow-primary-500/5 transition-all duration-500"
              >
                <div className="relative aspect-video overflow-hidden">
                  <Image 
                    src={post.featuredImageUrl || post.ogImage || '/assets/generated/generic_tcg_strategy_1778177431609.png'} 
                    fill 
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover transition-transform duration-1000 group-hover:scale-110" 
                    alt={post.title}
                  />
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 rounded-lg bg-white/90 backdrop-blur-md text-[8px] font-black uppercase tracking-widest text-gray-900 shadow-sm">
                      {post.categoryName}
                    </span>
                  </div>
                </div>
                <div className="p-8 flex-1 flex flex-col">
                  <h3 className="text-xl font-bold text-gray-900 mb-4 line-clamp-2 group-hover:text-primary-600 transition-colors">
                    {post.title}
                  </h3>
                  <p className="text-sm text-gray-500 font-medium line-clamp-3 mb-6">
                    {post.excerpt}
                  </p>
                  <div className="mt-auto flex items-center justify-between pt-6 border-t border-gray-50">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                      <BookOpen className="h-3.5 w-3.5" />
                      Read Story
                    </span>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      {new Date(post.publishedAt || post.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <Link href="/blog" className="mt-12 sm:hidden w-full flex items-center justify-center py-5 rounded-2xl bg-gray-900 text-white font-black text-xs uppercase tracking-widest shadow-xl">
            Enter the Journal
          </Link>
        </div>
      </section>

      {/* The Heart of the Hive - Redesigned CTA */}
      <section className="py-32 bg-gray-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 hero-pattern"></div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-400 text-xs font-black uppercase tracking-widest">
                <Sparkles className="w-3 h-3" /> The Heart of the Hive
              </div>
              <h2 className="text-4xl md:text-6xl font-black tracking-tight leading-tight">
                Art That Lasts <br />
                <span className="text-transparent bg-clip-text bg-linear-to-r from-primary-400 to-primary-200">Beyond the Screen</span>
              </h2>
              <div className="space-y-6 text-gray-300 text-lg font-medium leading-relaxed">
                <p>
                  At <strong className="text-white">DreamBeesArt</strong>, we believe that art should be more than just a digital file. Our mission is to bridge the gap between digital creativity and physical collectability through premium Artist Trading Cards (ATC), high-fidelity art prints, and professional-grade TCG accessories.
                </p>
                <p>
                  Every piece in our marketplace is vetted for quality and originality. From limited-edition fandom-inspired prints to hand-drawn one-of-a-kind trading cards, we provide independent artists with a platform to reach collectors who value craftsmanship and archival quality. Whether you are looking to protect your most valuable cards or find the next centerpiece for your gallery wall, the Hive is your home for premium artistic expression.
                </p>
                <p className="text-sm border-l-2 border-primary-500 pl-6 italic text-gray-400">
                  Specializing in: Handcrafted Artist Trading Cards, Museum-Grade Art Prints, TCG Deck Boxes, Custom Card Sleeves, and Independent Artist Merch.
                </p>
              </div>
              <div className="flex flex-wrap gap-x-12 gap-y-6 pt-10 border-t border-white/10">
                <div className="flex flex-col">
                  <span className="text-2xl font-black text-white tracking-tighter">Indie Artist</span>
                  <span className="text-[10px] font-black text-primary-500 uppercase tracking-[0.2em]">Collective</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-2xl font-black text-white tracking-tighter">Archival</span>
                  <span className="text-[10px] font-black text-primary-500 uppercase tracking-[0.2em]">Quality Guaranteed</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-2xl font-black text-white tracking-tighter">Global</span>
                  <span className="text-[10px] font-black text-primary-500 uppercase tracking-[0.2em]">Collector Network</span>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-square rounded-4xl bg-linear-to-br from-primary-600 to-primary-800 p-px">
                <div className="h-full w-full rounded-[calc(2.5rem-1px)] bg-gray-950 flex flex-col items-center justify-center text-center p-8 md:p-16 relative overflow-hidden">
                   {/* Background Glow */}
                   <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/10 blur-3xl rounded-full"></div>
                   
                   <div className="w-20 h-20 rounded-2xl bg-primary-500/10 flex items-center justify-center mb-10 rotate-3 hover:rotate-0 transition-transform duration-500">
                     <HiveCell className="w-10 h-10 text-primary-500" />
                   </div>
                   <h3 className="text-3xl md:text-4xl font-black mb-4 uppercase tracking-tight">Start Your Collection</h3>
                   <p className="text-gray-400 mb-12 font-medium">Discover hand-inspected art pieces from independent creators worldwide.</p>
                   <Link 
                    href="/products" 
                    className="w-full inline-flex justify-center items-center gap-2 btn-honey-glazed text-white px-10 py-5 rounded-2xl font-black text-sm uppercase tracking-widest hover:scale-105 transition-all shadow-2xl shadow-primary-500/20"
                   >
                     Shop the Collection
                     <ArrowRight className="w-4 h-4" />
                   </Link>
                </div>
              </div>
              {/* Decorative elements */}
              <div className="absolute -top-12 -right-12 w-64 h-64 bg-primary-500/20 blur-3xl rounded-full -z-10"></div>
              <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-blue-500/10 blur-3xl rounded-full -z-10"></div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
