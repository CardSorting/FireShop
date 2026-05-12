"use client";

'use client';

/**
 * [LAYER: UI]
 * Admin order management — High-velocity fulfillment console.
 * Patterns modeled after Shopify Admin with optimized information density.
 */
import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useServices } from '../../hooks/useServices';
import type { Order, OrderStatus } from '@domain/models';
import {
  ChevronDown,
  PackageCheck,
  Search,
  Clock,
  CheckCircle2,
  Truck,
  PackageSearch,
  Printer,
  RefreshCcw,
  X,
  MapPin,
  CreditCard,
  Copy,
  Calendar,
  Download,
  Mail,
  User,
  DollarSign,
  Shield,
  ExternalLink,
  ChevronRight,
  Filter,
  Check,
  ShoppingBag,
  AlertTriangle
} from 'lucide-react';
import { formatCurrency, formatShortDate, humanizeOrderStatus, normalizeSearch, formatRelativeTime } from '@utils/formatters';
import { nextOrderActionLabel } from '@domain/rules';
import {
  AdminPageHeader,
  AdminStatusBadge,
  AdminEmptyState,
  BulkActionBar,
  SkeletonRow,
  useToast,
  useAdminPageTitle,
  AdminTab,
  exportToCSV
} from '../../components/admin/AdminComponents';

const NEXT_STATUSES: Record<OrderStatus, OrderStatus[]> = {
  pending: ['pending', 'confirmed', 'cancelled'],
  confirmed: ['confirmed', 'processing', 'cancelled'],
  processing: ['processing', 'shipped', 'cancelled', 'ready_for_pickup', 'delivery_started'],
  shipped: ['shipped', 'delivered', 'refunded'],
  delivered: ['delivered', 'refunded'],
  cancelled: ['cancelled'],
  refunded: ['refunded'],
  partially_refunded: ['partially_refunded', 'refunded'],
  ready_for_pickup: ['ready_for_pickup', 'delivered', 'cancelled'],
  delivery_started: ['delivery_started', 'delivered', 'cancelled'],
};

/* Enhanced Triage Tabs */
const FULFILLMENT_TABS = [
  { label: 'All Orders', value: 'all', icon: PackageCheck },
  { label: 'Unfulfilled', value: 'confirmed', icon: Clock },
  { label: 'Unpaid', value: 'pending', icon: DollarSign },
  { label: 'Open', value: 'processing', icon: RefreshCcw },
  { label: 'Shipped', value: 'shipped', icon: Truck },
];

