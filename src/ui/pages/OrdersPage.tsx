'use client';

/**
 * [LAYER: UI]
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Calendar,
  ChevronDown,
  ChevronUp,
  CircleHelp,
  Package,
  Receipt,
  RefreshCcw,
  Search,
  ShieldCheck,
  ShoppingBag,
  Truck,
} from 'lucide-react';
import type { Order, OrderStatus } from '@domain/models';
import { logger } from '@utils/logger';
import {
  formatDate,
  formatMoney,
  formatOrderNumber,
  formatShortDate,
  orderStatusSubtitle,
} from '@utils/formatters';
import { useAuth } from '../hooks/useAuth';
import { useCart } from '../hooks/useCart';
import { useServices } from '../hooks/useServices';

type StatusFilter = 'all' | OrderStatus;
type SortOption = 'newest' | 'oldest' | 'total_desc' | 'total_asc' | 'status';
type DateWindow = '30d' | '90d' | 'all';

const STATUS_FILTERS: StatusFilter[] = ['all', 'pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];

const STATUS_UI: Record<OrderStatus, { badge: string; dot: string; label: string }> = {
  pending: { badge: 'bg-amber-50 text-amber-700 border-amber-100', dot: 'bg-amber-500', label: 'Order placed' },
  confirmed: { badge: 'bg-blue-50 text-blue-700 border-blue-100', dot: 'bg-blue-500', label: 'Processing' },
  shipped: { badge: 'bg-violet-50 text-violet-700 border-violet-100', dot: 'bg-violet-500', label: 'On the way' },
  delivered: { badge: 'bg-green-50 text-green-700 border-green-100', dot: 'bg-green-500', label: 'Delivered' },
  cancelled: { badge: 'bg-red-50 text-red-700 border-red-100', dot: 'bg-red-500', label: 'Cancelled' },
};

function dateWindowToFrom(dateWindow: DateWindow): string | undefined {
  if (dateWindow === 'all') return undefined;
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - (dateWindow === '30d' ? 30 : 90));
  return start.toISOString();
}

export function OrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const { addItem, openCart } = useCart();
  const services = useServices();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [dateWindow, setDateWindow] = useState<DateWindow>('90d');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [reordering, setReordering] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const result = await services.orderService.getOrders(user.id, {
        status: statusFilter,
        query: searchQuery.trim() || undefined,
        from: dateWindowToFrom(dateWindow),
        sort: sortBy,
      });
      setOrders(result);
    } catch (error) {
      logger.error('Failed to load orders', error);
    } finally {
      setLoading(false);
    }
  }, [dateWindow, searchQuery, services.orderService, sortBy, statusFilter, user]);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  const onReorder = async (order: Order) => {
    setReordering(order.id);
    try {
      for (const item of order.items) {
        await addItem(item.productId, item.quantity);
      }
      openCart();
    } catch (error) {
      logger.error('Failed to reorder items', error);
    } finally {
      setReordering(null);
    }
  };

  const spotlightOrder = orders[0];

  const summary = useMemo(() => {
    const active = orders.filter((o) => o.status === 'pending' || o.status === 'confirmed' || o.status === 'shipped').length;
    const delivered = orders.filter((o) => o.status === 'delivered').length;
    const totalSpent = orders.filter((o) => o.status !== 'cancelled').reduce((sum, o) => sum + o.total, 0);
    return { active, delivered, totalSpent };
  }, [orders]);

  if (authLoading || loading) {
    return (
      <div className="mx-auto max-w-6xl animate-pulse space-y-6 px-4 py-12">
        <div className="h-36 rounded-3xl bg-gray-100" />
        <div className="h-20 rounded-3xl bg-gray-50" />
        <div className="h-52 rounded-3xl bg-gray-50" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <div className="mx-auto mb-7 flex h-20 w-20 items-center justify-center rounded-full bg-amber-50 text-amber-500">
          <ShieldCheck className="h-10 w-10" />
        </div>
        <h1 className="text-4xl font-black text-gray-900">Sign in to view your orders</h1>
        <p className="mt-4 text-lg font-medium text-gray-500">Order details and receipts are only available to the account owner.</p>
        <div className="mt-8 flex flex-col items-center gap-3">
          <Link href="/login" className="inline-flex items-center gap-2 rounded-2xl bg-gray-900 px-8 py-4 text-sm font-black text-white hover:bg-black">Sign in <ArrowRight className="h-4 w-4" /></Link>
          <Link href="/products" className="text-sm font-bold text-gray-500 hover:text-gray-900">Continue shopping</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
      <section className="rounded-3xl border border-gray-100 bg-white p-7 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-gray-400">Orders</p>
            <h1 className="mt-2 text-4xl font-black tracking-tight text-gray-900">Track, reorder, and manage receipts</h1>
            <p className="mt-3 max-w-2xl text-sm font-medium text-gray-600">A Shopify-style overview with clear status, familiar actions, and timeline updates so non-technical users always know what to do next.</p>
          </div>
          {spotlightOrder && (
            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-5 lg:min-w-80">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Most recent order</p>
              <p className="mt-2 text-lg font-black text-gray-900">{formatOrderNumber(spotlightOrder.id)}</p>
              <p className="mt-1 text-sm font-bold text-gray-600">{STATUS_UI[spotlightOrder.status].label}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link href={`/orders/${spotlightOrder.id}`} className="rounded-xl bg-gray-900 px-4 py-2 text-xs font-black text-white hover:bg-black">View details</Link>
                {spotlightOrder.trackingUrl && (
                  <a href={spotlightOrder.trackingUrl} target="_blank" rel="noreferrer" className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-black text-gray-700 hover:bg-gray-50">Track package</a>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <MetricCard label="Active orders" value={String(summary.active)} icon={<Truck className="h-4 w-4" />} />
          <MetricCard label="Delivered" value={String(summary.delivered)} icon={<Package className="h-4 w-4" />} />
          <MetricCard label="Total spent" value={formatMoney(summary.totalSpent)} icon={<Receipt className="h-4 w-4" />} />
        </div>
      </section>

      {orders.length === 0 ? (
        <section className="rounded-3xl border border-gray-100 bg-white p-12 text-center shadow-sm">
          <ShoppingBag className="mx-auto mb-3 h-10 w-10 text-gray-300" />
          <h2 className="text-2xl font-black text-gray-900">No orders yet</h2>
          <p className="mt-2 text-sm font-medium text-gray-500">Once you place an order, tracking updates and receipts will appear here.</p>
          <Link href="/products" className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-gray-900 px-6 py-3 text-sm font-black text-white hover:bg-black">Start shopping <ArrowRight className="h-4 w-4" /></Link>
        </section>
      ) : (
        <>
          <section className="rounded-3xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
              <div className="relative lg:col-span-5">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search order number or item name"
                  className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-3 text-sm font-medium outline-none focus:border-gray-900"
                />
              </div>

              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as StatusFilter)} className="rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm font-bold text-gray-700 outline-none focus:border-gray-900 lg:col-span-2">
                {STATUS_FILTERS.map((status) => <option key={status} value={status}>{status === 'all' ? 'All statuses' : STATUS_UI[status].label}</option>)}
              </select>

              <select value={dateWindow} onChange={(event) => setDateWindow(event.target.value as DateWindow)} className="rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm font-bold text-gray-700 outline-none focus:border-gray-900 lg:col-span-2">
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="all">All time</option>
              </select>

              <select value={sortBy} onChange={(event) => setSortBy(event.target.value as SortOption)} className="rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm font-bold text-gray-700 outline-none focus:border-gray-900 lg:col-span-3">
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="total_desc">Highest total</option>
                <option value="total_asc">Lowest total</option>
                <option value="status">Status</option>
              </select>
            </div>
          </section>

          <section className="space-y-4" aria-label="Order history list">
            {orders.map((order) => {
              const expanded = expandedOrderId === order.id;
              const ui = STATUS_UI[order.status];
              const topEvent = order.fulfillmentEvents?.[0];

              return (
                <article key={order.id} className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
                  <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-12 md:items-center">
                    <div className="md:col-span-3">
                      <p className="font-mono text-sm font-black text-gray-900">{formatOrderNumber(order.id)}</p>
                      <p className="mt-1 text-xs font-medium text-gray-500">Placed {formatDate(order.createdAt)}</p>
                    </div>

                    <div className="md:col-span-3">
                      <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-black ${ui.badge}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${ui.dot}`} />
                        {ui.label}
                      </span>
                      <p className="mt-2 text-xs font-medium text-gray-500">{orderStatusSubtitle(order.status)}</p>
                    </div>

                    <div className="md:col-span-2">
                      <p className="text-xs font-black uppercase tracking-widest text-gray-400">Total</p>
                      <p className="mt-1 text-lg font-black text-gray-900">{formatMoney(order.total)}</p>
                    </div>

                    <div className="md:col-span-2">
                      <p className="text-xs font-black uppercase tracking-widest text-gray-400">Latest update</p>
                      <p className="mt-1 text-sm font-bold text-gray-700">{topEvent ? topEvent.label : 'Order created'}</p>
                    </div>

                    <div className="flex justify-end gap-2 md:col-span-2">
                      <Link href={`/orders/${order.id}`} className="rounded-xl bg-gray-900 px-3 py-2 text-xs font-black text-white hover:bg-black">Details</Link>
                      <button type="button" onClick={() => setExpandedOrderId(expanded ? null : order.id)} className="rounded-xl border border-gray-200 px-3 py-2 text-xs font-black text-gray-700 hover:bg-gray-50" aria-expanded={expanded}>
                        {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {expanded && (
                    <div className="border-t border-gray-100 bg-gray-50/70 p-5">
                      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                        <div className="space-y-3 lg:col-span-7">
                          <h3 className="text-xs font-black uppercase tracking-widest text-gray-500">Timeline</h3>
                          <ol className="space-y-3">
                            {(order.fulfillmentEvents ?? []).map((event) => (
                              <li key={event.id} className="rounded-xl border border-gray-100 bg-white p-3">
                                <div className="flex items-center justify-between gap-3">
                                  <p className="text-sm font-black text-gray-900">{event.label}</p>
                                  <p className="text-xs font-bold text-gray-500">{formatShortDate(event.at)}</p>
                                </div>
                                <p className="mt-1 text-xs font-medium text-gray-600">{event.description}</p>
                              </li>
                            ))}
                          </ol>
                        </div>

                        <div className="space-y-3 lg:col-span-5">
                          <h3 className="text-xs font-black uppercase tracking-widest text-gray-500">Actions</h3>
                          <div className="grid grid-cols-1 gap-2">
                            {order.trackingUrl ? (
                              <a href={order.trackingUrl} target="_blank" rel="noreferrer" className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-black text-gray-700 hover:bg-gray-50">Track package</a>
                            ) : (
                              <div className="rounded-xl border border-dashed border-gray-200 bg-white px-4 py-3 text-sm font-bold text-gray-500">Tracking will appear after shipment.</div>
                            )}
                            <button type="button" onClick={() => onReorder(order)} disabled={reordering === order.id} className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-900 px-4 py-3 text-sm font-black text-white hover:bg-black disabled:opacity-60">
                              <RefreshCcw className={`h-4 w-4 ${reordering === order.id ? 'animate-spin' : ''}`} />
                              {reordering === order.id ? 'Adding items...' : 'Buy again'}
                            </button>
                            <Link href={`/orders/${order.id}`} className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-black text-gray-700 hover:bg-gray-50">View receipt and order details</Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </section>
        </>
      )}

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <SupportCard icon={<CircleHelp className="h-5 w-5" />} title="Need help with an order?" text="Talk to support for delivery issues, damaged items, or billing questions." href="/contact" action="Contact support" />
        <SupportCard icon={<Calendar className="h-5 w-5" />} title="Returns & refund windows" text="Review policy details before starting a return request." href="/refund-policy" action="View refund policy" />
        <SupportCard icon={<ShieldCheck className="h-5 w-5" />} title="Purchase confidence" text="Every shipment is verified and packed with collector-safe handling." href="/shipping-policy" action="Read shipping policy" />
      </section>
    </div>
  );
}

function MetricCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3">
      <p className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-500">{icon}{label}</p>
      <p className="mt-1 text-xl font-black text-gray-900">{value}</p>
    </div>
  );
}

function SupportCard({
  icon,
  title,
  text,
  href,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
  href: string;
  action: string;
}) {
  return (
    <Link href={href} className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-gray-50 text-primary-600">{icon}</div>
      <h3 className="text-base font-black text-gray-900">{title}</h3>
      <p className="mt-1 text-sm font-medium text-gray-600">{text}</p>
      <p className="mt-4 inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-primary-600">{action} <ArrowRight className="h-3.5 w-3.5" /></p>
    </Link>
  );
}