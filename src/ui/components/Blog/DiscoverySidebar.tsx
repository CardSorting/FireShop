'use client';
import React from 'react';
import { Search, TrendingUp, Hash, ChevronRight, Sparkles, BookOpen } from 'lucide-react';
import type { KnowledgebaseCategory, KnowledgebaseArticle } from '@domain/models';
import Link from 'next/link';

interface DiscoverySidebarProps {
  categories: KnowledgebaseCategory[];
  selectedCategory: string;
  setSelectedCategory: (id: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  trendingPosts: KnowledgebaseArticle[];
  sortBy: 'new' | 'popular';
  setSortBy: (s: 'new' | 'popular') => void;
}

export function DiscoverySidebar({
  categories,
  selectedCategory,
  setSelectedCategory,
  searchQuery,
  setSearchQuery,
  trendingPosts,
  sortBy,
  setSortBy
}: DiscoverySidebarProps) {
  return (
    <aside className="space-y-16">
      {/* Search & Sort */}
      <div className="space-y-8">
        <div className="relative group">
           <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-300 group-focus-within:text-primary-600 transition-colors" />
           <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search the journal..."
            className="w-full h-18 pl-16 pr-8 rounded-[2rem] bg-gray-50 border border-transparent outline-none font-bold text-gray-900 focus:bg-white focus:border-gray-100 focus:ring-8 focus:ring-primary-500/5 transition-all shadow-sm"
           />
        </div>
        
        <div className="flex bg-gray-100/50 p-1.5 rounded-2xl border border-gray-100">
          <button 
            onClick={() => setSortBy('new')}
            className={`flex-1 flex items-center justify-center gap-2 h-11 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${sortBy === 'new' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400'}`}
          >
            Latest Feed
          </button>
          <button 
            onClick={() => setSortBy('popular')}
            className={`flex-1 flex items-center justify-center gap-2 h-11 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${sortBy === 'popular' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400'}`}
          >
            Most Read
          </button>
        </div>
      </div>

      {/* Recommended Topics */}
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Recommended Topics</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={() => setSelectedCategory('all')}
            className={`px-5 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${selectedCategory === 'all' ? 'bg-gray-900 text-white shadow-xl shadow-gray-200' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
          >
            All
          </button>
          {categories.map(category => (
            <button 
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-5 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${selectedCategory === category.id ? 'bg-gray-900 text-white shadow-xl shadow-gray-200' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* Staff Favorites */}
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Staff Favorites</h3>
          <Link href="/blog" className="text-[9px] font-black uppercase tracking-widest text-primary-600 hover:underline">View All</Link>
        </div>
        <div className="space-y-8">
          {trendingPosts.slice(2, 5).map((post) => (
            <Link key={post.id} href={`/blog/${post.slug}`} className="group block space-y-3">
               <div className="flex items-center gap-3">
                  <div className="h-6 w-6 rounded-full overflow-hidden border border-gray-100">
                    <img 
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${post.authorName || 'Staff'}`} 
                      alt="Author" 
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-900">{post.authorName}</span>
               </div>
               <h4 className="text-base font-black text-gray-900 leading-tight group-hover:text-primary-600 transition-colors line-clamp-2 tracking-tight">
                 {post.title}
               </h4>
               <div className="flex items-center gap-3 text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                  <span>{new Date(post.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                  <span className="h-1 w-1 rounded-full bg-gray-200" />
                  <span>{Math.ceil((post.content?.split(' ').length || 0) / 200)} Min Read</span>
               </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Author Spotlight */}
      <div className="space-y-8 pt-10 border-t border-gray-100">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 flex items-center gap-2">
          <Sparkles className="h-3 w-3 text-amber-500" />
          Who to follow
        </h3>
        <div className="space-y-6">
           {[
             { name: 'Sarah Strategist', role: 'Editorial Director', bio: 'Helping creators build sustainable media businesses.' },
             { name: 'Leonardo DaBee', role: 'Master Artist', bio: 'Exploring the intersection of art and digital ownership.' }
           ].map((contributor, i) => (
             <div key={i} className="flex items-start justify-between group cursor-pointer gap-4">
                <div className="flex items-start gap-4">
                  <div className="shrink-0 h-12 w-12 rounded-2xl bg-gray-50 border border-gray-100 overflow-hidden group-hover:border-primary-200 transition-all shadow-sm">
                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${contributor.name}`} alt={contributor.name} />
                  </div>
                  <div className="space-y-1">
                    <h5 className="text-xs font-black text-gray-900 group-hover:text-primary-600 transition-colors">{contributor.name}</h5>
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{contributor.role}</p>
                    <p className="text-[10px] text-gray-500 font-medium line-clamp-2 leading-relaxed">{contributor.bio}</p>
                  </div>
                </div>
                <button className="shrink-0 px-4 py-2 rounded-full border border-gray-200 text-[9px] font-black uppercase tracking-widest hover:bg-gray-900 hover:text-white transition-all">
                  Follow
                </button>
             </div>
           ))}
        </div>
      </div>
      
      {/* Editorial Curation */}
      <div className="bg-gray-50 rounded-[2.5rem] p-10 border border-gray-100 relative overflow-hidden group">
         <div className="relative z-10 space-y-6">
            <div className="h-12 w-12 rounded-2xl bg-white flex items-center justify-center shadow-xl mb-4 group-hover:scale-110 transition-transform">
               <BookOpen className="h-6 w-6 text-primary-600" />
            </div>
            <h4 className="text-xl font-black leading-tight text-gray-900">Curated Collectibles</h4>
            <p className="text-gray-500 text-xs font-medium leading-relaxed">
              Explore our hand-picked selection of physical prints matching our latest stories.
            </p>
            <Link href="/products" className="inline-flex items-center gap-3 px-6 py-3 rounded-xl bg-gray-900 text-white text-[9px] font-black uppercase tracking-widest hover:bg-primary-600 transition-all shadow-xl shadow-gray-200">
              Explore Store <ChevronRight className="h-3 w-3" />
            </Link>
         </div>
      </div>
    </aside>
  );
}
