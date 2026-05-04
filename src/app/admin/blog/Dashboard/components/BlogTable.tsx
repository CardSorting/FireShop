import React from 'react';
import { Plus, User, ArrowUpRight, Search, Edit2, Trash2, Sparkles, NotebookPen } from 'lucide-react';
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
      <table className="w-full text-left border-collapse min-w-[1000px]">
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
            <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Post Detail</th>
            <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Status</th>
            <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Metrics</th>
            <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Optimization</th>
            <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {loading ? (
            [...Array(5)].map((_, i) => (
              <tr key={i} className="animate-pulse">
                <td colSpan={6} className="px-8 py-8">
                  <div className="h-12 bg-gray-50 rounded-2xl" />
                </td>
              </tr>
            ))
          ) : posts.map((post: KnowledgebaseArticle) => {
            const isSelected = selectedPosts.includes(post.id);
            const hasSEO = !!post.metaTitle && !!post.metaDescription;
            
            return (
              <tr key={post.id} className={`group hover:bg-gray-50/80 transition-colors ${isSelected ? 'bg-primary-50/30' : ''}`}>
                <td className="px-8 py-6">
                   <button 
                    onClick={() => toggleSelect(post.id)}
                    className={`h-5 w-5 rounded-md border-2 transition-all flex items-center justify-center ${
                      isSelected ? 'bg-primary-600 border-primary-600' : 'border-gray-100 bg-white group-hover:border-gray-300'
                    }`}
                   >
                     {isSelected && <Plus className="h-3 w-3 text-white rotate-45" />}
                   </button>
                </td>
                <td className="px-8 py-6">
                  <div className="flex items-center gap-6">
                    <div className="h-14 w-14 rounded-2xl bg-gray-100 overflow-hidden shrink-0 border border-gray-100 group-hover:scale-105 transition-transform">
                      {post.featuredImageUrl ? (
                        <img src={post.featuredImageUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300 bg-white">
                          <Sparkles className="h-6 w-6" />
                        </div>
                      )}
                    </div>
                    <div>
                      <Link href={`/blog/${post.slug}`} target="_blank" className="text-sm font-black text-gray-900 hover:text-primary-600 flex items-center gap-2">
                        {post.title}
                        <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </Link>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{post.categoryName || 'Journal'}</span>
                        <span className="h-1 w-1 rounded-full bg-gray-200" />
                        <span className="text-[10px] font-bold text-gray-400 flex items-center gap-1.5"><User className="h-3 w-3" /> {post.authorName || 'Staff'}</span>
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <div className="flex flex-col gap-1.5">
                    <span className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest w-fit border ${
                      post.status === 'published' ? 'bg-green-50 text-green-600 border-green-100' : 
                      post.status === 'scheduled' ? 'bg-blue-50 text-blue-600 border-blue-100' : 
                      'bg-amber-50 text-amber-600 border-amber-100'
                    }`}>
                      {post.status}
                    </span>
                    {post.status === 'scheduled' && post.scheduledAt && (
                      <span className="text-[9px] font-bold text-blue-400 ml-1">
                        {new Date(post.scheduledAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-8 py-6">
                  <div className="flex items-center gap-6">
                    <div className="flex flex-col">
                      <span className="text-[8px] font-black text-gray-300 uppercase tracking-widest">Views</span>
                      <span className="text-xs font-black text-gray-900">{post.viewCount?.toLocaleString() || 0}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[8px] font-black text-gray-300 uppercase tracking-widest">Helpful</span>
                      <span className="text-xs font-black text-gray-900">{post.helpfulCount || 0}</span>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-6">
                   <div className="flex items-center gap-4">
                      <div className={`px-3 py-1.5 rounded-xl flex items-center gap-2 border ${hasSEO ? 'bg-primary-50 text-primary-600 border-primary-100' : 'bg-gray-50 text-gray-400 border-gray-100'}`}>
                         <Search className="h-3 w-3" />
                         <span className="text-[9px] font-black uppercase tracking-widest">{hasSEO ? 'SEO Ready' : 'Low Optimization'}</span>
                      </div>
                   </div>
                </td>
                <td className="px-8 py-6 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Link 
                      href={`/admin/blog/${post.id}`}
                      className="h-10 w-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-gray-400 hover:bg-primary-50 hover:text-primary-600 hover:border-primary-100 transition-all shadow-sm"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Link>
                    <button 
                      onClick={() => handleIndividualDelete(post.id)}
                      className="h-10 w-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-500 hover:border-red-100 transition-all shadow-sm"
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
        <div className="py-32 text-center space-y-6 bg-gray-50/30">
          <div className="h-24 w-24 rounded-full bg-white border border-gray-100 flex items-center justify-center mx-auto shadow-sm">
            <NotebookPen className="h-10 w-10 text-gray-100" />
          </div>
          <div>
            <h3 className="text-xl font-black text-gray-900">No entries in this segment</h3>
            <p className="text-gray-500 font-medium mt-2 max-w-sm mx-auto">Try clearing your search or switching filters to see more stories.</p>
          </div>
          <button 
            onClick={() => { setSearchQuery(''); setCurrentTab('all'); }}
            className="text-[10px] font-black uppercase tracking-widest text-primary-600 hover:underline"
          >
            Clear all filters
          </button>
        </div>
      )}
    </div>
  );
};
