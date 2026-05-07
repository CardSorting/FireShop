'use client';
import React from 'react';
import Link from 'next/link';
import { ArrowRight, BookOpen, Clock, Sparkles } from 'lucide-react';
import type { KnowledgebaseArticle } from '@domain/models';

interface FeaturedSeriesProps {
  title: string;
  subtitle: string;
  posts: KnowledgebaseArticle[];
}

export function FeaturedSeries({ title, subtitle, posts }: FeaturedSeriesProps) {
  if (posts.length === 0) return null;

  return (
    <section className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-primary-100 flex items-center justify-center">
              <BookOpen className="h-4 w-4 text-primary-600" />
            </div>
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
              Curated Collection
            </h2>
          </div>
          <div>
            <h3 className="text-4xl font-black text-gray-900 tracking-tight">{title}</h3>
            <p className="text-gray-400 font-medium mt-2">{subtitle}</p>
          </div>
        </div>
        
        <Link 
          href="/blog?category=tcg-strategy"
          className="group flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-primary-600 hover:text-primary-700 transition-all"
        >
          View Full Series
          <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {posts.map((post, index) => {
          const readingTime = Math.ceil((post.content?.split(' ').length || 0) / 200);
          return (
            <Link 
              key={post.id}
              href={`/blog/${post.slug}`}
              className="group relative h-[450px] rounded-[2.5rem] overflow-hidden border border-gray-100 shadow-sm hover:shadow-2xl transition-all duration-500"
            >
              <div className="absolute inset-0 z-0">
                <img 
                  src={post.featuredImageUrl} 
                  alt={post.title} 
                  className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 opacity-40 group-hover:opacity-60"
                />
                <div className="absolute inset-0 bg-linear-to-t from-gray-900 via-gray-900/40 to-transparent" />
              </div>

              <div className="relative z-10 h-full p-8 flex flex-col justify-end space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                     <span className="text-[10px] font-black text-primary-400 uppercase tracking-widest">Part {index + 1}</span>
                     <span className="h-1 w-1 rounded-full bg-white/20" />
                     <div className="flex items-center gap-1.5 text-[8px] font-black uppercase tracking-widest text-white/40">
                        <Clock className="h-3 w-3" />
                        <span>{readingTime}m</span>
                     </div>
                  </div>
                  <h4 className="text-xl font-black text-white leading-tight group-hover:text-primary-400 transition-colors">
                    {post.title}
                  </h4>
                </div>

                <div className="pt-6 border-t border-white/10 flex items-center justify-between">
                   <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-full bg-white/10 flex items-center justify-center">
                        <Sparkles className="h-3 w-3 text-primary-400" />
                      </div>
                      <span className="text-[9px] font-black text-white/60 uppercase tracking-widest">Premium Content</span>
                   </div>
                   <ArrowRight className="h-4 w-4 text-white/40 group-hover:text-white group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
