'use client';
import React from 'react';
import { BarChart3, TrendingUp, Eye, MessageSquare, Share2, Search, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import type { KnowledgebaseArticle } from '@domain/models';

interface InsightsViewProps {
  posts: KnowledgebaseArticle[];
}

export function InsightsView({ posts }: InsightsViewProps) {
  const totalViews = posts.reduce((sum, p) => sum + (p.viewCount || 0), 0);
  const avgViews = posts.length > 0 ? Math.round(totalViews / posts.length) : 0;
  
  // Simulated Velocity Data (Real apps would fetch this from an analytics service)
  const velocityData = [45, 52, 38, 65, 48, 59, 72];
  const maxVelocity = Math.max(...velocityData);

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 bg-white rounded-[2.5rem] border border-gray-100 p-10 shadow-sm space-y-10">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-xl font-black text-gray-900 tracking-tight">Content Velocity</h3>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Total reach over the last 7 days</p>
            </div>
            <div className="flex items-center gap-2 text-green-600">
              <TrendingUp className="h-4 w-4" />
              <span className="text-xs font-black uppercase">+12.4%</span>
            </div>
          </div>

          <div className="flex items-end justify-between h-48 gap-4 px-4">
            {velocityData.map((val, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-4">
                <motion.div 
                  initial={{ height: 0 }}
                  animate={{ height: `${(val / maxVelocity) * 100}%` }}
                  transition={{ delay: i * 0.1, duration: 1, ease: "easeOut" }}
                  className="w-full max-w-[40px] bg-primary-50 rounded-t-xl relative group"
                >
                   <div className="absolute inset-0 bg-primary-600 opacity-0 group-hover:opacity-100 transition-opacity rounded-t-xl" />
                </motion.div>
                <span className="text-[8px] font-black uppercase text-gray-300">Day {i + 1}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
          {[
            { label: 'Total Engagement', val: totalViews, icon: Eye, color: 'bg-primary-50 text-primary-600' },
            { label: 'Avg. Read Depth', val: '4.2m', icon: Zap, color: 'bg-yellow-50 text-yellow-600' },
            { label: 'Social Velocity', val: '89', icon: Share2, color: 'bg-indigo-50 text-indigo-600' },
            { label: 'SEO Authority', val: '68/100', icon: Search, color: 'bg-green-50 text-green-600' },
          ].map((stat, i) => (
            <div key={i} className="bg-white rounded-3xl border border-gray-100 p-6 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-4">
                <div className={`h-10 w-10 rounded-2xl flex items-center justify-center ${stat.color}`}>
                  <stat.icon className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{stat.label}</span>
              </div>
              <span className="text-xl font-black text-gray-900">{stat.val}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-gray-100">
          <h3 className="text-xl font-black text-gray-900 tracking-tight">Top Performing Content</h3>
        </div>
        <div className="divide-y divide-gray-100">
          {posts.sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0)).slice(0, 5).map((post, i) => (
            <div key={post.id} className="p-8 flex items-center justify-between hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-6">
                <span className="text-2xl font-black text-gray-100">0{i + 1}</span>
                <div>
                  <h4 className="text-sm font-black text-gray-900">{post.title}</h4>
                  <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mt-1">Slug: {post.slug}</p>
                </div>
              </div>
              <div className="flex items-center gap-12">
                <div className="text-right">
                  <div className="flex items-center justify-end gap-2 text-gray-900 font-black">
                    <Eye className="h-4 w-4 text-gray-400" />
                    {post.viewCount || 0}
                  </div>
                  <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Views</span>
                </div>
                <div className="text-right">
                  <div className="flex items-center justify-end gap-2 text-gray-900 font-black">
                    <MessageSquare className="h-4 w-4 text-gray-400" />
                    {Math.floor((post.viewCount || 0) * 0.05)}
                  </div>
                  <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Comments</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
