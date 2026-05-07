/**
 * [LAYER: INFRASTRUCTURE]
 */
'use client';
import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useServices } from '@ui/hooks/useServices';
import { BlogCard, NewsletterBox, TrendingPostItem, TopicPill, SeriesCard } from '@ui/components/BlogComponents';
import { BlogHero } from '@ui/components/Blog/BlogHero';
import { TrendingSection } from '@ui/components/Blog/TrendingSection';

import { Loader2, Search, Sparkles, Filter, X, ArrowRight, BookOpen, Layers, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { KnowledgebaseArticle, KnowledgebaseCategory, BlogSeries } from '@domain/models';

export default function BlogPage() {
  const searchParams = useSearchParams();
  const services = useServices();
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const [posts, setPosts] = useState<KnowledgebaseArticle[]>([]);
  const [categories, setCategories] = useState<KnowledgebaseCategory[]>([]);
  const [series, setSeries] = useState<BlogSeries[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>(() => searchParams.get('category') || 'all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'new' | 'popular'>('new');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | undefined>(undefined);
  const ARTICLES_PER_PAGE = 9;
  const loadMoreControllerRef = React.useRef<AbortController | null>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const { scrollLeft, clientWidth } = scrollContainerRef.current;
      const scrollTo = direction === 'left' 
        ? scrollLeft - clientWidth / 2 
        : scrollLeft + clientWidth / 2;
      
      scrollContainerRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    
    async function loadInitialData() {
      try {
        setLoading(true);
        const [postsRes, categoriesData, seriesData] = await Promise.all([
          services.knowledgebaseService.getArticles({ 
            type: 'blog', 
            status: 'published',
            limit: ARTICLES_PER_PAGE,
            signal: controller.signal
          }),
          services.knowledgebaseService.getCategories(controller.signal),
          services.knowledgebaseService.getSeries(controller.signal)
        ]);
        
        if (!controller.signal.aborted) {
          setPosts(postsRes.articles);
          setNextCursor(postsRes.nextCursor);
          setCategories(categoriesData);
          setSeries(seriesData);
        }
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return;
        console.error('Failed to load blog data', err);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }
    
    void loadInitialData();
    return () => {
      controller.abort();
      loadMoreControllerRef.current?.abort();
    };
  }, [services.knowledgebaseService]);

  const loadMore = async () => {
    if (!nextCursor || loadingMore) return;
    
    // Abort any existing loadMore request before starting a new one
    loadMoreControllerRef.current?.abort();
    const controller = new AbortController();
    loadMoreControllerRef.current = controller;
    
    try {
      setLoadingMore(true);
      const postsRes = await services.knowledgebaseService.getArticles({
        type: 'blog',
        status: 'published',
        limit: ARTICLES_PER_PAGE,
        cursor: nextCursor,
        signal: controller.signal
      });
      
      if (!controller.signal.aborted) {
        setPosts(prev => [...prev, ...postsRes.articles]);
        setNextCursor(postsRes.nextCursor);
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      console.error('Failed to load more posts', err);
    } finally {
      setLoadingMore(false);
    }
  };

  const featuredPost = useMemo(() => {
    return posts.find(p => p.isFeatured) || posts[0];
  }, [posts]);

  const trendingPosts = useMemo(() => {
    return [...posts]
      .sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))
      .slice(0, 6);
  }, [posts]);

  const filteredPosts = useMemo(() => {
    let result = posts.filter(post => post.id !== featuredPost?.id);
    
    if (selectedCategory !== 'all') {
      result = result.filter(post => post.categoryId === selectedCategory);
    }
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(post => 
        post.title.toLowerCase().includes(q) || 
        post.excerpt.toLowerCase().includes(q)
      );
    }

    if (sortBy === 'popular') {
      result = [...result].sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0));
    } else {
      result = [...result].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return result;
  }, [posts, featuredPost, selectedCategory, searchQuery, sortBy]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center py-40 space-y-6 pt-28">
        <Loader2 className="h-12 w-12 animate-spin text-primary-600" />
        <p className="text-sm font-black uppercase tracking-widest text-gray-400">Loading the Hive Journal...</p>
      </div>
    );
  }

  return (
    <div className="bg-white overflow-x-hidden pt-28">
      {/* Magazine Style Top Fold */}
      {!loading && selectedCategory === 'all' && !searchQuery && (
        <section className="max-w-[1600px] mx-auto px-4 pt-12 pb-24 border-b border-gray-100">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
            
            {/* Featured Hero Story */}
            <div className="lg:col-span-12">
              <div className="mb-10 flex items-center justify-between">
                <div className="space-y-1">
                  <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary-600">Featured Today</h2>
                  <p className="text-sm font-bold text-gray-400">Hand-picked insights for the modern creator.</p>
                </div>
              </div>
              {featuredPost && <BlogHero post={featuredPost} />}
            </div>
          </div>
        </section>
      )}

      {/* Navigation & Feed */}
      <div className="max-w-[1600px] mx-auto px-4 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          
          {/* Search Bar (Moved to top of feed) */}
          <div className="lg:col-span-12 mb-12">
            <div className="relative w-full group">
              <Search className="absolute left-8 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-300 group-focus-within:text-primary-600 transition-colors" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search the journal archives..."
                className="w-full h-20 pl-20 pr-8 rounded-[2.5rem] bg-gray-50 border border-gray-100 focus:border-primary-500 focus:bg-white focus:ring-8 focus:ring-primary-500/5 outline-none text-lg font-medium transition-all shadow-sm"
              />
            </div>
          </div>
          
          {/* Main Feed Area */}
          <main className="lg:col-span-12 space-y-16">
            {/* Header with Sort */}
            <div className="flex items-center justify-between pb-8">
               <div className="space-y-1">
                 <h2 className="text-3xl font-black text-gray-900 tracking-tight">
                   {searchQuery ? `Searching: ${searchQuery}` : (selectedCategory === 'all' ? 'The Full Journal' : categories.find(c => c.id === selectedCategory)?.name)}
                 </h2>
                 <p className="text-sm font-bold text-gray-400">Showing {filteredPosts.length} stories</p>
               </div>
               
               <div className="flex items-center gap-4 bg-gray-50 p-1.5 rounded-2xl border border-gray-100">
                  <button 
                    onClick={() => setSortBy('new')}
                    className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${sortBy === 'new' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                    Newest
                  </button>
                  <button 
                    onClick={() => setSortBy('popular')}
                    className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${sortBy === 'popular' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                    Popular
                  </button>
               </div>
            </div>

            {/* Active Filters / Search State */}
            {(selectedCategory !== 'all' || searchQuery) && (
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-12">
                <div className="space-y-2">
                  <h2 className="text-4xl font-black text-gray-900 tracking-tight flex items-center gap-4">
                    {searchQuery ? `Searching for "${searchQuery}"` : categories.find(c => c.id === selectedCategory)?.name}
                  </h2>
                  <p className="text-gray-500 font-medium">Found {filteredPosts.length} stories for your curiosity.</p>
                </div>
                <button 
                  onClick={() => { setSelectedCategory('all'); setSearchQuery(''); }}
                  className="shrink-0 flex items-center gap-2 px-6 py-3 rounded-xl bg-gray-50 text-gray-900 text-[10px] font-black uppercase tracking-widest hover:bg-gray-100 transition-all"
                >
                  <X className="h-4 w-4" />
                  Clear Filters
                </button>
              </div>
            )}

            {/* Content Feed - Editorial Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-20">
              <AnimatePresence mode="popLayout">
                {filteredPosts.length > 0 ? (
                  filteredPosts.map((post, index) => {
                    // Mid-feed break for series
                    const showSeriesMidFeed = index === 4 && series.length > 0 && selectedCategory === 'all' && !searchQuery;
                    
                    // In a 4-column layout, we want different rhythm
                    const isWide = index === 0 && selectedCategory === 'all' && !searchQuery;
                    
                    return (
                      <div key={post.id} className="contents">
                        {showSeriesMidFeed && (
                          <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            className="col-span-full py-20 bg-gray-50 rounded-[4rem] border border-gray-100 my-12"
                          >
                             <div className="px-8 md:px-12 mb-10 flex items-center justify-between">
                                <div className="space-y-1">
                                  <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary-600 flex items-center gap-2">
                                    <Layers className="h-3 w-3" />
                                    Strategy Paths
                                  </h2>
                                  <h3 className="text-4xl font-black text-gray-900 tracking-tight">Curated Learning Journeys</h3>
                                </div>
                             </div>
                             <div className="flex gap-8 overflow-x-auto no-scrollbar px-8 md:px-12 pb-8 scroll-smooth">
                               {series.map(s => (
                                 <SeriesCard key={s.id} series={s} />
                               ))}
                             </div>
                          </motion.div>
                        )}
                        
                        <motion.div 
                          layout
                          initial={{ opacity: 0, y: 30 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          transition={{ 
                            duration: 0.6, 
                            delay: index % 4 * 0.1,
                            ease: [0.16, 1, 0.3, 1]
                          }}
                          className={isWide ? 'md:col-span-2 lg:col-span-2 xl:col-span-2' : ''}
                        >
                          <BlogCard 
                            post={post} 
                            variant={isWide ? 'wide' : 'standard'} 
                          />
                        </motion.div>
                      </div>
                    );
                  })
                ) : (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="col-span-full py-40 text-center space-y-8 bg-gray-50/50 rounded-[4rem] border-2 border-dashed border-gray-100"
                  >
                    <div className="h-24 w-24 rounded-full bg-white flex items-center justify-center mx-auto shadow-sm">
                      <Search className="h-10 w-10 text-gray-200" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-2xl font-black text-gray-900">Quiet in the Hive</h3>
                      <p className="text-gray-500 font-medium max-w-sm mx-auto">We couldn't find any articles matching your current lens. Try exploring a different topic.</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Load More Button */}
            {nextCursor && (
              <div className="pt-24 flex justify-center">
                <button 
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="px-12 py-6 rounded-4xl bg-gray-900 text-white font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 transition-all shadow-2xl shadow-gray-200 flex items-center gap-4"
                >
                  {loadingMore ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Waking the Hive...
                    </>
                  ) : (
                    <>
                      Load Older Stories
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
