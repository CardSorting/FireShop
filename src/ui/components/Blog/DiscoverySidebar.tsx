'use client';
import React from 'react';
import { Search, Filter, TrendingUp, Clock, Hash, ChevronRight } from 'lucide-react';
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
    <aside className="space-y-12">
      {/* Search & Sort */}
      <div className="space-y-6">
        <div className="relative group">
           <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-300 group-focus-within:text-primary-600 transition-colors" />
           <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search the journal..."
            className="w-full h-16 pl-16 pr-8 rounded-4xl bg-gray-50 border-none outline-none font-bold text-gray-900 focus:bg-white focus:ring-4 focus:ring-primary-500/5 transition-all shadow-inner"
           />
        </div>
        
        <div className="flex bg-gray-100/50 p-1.5 rounded-2xl border border-gray-100">
          <button 
            onClick={() => setSortBy('new')}
            className={`flex-1 flex items-center justify-center gap-2 h-11 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${sortBy === 'new' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400'}`}
          >
            Newest
          </button>
          <button 
            onClick={() => setSortBy('popular')}
            className={`flex-1 flex items-center justify-center gap-2 h-11 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${sortBy === 'popular' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400'}`}
          >
            Most Popular
          </button>
        </div>
      </div>

      {/* Category List */}
      <div className="space-y-6">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 flex items-center gap-3">
          <Hash className="h-3 w-3 text-primary-600" />
          Browse Topics
        </h3>
        <div className="flex flex-col gap-2">
          <button 
            onClick={() => setSelectedCategory('all')}
            className={`flex items-center justify-between px-6 py-4 rounded-2xl transition-all ${selectedCategory === 'all' ? 'bg-primary-50 text-primary-600 font-black' : 'text-gray-500 hover:bg-gray-50 font-bold'}`}
          >
            <span className="text-xs uppercase tracking-widest">All Articles</span>
            <ChevronRight className={`h-4 w-4 ${selectedCategory === 'all' ? 'opacity-100' : 'opacity-0'}`} />
          </button>
          {categories.map(category => (
            <button 
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`flex items-center justify-between px-6 py-4 rounded-2xl transition-all ${selectedCategory === category.id ? 'bg-primary-50 text-primary-600 font-black' : 'text-gray-500 hover:bg-gray-50 font-bold'}`}
            >
              <span className="text-xs uppercase tracking-widest">{category.name}</span>
              <ChevronRight className={`h-4 w-4 ${selectedCategory === category.id ? 'opacity-100' : 'opacity-0'}`} />
            </button>
          ))}
        </div>
      </div>

      {/* Trending Now */}
      <div className="space-y-6">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 flex items-center gap-3">
          <TrendingUp className="h-3 w-3 text-primary-600" />
          Trending Now
        </h3>
        <div className="space-y-6">
          {trendingPosts.slice(0, 3).map((post, i) => (
            <Link key={post.id} href={`/blog/${post.slug}`} className="group flex items-start gap-4">
               <span className="text-2xl font-black text-gray-100 group-hover:text-primary-100 transition-colors tabular-nums">0{i+1}</span>
               <div className="space-y-1">
                  <h4 className="text-sm font-black text-gray-900 leading-tight group-hover:text-primary-600 transition-colors line-clamp-2">{post.title}</h4>
                  <div className="flex items-center gap-2 text-[8px] font-black uppercase tracking-widest text-gray-400">
                    <span>{post.categoryName}</span>
                    <span className="h-1 w-1 rounded-full bg-gray-200" />
                    <span>{Math.ceil((post.content?.split(' ').length || 0) / 200)} Min Read</span>
                  </div>
               </div>
            </Link>
          ))}
        </div>
      </div>
      
      {/* Editorial Curation */}
      <div className="bg-gray-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden group shadow-2xl">
         <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-primary-600/20 blur-2xl group-hover:scale-150 transition-transform duration-700" />
         <div className="relative z-10 space-y-4">
            <h4 className="text-xl font-black leading-tight">Curated Collectibles</h4>
            <p className="text-white/60 text-xs font-medium leading-relaxed">
              Explore our hand-picked selection of physical prints matching our latest stories.
            </p>
            <Link href="/products" className="inline-flex items-center gap-3 text-[9px] font-black uppercase tracking-widest text-primary-400 hover:text-white transition-colors">
              Explore Store <ChevronRight className="h-3 w-3" />
            </Link>
         </div>
      </div>
    </aside>
  );
}
