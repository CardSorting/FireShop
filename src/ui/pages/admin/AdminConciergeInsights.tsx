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
  Target
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
  impact?: 'low' | 'medium' | 'high';
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
  isRepeatIssue?: boolean;
  repeatFrequency?: number;
  createdAt: string;
  transcript: Array<{ role: string; content: string }>;
  internalNotes?: string;
  events?: Array<{
    type: 'joined' | 'escalated' | 'note_added' | 'resolved' | 'analyzed' | 'reopened';
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
    'notes': true
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

  const handleResolve = (sessionId: string) => {
    toast('success', 'Issue resolved');
    setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, status: 'resolved' } : s));
    if (selectedSession?.id === sessionId) {
      setSelectedSession({ ...selectedSession, status: 'resolved' });
    }
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

  const RESPONSE_STATUS_LABELS = {
    'waiting_on_store': { label: 'Reply Needed', type: 'red' },
    'waiting_on_customer': { label: 'Waiting', type: 'amber' },
    'handled_by_concierge': { label: 'AI Handled', type: 'green' },
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <AdminPageHeader
        category="Operations"
        title="Support Desk"
        subtitle="Operational command center for customer friction and support intelligence."
        actions={
          <div className="flex gap-3">
             <button 
              onClick={fetchSessions}
              className="inline-flex items-center gap-2 rounded-xl bg-white border border-gray-100 px-4 py-2.5 text-xs font-black uppercase tracking-widest text-gray-500 hover:bg-gray-50 transition-all shadow-sm"
            >
              <RefreshCcw className="h-4 w-4" />
              Sync Workspace
            </button>
          </div>
        }
      />

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AdminMetricCard 
          label="Priority Issues" 
          value={needsAttention.length} 
          icon={Flag} 
          color={needsAttention.length > 0 ? 'warning' : 'success'} 
          description="Awaiting follow-up" 
        />
        <AdminMetricCard 
          label="Open Sessions" 
          value={sessions.filter(s => s.status !== 'resolved').length} 
          icon={MessageCircle} 
          color="primary" 
          description="Customer activity" 
        />
        <AdminMetricCard 
          label="Store Health" 
          value={`${Math.round((sessions.filter(s => s.sentiment === 'positive').length / (sessions.length || 1)) * 100)}%`} 
          icon={UserCheck} 
          color="success" 
          description="Positive sentiment" 
        />
        <AdminMetricCard 
          label="AI Efficiency" 
          value="78%" 
          icon={Zap} 
          color="info" 
          description="Autonomous resolutions" 
        />
      </section>

      {/* Primary Workspace Tabs */}
      <div className="border-b border-gray-100">
        <nav className="flex gap-10">
          {[
            { id: 'inbox', label: 'Inbound', icon: Inbox },
            { id: 'suggestions', label: 'Improvements', icon: Zap },
            { id: 'trends', label: 'Intelligence', icon: BarChart3 },
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
          {/* Triage List - Linear Style Scanability */}
          <div className="lg:col-span-4 flex flex-col gap-4 overflow-hidden">
            <div className="flex gap-2">
              {[
                { id: 'all', label: 'All' },
                { id: 'needs_attention', label: 'Needs Follow-up' },
                { id: 'resolved', label: 'Handled' },
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
                      {session.isRepeatIssue && (
                        <div className="px-1.5 py-0.5 bg-amber-50 text-amber-600 rounded-md text-[8px] font-black uppercase tracking-tighter border border-amber-100">
                          Repeat
                        </div>
                      )}
                    </div>
                    {session.responseStatus && (
                      <div className={`h-2 w-2 rounded-full ${session.responseStatus === 'waiting_on_store' ? 'bg-red-500 animate-pulse' : 'bg-gray-200'}`} />
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-[13px] font-black text-gray-900 truncate flex-1">{session.customerName}</h4>
                    {session.sentiment && (
                       <span className={`text-[10px] font-black uppercase tracking-widest ${SENTIMENT_COLORS[session.sentiment as keyof typeof SENTIMENT_COLORS]}`}>
                         {session.sentiment === 'positive' ? 'Positive' : session.sentiment}
                       </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 truncate mt-1 font-medium opacity-70">{session.summary || 'Awaiting initial signal...'}</p>
                </button>
              ))}
              {filteredSessions.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center p-12 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                   <Inbox className="h-8 w-8 text-gray-200 mb-4" />
                   <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Inbox Clear</p>
                </div>
              )}
            </div>
          </div>

          {/* Decision Workspace */}
          <div className="lg:col-span-8 overflow-hidden flex flex-col">
            {selectedSession ? (
              <div className="bg-white rounded-4xl border border-gray-100 shadow-2xl shadow-gray-200/50 flex-1 flex flex-col overflow-hidden animate-in fade-in slide-in-from-right-4 duration-500">
                {/* Header */}
                <div className="px-10 py-6 border-b border-gray-50 flex justify-between items-center bg-white/50 backdrop-blur-xl">
                  <div className="flex items-center gap-6">
                    <div className="h-14 w-14 rounded-3xl bg-gray-900 flex items-center justify-center text-white text-xl font-black shadow-xl shadow-gray-200">
                      {selectedSession.customerName.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-gray-900">{selectedSession.customerName}</h3>
                      <div className="flex items-center gap-3 mt-1">
                        <p className="text-xs font-bold text-gray-400">{selectedSession.customerEmail}</p>
                        <span className="w-1 h-1 bg-gray-300 rounded-full" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-primary-600">Active Session</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {selectedSession.status !== 'resolved' ? (
                      <button 
                        onClick={() => handleResolve(selectedSession.id)}
                        className="inline-flex items-center gap-2 rounded-2xl bg-gray-900 px-6 py-3.5 text-xs font-black uppercase tracking-widest text-white hover:bg-black transition-all shadow-xl shadow-gray-200 active:scale-95"
                      >
                        <CheckCircle2 className="h-4 w-4 text-green-400" />
                        Mark Resolved
                      </button>
                    ) : (
                      <div className="flex items-center gap-2 text-green-600 font-black text-[10px] uppercase tracking-widest px-6 py-3 bg-green-50 rounded-2xl border border-green-100">
                        <CheckCircle2 className="h-4 w-4" />
                        Resolved Issue
                      </div>
                    )}
                    <button className="p-3.5 rounded-2xl hover:bg-gray-50 text-gray-400 transition-colors border border-transparent hover:border-gray-100">
                      <MoreVertical className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {/* Workspace Content */}
                <div className="flex-1 flex overflow-hidden">
                  <div className="flex-1 overflow-y-auto p-10 space-y-12 styled-scrollbar relative">
                    
                    {/* Collapsible Intelligence Group */}
                    <section className="space-y-6">
                      <button 
                        onClick={() => toggleGroup('intelligence')}
                        className="flex items-center gap-3 w-full group"
                      >
                        <Sparkles className="h-5 w-5 text-primary-600" />
                        <h4 className="text-[11px] font-black uppercase tracking-widest text-gray-400 group-hover:text-gray-900 transition-colors">What We Found</h4>
                        {expandedGroups['intelligence'] ? <ChevronUp className="h-4 w-4 ml-auto text-gray-300" /> : <ChevronDown className="h-4 w-4 ml-auto text-gray-300" />}
                      </button>

                      {expandedGroups['intelligence'] && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-top-2 duration-300">
                           {selectedSession.summary ? (
                             <>
                               <div className="bg-gray-50 rounded-4xl p-10 border border-gray-100 group relative">
                                 <p className="text-lg font-bold text-gray-900 leading-relaxed italic">
                                   "{selectedSession.summary}"
                                 </p>
                                 <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                                    <button className="p-2.5 bg-white rounded-xl shadow-sm border border-gray-100 text-gray-400 hover:text-gray-900" title="Copy Summary">
                                      <Copy className="h-4 w-4" />
                                    </button>
                                 </div>
                               </div>

                               <div className="grid gap-6 md:grid-cols-2">
                                 <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
                                   <div className="flex items-center gap-2 mb-3">
                                      <User className="h-3.5 w-3.5 text-gray-400" />
                                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Customer Need</p>
                                   </div>
                                   <p className="text-sm font-bold text-gray-800">{selectedSession.customerNeed || 'Asking for assistance.'}</p>
                                 </div>
                                 <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm relative overflow-hidden group">
                                   <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-30 transition-opacity">
                                      <Zap className="h-10 w-10 text-primary-600" />
                                   </div>
                                   <div className="flex items-center gap-2 mb-3">
                                      <Zap className="h-3.5 w-3.5 text-primary-600" />
                                      <p className="text-[10px] font-black uppercase tracking-widest text-primary-600">Recommended Action</p>
                                   </div>
                                   <p className="text-sm font-bold text-gray-800">{selectedSession.recommendedAction || 'Monitor session.'}</p>
                                 </div>
                               </div>

                               {selectedSession.escalationReason && (
                                 <div className="bg-red-50 rounded-3xl p-8 border border-red-100 flex gap-6">
                                   <AlertCircle className="h-7 w-7 text-red-500 shrink-0 mt-0.5" />
                                   <div>
                                     <p className="text-[10px] font-black uppercase tracking-widest text-red-600 mb-2 flex items-center gap-1.5">
                                       <History className="h-3 w-3" /> Needs Follow-up
                                     </p>
                                     <p className="text-sm font-bold text-red-900 leading-relaxed">{selectedSession.escalationReason}</p>
                                   </div>
                                 </div>
                               )}

                               {selectedSession.evidenceQuotes && selectedSession.evidenceQuotes.length > 0 && (
                                 <div className="space-y-4">
                                   <p className="text-[10px] font-black uppercase tracking-widest text-gray-300 mb-4">Evidence from Chat</p>
                                   <div className="grid gap-3">
                                     {selectedSession.evidenceQuotes.map((quote, i) => (
                                       <div 
                                        key={i} 
                                        className="text-left text-xs text-gray-600 bg-white px-6 py-4 rounded-2xl border border-gray-50 font-bold italic flex items-center gap-4 group hover:border-gray-200 transition-all"
                                       >
                                         <CornerDownRight className="h-4 w-4 text-gray-200 group-hover:text-primary-400" />
                                         "{quote}"
                                       </div>
                                     ))}
                                   </div>
                                 </div>
                               )}
                             </>
                           ) : (
                             <div className="py-20 text-center bg-gray-50 rounded-4xl border-2 border-dashed border-gray-100">
                                <Loader2 className={`h-12 w-12 mx-auto text-gray-300 mb-6 ${isAnalyzing ? 'animate-spin' : ''}`} />
                                <h5 className="text-sm font-black text-gray-900 uppercase tracking-widest">Support Insights Pending</h5>
                                <p className="text-xs text-gray-400 mt-3 mb-8 max-w-xs mx-auto font-medium">We're extracting customer needs and recommended fixes from this conversation.</p>
                                <button 
                                  onClick={() => handleAnalyze(selectedSession.id)}
                                  disabled={isAnalyzing}
                                  className="inline-flex items-center gap-3 rounded-2xl bg-gray-900 px-10 py-4 text-xs font-black uppercase tracking-widest text-white hover:bg-black transition-all shadow-xl active:scale-95"
                                >
                                  {isAnalyzing ? 'Processing Intelligence...' : 'Analyze Now'}
                                </button>
                             </div>
                           )}
                        </div>
                      )}
                    </section>

                    {/* Collapsible Transcript Group */}
                    <section className="space-y-6">
                      <button 
                        onClick={() => toggleGroup('transcript')}
                        className="flex items-center gap-3 w-full group"
                      >
                        <MessageCircle className="h-5 w-5 text-gray-400" />
                        <h4 className="text-[11px] font-black uppercase tracking-widest text-gray-400 group-hover:text-gray-900 transition-colors">Conversation Timeline</h4>
                        {expandedGroups['transcript'] ? <ChevronUp className="h-4 w-4 ml-auto text-gray-300" /> : <ChevronDown className="h-4 w-4 ml-auto text-gray-300" />}
                      </button>

                      {expandedGroups['transcript'] && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
                          {selectedSession.transcript.map((msg, i) => (
                            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                              <div className={`max-w-[85%] p-5 rounded-3xl shadow-sm text-sm font-medium leading-relaxed ${
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

                    {/* Sticky Action Toolbar */}
                    <div className="sticky bottom-0 bg-white/80 backdrop-blur-xl p-4 rounded-4xl border border-gray-100 shadow-2xl flex items-center justify-center gap-4 animate-in slide-in-from-bottom-4">
                       <button className="flex items-center gap-2 px-5 py-3 rounded-xl hover:bg-gray-50 text-[10px] font-black uppercase tracking-widest text-gray-600 transition-all active:scale-95">
                         <Reply className="h-4 w-4" /> Reply Manually
                       </button>
                       <div className="h-6 w-px bg-gray-100" />
                       <button className="flex items-center gap-2 px-5 py-3 rounded-xl hover:bg-gray-50 text-[10px] font-black uppercase tracking-widest text-gray-600 transition-all active:scale-95">
                         <UserPlus className="h-4 w-4" /> Assign Agent
                       </button>
                       <div className="h-6 w-px bg-gray-100" />
                       <button className="flex items-center gap-2 px-5 py-3 rounded-xl hover:bg-gray-50 text-[10px] font-black uppercase tracking-widest text-gray-600 transition-all active:scale-95">
                         <Share2 className="h-4 w-4" /> Share Case
                       </button>
                    </div>
                  </div>

                  {/* Sidebar Panel */}
                  <div className="w-80 border-l border-gray-50 bg-gray-50/20 overflow-y-auto p-10 space-y-12 styled-scrollbar">
                    {/* Collapsible Customer Group */}
                    <section className="space-y-6">
                       <button 
                        onClick={() => toggleGroup('context')}
                        className="flex items-center gap-3 w-full group"
                       >
                         <h4 className="text-[11px] font-black uppercase tracking-widest text-gray-400 group-hover:text-gray-900 transition-colors">Customer Context</h4>
                         {expandedGroups['context'] ? <ChevronUp className="h-3 w-3 ml-auto text-gray-300" /> : <ChevronDown className="h-3 w-3 ml-auto text-gray-300" />}
                       </button>

                       {expandedGroups['context'] && (
                         <div className="space-y-3 animate-in fade-in duration-300">
                           <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-3">
                              <div className="flex justify-between items-center">
                                 <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Sentiment</span>
                                 <span className={`text-[10px] font-black uppercase tracking-widest ${SENTIMENT_COLORS[selectedSession.sentiment as keyof typeof SENTIMENT_COLORS]}`}>
                                   {selectedSession.sentiment || 'Neutral'}
                                 </span>
                              </div>
                              <div className="flex justify-between items-center">
                                 <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Urgency</span>
                                 <AdminBadge 
                                   label={selectedSession.urgency || 'Normal'} 
                                   type={selectedSession.urgency === 'high' ? 'red' : selectedSession.urgency === 'medium' ? 'amber' : 'gray'} 
                                 />
                              </div>
                              <div className="flex justify-between items-center">
                                 <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Confidence</span>
                                 <span className="text-[10px] font-black text-gray-900">{selectedSession.confidence || 'Medium'}</span>
                              </div>
                           </div>
                           
                           <div className="grid gap-2">
                             <button className="flex items-center gap-3 p-4 rounded-xl bg-white border border-gray-100 hover:border-gray-900 transition-all group">
                               <ShoppingBag className="h-4 w-4 text-gray-400" />
                               <span className="text-xs font-bold text-gray-700">View Cart</span>
                               <ArrowUpRight className="h-3 w-3 ml-auto text-gray-300" />
                             </button>
                             <button className="flex items-center gap-3 p-4 rounded-xl bg-white border border-gray-100 hover:border-gray-900 transition-all group">
                               <FileText className="h-4 w-4 text-gray-400" />
                               <span className="text-xs font-bold text-gray-700">Orders History</span>
                               <ArrowUpRight className="h-3 w-3 ml-auto text-gray-300" />
                             </button>
                           </div>
                         </div>
                       )}
                    </section>

                    {/* Internal Notes */}
                    <section className="space-y-6">
                       <button 
                        onClick={() => toggleGroup('notes')}
                        className="flex items-center gap-3 w-full group"
                       >
                         <h4 className="text-[11px] font-black uppercase tracking-widest text-gray-400 group-hover:text-gray-900 transition-colors">Team Collaboration</h4>
                         {expandedGroups['notes'] ? <ChevronUp className="h-3 w-3 ml-auto text-gray-300" /> : <ChevronDown className="h-3 w-3 ml-auto text-gray-300" />}
                       </button>

                       {expandedGroups['notes'] && (
                         <div className="space-y-4 animate-in fade-in duration-300">
                            <textarea 
                              placeholder="Private note for the team..."
                              className="w-full bg-white border border-gray-100 rounded-2xl p-5 text-sm font-medium focus:ring-4 focus:ring-gray-50 focus:border-gray-200 min-h-[160px] shadow-sm placeholder:text-gray-300"
                            ></textarea>
                            <button className="w-full py-4 bg-gray-100 text-gray-900 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-200 transition-all border border-gray-200 shadow-sm active:scale-95">
                              Post Note
                            </button>
                         </div>
                       )}
                    </section>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full rounded-4xl border-2 border-dashed border-gray-100 bg-white flex flex-col items-center justify-center p-20 text-center animate-in fade-in duration-1000">
                 <div className="h-28 w-28 bg-gray-50 rounded-4xl flex items-center justify-center mb-10 text-gray-200 shadow-inner">
                   <Inbox className="h-12 w-12" />
                 </div>
                 <h3 className="text-2xl font-black text-gray-900">Workspace Clear</h3>
                 <p className="text-sm font-bold text-gray-400 mt-4 max-w-sm mx-auto leading-relaxed">
                   Select an inbound conversation to extract support intelligence, review evidence, and optimize store operations.
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
               <h3 className="text-3xl font-black text-gray-900">Optimization Backlog</h3>
               <p className="text-sm font-bold text-gray-400 mt-2">Operational fixes detected from real customer struggles.</p>
             </div>
             <div className="bg-gray-100 px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-600">
                {totalSuggestions} Active Improvements
             </div>
           </div>
           
           <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
             {sessions.flatMap(s => s.suggestions || []).map((suggestion, i) => (
               <div key={i} className="bg-white rounded-4xl border border-gray-100 p-12 flex flex-col shadow-sm hover:shadow-2xl transition-all group relative overflow-hidden">
                 <div className="absolute top-0 right-0 h-40 w-40 bg-primary-50 rounded-full -mr-20 -mt-20 opacity-0 group-hover:opacity-100 transition-all duration-1000" />
                 
                 <div className="flex justify-between items-start mb-10 relative z-10">
                    <div className="h-14 w-14 bg-primary-50 rounded-2xl flex items-center justify-center text-primary-600 group-hover:bg-primary-600 group-hover:text-white transition-all shadow-sm">
                      <Zap className="h-7 w-7" />
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <AdminBadge label={`${suggestion.risk || 'Low'} Risk`} type={suggestion.risk === 'Low' ? 'green' : 'amber'} />
                      {suggestion.frequency && (
                        <span className="text-[9px] font-black text-primary-600 uppercase tracking-widest">Found in {suggestion.frequency} sessions</span>
                      )}
                    </div>
                 </div>

                 <h4 className="text-2xl font-black text-gray-900 mb-3 leading-tight relative z-10">{suggestion.action}</h4>
                 <p className="text-[11px] text-gray-300 font-black uppercase tracking-widest mb-10 relative z-10">Grounding: {suggestion.source}</p>
                 
                 <div className="space-y-10 pt-10 border-t border-gray-50 flex-1 relative z-10">
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-widest text-gray-400 mb-2 flex items-center gap-2">
                        <Target className="h-3 w-3" /> The Why
                      </p>
                      <p className="text-sm font-bold text-gray-700 leading-relaxed">{suggestion.why}</p>
                    </div>
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

                 <div className="mt-12 pt-10 border-t border-gray-50 relative z-10">
                    <button className="w-full py-5 bg-gray-900 text-white rounded-3xl text-xs font-black uppercase tracking-widest hover:bg-black transition-all shadow-2xl active:scale-95 flex items-center justify-center gap-3">
                      Adopt Recommendation
                      <FastForward className="h-4 w-4" />
                    </button>
                 </div>
               </div>
             ))}
             {totalSuggestions === 0 && (
               <div className="col-span-full py-40 text-center bg-gray-50 rounded-4xl border-2 border-dashed border-gray-100">
                  <Zap className="h-14 w-14 text-gray-200 mx-auto mb-8" />
                  <h4 className="text-xl font-black text-gray-400 uppercase tracking-widest">No Active Suggestions</h4>
                  <p className="text-sm font-bold text-gray-300 mt-3">We need more customer data to identify optimization patterns.</p>
               </div>
             )}
           </div>
        </div>
      )}

      {activeTab === 'trends' && (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
           {/* Store Health Digest */}
           <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              <div className="bg-white rounded-4xl border border-gray-100 p-12 shadow-sm col-span-2 space-y-10">
                 <div className="flex items-center gap-4">
                    <div className="h-14 w-14 bg-red-50 rounded-2xl flex items-center justify-center text-red-500 shadow-sm border border-red-100">
                      <Target className="h-7 w-7" />
                    </div>
                    <div>
                      <h4 className="text-xl font-black text-gray-900">Intelligence Digest</h4>
                      <p className="text-sm font-bold text-gray-400">Weekly Friction & Conversion blockers summary.</p>
                    </div>
                 </div>
                 
                 <div className="space-y-8">
                    {[
                      { label: 'Shipping Delay Anxiety', summary: 'Customers are confused about weekend delivery times on plushie pages.', impact: 'High' },
                      { label: 'Mobile Checkout Hesitation', summary: 'detected on Apple Pay transitions for guest users.', impact: 'Medium' },
                      { label: 'Sizing Confirmation', summary: 'Repeated questions on the new oversized collection sizing.', impact: 'High' },
                    ].map((item, i) => (
                      <div key={i} className="flex gap-6 group">
                         <div className="h-10 w-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-gray-900 group-hover:text-white transition-all shrink-0">
                            {i + 1}
                         </div>
                         <div>
                            <div className="flex items-center gap-3 mb-1">
                               <h5 className="text-sm font-black text-gray-900 uppercase tracking-tight">{item.label}</h5>
                               <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg ${item.impact === 'High' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'}`}>
                                 {item.impact} Impact
                               </span>
                            </div>
                            <p className="text-sm font-bold text-gray-500 leading-relaxed">{item.summary}</p>
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
                    <h3 className="text-3xl font-black mb-4">Concierge Maturity</h3>
                    <p className="text-sm text-gray-400 leading-relaxed font-medium">
                      AI is autonomously resolving <span className="text-white font-black">78.4%</span> of customer support inquiries this week.
                    </p>
                 </div>
                 
                 <div className="relative z-10 pt-16">
                    <div className="flex justify-between items-end mb-6">
                       <span className="text-[11px] font-black uppercase tracking-widest text-gray-500">Autonomous Resolution</span>
                       <span className="text-4xl font-black">78.4%</span>
                    </div>
                    <div className="h-4 w-full bg-white/10 rounded-full overflow-hidden flex shadow-inner p-1">
                       <div className="h-full bg-green-500 rounded-full shadow-[0_0_20px_rgba(34,197,94,0.6)]" style={{ width: '78.4%' }} />
                    </div>
                 </div>
                 <BarChart3 className="absolute -bottom-16 -right-16 h-80 w-80 text-white/5 rotate-12" />
              </div>
           </div>

           {/* Natural Language Insights */}
           <div className="grid gap-8 md:grid-cols-2">
              <div className="bg-primary-600 rounded-4xl p-12 text-white shadow-2xl shadow-primary-200">
                 <h4 className="text-[11px] font-black uppercase tracking-widest text-primary-200 mb-6 flex items-center gap-2">
                   <Sparkles className="h-4 w-4" /> Weekly Growth Insight
                 </h4>
                 <p className="text-lg font-bold leading-relaxed">
                   "We've detected that <span className="text-primary-100">14% of customers</span> are hesitating at checkout due to lack of weekend shipping info. Adding this single detail could increase weekly conversion by <span className="text-green-300 font-black">approx. 4.2%</span>."
                 </p>
                 <div className="mt-10 flex gap-4">
                    <button className="px-6 py-3 bg-white text-primary-700 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl active:scale-95">Take Action</button>
                    <button className="px-6 py-3 bg-primary-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-primary-800 transition-all">Review Cases</button>
                 </div>
              </div>
              
              <div className="bg-white rounded-4xl border border-gray-100 p-12 shadow-sm space-y-8">
                 <h4 className="text-[11px] font-black uppercase tracking-widest text-gray-300">Sentiment Distribution</h4>
                 <div className="space-y-6">
                    {[
                      { label: 'Positive Experience', percent: 68, color: 'bg-green-500' },
                      { label: 'Neutral/Inquiry', percent: 24, color: 'bg-gray-200' },
                      { label: 'Frustrated/Struggling', percent: 8, color: 'bg-amber-500' },
                    ].map((item, i) => (
                      <div key={i} className="space-y-2">
                         <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                            <span className="text-gray-900">{item.label}</span>
                            <span className="text-gray-400">{item.percent}%</span>
                         </div>
                         <div className="h-2 w-full bg-gray-50 rounded-full overflow-hidden">
                            <div className={`h-full ${item.color} rounded-full`} style={{ width: `${item.percent}%` }} />
                         </div>
                      </div>
                    ))}
                 </div>
                 <div className="pt-6 border-t border-gray-50">
                    <p className="text-[10px] font-bold text-gray-400 leading-relaxed italic">
                      "Sentiment has improved by 12% since the last fulfillment update."
                    </p>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
