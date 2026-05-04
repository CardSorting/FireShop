'use client';
import React from 'react';
import Link from 'next/link';
import { TrendingUp, ArrowRight, Clock } from 'lucide-react';
import type { KnowledgebaseArticle } from '@domain/models';

interface TrendingSectionProps {
  posts: KnowledgebaseArticle[];
}

export function TrendingSection({ posts }: TrendingSectionProps) {
  return (
    <section className="space-y-12">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-primary-100 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-primary-600" />
            </div>
            <h2 className="text-sm font-black uppercase tracking-[0.2em] text-gray-400">
              Popular in the Hive
            </h2>
          </div>
          <p className="text-2xl font-black text-gray-900 tracking-tight">
            Trending Today
          </p>
        </div>
        <Link 
          href="/blog?sort=popular" 
          className="group flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-primary-600 transition-all"
        >
          View Leaderboard
          <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {posts.map((post, index) => {
          const readingTime = Math.ceil((post.content?.split(' ').length || 0) / 200);
          return (
            <Link 
              key={post.id} 
              href={`/blog/${post.slug}`}
              className="group relative flex flex-col p-8 rounded-[2.5rem] bg-white border border-gray-100 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-500"
            >
              <div className="absolute top-0 right-0 p-8">
                <span className="text-5xl font-black text-gray-50 group-hover:text-primary-50 transition-colors tabular-nums">
                  {String(index + 1).padStart(2, '0')}
                </span>
              </div>

              <div className="relative z-10 space-y-6">
                <div className="space-y-4">
                  <span className="inline-block px-3 py-1 rounded-lg bg-gray-50 text-[10px] font-black uppercase tracking-widest text-gray-400">
                    {post.categoryName}
                  </span>
                  <h3 className="text-xl font-black text-gray-900 leading-tight group-hover:text-primary-600 transition-colors line-clamp-2">
                    {post.title}
                  </h3>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                      <img 
                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${post.authorName || 'Staff'}`} 
                        alt="Author" 
                        className="h-full w-full rounded-full"
                      />
                    </div>
                    <span className="text-[10px] font-bold text-gray-900">{post.authorName || 'Staff'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-gray-300">
                    <Clock className="h-3 w-3" />
                    <span>{readingTime}m</span>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
