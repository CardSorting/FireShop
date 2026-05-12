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
  Check
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
  createdAt: string;
  transcript: Array<{ role: string; content: string }>;
  internalNotes?: string;
  operatorFeedback?: Array<{
    suggestionIndex: number;
    feedback: 'helpful' | 'not_useful';
    note?: string;
  }>;
  events?: Array<{
    type: 'joined' | 'escalated' | 'note_added' | 'resolved' | 'analyzed' | 'reopened' | 'outcome_tracked';
    timestamp: any;
    label: string;
    description?: string;
    operator?: string;
  }>;
}

export function AdminConciergeInsights() {
  useAdminPageTitle('Support Workspace');
  const { toast } = useToast();
  const [sessions, setSessions] = useState<ConciergeSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedSession, setSelectedSession] = useState<ConciergeSession | null>(null);
  const [activeTab, setActiveTab] = useState<'inbox' | 'suggestions' | 'trends'>('inbox');
  const [filter, setFilter] = useState('all');
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    'intelligence': true,
    'transcript': true,
    'context': true,
    'notes': true,
    'activity': true
  });

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

  const handleUpdateSession = async (sessionId: string, updates: Partial<ConciergeSession>) => {
    try {
      // Mock update for now - in production this would be an API call
      setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, ...updates } : s));
      if (selectedSession?.id === sessionId) {
        setSelectedSession({ ...selectedSession, ...updates });
      }
      toast('success', 'Session updated');
    } catch (error) {
      toast('error', 'Failed to update session');
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
      toast('success', 'Conversation analyzed');
      await fetchSessions();
    } catch (error) {
      toast('error', 'Failed to analyze conversation');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleResolveWithOutcome = (sessionId: string, outcome: 'resolved' | 'escalated' | 'converted') => {
    handleUpdateSession(sessionId, { 
      status: 'resolved', 
      customerOutcome: outcome,
      operatorOutcome: 'resolved_manually'
    });
    toast('success', `Issue marked as ${outcome}`);
  };

  const handleSuggestionFeedback = (sessionId: string, index: number, feedback: 'helpful' | 'not_useful') => {
    const session = sessions.find(s => s.id === sessionId);
    const existingFeedback = session?.operatorFeedback || [];
    const newFeedback = [...existingFeedback, { suggestionIndex: index, feedback }];
    handleUpdateSession(sessionId, { operatorFeedback: newFeedback });
    toast('success', 'Thank you for your feedback');
  };

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  if (isLoading) return <SkeletonPage />;

  const analyzedSessions = sessions.filter(s => s.status === 'analyzed' || s.status === 'resolved');
  const totalSuggestions = analyzedSessions.reduce((acc, s) => acc + (s.suggestions?.length || 0), 0);
  const needsAttention = sessions.filter(s => s.escalationNeeded && s.status !== 'resolved');

  const filteredSessions = sessions.filter(s => {
    if (filter === 'all') return true;
    if (filter === 'needs_attention') return s.escalationNeeded && s.status !== 'resolved';
    if (filter === 'resolved') return s.status === 'resolved';
    return true;
  });

  const SENTIMENT_COLORS = {
    'positive': 'text-green-600',
    'neutral': 'text-gray-400',
    'frustrated': 'text-amber-600',
    'angry': 'text-red-600',
  };

  const OUTCOME_LABELS = {
    'resolved': { label: 'Resolved', type: 'green' },
    'escalated': { label: 'Escalated', type: 'amber' },
    'abandoned': { label: 'Abandoned', type: 'red' },
    'converted': { label: 'Converted', type: 'primary' },
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <AdminPageHeader
        category="Support Strategy"
        title="Command Center"
        subtitle="Validate outcomes and act on store intelligence through real-world support feedback loops."
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

      {/* Outcome-Focused Metrics */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AdminMetricCard 
          label="Conversion Help" 
          value={sessions.filter(s => s.customerOutcome === 'converted').length} 
          icon={ShoppingBag} 
          color="success" 
          description="Aided by concierge" 
        />
        <AdminMetricCard 
          label="Support Burden" 
          value={`${Math.round((sessions.filter(s => s.status === 'resolved' && !s.escalationNeeded).length / (sessions.filter(s => s.status === 'resolved').length || 1)) * 100)}%`} 
          icon={Zap} 
          color="primary" 
          description="Autonomous resolution" 
        />
        <AdminMetricCard 
          label="Open Loop Rate" 
          value={needsAttention.length} 
          icon={Activity} 
          color={needsAttention.length > 5 ? 'warning' : 'info'} 
          description="Awaiting operator" 
        />
        <AdminMetricCard 
          label="Store Sentiment" 
          value={`${Math.round((sessions.filter(s => s.sentiment === 'positive').length / (sessions.length || 1)) * 100)}%`} 
          icon={ThumbsUp} 
          color="success" 
          description="Weekly average" 
        />
      </section>

      <div className="border-b border-gray-100">
        <nav className="flex gap-10">
          {[
            { id: 'inbox', label: 'Inbox', icon: Inbox },
            { id: 'suggestions', label: 'Optimization', icon: Target },
            { id: 'trends', label: 'Digest', icon: FileText },
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
              {tab.id === 'inbox' && needsAttention.length > 0 && (
                <span className="ml-1 bg-red-600 text-white px-2 py-0.5 rounded-full text-[9px] font-black">
                  {needsAttention.length}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'inbox' && (
        <div className="grid gap-8 lg:grid-cols-12 h-[calc(100vh-440px)] min-h-[600px]">
          {/* Scannable Triage List */}
          <div className="lg:col-span-4 flex flex-col gap-4 overflow-hidden">
            <div className="flex gap-2">
              {[
                { id: 'all', label: 'All Activity' },
                { id: 'needs_attention', label: 'Needs Follow-up' },
                { id: 'resolved', label: 'Resolved' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id)}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    filter === f.id 
                      ? 'bg-gray-900 text-white shadow-xl' 
                      : 'bg-white text-gray-400 border border-gray-50 hover:border-gray-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="flex-1 space-y-1.5 overflow-y-auto pr-2 styled-scrollbar">
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
                      <span className="text-[10px] font-black text-gray-400">
                        {new Date(session.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {session.customerOutcome && (
                        <div className={`px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase tracking-tighter border ${
                          session.customerOutcome === 'converted' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-gray-50 text-gray-400 border-gray-100'
                        }`}>
                          {session.customerOutcome}
                        </div>
                      )}
                    </div>
                    {session.escalationNeeded && session.status !== 'resolved' && (
                      <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse" />
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-[13px] font-black text-gray-900 truncate flex-1">{session.customerName}</h4>
                    {session.sentiment && (
                       <span className={`text-[10px] font-black uppercase tracking-widest ${SENTIMENT_COLORS[session.sentiment as keyof typeof SENTIMENT_COLORS]}`}>
                         {session.sentiment}
                       </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 truncate mt-1 font-medium opacity-60">{session.summary || 'Awaiting signal...'}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Decision Workspace */}
          <div className="lg:col-span-8 overflow-hidden flex flex-col">
            {selectedSession ? (
              <div className="bg-white rounded-4xl border border-gray-100 shadow-2xl shadow-gray-200/30 flex-1 flex flex-col overflow-hidden animate-in fade-in slide-in-from-right-4 duration-500">
                {/* Header with Collaborative Actions */}
                <div className="px-10 py-6 border-b border-gray-50 flex justify-between items-center bg-white/50 backdrop-blur-xl">
                  <div className="flex items-center gap-6">
                    <div className="h-14 w-14 rounded-3xl bg-gray-900 flex items-center justify-center text-white text-xl font-black shadow-xl shadow-gray-200">
                      {selectedSession.customerName.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-gray-900">{selectedSession.customerName}</h3>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{selectedSession.customerEmail}</span>
                        {selectedSession.assignedOperator ? (
                          <span className="text-[9px] font-black text-primary-600 bg-primary-50 px-2 py-0.5 rounded-lg border border-primary-100">
                             Assigned to {selectedSession.assignedOperator}
                          </span>
                        ) : (
                          <button 
                            onClick={() => handleUpdateSession(selectedSession.id, { assignedOperator: 'Me' })}
                            className="text-[9px] font-black text-gray-400 hover:text-gray-900 uppercase tracking-widest border border-dashed border-gray-200 px-2 py-0.5 rounded-lg"
                          >
                            Assign to Me
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="relative group">
                       <button className="inline-flex items-center gap-2 rounded-2xl bg-gray-900 px-6 py-3.5 text-xs font-black uppercase tracking-widest text-white hover:bg-black transition-all shadow-xl active:scale-95">
                         Mark Outcome
                         <ChevronDown className="h-4 w-4" />
                       </button>
                       <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-100 rounded-2xl shadow-2xl p-2 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-all z-20">
                          {[
                            { id: 'resolved', label: 'Resolved Issue', icon: CheckCircle2 },
                            { id: 'converted', label: 'Customer Converted', icon: ShoppingBag },
                            { id: 'escalated', label: 'Escalated Manually', icon: Flag },
                          ].map(outcome => (
                            <button 
                              key={outcome.id}
                              onClick={() => handleResolveWithOutcome(selectedSession.id, outcome.id as any)}
                              className="w-full text-left p-3 rounded-xl hover:bg-gray-50 flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-gray-600 hover:text-gray-900"
                            >
                              <outcome.icon className="h-4 w-4" />
                              {outcome.label}
                            </button>
                          ))}
                       </div>
                    </div>
                    <button className="p-3.5 rounded-2xl hover:bg-gray-50 text-gray-400 border border-transparent hover:border-gray-100 transition-all">
                      <MoreVertical className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                <div className="flex-1 flex overflow-hidden">
                  <div className="flex-1 overflow-y-auto p-10 space-y-12 styled-scrollbar relative">
                    
                    {/* Collapsible Intelligence & Truth */}
                    <section className="space-y-6">
                      <div className="flex items-center justify-between">
                        <button 
                          onClick={() => toggleGroup('intelligence')}
                          className="flex items-center gap-3 group"
                        >
                          <Sparkles className="h-5 w-5 text-primary-600" />
                          <h4 className="text-[11px] font-black uppercase tracking-widest text-gray-400 group-hover:text-gray-900 transition-colors">Support Intelligence</h4>
                          {expandedGroups['intelligence'] ? <ChevronUp className="h-4 w-4 ml-auto text-gray-300" /> : <ChevronDown className="h-4 w-4 ml-auto text-gray-300" />}
                        </button>
                        <div className="flex items-center gap-2">
                           <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest">Grounding: High</span>
                           <ShieldCheck className="h-3 w-3 text-green-500" />
                        </div>
                      </div>

                      {expandedGroups['intelligence'] && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-top-2 duration-300">
                           {selectedSession.summary ? (
                             <>
                               <div className="bg-gray-50 rounded-4xl p-10 border border-gray-100 group relative">
                                 <p className="text-lg font-bold text-gray-900 leading-relaxed italic">
                                   "{selectedSession.summary}"
                                 </p>
                                 <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                                    <button className="p-2.5 bg-white rounded-xl shadow-sm border border-gray-100 text-gray-400 hover:text-gray-900" title="Copy Case Summary">
                                      <Copy className="h-4 w-4" />
                                    </button>
                                 </div>
                               </div>

                               <div className="grid gap-6 md:grid-cols-2">
                                 <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm space-y-4">
                                   <div className="flex items-center gap-2">
                                      <Target className="h-3.5 w-3.5 text-gray-400" />
                                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Customer Goal</p>
                                   </div>
                                   <p className="text-sm font-bold text-gray-800">{selectedSession.customerNeed || 'Help with a store inquiry.'}</p>
                                   <div className="pt-4 border-t border-gray-50">
                                      <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest mb-1">Evidence</p>
                                      <p className="text-xs text-gray-500 italic">"Detected from opening message"</p>
                                   </div>
                                 </div>
                                 <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm space-y-4">
                                   <div className="flex items-center gap-2">
                                      <Zap className="h-3.5 w-3.5 text-primary-600" />
                                      <p className="text-[10px] font-black uppercase tracking-widest text-primary-600">Recommended Next Step</p>
                                   </div>
                                   <p className="text-sm font-bold text-gray-800">{selectedSession.recommendedAction || 'Monitor conversation.'}</p>
                                   <div className="pt-4 border-t border-gray-50 flex items-center justify-between">
                                      <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest">Confidence: {selectedSession.confidence || 'High'}</span>
                                      <button className="text-[9px] font-black text-primary-600 hover:underline">Why this action?</button>
                                   </div>
                                 </div>
                               </div>

                               {selectedSession.escalationReason && (
                                 <div className="bg-red-50 rounded-3xl p-8 border border-red-100 flex gap-6 relative overflow-hidden group">
                                   <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                      <Flag className="h-16 w-16 text-red-600" />
                                   </div>
                                   <AlertCircle className="h-7 w-7 text-red-500 shrink-0 mt-0.5" />
                                   <div className="relative z-10">
                                     <p className="text-[10px] font-black uppercase tracking-widest text-red-600 mb-2">Escalation Signal</p>
                                     <p className="text-sm font-bold text-red-900 leading-relaxed">{selectedSession.escalationReason}</p>
                                   </div>
                                 </div>
                               )}
                             </>
                           ) : (
                             <div className="py-20 text-center bg-gray-50 rounded-4xl border-2 border-dashed border-gray-100">
                                <Loader2 className={`h-12 w-12 mx-auto text-gray-200 mb-6 ${isAnalyzing ? 'animate-spin' : ''}`} />
                                <h5 className="text-sm font-black text-gray-400 uppercase tracking-widest">Grounding Intelligence...</h5>
                                <button 
                                  onClick={() => handleAnalyze(selectedSession.id)}
                                  className="mt-8 inline-flex items-center gap-3 rounded-2xl bg-gray-900 px-10 py-4 text-xs font-black uppercase tracking-widest text-white hover:bg-black transition-all shadow-xl active:scale-95"
                                >
                                  Run Analysis Pass
                                </button>
                             </div>
                           )}
                        </div>
                      )}
                    </section>

                    {/* Transcript Group */}
                    <section className="space-y-6">
                      <button 
                        onClick={() => toggleGroup('transcript')}
                        className="flex items-center gap-3 w-full group"
                      >
                        <MessageSquare className="h-5 w-5 text-gray-400" />
                        <h4 className="text-[11px] font-black uppercase tracking-widest text-gray-400 group-hover:text-gray-900 transition-colors">Transcript Evidence</h4>
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

                    {/* Internal Activity & Collaboration Feed */}
                    <section className="space-y-6">
                      <button 
                        onClick={() => toggleGroup('activity')}
                        className="flex items-center gap-3 w-full group"
                      >
                        <Activity className="h-5 w-5 text-gray-400" />
                        <h4 className="text-[11px] font-black uppercase tracking-widest text-gray-400 group-hover:text-gray-900 transition-colors">Internal Activity Feed</h4>
                        {expandedGroups['activity'] ? <ChevronUp className="h-4 w-4 ml-auto text-gray-300" /> : <ChevronDown className="h-4 w-4 ml-auto text-gray-300" />}
                      </button>

                      {expandedGroups['activity'] && (
                        <div className="space-y-4 animate-in fade-in duration-300 pl-4 border-l-2 border-gray-50">
                           {selectedSession.events?.map((event, i) => (
                             <div key={i} className="flex gap-4 group">
                                <div className="h-8 w-8 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 shrink-0">
                                  {event.type === 'escalated' ? <Flag className="h-4 w-4 text-red-500" /> : <Bell className="h-4 w-4" />}
                                </div>
                                <div>
                                   <p className="text-[11px] font-black text-gray-900 uppercase tracking-tight">{event.label}</p>
                                   <p className="text-[10px] font-bold text-gray-400 mt-0.5">{event.description}</p>
                                </div>
                             </div>
                           ))}
                           <div className="flex gap-4">
                              <div className="h-8 w-8 rounded-xl bg-gray-900 flex items-center justify-center text-white shrink-0">
                                <User className="h-4 w-4" />
                              </div>
                              <div className="flex-1">
                                 <input 
                                   placeholder="Add a team note..." 
                                   className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2 text-xs font-medium focus:ring-0 focus:border-gray-300 transition-all"
                                 />
                              </div>
                           </div>
                        </div>
                      )}
                    </section>
                  </div>

                  {/* Sidebar Panel */}
                  <div className="w-80 border-l border-gray-50 bg-gray-50/20 overflow-y-auto p-10 space-y-12 styled-scrollbar">
                    {/* Customer Identity Group */}
                    <section className="space-y-6">
                       <h4 className="text-[11px] font-black uppercase tracking-widest text-gray-400">Context Snapshot</h4>
                       <div className="space-y-3">
                          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                             <div className="flex justify-between items-center">
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Sentiment</span>
                                <span className={`text-[10px] font-black uppercase tracking-widest ${SENTIMENT_COLORS[selectedSession.sentiment as keyof typeof SENTIMENT_COLORS]}`}>
                                  {selectedSession.sentiment || 'Neutral'}
                                </span>
                             </div>
                             <div className="flex justify-between items-center">
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Goal Status</span>
                                <span className="text-[10px] font-black text-gray-900 uppercase tracking-widest">{selectedSession.status}</span>
                             </div>
                             <div className="pt-4 border-t border-gray-50 grid grid-cols-2 gap-2">
                                <button className="p-3 bg-gray-50 rounded-xl hover:bg-gray-100 flex flex-col items-center gap-1 transition-all">
                                   <ShoppingBag className="h-4 w-4 text-gray-400" />
                                   <span className="text-[8px] font-black uppercase tracking-widest text-gray-500">Cart</span>
                                </button>
                                <button className="p-3 bg-gray-50 rounded-xl hover:bg-gray-100 flex flex-col items-center gap-1 transition-all">
                                   <Clock className="h-4 w-4 text-gray-400" />
                                   <span className="text-[8px] font-black uppercase tracking-widest text-gray-500">Orders</span>
                                </button>
                             </div>
                          </div>
                       </div>
                    </section>

                    {/* Operational Feedback Loop */}
                    <section className="space-y-6">
                       <h4 className="text-[11px] font-black uppercase tracking-widest text-gray-400">Workflow Validation</h4>
                       <div className="space-y-4">
                          <p className="text-[10px] font-bold text-gray-500 leading-relaxed">
                            How useful were the system's recommendations for this case?
                          </p>
                          <div className="flex gap-3">
                             <button className="flex-1 py-3 bg-white border border-gray-100 rounded-2xl hover:border-green-500 hover:text-green-600 transition-all flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest group shadow-sm">
                                <ThumbsUp className="h-3 w-3 group-hover:scale-110 transition-transform" /> Helpful
                             </button>
                             <button className="flex-1 py-3 bg-white border border-gray-100 rounded-2xl hover:border-red-500 hover:text-red-600 transition-all flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest group shadow-sm">
                                <ThumbsDown className="h-3 w-3 group-hover:scale-110 transition-transform" /> Not Useful
                             </button>
                          </div>
                       </div>
                    </section>

                    {/* Resolution Summary */}
                    {selectedSession.status === 'resolved' && (
                      <section className="bg-gray-900 rounded-3xl p-8 text-white space-y-4 animate-in slide-in-from-bottom-4">
                         <div className="flex items-center gap-3">
                            <CheckCircle2 className="h-5 w-5 text-green-400" />
                            <h4 className="text-[11px] font-black uppercase tracking-widest text-gray-400">Resolution Truth</h4>
                         </div>
                         <p className="text-xs font-bold text-gray-300 leading-relaxed">
                           This case was resolved as <span className="text-white">"{selectedSession.customerOutcome}"</span> by the team.
                         </p>
                         <button className="w-full py-3 bg-white/10 hover:bg-white/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">Reopen Case</button>
                      </section>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full rounded-4xl border-2 border-dashed border-gray-100 bg-white flex flex-col items-center justify-center p-20 text-center animate-in fade-in duration-1000">
                 <div className="h-28 w-28 bg-gray-50 rounded-4xl flex items-center justify-center mb-10 text-gray-200 shadow-inner">
                   <Inbox className="h-12 w-12" />
                 </div>
                 <h3 className="text-2xl font-black text-gray-900">Workspace Quiet</h3>
                 <p className="text-sm font-bold text-gray-400 mt-4 max-w-sm mx-auto leading-relaxed">
                   Select a customer session to review support intelligence and track operational outcomes.
                 </p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'suggestions' && (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
           <div className="flex justify-between items-end px-4">
             <div>
               <h3 className="text-3xl font-black text-gray-900">Optimization Feedback</h3>
               <p className="text-sm font-bold text-gray-400 mt-2">Validated store improvements grounded in real customer evidence.</p>
             </div>
             <div className="flex items-center gap-4">
               <div className="bg-green-50 px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-green-700 border border-green-100">
                  92% Suggestions Helpful
               </div>
             </div>
           </div>
           
           <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
             {sessions.flatMap((s, sIdx) => (s.suggestions || []).map((suggestion, i) => (
               <div key={`${sIdx}-${i}`} className="bg-white rounded-4xl border border-gray-100 p-12 flex flex-col shadow-sm hover:shadow-2xl transition-all group relative overflow-hidden">
                 <div className="absolute top-0 right-0 h-40 w-40 bg-primary-50 rounded-full -mr-20 -mt-20 opacity-0 group-hover:opacity-100 transition-all duration-1000" />
                 
                 <div className="flex justify-between items-start mb-10 relative z-10">
                    <div className="h-14 w-14 bg-primary-50 rounded-2xl flex items-center justify-center text-primary-600 group-hover:bg-primary-600 group-hover:text-white transition-all shadow-sm">
                      <Target className="h-7 w-7" />
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {suggestion.impact && (
                        <div className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border ${
                          suggestion.impact === 'conversion' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-primary-50 text-primary-600 border-primary-100'
                        }`}>
                          {suggestion.impact} Impact
                        </div>
                      )}
                      <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest">Grounding: {suggestion.source}</span>
                    </div>
                 </div>

                 <h4 className="text-2xl font-black text-gray-900 mb-3 leading-tight relative z-10">{suggestion.action}</h4>
                 <p className="text-sm font-bold text-gray-500 leading-relaxed mb-10 relative z-10">"{suggestion.why}"</p>
                 
                 <div className="space-y-10 pt-10 border-t border-gray-50 flex-1 relative z-10">
                    <div className="grid grid-cols-2 gap-4">
                       <div className="bg-gray-50 p-5 rounded-2xl border border-gray-50">
                          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Outcome</p>
                          <p className="text-xs font-bold text-gray-700">{suggestion.expectedOutcome}</p>
                       </div>
                       <div className="bg-gray-50 p-5 rounded-2xl border border-gray-50">
                          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Confidence</p>
                          <p className={`text-xs font-black ${suggestion.confidence === 'High' ? 'text-green-600' : 'text-amber-600'}`}>{suggestion.confidence}</p>
                       </div>
                    </div>
                 </div>

                 <div className="mt-12 pt-10 border-t border-gray-50 relative z-10 flex gap-4">
                    <button className="flex-1 py-5 bg-gray-900 text-white rounded-3xl text-xs font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl active:scale-95">
                      Accept
                    </button>
                    <button className="flex-1 py-5 bg-white border border-gray-100 text-gray-400 rounded-3xl text-xs font-black uppercase tracking-widest hover:border-gray-900 hover:text-gray-900 transition-all active:scale-95">
                      Dismiss
                    </button>
                 </div>
               </div>
             )))}
           </div>
        </div>
      )}

      {activeTab === 'trends' && (
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
                      <p className="text-sm font-bold text-gray-400">Natural-language summary of store health and customer friction.</p>
                    </div>
                 </div>
                 
                 <div className="space-y-10">
                    {[
                      { 
                        title: 'Checkout Hesitation Detected', 
                        desc: 'Customers are repeatedly asking about weekend shipping on plushie product pages before adding to cart.', 
                        action: 'Add a "Weekend Delivery Guarantee" banner to plushie variants.', 
                        type: 'conversion' 
                      },
                      { 
                        title: 'Fulfillment Frustration Normalizing', 
                        desc: 'Sentiment regarding shipping delays has improved by 14% since the last status update.', 
                        action: 'Maintain current communication cadence.', 
                        type: 'loyalty' 
                      },
                      { 
                        title: 'Sizing Ambiguity', 
                        desc: '8 sessions this week required manual escalation for oversized collection fit questions.', 
                        action: 'Update sizing guide for the "Big Bees" collection.', 
                        type: 'support_burden' 
                      },
                    ].map((item, i) => (
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
                                 {item.type.replace('_', ' ')}
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
                    <div className="h-16 w-16 bg-white/10 rounded-[2rem] flex items-center justify-center mb-10 backdrop-blur-md border border-white/10">
                      <ShieldCheck className="h-8 w-8 text-green-400" />
                    </div>
                    <h3 className="text-3xl font-black mb-4">Trust Dashboard</h3>
                    <p className="text-sm text-gray-400 leading-relaxed font-medium">
                      AI resolution accuracy is trending <span className="text-white font-black">94.2%</span> based on operator outcome tracking.
                    </p>
                 </div>
                 
                 <div className="relative z-10 pt-16">
                    <div className="flex justify-between items-end mb-6">
                       <span className="text-[11px] font-black uppercase tracking-widest text-gray-500">System Accuracy</span>
                       <span className="text-4xl font-black">94.2%</span>
                    </div>
                    <div className="h-4 w-full bg-white/10 rounded-full overflow-hidden flex shadow-inner p-1">
                       <div className="h-full bg-green-500 rounded-full shadow-[0_0_20px_rgba(34,197,94,0.6)]" style={{ width: '94.2%' }} />
                    </div>
                 </div>
                 <BarChart3 className="absolute -bottom-16 -right-16 h-80 w-80 text-white/5 rotate-12" />
              </div>
           </div>

           {/* Natural Language Observations */}
           <div className="grid gap-8 md:grid-cols-2">
              <div className="bg-primary-600 rounded-4xl p-12 text-white shadow-2xl shadow-primary-200 flex flex-col justify-between">
                 <div>
                    <h4 className="text-[11px] font-black uppercase tracking-widest text-primary-200 mb-6 flex items-center gap-2">
                      <Sparkles className="h-4 w-4" /> Strategic Observation
                    </h4>
                    <p className="text-lg font-bold leading-relaxed italic">
                      "Shipping questions decreased by 18% this week after updating delivery messaging. Conversion on affected pages improved by 3.4%."
                    </p>
                 </div>
                 <div className="mt-10 flex gap-4">
                    <button className="px-6 py-3 bg-white text-primary-700 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl active:scale-95">Download Digest</button>
                    <button className="px-6 py-3 bg-primary-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-primary-800 transition-all">Review Impact</button>
                 </div>
              </div>
              
              <div className="bg-white rounded-4xl border border-gray-100 p-12 shadow-sm space-y-8">
                 <h4 className="text-[11px] font-black uppercase tracking-widest text-gray-300">Sentiment Velocity</h4>
                 <div className="space-y-10">
                    {[
                      { label: 'Conversion Intent', percent: 74, color: 'bg-green-500', trend: 'up' },
                      { label: 'Support Friction', percent: 18, color: 'bg-red-500', trend: 'down' },
                      { label: 'Uncertainty/Ambiguity', percent: 8, color: 'bg-gray-200', trend: 'down' },
                    ].map((item, i) => (
                      <div key={i} className="space-y-4">
                         <div className="flex justify-between items-end">
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-900">{item.label}</span>
                            <div className="flex items-center gap-2">
                               <span className="text-xs font-black text-gray-400">{item.percent}%</span>
                               <span className={`text-[8px] font-black uppercase tracking-widest ${item.trend === 'up' ? 'text-green-600' : 'text-primary-600'}`}>
                                 {item.trend === 'up' ? '▲ Improving' : '▼ Decreasing'}
                               </span>
                            </div>
                         </div>
                         <div className="h-2 w-full bg-gray-50 rounded-full overflow-hidden">
                            <div className={`h-full ${item.color} rounded-full`} style={{ width: `${item.percent}%` }} />
                         </div>
                      </div>
                    ))}
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
