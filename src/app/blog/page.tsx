'use client';
import React, { useState, useEffect } from 'react';
import { useServices } from '@ui/hooks/useServices';
import { BlogCard, NewsletterBox } from '@ui/components/BlogComponents';

import { Loader2, Search, Filter, Sparkles } from 'lucide-react';
import type { KnowledgebaseArticle, KnowledgebaseCategory } from '@domain/models';

export default function BlogPage() {
  const services = useServices();
  const [posts, setPosts] = useState<KnowledgebaseArticle[]>([]);
  const [categories, setCategories] = useState<KnowledgebaseCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
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

  const filteredPosts = posts.filter(post => {
    const matchesCategory = selectedCategory === 'all' || post.categoryId === selectedCategory;
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         post.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const featuredPost = posts.find(p => p.isFeatured) || posts[0];

  return (
    <div className="max-w-7xl mx-auto px-4 py-20 md:py-32 space-y-32 animate-in fade-in duration-700">
      {/* Hero Section */}
      <div className="text-center space-y-10 max-w-4xl mx-auto">
        <div className="space-y-4">
           <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-primary-50 text-primary-600 border border-primary-100">
             <Sparkles className="h-4 w-4" />
             <span className="text-[10px] font-black uppercase tracking-widest">Collector Insights</span>
           </div>
           <h1 className="text-6xl md:text-8xl font-black text-gray-900 tracking-tighter leading-none">
             The <span className="text-primary-600 italic">Hive</span> Journal
           </h1>
           <p className="text-xl md:text-2xl font-medium text-gray-500 max-w-2xl mx-auto leading-relaxed">
             Deep dives into art techniques, collector spotlights, and the future of digital-physical collectibles.
           </p>
        </div>

        {/* Navigation & Search Bar */}
        <div className="space-y-8">
          {/* Category Pills */}
          <div className="flex items-center justify-center gap-3 overflow-x-auto no-scrollbar pb-2">
            <button 
              onClick={() => setSelectedCategory('all')}
              className={`px-8 py-4 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                selectedCategory === 'all' 
                  ? 'bg-gray-900 text-white shadow-xl shadow-gray-900/20' 
                  : 'bg-white text-gray-500 border border-gray-100 hover:border-primary-600 hover:text-primary-600 shadow-sm'
              }`}
            >
              All Articles
            </button>
            {categories.map(c => (
              <button 
                key={c.id}
                onClick={() => setSelectedCategory(c.id)}
                className={`px-8 py-4 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                  selectedCategory === c.id 
                    ? 'bg-gray-900 text-white shadow-xl shadow-gray-900/20' 
                    : 'bg-white text-gray-500 border border-gray-100 hover:border-primary-600 hover:text-primary-600 shadow-sm'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4 bg-white rounded-[3rem] p-3 shadow-2xl shadow-gray-200/50 border border-gray-100">
             <div className="relative flex-1 w-full">
               <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
               <input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search the journal for inspiration..."
                className="w-full h-16 pl-16 pr-8 rounded-full bg-gray-50/50 border-none outline-none font-bold text-gray-900 focus:bg-white transition-all"
               />
             </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-40 space-y-6">
           <Loader2 className="h-12 w-12 animate-spin text-primary-600" />
           <p className="text-sm font-black uppercase tracking-widest text-gray-400">Syncing with the hive...</p>
        </div>
      ) : (
        <>
          {/* Main Content Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {filteredPosts.length > 0 ? (
              filteredPosts.map(post => (
                <BlogCard key={post.id} post={post} />
              ))
            ) : (
              <div className="col-span-full py-40 text-center space-y-6 bg-gray-50 rounded-[4rem] border border-dashed border-gray-200">
                <Search className="h-16 w-16 text-gray-200 mx-auto" />
                <h3 className="text-2xl font-black text-gray-900">No matches found</h3>
                <p className="text-gray-500 font-medium">Try adjusting your filters or search terms.</p>
                <button 
                  onClick={() => { setSelectedCategory('all'); setSearchQuery(''); }}
                  className="text-sm font-black uppercase tracking-widest text-primary-600 hover:underline"
                >
                  Clear All Filters
                </button>
              </div>
            )}
          </div>

          {/* Lead Gen Section */}
          <NewsletterBox />
        </>
      )}
    </div>
  );
}
