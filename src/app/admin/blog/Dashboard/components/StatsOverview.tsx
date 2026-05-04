'use client';
import React from 'react';
import { NotebookPen, CheckCircle2, Eye, Calendar, TrendingUp } from 'lucide-react';
import type { DashboardState } from '../types';
import type { KnowledgebaseArticle } from '@domain/models';

export const StatsOverview: React.FC<Pick<DashboardState, 'posts'>> = ({ posts }) => {
  const stats = [
    { label: 'Total Stories', value: posts.length, icon: NotebookPen, color: 'text-gray-900', bg: 'bg-gray-50', trend: '+12%' },
    { label: 'Live Entries', value: posts.filter((p: KnowledgebaseArticle) => p.status === 'published').length, icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50', trend: '+5%' },
    { label: 'Total Reach', value: posts.reduce((acc: number, p: KnowledgebaseArticle) => acc + (p.viewCount || 0), 0), icon: Eye, color: 'text-primary-600', bg: 'bg-primary-50', trend: '+28%' },
    { label: 'Roadmap', value: posts.filter((p: KnowledgebaseArticle) => p.status === 'scheduled').length, icon: Calendar, color: 'text-blue-600', bg: 'bg-blue-50', trend: 'Stable' },
  ];

  return (
    <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, i) => (
        <div key={i} className="bg-white p-8 rounded-4xl border border-gray-100 shadow-sm flex flex-col gap-6 group hover:border-primary-100 transition-all">
           <div className="flex items-center justify-between w-full">
              <div className={`h-12 w-12 rounded-xl ${stat.bg} flex items-center justify-center ${stat.color} group-hover:scale-110 transition-transform`}>
                <stat.icon className="h-5 w-5" />
              </div>
              <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-green-50 text-green-600 text-[9px] font-black uppercase tracking-tight">
                <TrendingUp className="h-3 w-3" />
                {stat.trend}
              </div>
           </div>
           <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">{stat.label}</p>
              <p className="text-3xl font-black text-gray-900 tabular-nums tracking-tight">{stat.value.toLocaleString()}</p>
           </div>
        </div>
      ))}
    </div>
  );
};
