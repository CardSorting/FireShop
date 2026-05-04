'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { useServices } from '@ui/hooks/useServices';

import { 
  Plus, Search, Filter, MoreHorizontal, 
  Eye, MessageSquare, Calendar, User,
  Edit2, Trash2, CheckCircle2, CircleDashed,
  Sparkles, NotebookPen, ArrowUpRight, Type, Image as ImageIcon
} from 'lucide-react';
import Link from 'next/link';
import type { KnowledgebaseArticle, Author } from '@domain/models';

export default function AdminBlogPage() {
  const services = useServices();
  const [posts, setPosts] = useState<KnowledgebaseArticle[]>([]);
  const [authors, setAuthors] = useState<Author[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentTab, setCurrentTab] = useState<'all' | 'published' | 'scheduled' | 'draft'>('all');
  const [selectedPosts, setSelectedPosts] = useState<string[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const [postsData, authorsData] = await Promise.all([
          services.knowledgebaseService.getArticles({ status: 'all' }),
          services.knowledgebaseService.getAuthors()
        ]);
        setPosts(postsData);
        setAuthors(authorsData);
      } catch (err) {
        console.error('Failed to load admin blog data', err);
      } finally {
        setLoading(false);
      }
    }
    void loadData();
  }, [services.knowledgebaseService]);

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         post.authorName?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = currentTab === 'all' || post.status === currentTab;
    return matchesSearch && matchesTab;
  });

  const toggleSelectAll = () => {
    if (selectedPosts.length === filteredPosts.length) {
      setSelectedPosts([]);
    } else {
      setSelectedPosts(filteredPosts.map(p => p.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedPosts(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBulkAction = async (action: 'publish' | 'archived' | 'delete') => {
    if (selectedPosts.length === 0) return;
    
    const confirmMsg = action === 'delete' 
      ? `Are you sure you want to delete ${selectedPosts.length} posts? This cannot be undone.`
      : `Apply '${action}' status to ${selectedPosts.length} posts?`;
      
    if (!window.confirm(confirmMsg)) return;

    setLoading(true);
    try {
      if (action === 'delete') {
        await services.knowledgebaseService.batchDeleteArticles(selectedPosts);
      } else {
        await services.knowledgebaseService.batchUpdateArticles(selectedPosts, { status: action as any });
      }
      
      // Refresh
      const updatedPosts = await services.knowledgebaseService.getArticles({ type: 'blog', status: 'all' });
      setPosts(updatedPosts);
      setSelectedPosts([]);
    } catch (err) {
      console.error(`Bulk ${action} failed:`, err);
      alert(`Failed to perform bulk ${action}.`);
    } finally {
      setLoading(false);
    }
  };

  const handleIndividualDelete = async (id: string) => {
    if (!window.confirm('Delete this entry forever?')) return;
    setLoading(true);
    try {
      await services.knowledgebaseService.batchDeleteArticles([id]);
      const updatedPosts = await services.knowledgebaseService.getArticles({ type: 'blog', status: 'all' });
      setPosts(updatedPosts);
    } catch (err) {
      console.error('Delete failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncScheduling = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/blog/sync-scheduling', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        alert(`Successfully published ${data.publishedCount} scheduled posts.`);
        // Refresh
        const updatedPosts = await services.knowledgebaseService.getArticles({ type: 'blog', status: 'all' });
        setPosts(updatedPosts);
      }
    } catch (err) {
      console.error('Sync failed:', err);
    } finally {
      setLoading(false);
    }
  };

  // Editorial Health Audit
  const healthAudit = useMemo(() => {
    const lowSEO = posts.filter((p: KnowledgebaseArticle) => !p.metaTitle || !p.metaDescription);
    const lowWordCount = posts.filter((p: KnowledgebaseArticle) => (p.content?.split(/\s+/).length || 0) < 300);
    const missingImages = posts.filter((p: KnowledgebaseArticle) => !p.featuredImageUrl);
    return { lowSEO, lowWordCount, missingImages };
  }, [posts]);

  const [showAudit, setShowAudit] = useState(false);

  return (
    <div className="p-8 space-y-10 animate-in fade-in duration-500 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight flex items-center gap-4">
            <NotebookPen className="h-10 w-10 text-primary-600" />
            Journal Dashboard
          </h1>
          <p className="text-gray-500 font-medium mt-2">Manage your editorial calendar and collector engagement.</p>
        </div>
        <div className="flex items-center gap-4">
          <Link 
            href="/admin/blog/subscribers" 
            className="hidden lg:flex items-center gap-3 px-6 py-4 rounded-2xl bg-white border border-gray-100 text-gray-900 font-black text-xs uppercase tracking-widest hover:bg-gray-50 transition-all shadow-sm"
          >
            <User className="h-4 w-4" />
            Subscribers
          </Link>
          <Link 
            href="/admin/blog/new" 
            className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-primary-600 text-white font-black text-xs uppercase tracking-widest hover:bg-primary-700 transition-all shadow-xl shadow-primary-600/20"
          >
            <Plus className="h-4 w-4" />
            Create Entry
          </Link>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-6">
        {[
          { label: 'Total Posts', value: posts.length, icon: NotebookPen, color: 'text-gray-900', bg: 'bg-gray-50' },
          { label: 'Published', value: posts.filter(p => p.status === 'published').length, icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Scheduled', value: posts.filter(p => p.status === 'scheduled').length, icon: Calendar, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Drafts', value: posts.filter(p => p.status === 'draft').length, icon: CircleDashed, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Views', value: posts.reduce((acc, p) => acc + (p.viewCount || 0), 0), icon: Eye, color: 'text-primary-600', bg: 'bg-primary-50' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex items-center gap-6 group hover:border-primary-100 transition-all">
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

      {/* Control Bar */}
      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex flex-col lg:flex-row border-b border-gray-50">
          {/* Tabs */}
          <div className="flex-1 flex overflow-x-auto no-scrollbar">
            {(['all', 'published', 'scheduled', 'draft'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setCurrentTab(tab)}
                className={`px-10 py-6 text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap relative ${
                  currentTab === tab ? 'text-primary-600' : 'text-gray-400 hover:text-gray-900'
                }`}
              >
                {tab}
                {currentTab === tab && (
                  <div className="absolute bottom-0 left-8 right-8 h-1 bg-primary-600 rounded-t-full" />
                )}
              </button>
            ))}
          </div>
          
          {/* Actions */}
          <div className="p-4 flex items-center gap-4 bg-gray-50/50 lg:bg-transparent">
             <div className="relative">
               <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
               <input 
                 type="text" 
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 placeholder="Search entries..."
                 className="h-12 pl-12 pr-6 rounded-xl bg-white border border-gray-100 outline-none font-bold text-xs text-gray-900 focus:border-primary-100 w-64 transition-all"
               />
             </div>
              <button 
                onClick={handleSyncScheduling}
                className="h-12 px-6 rounded-xl bg-white border border-gray-100 text-gray-900 font-black text-[10px] uppercase tracking-widest flex items-center gap-3 hover:bg-gray-50 transition-all"
              >
                <Calendar className="h-4 w-4" />
                Sync
              </button>
              <button 
                onClick={() => setShowAudit(!showAudit)}
                className={`h-12 px-6 rounded-xl border font-black text-[10px] uppercase tracking-widest flex items-center gap-3 transition-all ${
                  showAudit ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-900 border-gray-100 hover:bg-gray-50'
                }`}
              >
                <Sparkles className="h-4 w-4" />
                Audit
              </button>
          </div>
        </div>

        {/* Audit Panel */}
        {showAudit && (
          <div className="p-8 bg-primary-50/30 border-b border-primary-50 animate-in slide-in-from-top-4 duration-500">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="space-y-4">
                   <h4 className="text-[10px] font-black uppercase tracking-widest text-primary-600 flex items-center gap-2">
                     <Search className="h-3 w-3" /> SEO Optimization ({healthAudit.lowSEO.length})
                   </h4>
                   <p className="text-xs text-gray-500 font-medium leading-relaxed">Entries missing meta titles or descriptions. These are harder for collectors to find via search.</p>
                   <button onClick={() => setSelectedPosts(healthAudit.lowSEO.map(p => p.id))} className="text-[10px] font-black uppercase tracking-widest text-gray-900 hover:underline">Select All</button>
                </div>
                <div className="space-y-4">
                   <h4 className="text-[10px] font-black uppercase tracking-widest text-primary-600 flex items-center gap-2">
                     <Type className="h-3 w-3" /> Thin Content ({healthAudit.lowWordCount.length})
                   </h4>
                   <p className="text-xs text-gray-500 font-medium leading-relaxed">Posts under 300 words. Industry standards suggest longer articles perform better for authority.</p>
                   <button onClick={() => setSelectedPosts(healthAudit.lowWordCount.map(p => p.id))} className="text-[10px] font-black uppercase tracking-widest text-gray-900 hover:underline">Select All</button>
                </div>
                <div className="space-y-4">
                   <h4 className="text-[10px] font-black uppercase tracking-widest text-primary-600 flex items-center gap-2">
                     <ImageIcon className="h-3 w-3" /> Missing Media ({healthAudit.missingImages.length})
                   </h4>
                   <p className="text-xs text-gray-500 font-medium leading-relaxed">Posts without a featured image. These have significantly lower click-through rates on social cards.</p>
                   <button onClick={() => setSelectedPosts(healthAudit.missingImages.map(p => p.id))} className="text-[10px] font-black uppercase tracking-widest text-gray-900 hover:underline">Select All</button>
                </div>
             </div>
          </div>
        )}

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-8 py-4 w-12">
                   <button 
                    onClick={toggleSelectAll}
                    className={`h-5 w-5 rounded-md border-2 transition-all flex items-center justify-center ${
                      selectedPosts.length === filteredPosts.length && filteredPosts.length > 0 
                        ? 'bg-primary-600 border-primary-600' : 'border-gray-200 bg-white'
                    }`}
                   >
                     {selectedPosts.length === filteredPosts.length && filteredPosts.length > 0 && <Plus className="h-3 w-3 text-white rotate-45" />}
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
              ) : filteredPosts.map((post) => {
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
          
          {!loading && filteredPosts.length === 0 && (
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
      </div>

      {/* Floating Bulk Action Bar */}
      {selectedPosts.length > 0 && (
        <div className="fixed bottom-12 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-8 py-5 rounded-4xl shadow-2xl flex items-center gap-8 animate-in slide-in-from-bottom-10 duration-500 z-50">
           <div className="flex items-center gap-3 pr-8 border-r border-white/10">
             <span className="h-8 w-8 rounded-full bg-primary-600 flex items-center justify-center text-xs font-black">{selectedPosts.length}</span>
             <span className="text-xs font-bold uppercase tracking-widest">Entries Selected</span>
           </div>
            <div className="flex items-center gap-6">
               <button 
                 onClick={() => handleBulkAction('publish')}
                 className="text-[10px] font-black uppercase tracking-widest hover:text-primary-400 transition-colors"
               >
                 Publish All
               </button>
               <button 
                 onClick={() => handleBulkAction('archived')}
                 className="text-[10px] font-black uppercase tracking-widest hover:text-primary-400 transition-colors"
               >
                 Archive
               </button>
               <button 
                 onClick={() => handleBulkAction('delete')}
                 className="text-[10px] font-black uppercase tracking-widest text-red-400 hover:text-red-300 transition-colors"
               >
                 Delete Forever
               </button>
            </div>
           <button 
            onClick={() => setSelectedPosts([])}
            className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
           >
             <Plus className="h-5 w-5 rotate-45" />
           </button>
        </div>
      )}
    </div>
  );
}
