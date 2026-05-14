'use client';
import React, { useState, useEffect } from 'react';
import { useServices } from '@ui/hooks/useServices';

import { 
  MessageSquare, Check, X, Trash2, 
  User, Calendar, ExternalLink, ShieldCheck,
  AlertTriangle, Loader2, Search
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { sanitizeImageUrl } from '@utils/sanitizer';
import type { BlogComment } from '@domain/models';

export default function CommentModerationPage() {
  const services = useServices();
  const [comments, setComments] = useState<BlogComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'published' | 'spam'>('all');

  useEffect(() => {
    async function loadComments() {
      try {
        // Since we don't have a getRecentComments across all posts, 
        // we'll either need to add it or fetch all posts and then their comments.
        // For production, I'll add getRecentComments to the repository.
        const response = await fetch('/api/admin/blog/comments');
        const data = await response.json();
        setComments(data);
      } catch (err) {
        console.error('Failed to load comments', err);
      } finally {
        setLoading(false);
      }
    }
    void loadComments();
  }, []);

  const handleUpdateStatus = async (commentId: string, status: 'published' | 'spam') => {
    try {
      await fetch(`/api/admin/blog/comments/${commentId}/status`, {
        method: 'POST',
        body: JSON.stringify({ status })
      });
      setComments(comments.map(c => c.id === commentId ? { ...c, status } : c));
    } catch (err) {
      console.error('Failed to update status', err);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;
    try {
      await fetch(`/api/admin/blog/comments/${commentId}`, { method: 'DELETE' });
      setComments(comments.filter(c => c.id !== commentId));
    } catch (err) {
      console.error('Failed to delete comment', err);
    }
  };

  const filteredComments = comments.filter(c => filter === 'all' || c.status === filter);

  return (
    <div className="p-8 space-y-10 animate-in fade-in duration-500">
      <div>
        <h1 className="text-4xl font-black text-gray-900 tracking-tight flex items-center gap-4">
          <MessageSquare className="h-10 w-10 text-primary-600" />
          Comment Moderation
        </h1>
        <p className="text-gray-500 font-medium mt-2">Manage reader engagement and keep your community safe.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Pending Review', value: comments.filter(c => c.status === 'pending').length, icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Published', value: comments.filter(c => c.status === 'published').length, icon: ShieldCheck, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Spam Blocked', value: comments.filter(c => c.status === 'spam').length, icon: X, color: 'text-red-600', bg: 'bg-red-50' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-6">
             <div className={`h-14 w-14 rounded-2xl ${stat.bg} flex items-center justify-center ${stat.color}`}>
               <stat.icon className="h-6 w-6" />
             </div>
             <div>
               <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{stat.label}</p>
               <p className="text-2xl font-black text-gray-900">{stat.value}</p>
             </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 p-2 bg-white rounded-2xl border border-gray-100 w-fit">
         {(['all', 'pending', 'published', 'spam'] as const).map(f => (
           <button 
            key={f}
            onClick={() => setFilter(f)}
            className={`px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${
              filter === f ? 'bg-gray-900 text-white shadow-lg' : 'text-gray-400 hover:text-gray-900'
            }`}
           >
             {f}
           </button>
         ))}
      </div>

      {/* Comments List */}
      <div className="space-y-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-40 gap-4">
             <Loader2 className="h-10 w-10 animate-spin text-primary-600" />
             <p className="text-sm font-black uppercase tracking-widest text-gray-400">Fetching conversations...</p>
          </div>
        ) : filteredComments.length > 0 ? (
          filteredComments.map(comment => (
            <div key={comment.id} className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm hover:shadow-xl transition-all group">
               <div className="flex flex-col md:flex-row gap-8">
                  <div className="shrink-0 relative">
                     {comment.userAvatar ? (
                       <Image 
                         src={sanitizeImageUrl(comment.userAvatar)} 
                         alt="" 
                         width={56}
                         height={56}
                         className="h-14 w-14 rounded-2xl object-cover" 
                       />
                     ) : (
                       <div className="h-14 w-14 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-300">
                         <User className="h-6 w-6" />
                       </div>
                     )}
                  </div>
                  
                  <div className="flex-1 space-y-4">
                     <div className="flex items-center justify-between">
                        <div>
                           <div className="flex items-center gap-3">
                             <span className="text-sm font-black text-gray-900">{comment.userName}</span>
                             <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                               comment.status === 'published' ? 'bg-green-50 text-green-600' : 
                               comment.status === 'spam' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'
                             }`}>
                               {comment.status}
                             </span>
                           </div>
                           <div className="flex items-center gap-4 text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-widest">
                              <span className="flex items-center gap-1.5"><Calendar className="h-3 w-3" /> {new Date(comment.createdAt).toLocaleString()}</span>
                              <div className="flex items-center gap-1.5 text-primary-600">
                                <MessageSquare className="h-3 w-3" /> {comment.postTitle || 'Untitled Post'}
                              </div>
                           </div>

                        </div>
                        
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                           {comment.status !== 'published' && (
                             <button 
                              onClick={() => handleUpdateStatus(comment.id, 'published')}
                              className="h-10 px-4 rounded-xl bg-green-50 text-green-600 font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-green-100"
                             >
                               <Check className="h-4 w-4" /> Approve
                             </button>
                           )}
                           {comment.status !== 'spam' && (
                             <button 
                              onClick={() => handleUpdateStatus(comment.id, 'spam')}
                              className="h-10 px-4 rounded-xl bg-red-50 text-red-600 font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-red-100"
                             >
                               <X className="h-4 w-4" /> Mark Spam
                             </button>
                           )}
                           <button 
                            onClick={() => handleDelete(comment.id)}
                            className="h-10 w-10 rounded-xl bg-gray-50 text-gray-400 flex items-center justify-center hover:bg-red-50 hover:text-red-500"
                           >
                             <Trash2 className="h-4 w-4" />
                           </button>
                        </div>
                     </div>
                     
                     <div className="bg-gray-50/50 rounded-3xl p-6 border border-transparent group-hover:border-gray-100 transition-all">
                        <p className="text-gray-600 font-medium leading-relaxed">{comment.content}</p>
                     </div>
                  </div>
               </div>
            </div>
          ))
        ) : (
          <div className="py-40 text-center space-y-6 bg-gray-50 rounded-[4rem] border border-dashed border-gray-200">
             <MessageSquare className="h-16 w-16 text-gray-200 mx-auto" />
             <h3 className="text-xl font-black text-gray-900">All clear!</h3>
             <p className="text-gray-500 font-medium">No comments match your current filter.</p>
          </div>
        )}
      </div>
    </div>
  );
}
