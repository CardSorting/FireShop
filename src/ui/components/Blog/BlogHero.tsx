'use client';
import React from 'react';
import Link from 'next/link';
import { Sparkles, Calendar, Clock, ArrowRight } from 'lucide-react';
import type { KnowledgebaseArticle } from '@domain/models';

export function BlogHero({ post }: { post: KnowledgebaseArticle }) {
  const readingTime = Math.ceil((post.content?.split(' ').length || 0) / 200);

  return (
    <div className="relative w-full h-[700px] rounded-[4rem] overflow-hidden group shadow-3xl shadow-gray-200/50 flex flex-col lg:flex-row bg-gray-900">
      {/* Content Side */}
      <div className="relative z-20 flex-1 flex flex-col justify-center p-12 lg:p-24 space-y-10 lg:w-1/2">
        <div className="flex flex-wrap items-center gap-4">
           <span className="px-5 py-2 rounded-xl bg-primary-600 text-white text-[9px] font-black uppercase tracking-[0.2em] shadow-xl shadow-primary-600/30">
             Featured Story
           </span>
           <span className="px-5 py-2 rounded-xl bg-white/5 backdrop-blur-md text-white/60 border border-white/10 text-[9px] font-black uppercase tracking-[0.2em]">
             {post.categoryName || 'Strategy'}
           </span>
        </div>

        <div className="space-y-6">
          <h1 className="text-5xl lg:text-8xl font-black text-white tracking-tighter leading-[0.85] group-hover:text-primary-400 transition-colors duration-700">
            {post.title}
          </h1>
          <p className="text-white/50 text-xl lg:text-2xl font-medium max-w-2xl line-clamp-2 leading-relaxed">
            {post.excerpt}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-8 pt-8">
           <Link 
            href={`/blog/${post.slug}`}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-6 px-12 py-6 rounded-3xl bg-white text-gray-900 font-black text-xs uppercase tracking-[0.2em] hover:bg-primary-600 hover:text-white transition-all shadow-2xl active:scale-95 group/btn"
           >
             Read Deep Dive
             <ArrowRight className="h-4 w-4 group-hover/btn:translate-x-3 transition-transform" />
           </Link>

           <div className="flex items-center gap-6 text-[10px] font-black uppercase tracking-[0.2em] text-white/30">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary-500" />
                <span>{readingTime}m Read</span>
              </div>
              <span className="h-1 w-1 rounded-full bg-white/10" />
              <span>{new Date(post.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
           </div>
        </div>
      </div>

      {/* Image Side */}
      <div className="relative lg:w-1/2 h-full overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-r from-gray-900 via-transparent to-transparent z-10 hidden lg:block" />
        <div className="absolute inset-0 bg-linear-to-t from-gray-900 via-transparent to-transparent z-10 lg:hidden" />
        
        {post.featuredImageUrl ? (
          <img 
            src={post.featuredImageUrl} 
            alt={post.title} 
            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full bg-gray-800 flex items-center justify-center">
            <Sparkles className="h-20 w-20 text-gray-700" />
          </div>
        )}
      </div>

      {/* Aesthetic Accents */}
      <div className="absolute top-12 right-12 z-30 hidden lg:block">
         <div className="h-24 w-24 rounded-full border border-white/10 flex items-center justify-center backdrop-blur-sm group-hover:rotate-12 transition-transform duration-1000">
            <span className="text-white/20 text-[8px] font-black uppercase tracking-widest text-center">DreamBees<br/>Editorial</span>
         </div>
      </div>
    </div>
  );
}

