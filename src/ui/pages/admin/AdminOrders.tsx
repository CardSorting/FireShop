'use client';

/**
 * [LAYER: UI]
 * Admin order management — High-velocity fulfillment console.
 * Patterns modeled after Shopify Admin with optimized information density.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
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
  RotateCcw,
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
  confirmed: ['confirmed', 'shipped', 'cancelled'],
  shipped: ['shipped', 'delivered'],
  delivered: ['delivered'],
  cancelled: ['cancelled'],
};

const FULFILLMENT_TABS = [
  { label: 'All', value: 'all', icon: PackageCheck },
  { label: 'To review', value: 'pending', icon: Clock },
  { label: 'Ready to ship', value: 'confirmed', icon: PackageCheck },
  { label: 'In transit', value: 'shipped', icon: Truck },
  { label: 'Completed', value: 'delivered', icon: CheckCircle2 },
];

export function AdminOrders() {
  useAdminPageTitle('Orders');
  const services = useServices();
  const { toast } = useToast();
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

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await services.orderService.getAllOrders({
        limit: 25,
        cursor,
        status: statusFilter === 'all' ? undefined : statusFilter,
      });
      setOrders(result.orders);
      setNextCursor(result.nextCursor);
      setSelectedIds(new Set());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, [cursor, services.orderService, statusFilter]);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  useEffect(() => {
    if (selectedOrder) {
      setNoteInput('');
      setTrackingInput(trackingNumbers[selectedOrder.id] || '');
    }
  }, [selectedOrder, trackingNumbers]);

  function handlePostNote(orderId: string) {
    if (!noteInput.trim()) return;
    const newNote = { id: Math.random().toString(36).slice(2), text: noteInput, date: new Date() };
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
      toast('success', `Order updated to ${humanizeOrderStatus(status)}`);
      if (selectedOrder?.id === id) {
        setSelectedOrder(prev => prev ? { ...prev, status } : null);
      }
      await loadOrders();
    } catch (err) {
      toast('error', err instanceof Error ? err.message : 'Failed to update order status');
    } finally {
      setUpdating(null);
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
      toast('success', `${selectedIds.size} order${selectedIds.size > 1 ? 's' : ''} updated to ${humanizeOrderStatus(status)}`);
      setSelectedIds(new Set());
      await loadOrders();
    } catch (err) {
      toast('error', err instanceof Error ? err.message : 'Failed to update multiple orders');
    } finally {
      setBatchUpdating(false);
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
        subtitle="Manage fulfillment and customer communications"
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
                    onClick={() => setSelectedOrder(o)}
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
                      <AdminStatusBadge status={o.status} type="order" />
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

      {/* ── Detail Panel (Slide-over) ── */}
      {selectedOrder && (
        <>
          <div className="fixed inset-0 z-60 bg-gray-900/40 backdrop-blur-sm" onClick={() => setSelectedOrder(null)} />
          <div className="fixed inset-y-0 right-0 z-70 w-full max-w-xl overflow-y-auto bg-[#F6F6F7] shadow-2xl animate-in slide-in-from-right duration-300 border-l">
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-6 py-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900 tracking-tight">Order #{selectedOrder.id.slice(0, 8).toUpperCase()}</h2>
                <p className="text-xs font-medium text-gray-500">{formatShortDate(selectedOrder.createdAt)}</p>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => toast('info', 'Generating packing slip...')}
                  className="flex items-center gap-2 rounded-lg border bg-white px-3 py-1.5 text-[10px] font-bold text-gray-700 shadow-sm transition hover:bg-gray-50"
                >
                  <Printer className="h-3.5 w-3.5 text-gray-400" />
                  Packing Slip
                </button>
                <button onClick={() => setSelectedOrder(null)} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 transition ml-2"><X className="h-5 w-5" /></button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Primary Action Card */}
              <div className="rounded-xl border bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <AdminStatusBadge status={selectedOrder.status} type="order" />
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Current Status</p>
                </div>

                {NEXT_STATUSES[selectedOrder.status].length > 1 && (
                  <div className="flex flex-col gap-3 pt-4 border-t">
                    <p className="text-xs font-bold text-gray-900">Next step for this order:</p>
                    <div className="flex gap-2">
                      <button
                        className="flex-1 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-primary-700"
                        onClick={() => {
                          const next = NEXT_STATUSES[selectedOrder.status].find(s => s !== selectedOrder.status);
                          if (next) handleStatusChange(selectedOrder.id, next);
                        }}
                      >
                        {nextOrderActionLabel(selectedOrder.status)}
                      </button>
                      <div className="relative">
                        <select
                          value={selectedOrder.status}
                          onChange={(e) => handleStatusChange(selectedOrder.id, e.target.value as OrderStatus)}
                          className="appearance-none h-full rounded-lg border bg-white px-4 py-2.5 pr-10 text-sm font-bold text-gray-700 shadow-sm outline-none"
                        >
                          {NEXT_STATUSES[selectedOrder.status].map((status) => (
                            <option key={status} value={status}>{humanizeOrderStatus(status)}</option>
                          ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Risk Evaluation (Stripe Radar style) */}
              <div className="rounded-xl border bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-primary-500" />
                    <h3 className="text-xs font-bold uppercase tracking-widest text-gray-900">Fraud Analysis</h3>
                  </div>
                  <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    selectedOrder.riskScore > 60 ? 'bg-red-50 text-red-600' : 
                    selectedOrder.riskScore > 30 ? 'bg-amber-50 text-amber-600' : 
                    'bg-green-50 text-green-600'
                  }`}>
                    {selectedOrder.riskScore > 60 ? <AlertTriangle className="h-3 w-3" /> : <CheckCircle2 className="h-3 w-3" />}
                    {selectedOrder.riskScore > 60 ? 'High Risk' : selectedOrder.riskScore > 30 ? 'Elevated Risk' : 'Normal Risk'}
                  </span>
                </div>
                <div className="space-y-3">
                   <div className="flex items-center justify-between text-xs">
                     <span className="text-gray-500 font-medium">Card verification (CVC)</span>
                     <span className="text-gray-900 font-bold">Passed</span>
                   </div>
                   <div className="flex items-center justify-between text-xs">
                     <span className="text-gray-500 font-medium">Street address verification</span>
                     <span className="text-gray-900 font-bold">Match</span>
                   </div>
                   <div className="flex items-center justify-between text-xs">
                     <span className="text-gray-500 font-medium">Zip code verification</span>
                     <span className="text-gray-900 font-bold">Match</span>
                   </div>
                </div>
                <div className="mt-4 pt-4 border-t">
                   <p className="text-[10px] text-gray-400 font-medium italic">
                     Stripe Radar analyzed this payment and found no indicators of fraud.
                   </p>
                </div>
              </div>

              {/* Packing Slip Action */}
              <div className="rounded-xl border border-primary-100 bg-primary-50/30 p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-primary-900">Logistics</h3>
                  <Printer className="h-4 w-4 text-primary-600" />
                </div>
                <button 
                  onClick={() => {
                    const printWindow = window.open('', '_blank');
                    if (printWindow) {
                      printWindow.document.write(`
                        <html>
                          <head>
                            <title>Packing Slip - ${selectedOrder.id}</title>
                            <script src="https://cdn.tailwindcss.com"></script>
                          </head>
                          <body class="bg-white">
                            <div class="p-12 max-w-[800px] mx-auto">
                              <div class="flex justify-between items-start border-b-2 border-gray-900 pb-8 mb-8">
                                <div>
                                  <h1 class="text-4xl font-black uppercase tracking-tighter mb-2">Packing Slip</h1>
                                  <p class="text-sm font-bold text-gray-500">Order #${selectedOrder.id.slice(0, 8).toUpperCase()}</p>
                                </div>
                                <div class="text-right">
                                  <p class="text-xl font-black uppercase">PlayMore TCG</p>
                                  <p class="text-xs font-medium text-gray-500">123 Pallet Town Road, Kanto</p>
                                  <p class="text-xs font-medium text-gray-500">support@playmoretcg.com</p>
                                </div>
                              </div>
                              <div class="grid grid-cols-2 gap-12 mb-12">
                                <div>
                                  <h2 class="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Ship To</h2>
                                  <p class="text-sm font-bold">${selectedOrder.customerName}</p>
                                  <p class="text-sm font-medium text-gray-600">${selectedOrder.shippingAddress.street}</p>
                                  <p class="text-sm font-medium text-gray-600">${selectedOrder.shippingAddress.city}, ${selectedOrder.shippingAddress.state} ${selectedOrder.shippingAddress.zip}</p>
                                </div>
                                <div class="text-right">
                                  <h2 class="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Order Info</h2>
                                  <p class="text-sm font-bold">${selectedOrder.createdAt.toLocaleDateString()}</p>
                                </div>
                              </div>
                              <table class="w-full mb-12">
                                <thead class="border-b border-gray-200">
                                  <tr>
                                    <th class="py-3 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Description</th>
                                    <th class="py-3 text-center text-[10px] font-black uppercase tracking-widest text-gray-400">Qty</th>
                                  </tr>
                                </thead>
                                <tbody class="divide-y divide-gray-100">
                                  ${selectedOrder.items.map(item => `
                                    <tr>
                                      <td class="py-4 text-sm font-bold">${item.name}</td>
                                      <td class="py-4 text-center text-sm font-bold">${item.quantity}</td>
                                    </tr>
                                  `).join('')}
                                </tbody>
                              </table>
                              <div class="border-t pt-8 text-center">
                                <p class="text-xs font-bold text-gray-400 italic">Thank you for shopping with PlayMore TCG!</p>
                              </div>
                            </div>
                            <script>window.print();</script>
                          </body>
                        </html>
                      `);
                      printWindow.document.close();
                    }
                  }}
                  className="w-full rounded-lg bg-white border border-primary-200 px-4 py-2.5 text-xs font-bold text-primary-700 shadow-sm transition hover:bg-primary-50"
                >
                  Print Packing Slip
                </button>
              </div>

              {/* Items Card */}
              <div className="rounded-xl border bg-white shadow-sm">
                <div className="border-b px-5 py-4 bg-gray-50/50">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-gray-900">Items ({selectedOrder.items.length})</h3>
                </div>
                <div className="divide-y divide-gray-100">
                  {selectedOrder.items.map((item) => (
                    <div key={item.productId} className="flex items-center justify-between px-5 py-4">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate">{item.name}</p>
                        <p className="text-[10px] font-medium text-gray-500 mt-0.5">{item.quantity} × {formatCurrency(item.unitPrice)}</p>
                      </div>
                      <p className="text-sm font-bold text-gray-900 tracking-tight">{formatCurrency(item.unitPrice * item.quantity)}</p>
                    </div>
                  ))}
                </div>
                <div className="bg-gray-50 px-5 py-4 border-t space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Subtotal</span>
                    <span>{formatCurrency(selectedOrder.total)}</span>
                  </div>
                  <div className="flex items-center justify-between text-base font-bold text-gray-900 border-t pt-2 mt-2">
                    <span>Total Paid</span>
                    <span className="tracking-tight">{formatCurrency(selectedOrder.total)}</span>
                  </div>
                </div>
              </div>

              {/* Customer & Shipping Grid */}
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="rounded-xl border bg-white p-5 shadow-sm">
                  <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-gray-400">Customer</h3>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-600 font-bold text-xs uppercase">
                      {(selectedOrder.customerName || 'U').split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-gray-900 truncate">{selectedOrder.customerName || 'Anonymous User'}</p>
                      <p className="text-[10px] font-medium text-gray-500 truncate">{selectedOrder.customerEmail}</p>
                    </div>
                  </div>
                </div>
                <div className="rounded-xl border bg-white p-5 shadow-sm">
                  <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-gray-400">Shipping</h3>
                  <div className="space-y-1 text-sm text-gray-700 font-medium">
                    <p>{selectedOrder.shippingAddress.street}</p>
                    <p>{selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} {selectedOrder.shippingAddress.zip}</p>
                  </div>
                </div>
              </div>

              {/* Timeline / Notes */}
              <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
                <div className="border-b px-5 py-4 bg-gray-50/50">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-gray-900">Timeline</h3>
                </div>
                
                <div className="p-6">
                   <div className="relative space-y-6 pl-6">
                     <div className="absolute left-2.5 top-2 bottom-2 w-px bg-gray-100" />

                     {/* System Events */}
                     <div className="relative">
                       <div className="absolute left-[-1.55rem] mt-1.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-green-500 shadow-sm" />
                       <div className="flex items-center justify-between">
                         <p className="text-xs font-bold text-gray-900">Payment captured</p>
                         <span className="text-[10px] font-medium text-gray-400 uppercase">{formatShortDate(selectedOrder.createdAt)}</span>
                       </div>
                       <p className="text-[10px] text-gray-500 font-medium">Stripe ID: {selectedOrder.paymentTransactionId || 'pi_3Kj9X...'}</p>
                     </div>

                     <div className="relative">
                       <div className="absolute left-[-1.55rem] mt-1.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-blue-500 shadow-sm" />
                       <div className="flex items-center justify-between">
                         <p className="text-xs font-bold text-gray-900">Order placed by customer</p>
                         <span className="text-[10px] font-medium text-gray-400 uppercase">{formatShortDate(selectedOrder.createdAt)}</span>
                       </div>
                     </div>

                     {/* Custom Notes */}
                     {(internalNotes[selectedOrder.id] || []).map((note) => (
                       <div key={note.id} className="relative">
                         <div className="absolute left-[-1.55rem] mt-1.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-gray-300 shadow-sm" />
                         <div className="flex items-center justify-between">
                           <p className="text-xs font-bold text-gray-900">Admin Note</p>
                           <span className="text-[10px] font-medium text-gray-400 uppercase">{formatRelativeTime(note.date)}</span>
                         </div>
                         <div className="mt-1 rounded-lg bg-amber-50 p-3 text-xs text-amber-900 italic leading-relaxed border border-amber-100/50">
                           {note.text}
                         </div>
                       </div>
                     ))}
                   </div>

                   {/* Add Note Input */}
                   <div className="mt-8 flex gap-2">
                     <input
                       value={noteInput}
                       onChange={(e) => setNoteInput(e.target.value)}
                       onKeyDown={(e) => e.key === 'Enter' && handlePostNote(selectedOrder.id)}
                       placeholder="Add a comment or note…"
                       className="flex-1 rounded-lg border bg-gray-50 px-3 py-2 text-xs font-medium outline-none focus:ring-2 focus:ring-primary-500 transition"
                     />
                     <button
                       onClick={() => handlePostNote(selectedOrder.id)}
                       disabled={!noteInput.trim()}
                       className="rounded-lg bg-gray-900 px-4 py-2 text-xs font-bold text-white transition hover:bg-gray-800 disabled:opacity-30"
                     >
                       Comment
                     </button>
                   </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

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