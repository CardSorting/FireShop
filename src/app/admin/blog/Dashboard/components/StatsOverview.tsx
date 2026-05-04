import React from 'react';
import { NotebookPen, CheckCircle2, Eye, Calendar } from 'lucide-react';
import type { DashboardState } from '../types';
import type { KnowledgebaseArticle } from '@domain/models';

export const StatsOverview: React.FC<Pick<DashboardState, 'posts'>> = ({ posts }) => {
  const stats = [
    { label: 'Total Posts', value: posts.length, icon: NotebookPen, color: 'text-gray-900', bg: 'bg-gray-50' },
    { label: 'Published', value: posts.filter((p: KnowledgebaseArticle) => p.status === 'published').length, icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Views', value: posts.reduce((acc: number, p: KnowledgebaseArticle) => acc + (p.viewCount || 0), 0), icon: Eye, color: 'text-primary-600', bg: 'bg-primary-50' },
    { label: 'Scheduled', value: posts.filter((p: KnowledgebaseArticle) => p.status === 'scheduled').length, icon: Calendar, color: 'text-blue-600', bg: 'bg-blue-50' },
  ];

  return (
    <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, i) => (
        <div key={i} className="bg-white p-8 rounded-4xl border border-gray-100 shadow-sm flex items-center gap-6 group hover:border-primary-100 transition-all">
           <div className={`h-14 w-14 rounded-2xl ${stat.bg} flex items-center justify-center ${stat.color} group-hover:scale-110 transition-transform`}>
             <stat.icon className="h-6 w-6" />
           </div>
           <div>
             <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{stat.label}</p>
             <p className="text-2xl font-black text-gray-900">{stat.value.toLocaleString()}</p>
           </div>
        </div>
      ))}
    </div>
  );
};
