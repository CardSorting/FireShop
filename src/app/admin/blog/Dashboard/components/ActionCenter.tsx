'use client';
import React from 'react';
import { 
  Sparkles, 
  ArrowRight, 
  AlertCircle, 
  FileEdit, 
  Image as ImageIcon,
  Search
} from 'lucide-react';
import type { DashboardState } from '../types';

export const ActionCenter: React.FC<Pick<DashboardState, 'healthAudit' | 'posts'>> = ({ healthAudit, posts }) => {
  const drafts = posts.filter(p => p.status === 'draft').length;
  
  const actions = [
    {
      id: 'drafts',
      label: 'Editorial Queue',
      value: `${drafts} Drafts`,
      description: 'Pending review or completion',
      icon: FileEdit,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      urgent: drafts > 5
    },
    {
      id: 'seo',
      label: 'SEO Boost',
      value: `${healthAudit.lowSEO.length} Items`,
      description: 'Missing meta titles/descriptions',
      icon: Search,
      color: 'text-primary-600',
      bg: 'bg-primary-50',
      urgent: healthAudit.lowSEO.length > 0
    },
    {
      id: 'media',
      label: 'Media Check',
      value: `${healthAudit.missingImages.length} Issues`,
      description: 'Missing featured images',
      icon: ImageIcon,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
      urgent: healthAudit.missingImages.length > 0
    },
    {
      id: 'thin',
      label: 'Value Audit',
      value: `${healthAudit.lowWordCount.length} Posts`,
      description: 'Content under 300 words',
      icon: AlertCircle,
      color: 'text-rose-600',
      bg: 'bg-rose-50',
      urgent: healthAudit.lowWordCount.length > 2
    }
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
          <Sparkles className="h-3 w-3 text-primary-600" />
          Editorial Priority
        </h3>
        <span className="text-[10px] font-bold text-primary-600 bg-primary-50 px-2 py-1 rounded-full animate-pulse">
          {actions.filter(a => a.urgent).length} Actions Needed
        </span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {actions.map((action) => (
          <button 
            key={action.id}
            className="group relative flex flex-col text-left p-5 rounded-3xl bg-white border border-gray-100 hover:border-primary-200 hover:shadow-xl hover:shadow-primary-600/5 transition-all overflow-hidden"
          >
            <div className={`h-10 w-10 rounded-xl ${action.bg} ${action.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
              <action.icon className="h-5 w-5" />
            </div>
            
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">{action.label}</p>
            <p className="text-lg font-black text-gray-900 leading-tight">{action.value}</p>
            <p className="text-[10px] font-medium text-gray-500 mt-1 opacity-70">{action.description}</p>
            
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <ArrowRight className="h-4 w-4 text-primary-600" />
            </div>
            
            {action.urgent && (
              <div className="absolute top-0 right-0 w-8 h-8 flex items-center justify-center overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-rose-500/10 rotate-45 translate-x-8 -translate-y-8" />
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};
