'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  ArrowLeft, MessageSquare, Clock, AlertCircle, CheckCircle2, 
  Send, User, Mail, Package, Receipt, ExternalLink, MoreVertical,
  History, Shield, Loader2, Search
} from 'lucide-react';
import { useServices } from '../../hooks/useServices';
import { useAuth } from '../../hooks/useAuth';
import type { SupportTicket, TicketMessage, TicketStatus, TicketPriority } from '@domain/models';
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
  const [statusLoading, setStatusLoading] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  const loadTicket = useCallback(async () => {
    try {
      const data = await services.ticketService.getTicket(id);
      setTicket(data);
    } catch (err) {
      toast('error', 'Failed to load ticket details');
      router.push('/admin/tickets');
    } finally {
      setLoading(false);
    }
  }, [id, services.ticketService, toast, router]);

  useEffect(() => {
    void loadTicket();
  }, [loadTicket]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [ticket?.messages]);

  const [isInternal, setIsInternal] = useState(false);

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reply.trim() || !currentUser || isSending) return;

    setIsSending(true);
    try {
      await services.ticketService.addMessage(id, reply, currentUser.id, 'agent', isInternal ? 'internal' : 'public');
      setReply('');
      setIsInternal(false);
      await loadTicket(); // Refresh to show new message
      toast('success', isInternal ? 'Internal note added' : 'Reply sent successfully');
    } catch (err) {
      toast('error', 'Failed to send reply');
    } finally {
      setIsSending(false);
    }
  };

  const handleStatusChange = async (newStatus: TicketStatus) => {
    if (statusLoading || !ticket) return;
    
    setStatusLoading(true);
    try {
      await services.ticketService.updateTicketStatus(id, newStatus);
      setTicket({ ...ticket, status: newStatus });
      toast('success', `Status updated to ${newStatus.replace('_', ' ')}`);
    } catch (err) {
      toast('error', 'Failed to update status');
    } finally {
      setStatusLoading(false);
    }
  };

  const getStatusConfig = (status: TicketStatus) => {
    const map: Record<TicketStatus, { bg: string, text: string, icon: any, label: string }> = {
      open: { bg: 'bg-red-50', text: 'text-red-700', icon: AlertCircle, label: 'Open' },
      in_progress: { bg: 'bg-amber-50', text: 'text-amber-700', icon: Clock, label: 'In Progress' },
      waiting_on_customer: { bg: 'bg-blue-50', text: 'text-blue-700', icon: MessageSquare, label: 'Waiting' },
      resolved: { bg: 'bg-green-50', text: 'text-green-700', icon: CheckCircle2, label: 'Resolved' },
      closed: { bg: 'bg-gray-100', text: 'text-gray-700', icon: CheckCircle2, label: 'Closed' }
    };
    return map[status] || map.open;
  };

  if (loading) {
    return (
      <div className="space-y-6 pb-20 animate-in fade-in">
        <div className="h-20 bg-gray-50 rounded-xl animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 h-[600px] bg-gray-50 rounded-xl animate-pulse" />
          <div className="lg:col-span-4 h-[400px] bg-gray-50 rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (!ticket) return null;

  const statusCfg = getStatusConfig(ticket.status);

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-500">
      {/* Header / Breadcrumbs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <button 
            onClick={() => router.push('/admin/tickets')}
            className="group flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-3 w-3 transition-transform group-hover:-translate-x-1" />
            Back to All Tickets
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">
              Ticket <span className="text-gray-400 font-medium">#{ticket.id.slice(0, 8).toUpperCase()}</span>
            </h1>
            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-widest ${statusCfg.bg} ${statusCfg.text}`}>
              <statusCfg.icon className="h-3 w-3" />
              {statusCfg.label}
            </span>
          </div>
          <p className="text-sm font-medium text-gray-500">{ticket.subject}</p>
        </div>

        <div className="flex items-center gap-2">
          {ticket.status !== 'resolved' && (
            <button 
              onClick={() => handleStatusChange('resolved')}
              disabled={statusLoading}
              className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-xs font-black text-white shadow-sm hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {statusLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
              Mark Resolved
            </button>
          )}
          {ticket.status === 'resolved' && (
            <button 
              onClick={() => handleStatusChange('open')}
              disabled={statusLoading}
              className="flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-xs font-black text-white shadow-sm hover:bg-black transition-colors disabled:opacity-50"
            >
              {statusLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <History className="h-3 w-3" />}
              Reopen Ticket
            </button>
          )}
          <div className="relative group">
            <button className="p-2 rounded-lg border bg-white hover:bg-gray-50 transition-colors">
              <MoreVertical className="h-4 w-4 text-gray-400" />
            </button>
            <div className="absolute right-0 mt-2 w-48 rounded-xl border bg-white shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 p-1">
              <button 
                onClick={() => handleStatusChange('in_progress')}
                className="w-full text-left px-3 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 rounded-lg"
              >
                Set to In Progress
              </button>
              <button 
                onClick={() => handleStatusChange('waiting_on_customer')}
                className="w-full text-left px-3 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 rounded-lg"
              >
                Set to Waiting
              </button>
              <div className="h-px bg-gray-100 my-1" />
              <button className="w-full text-left px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-lg">
                Delete Ticket
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Chat / Message Area */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="bg-white rounded-2xl border shadow-sm overflow-hidden flex flex-col h-[600px]">
            {/* Thread Header */}
            <div className="px-6 py-4 border-b bg-gray-50/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold">
                  {ticket.customerName?.charAt(0) || ticket.customerEmail.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-xs font-black text-gray-900">{ticket.customerName || 'Customer'}</p>
                  <p className="text-[10px] text-gray-500 font-medium">Conversation started {formatShortDate(ticket.createdAt.toString())}</p>
                </div>
              </div>
            </div>

            {/* Messages Scroll Area */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-6 space-y-8 scroll-smooth bg-[#f8f9fa]"
            >
              {ticket.messages.map((msg, idx) => {
                const isAgent = msg.senderType === 'agent';
                const isSystem = msg.senderType === 'system';
                const isInternal = msg.visibility === 'internal';
                
                if (isSystem) {
                  return (
                    <div key={msg.id} className="flex justify-center">
                      <div className="bg-gray-100 rounded-full px-4 py-1 flex items-center gap-2">
                        <Shield className="h-3 w-3 text-gray-400" />
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tight">{msg.content}</span>
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={msg.id} className={`flex ${isAgent ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] space-y-1`}>
                      <div className={`flex items-center gap-2 mb-1 ${isAgent ? 'flex-row-reverse' : ''}`}>
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                          {isAgent ? (isInternal ? 'Internal Note' : 'Support Team') : (ticket.customerName || 'Customer')}
                        </span>
                        <span className="text-[9px] text-gray-300 font-medium">
                          {formatFullDateTime(msg.createdAt.toString())}
                        </span>
                      </div>
                      <div className={`
                        relative px-5 py-3.5 rounded-2xl text-sm leading-relaxed
                        ${isInternal 
                          ? 'bg-amber-50 text-amber-900 border border-amber-200 rounded-tr-none shadow-sm'
                          : isAgent 
                            ? 'bg-primary-600 text-white rounded-tr-none shadow-lg shadow-primary-500/10' 
                            : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none shadow-sm'
                        }
                      `}>
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Reply Input */}
            <div className="p-4 border-t bg-white">
              <form onSubmit={handleSendReply} className="space-y-4">
                <div className="flex items-center gap-4 mb-2">
                  <button
                    type="button"
                    onClick={() => setIsInternal(false)}
                    className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full transition-all ${!isInternal ? 'bg-primary-600 text-white shadow-lg' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                  >
                    Public Reply
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsInternal(true)}
                    className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full transition-all ${isInternal ? 'bg-amber-600 text-white shadow-lg' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                  >
                    Internal Note
                  </button>
                </div>
                <div className="relative">
                  <textarea
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    placeholder={isInternal ? "Add an internal note only agents can see..." : "Type your response..."}
                    rows={3}
                    className={`w-full resize-none rounded-xl border p-4 pb-12 text-sm font-medium focus:ring-4 outline-none transition ${
                      isInternal 
                        ? 'bg-amber-50/50 border-amber-200 focus:bg-white focus:border-amber-500 focus:ring-amber-500/5' 
                        : 'bg-gray-50 border-gray-200 focus:bg-white focus:border-primary-500 focus:ring-primary-500/5'
                    }`}
                  />
                  <div className="absolute right-3 bottom-3 flex items-center gap-3">
                    <p className="text-[10px] text-gray-400 font-bold hidden md:block">Press ⌘+Enter to send</p>
                    <button
                      type="submit"
                      disabled={!reply.trim() || isSending}
                      className={`flex h-10 w-10 items-center justify-center rounded-lg text-white shadow-xl transition-all disabled:opacity-50 ${isInternal ? 'bg-amber-600 hover:bg-amber-700' : 'bg-gray-900 hover:bg-black'}`}
                    >
                      {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Sidebar / Context */}
        <div className="lg:col-span-4 space-y-6">
          {/* Customer Context Card */}
          <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b bg-gray-50/50">
              <h3 className="text-xs font-black uppercase tracking-widest text-gray-400">Customer Context</h3>
            </div>
            <div className="p-5 space-y-6">
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-xl bg-gray-100 flex items-center justify-center">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <div>
                  <p className="text-sm font-black text-gray-900">{ticket.customerName || 'No name provided'}</p>
                  <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500 mt-0.5">
                    <Mail className="h-3 w-3" />
                    {ticket.customerEmail}
                  </div>
                  <Link 
                    href={`/admin/customers/${ticket.userId}`}
                    className="inline-flex items-center gap-1 text-[10px] font-bold text-primary-600 hover:underline mt-2"
                  >
                    View Customer Profile
                    <ExternalLink className="h-2 w-2" />
                  </Link>
                </div>
              </div>

              {ticket.orderId && (
                <div className="pt-5 border-t">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">Linked Order</p>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
                    <div className="flex items-center gap-3">
                      <Receipt className="h-4 w-4 text-gray-400" />
                      <p className="text-xs font-bold text-gray-900">Order #{ticket.orderId.slice(0, 8).toUpperCase()}</p>
                    </div>
                    <Link href={`/admin/orders/${ticket.orderId}`}>
                      <ExternalLink className="h-3 w-3 text-gray-400 hover:text-gray-900 transition-colors" />
                    </Link>
                  </div>
                </div>
              )}

              {ticket.productId && (
                <div className="pt-5 border-t">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">Related Product</p>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
                    <div className="flex items-center gap-3">
                      <Package className="h-4 w-4 text-gray-400" />
                      <p className="text-xs font-bold text-gray-900 truncate max-w-[150px]">Product Inquiry</p>
                    </div>
                    <Link href={`/admin/products/${ticket.productId}`}>
                      <ExternalLink className="h-3 w-3 text-gray-400 hover:text-gray-900 transition-colors" />
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Internal Metadata */}
          <div className="bg-gray-900 rounded-2xl p-6 text-white shadow-xl mb-6">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-4">Internal Stats</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-white/40 text-[9px] font-bold uppercase mb-1">Created</p>
                <p className="text-xs font-bold">{formatShortDate(ticket.createdAt.toString())}</p>
              </div>
              <div>
                <p className="text-white/40 text-[9px] font-bold uppercase mb-1">Messages</p>
                <p className="text-xs font-bold">{ticket.messages.length}</p>
              </div>
              <div className="col-span-2">
                <p className="text-white/40 text-[9px] font-bold uppercase mb-1">Priority</p>
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${ticket.priority === 'urgent' ? 'bg-red-500 animate-pulse' : 'bg-amber-500'}`} />
                  <p className="text-xs font-bold uppercase">{ticket.priority}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Knowledgebase Search Card */}
          <AdminKBSearch onSelectArticle={(art) => {
             const link = `${window.location.origin}/support?article=${art.slug}`;
             setReply(prev => prev + (prev ? '\n\n' : '') + `You might find this article helpful: ${link}`);
             toast('success', 'Article link added to reply');
          }} />
        </div>
      </div>
    </div>
  );
}

function AdminKBSearch({ onSelectArticle }: { onSelectArticle: (art: any) => void }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const services = useServices();

  useEffect(() => {
    if (query.length > 2) {
      const timer = setTimeout(async () => {
        const data = await services.knowledgebaseService.getArticles({ query });
        setResults(data);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setResults([]);
    }
  }, [query, services.knowledgebaseService]);

  return (
    <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b bg-gray-50/50">
        <h3 className="text-xs font-black uppercase tracking-widest text-gray-400">KB Helper</h3>
      </div>
      <div className="p-4 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
          <input 
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search articles..."
            className="w-full rounded-lg border bg-gray-50 py-2 pl-9 pr-3 text-xs font-medium focus:bg-white focus:ring-4 focus:ring-primary-500/5 outline-none transition"
          />
        </div>
        <div className="space-y-2 max-h-[200px] overflow-y-auto">
          {results.map(art => (
            <button 
              key={art.id}
              onClick={() => onSelectArticle(art)}
              className="w-full text-left p-2 rounded-lg hover:bg-gray-50 border border-transparent hover:border-gray-100 transition-all group"
            >
              <p className="text-[11px] font-bold text-gray-900 group-hover:text-primary-600 truncate">{art.title}</p>
              <p className="text-[9px] text-gray-400 font-medium">{art.categoryName}</p>
            </button>
          ))}
          {query.length > 2 && results.length === 0 && (
            <p className="text-[10px] text-center text-gray-400 py-4 font-medium">No matches found</p>
          )}
          {query.length <= 2 && (
             <p className="text-[10px] text-center text-gray-400 py-4 font-medium italic">Search to suggest articles</p>
          )}
        </div>
      </div>
    </div>
  );
}
