import type { KnowledgebaseArticle, Author } from '@domain/models';

export type DashboardTab = 'all' | 'published' | 'scheduled' | 'draft';
export type DashboardViewMode = 'table' | 'kanban';

export interface DashboardState {
  posts: KnowledgebaseArticle[];
  authors: Author[];
  loading: boolean;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  currentTab: DashboardTab;
  setCurrentTab: (t: DashboardTab) => void;
  selectedPosts: string[];
  setSelectedPosts: (ids: string[] | ((prev: string[]) => string[])) => void;
  viewMode: DashboardViewMode;
  setViewMode: (m: DashboardViewMode) => void;
  showGuide: boolean;
  setShowGuide: (s: boolean) => void;
  showAudit: boolean;
  setShowAudit: (s: boolean) => void;
  handleBulkAction: (action: 'publish' | 'archived' | 'delete') => Promise<void>;
  handleIndividualDelete: (id: string) => Promise<void>;
  handleSyncScheduling: () => Promise<void>;
  toggleSelect: (id: string) => void;
  toggleSelectAll: () => void;
  healthAudit: {
    lowSEO: KnowledgebaseArticle[];
    lowWordCount: KnowledgebaseArticle[];
    missingImages: KnowledgebaseArticle[];
  };
}
