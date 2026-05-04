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
      <div className="flex items-center gap-4">
        <div className="h-10 w-10 rounded-2xl bg-gray-900 flex items-center justify-center">
          <TrendingUp className="h-5 w-5 text-primary-500" />
        </div>
        <div>
          <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
            Current Velocity
          </h2>
          <p className="text-2xl font-black text-gray-900 tracking-tight">
            Trending on Strategy Hive
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-12">
        {posts.map((post, index) => {
          const readingTime = Math.ceil((post.content?.split(' ').length || 0) / 200);
          return (
            <Link 
              key={post.id} 
              href={`/blog/${post.slug}`}
              className="group flex items-start gap-6"
            >
              <span className="text-4xl font-black text-gray-100 group-hover:text-primary-200 transition-colors tabular-nums shrink-0 pt-1">
                {String(index + 1).padStart(2, '0')}
              </span>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-6 w-6 rounded-lg overflow-hidden ring-2 ring-white shadow-sm">
                    <img 
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${post.authorName || 'Staff'}`} 
                      alt="Author" 
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <span className="text-[10px] font-black text-gray-900 uppercase tracking-widest">{post.authorName || 'Staff'}</span>
                </div>

                <h3 className="text-lg font-black text-gray-900 leading-snug group-hover:text-primary-600 transition-colors line-clamp-2">
                  {post.title}
                </h3>

                <div className="flex items-center gap-3 text-[9px] font-black uppercase tracking-widest text-gray-400">
                  <span>{new Date(post.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                  <span className="h-1 w-1 rounded-full bg-gray-200" />
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3 w-3" />
                    <span>{readingTime} min</span>
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
