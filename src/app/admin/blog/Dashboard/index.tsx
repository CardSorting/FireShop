'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { useServices } from '@ui/hooks/useServices';
import { Plus, User, NotebookPen, Sparkles as SparklesIcon, BarChart3, Users, Settings as SettingsIcon } from 'lucide-react';
import Link from 'next/link';

import type { KnowledgebaseArticle, Author } from '@domain/models';
import type { DashboardTab, DashboardViewMode, DashboardHubView, DashboardState } from './types';

import { StatsOverview } from './components/StatsOverview';
import { CategoryDistribution } from './components/CategoryDistribution';
import { ControlBar } from './components/ControlBar';
import { AuditPanel } from './components/AuditPanel';
import { StrategyGuide } from './components/StrategyGuide';
import { BulkActionBar } from './components/BulkActionBar';
import { BlogSubNav } from './components/BlogSubNav';
import { ActionCenter } from './components/ActionCenter';

// Views
import { EditorialView } from './views/EditorialView';
import { AudienceHub } from './views/AudienceHub';
import { InsightsView } from './views/InsightsView';
import { SettingsView } from './views/SettingsView';

export default function BlogDashboard() {
  const services = useServices();
  const [posts, setPosts] = useState<KnowledgebaseArticle[]>([]);
  const [authors, setAuthors] = useState<Author[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentTab, setCurrentTab] = useState<DashboardTab>('all');
  const [selectedPosts, setSelectedPosts] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<DashboardViewMode>('table');
  const [activeView, setActiveView] = useState<DashboardHubView>('editorial');
  const [showGuide, setShowGuide] = useState(false);
  const [showAudit, setShowAudit] = useState(false);
  const isMounted = React.useRef(true);

  React.useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  useEffect(() => {
    async function loadData() {
      try {
        const [postsData, authorsData] = await Promise.all([
          services.knowledgebaseService.getArticles({ status: 'all' }),
          services.knowledgebaseService.getAuthors()
        ]);
        if (isMounted.current) {
          setPosts(postsData.articles);
          setAuthors(authorsData);
        }
      } catch (err) {
        if (isMounted.current) {
          console.error('Failed to load admin blog data', err);
        }
      } finally {
        if (isMounted.current) {
          setLoading(false);
        }
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

  const healthAudit = useMemo(() => {
    const lowSEO = posts.filter((p: KnowledgebaseArticle) => !p.metaTitle || !p.metaDescription);
    const lowWordCount = posts.filter((p: KnowledgebaseArticle) => (p.content?.split(/\s+/).length || 0) < 300);
    const missingImages = posts.filter((p: KnowledgebaseArticle) => !p.featuredImageUrl);
    
    // Calculate a rough "Health Score"
    const totalPossiblePoints = posts.length * 3;
    const deductions = lowSEO.length + lowWordCount.length + missingImages.length;
    const score = posts.length > 0 ? Math.round(((totalPossiblePoints - deductions) / totalPossiblePoints) * 100) : 100;
    
    return { lowSEO, lowWordCount, missingImages, score };
  }, [posts]);

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
      if (isMounted.current) {
        setPosts(updatedPosts.articles);
        setSelectedPosts([]);
      }
    } catch (err) {
      if (isMounted.current) {
        console.error(`Bulk ${action} failed:`, err);
        alert(`Failed to perform bulk ${action}.`);
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  };

  const handleIndividualDelete = async (id: string) => {
    if (!window.confirm('Delete this entry forever?')) return;
    setLoading(true);
    try {
      await services.knowledgebaseService.batchDeleteArticles([id]);
      const updatedPosts = await services.knowledgebaseService.getArticles({ type: 'blog', status: 'all' });
      if (isMounted.current) {
        setPosts(updatedPosts.articles);
      }
    } catch (err) {
      if (isMounted.current) {
        console.error('Delete failed:', err);
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  };

  const handleSyncScheduling = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/blog/sync-scheduling', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        if (isMounted.current) {
          alert(`Successfully published ${data.publishedCount} scheduled posts.`);
        }
        const updatedPosts = await services.knowledgebaseService.getArticles({ type: 'blog', status: 'all' });
        if (isMounted.current) {
          setPosts(updatedPosts.articles);
        }
      }
    } catch (err) {
      if (isMounted.current) {
        console.error('Sync failed:', err);
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  };

  const state: DashboardState = {
    posts: filteredPosts,
    authors,
    loading,
    searchQuery,
    setSearchQuery,
    currentTab,
    setCurrentTab,
    activeView,
    setActiveView,
    selectedPosts,
    setSelectedPosts,
    viewMode,
    setViewMode,
    showGuide,
    setShowGuide,
    showAudit,
    setShowAudit,
    handleBulkAction,
    handleIndividualDelete,
    handleSyncScheduling,
    toggleSelect,
    toggleSelectAll,
    healthAudit
  };

  return (
    <div className="flex gap-8 p-8 min-h-[calc(100vh-4rem)] max-w-[1700px] mx-auto animate-in fade-in duration-500">
      {/* Local Sidebar */}
      <BlogSubNav activeView={activeView} setActiveView={setActiveView} />

      {/* Main Content Area */}
      <div className="flex-1 space-y-10 min-w-0">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 text-primary-600 mb-2">
               <NotebookPen className="h-5 w-5" />
               <span className="text-[10px] font-black uppercase tracking-[0.2em]">DreamBees Editorial</span>
            </div>
            <h1 className="text-4xl font-black text-gray-900 tracking-tight capitalize">
              {activeView === 'editorial' ? 'Content Hub' : activeView}
            </h1>
            <p className="text-gray-500 font-medium mt-2">
              {activeView === 'editorial' && "Orchestrate your stories and collector engagement."}
              {activeView === 'insights' && "Analyzing reach, velocity, and content health."}
              {activeView === 'audience' && "Understanding your growing community of collectors."}
              {activeView === 'settings' && "Global configurations for your blogging engine."}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setShowGuide(true)}
              className="hidden lg:flex items-center gap-3 px-6 py-4 rounded-2xl bg-white border border-gray-100 text-gray-900 font-black text-xs uppercase tracking-widest hover:bg-gray-50 transition-all shadow-sm"
            >
              <SparklesIcon className="h-4 w-4 text-primary-600" />
              Strategy
            </button>
            <Link 
              href="/admin/blog/new" 
              className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-primary-600 text-white font-black text-xs uppercase tracking-widest hover:bg-primary-700 transition-all shadow-xl shadow-primary-600/20"
            >
              <Plus className="h-4 w-4" />
              New Entry
            </Link>
          </div>
        </div>

        {showGuide && <StrategyGuide onClose={() => setShowGuide(false)} />}

        {activeView === 'editorial' && (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Quick Insights Bar */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <StatsOverview posts={posts} />
              <CategoryDistribution />
            </div>

            {/* Action Center - The Industrial CRM "Priority" pattern */}
            <ActionCenter healthAudit={healthAudit} posts={posts} />

            {/* Main Editorial Workspace */}
            <div className="space-y-6">
              <ControlBar 
                {...state}
              />

              {showAudit && <AuditPanel healthAudit={healthAudit} setSelectedPosts={setSelectedPosts} />}

              <EditorialView {...state} />
            </div>
          </div>
        )}

        {activeView === 'insights' && (
          <InsightsView posts={posts} />
        )}
 
        {activeView === 'audience' && (
          <AudienceHub />
        )}
 
        {activeView === 'settings' && (
          <SettingsView />
        )}

        <BulkActionBar 
          selectedPosts={selectedPosts}
          setSelectedPosts={setSelectedPosts}
          handleBulkAction={handleBulkAction}
        />
      </div>
    </div>
  );
}
