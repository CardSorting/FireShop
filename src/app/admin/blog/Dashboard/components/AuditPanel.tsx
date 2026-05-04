import React from 'react';
import { Search, Type, Image as ImageIcon } from 'lucide-react';
import type { DashboardState } from '../types';
import type { KnowledgebaseArticle } from '@domain/models';

export const AuditPanel: React.FC<Pick<DashboardState, 'healthAudit' | 'setSelectedPosts'>> = ({ healthAudit, setSelectedPosts }) => {
  return (
    <div className="p-8 bg-primary-50/30 border-b border-primary-50 animate-in slide-in-from-top-4 duration-500">
       <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-4">
             <h4 className="text-[10px] font-black uppercase tracking-widest text-primary-600 flex items-center gap-2">
               <Search className="h-3 w-3" /> SEO Optimization ({healthAudit.lowSEO.length})
             </h4>
             <p className="text-xs text-gray-500 font-medium leading-relaxed">Entries missing meta titles or descriptions. These are harder for collectors to find via search.</p>
             <button onClick={() => setSelectedPosts(healthAudit.lowSEO.map((p: KnowledgebaseArticle) => p.id))} className="text-[10px] font-black uppercase tracking-widest text-gray-900 hover:underline">Select All</button>
          </div>
          <div className="space-y-4">
             <h4 className="text-[10px] font-black uppercase tracking-widest text-primary-600 flex items-center gap-2">
               <Type className="h-3 w-3" /> Thin Content ({healthAudit.lowWordCount.length})
             </h4>
             <p className="text-xs text-gray-500 font-medium leading-relaxed">Posts under 300 words. Industry standards suggest longer articles perform better for authority.</p>
             <button onClick={() => setSelectedPosts(healthAudit.lowWordCount.map((p: KnowledgebaseArticle) => p.id))} className="text-[10px] font-black uppercase tracking-widest text-gray-900 hover:underline">Select All</button>
          </div>
          <div className="space-y-4">
             <h4 className="text-[10px] font-black uppercase tracking-widest text-primary-600 flex items-center gap-2">
               <ImageIcon className="h-3 w-3" /> Missing Media ({healthAudit.missingImages.length})
             </h4>
             <p className="text-xs text-gray-500 font-medium leading-relaxed">Posts without a featured image. These have significantly lower click-through rates on social cards.</p>
             <button onClick={() => setSelectedPosts(healthAudit.missingImages.map((p: KnowledgebaseArticle) => p.id))} className="text-[10px] font-black uppercase tracking-widest text-gray-900 hover:underline">Select All</button>
          </div>
       </div>
    </div>
  );
};

