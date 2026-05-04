/**
 * [LAYER: UI]
 */
'use client';
import React from 'react';
import Link from 'next/link';
import { Sparkles, Calendar, Clock, ArrowRight } from 'lucide-react';
import type { KnowledgebaseArticle } from '@domain/models';

export function BlogHero({ post }: { post: KnowledgebaseArticle }) {
  const readingTime = Math.ceil((post.content?.split(' ').length || 0) / 200);

  return (
    <div className="relative w-full h-full min-h-[600px] rounded-[3rem] overflow-hidden group shadow-2xl flex flex-col justify-end bg-gray-900">
      {/* Content Side */}
      <div className="relative z-20 flex flex-col justify-end p-10 lg:p-12 space-y-8 bg-linear-to-t from-gray-900 via-gray-900/80 to-transparent pt-32">
        <div className="flex flex-wrap items-center gap-3">
           <span className="px-4 py-1.5 rounded-lg bg-primary-600 text-white text-[9px] font-black uppercase tracking-[0.2em] shadow-lg shadow-primary-600/30">
             Featured Story
           </span>
           <span className="px-5 py-2 rounded-xl bg-white/5 backdrop-blur-md text-white/60 border border-white/10 text-[9px] font-black uppercase tracking-[0.2em]">
             {post.categoryName || 'Strategy'}
           </span>
        </div>

        <div className="space-y-4">
          <h1 className="text-4xl lg:text-6xl font-black text-white tracking-tighter leading-tight group-hover:text-primary-400 transition-colors duration-700">
            {post.title}
          </h1>
          <p className="text-white/60 text-lg lg:text-xl font-medium max-w-3xl line-clamp-2 leading-relaxed">
            {post.excerpt}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-6 pt-4">
           <Link 
            href={`/blog/${post.slug}`}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-4 px-8 py-4 rounded-2xl bg-white text-gray-900 font-black text-[10px] uppercase tracking-[0.2em] hover:bg-primary-600 hover:text-white transition-all shadow-xl active:scale-95 group/btn"
           >
             Read Deep Dive
             <ArrowRight className="h-4 w-4 group-hover/btn:translate-x-2 transition-transform" />
           </Link>

           <div className="flex items-center gap-4 text-[9px] font-black uppercase tracking-[0.2em] text-white/40">
              <div className="flex items-center gap-2">
                <Clock className="h-3 w-3 text-primary-500" />
                <span>{readingTime}m Read</span>
              </div>
              <span className="h-1 w-1 rounded-full bg-white/20" />
              <span>{new Date(post.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
           </div>
        </div>
      </div>

      {/* Image Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gray-900/30 z-10" />
        {post.featuredImageUrl ? (
          <img 
            src={post.featuredImageUrl} 
            alt={post.title} 
            className="w-full h-full object-cover transition-transform duration-[20s] ease-out group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full bg-gray-800 flex items-center justify-center">
            <Sparkles className="h-20 w-20 text-gray-700" />
          </div>
        )}
      </div>
    </div>
  );
}

