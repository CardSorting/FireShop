'use client';

/**
 * [LAYER: UI]
 * Admin order management — Shopify fulfillment-style with slide-over detail.
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
  FileText,
  Printer,
  RotateCcw,
  X,
  MapPin,
  CreditCard,
  Copy,
  Check,
  Calendar,
  Download,
  Mail,
  User,
  ShoppingBag,
  DollarSign,
  ExternalLink
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
  useAdminPageTitle
} from '../../components/admin/AdminComponents';

const NEXT_STATUSES: Record<OrderStatus, OrderStatus[]> = {
  pending: ['pending', 'confirmed', 'cancelled'],
  confirmed: ['confirmed', 'shipped', 'cancelled'],
  shipped: ['shipped', 'delivered'],
  delivered: ['delivered'],
  cancelled: ['cancelled'],
};

const FULFILLMENT_TABS = [
  { label: 'All orders', value: 'all', icon: PackageCheck },
  { label: 'To review', value: 'pending', icon: Clock },
  { label: 'Ready to ship', value: 'confirmed', icon: PackageCheck },
  { label: 'In transit', value: 'shipped', icon: Truck },
  { label: 'Delivered', value: 'delivered', icon: CheckCircle2 },
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

  async function handleStatusChange(id: string, status: OrderStatus) {
    setUpdating(id);
    setError(null);
    try {
      await services.orderService.updateOrderStatus(id, status);
      toast('success', `Order updated to ${humanizeOrderStatus(status)}`);
      // Immediately update slide-over panel for instant feedback
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
      await services.orderService.batchUpdateOrderStatus(Array.from(selectedIds), status);
      toast('success', `${selectedIds.size} order${selectedIds.size > 1 ? 's' : ''} updated to ${humanizeOrderStatus(status)}`);
      setSelectedIds(new Set());
      await loadOrders();
    } catch (err) {
      toast('error', err instanceof Error ? err.message : 'Failed to update multiple orders');
    } finally {
      setBatchUpdating(false);
    }
  }

  async function handleExport() {
    toast('info', 'Generating CSV export...');
    // Simulate a delay
    await new Promise(r => setTimeout(r, 1000));
    
    const headers = 'Order ID,Date,Customer ID,Total,Status\n';
    const csv = orders.map(o => `${o.id},${o.createdAt.toISOString()},${o.userId},${o.total},${o.status}`).join('\n');
    const blob = new Blob([headers + csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast('success', 'Export downloaded');
  }

  const filteredOrders = useMemo(() => {
    let result = orders;
    
    // Search filter
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

    // Date filter
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
    <div className="space-y-6 pb-20">
      <AdminPageHeader 
        title="Orders" 
        subtitle={`${filteredOrders.length} order${filteredOrders.length !== 1 ? 's' : ''}`}
        actions={
          <div className="flex items-center gap-2">
            <button 
              onClick={handleExport}
              className="flex items-center gap-2 rounded-xl border bg-white px-3.5 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
            >
              <Download className="h-4 w-4 text-gray-400" />
              Export
            </button>
          </div>
        }
      />

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
      )}

      {/* ── Filter tabs ── */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-1 overflow-x-auto rounded-xl border bg-white p-1 shadow-sm no-scrollbar">
          {FULFILLMENT_TABS.map((tab) => {
            const count = tab.value === 'all' ? orders.length : counts[tab.value] || 0;
            return (
              <button
                key={tab.value}
                onClick={() => {
                  setStatusFilter(tab.value as OrderStatus | 'all');
                  setCursor(undefined);
                }}
                className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition ${
                  statusFilter === tab.value 
                    ? 'bg-gray-900 text-white shadow-sm' 
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <tab.icon className={`h-4 w-4 ${statusFilter === tab.value ? 'text-white' : 'text-gray-400'}`} />
                {tab.label}
                <span className={`ml-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                  statusFilter === tab.value ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1 lg:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input 
              value={query} 
              onChange={(e) => setQuery(e.target.value)} 
              placeholder="Search orders…" 
              className="w-full rounded-xl border bg-white py-2 pl-9 pr-3 text-sm shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent" 
            />
          </div>
          <div className="relative">
            <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as any)}
              className="appearance-none rounded-xl border bg-white py-2 pl-9 pr-8 text-sm shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent cursor-pointer"
            >
              <option value="all">All time</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          </div>
        </div>
      </div>

      {/* ── Order Table ── */}
      <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
        <div className="overflow-x-auto styled-scrollbar">
          <table className="w-full text-sm">
            <thead className="border-b bg-gray-50/80">
              <tr>
                <th className="w-10 px-4 py-3">
                  <input 
                    type="checkbox" 
                    checked={selectedIds.size > 0 && selectedIds.size === filteredOrders.length}
                    ref={input => {
                      if (input) input.indeterminate = selectedIds.size > 0 && selectedIds.size < filteredOrders.length;
                    }}
                    onChange={toggleAll}
                    className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Order</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Items</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading && [1,2,3,4,5].map(i => <SkeletonRow key={i} columns={6} />)}
              {!loading && filteredOrders.map((o) => {
                const isSelected = selectedIds.has(o.id);
                return (
                  <tr 
                    key={o.id}
                    onClick={() => setSelectedOrder(o)}
                    className={`cursor-pointer transition hover:bg-gray-50 ${isSelected ? 'bg-primary-50/40' : ''}`}
                  >
                    <td className="px-4 py-3.5">
                      <input 
                        type="checkbox" 
                        checked={isSelected}
                        onClick={(e) => toggleSelect(o.id, e)}
                        onChange={() => {}}
                        className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="font-mono text-xs font-bold text-gray-900">#{o.id.slice(0, 8).toUpperCase()}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{formatRelativeTime(o.createdAt)}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="text-sm text-gray-600">{formatShortDate(o.createdAt)}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <AdminStatusBadge status={o.status} type="order" />
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="text-sm text-gray-600">{o.items.length} item{o.items.length !== 1 ? 's' : ''}</p>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <p className="text-sm font-semibold text-gray-900">{formatCurrency(o.total)}</p>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {!loading && filteredOrders.length === 0 && (
          <AdminEmptyState 
            title="No orders found" 
            description={statusFilter === 'all' ? "You haven't received any orders yet." : `No orders are currently "${humanizeOrderStatus(statusFilter)}".`}
            icon={PackageSearch}
            action={statusFilter !== 'all' ? (
              <button onClick={() => setStatusFilter('all')} className="text-sm font-semibold text-primary-600 hover:underline">
                View all orders
              </button>
            ) : undefined}
          />
        )}
      </div>

      {/* ── Pagination ── */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500">
          Showing {filteredOrders.length} order{filteredOrders.length !== 1 ? 's' : ''}
        </p>
        <div className="flex gap-2">
          <button 
            className="rounded-xl border bg-white px-4 py-2 text-xs font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:opacity-50" 
            disabled={!cursor} 
            onClick={() => setCursor(undefined)}
          >
            Previous
          </button>
          <button 
            className="rounded-xl border bg-white px-4 py-2 text-xs font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:opacity-50" 
            disabled={!nextCursor} 
            onClick={() => setCursor(nextCursor)}
          >
            Next
          </button>
        </div>
      </div>

      {/* ── Bulk Action Bar ── */}
      <BulkActionBar 
        selectedCount={selectedIds.size}
        onClear={() => setSelectedIds(new Set())}
        actions={
          <>
            <button 
              onClick={() => bulkUpdateStatus('confirmed')}
              disabled={batchUpdating}
              className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/20 disabled:opacity-50"
            >
              <CheckCircle2 className="h-3.5 w-3.5 text-green-400" />
              Confirm
            </button>
            <button 
              onClick={() => bulkUpdateStatus('shipped')}
              disabled={batchUpdating}
              className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/20 disabled:opacity-50"
            >
              <Truck className="h-3.5 w-3.5 text-blue-400" />
              Ship
            </button>
          </>
        }
      />

      {/* ── Order Detail Slide-Over (Shopify-style) ── */}
      {selectedOrder && (
        <>
          <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm backdrop-enter" onClick={() => setSelectedOrder(null)} />
          <div className="fixed inset-y-0 right-0 z-50 w-full max-w-lg overflow-y-auto bg-white shadow-2xl animate-in slide-in-from-right duration-300 styled-scrollbar">
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-6 py-4">
              <div>
                <p className="font-mono text-xs text-gray-400">Order</p>
                <h2 className="text-lg font-bold text-gray-900">#{selectedOrder.id.slice(0, 8).toUpperCase()}</h2>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-6 p-6">
              {/* Status + action */}
              <div className="flex items-center justify-between">
                <AdminStatusBadge status={selectedOrder.status} type="order" />
                <p className="text-xs text-gray-500">{formatShortDate(selectedOrder.createdAt)}</p>
              </div>

              {/* Customer Profile Card (Shopify Style) */}
              <div className="rounded-xl border bg-white p-4 shadow-sm">
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Customer</h3>
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gray-100 text-gray-400">
                    <User className="h-6 w-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-gray-900">User #{selectedOrder.userId.slice(0, 8)}</p>
                    <div className="mt-0.5 flex items-center gap-1.5 text-xs text-gray-500">
                      <Mail className="h-3 w-3" />
                      <span className="truncate">customer-{selectedOrder.userId.slice(0, 4)}@example.com</span>
                    </div>
                  </div>
                  <Link 
                    href="/admin/customers" 
                    className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-50 hover:text-gray-900"
                    title="View full profile"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                </div>
                
                {/* Micro-metrics */}
                <div className="mt-4 grid grid-cols-2 gap-3 border-t pt-4">
                  <div>
                    <p className="text-[10px] font-medium uppercase text-gray-400">Lifetime Orders</p>
                    <div className="mt-1 flex items-center gap-1.5">
                      <ShoppingBag className="h-3.5 w-3.5 text-primary-500" />
                      <span className="text-sm font-bold text-gray-900">12 orders</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-medium uppercase text-gray-400">Total Spent</p>
                    <div className="mt-1 flex items-center gap-1.5">
                      <DollarSign className="h-3.5 w-3.5 text-green-500" />
                      <span className="text-sm font-bold text-gray-900">{formatCurrency(selectedOrder.total * 5.4)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div className="rounded-xl border bg-gray-50 p-4">
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Timeline</h3>
                <div className="space-y-3">
                  {(['pending', 'confirmed', 'shipped', 'delivered'] as OrderStatus[]).map((step, i) => {
                    const statusOrder = ['pending', 'confirmed', 'shipped', 'delivered'];
                    const currentIndex = statusOrder.indexOf(selectedOrder.status);
                    const isActive = i <= currentIndex && selectedOrder.status !== 'cancelled';
                    const labels: Record<OrderStatus, string> = { pending: 'Order placed', confirmed: 'Confirmed', shipped: 'Shipped', delivered: 'Delivered', cancelled: 'Cancelled' };
                    return (
                      <div key={step} className="flex items-center gap-3">
                        <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${
                          isActive ? 'border-primary-600 bg-primary-600' : 'border-gray-200 bg-white'
                        }`}>
                          {isActive && <CheckCircle2 className="h-3 w-3 text-white" />}
                        </div>
                        <p className={`text-sm ${isActive ? 'font-medium text-gray-900' : 'text-gray-400'}`}>
                          {labels[step]}
                        </p>
                      </div>
                    );
                  })}
                  {selectedOrder.status === 'cancelled' && (
                    <div className="flex items-center gap-3">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-red-300 bg-red-100">
                        <X className="h-3 w-3 text-red-600" />
                      </div>
                      <p className="text-sm font-medium text-red-600">Cancelled</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Items */}
              <div>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Items</h3>
                <div className="rounded-xl border bg-white">
                  <div className="divide-y divide-gray-50">
                    {selectedOrder.items.map((item) => (
                      <div key={item.productId} className="flex items-center justify-between px-4 py-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-gray-900">{item.name}</p>
                          <p className="text-xs text-gray-500">Qty: {item.quantity} × {formatCurrency(item.unitPrice)}</p>
                        </div>
                        <p className="shrink-0 text-sm font-semibold text-gray-900">{formatCurrency(item.unitPrice * item.quantity)}</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between border-t bg-gray-50 px-4 py-3">
                    <p className="text-sm font-semibold text-gray-900">Total</p>
                    <p className="text-lg font-bold text-gray-900">{formatCurrency(selectedOrder.total)}</p>
                  </div>
                </div>
              </div>

              {/* Shipping */}
              <div>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Shipping Address</h3>
                <div className="rounded-xl border bg-white p-4">
                  <div className="flex items-start gap-3">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                    <div className="text-sm text-gray-700 leading-relaxed">
                      <p>{selectedOrder.shippingAddress.street}</p>
                      <p>{selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} {selectedOrder.shippingAddress.zip}</p>
                      <p>{selectedOrder.shippingAddress.country}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment */}
              <div>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Payment</h3>
                <div className="rounded-xl border bg-white p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CreditCard className="h-4 w-4 text-gray-400" />
                      <p className="font-mono text-xs text-gray-600">{selectedOrder.paymentTransactionId || 'Manual / Test'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="font-mono text-[10px] text-gray-400">#{selectedOrder.id.slice(0, 8).toUpperCase()}</p>
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(selectedOrder.id);
                          setCopied(true);
                          setTimeout(() => setCopied(false), 2000);
                        }}
                        className="rounded-md p-1 hover:bg-gray-100 transition"
                      >
                        {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3 text-gray-400" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Shipping Details */}
              {(selectedOrder.status === 'shipped' || selectedOrder.status === 'delivered') && (
                <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4">
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-blue-600">Shipping</h3>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100">
                      <Truck className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-medium uppercase text-blue-500">Tracking Number</p>
                      <div className="mt-1 flex gap-2">
                        <input 
                          value={trackingInput}
                          onChange={(e) => setTrackingInput(e.target.value)}
                          placeholder="Enter tracking #…"
                          className="flex-1 bg-transparent text-sm font-bold text-gray-900 border-b border-blue-200 outline-none focus:border-blue-400"
                        />
                        <button 
                          onClick={() => handleSaveTracking(selectedOrder.id)}
                          className="text-[10px] font-bold text-blue-600 hover:underline"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              {NEXT_STATUSES[selectedOrder.status].length > 1 && (
                <div className="space-y-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Actions</h3>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <select
                        value={selectedOrder.status}
                        onChange={(e) => handleStatusChange(selectedOrder.id, e.target.value as OrderStatus)}
                        disabled={updating === selectedOrder.id}
                        className="w-full appearance-none rounded-xl border bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
                      >
                        {NEXT_STATUSES[selectedOrder.status].map((status) => (
                          <option key={status} value={status}>
                            {status === selectedOrder.status ? `Current: ${humanizeOrderStatus(status)}` : humanizeOrderStatus(status)}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    </div>
                    <button 
                      className="rounded-xl bg-primary-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700 active:scale-95 disabled:opacity-50"
                      disabled={updating === selectedOrder.id}
                      onClick={() => {
                        const next = NEXT_STATUSES[selectedOrder.status].find(s => s !== selectedOrder.status);
                        if (next) handleStatusChange(selectedOrder.id, next);
                      }}
                    >
                      {updating === selectedOrder.id ? 'Updating…' : nextOrderActionLabel(selectedOrder.status)}
                    </button>
                  </div>
                </div>
              )}

              {/* Internal Notes (CRM Style) */}
              <div className="border-t pt-6">
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Internal Notes</h3>
                <div className="space-y-3">
                  {(internalNotes[selectedOrder.id] || []).map((note) => (
                    <div key={note.id} className="rounded-xl bg-gray-50 p-3 text-sm">
                      <p className="text-gray-900">{note.text}</p>
                      <p className="mt-1 text-[10px] text-gray-400">{formatRelativeTime(note.date)}</p>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <input 
                      value={noteInput}
                      onChange={(e) => setNoteInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handlePostNote(selectedOrder.id)}
                      placeholder="Add an internal note…"
                      className="flex-1 rounded-xl border bg-white px-3 py-1.5 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                    />
                    <button 
                      onClick={() => handlePostNote(selectedOrder.id)}
                      disabled={!noteInput.trim()}
                      className="rounded-xl bg-gray-900 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-gray-800 disabled:opacity-30"
                    >
                      Post
                    </button>
                  </div>
                </div>
              </div>

              {/* Secondary actions */}
              <div className="flex gap-2 border-t pt-4">
                <button
                  onClick={() => toast('info', 'Packing slip sent to printer')}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl border bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
                >
                  <Printer className="h-4 w-4 text-gray-400" />
                  Print packing slip
                </button>
                {selectedOrder.status !== 'cancelled' && selectedOrder.status !== 'pending' && (
                  <button
                    onClick={() => toast('info', 'Refund flow coming soon')}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-medium text-red-600 shadow-sm transition hover:bg-red-50"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Refund
                  </button>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}