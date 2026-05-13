'use client';

import { useEffect, useState } from 'react';
import { 
  MessageSquare, 
  TrendingUp, 
  AlertCircle, 
  Lightbulb, 
  ChevronRight, 
  Clock, 
  User, 
  ExternalLink,
  Loader2,
  RefreshCcw,
  Sparkles,
  Zap,
  BarChart3,
  ShieldCheck,
  CheckCircle2,
  Info,
  Search,
  Filter,
  MoreVertical,
  XCircle,
  FileText,
  CreditCard,
  ShoppingBag,
  Inbox,
  UserPlus,
  ArrowRightCircle,
  History,
  CornerDownRight,
  UserCheck,
  Flag,
  ArrowUpRight,
  Copy,
  ChevronDown,
  ChevronUp,
  MessageCircle,
  Share2,
  Bookmark,
  Reply,
  FastForward,
  UserX,
  Target,
  ThumbsUp,
  ThumbsDown,
  Activity,
  ArrowRight,
  Bell,
  Check,
  Eye,
  Calendar,
  Lock,
  PauseCircle
} from 'lucide-react';
import { 
  AdminBadge, 
  AdminMetricCard, 
  AdminPageHeader, 
  SkeletonPage, 
  useAdminPageTitle, 
  useToast 
} from '../../components/admin/AdminComponents';

interface Suggestion {
  action: string;
  why: string;
  expectedOutcome: string;
  risk: string;
  confidence: string;
  source: string;
  impact?: 'conversion' | 'support_burden' | 'loyalty';
  effort?: 'low' | 'medium' | 'high';
  frequency?: number;
  isAssumption?: boolean;
}

interface ConciergeSession {
  id: string;
  customerName: string;
  customerEmail: string;
  summary?: string;
  category?: string;
  urgency?: 'low' | 'medium' | 'high';
  sentiment?: 'positive' | 'neutral' | 'frustrated' | 'angry';
  customerNeed?: string;
  recommendedAction?: string;
  escalationNeeded?: boolean;
  escalationReason?: string;
  uncertaintyNote?: string;
  evidenceQuotes?: string[];
  confidence?: string;
  insights?: string[];
  suggestions?: Suggestion[];
  status: string;
  responseStatus?: 'waiting_on_store' | 'waiting_on_customer' | 'handled_by_concierge';
  customerOutcome?: 'resolved' | 'escalated' | 'abandoned' | 'converted';
  operatorOutcome?: 'suggestion_accepted' | 'suggestion_dismissed' | 'resolved_manually';
  isRepeatIssue?: boolean;
  repeatFrequency?: number;
  assignedOperator?: string;
  followUpDate?: string;
  isSnoozed?: boolean;
  createdAt: string;
  transcript: Array<{ role: string; content: string }>;
  internalNotes?: string;
  operatorFeedback?: Array<{
    suggestionIndex: number;
    feedback: 'helpful' | 'not_useful';
    note?: string;
  }>;
  events?: Array<{
    type: 'joined' | 'escalated' | 'note_added' | 'resolved' | 'analyzed' | 'reopened' | 'outcome_tracked' | 'assigned' | 'reminder_set';
    timestamp: any;
    label: string;
    description?: string;
    operator?: string;
  }>;
}

