import React from 'react';
import { Plus, Edit2 } from 'lucide-react';
import Link from 'next/link';
import type { DashboardState } from '../types';
import type { KnowledgebaseArticle } from '@domain/models';

export const KanbanBoard: React.FC<Pick<DashboardState, 'posts'>> = ({ posts }) => {
  const statuses = ['draft', 'review', 'scheduled', 'published'] as const;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {statuses.map(status => (
        <div key={status} className="space-y-6">
           <div className="flex items-center justify-between px-2">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-900 flex items-center gap-2">
                {status} <span className="h-5 w-5 rounded-full bg-gray-100 flex items-center justify-center text-[8px] text-gray-400">{posts.filter((p: KnowledgebaseArticle) => p.status === status).length}</span>
              </h3>
              <Plus className="h-3 w-3 text-gray-300 hover:text-gray-900 cursor-pointer" />
           </div>
           <div className="space-y-4 min-h-[500px] p-4 bg-gray-50/50 rounded-[2.5rem] border border-dashed border-gray-100">
              {posts.filter((p: KnowledgebaseArticle) => p.status === status).map((post: KnowledgebaseArticle) => (
                <div key={post.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all group">
                   <div className="flex items-start justify-between gap-4">
                      <h4 className="text-xs font-black text-gray-900 line-clamp-2 leading-tight">{post.title}</h4>
                      <Link href={`/admin/blog/${post.id}`} className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <Edit2 className="h-3 w-3 text-gray-400 hover:text-primary-600" />
                      </Link>
                   </div>
                   <p className="text-[10px] text-gray-400 mt-2 line-clamp-2 font-medium">{post.excerpt}</p>
                   <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-50">
                      <div className="flex items-center gap-2">
                         <div className="h-5 w-5 rounded-full bg-primary-100 flex items-center justify-center text-[8px] font-black text-primary-600">
                           {post.authorName?.[0]}
                         </div>
                         <span className="text-[9px] font-bold text-gray-400">{post.authorName}</span>
                      </div>
                      <span className="text-[9px] font-black text-gray-300">{new Date(post.updatedAt).toLocaleDateString()}</span>
                   </div>
                </div>
              ))}
           </div>
        </div>
      ))}
    </div>
  );
};
