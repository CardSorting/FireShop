'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { useServices } from '@ui/hooks/useServices';
import { Plus, User, NotebookPen, Sparkles as SparklesIcon } from 'lucide-react';
import Link from 'next/link';

import type { KnowledgebaseArticle, Author } from '@domain/models';
import type { DashboardTab, DashboardViewMode } from './types';

import { StatsOverview } from './components/StatsOverview';
import { CategoryDistribution } from './components/CategoryDistribution';
import { ControlBar } from './components/ControlBar';
import { AuditPanel } from './components/AuditPanel';
import { KanbanBoard } from './components/KanbanBoard';
import { BlogTable } from './components/BlogTable';
import { StrategyGuide } from './components/StrategyGuide';
import { BulkActionBar } from './components/BulkActionBar';

export default function BlogDashboard() {
  const services = useServices();
  const [posts, setPosts] = useState<KnowledgebaseArticle[]>([]);
  const [authors, setAuthors] = useState<Author[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentTab, setCurrentTab] = useState<DashboardTab>('all');
  const [selectedPosts, setSelectedPosts] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<DashboardViewMode>('table');
  const [showGuide, setShowGuide] = useState(false);
  const [showAudit, setShowAudit] = useState(false);

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

  const filteredPosts = useMemo(() => {
    return posts.filter(post => {
      const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           post.authorName?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTab = currentTab === 'all' || post.status === currentTab;
      return matchesSearch && matchesTab;
    });
  }, [posts, searchQuery, currentTab]);

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
        const updatedPosts = await services.knowledgebaseService.getArticles({ type: 'blog', status: 'all' });
        setPosts(updatedPosts);
      }
    } catch (err) {
      console.error('Sync failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const healthAudit = useMemo(() => {
    const lowSEO = posts.filter((p: KnowledgebaseArticle) => !p.metaTitle || !p.metaDescription);
    const lowWordCount = posts.filter((p: KnowledgebaseArticle) => (p.content?.split(/\s+/).length || 0) < 300);
    const missingImages = posts.filter((p: KnowledgebaseArticle) => !p.featuredImageUrl);
    return { lowSEO, lowWordCount, missingImages };
  }, [posts]);

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
          <button 
            onClick={() => setShowGuide(true)}
            className="hidden lg:flex items-center gap-3 px-6 py-4 rounded-2xl bg-white border border-gray-100 text-gray-900 font-black text-xs uppercase tracking-widest hover:bg-gray-50 transition-all shadow-sm"
          >
            <SparklesIcon className="h-4 w-4 text-primary-600" />
            Strategy Guide
          </button>
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

      {showGuide && <StrategyGuide onClose={() => setShowGuide(false)} />}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <StatsOverview posts={posts} />
        <CategoryDistribution />
      </div>

      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
        <ControlBar 
          currentTab={currentTab}
          setCurrentTab={setCurrentTab}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          viewMode={viewMode}
          setViewMode={setViewMode}
          handleSyncScheduling={handleSyncScheduling}
          showAudit={showAudit}
          setShowAudit={setShowAudit}
        />

        {showAudit && <AuditPanel healthAudit={healthAudit} setSelectedPosts={setSelectedPosts} />}

        <div className="p-0">
          {viewMode === 'kanban' ? (
            <div className="p-8">
              <KanbanBoard posts={filteredPosts} />
            </div>
          ) : (
            <BlogTable 
              posts={filteredPosts}
              loading={loading}
              selectedPosts={selectedPosts}
              toggleSelect={toggleSelect}
              toggleSelectAll={toggleSelectAll}
              handleIndividualDelete={handleIndividualDelete}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              setCurrentTab={setCurrentTab}
            />
          )}
        </div>
      </div>

      <BulkActionBar 
        selectedPosts={selectedPosts}
        setSelectedPosts={setSelectedPosts}
        handleBulkAction={handleBulkAction}
      />
    </div>
  );
}
