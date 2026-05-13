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
  draft: ['draft', 'pending', 'cancelled'],
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
  reconciling: ['reconciling'], // locked — resolve via /api/admin/orders/[id]/reconcile
};

/* Enhanced Triage Tabs */
const FULFILLMENT_TABS = [
  { label: 'All Orders', value: 'all', icon: PackageCheck },
  { label: 'Ready to Ship', value: 'confirmed', icon: Clock },
  { label: 'Unpaid', value: 'pending', icon: DollarSign },
  { label: 'In Fulfillment', value: 'processing', icon: RefreshCcw },
  { label: 'Shipped', value: 'shipped', icon: Truck },
];

const SHIPPING_PROFILES = [
  { id: 'bubble_mailer', label: 'Bubble Mailer (6x4x1)', dimensions: { length: '6', width: '4', height: '1' }, tare: 0.1 },
  { id: 'small_box', label: 'Small Box (8x6x4)', dimensions: { length: '8', width: '6', height: '4' }, tare: 0.2 },
  { id: 'medium_box', label: 'Medium Box (12x10x6)', dimensions: { length: '12', width: '10', height: '6' }, tare: 0.4 },
  { id: 'large_box', label: 'Large Box (16x12x8)', dimensions: { length: '16', width: '12', height: '8' }, tare: 0.8 },
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
  const [selectedProfileId, setSelectedProfileId] = useState<string>(SHIPPING_PROFILES[0].id);
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

  async function handlePirateShipExport() {
    if (selectedIds.size === 0) return;
    
    const count = selectedIds.size;
    const profile = SHIPPING_PROFILES.find(p => p.id === selectedProfileId);
    const confirmed = window.confirm(`Ready to ship ${count} orders?\n\nPackaging: ${profile?.label}\n\nThis will download the Pirate Ship CSV and optionally update these orders to "In Fulfillment" so you can track your progress.`);
    
    if (!confirmed) return;

    try {
      setBatchUpdating(true);
      const csv = await services.orderService.exportOrdersToPirateShipCsv(
        Array.from(selectedIds), 
        profile?.dimensions, 
        profile?.tare
      );
      
      // Industrialized Download
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pirate_ship_export_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      // Post-Export Workflow: Auto-advance status for unfulfilled orders
      const user = await services.authService.getCurrentUser();
      const actor = { id: user?.id || 'unknown', email: user?.email || 'system' };
      
      const toUpdate = orders
        .filter(o => selectedIds.has(o.id) && (o.status === 'pending' || o.status === 'confirmed'))
        .map(o => o.id);
      
      if (toUpdate.length > 0) {
        await services.orderService.batchUpdateOrderStatus(toUpdate, 'processing', actor);
        toast('success', `Exported ${count} orders and moved ${toUpdate.length} to Processing`);
        await loadOrders(); // Refresh list
      } else {
        toast('success', `Exported ${count} orders for Pirate Ship`);
      }
      
      setSelectedIds(new Set());
    } catch (err) {
      toast('error', 'Fulfillment wizard failed');
    } finally {
      setBatchUpdating(false);
    }
  }

  function handlePrintPackingSlips() {
    if (selectedIds.size === 0) return;
    const ids = Array.from(selectedIds).join(',');
    window.open(`/admin/print/packing-slips?ids=${ids}`, '_blank');
  }

  async function handleImportTracking(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      try {
        setBatchUpdating(true);
        // Simple CSV parser for Tracking CSV (Order ID, Tracking Number)
        const lines = text.split('\n');
        const rows: any[] = [];
        
        // Skip header, parse lines
        for (let i = 1; i < lines.length; i++) {
          const parts = lines[i].split(',').map(p => p.trim().replace(/^"|"$/g, ''));
          if (parts.length >= 2) {
             // Heuristic: Find columns that look like IDs and Tracking
             // Pirate Ship exports often have "Order ID" in column 0 and "Tracking Number" in column 1
             rows.push({ orderId: parts[0], trackingNumber: parts[1], carrier: parts[2] || 'USPS' });
          }
        }

        if (rows.length === 0) throw new Error('No valid rows found');

        const result = await services.orderService.importTrackingNumbers(rows);
        toast('success', `Successfully imported ${result.successCount} tracking numbers`);
        await loadOrders();
      } catch (err) {
        toast('error', 'Tracking import failed. Check CSV format.');
      } finally {
        setBatchUpdating(false);
        e.target.value = ''; // Reset input
      }
    };
    reader.readAsText(file);
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
          <div className="flex items-center gap-3">
             <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gray-50 border ring-1 ring-black/5">
                <PackageSearch className="h-3.5 w-3.5 text-gray-400" />
                <select 
                  value={selectedProfileId}
                  onChange={(e) => setSelectedProfileId(e.target.value)}
                  className="bg-transparent text-[10px] font-black uppercase tracking-widest text-gray-500 outline-none cursor-pointer"
                >
                  {SHIPPING_PROFILES.map(p => (
                    <option key={p.id} value={p.id}>{p.label}</option>
                  ))}
                </select>
             </div>
            <label className="flex items-center gap-2 rounded-xl border bg-white px-4 py-2.5 text-xs font-bold text-gray-700 shadow-xs transition hover:bg-gray-50 active:scale-95 cursor-pointer">
              <RefreshCcw className={`h-4 w-4 text-gray-400 ${batchUpdating ? 'animate-spin' : ''}`} />
              Import Tracking
              <input type="file" accept=".csv" onChange={handleImportTracking} className="hidden" disabled={batchUpdating} />
            </label>
            <button 
              onClick={handleExport}
              className="flex items-center gap-2 rounded-xl border bg-white px-4 py-2.5 text-xs font-bold text-gray-700 shadow-xs transition hover:bg-gray-50 active:scale-95"
            >
              <Download className="h-4 w-4 text-gray-400" />
              Export Records
            </button>
            <button 
              onClick={handlePrintPackingSlips}
              className="flex items-center gap-2 rounded-xl border bg-white px-4 py-2.5 text-xs font-bold text-gray-700 shadow-xs transition hover:bg-gray-50 active:scale-95"
            >
              <Printer className="h-4 w-4 text-gray-400" />
              Packing Slips
            </button>
            <div className="h-8 w-px bg-gray-200 mx-1" />
            <button 
              onClick={handlePirateShipExport}
              disabled={selectedIds.size === 0}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-black text-white shadow-md transition hover:bg-indigo-700 active:scale-95 disabled:opacity-40 disabled:grayscale disabled:cursor-not-allowed"
            >
              <Truck className="h-4 w-4" />
              Ship with Pirate Ship ({selectedIds.size})
            </button>
          </div>
        }
      />

      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        {/* ── Logistics Health Banner (Industry Standard) ── */}
        {selectedIds.size > 0 && (() => {
          const selectedOrders = orders.filter(o => selectedIds.has(o.id));
          const missingPhone = selectedOrders.filter(o => !o.shippingAddress.phone && !o.metadata?.phone);
          const international = selectedOrders.filter(o => o.shippingAddress.country !== 'US');
          
          if (missingPhone.length > 0 || international.length > 0) {
            return (
              <div className="bg-amber-50 border-b border-amber-100 p-3 flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                <div className="flex-1 text-sm text-amber-900">
                  <span className="font-bold">Logistics Alert:</span> {missingPhone.length > 0 && `${missingPhone.length} orders missing phone numbers. `}
                  {international.length > 0 && `${international.length} international shipments require manual customs verification.`}
                </div>
                <button onClick={() => toast('info', 'Check metadata or contact customer')} className="text-xs font-bold text-amber-700 underline">Resolve</button>
              </div>
            );
          }
          return null;
        })()}

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
          <div className="flex items-center gap-2">
            <button 
              onClick={handlePirateShipExport} 
              className="flex items-center gap-2 rounded-xl bg-white/20 px-4 py-2 text-xs font-black text-white hover:bg-white/30 transition active:scale-95"
            >
              <Truck className="h-4 w-4" />
              Generate Pirate Ship CSV
            </button>
            <div className="h-4 w-px bg-white/20 mx-1" />
            <button onClick={() => bulkUpdateStatus('confirmed')} className="rounded-xl bg-white/10 px-4 py-2 text-xs font-bold text-white hover:bg-white/20 transition">Mark as Confirmed</button>
            <button onClick={() => bulkUpdateStatus('shipped')} className="rounded-xl bg-white/10 px-4 py-2 text-xs font-bold text-white hover:bg-white/20 transition">Mark as Shipped</button>
          </div>
        }
      />
    </div>
  );
}
