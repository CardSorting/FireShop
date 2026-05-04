'use client';
import React from 'react';
import { Calendar as CalendarIcon, Clock, ChevronRight } from 'lucide-react';
import type { KnowledgebaseArticle } from '@domain/models';

interface CalendarViewProps {
  posts: KnowledgebaseArticle[];
}

export const CalendarView: React.FC<CalendarViewProps> = ({ posts }) => {
  const scheduledPosts = posts
    .filter(p => p.status === 'scheduled' && p.scheduledAt)
    .sort((a, b) => new Date(a.scheduledAt!).getTime() - new Date(b.scheduledAt!).getTime());

  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  
  // Group by date
  const grouped = scheduledPosts.reduce((acc, post) => {
    const date = new Date(post.scheduledAt!);
    const key = `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(post);
    return acc;
  }, {} as Record<string, KnowledgebaseArticle[]>);

  return (
    <div className="p-8 space-y-12">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-black text-gray-900 flex items-center gap-3">
          <CalendarIcon className="h-6 w-6 text-primary-600" />
          Editorial Roadmap
        </h3>
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
          {scheduledPosts.length} Upcoming Publications
        </p>
      </div>

      {scheduledPosts.length === 0 ? (
        <div className="py-20 text-center border-2 border-dashed border-gray-100 rounded-[3rem] space-y-4">
           <div className="h-20 w-20 rounded-full bg-gray-50 flex items-center justify-center mx-auto text-gray-200">
             <Clock className="h-10 w-10" />
           </div>
           <p className="text-sm font-bold text-gray-500">No posts currently scheduled for future release.</p>
        </div>
      ) : (
        <div className="space-y-12">
          {Object.entries(grouped).map(([date, items]) => (
            <div key={date} className="relative pl-8 border-l-2 border-gray-50 space-y-6">
              <div className="absolute left-[-9px] top-0 h-4 w-4 rounded-full bg-primary-600 ring-4 ring-white shadow-sm shadow-primary-600/20" />
              
              <h4 className="text-xs font-black uppercase tracking-[0.2em] text-primary-600">{date}</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {items.map((post) => (
                  <div key={post.id} className="group p-6 rounded-3xl bg-white border border-gray-100 hover:border-primary-200 hover:shadow-xl hover:shadow-primary-600/5 transition-all">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="h-10 w-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center">
                        <Clock className="h-5 w-5" />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-gray-900">
                        {new Date(post.scheduledAt!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    
                    <h5 className="text-sm font-black text-gray-900 group-hover:text-primary-600 transition-colors mb-2 line-clamp-2">{post.title}</h5>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-6">{post.categoryName || 'Journal'}</p>
                    
                    <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                       <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full bg-gray-100 border border-white" />
                          <span className="text-[10px] font-bold text-gray-500">{post.authorName || 'Staff'}</span>
                       </div>
                       <ChevronRight className="h-4 w-4 text-gray-300 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
