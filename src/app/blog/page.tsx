/**
 * [LAYER: INFRASTRUCTURE]
 */
'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { useServices } from '@ui/hooks/useServices';
import { BlogCard, NewsletterBox } from '@ui/components/BlogComponents';
import { BlogHero } from '@ui/components/Blog/BlogHero';
import { CategoryNavigator } from '@ui/components/Blog/CategoryNavigator';
import { TrendingSection } from '@ui/components/Blog/TrendingSection';
import { DiscoverySidebar } from '@ui/components/Blog/DiscoverySidebar';

import { Loader2, Search, Sparkles, Filter, X, ArrowRight } from 'lucide-react';
import type { KnowledgebaseArticle, KnowledgebaseCategory } from '@domain/models';

export default function BlogPage() {
  const services = useServices();
  const [posts, setPosts] = useState<KnowledgebaseArticle[]>([]);
  const [categories, setCategories] = useState<KnowledgebaseCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'new' | 'popular'>('new');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [postsData, categoriesData] = await Promise.all([
          services.knowledgebaseService.getArticles({ type: 'blog', status: 'published' }),
          services.knowledgebaseService.getCategories()
        ]);
        setPosts(postsData);
        setCategories(categoriesData);
      } catch (err) {
        console.error('Failed to load blog data', err);
      } finally {
        setLoading(false);
      }
    }
    void loadData();
  }, [services.knowledgebaseService]);

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
      <div className="min-h-screen flex flex-col items-center justify-center py-40 space-y-6">
        <Loader2 className="h-12 w-12 animate-spin text-primary-600" />
        <p className="text-sm font-black uppercase tracking-widest text-gray-400">Loading the Hive Journal...</p>
      </div>
    );
  }

  return (
    <div className="bg-white">
      {/* Magazine Style Top Fold */}
      {!loading && selectedCategory === 'all' && !searchQuery && (
        <section className="max-w-[1600px] mx-auto px-4 pt-12 pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            
            {/* Featured Hero Story */}
            <div className="lg:col-span-8">
              {featuredPost && <BlogHero post={featuredPost} />}
            </div>

            {/* Popular Blog Strategies Component */}
            <div className="lg:col-span-4 bg-gray-50 rounded-[3rem] p-8 border border-gray-100 flex flex-col h-full">
              <div className="mb-8">
                 <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary-600 mb-2">Editor's Picks</h2>
                 <h3 className="text-3xl font-black text-gray-900 tracking-tight leading-tight">Popular Blog Strategies</h3>
              </div>
              <div className="flex-1 space-y-6 overflow-y-auto pr-2 no-scrollbar">
                {trendingPosts.slice(0, 5).map((post, i) => (
                  <a key={post.id} href={`/blog/${post.slug}`} className="group flex items-center justify-between gap-5 p-4 rounded-2xl hover:bg-white hover:shadow-sm transition-all border border-transparent hover:border-gray-100">
                    <div className="flex items-start gap-5">
                      <span className="text-2xl font-black text-primary-200 group-hover:text-primary-500 transition-colors pt-1 tabular-nums">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <div className="space-y-1">
                        <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">{post.categoryName}</span>
                        <h4 className="text-sm font-black text-gray-900 leading-snug group-hover:text-primary-600 transition-colors line-clamp-2">
                          {post.title}
                        </h4>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mt-1">
                          {Math.ceil((post.content?.split(' ').length || 0) / 200)} Min Read
                        </p>
                      </div>
                    </div>
                    <div className="h-8 w-8 rounded-full bg-gray-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shrink-0">
                      <ArrowRight className="h-3 w-3 text-primary-600 -rotate-45" />
                    </div>
                  </a>
                ))}
              </div>
            </div>

          </div>
        </section>
      )}

      {/* Navigation & Feed */}
      <div className="max-w-[1600px] mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          
          {/* Main Feed Area */}
          <main className="lg:col-span-8 space-y-16">
            {/* Sticky Topic Navigator */}
            <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl -mx-4 px-4 py-4 mb-4 border-b border-gray-100 transition-all">
              <CategoryNavigator 
                categories={categories} 
                selectedCategory={selectedCategory} 
                onSelect={setSelectedCategory} 
                sortBy={sortBy}
                onSortChange={setSortBy}
              />
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-20">
              {filteredPosts.length > 0 ? (
                filteredPosts.map((post, index) => {
                  // Every 3rd post is wide to break the rhythm
                  const isWide = index % 3 === 0 && selectedCategory === 'all' && !searchQuery;
                  return (
                    <div key={post.id} className={isWide ? 'md:col-span-2' : ''}>
                      <BlogCard 
                        post={post} 
                        variant={isWide ? 'wide' : 'standard'} 
                      />
                    </div>
                  );
                })
              ) : (
                <div className="col-span-full py-40 text-center space-y-8 bg-gray-50/50 rounded-[4rem] border-2 border-dashed border-gray-100">
                  <div className="h-24 w-24 rounded-full bg-white flex items-center justify-center mx-auto shadow-sm">
                    <Search className="h-10 w-10 text-gray-200" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-black text-gray-900">Quiet in the Hive</h3>
                    <p className="text-gray-500 font-medium max-w-sm mx-auto">We couldn't find any articles matching your current lens. Try exploring a different topic.</p>
                  </div>
                </div>
              )}
            </div>

            {/* Pagination Placeholder */}
            {filteredPosts.length > 0 && (
              <div className="pt-24 flex justify-center">
                <button className="px-12 py-6 rounded-4xl bg-gray-900 text-white font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-gray-200 flex items-center gap-4">
                  Load Older Stories
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </main>

          {/* Contextual Sidebar */}
          <aside className="lg:col-span-4">
            <div className="sticky top-24">
              <DiscoverySidebar 
                categories={categories}
                selectedCategory={selectedCategory}
                setSelectedCategory={setSelectedCategory}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                trendingPosts={trendingPosts}
                sortBy={sortBy}
                setSortBy={setSortBy}
              />
              
              {/* Additional Sidebar Context: Author Spotlight */}
              <div className="mt-16 pt-16 border-t border-gray-100 space-y-8">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Featured Curators</h3>
                <div className="space-y-6">
                  {[
                    { name: 'Sarah Strategist', role: 'Editorial Director', count: 42, color: 'bg-indigo-500' },
                    { name: 'Leonardo DaBee', role: 'Master Artist', count: 28, color: 'bg-amber-500' }
                  ].map((author, i) => (
                    <div key={i} className="flex items-center justify-between group cursor-pointer">
                      <div className="flex items-center gap-4">
                        <div className={`h-12 w-12 rounded-2xl ${author.color} overflow-hidden ring-4 ring-white shadow-sm group-hover:ring-gray-50 transition-all`}>
                          <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${author.name}`} alt={author.name} />
                        </div>
                        <div>
                          <p className="text-xs font-black text-gray-900">{author.name}</p>
                          <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">{author.role}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-black text-gray-300 group-hover:text-primary-600 transition-colors">{author.count} Posts</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Newsletter Integration */}
              <div className="mt-16 p-10 rounded-[3rem] bg-gray-900 text-white relative overflow-hidden group shadow-2xl">
                <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary-600/20 blur-3xl group-hover:scale-150 transition-transform duration-1000" />
                <div className="relative z-10 space-y-8">
                  <div className="space-y-4">
                    <h4 className="text-2xl font-black leading-tight">Join the Strategy Hive</h4>
                    <p className="text-white/60 text-sm font-medium leading-relaxed">
                      Weekly insights on content velocity, SEO, and the future of creator monetization.
                    </p>
                  </div>
                  <NewsletterBox />
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
