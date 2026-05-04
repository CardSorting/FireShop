'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { useServices } from '@ui/hooks/useServices';
import { BlogCard, NewsletterBox } from '@ui/components/BlogComponents';
import { BlogHero } from '@ui/components/Blog/BlogHero';
import { CategoryNavigator } from '@ui/components/Blog/CategoryNavigator';
import { TrendingSection } from '@ui/components/Blog/TrendingSection';

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
      {/* Immersive Hero Section */}
      {!loading && featuredPost && selectedCategory === 'all' && !searchQuery && (
        <div className="max-w-[1600px] mx-auto px-4 pt-12">
          <BlogHero post={featuredPost} />
        </div>
      )}

      {/* Popular Leaderboard - Mirror.xyz Style */}
      {!loading && selectedCategory === 'all' && !searchQuery && (
        <div className="max-w-[1600px] mx-auto px-4 py-24 border-b border-gray-50">
          <TrendingSection posts={trendingPosts} />
        </div>
      )}

      {/* Sticky Category & Search Bar */}
      <CategoryNavigator 
        categories={categories} 
        selectedCategory={selectedCategory} 
        onSelect={setSelectedCategory} 
        sortBy={sortBy}
        onSortChange={setSortBy}
      />

      <div className="max-w-[1600px] mx-auto px-4 py-24 space-y-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          {/* Main Feed Area */}
          <main className="lg:col-span-8 space-y-16">
            {/* Active Filters / Search State */}
            {(selectedCategory !== 'all' || searchQuery) && (
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-12 border-b border-gray-100">
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

            {/* Content Feed - Dynamic Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-24">
              {filteredPosts.length > 0 ? (
                filteredPosts.map((post, index) => {
                  // Every 5th post (starting from 0) is wide, but only if we have enough space
                  const isWide = index % 5 === 0 && filteredPosts.length > 1;
                  return (
                    <BlogCard 
                      key={post.id} 
                      post={post} 
                      variant={isWide ? 'wide' : 'standard'} 
                    />
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

            {/* Infinite Scroll / Load More Placeholder */}
            {filteredPosts.length > 0 && (
              <div className="pt-24 flex justify-center">
                <button className="px-12 py-6 rounded-4xl border-2 border-gray-900 text-gray-900 font-black text-xs uppercase tracking-widest hover:bg-gray-900 hover:text-white transition-all group flex items-center gap-4">
                  Explore More Stories
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-2 transition-transform" />
                </button>
              </div>
            )}
          </main>

          {/* Contextual Sidebar */}
          <aside className="lg:col-span-4 space-y-20">
            {/* Prominent Search */}
            <div className="space-y-6">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Search Journal</h3>
              <div className="relative group">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-300 group-focus-within:text-primary-600 transition-colors" />
                <input 
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Find a story..."
                  className="w-full h-20 pl-16 pr-8 rounded-3xl bg-gray-50 border-none outline-none font-bold text-gray-900 focus:bg-white focus:ring-8 focus:ring-primary-500/5 transition-all shadow-inner"
                />
              </div>
            </div>

            {/* Staff Picks - Medium Style */}
            <div className="space-y-8">
              <div className="flex items-center gap-3">
                <Sparkles className="h-4 w-4 text-amber-500" />
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Staff Picks</h3>
              </div>
              <div className="space-y-2">
                {posts.slice(0, 3).map(post => (
                  <BlogCard key={post.id} post={post} variant="compact" />
                ))}
              </div>
            </div>

            {/* Newsletter Integration */}
            <div className="p-10 rounded-[3rem] bg-gray-900 text-white relative overflow-hidden group shadow-2xl">
              <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary-600/20 blur-3xl group-hover:scale-150 transition-transform duration-1000" />
              <div className="relative z-10 space-y-8">
                <div className="space-y-4">
                  <h4 className="text-2xl font-black leading-tight">Join the Hive</h4>
                  <p className="text-white/60 text-sm font-medium leading-relaxed">
                    Weekly insights on art, collectibles, and the future of creative drops.
                  </p>
                </div>
                <NewsletterBox />
              </div>
            </div>

            {/* Top Contributors */}
            <div className="space-y-8">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Top Contributors</h3>
              <div className="space-y-6">
                {[
                  { name: 'Dr. Art Collector', role: 'Chief Curator', count: 12 },
                  { name: 'Digital Wanderer', role: 'Trend Analyst', count: 8 },
                  { name: 'Hive Staff', role: 'Editorial', count: 24 }
                ].map((author, i) => (
                  <div key={i} className="flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-2xl bg-gray-100 border border-gray-100 overflow-hidden group-hover:border-primary-200 transition-colors">
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

            {/* Secondary Leaderboard / Tags */}
            <div className="space-y-8">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Topics to Explore</h3>
              <div className="flex flex-wrap gap-2">
                {categories.map(cat => (
                  <button 
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className="px-5 py-3 rounded-2xl bg-gray-50 text-gray-500 text-[10px] font-black uppercase tracking-widest hover:bg-primary-50 hover:text-primary-600 transition-all border border-transparent hover:border-primary-100"
                  >
                    #{cat.name}
                  </button>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}


