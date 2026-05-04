'use client';
import React from 'react';
import { Plus, User, ArrowUpRight, Search, Edit2, Trash2, Sparkles, NotebookPen, TrendingUp, Clock } from 'lucide-react';
import Link from 'next/link';
import type { DashboardState } from '../types';
import type { KnowledgebaseArticle } from '@domain/models';

export const BlogTable: React.FC<Pick<DashboardState, 
  'posts' | 'loading' | 'selectedPosts' | 'toggleSelect' | 'toggleSelectAll' | 'handleIndividualDelete' | 'searchQuery' | 'setCurrentTab' | 'setSearchQuery'
>> = ({ 
  posts, loading, selectedPosts, toggleSelect, toggleSelectAll, handleIndividualDelete, searchQuery, setCurrentTab, setSearchQuery
}) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse min-w-[1100px]">
        <thead>
          <tr className="bg-gray-50/50">
            <th className="px-8 py-4 w-12">
               <button 
                onClick={toggleSelectAll}
                className={`h-5 w-5 rounded-md border-2 transition-all flex items-center justify-center ${
                  selectedPosts.length === posts.length && posts.length > 0 
                    ? 'bg-primary-600 border-primary-600' : 'border-gray-200 bg-white'
                }`}
               >
                 {selectedPosts.length === posts.length && posts.length > 0 && <Plus className="h-3 w-3 text-white rotate-45" />}
               </button>
            </th>
            <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Content Detail</th>
            <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Lifecycle</th>
            <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Performance</th>
            <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Health Index</th>
            <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Orchestration</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50/50">
          {loading ? (
            [...Array(5)].map((_, i) => (
              <tr key={i} className="animate-pulse">
                <td colSpan={6} className="px-8 py-8">
                  <div className="h-16 bg-gray-50/50 rounded-3xl" />
                </td>
              </tr>
            ))
          ) : posts.map((post: KnowledgebaseArticle) => {
            const isSelected = selectedPosts.includes(post.id);
            const hasSEO = !!post.metaTitle && !!post.metaDescription;
            const isTopPerforming = (post.viewCount || 0) > 1000;
            
            return (
              <tr key={post.id} className={`group hover:bg-white transition-all ${isSelected ? 'bg-primary-50/30' : ''}`}>
                <td className="px-8 py-8">
                   <button 
                    onClick={() => toggleSelect(post.id)}
                    className={`h-5 w-5 rounded-md border-2 transition-all flex items-center justify-center ${
                      isSelected ? 'bg-primary-600 border-primary-600 shadow-sm' : 'border-gray-100 bg-white group-hover:border-gray-300'
                    }`}
                   >
                     {isSelected && <Plus className="h-3 w-3 text-white rotate-45" />}
                   </button>
                </td>
                <td className="px-8 py-8">
                  <div className="flex items-center gap-6">
                    <div className="h-16 w-16 rounded-2xl bg-gray-50 overflow-hidden shrink-0 border border-gray-100 group-hover:scale-105 group-hover:shadow-lg transition-all duration-500">
                      {post.featuredImageUrl ? (
                        <img src={post.featuredImageUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-200 bg-white">
                          <Sparkles className="h-6 w-6" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <Link href={`/blog/${post.slug}`} target="_blank" className="text-sm font-black text-gray-900 hover:text-primary-600 flex items-center gap-2 truncate max-w-md transition-colors">
                          {post.title}
                          <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </Link>
                        {isTopPerforming && (
                          <span className="flex items-center gap-1 text-[8px] font-black uppercase tracking-[0.1em] text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                            <TrendingUp className="h-2 w-2" />
                            Hot
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black uppercase tracking-[0.1em] text-primary-500/60 bg-primary-50 px-2 py-0.5 rounded-md">{post.categoryName || 'Journal'}</span>
                        <span className="h-1 w-1 rounded-full bg-gray-200" />
                        <div className="flex items-center gap-1.5">
                           <div className="h-4 w-4 rounded-full bg-primary-100 flex items-center justify-center">
                              <User className="h-2 w-2 text-primary-600" />
                           </div>
                           <span className="text-[10px] font-bold text-gray-400">{post.authorName || 'Staff'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-8">
                  <div className="flex flex-col gap-2">
                    <span className={`px-4 py-2 rounded-2xl text-[9px] font-black uppercase tracking-[0.15em] w-fit border shadow-sm ${
                      post.status === 'published' ? 'bg-green-50/50 text-green-600 border-green-100' : 
                      post.status === 'scheduled' ? 'bg-blue-50/50 text-blue-600 border-blue-100' : 
                      'bg-amber-50/50 text-amber-600 border-amber-100'
                    }`}>
                      {post.status}
                    </span>
                    {post.status === 'scheduled' && post.scheduledAt && (
                      <div className="flex items-center gap-1.5 text-[9px] font-bold text-blue-500/70 ml-1">
                        <Clock className="h-3 w-3" />
                        {new Date(post.scheduledAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-8 py-8">
                  <div className="flex items-center gap-8">
                    <div className="flex flex-col">
                      <span className="text-[8px] font-black text-gray-300 uppercase tracking-widest mb-1">Impact</span>
                      <span className="text-sm font-black text-gray-900 tabular-nums">{(post.viewCount || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[8px] font-black text-gray-300 uppercase tracking-widest mb-1">Engagement</span>
                      <span className="text-sm font-black text-gray-900 tabular-nums">{post.helpfulCount || 0}</span>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-8">
                   <div className="flex items-center gap-4">
                      <div className={`px-4 py-2 rounded-2xl flex items-center gap-3 border transition-all ${
                        hasSEO 
                          ? 'bg-primary-50/50 text-primary-600 border-primary-100 group-hover:bg-primary-600 group-hover:text-white' 
                          : 'bg-gray-50/50 text-gray-400 border-gray-100 group-hover:border-amber-200 group-hover:text-amber-600'
                      }`}>
                         {hasSEO ? <Sparkles className="h-3 w-3" /> : <Search className="h-3 w-3" />}
                         <span className="text-[9px] font-black uppercase tracking-widest">{hasSEO ? 'Optimized' : 'Needs SEO'}</span>
                      </div>
                   </div>
                </td>
                <td className="px-8 py-8 text-right">
                  <div className="flex items-center justify-end gap-3">
                    <Link 
                      href={`/admin/blog/${post.id}`}
                      className="h-11 w-11 rounded-2xl bg-white border border-gray-100 flex items-center justify-center text-gray-400 hover:bg-primary-600 hover:text-white hover:border-primary-600 hover:shadow-lg hover:shadow-primary-600/20 transition-all active:scale-90"
                      title="Edit Story"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Link>
                    <button 
                      onClick={() => handleIndividualDelete(post.id)}
                      className="h-11 w-11 rounded-2xl bg-white border border-gray-100 flex items-center justify-center text-gray-400 hover:bg-rose-600 hover:text-white hover:border-rose-600 hover:shadow-lg hover:shadow-rose-600/20 transition-all active:scale-90"
                      title="Delete Forever"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      
      {!loading && posts.length === 0 && (
        <div className="py-40 text-center space-y-8 bg-gray-50/30 border-t border-gray-100 animate-in fade-in duration-700">
          <div className="h-28 w-28 rounded-4xl bg-white border border-gray-100 flex items-center justify-center mx-auto shadow-sm">
            <NotebookPen className="h-12 w-12 text-gray-100" />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-black text-gray-900">Quiet in the editorial hub</h3>
            <p className="text-gray-500 font-medium max-w-sm mx-auto">No stories match your current filters. Try resetting to see the full catalog.</p>
          </div>
          <button 
            onClick={() => { setSearchQuery(''); setCurrentTab('all'); }}
            className="px-8 py-4 bg-white border border-gray-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-primary-600 hover:bg-primary-50 transition-all shadow-sm"
          >
            Reset Filters
          </button>
        </div>
      )}
    </div>
  );
};
