'use client';
import React from 'react';
import { Search, Type, Image as ImageIcon, Sparkles } from 'lucide-react';
import type { DashboardState } from '../types';
import type { KnowledgebaseArticle } from '@domain/models';

export const AuditPanel: React.FC<Pick<DashboardState, 'healthAudit' | 'setSelectedPosts'>> = ({ healthAudit, setSelectedPosts }) => {
  return (
    <div className="p-10 bg-primary-50/20 border-b border-primary-50 animate-in slide-in-from-top-4 duration-500">
       <div className="flex flex-col lg:flex-row gap-12 items-start">
          {/* Global Score Card */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-primary-100 shadow-xl shadow-primary-600/5 flex items-center gap-8 min-w-[300px]">
             <div className="relative h-20 w-20 flex items-center justify-center">
                <svg className="h-full w-full -rotate-90">
                   <circle cx="40" cy="40" r="36" fill="transparent" stroke="#f1f5f9" strokeWidth="8" />
                   <circle 
                    cx="40" cy="40" r="36" fill="transparent" stroke="currentColor" strokeWidth="8" 
                    strokeDasharray={`${2 * Math.PI * 36}`} 
                    strokeDashoffset={`${2 * Math.PI * 36 * (1 - healthAudit.score / 100)}`}
                    className="text-primary-600 transition-all duration-1000"
                   />
                </svg>
                <span className="absolute text-xl font-black text-gray-900">{healthAudit.score}%</span>
             </div>
             <div>
                <h4 className="text-[10px] font-black uppercase tracking-widest text-primary-600 mb-1">Health Index</h4>
                <p className="text-sm font-black text-gray-900">Overall Optimization</p>
                <p className="text-[10px] text-gray-500 font-medium mt-1">Industrial standard: 90%+</p>
             </div>
          </div>

          <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-12">
             <div className="space-y-4 group">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-primary-600 flex items-center gap-2">
                  <Search className="h-3.5 w-3.5" /> SEO Vitals ({healthAudit.lowSEO.length})
                </h4>
                <p className="text-[11px] text-gray-500 font-medium leading-relaxed">Entries missing meta data. These are harder for collectors to find in the wild.</p>
                <button onClick={() => setSelectedPosts(healthAudit.lowSEO.map((p: KnowledgebaseArticle) => p.id))} className="text-[10px] font-black uppercase tracking-widest text-gray-900 hover:text-primary-600 hover:underline transition-colors flex items-center gap-2">
                   Select Vulnerable Posts <Sparkles className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-all" />
                </button>
             </div>
             <div className="space-y-4 group">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-primary-600 flex items-center gap-2">
                  <Type className="h-3.5 w-3.5" /> Content Depth ({healthAudit.lowWordCount.length})
                </h4>
                <p className="text-[11px] text-gray-500 font-medium leading-relaxed">Short entries under 300 words. Industry leaders recommend 500+ for authority.</p>
                <button onClick={() => setSelectedPosts(healthAudit.lowWordCount.map((p: KnowledgebaseArticle) => p.id))} className="text-[10px] font-black uppercase tracking-widest text-gray-900 hover:text-primary-600 hover:underline transition-colors flex items-center gap-2">
                   Select Thin Content <Sparkles className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-all" />
                </button>
             </div>
             <div className="space-y-4 group">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-primary-600 flex items-center gap-2">
                  <ImageIcon className="h-3.5 w-3.5" /> Visual Impact ({healthAudit.missingImages.length})
                </h4>
                <p className="text-[11px] text-gray-500 font-medium leading-relaxed">Posts missing a featured image. These have lower social click rates.</p>
                <button onClick={() => setSelectedPosts(healthAudit.missingImages.map((p: KnowledgebaseArticle) => p.id))} className="text-[10px] font-black uppercase tracking-widest text-gray-900 hover:text-primary-600 hover:underline transition-colors flex items-center gap-2">
                   Select Missing Media <Sparkles className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-all" />
                </button>
             </div>
          </div>
       </div>
    </div>
  );
};
