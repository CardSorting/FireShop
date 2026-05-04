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
    <div className="relative w-full h-full min-h-[650px] md:min-h-[750px] rounded-[4rem] overflow-hidden group shadow-2xl flex flex-col justify-end bg-gray-950">
      {/* Content Side - Immersive Overlay */}
      <div className="relative z-20 flex flex-col justify-end p-8 md:p-16 space-y-10 bg-linear-to-t from-gray-950 via-gray-950/60 to-transparent pt-40">
        
        <div className="max-w-4xl space-y-8">
          <div className="flex flex-wrap items-center gap-4">
             <div className="px-5 py-2 rounded-2xl bg-primary-600 text-white text-[10px] font-black uppercase tracking-[0.25em] shadow-2xl shadow-primary-600/40 animate-pulse">
               Spotlight
             </div>
             <div className="px-6 py-2 rounded-2xl bg-white/10 backdrop-blur-2xl text-white/80 border border-white/10 text-[10px] font-black uppercase tracking-[0.25em]">
               {post.categoryName || 'Strategy'}
             </div>
          </div>

          <div className="space-y-6">
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-white tracking-tighter leading-[0.9] group-hover:tracking-tight transition-all duration-1000">
              {post.title}
            </h1>
            <p className="text-white/50 text-xl md:text-2xl font-medium max-w-2xl line-clamp-3 leading-relaxed tracking-tight">
              {post.excerpt}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-8 pt-6">
             <Link 
              href={`/blog/${post.slug}`}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-5 px-10 py-5 rounded-4xl bg-white text-gray-950 font-black text-[11px] uppercase tracking-[0.3em] hover:bg-primary-600 hover:text-white transition-all duration-500 shadow-[0_20px_50px_-20px_rgba(255,255,255,0.3)] active:scale-95 group/btn"
             >
               Begin Reading
               <ArrowRight className="h-4 w-4 group-hover/btn:translate-x-3 transition-transform duration-500" />
             </Link>

             <div className="flex items-center gap-6 px-8 py-5 rounded-4xl bg-white/5 backdrop-blur-3xl border border-white/10">
                <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-white/60">
                  <Clock className="h-4 w-4 text-primary-500" />
                  <span>{readingTime} MIN</span>
                </div>
                <div className="h-4 w-px bg-white/10" />
                <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-white/60">
                  <Calendar className="h-4 w-4 text-primary-500" />
                  <span>{new Date(post.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</span>
                </div>
             </div>
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