export function AdminOrders() {
  useAdminPageTitle('Orders');
  const services = useServices();
  const { toast } = useToast();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [nextCursor, setNextCursor] = useState<string | undefined>();
  const [cursor, setCursor] = useState<string | undefined>();
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [dateFilter, setDateFilter] = useState<'all' | '30' | '90'>('all');
  const [query, setQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [batchUpdating, setBatchUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState(false);
  const [internalNotes, setInternalNotes] = useState<Record<string, { id: string; text: string; date: Date }[]>>({});
  const [noteInput, setNoteInput] = useState('');
  const [trackingNumbers, setTrackingNumbers] = useState<Record<string, string>>({});
  const [trackingInput, setTrackingInput] = useState('');
  const controllerRef = useRef<AbortController | null>(null);

  // Status counts for tabs
  const counts = useMemo(() => {
    const map: Record<string, number> = { all: orders.length };
    orders.forEach(o => {
      map[o.status] = (map[o.status] || 0) + 1;
    });
    return map;
  }, [orders]);

  // Close slide-over on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && selectedOrder) setSelectedOrder(null);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedOrder]);

  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  const loadOrders = useCallback(async () => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    setLoading(true);
    setError(null);
    try {
      const result = await services.orderService.getAllOrders({
        limit: 25,
        cursor,
        status: statusFilter === 'all' ? undefined : statusFilter,
        signal: controller.signal,
      });
      
      if (isMounted.current && !controller.signal.aborted) {
        setOrders(result.orders);
        setNextCursor(result.nextCursor);
        setSelectedIds(new Set());
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      if (isMounted.current) {
        setError(err instanceof Error ? err.message : 'Failed to load orders');
      }
    } finally {
      if (isMounted.current && !controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, [cursor, services.orderService, statusFilter]);

  useEffect(() => {
    void loadOrders();
    return () => controllerRef.current?.abort();
  }, [loadOrders]);

  useEffect(() => {
    if (selectedOrder) {
      setNoteInput('');
      setTrackingInput(trackingNumbers[selectedOrder.id] || '');
    }
  }, [selectedOrder, trackingNumbers]);

  function handlePostNote(orderId: string) {
    if (!noteInput.trim()) return;
    const newNote = { id: crypto.randomUUID(), text: noteInput, date: new Date() };
    setInternalNotes(prev => ({
      ...prev,
      [orderId]: [...(prev[orderId] || []), newNote]
    }));
    setNoteInput('');
    toast('success', 'Note added to timeline');
  }

  function handleSaveTracking(orderId: string) {
    setTrackingNumbers(prev => ({ ...prev, [orderId]: trackingInput }));
    toast('success', 'Tracking number saved');
  }

  function handleExport() {
    if (orders.length === 0) {
      toast('info', 'No orders to export');
      return;
    }
    const exportData = orders.map(o => ({
      ID: o.id,
      Customer: o.customerName,
      Email: o.customerEmail,
      Total: (o.total / 100).toFixed(2),
      Status: o.status,
      Date: o.createdAt.toISOString()
    }));
    exportToCSV('orders_export', exportData);
    toast('success', `Exported ${orders.length} orders to CSV`);
  }  async function handleStatusChange(id: string, status: OrderStatus) {
    setUpdating(id);
    setError(null);
    try {
      const user = await services.authService.getCurrentUser();
      const actor = { id: user?.id || 'unknown', email: user?.email || 'system' };
      await services.orderService.updateOrderStatus(id, status, actor);
      if (!isMounted.current) return;
      
      toast('success', `Order updated to ${humanizeOrderStatus(status)}`);
      if (selectedOrder?.id === id) {
        setSelectedOrder(prev => prev ? { ...prev, status } : null);
      }
      await loadOrders();
    } catch (err) {
      if (isMounted.current) {
        toast('error', err instanceof Error ? err.message : 'Failed to update order status');
      }
    } finally {
      if (isMounted.current) {
        setUpdating(null);
      }
    }
  }

  async function bulkUpdateStatus(status: OrderStatus) {
    if (selectedIds.size === 0) return;
    setBatchUpdating(true);
    setError(null);
    try {
      const user = await services.authService.getCurrentUser();
      const actor = { id: user?.id || 'unknown', email: user?.email || 'system' };
      await services.orderService.batchUpdateOrderStatus(Array.from(selectedIds), status, actor);
      if (!isMounted.current) return;

      toast('success', `${selectedIds.size} order${selectedIds.size > 1 ? 's' : ''} updated to ${humanizeOrderStatus(status)}`);
      setSelectedIds(new Set());
      await loadOrders();
    } catch (err) {
      if (isMounted.current) {
        toast('error', err instanceof Error ? err.message : 'Failed to update multiple orders');
      }
    } finally {
      if (isMounted.current) {
        setBatchUpdating(false);
      }
    }
  }

  const filteredOrders = useMemo(() => {
    let result = orders;
    const needle = normalizeSearch(query);
    if (needle) {
      result = result.filter((order) => {
        return [
          order.id,
          order.userId,
          order.paymentTransactionId ?? '',
          ...order.items.map((item) => item.name),
        ].some((value) => normalizeSearch(value).includes(needle));
      });
    }
    if (dateFilter !== 'all') {
      const days = parseInt(dateFilter);
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);
      result = result.filter(o => o.createdAt >= cutoff);
    }
    return result;
  }, [orders, query, dateFilter]);

  const toggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const toggleAll = () => {
    if (selectedIds.size === filteredOrders.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredOrders.map(o => o.id)));
    }
  };

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-500">
      <AdminPageHeader
        title="Orders"
        subtitle="High-velocity fulfillment and collector management console"
        actions={
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 rounded-lg border bg-white px-4 py-2 text-xs font-bold text-gray-700 shadow-sm transition hover:bg-gray-50 active:scale-95"
          >
            <Download className="h-4 w-4" />
            Export
          </button>
        }
      />

      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        {/* ── Tabs ── */}
        <div className="flex items-center border-b px-2 overflow-x-auto scrollbar-hide">
          {FULFILLMENT_TABS.map((tab) => (
            <AdminTab
              key={tab.value}
              label={tab.label}
              count={tab.value === 'all' ? orders.length : counts[tab.value]}
              active={statusFilter === tab.value}
              onClick={() => {
                setStatusFilter(tab.value as OrderStatus | 'all');
                setCursor(undefined);
              }}
            />
          ))}
        </div>

        {/* ── Search & Filter Bar ── */}
        <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by customer, ID, or item…"
              className="w-full rounded-lg border bg-gray-50 py-2 pl-9 pr-3 text-sm focus:ring-2 focus:ring-primary-500 outline-none transition"
            />
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Filter className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value as any)}
                className="appearance-none rounded-lg border bg-gray-50 py-2 pl-9 pr-8 text-xs font-bold text-gray-700 focus:ring-2 focus:ring-primary-500 cursor-pointer outline-none"
              >
                <option value="all">Any time</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
            </div>
          </div>
        </div>

        {/* ── Table ── */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="w-12 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.size > 0 && selectedIds.size === filteredOrders.length}
                    ref={input => { if (input) input.indeterminate = selectedIds.size > 0 && selectedIds.size < filteredOrders.length; }}
                    onChange={toggleAll}
                    className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                </th>
                <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-gray-400">Order</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-gray-400">Date</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-gray-400">Customer</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-gray-400">Status</th>
                <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-widest text-gray-400">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading && [1, 2, 3, 4, 5].map(i => <SkeletonRow key={i} columns={6} />)}
              {!loading && filteredOrders.map((o) => {
                const isSelected = selectedIds.has(o.id);
                return (
                    <tr
                      key={o.id}
                      onClick={() => router.push(`/admin/orders/${o.id}`)}
                      className={`group cursor-pointer transition hover:bg-gray-50 ${isSelected ? 'bg-primary-50/40' : ''}`}
                    >
                      <td className="px-4 py-3.5">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onClick={(e) => toggleSelect(o.id, e)}
                          onChange={() => { }}
                          className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-900 tracking-tight">#{o.id.slice(0, 8).toUpperCase()}</span>
                          <ChevronRight className="h-3 w-3 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="text-xs font-medium text-gray-600">{formatShortDate(o.createdAt)}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="text-xs font-bold text-gray-900 truncate">{o.customerName || `User #${o.userId.slice(0, 8)}`}</p>
                      </td>
                      
                      <td className="px-4 py-3.5">
                        {o.status === 'confirmed' ? (
                          <button 
                            onClick={(e) => { e.stopPropagation(); /* Logic to open tracking modal */ }}
                            className="rounded-lg border border-primary-100 bg-primary-50 px-3 py-1 text-[10px] font-black uppercase text-primary-700 hover:bg-primary-100"
                          >
                            Add Tracking
                          </button>
                        ) : (
                          <AdminStatusBadge status={o.status} type="order" />
                        )}
                      </td>

                      <td className="px-4 py-3.5 text-right font-bold text-gray-900 tracking-tight">
                        {formatCurrency(o.total)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {!loading && filteredOrders.length === 0 && (
              <AdminEmptyState
                title="No orders found"
                description="Try adjusting your filters or search query."
                icon={PackageSearch}
              />
            )}
          </div>
        </div>

      {/* ── Batch Actions ── */}
      <BulkActionBar
        selectedCount={selectedIds.size}
        onClear={() => setSelectedIds(new Set())}
        actions={
          <>
            <button onClick={() => bulkUpdateStatus('confirmed')} className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-bold text-white hover:bg-white/20 transition">Confirm</button>
            <button onClick={() => bulkUpdateStatus('shipped')} className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-bold text-white hover:bg-white/20 transition">Ship</button>
          </>
        }
      />
    </div>
  );
}
