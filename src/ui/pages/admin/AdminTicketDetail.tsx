'use client';
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  ArrowLeft, MessageSquare, Clock, AlertCircle, CheckCircle2, 
  Send, User, Mail, Package, Receipt, ExternalLink, MoreVertical,
  History, Shield, Loader2, Search, Sparkles, Tag, Users, HelpCircle,
  AlertTriangle, Calendar, Plus, X, ChevronDown, ChevronUp, FileText, Activity,
  PackageCheck, DollarSign, ArrowRight, RotateCw
} from 'lucide-react';
import { useServices } from '../../hooks/useServices';
import { useAuth } from '../../hooks/useAuth';
import type { SupportTicket, TicketMessage, TicketStatus, TicketPriority, SupportMacro, TicketType, Order } from '@domain/models';
import { formatShortDate, formatFullDateTime } from '@utils/formatters';
import { 
  AdminPageHeader, 
  SkeletonRow, 
  useToast, 
  useAdminPageTitle 
} from '../../components/admin/AdminComponents';
import Link from 'next/link';

export function AdminTicketDetail() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const services = useServices();
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  useAdminPageTitle(`Ticket #${id?.slice(0, 8).toUpperCase()}`);

  const [ticket, setTicket] = useState<SupportTicket | null>(null);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [activeTab, setActiveTab] = useState<'conversation' | 'activity'>('conversation');
  const [isInternal, setIsInternal] = useState(false);
  
  const [localProps, setLocalProps] = useState<Partial<SupportTicket> | null>(null);
  const [isSavingProps, setIsSavingProps] = useState(false);
  const [newTag, setNewTag] = useState('');
  
  const [macros, setMacros] = useState<SupportMacro[]>([]);
  const [macroQuery, setMacroQuery] = useState('');
  const [showMacros, setShowMacros] = useState(false);
  const [customerStats, setCustomerStats] = useState<{ total: number; resolved: number; spend: number } | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [viewers, setViewers] = useState<{ id: string; name: string }[]>([]);
  const controllerRef = useRef<AbortController | null>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  const loadTicketData = useCallback(async () => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    if (isMounted.current) setLoading(true);
    try {
      const result = await services.ticketService.getTicket(id);
      if (!controller.signal.aborted && isMounted.current) {
        if (!result) throw new Error('Ticket not found');
        
        setTicket(result);
        setLocalProps({
          status: result.status,
          priority: result.priority,
          type: result.type,
          assigneeId: result.assigneeId,
          assigneeName: result.assigneeName,
          tags: result.tags || []
        });

        // PRODUCTION HARDENING: Real context fetching
        const [m, summary] = await Promise.all([
          services.ticketService.getMacros(),
          services.ticketService.getCustomerSummary(result.userId)
        ]);
        
        if (isMounted.current) {
          setMacros(m);
          setRecentOrders(summary.recentOrders);
          setCustomerStats({
            total: summary.totalTickets,
            resolved: summary.resolvedCount,
            spend: summary.totalSpend
          });
        }
      }
    } catch (err) {
      if (isMounted.current && !controller.signal.aborted) {
        toast('error', err instanceof Error ? err.message : 'Failed to load ticket');
      }
    } finally {
      if (!controller.signal.aborted && isMounted.current) {
        setLoading(false);
      }
    }
  }, [id, services, toast]);

  useEffect(() => {
    void loadTicketData();
    return () => controllerRef.current?.abort();
  }, [loadTicketData]);

  useEffect(() => {
    if (activeTab === 'conversation' && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeTab, ticket?.messages]);

  const handleSendReply = async () => {
    if (!reply.trim()) return;
    setIsSending(true);
    try {
      const visibility = isInternal ? 'internal' : 'public';
      await services.ticketService.addMessage(id, reply, currentUser?.id, 'agent', visibility);
      if (isMounted.current) {
        setReply('');
        toast('success', isInternal ? 'Internal note added' : 'Reply sent');
        await loadTicketData();
      }
    } catch (err) {
      if (isMounted.current) {
        toast('error', 'Failed to send message');
      }
    } finally {
      if (isMounted.current) {
        setIsSending(false);
      }
    }
  };

  const [isOtherAgentViewing, setIsOtherAgentViewing] = useState(false);

  const handleApplyMacro = (macro: SupportMacro) => {
    let content = macro.content;
    
    // Industrial Placeholder Engine
    const placeholders: Record<string, string> = {
      '{{customer.name}}': ticket?.customerName || 'Customer',
      '{{customer.first_name}}': ticket?.customerName?.split(' ')[0] || 'there',
      '{{customer.email}}': ticket?.customerEmail || '',
      '{{ticket.id}}': ticket?.id.slice(0, 8).toUpperCase() || '',
      '{{agent.name}}': currentUser?.displayName || 'Support Agent',
      '{{order.id}}': ticket?.orderId ? `#${ticket.orderId.slice(0, 8).toUpperCase()}` : 'N/A'
    };

    Object.entries(placeholders).forEach(([key, val]) => {
      content = content.replace(new RegExp(key, 'g'), val);
    });

    setReply(prev => (prev ? prev + '\n' + content : content));
    setShowMacros(false);
    toast('success', `Applied macro: ${macro.name}`);
  };

  // PRODUCTION HARDENING: Real Heartbeat / Collision Detection
  useEffect(() => {
    if (!ticket || !currentUser) return;

    const performHeartbeat = async () => {
      try {
        const res = await services.ticketService.sendHeartbeat(ticket.id, currentUser.id, currentUser.displayName);
        if (isMounted.current) {
          setViewers(res.viewers);
        }
      } catch (e) { /* silent */ }
    };

    performHeartbeat();
    const interval = setInterval(performHeartbeat, 10000); // 10s heartbeat
    return () => clearInterval(interval);
  }, [ticket?.id, currentUser?.id, services.ticketService]);

  const saveProperties = async () => {
    if (!localProps) return;
    setIsSavingProps(true);
    try {
      await services.ticketService.updateTicketProperties(id, localProps);
      if (isMounted.current) {
        toast('success', 'Properties updated');
        await loadTicketData();
      }
    } catch (err) {
      if (isMounted.current) {
        toast('error', 'Failed to update properties');
      }
    } finally {
      if (isMounted.current) {
        setIsSavingProps(false);
      }
    }
  };

  const addTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newTag.trim() && localProps) {
      if (!localProps.tags?.includes(newTag.trim())) {
        setLocalProps({ ...localProps, tags: [...(localProps.tags || []), newTag.trim()] });
      }
      setNewTag('');
      e.preventDefault();
    }
  };

  const removeTag = (tag: string) => {
    if (localProps) {
      setLocalProps({ ...localProps, tags: localProps.tags?.filter(t => t !== tag) });
    }
  };

  const getSLAInfo = useMemo(() => {
    if (!ticket) return null;
    if (ticket.status === 'solved' || ticket.status === 'closed') {
      return { label: 'Achieved', color: 'text-green-500', bg: 'bg-green-50', percent: 100 };
    }
    
    const deadline = ticket.slaDeadline || new Date(ticket.createdAt.getTime() + (24 * 60 * 60 * 1000));
    const now = new Date();
    const diff = deadline.getTime() - now.getTime();
    const totalSLA = 24 * 60 * 60 * 1000;
    const elapsed = totalSLA - Math.max(0, diff);
    const percent = Math.min(100, (elapsed / totalSLA) * 100);

    if (diff < 0) {
      const hours = Math.abs(Math.floor(diff / (60 * 60 * 1000)));
      return { label: `${hours}h Breached`, color: 'text-red-600', bg: 'bg-red-50', percent: 100 };
    }

    const hoursLeft = Math.floor(diff / (60 * 60 * 1000));
    const color = hoursLeft < 4 ? 'text-red-500' : hoursLeft < 12 ? 'text-amber-500' : 'text-blue-500';
    return { label: `${hoursLeft}h left`, color, bg: color.replace('text', 'bg').replace('500', '50'), percent };
  }, [ticket]);

  if (loading || !ticket || !localProps) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] animate-in fade-in duration-500">
      
      {/* ── Sub-Header Command Bar ── */}
      <div className="flex items-center justify-between py-4 border-b border-gray-100 mb-6">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => router.push('/admin/tickets')}
            className="p-2 rounded-xl border bg-white hover:bg-gray-50 transition-all text-gray-400 hover:text-gray-900 shadow-sm"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
             <div className="flex items-center gap-3">
                 <h1 className="text-xl font-black text-gray-900 tracking-tight">
                   #{ticket.id.slice(0, 8).toUpperCase()} <span className="text-gray-400 ml-2 font-medium">{ticket.subject}</span>
                 </h1>
                 {viewers.length > 0 && (
                   <div className="flex -space-x-1.5 overflow-hidden">
                     {viewers.map((v: { id: string; name: string }) => (
                       <div 
                         key={v.id} 
                         title={`${v.name} is also viewing`}
                         className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-amber-50 border border-amber-100 text-amber-600 animate-in fade-in slide-in-from-top-1 duration-500"
                       >
                          <Users className="h-3 w-3" />
                          <span className="text-[9px] font-black uppercase tracking-widest">{v.name}</span>
                       </div>
                     ))}
                   </div>
                 )}
             </div>
             <div className="flex items-center gap-3 mt-1">
               <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-primary-600 cursor-pointer transition-colors">{ticket.customerEmail}</span>
               <span className="text-gray-300">•</span>
               <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Via Online Store</span>
               <span className="text-gray-300">•</span>
               <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Requested {formatShortDate(ticket.createdAt.toString())}</span>
             </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
           <div className="flex items-center bg-gray-100 p-1 rounded-xl">
             <button 
               onClick={() => setActiveTab('conversation')}
               className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'conversation' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
             >
               Conversation
             </button>
             <button 
               onClick={() => setActiveTab('activity')}
               className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'activity' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
             >
               Activity Feed
             </button>
           </div>
           <button 
             onClick={saveProperties}
             disabled={isSavingProps}
             className="px-6 py-2.5 rounded-xl bg-gray-900 text-white text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg shadow-black/10 disabled:opacity-50"
           >
             {isSavingProps ? 'Updating...' : 'Update Ticket'}
           </button>
        </div>
      </div>

      <div className="flex-1 flex gap-8 overflow-hidden">
        {/* ── Main content Area ── */}
        <div className="flex-1 flex flex-col bg-white border border-gray-100 rounded-[2.5rem] overflow-hidden shadow-2xl shadow-gray-200/50">
          
          {activeTab === 'conversation' ? (
            <>
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-10 bg-[#fdfdfe] scrollbar-hide">
                {ticket.messages.map((msg) => {
                  const isAgent = msg.senderType === 'agent';
                  const isSystem = msg.senderType === 'system';
                  const isInternalMsg = msg.visibility === 'internal';
                  
                  if (isSystem) return null;

                  return (
                    <div key={msg.id} className="flex gap-6 group">
                      <div className={`h-10 w-10 rounded-2xl shrink-0 flex items-center justify-center text-[10px] font-black shadow-sm ${
                        isAgent ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {isAgent ? 'PM' : (ticket.customerName?.[0] || 'C')}
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-black text-gray-900">
                              {isAgent ? (isInternalMsg ? 'Internal Note' : 'Support Agent') : (ticket.customerName || ticket.customerEmail)}
                            </span>
                            {isInternalMsg && (
                              <span className="text-[8px] font-black uppercase tracking-[0.2em] bg-amber-100 text-amber-700 px-2 py-0.5 rounded">Private</span>
                            )}
                          </div>
                          <span className="text-[10px] font-bold text-gray-300 group-hover:text-gray-400 transition-colors">
                            {formatFullDateTime(msg.createdAt.toString())}
                          </span>
                        </div>
                        <div className={`text-sm leading-relaxed p-4 rounded-3xl ${
                          isInternalMsg 
                            ? 'bg-amber-50/50 border border-amber-100 text-amber-900 italic' 
                            : isAgent 
                              ? 'bg-gray-50 text-gray-800' 
                              : 'bg-white border border-gray-100 text-gray-800 shadow-sm'
                        }`}>
                          {msg.content}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Reply Box */}
              {ticket.status !== 'closed' && (
                <div className="p-6 border-t bg-gray-50/30">
                  <div className="bg-white rounded-4xl border border-gray-100 shadow-xl overflow-hidden">
                    <div className="flex items-center gap-1 px-4 py-3 border-b bg-gray-50/50">
                       <button 
                         onClick={() => setIsInternal(false)}
                         className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${!isInternal ? 'bg-primary-600 text-white shadow-lg' : 'text-gray-400 hover:text-gray-600'}`}
                       >
                         Public Reply
                       </button>
                       <button 
                         onClick={() => setIsInternal(true)}
                         className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isInternal ? 'bg-amber-600 text-white shadow-lg' : 'text-gray-400 hover:text-gray-600'}`}
                       >
                         Internal Note
                       </button>
                       <div className="h-4 w-px bg-gray-200 mx-2" />
                       
                       <div className="relative">
                          <button 
                            onClick={() => setShowMacros(!showMacros)}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-gray-100 text-[10px] font-black uppercase tracking-widest text-gray-500 transition-all"
                          >
                            <Sparkles className="h-3 w-3 text-primary-500" />
                            Macros
                            <ChevronDown className={`h-3 w-3 transition-transform ${showMacros ? 'rotate-180' : ''}`} />
                          </button>

                          {showMacros && (
                            <div className="absolute bottom-full mb-3 left-0 w-80 bg-white rounded-2xl shadow-2xl border p-2 z-50 animate-in slide-in-from-bottom-2">
                              <div className="relative mb-3">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400" />
                                <input 
                                  autoFocus
                                  value={macroQuery}
                                  onChange={e => setMacroQuery(e.target.value)}
                                  placeholder="Search macros..."
                                  className="w-full bg-gray-50 rounded-xl pl-8 pr-4 py-2 text-xs font-bold outline-none border border-transparent focus:border-primary-100"
                                />
                              </div>
                              <div className="max-h-60 overflow-y-auto scrollbar-hide">
                                 {Array.from(new Set(macros.map(m => m.category))).map(cat => {
                                   const catMacros = macros.filter(m => m.category === cat && (m.name.toLowerCase().includes(macroQuery.toLowerCase()) || m.content.toLowerCase().includes(macroQuery.toLowerCase())));
                                   if (catMacros.length === 0) return null;
                                   return (
                                     <div key={cat} className="mb-4">
                                       <h5 className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-300 px-3 mb-2">{cat}</h5>
                                       <div className="space-y-1">
                                          {catMacros.map(m => (
                                            <button
                                              key={m.id}
                                              onClick={() => handleApplyMacro(m)}
                                              className="w-full text-left px-3 py-2 rounded-xl hover:bg-primary-50 group transition-all"
                                            >
                                              <p className="text-xs font-bold text-gray-700 group-hover:text-primary-700">{m.name}</p>
                                              <p className="text-[10px] text-gray-400 line-clamp-1">{m.content}</p>
                                            </button>
                                          ))}
                                       </div>
                                     </div>
                                   );
                                 })}
                              </div>
                            </div>
                          )}
                       </div>
                    </div>

                    <textarea 
                      value={reply}
                      onChange={e => setReply(e.target.value)}
                      placeholder={isInternal ? "Type a private internal note..." : "Type your message to the customer..."}
                      className="w-full h-40 p-6 text-sm font-medium outline-none resize-none leading-relaxed"
                    />

                    <div className="px-6 py-4 border-t flex items-center justify-between bg-gray-50/50">
                       <span className="text-[10px] font-bold text-gray-400">Press Cmd+Enter to send</span>
                       <button 
                         onClick={handleSendReply}
                         disabled={isSending || !reply.trim()}
                         className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-white text-[10px] font-black uppercase tracking-widest transition-all shadow-lg disabled:opacity-50 ${
                           isInternal ? 'bg-amber-600 shadow-amber-500/20 hover:bg-amber-700' : 'bg-primary-600 shadow-primary-500/20 hover:bg-primary-700'
                         }`}
                       >
                         {isSending ? <RotateCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                         {isInternal ? 'Add Internal Note' : 'Send Reply'}
                       </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 overflow-y-auto p-12 scrollbar-hide">
              <div className="max-w-2xl mx-auto space-y-8">
                 {ticket.messages.filter(m => m.senderType === 'system' || m.visibility === 'internal').reverse().map((msg) => (
                    <div key={msg.id} className="relative pl-12 pb-10 group">
                       <div className="absolute left-0 top-0 h-8 w-8 rounded-full bg-white border-2 border-gray-100 flex items-center justify-center z-10 group-hover:border-primary-500 transition-colors">
                          {msg.senderType === 'system' ? <History className="h-4 w-4 text-blue-500" /> : <Shield className="h-4 w-4 text-amber-500" />}
                       </div>
                       <div className="absolute left-4 top-8 bottom-0 w-px bg-gray-100" />
                       <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{formatFullDateTime(msg.createdAt.toString())}</p>
                       <p className="text-sm font-bold text-gray-900 leading-relaxed">{msg.content}</p>
                       <p className="text-[10px] text-gray-400 font-medium mt-1">Logged by {msg.senderType === 'system' ? 'System Orchestrator' : 'Support Agent'}</p>
                    </div>
                 ))}
                 <div className="text-center py-10">
                    <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">End of History</p>
                 </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Sidebars (Properties & Context) ── */}
        <aside className="w-80 flex flex-col gap-6 overflow-y-auto pr-2 pb-10 scrollbar-hide">
            
            {/* SLA Monitor */}
            {getSLAInfo && (
              <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
                 <div className="flex items-center justify-between mb-4">
                   <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                     <Clock className="h-3.5 w-3.5" />
                     SLA Status
                   </h3>
                   <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${getSLAInfo.bg} ${getSLAInfo.color}`}>
                     {getSLAInfo.label}
                   </span>
                 </div>
                 <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-1000 ${getSLAInfo.color.replace('text', 'bg')}`} 
                      style={{ width: `${getSLAInfo.percent}%` }}
                    />
                 </div>
              </div>
            )}

            {/* Customer Profile & Lifetime Context */}
            <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
              <div className="flex items-center gap-4 mb-6">
                <div className="h-12 w-12 rounded-2xl bg-primary-50 flex items-center justify-center border border-primary-100 text-primary-600">
                  <User className="h-6 w-6" />
                </div>
                <div className="flex-1 overflow-hidden">
                  <h3 className="text-sm font-black text-gray-900 truncate">{ticket.customerName || 'Requester'}</h3>
                  <p className="text-[10px] font-bold text-gray-400 truncate">{ticket.customerEmail}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3 mb-6">
                 <div className="bg-gray-50 rounded-2xl p-3">
                    <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">Orders</p>
                    <p className="text-sm font-black text-gray-900">12</p>
                 </div>
                 <div className="bg-gray-50 rounded-2xl p-3">
                    <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">LTV</p>
                    <p className="text-sm font-black text-green-600">${customerStats?.spend.toFixed(2)}</p>
                 </div>
              </div>

              <div className="space-y-4">
                 <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                    <span className="text-gray-400">Resolved Rate</span>
                    <span className="text-gray-900">{customerStats?.resolved}/{customerStats?.total}</span>
                 </div>
                 <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary-600" 
                      style={{ width: `${(customerStats?.resolved || 0) / (customerStats?.total || 1) * 100}%` }} 
                    />
                 </div>
              </div>

              <Link 
                href={`/admin/customers/${ticket.userId}`}
                className="mt-8 flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-gray-900 text-white text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg shadow-black/10"
              >
                Full Customer View
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            {/* Ticket Properties */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b bg-gray-50/50 flex items-center justify-between">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Properties</h3>
                <Tag className="h-3.5 w-3.5 text-gray-300" />
              </div>
              <div className="p-6 space-y-6">
                 <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block">Status</label>
                    <select 
                      value={localProps.status}
                      onChange={e => setLocalProps({ ...localProps, status: e.target.value as any })}
                      className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-xs font-bold outline-none focus:ring-4 focus:ring-primary-500/5 focus:border-primary-500 transition-all appearance-none cursor-pointer"
                    >
                      <option value="new">New</option>
                      <option value="open">Open</option>
                      <option value="pending">Pending</option>
                      <option value="on_hold">On-hold</option>
                      <option value="solved">Solved</option>
                      <option value="closed">Closed</option>
                    </select>
                 </div>

                 <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block">Priority</label>
                    <div className="grid grid-cols-2 gap-2">
                       {['low', 'medium', 'high', 'urgent'].map(p => (
                         <button
                           key={p}
                           onClick={() => setLocalProps({ ...localProps, priority: p as any })}
                           className={`py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                             localProps.priority === p 
                               ? 'bg-gray-900 text-white border-gray-900 shadow-md' 
                               : 'bg-white text-gray-400 border-gray-100 hover:border-gray-200'
                           }`}
                         >
                           {p}
                         </button>
                       ))}
                    </div>
                 </div>

                 <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block">Ticket Type</label>
                    <select 
                      value={localProps.type || ''}
                      onChange={e => setLocalProps({ ...localProps, type: e.target.value as any })}
                      className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-xs font-bold outline-none focus:ring-4 focus:ring-primary-500/5 focus:border-primary-500 transition-all appearance-none cursor-pointer"
                    >
                      <option value="">(Not selected)</option>
                      <option value="question">Question</option>
                      <option value="incident">Incident</option>
                      <option value="problem">Problem</option>
                      <option value="task">Task</option>
                    </select>
                 </div>

                 <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block">Assignee</label>
                    <div className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5">
                      <div className="h-5 w-5 rounded-full bg-primary-100 flex items-center justify-center text-[8px] font-black text-primary-600 uppercase">
                        {localProps.assigneeName?.[0] || 'U'}
                      </div>
                      <span className="text-xs font-bold text-gray-600 truncate">{localProps.assigneeName || 'Unassigned'}</span>
                    </div>
                 </div>

                 <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block">Tags</label>
                    <div className="flex flex-wrap gap-2 mb-3">
                       {localProps.tags?.map(t => (
                         <span key={t} className="flex items-center gap-1.5 bg-gray-100 text-gray-600 px-2 py-1 rounded-lg text-[10px] font-bold border border-gray-200 group">
                            {t}
                            <button onClick={() => removeTag(t)} className="text-gray-300 hover:text-red-500 transition-colors"><X className="h-3 w-3" /></button>
                         </span>
                       ))}
                    </div>
                    <div className="relative">
                      <Plus className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-300" />
                      <input 
                        value={newTag}
                        onChange={e => setNewTag(e.target.value)}
                        onKeyDown={addTag}
                        placeholder="Add tag..."
                        className="w-full bg-gray-50 border border-gray-100 rounded-xl pl-9 pr-4 py-2 text-[10px] font-bold outline-none focus:bg-white focus:ring-4 focus:ring-primary-500/5 transition-all"
                      />
                    </div>
                 </div>
              </div>
            </div>

            {/* Linked Context (Order/Product) */}
            <div className="bg-gray-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden group">
               <div className="absolute -right-4 -bottom-4 h-24 w-24 rounded-full bg-white/5 blur-2xl group-hover:scale-150 transition-transform duration-700" />
               <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-6 flex items-center gap-2">
                 <Package className="h-4 w-4" />
                 Linked Context
               </h3>
               
               <div className="space-y-4">
                 {recentOrders.length > 0 ? (
                   recentOrders.map(order => (
                     <div key={order.id} className="bg-white/10 p-4 rounded-2xl border border-white/10 hover:bg-white/20 transition-all cursor-pointer group/item">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[9px] font-black uppercase tracking-widest text-white/50">Order History</span>
                          <ExternalLink className="h-3 w-3 text-white/30 group-hover/item:text-white transition-colors" />
                        </div>
                        <p className="text-xs font-black">#{order.id.slice(0, 8).toUpperCase()}</p>
                        <p className="text-[10px] text-white/60 mt-1 flex justify-between">
                          <span>${order.total.toFixed(2)}</span>
                          <span className="uppercase">{order.status}</span>
                        </p>
                     </div>
                   ))
                 ) : (
                   <p className="text-[10px] font-bold text-white/20 italic">No order history</p>
                 )}

                 {ticket.productId && (
                   <div className="bg-white/10 p-4 rounded-2xl border border-white/10 hover:bg-white/20 transition-all cursor-pointer group/item">
                     <div className="flex items-center justify-between mb-2">
                       <span className="text-[9px] font-black uppercase tracking-widest text-white/50">Product Detail</span>
                       <ExternalLink className="h-3 w-3 text-white/30 group-hover/item:text-white transition-colors" />
                     </div>
                     <p className="text-xs font-black truncate">Linked Item Ref</p>
                  </div>
                 )}
               </div>
            </div>
        </aside>
      </div>
    </div>
  );
}