export function AdminConciergeInsights() {
  useAdminPageTitle('Support Desk');
  const { toast } = useToast();
  const [sessions, setSessions] = useState<ConciergeSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedSession, setSelectedSession] = useState<ConciergeSession | null>(null);
  const [activeTab, setActiveTab] = useState<'inbox' | 'patterns' | 'digest' | 'funnels' | 'settings'>('inbox');
  const [filter, setFilter] = useState('all');
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    'findings': true,
    'transcript': true,
    'context': true,
    'activity': true,
    'assignment': true
  });
  const [internalNote, setInternalNote] = useState('');
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [adminSettings, setAdminSettings] = useState<any>({
    isBarteringEnabled: false,
    maxDiscountPercentage: 15,
    negotiationTone: 'Friendly & Approachable',
    minOrderValueForBarter: 50
  });
  const [storeDigest, setStoreDigest] = useState<any>(null);
  const [marketingStrategy, setMarketingStrategy] = useState<any>(null);
  const [isCreatingPlaybook, setIsCreatingPlaybook] = useState<string | null>(null);
  const [isCreatingLifecycle, setIsCreatingLifecycle] = useState(false);
  const [strategyAction, setStrategyAction] = useState<string | null>(null);
  const [optimizationReport, setOptimizationReport] = useState<any>(null);

  const fetchSessions = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/concierge/sessions');
      if (!res.ok) throw new Error('Failed to fetch sessions');
      const data = await res.json();
      setSessions(data);
      if (selectedSession) {
        const updated = data.find((s: any) => s.id === selectedSession.id);
        if (updated) setSelectedSession(updated);
      }
    } catch (error) {
      toast('error', 'Failed to load support workspace');
    } finally {
      setIsLoading(false);
    }
  };

  // Real-time Poll for new activity
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isAnalyzing && !isLoading) {
        fetchSessions();
      }
    }, 10000); // Poll every 10s
    return () => clearInterval(interval);
  }, [isAnalyzing, isLoading]);

  const handleSessionAction = async (action: string, payload: any = {}) => {
    if (!selectedSession) return;
    try {
      const res = await fetch(`/api/admin/concierge/sessions/${selectedSession.id}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action, 
          payload,
          operator: 'Me' // In a real app, this would be the logged-in admin name
        })
      });
      if (!res.ok) throw new Error('Action failed');
      toast('success', `Action ${action} successful`);
      await fetchSessions();
    } catch (error) {
      toast('error', 'Failed to perform action');
    }
  };

  const handleSaveSettings = async () => {
    setIsSavingSettings(true);
    try {
      const res = await fetch('/api/concierge/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(adminSettings)
      });
      if (!res.ok) throw new Error('Failed to save');
      toast('success', 'Concierge settings updated');
    } catch (error) {
      toast('error', 'Failed to save settings');
    } finally {
      setIsSavingSettings(false);
    }
  };

  useEffect(() => {
    const fetchSettings = async () => {
      const res = await fetch('/api/concierge/settings');
      if (res.ok) {
        const data = await res.json();
        setAdminSettings(data);
      }
    };
    fetchSettings();
  }, []);

  const fetchDigest = async () => {
    try {
      const res = await fetch('/api/admin/concierge/digest');
      if (res.ok) {
        const data = await res.json();
        setStoreDigest(data);
      }
    } catch (err) {
      console.error('Failed to fetch digest');
    }
  };

  useEffect(() => {
    if (activeTab === 'digest') {
      fetchDigest();
    }
  }, [activeTab]);

  const fetchMarketingStrategy = async () => {
    try {
      const res = await fetch('/api/admin/concierge/marketing-strategy');
      if (res.ok) {
        const data = await res.json();
        setMarketingStrategy(data);
      }
    } catch (err) {
      console.error('Failed to fetch marketing strategy');
    }
  };

  useEffect(() => {
    if (activeTab === 'funnels') {
      fetchMarketingStrategy();
    }
  }, [activeTab]);

  const handleCreatePlaybook = async (playbookId: string) => {
    setIsCreatingPlaybook(playbookId);
    try {
      const res = await fetch('/api/admin/concierge/marketing-strategy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playbookId })
      });
      if (!res.ok) throw new Error('Failed to create playbook');
      toast('success', 'Recovery playbook created as a draft');
      await fetchMarketingStrategy();
    } catch (error) {
      toast('error', 'Failed to create recovery playbook');
    } finally {
      setIsCreatingPlaybook(null);
    }
  };

  const handlePlaybookStatus = async (playbookId: string, action: 'activate_playbook' | 'pause_playbook') => {
    setIsCreatingPlaybook(playbookId);
    try {
      const res = await fetch('/api/admin/concierge/marketing-strategy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, playbookId })
      });
      if (!res.ok) throw new Error('Failed to update playbook');
      toast('success', action === 'activate_playbook' ? 'Lifecycle playbook activated' : 'Lifecycle playbook paused');
      await fetchMarketingStrategy();
    } catch (error) {
      toast('error', 'Failed to update lifecycle playbook');
    } finally {
      setIsCreatingPlaybook(null);
    }
  };

  const handleCreateMissingLifecycle = async () => {
    setIsCreatingLifecycle(true);
    try {
      const res = await fetch('/api/admin/concierge/marketing-strategy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create_missing_lifecycle_playbooks' })
      });
      if (!res.ok) throw new Error('Failed to create lifecycle drafts');
      const data = await res.json();
      toast('success', `Created ${data.created?.length || 0} lifecycle campaign drafts`);
      await fetchMarketingStrategy();
    } catch (error) {
      toast('error', 'Failed to create lifecycle campaign drafts');
    } finally {
      setIsCreatingLifecycle(false);
    }
  };

  const handleStrategyAction = async (action: 'run_lifecycle_automation_pulse' | 'activate_all_lifecycle_playbooks' | 'pause_all_lifecycle_playbooks') => {
    setStrategyAction(action);
    try {
      const res = await fetch('/api/admin/concierge/marketing-strategy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      if (!res.ok) throw new Error('Failed to run strategy action');
      toast('success', action === 'run_lifecycle_automation_pulse' ? 'Lifecycle automation pulse completed' : 'Lifecycle strategy updated');
      await fetchMarketingStrategy();
    } catch (error) {
      toast('error', 'Failed to run lifecycle strategy action');
    } finally {
      setStrategyAction(null);
    }
  };

  const handleOptimizeStrategy = async () => {
    setStrategyAction('optimize_lifecycle_strategy');
    try {
      const res = await fetch('/api/admin/concierge/marketing-strategy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'optimize_lifecycle_strategy' })
      });
      if (!res.ok) throw new Error('Failed to optimize lifecycle strategy');
      const report = await res.json();
      setOptimizationReport(report);
      toast('success', 'Lifecycle strategy optimization completed');
    } catch (error) {
      toast('error', 'Failed to optimize lifecycle strategy');
    } finally {
      setStrategyAction(null);
    }
  };

  const handleAnalyze = async (sessionId: string) => {
    setIsAnalyzing(true);
    try {
      const res = await fetch('/api/admin/concierge/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId })
      });
      if (!res.ok) throw new Error('Analysis failed');
      toast('success', 'Workspace updated');
      await fetchSessions();
    } catch (error) {
      toast('error', 'Failed to process conversation');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  if (isLoading) return <SkeletonPage />;

  const needsAttention = sessions.filter(s => s.escalationNeeded && s.status !== 'resolved');
  const filteredSessions = sessions.filter(s => {
    if (filter === 'all') return true;
    if (filter === 'needs_attention') return s.escalationNeeded && s.status !== 'resolved';
    if (filter === 'assigned_to_me') return s.assignedOperator === 'Me' && s.status !== 'resolved';
    if (filter === 'snoozed') return s.isSnoozed;
    return true;
  });

  const SENTIMENT_COLORS = {
    'positive': 'text-green-600',
    'neutral': 'text-gray-400',
    'frustrated': 'text-amber-600',
    'angry': 'text-red-600',
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <AdminPageHeader
        category="Customer Operations"
        title="Support Workspace"
        subtitle="A calm, collaborative environment for tracking support outcomes and operational truth."
        actions={
          <div className="flex gap-3">
             <button 
              onClick={fetchSessions}
              className="inline-flex items-center gap-2 rounded-xl bg-white border border-gray-100 px-4 py-2.5 text-xs font-black uppercase tracking-widest text-gray-500 hover:bg-gray-50 transition-all shadow-sm"
            >
              <RefreshCcw className="h-4 w-4" />
              Sync State
            </button>
          </div>
        }
      />

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AdminMetricCard 
          label="Awaiting Follow-up" 
          value={needsAttention.length} 
          icon={Flag} 
          color={needsAttention.length > 0 ? 'warning' : 'success'} 
          description="Priority issues" 
        />
        <AdminMetricCard 
          label="Resolved Today" 
          value={sessions.filter(s => s.status === 'resolved').length} 
          icon={CheckCircle2} 
          color="success" 
          description="Team throughput" 
        />
        <AdminMetricCard 
          label="Repeat Concerns" 
          value={sessions.filter(s => s.isRepeatIssue).length} 
          icon={History} 
          color="info" 
          description="Historical patterns" 
        />
        <AdminMetricCard 
          label="Conversion Assist" 
          value={sessions.filter(s => s.customerOutcome === 'converted').length} 
          icon={ShoppingBag} 
          color="primary" 
          description="Sales impact" 
        />
      </section>

      <div className="border-b border-gray-100">
        <nav className="flex gap-10">
          {[
            { id: 'inbox', label: 'Inbox', icon: Inbox },
            { id: 'patterns', label: 'Suggested Fixes', icon: Zap },
            { id: 'digest', label: 'Operational Digest', icon: FileText },
            { id: 'funnels', label: 'Recovery Funnels', icon: Target },
            { id: 'settings', label: 'Settings', icon: Lock },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 py-4 border-b-2 transition-all font-black text-xs uppercase tracking-widest ${
                activeTab === tab.id 
                  ? 'border-gray-900 text-gray-900' 
                  : 'border-transparent text-gray-400 hover:text-gray-600 hover:border-gray-200'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'inbox' && (
        <div className="grid gap-8 lg:grid-cols-12 h-[calc(100vh-440px)] min-h-[600px]">
          {/* Triage - Linear Grade Scanability */}
          <div className="lg:col-span-4 flex flex-col gap-4 overflow-hidden">
            <div className="flex gap-1.5 p-1 bg-gray-50 rounded-2xl border border-gray-100">
              {[
                { id: 'all', label: 'All' },
                { id: 'assigned_to_me', label: 'Mine' },
                { id: 'needs_attention', label: 'Action' },
                { id: 'snoozed', label: 'Snoozed' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id)}
                  className={`flex-1 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                    filter === f.id 
                      ? 'bg-white text-gray-900 shadow-sm border border-gray-200' 
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="flex-1 space-y-1 overflow-y-auto pr-2 styled-scrollbar">
              {filteredSessions.map(session => (
                <button
                  key={session.id}
                  onClick={() => setSelectedSession(session)}
                  className={`w-full text-left p-5 rounded-3xl border transition-all relative group ${
                    selectedSession?.id === session.id 
                      ? 'bg-white border-gray-900 shadow-2xl ring-4 ring-gray-50 z-10' 
                      : 'bg-white border-gray-50 hover:border-gray-200'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black text-gray-400 uppercase">
                        {new Date(session.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {session.assignedOperator && (
                        <div className="px-1.5 py-0.5 bg-primary-50 text-primary-600 rounded-md text-[8px] font-black uppercase tracking-tighter border border-primary-100">
                          {session.assignedOperator}
                        </div>
                      )}
                    </div>
                    {session.escalationNeeded && session.status !== 'resolved' && (
                      <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse" />
                    )}
                  </div>
                  <h4 className="text-[13px] font-black text-gray-900 truncate">{session.customerName}</h4>
                  <p className="text-xs text-gray-500 truncate mt-1 font-medium opacity-60 leading-relaxed">
                    {session.summary || 'Extracting concern...'}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Collaborative Workspace */}
          <div className="lg:col-span-8 overflow-hidden flex flex-col">
            {selectedSession ? (
              <div className="bg-white rounded-4xl border border-gray-100 shadow-2xl shadow-gray-200/20 flex-1 flex flex-col overflow-hidden animate-in fade-in slide-in-from-right-4 duration-500">
                {/* Header with Ownership */}
                <div className="px-10 py-6 border-b border-gray-50 flex justify-between items-center bg-white/50 backdrop-blur-xl">
                  <div className="flex items-center gap-6">
                    <div className="h-14 w-14 rounded-3xl bg-gray-900 flex items-center justify-center text-white text-xl font-black shadow-xl shadow-gray-200">
                      {selectedSession.customerName.charAt(0)}
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-lg font-black text-gray-900 leading-none">{selectedSession.customerName}</h3>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{selectedSession.customerEmail}</span>
                        <div className="h-1 w-1 bg-gray-300 rounded-full" />
                        {selectedSession.isRepeatIssue && (
                          <span className="text-[9px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-100">Repeat Concern</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex bg-gray-50 p-1 rounded-2xl border border-gray-100">
                       <button 
                         onClick={() => handleSessionAction('snooze', { followUpDate: new Date(Date.now() + 86400000).toISOString() })}
                         className="px-4 py-2 text-[9px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-900 transition-colors"
                       >
                         Snooze
                       </button>
                       <div className="w-px h-4 self-center bg-gray-200" />
                       <button 
                         onClick={() => handleSessionAction('assign', { operatorName: 'Team Lead' })}
                         className="px-4 py-2 text-[9px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-900 transition-colors"
                       >
                         Assign
                       </button>
                    </div>
                    <button 
                      onClick={() => handleSessionAction('resolve')}
                      className="inline-flex items-center gap-2 rounded-2xl bg-gray-900 px-6 py-3.5 text-xs font-black uppercase tracking-widest text-white hover:bg-black transition-all shadow-xl active:scale-95"
                    >
                      Mark Handled
                    </button>
                  </div>
                </div>

                <div className="flex-1 flex overflow-hidden">
                  <div className="flex-1 overflow-y-auto p-10 space-y-12 styled-scrollbar relative">
                    
                    {/* Findings & Truth Group */}
                    <section className="space-y-6">
                      <button 
                        onClick={() => toggleGroup('findings')}
                        className="flex items-center gap-3 group w-full"
                      >
                        <Sparkles className="h-5 w-5 text-primary-600" />
                        <h4 className="text-[11px] font-black uppercase tracking-widest text-gray-400 group-hover:text-gray-900 transition-colors">What we found</h4>
                        {expandedGroups['findings'] ? <ChevronUp className="h-4 w-4 ml-auto text-gray-300" /> : <ChevronDown className="h-4 w-4 ml-auto text-gray-300" />}
                      </button>

                      {expandedGroups['findings'] && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-top-2 duration-300">
                           {selectedSession.summary ? (
                             <>
                               <div className="bg-gray-50 rounded-4xl p-10 border border-gray-100 group relative">
                                 <p className="text-lg font-bold text-gray-900 leading-relaxed italic">
                                   "{selectedSession.summary}"
                                 </p>
                                 {selectedSession.uncertaintyNote && (
                                   <div className="mt-6 flex gap-3 items-start p-4 bg-white border border-gray-100 rounded-2xl">
                                      <Info className="h-4 w-4 text-primary-600 shrink-0 mt-0.5" />
                                      <p className="text-xs font-bold text-gray-500 leading-relaxed">{selectedSession.uncertaintyNote}</p>
                                   </div>
                                 )}
                               </div>

                               <div className="grid gap-6 md:grid-cols-2">
                                 <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm space-y-4">
                                   <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Customer Need</p>
                                   <p className="text-sm font-bold text-gray-800">{selectedSession.customerNeed || 'Help with a store inquiry.'}</p>
                                 </div>
                                 <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm space-y-4">
                                   <div className="flex justify-between items-center">
                                      <p className="text-[10px] font-black uppercase tracking-widest text-primary-600">Suggested Action</p>
                                      <AdminBadge label={selectedSession.confidence || 'Medium'} type="gray" />
                                   </div>
                                   <p className="text-sm font-bold text-gray-800">{selectedSession.recommendedAction || 'Monitor session.'}</p>
                                 </div>
                               </div>

                               {selectedSession.escalationReason && (
                                 <div className="bg-red-50/50 rounded-3xl p-8 border border-red-100 flex gap-6 relative overflow-hidden">
                                   <div className="absolute top-0 right-0 p-4 opacity-5">
                                      <Flag className="h-16 w-16 text-red-600" />
                                   </div>
                                   <AlertCircle className="h-7 w-7 text-red-500 shrink-0 mt-0.5" />
                                   <div className="relative z-10">
                                     <p className="text-[10px] font-black uppercase tracking-widest text-red-600 mb-2">Why we flagged this</p>
                                     <p className="text-sm font-bold text-red-900 leading-relaxed">{selectedSession.escalationReason}</p>
                                   </div>
                                 </div>
                               )}
                             </>
                           ) : (
                             <div className="py-20 text-center bg-gray-50 rounded-4xl border-2 border-dashed border-gray-100">
                                <Loader2 className={`h-12 w-12 mx-auto text-gray-200 mb-6 ${isAnalyzing ? 'animate-spin' : ''}`} />
                                <h5 className="text-sm font-black text-gray-400 uppercase tracking-widest">Gaining Operational Truth...</h5>
                                <button 
                                  onClick={() => handleAnalyze(selectedSession.id)}
                                  className="mt-8 inline-flex items-center gap-3 rounded-2xl bg-gray-900 px-10 py-4 text-xs font-black uppercase tracking-widest text-white hover:bg-black transition-all shadow-xl active:scale-95"
                                >
                                  Process Findings
                                </button>
                             </div>
                           )}
                        </div>
                      )}
                    </section>

                    {/* Timeline Evidence */}
                    <section className="space-y-6">
                      <button 
                        onClick={() => toggleGroup('transcript')}
                        className="flex items-center gap-3 w-full group"
                      >
                        <MessageSquare className="h-5 w-5 text-gray-400" />
                        <h4 className="text-[11px] font-black uppercase tracking-widest text-gray-400 group-hover:text-gray-900 transition-colors">Conversation Timeline</h4>
                        {expandedGroups['transcript'] ? <ChevronUp className="h-4 w-4 ml-auto text-gray-300" /> : <ChevronDown className="h-4 w-4 ml-auto text-gray-300" />}
                      </button>

                      {expandedGroups['transcript'] && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                          {selectedSession.transcript.map((msg, i) => (
                            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                              <div className={`max-w-[85%] p-6 rounded-3xl shadow-sm text-sm font-medium leading-relaxed ${
                                msg.role === 'user' 
                                  ? 'bg-gray-900 text-white rounded-tr-none' 
                                  : 'bg-white border border-gray-100 text-gray-800 rounded-tl-none'
                              }`}>
                                {msg.content}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </section>

                    {/* Team Activity Feed */}
                    <section className="space-y-6">
                      <button 
                        onClick={() => toggleGroup('activity')}
                        className="flex items-center gap-3 w-full group"
                      >
                        <Activity className="h-5 w-5 text-gray-400" />
                        <h4 className="text-[11px] font-black uppercase tracking-widest text-gray-400 group-hover:text-gray-900 transition-colors">Team Activity</h4>
                        {expandedGroups['activity'] ? <ChevronUp className="h-4 w-4 ml-auto text-gray-300" /> : <ChevronDown className="h-4 w-4 ml-auto text-gray-300" />}
                      </button>

                      {expandedGroups['activity'] && (
                        <div className="space-y-4 animate-in fade-in duration-300 pl-4 border-l-2 border-gray-50">
                           {selectedSession.events?.map((event, i) => (
                             <div key={i} className="flex gap-4 group">
                                <div className="h-8 w-8 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 shrink-0">
                                  {event.type === 'assigned' ? <UserPlus className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
                                </div>
                                <div className="space-y-0.5">
                                   <p className="text-[11px] font-black text-gray-900 uppercase tracking-tight">{event.label}</p>
                                   <p className="text-[10px] font-bold text-gray-400">{event.description}</p>
                                </div>
                             </div>
                           ))}
                           <div className="flex gap-4 pt-2">
                              <div className="h-8 w-8 rounded-xl bg-gray-900 flex items-center justify-center text-white shrink-0">
                                <User className="h-4 w-4" />
                              </div>
                               <div className="flex-1 flex gap-2">
                                  <input 
                                    value={internalNote}
                                    onChange={(e) => setInternalNote(e.target.value)}
                                    placeholder="Add an internal handoff note..." 
                                    className="flex-1 bg-gray-50 border border-gray-100 rounded-xl px-4 py-2 text-xs font-medium focus:ring-0 focus:border-gray-300 transition-all placeholder:text-gray-300"
                                  />
                                  <button 
                                    onClick={() => {
                                      if (internalNote) {
                                        handleSessionAction('add_note', { note: internalNote });
                                        setInternalNote('');
                                      }
                                    }}
                                    className="p-2 bg-gray-900 text-white rounded-xl hover:bg-black transition-all"
                                  >
                                    <ArrowRightCircle className="h-4 w-4" />
                                  </button>
                               </div>
                           </div>
                        </div>
                      )}
                    </section>
                  </div>

                  {/* Operational Context Sidebar */}
                  <div className="w-80 border-l border-gray-50 bg-gray-50/20 overflow-y-auto p-10 space-y-12 styled-scrollbar">
                    {/* Continuity & Memory */}
                    <section className="space-y-6">
                       <h4 className="text-[11px] font-black uppercase tracking-widest text-gray-400">Support Memory</h4>
                       <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-6">
                          <div className="flex justify-between items-center">
                             <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Sentiment</span>
                             <span className={`text-[10px] font-black uppercase tracking-widest ${SENTIMENT_COLORS[selectedSession.sentiment as keyof typeof SENTIMENT_COLORS]}`}>
                               {selectedSession.sentiment || 'Neutral'}
                             </span>
                          </div>
                          <div className="space-y-4 pt-4 border-t border-gray-50">
                             <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Recent Context</p>
                             <div className="space-y-2">
                                <button className="w-full flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all text-left group">
                                   <ShoppingBag className="h-4 w-4 text-gray-400 group-hover:text-gray-900" />
                                   <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 group-hover:text-gray-900">Active Cart</span>
                                </button>
                                <button className="w-full flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all text-left group">
                                   <History className="h-4 w-4 text-gray-400 group-hover:text-gray-900" />
                                   <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 group-hover:text-gray-900">Past Orders</span>
                                </button>
                             </div>
                          </div>
                       </div>
                    </section>

                    {/* Operational Awareness */}
                    <section className="space-y-6">
                       <h4 className="text-[11px] font-black uppercase tracking-widest text-gray-400">Operational Patterns</h4>
                       <div className="space-y-3">
                          <div className="p-5 bg-white rounded-3xl border border-gray-100 shadow-sm flex flex-col gap-2">
                             <div className="flex items-center justify-between">
                                <span className="text-[9px] font-black text-primary-600 uppercase tracking-widest">Checkout Intent</span>
                                <TrendingUp className="h-3 w-3 text-primary-600" />
                             </div>
                             <p className="text-[10px] font-bold text-gray-500 leading-relaxed">High intent detected around delivery expectations.</p>
                          </div>
                       </div>
                    </section>

                    {/* Team Controls */}
                    <section className="space-y-6 pt-6 border-t border-gray-50">
                       <button className="w-full py-4 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm active:scale-95 flex items-center justify-center gap-2">
                          <Share2 className="h-4 w-4" /> Share Case
                       </button>
                    </section>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full rounded-4xl border-2 border-dashed border-gray-100 bg-white flex flex-col items-center justify-center p-20 text-center animate-in fade-in duration-1000">
                 <div className="h-28 w-28 bg-gray-50 rounded-4xl flex items-center justify-center mb-10 text-gray-200 shadow-inner">
                   <Inbox className="h-12 w-12" />
                 </div>
                 <h3 className="text-2xl font-black text-gray-900">Quiet Workspace</h3>
                 <p className="text-sm font-bold text-gray-400 mt-4 max-w-sm mx-auto leading-relaxed">
                   Select a conversation to review patterns, evidence, and customer outcomes.
                 </p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'patterns' && (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
           <div className="flex justify-between items-end px-4">
             <div>
               <h3 className="text-3xl font-black text-gray-900 uppercase tracking-tight">Suggested Fixes</h3>
               <p className="text-sm font-bold text-gray-400 mt-2">Operational improvements grounded in recurring customer friction.</p>
             </div>
             <div className="bg-gray-100 px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-600">
                {needsAttention.length} Critical Patterns
             </div>
           </div>
           
           <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
             {sessions.flatMap((s, sIdx) => (s.suggestions || []).map((suggestion, i) => (
               <div key={`${sIdx}-${i}`} className="bg-white rounded-4xl border border-gray-100 p-12 flex flex-col shadow-sm hover:shadow-2xl transition-all group relative overflow-hidden">
                 <div className="absolute top-0 right-0 h-40 w-40 bg-primary-50 rounded-full -mr-20 -mt-20 opacity-0 group-hover:opacity-100 transition-all duration-1000" />
                 
                 <div className="flex justify-between items-start mb-10 relative z-10">
                    <div className="h-14 w-14 bg-primary-50 rounded-2xl flex items-center justify-center text-primary-600 group-hover:bg-primary-600 group-hover:text-white transition-all shadow-sm">
                      <Zap className="h-7 w-7" />
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border ${
                        suggestion.impact === 'conversion' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-primary-50 text-primary-600 border-primary-100'
                      }`}>
                        {suggestion.impact} Impact
                      </div>
                      <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest">Grounding: {suggestion.source}</span>
                    </div>
                 </div>

                 <h4 className="text-2xl font-black text-gray-900 mb-3 leading-tight relative z-10">{suggestion.action}</h4>
                 <p className="text-sm font-bold text-gray-500 leading-relaxed mb-10 relative z-10">"{suggestion.why}"</p>
                 
                  <div className="mt-auto pt-10 border-t border-gray-50 relative z-10 flex gap-4">
                    <button 
                      onClick={() => handleSessionAction('accept_suggestion', { suggestionIndex: i, action: suggestion.action })}
                      className="flex-1 py-5 bg-gray-900 text-white rounded-3xl text-xs font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl active:scale-95"
                    >
                      Accept Fix
                    </button>
                    <button 
                      onClick={() => handleSessionAction('dismiss_suggestion', { suggestionIndex: i })}
                      className="flex-1 py-5 bg-white border border-gray-100 text-gray-400 rounded-3xl text-xs font-black uppercase tracking-widest hover:border-gray-900 hover:text-gray-900 transition-all active:scale-95"
                    >
                      Dismiss
                    </button>
                  </div>
               </div>
             )))}
           </div>
        </div>
      )}

      {activeTab === 'digest' && (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
           {/* Plain Language Operational Digest */}
           <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              <div className="bg-white rounded-4xl border border-gray-100 p-12 shadow-sm col-span-2 space-y-10">
                 <div className="flex items-center gap-4">
                    <div className="h-14 w-14 bg-primary-50 rounded-2xl flex items-center justify-center text-primary-600 shadow-sm border border-primary-100">
                      <Target className="h-7 w-7" />
                    </div>
                    <div>
                      <h4 className="text-xl font-black text-gray-900">Operational Digest</h4>
                      <p className="text-sm font-bold text-gray-400">Natural-language summary of store health and patterns.</p>
                    </div>
                 </div>
                 
                  <div className="space-y-10">
                    {(storeDigest?.digestItems || [
                      { 
                        title: 'Syncing Intelligence...', 
                        desc: 'Aggregating recent sessions for patterns.', 
                        action: 'Wait for analysis', 
                        type: 'conversion' 
                      }
                    ]).map((item: any, i: number) => (
                      <div key={i} className="flex gap-8 group">
                         <div className="h-12 w-12 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-gray-900 group-hover:text-white transition-all shrink-0">
                            {i + 1}
                         </div>
                         <div className="space-y-3">
                            <div className="flex items-center gap-3">
                               <h5 className="text-sm font-black text-gray-900 uppercase tracking-tight">{item.title}</h5>
                               <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg border ${
                                 item.type === 'conversion' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-primary-50 text-primary-600 border-primary-100'
                               }`}>
                                 {item.type?.replace('_', ' ')}
                               </span>
                            </div>
                            <p className="text-sm font-bold text-gray-500 leading-relaxed italic">"{item.desc}"</p>
                            <p className="text-xs font-black text-gray-900 flex items-center gap-2">
                               <ArrowRight className="h-3 w-3 text-primary-600" />
                               {item.action}
                            </p>
                         </div>
                      </div>
                    ))}
                 </div>
              </div>

              <div className="bg-gray-900 rounded-4xl p-12 text-white relative overflow-hidden flex flex-col justify-between shadow-2xl">
                 <div className="relative z-10">
                    <div className="h-16 w-16 bg-white/10 rounded-4xl flex items-center justify-center mb-10 backdrop-blur-md border border-white/10">
                      <ShieldCheck className="h-8 w-8 text-green-400" />
                    </div>
                    <h3 className="text-3xl font-black mb-4 leading-tight">Team Trust Score</h3>
                    <p className="text-sm text-gray-400 leading-relaxed font-medium">
                      Operational truth is trending at <span className="text-white font-black">94.2%</span> based on team outcomes.
                    </p>
                 </div>
                 
                 <div className="relative z-10 pt-16">
                    <div className="flex justify-between items-end mb-6">
                       <span className="text-[11px] font-black uppercase tracking-widest text-gray-500">System Accuracy</span>
                       <span className="text-4xl font-black">{storeDigest?.trustScore || 90}%</span>
                    </div>
                    <div className="h-4 w-full bg-white/10 rounded-full overflow-hidden flex shadow-inner p-1">
                       <div className="h-full bg-green-500 rounded-full shadow-[0_0_20px_rgba(34,197,94,0.6)]" style={{ width: `${storeDigest?.trustScore || 90}%` }} />
                    </div>
                 </div>
              </div>
           </div>

           {/* Natural Language Strategic Observation */}
           <div className="bg-primary-600 rounded-4xl p-12 text-white shadow-2xl shadow-primary-200">
              <h4 className="text-[11px] font-black uppercase tracking-widest text-primary-200 mb-6 flex items-center gap-2">
                <Sparkles className="h-4 w-4" /> Strategic Observation
              </h4>
              <p className="text-2xl font-bold leading-relaxed italic max-w-3xl">
                "{storeDigest?.strategicObservation || 'Analyzing session aggregates for strategic opportunities...'}"
              </p>
              <div className="mt-12 flex gap-4">
                 <button className="px-8 py-4 bg-white text-primary-700 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl active:scale-95">Take Action</button>
                 <button className="px-8 py-4 bg-primary-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-primary-800 transition-all">Review Impact</button>
              </div>
           </div>
        </div>
      )}

      {activeTab === 'funnels' && (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 rounded-3xl border border-gray-100 bg-white p-10 shadow-sm">
              <div className="flex items-start justify-between gap-6">
                <div>
                  <h3 className="text-2xl font-black text-gray-900">Autonomous Lifetime Strategy</h3>
                  <p className="mt-3 max-w-2xl text-sm font-bold leading-relaxed text-gray-500">
                    {marketingStrategy?.summary || 'Loading lifecycle coverage and concierge recovery playbooks...'}
                  </p>
                </div>
                <button
                  onClick={fetchMarketingStrategy}
                  className="inline-flex items-center gap-2 rounded-xl border border-gray-100 bg-white px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-gray-500 shadow-sm transition hover:bg-gray-50"
                >
                  <RefreshCcw className="h-4 w-4" />
                  Refresh
                </button>
                <button
                  onClick={handleCreateMissingLifecycle}
                  disabled={isCreatingLifecycle}
                  className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-white shadow-sm transition hover:bg-black disabled:opacity-50"
                >
                  <Sparkles className="h-4 w-4" />
                  {isCreatingLifecycle ? 'Creating' : 'Create Missing'}
                </button>
                <button
                  onClick={() => handleStrategyAction('run_lifecycle_automation_pulse')}
                  disabled={Boolean(strategyAction)}
                  className="inline-flex items-center gap-2 rounded-xl border border-gray-100 bg-white px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-gray-600 shadow-sm transition hover:bg-gray-50 disabled:opacity-50"
                >
                  <Activity className="h-4 w-4" />
                  {strategyAction === 'run_lifecycle_automation_pulse' ? 'Running' : 'Run Pulse'}
                </button>
                <button
                  onClick={handleOptimizeStrategy}
                  disabled={Boolean(strategyAction)}
                  className="inline-flex items-center gap-2 rounded-xl border border-gray-100 bg-white px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-gray-600 shadow-sm transition hover:bg-gray-50 disabled:opacity-50"
                >
                  <BarChart3 className="h-4 w-4" />
                  {strategyAction === 'optimize_lifecycle_strategy' ? 'Optimizing' : 'Optimize'}
                </button>
              </div>

              <div className="mt-10 grid gap-3 md:grid-cols-2">
                {(marketingStrategy?.funnelMap || []).map((stage: any) => (
                  <div key={stage.stage} className="rounded-2xl border border-gray-100 bg-gray-50 p-5">
                    <p className="text-[9px] font-black uppercase tracking-widest text-primary-600">{stage.stage?.replace('_', ' ')}</p>
                    <h4 className="mt-2 text-sm font-black text-gray-900">{stage.goal}</h4>
                    <p className="mt-2 text-xs font-bold leading-relaxed text-gray-500">{stage.conciergeAction}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-gray-100 bg-gray-900 p-10 text-white shadow-xl">
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-5 w-5 text-green-400" />
                <h4 className="text-sm font-black uppercase tracking-widest">Guardrails</h4>
              </div>
              <div className="mt-8 space-y-4">
                {(marketingStrategy?.guardrails || []).slice(0, 5).map((rule: string, i: number) => (
                  <div key={i} className="flex gap-3">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-400" />
                    <p className="text-xs font-bold leading-relaxed text-gray-300">{rule}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            {(marketingStrategy?.playbooks || []).map((playbook: any) => {
              const coverage = marketingStrategy?.coverage?.find((item: any) => item.playbookId === playbook.id);
              const isActive = coverage?.status === 'active';
              const isDraft = coverage?.status === 'draft';

              return (
                <div key={playbook.id} className="rounded-3xl border border-gray-100 bg-white p-8 shadow-sm">
                  <div className="flex items-start justify-between gap-6">
                    <div>
                      <div className="flex items-center gap-3">
                        <AdminBadge
                          label={coverage?.status || 'missing'}
                          type={isActive ? 'green' : isDraft ? 'amber' : 'gray'}
                        />
                        <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">
                          {playbook.lifecycleStage?.replace('_', ' ')}
                        </span>
                      </div>
                      <h4 className="mt-4 text-xl font-black text-gray-900">{playbook.name}</h4>
                      <p className="mt-3 text-sm font-bold leading-relaxed text-gray-500">{playbook.description}</p>
                    </div>
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary-50 text-primary-600">
                      <Target className="h-7 w-7" />
                    </div>
                  </div>

                  <div className="mt-8 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl bg-gray-50 p-4">
                      <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">Trigger</p>
                      <p className="mt-2 text-xs font-black text-gray-900">{playbook.triggerSummary}</p>
                    </div>
                    <div className="rounded-2xl bg-gray-50 p-4">
                      <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">Offer</p>
                      <p className="mt-2 text-xs font-black text-gray-900">{playbook.offerStrategy?.replace('_', ' ')}</p>
                    </div>
                    <div className="rounded-2xl bg-gray-50 p-4">
                      <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">Cadence</p>
                      <p className="mt-2 text-xs font-black text-gray-900">{playbook.steps?.length || 0} touches</p>
                    </div>
                  </div>

                  <div className="mt-8 space-y-3">
                    {(playbook.steps || []).map((step: any, i: number) => (
                      <div key={`${playbook.id}-${i}`} className="flex items-center gap-4 rounded-2xl border border-gray-100 p-4">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gray-900 text-[11px] font-black text-white">{i + 1}</div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-black text-gray-900">{step.subjectTemplate}</p>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                            {step.delayHours}h delay · {step.objective?.replace('_', ' ')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-8 flex items-center justify-between gap-6 border-t border-gray-50 pt-6">
                    <p className="text-xs font-bold leading-relaxed text-gray-500">{coverage?.recommendation || playbook.expectedOutcome}</p>
                    {isActive ? (
                      <button
                        onClick={() => handlePlaybookStatus(playbook.id, 'pause_playbook')}
                        disabled={isCreatingPlaybook === playbook.id}
                        className="shrink-0 rounded-2xl border border-gray-200 bg-white px-5 py-3 text-[10px] font-black uppercase tracking-widest text-gray-700 shadow-sm transition hover:border-gray-900 disabled:opacity-40"
                      >
                        {isCreatingPlaybook === playbook.id ? 'Pausing...' : 'Pause'}
                      </button>
                    ) : isDraft ? (
                      <button
                        onClick={() => handlePlaybookStatus(playbook.id, 'activate_playbook')}
                        disabled={isCreatingPlaybook === playbook.id}
                        className="shrink-0 rounded-2xl bg-gray-900 px-5 py-3 text-[10px] font-black uppercase tracking-widest text-white shadow-lg transition hover:bg-black disabled:opacity-40"
                      >
                        {isCreatingPlaybook === playbook.id ? 'Activating...' : 'Activate'}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleCreatePlaybook(playbook.id)}
                        disabled={isCreatingPlaybook === playbook.id}
                        className="shrink-0 rounded-2xl bg-gray-900 px-5 py-3 text-[10px] font-black uppercase tracking-widest text-white shadow-lg transition hover:bg-black disabled:opacity-40"
                      >
                        {isCreatingPlaybook === playbook.id ? 'Creating...' : 'Create Draft'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="rounded-3xl border border-gray-100 bg-white p-8 shadow-sm">
            <h4 className="text-sm font-black uppercase tracking-widest text-gray-900">World-Class Lifecycle Patterns Mirrored</h4>
            <div className="mt-6 grid gap-3 md:grid-cols-2">
              {(marketingStrategy?.industryPatterns || []).map((pattern: string, i: number) => (
                <div key={i} className="flex gap-3 rounded-2xl bg-gray-50 p-4">
                  <BarChart3 className="mt-0.5 h-4 w-4 shrink-0 text-primary-600" />
                  <p className="text-xs font-bold leading-relaxed text-gray-600">{pattern}</p>
                </div>
              ))}
            </div>
          </div>

          {optimizationReport && (
            <div className="rounded-3xl border border-gray-100 bg-white p-8 shadow-sm">
              <div className="flex items-start justify-between gap-6">
                <div>
                  <h4 className="text-sm font-black uppercase tracking-widest text-gray-900">Optimization Report</h4>
                  <p className="mt-2 text-xs font-bold text-gray-500">
                    Coverage {optimizationReport.scorecard?.coverageScore}% · Activation {optimizationReport.scorecard?.activationScore}% · Revenue/recipient ${((optimizationReport.scorecard?.revenuePerRecipient || 0) / 100).toFixed(2)}
                  </p>
                </div>
                <AdminBadge label={`${optimizationReport.recommendations?.length || 0} actions`} type="blue" />
              </div>
              <div className="mt-6 grid gap-3 md:grid-cols-2">
                {(optimizationReport.recommendations || []).slice(0, 6).map((item: any, i: number) => (
                  <div key={i} className="rounded-2xl bg-gray-50 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-[9px] font-black uppercase tracking-widest text-primary-600">{item.action?.replace(/_/g, ' ')}</p>
                      <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">{item.priority}</span>
                    </div>
                    <p className="mt-2 text-xs font-bold leading-relaxed text-gray-600">{item.reason}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-3xl border border-gray-100 bg-white p-8 shadow-sm">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div>
                <h4 className="text-sm font-black uppercase tracking-widest text-gray-900">Strategy-Wide Controls</h4>
                <p className="mt-2 max-w-2xl text-xs font-bold leading-relaxed text-gray-500">
                  Use these only after reviewing coverage, guardrails, and suppression rules.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => handleStrategyAction('activate_all_lifecycle_playbooks')}
                  disabled={Boolean(strategyAction)}
                  className="rounded-2xl bg-gray-900 px-5 py-3 text-[10px] font-black uppercase tracking-widest text-white shadow-lg transition hover:bg-black disabled:opacity-40"
                >
                  {strategyAction === 'activate_all_lifecycle_playbooks' ? 'Activating...' : 'Activate All'}
                </button>
                <button
                  onClick={() => handleStrategyAction('pause_all_lifecycle_playbooks')}
                  disabled={Boolean(strategyAction)}
                  className="rounded-2xl border border-gray-200 bg-white px-5 py-3 text-[10px] font-black uppercase tracking-widest text-gray-700 shadow-sm transition hover:border-gray-900 disabled:opacity-40"
                >
                  {strategyAction === 'pause_all_lifecycle_playbooks' ? 'Pausing...' : 'Pause All'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="max-w-4xl space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
           <div>
             <h3 className="text-3xl font-black text-gray-900 uppercase tracking-tight">Concierge Settings</h3>
             <p className="text-sm font-bold text-gray-400 mt-2">Configure how the automated concierge interacts with your customers.</p>
           </div>

           <div className="grid gap-8">
              {/* Bartering Configuration */}
              <div className="bg-white rounded-4xl border border-gray-100 p-12 shadow-sm space-y-10">
                 <div className="flex items-start justify-between">
                    <div className="flex gap-6">
                       <div className="h-14 w-14 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 shadow-sm border border-amber-100">
                         <Sparkles className="h-7 w-7" />
                       </div>
                       <div>
                         <h4 className="text-xl font-black text-gray-900">Conversational Bartering</h4>
                         <p className="text-sm font-bold text-gray-400 max-w-md">Allow customers to negotiate prices directly in the chat, mirroring a Facebook Marketplace experience.</p>
                       </div>
                    </div>
                    <div className="relative inline-flex items-center cursor-pointer">
                       <input 
                         type="checkbox" 
                         className="sr-only peer" 
                         checked={adminSettings.isBarteringEnabled} 
                         onChange={(e) => setAdminSettings({ ...adminSettings, isBarteringEnabled: e.target.checked })}
                       />
                       <div className="w-14 h-8 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-primary-600"></div>
                    </div>
                 </div>

                 <div className="grid gap-10 pt-10 border-t border-gray-50 md:grid-cols-2">
                    <div className="space-y-4">
                       <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Max Discount Limit</label>
                       <div className="flex items-center gap-4">
                          <input 
                            type="range" 
                            min="5" 
                            max="30" 
                            step="5" 
                            value={adminSettings.maxDiscountPercentage} 
                            onChange={(e) => setAdminSettings({ ...adminSettings, maxDiscountPercentage: parseInt(e.target.value) })}
                            className="flex-1 accent-primary-600" 
                          />
                          <span className="text-sm font-black text-gray-900 w-12 text-right">{adminSettings.maxDiscountPercentage}%</span>
                       </div>
                       <p className="text-[10px] font-bold text-gray-400">The absolute maximum the concierge can offer.</p>
                    </div>

                    <div className="space-y-4">
                       <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Negotiation Tone</label>
                       <select 
                         value={adminSettings.negotiationTone}
                         onChange={(e) => setAdminSettings({ ...adminSettings, negotiationTone: e.target.value })}
                         className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-sm font-black focus:ring-0 focus:border-gray-300 transition-all"
                       >
                          <option>Friendly & Approachable</option>
                          <option>Firm & Professional</option>
                          <option>Playful & Witty</option>
                       </select>
                    </div>

                    <div className="space-y-4">
                       <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Minimum Order Value</label>
                       <div className="relative">
                          <span className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 font-black text-sm">$</span>
                          <input 
                            type="number" 
                            value={adminSettings.minOrderValueForBarter} 
                            onChange={(e) => setAdminSettings({ ...adminSettings, minOrderValueForBarter: parseInt(e.target.value) })}
                            className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-10 pr-6 py-4 text-sm font-black focus:ring-0 focus:border-gray-300 transition-all" 
                          />
                       </div>
                    </div>
                 </div>
              </div>

              {/* Memory Configuration */}
              <div className="bg-white rounded-4xl border border-gray-100 p-12 shadow-sm space-y-10">
                 <div className="flex items-start justify-between">
                    <div className="flex gap-6">
                       <div className="h-14 w-14 bg-primary-50 rounded-2xl flex items-center justify-center text-primary-600 shadow-sm border border-primary-100">
                         <History className="h-7 w-7" />
                       </div>
                       <div>
                         <h4 className="text-xl font-black text-gray-900">Customer Memory</h4>
                         <p className="text-sm font-bold text-gray-400 max-w-md">Enable the concierge to remember past interactions and preferences for return customers.</p>
                       </div>
                    </div>
                    <div className="relative inline-flex items-center cursor-pointer">
                       <input 
                         type="checkbox" 
                         className="sr-only peer" 
                         checked={adminSettings.useMemory || true} 
                         onChange={(e) => setAdminSettings({ ...adminSettings, useMemory: e.target.checked })}
                       />
                       <div className="w-14 h-8 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-primary-600"></div>
                    </div>
                 </div>
              </div>
           </div>

           <div className="flex justify-end pt-8">
              <button 
                onClick={handleSaveSettings}
                disabled={isSavingSettings}
                className="px-12 py-5 bg-gray-900 text-white rounded-3xl text-xs font-black uppercase tracking-widest shadow-xl hover:bg-black transition-all active:scale-95 disabled:opacity-50"
              >
                {isSavingSettings ? 'Saving...' : 'Save Settings'}
              </button>
           </div>
        </div>
      )}
    </div>
  );
}
