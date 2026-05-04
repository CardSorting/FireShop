'use client';
import React from 'react';
import Link from 'next/link';
import { Sparkles, Calendar, Clock, ArrowRight } from 'lucide-react';
import type { KnowledgebaseArticle } from '@domain/models';

export function BlogHero({ post }: { post: KnowledgebaseArticle }) {
  const readingTime = Math.ceil((post.content?.split(' ').length || 0) / 200);

  return (
    <div className="relative w-full rounded-[3.5rem] overflow-hidden group mb-20 shadow-2xl shadow-gray-200/50">
      <div className="absolute inset-0 bg-linear-to-t from-gray-900/95 via-gray-900/40 to-transparent z-10" />
      
      {post.featuredImageUrl ? (
        <img 
          src={post.featuredImageUrl} 
          alt={post.title} 
          className="w-full h-[650px] object-cover transition-transform duration-1000 group-hover:scale-105"
        />
      ) : (
        <div className="w-full h-[650px] bg-gray-900 flex items-center justify-center">
          <Sparkles className="h-20 w-20 text-gray-800" />
        </div>
      )}

      <div className="absolute top-12 left-12 z-20 flex flex-col gap-4">
         <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/10 backdrop-blur-xl border border-white/10 text-white text-[10px] font-black uppercase tracking-[0.2em] animate-pulse">
            <div className="h-2 w-2 rounded-full bg-primary-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
            Live Spotlight
         </div>
      </div>

      <div className="absolute inset-0 z-20 flex flex-col justify-end p-12 md:p-20 space-y-8">
        <div className="flex flex-wrap items-center gap-4">
           <span className="px-6 py-2.5 rounded-2xl bg-primary-600 text-white text-[10px] font-black uppercase tracking-widest shadow-2xl shadow-primary-600/40">
             Featured Story
           </span>
           <span className="px-6 py-2.5 rounded-2xl bg-white/10 backdrop-blur-md text-white border border-white/10 text-[10px] font-black uppercase tracking-widest">
             {post.categoryName || 'General'}
           </span>
        </div>

        <h1 className="text-5xl md:text-7xl font-black text-white max-w-5xl tracking-tighter leading-[0.9] group-hover:text-primary-400 transition-colors duration-500">
          {post.title}
        </h1>
        
        <p className="text-white/60 text-xl md:text-2xl font-medium max-w-3xl line-clamp-2 leading-relaxed">
          {post.excerpt}
        </p>

        <div className="flex flex-col md:flex-row md:items-center gap-10 pt-6">
           <div className="flex items-center gap-8 text-[11px] font-black uppercase tracking-widest text-white/40">
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-primary-500" />
                <span>{new Date(post.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-primary-500" />
                <span>{readingTime} Min Read</span>
              </div>
           </div>

           <Link 
            href={`/blog/${post.slug}`}
            className="inline-flex items-center gap-6 px-12 py-6 rounded-3xl bg-white text-gray-900 font-black text-sm uppercase tracking-[0.2em] hover:bg-primary-600 hover:text-white transition-all shadow-2xl active:scale-95 group/btn"
           >
             Continue Reading
             <ArrowRight className="h-5 w-5 group-hover/btn:translate-x-3 transition-transform" />
           </Link>
        </div>
      </div>
    </div>
  );
}

