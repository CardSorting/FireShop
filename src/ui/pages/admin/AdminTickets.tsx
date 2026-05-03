'use client';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Search, Filter, Plus, MoreVertical, 
  Clock, AlertCircle, CheckCircle2, User, 
  Users, ChevronRight, Tag, MessageSquare, 
  LayoutGrid, List, SlidersHorizontal, ArrowUpRight,
  Shield, Inbox, AlertTriangle, Zap, BarChart3, Settings,
  RotateCw, Sparkles, FilterX, MousePointer2
} from 'lucide-react';
import { useServices } from '../../hooks/useServices';
import { useAuth } from '../../hooks/useAuth';
import type { SupportTicket, TicketStatus, TicketPriority } from '@domain/models';
import { formatShortDate } from '@utils/formatters';
import { 
  AdminPageHeader, 
  AdminEmptyState, 
  SkeletonRow, 
  useToast, 
  useAdminPageTitle,
  AdminBadge 
} from '../../components/admin/AdminComponents';

type SupportViewId = 'my-open' | 'unassigned' | 'all-unresolved' | 'recently-updated' | 'sla-breached';

interface SupportView {
  id: SupportViewId;
  label: string;
  icon: any;
  color: string;
  count?: number;
}

export function AdminTickets() {
  useAdminPageTitle('Support Queue');
  const services = useServices();
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const { toast } = useToast();

  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeView, setActiveView] = useState<SupportViewId>('all-unresolved');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [health, setHealth] = useState({ slaCompliance: 0, unassignedRate: 0, totalActive: 0 });

  const VIEWS: SupportView[] = [
    { id: 'my-open', label: 'My open tickets', icon: User, color: 'text-blue-500', count: tickets.filter(t => t.assigneeId === currentUser?.id && t.status !== 'solved' && t.status !== 'closed').length },
    { id: 'unassigned', label: 'Unassigned tickets', icon: Inbox, color: 'text-amber-500', count: tickets.filter(t => !t.assigneeId).length },
    { id: 'all-unresolved', label: 'All unresolved', icon: MessageSquare, color: 'text-primary-500', count: tickets.filter(t => t.status !== 'solved' && t.status !== 'closed').length },
    { id: 'sla-breached', label: 'SLA Breached', icon: AlertTriangle, color: 'text-red-500', count: tickets.filter(t => {
        const deadline = t.slaDeadline || new Date(t.createdAt.getTime() + (24 * 60 * 60 * 1000));
        return deadline.getTime() < Date.now() && t.status !== 'solved' && t.status !== 'closed';
      }).length 
    },
    { id: 'recently-updated', label: 'Recently updated', icon: Clock, color: 'text-green-500' },
  ];

  const loadTickets = useCallback(async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true);
    setLoading(true);
    try {
      const [ticketResult, healthResult] = await Promise.all([
        services.ticketService.listTickets(),
        services.ticketService.getHealthMetrics()
      ]);
      setTickets(ticketResult || []);
      setHealth(healthResult);
    } catch (err) {
      toast('error', 'Failed to load support queue');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [services.ticketService, toast]);

  useEffect(() => {
    void loadTickets();
    // Simulate real-time updates every 30s
    const interval = setInterval(() => void loadTickets(true), 30000);
    return () => clearInterval(interval);
  }, [loadTickets]);

  const filteredTickets = useMemo(() => {
    let list = [...tickets];
    
    // Apply View Logic
    if (activeView === 'my-open') list = list.filter(t => t.assigneeId === currentUser?.id && t.status !== 'solved' && t.status !== 'closed');
    if (activeView === 'unassigned') list = list.filter(t => !t.assigneeId);
    if (activeView === 'all-unresolved') list = list.filter(t => t.status !== 'solved' && t.status !== 'closed');
    if (activeView === 'sla-breached') list = list.filter(t => {
      const deadline = t.slaDeadline || new Date(t.createdAt.getTime() + (24 * 60 * 60 * 1000));
      return deadline.getTime() < Date.now() && t.status !== 'solved' && t.status !== 'closed';
    });
    if (activeView === 'recently-updated') list.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

    if (!query) return list;
    const needle = query.toLowerCase();
    return list.filter(t => 
      t.subject.toLowerCase().includes(needle) || 
      t.customerEmail.toLowerCase().includes(needle) ||
      t.id.toLowerCase().includes(needle)
    );
  }, [tickets, query, activeView, currentUser]);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleBatchUpdate = async (updates: Partial<SupportTicket>) => {
    if (selectedIds.length === 0) return;
    try {
      await services.ticketService.batchUpdateTickets(selectedIds, updates);
      toast('success', `Updated ${selectedIds.length} tickets`);
      setSelectedIds([]);
      await loadTickets();
    } catch (err) {
      toast('error', 'Batch update failed');
    }
  };

  const handleAcceptNext = async () => {
    const nextUnassigned = tickets.find(t => !t.assigneeId);
    if (!nextUnassigned) {
      toast('success', 'Queue is empty! Great job.');
      return;
    }
    try {
      await services.ticketService.updateTicketProperties(nextUnassigned.id, { 
        assigneeId: currentUser?.id,
        assigneeName: currentUser?.displayName,
        status: 'open'
      });
      toast('success', 'Ticket assigned to you');
      router.push(`/admin/tickets/${nextUnassigned.id}`);
    } catch (err) {
      toast('error', 'Failed to assign ticket');
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] animate-in fade-in duration-500">
      <AdminPageHeader
        title="Support Dashboard"
        subtitle="Industrial-grade ticket orchestration and triage"
        actions={
          <div className="flex items-center gap-3">
             <button 
               onClick={() => void loadTickets(true)}
               disabled={isRefreshing}
               className="p-2.5 rounded-xl border bg-white hover:bg-gray-50 transition-all text-gray-400 hover:text-gray-900 shadow-sm disabled:opacity-50"
             >
               <RotateCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
             </button>
             <button 
               onClick={handleAcceptNext}
               className="flex items-center gap-2 rounded-xl bg-primary-600 px-5 py-2.5 text-[10px] font-black uppercase tracking-widest text-white transition hover:bg-primary-700 shadow-lg shadow-primary-500/20"
             >
               <Zap className="h-3.5 w-3.5" />
               Accept Next
             </button>
          </div>
        }
      />

      <div className="mt-8 flex flex-1 gap-8 overflow-hidden">
        {/* ── CRM Navigation Sidebar (Zendesk-Style) ── */}
        <aside className="w-64 flex flex-col gap-8 shrink-0">
           <div>
              <h4 className="px-3 mb-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Views</h4>
              <nav className="space-y-1">
                {VIEWS.map((view) => (
                  <button
                    key={view.id}
                    onClick={() => setActiveView(view.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all group ${
                      activeView === view.id 
                        ? 'bg-white text-gray-900 shadow-sm border border-gray-100' 
                        : 'text-gray-500 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                       <view.icon className={`h-4 w-4 ${activeView === view.id ? view.color : 'text-gray-400 group-hover:text-gray-600'}`} />
                       <span className="text-[11px] font-bold">{view.label}</span>
                    </div>
                    {view.count !== undefined && view.count > 0 && (
                      <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${
                        activeView === view.id ? 'bg-primary-50 text-primary-600' : 'bg-gray-100 text-gray-400'
                      }`}>
                        {view.count}
                      </span>
                    )}
                  </button>
                ))}
              </nav>
           </div>

           <div>
              <h4 className="px-3 mb-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Tools</h4>
              <nav className="space-y-1">
                 <button 
                   onClick={() => router.push('/admin/support/macros')}
                   className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-all"
                 >
                    <Zap className="h-4 w-4" />
                    <span className="text-[11px] font-bold">Manage Macros</span>
                 </button>
                 <button className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-all opacity-50 cursor-not-allowed">
                    <BarChart3 className="h-4 w-4" />
                    <span className="text-[11px] font-bold">Support Reporting</span>
                 </button>
                 <button className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-all opacity-50 cursor-not-allowed">
                    <Settings className="h-4 w-4" />
                    <span className="text-[11px] font-bold">CRM Settings</span>
                 </button>
              </nav>
           </div>

           {/* Health Indicators */}
           <div className="mt-auto p-5 rounded-4xl bg-gray-900 text-white relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-30 transition-opacity">
                <Shield className="h-12 w-12" />
              </div>
              <h5 className="text-[9px] font-black uppercase tracking-widest text-white/40 mb-4">System Health</h5>
              <div className="space-y-4">
                 <div>
                    <div className="flex justify-between text-[10px] font-bold mb-1.5">
                       <span>SLA Compliance</span>
                       <span>{health.slaCompliance}%</span>
                    </div>
                    <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                       <div className="h-full bg-green-400 transition-all duration-1000" style={{ width: `${health.slaCompliance}%` }} />
                    </div>
                 </div>
                 <div>
                    <div className="flex justify-between text-[10px] font-bold mb-1.5">
                       <span>Unassigned Rate</span>
                       <span>{health.unassignedRate}%</span>
                    </div>
                    <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                       <div className="h-full bg-amber-400 transition-all duration-1000" style={{ width: `${health.unassignedRate}%` }} />
                    </div>
                 </div>
                 <div className="pt-2">
                    <p className="text-[10px] font-bold text-white/60">
                      <span className="text-white">{health.totalActive}</span> active tickets
                    </p>
                 </div>
              </div>
           </div>
        </aside>

        {/* ── Main Work Queue ── */}
        <div className="flex-1 flex flex-col bg-white border border-gray-100 rounded-[2.5rem] overflow-hidden shadow-2xl shadow-gray-200/50">
          
          <div className="flex items-center justify-between p-4 border-b bg-gray-50/50">
            <div className="relative flex-1 max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search queue (ID, email, subject)..."
                className="w-full rounded-xl border bg-white py-2 pl-9 pr-3 text-xs font-bold focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition"
              />
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{filteredTickets.length} Tickets Found</span>
              <div className="h-4 w-px bg-gray-200" />
              <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-100 text-[10px] font-black uppercase tracking-widest text-gray-500 transition-all">
                <SlidersHorizontal className="h-3.5 w-3.5" />
                Filters
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-auto scrollbar-hide">
            <table className="w-full border-collapse">
              <thead className="sticky top-0 bg-white/80 backdrop-blur-md z-10">
                <tr className="border-b text-left">
                  <th className="p-4 w-10">
                    <input 
                      type="checkbox" 
                      onChange={(e) => setSelectedIds(e.target.checked ? filteredTickets.map(t => t.id) : [])}
                      checked={selectedIds.length === filteredTickets.length && filteredTickets.length > 0}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                  </th>
                  <th className="p-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Requester</th>
                  <th className="p-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Subject</th>
                  <th className="p-4 text-[10px] font-black uppercase tracking-widest text-gray-400">SLA</th>
                  <th className="p-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Status</th>
                  <th className="p-4 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Assignee</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [1, 2, 3, 4, 5].map(i => <SkeletonRow key={i} columns={6} />)
                ) : filteredTickets.map((ticket) => {
                   const deadline = ticket.slaDeadline || new Date(ticket.createdAt.getTime() + (24 * 60 * 60 * 1000));
                   const isOverdue = deadline.getTime() < Date.now() && ticket.status !== 'solved' && ticket.status !== 'closed';
                   const hoursLeft = Math.floor((deadline.getTime() - Date.now()) / (60 * 60 * 1000));
                   
                   return (
                    <tr 
                      key={ticket.id}
                      onClick={() => router.push(`/admin/tickets/${ticket.id}`)}
                      className={`group border-b hover:bg-gray-50/80 transition-all cursor-pointer ${selectedIds.includes(ticket.id) ? 'bg-primary-50/30' : ''}`}
                    >
                      <td className="p-4" onClick={(e) => { e.stopPropagation(); toggleSelect(ticket.id); }}>
                        <input 
                          type="checkbox" 
                          checked={selectedIds.includes(ticket.id)}
                          onChange={() => {}} 
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                           <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-black text-gray-500">
                             {ticket.customerName?.[0] || <User className="h-3.5 w-3.5" />}
                           </div>
                           <div className="max-w-[140px]">
                              <p className="text-xs font-black text-gray-900 truncate">{ticket.customerName || 'Customer'}</p>
                              <p className="text-[10px] font-bold text-gray-400 truncate">{ticket.customerEmail}</p>
                           </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col gap-1">
                          <p className="text-xs font-bold text-gray-800 line-clamp-1">{ticket.subject}</p>
                          <div className="flex gap-1.5">
                             {ticket.tags?.slice(0, 2).map(tag => (
                               <span key={tag} className="text-[9px] font-black uppercase tracking-widest text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-md">{tag}</span>
                             ))}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                           <div className={`h-1.5 w-1.5 rounded-full ${isOverdue ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]' : hoursLeft < 4 ? 'bg-amber-500' : 'bg-blue-500'}`} />
                           <span className={`text-[10px] font-black uppercase tracking-widest ${isOverdue ? 'text-red-600' : 'text-gray-500'}`}>
                              {isOverdue ? 'Breached' : `${hoursLeft}h`}
                           </span>
                        </div>
                      </td>
                      <td className="p-4">
                         <AdminBadge 
                           type={
                             ticket.status === 'new' ? 'blue' : 
                             ticket.status === 'open' ? 'green' : 
                             ticket.status === 'pending' ? 'amber' : 
                             'gray'
                           }
                           label={ticket.status}
                         />
                      </td>
                      <td className="p-4 text-right">
                        {ticket.assigneeName ? (
                          <div className="flex items-center justify-end gap-2">
                             <span className="text-[10px] font-bold text-gray-600">{ticket.assigneeName}</span>
                             <div className="h-6 w-6 rounded-full bg-primary-50 flex items-center justify-center text-[9px] font-black text-primary-600 border border-primary-100">
                                {ticket.assigneeName[0]}
                             </div>
                          </div>
                        ) : (
                          <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest italic">Unassigned</span>
                        )}
                      </td>
                    </tr>
                   );
                })}
              </tbody>
            </table>
            {!loading && filteredTickets.length === 0 && (
              <AdminEmptyState
                title="Queue Clear"
                description="No tickets match your current view filters"
                icon={CheckCircle2}
              />
            )}
          </div>
        </div>
      </div>

      {/* ── Bulk Operations Bar (Zendesk-Style) ── */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-12 left-1/2 -translate-x-1/2 bg-gray-900 text-white rounded-3xl shadow-2xl px-8 py-4 flex items-center gap-8 animate-in slide-in-from-bottom-8 z-50">
           <div className="flex items-center gap-4 pr-8 border-r border-white/10">
              <div className="h-8 w-8 rounded-full bg-primary-600 flex items-center justify-center text-xs font-black shadow-lg shadow-primary-500/20">
                {selectedIds.length}
              </div>
              <p className="text-xs font-black uppercase tracking-widest">Tickets Selected</p>
           </div>
           
           <div className="flex items-center gap-2">
              <button 
                onClick={() => handleBatchUpdate({ status: 'solved' })}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-green-500 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest flex items-center gap-2"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                Mark Solved
              </button>
              <button 
                onClick={() => handleBatchUpdate({ priority: 'urgent' })}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-red-500 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest flex items-center gap-2"
              >
                <AlertCircle className="h-3.5 w-3.5" />
                Make Urgent
              </button>
              <button 
                onClick={() => handleBatchUpdate({ assigneeId: currentUser?.id, assigneeName: currentUser?.displayName })}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-primary-600 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest flex items-center gap-2"
              >
                <User className="h-3.5 w-3.5" />
                Assign to Me
              </button>
           </div>

           <button 
             onClick={() => setSelectedIds([])}
             className="ml-4 p-2 hover:bg-white/10 rounded-xl transition-colors text-white/40 hover:text-white"
           >
             <FilterX className="h-4 w-4" />
           </button>
        </div>
      )}
    </div>
  );
}
