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
  ExternalLink,
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

import { OrderTimeline } from '../components/OrderTimeline';

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
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
      <header className="relative overflow-hidden rounded-[2.5rem] bg-gray-900 p-8 text-white shadow-2xl lg:p-12">
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-primary-600/20 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-blue-600/10 blur-3xl" />
        
        <div className="relative flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <nav className="mb-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
              <Link href="/" className="hover:text-white">Store</Link>
              <span className="text-gray-600">/</span>
              <span className="text-white">Order History</span>
            </nav>
            <h1 className="text-4xl font-black tracking-tight md:text-5xl lg:text-6xl">Your Orders.</h1>
            <p className="mt-4 text-base font-medium text-gray-400">Track shipments, manage receipts, and quickly reorder your favorite collector items with our Shopify-inspired dashboard.</p>
          </div>
          
          <div className="flex flex-wrap gap-4">
            <MetricCard label="Active" value={String(summary.active)} icon={<Truck className="h-4 w-4" />} dark />
            <MetricCard label="Delivered" value={String(summary.delivered)} icon={<Package className="h-4 w-4" />} dark />
            <MetricCard label="Total Spent" value={formatMoney(summary.totalSpent)} icon={<Receipt className="h-4 w-4" />} dark />
          </div>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="lg:col-span-12">
          {/* Seamless Order Feeds Tabs */}
          <div className="mb-6 flex gap-8 overflow-x-auto border-b border-gray-100 custom-scrollbar hide-scrollbar">
            {STATUS_FILTERS.map(status => (
              <button 
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`pb-4 text-sm font-black whitespace-nowrap transition-all border-b-2 ${statusFilter === status ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300'}`}
              >
                {status === 'all' ? 'All Orders' : status === 'pending' ? 'Not Yet Shipped' : STATUS_UI[status].label}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-4 rounded-4xl border border-gray-100 bg-white p-4 shadow-sm md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search orders, items, or tracking numbers..."
                className="w-full rounded-2xl border-2 border-gray-50 bg-gray-50/50 py-3 pl-12 pr-4 text-sm font-bold outline-none transition focus:border-primary-500 focus:bg-white"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <FilterSelect value={dateWindow} onChange={(v) => setDateWindow(v as DateWindow)} options={[{ value: '30d', label: 'Last 30 Days' }, { value: '90d', label: 'Last 90 Days' }, { value: 'all', label: 'All Time' }]} />
              <FilterSelect value={sortBy} onChange={(v) => setSortBy(v as SortOption)} options={[{ value: 'newest', label: 'Newest' }, { value: 'total_desc', label: 'Price: High' }, { value: 'total_asc', label: 'Price: Low' }]} />
            </div>
          </div>
        </div>

        <div className="lg:col-span-12 space-y-4">
          {orders.length === 0 ? (
            <div className="rounded-4xl border-2 border-dashed border-gray-100 bg-white p-20 text-center">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gray-50 text-gray-300">
                <ShoppingBag className="h-10 w-10" />
              </div>
              <h2 className="text-2xl font-black text-gray-900">No orders found</h2>
              <p className="mt-2 text-sm font-medium text-gray-500">Try adjusting your filters or start a new collection today.</p>
              <Link href="/products" className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-gray-900 px-8 py-4 text-sm font-black text-white shadow-xl hover:bg-black transition-transform hover:-translate-y-1">
                Explore Store <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            orders.map((order) => {
              const expanded = expandedOrderId === order.id;
              const ui = STATUS_UI[order.status];
              
              return (
                <article key={order.id} className={`group overflow-hidden rounded-4xl border transition-all duration-300 ${expanded ? 'border-primary-200 bg-white shadow-2xl' : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'}`}>
                  {/* Amazon-style CSX Header */}
                  <div className="bg-gray-50 border-b border-gray-100 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
                     <div className="flex flex-wrap gap-8">
                        <div>
                           <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Order Placed</p>
                           <p className="text-sm font-bold text-gray-900">{formatShortDate(order.createdAt)}</p>
                        </div>
                        <div>
                           <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Total</p>
                           <p className="text-sm font-bold text-gray-900">{formatMoney(order.total)}</p>
                        </div>
                        <div className="hidden md:block">
                           <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Ship To</p>
                           <p className="text-sm font-bold text-primary-600 cursor-pointer hover:underline">{order.customerName || 'Collector'}</p>
                        </div>
                     </div>
                     <div className="text-right">
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Order # {formatOrderNumber(order.id)}</p>
                        <div className="flex gap-3 justify-end">
                           <Link href={`/orders/${order.id}`} className="text-xs font-bold text-primary-600 hover:underline">View details</Link>
                           <span className="text-gray-300">|</span>
                           <Link href={`/orders/${order.id}/invoice`} className="text-xs font-bold text-primary-600 hover:underline">View invoice</Link>
                        </div>
                     </div>
                  </div>

                  <div className="p-6 lg:p-8">
                    <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-center">
                      <div className="lg:col-span-8">
                        <OrderTimeline order={order} variant="compact" />
                      </div>

                      <div className="lg:col-span-2 flex flex-col justify-end gap-2">
                        <button 
                          onClick={(e) => { e.preventDefault(); onReorder(order); }}
                          disabled={reordering === order.id}
                          className="flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-xs font-black text-white transition-all hover:bg-primary-700 disabled:opacity-50"
                        >
                          {reordering === order.id ? <RefreshCcw className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
                          Buy Again
                        </button>
                        <div className="flex gap-2">
                          <Link href={`/orders/${order.id}`} className="flex-1 rounded-xl border-2 border-gray-100 bg-white px-4 py-2.5 text-center text-xs font-black text-gray-700 transition hover:bg-gray-50 hover:border-gray-200">
                            Details
                          </Link>
                          <button 
                            onClick={(e) => { e.preventDefault(); setExpandedOrderId(expanded ? null : order.id); }}
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 transition-all ${expanded ? 'border-primary-500 bg-primary-500 text-white' : 'border-gray-100 bg-white text-gray-700 hover:border-gray-200 hover:bg-gray-50'}`}
                          >
                            <ChevronDown className={`h-5 w-5 transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {expanded && (
                    <div className="border-t border-gray-100 bg-gray-50/30 p-8 animate-in fade-in slide-in-from-top-2 duration-300">
                      <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
                        <div className="lg:col-span-7">
                          <h3 className="mb-6 text-xs font-black uppercase tracking-[0.2em] text-gray-400">Order Items</h3>
                          <div className="space-y-4">
                            {order.items.map((item) => (
                              <div key={item.productId} className="flex flex-col sm:flex-row sm:items-center gap-4 rounded-2xl border border-white bg-white/50 p-4 shadow-sm transition hover:shadow-md">
                                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-gray-100 shadow-sm">
                                  <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2">
                                    <p className="truncate text-sm font-black text-gray-900">{item.name}</p>
                                    {item.digitalAssets && item.digitalAssets.length > 0 && (
                                      <span className="inline-flex items-center gap-1 rounded-md bg-primary-50 px-1.5 py-0.5 text-[10px] font-black uppercase text-primary-600 border border-primary-100">
                                        Digital
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs font-bold text-gray-400">Qty: {item.quantity} • {formatMoney(item.unitPrice)} each</p>
                                </div>
                                <div className="flex flex-col gap-2 shrink-0">
                                  {item.digitalAssets && item.digitalAssets.length > 0 && (
                                    <Link href="/account/vault" className="text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl bg-primary-600 text-white hover:bg-primary-700 transition-colors shadow-sm text-center">Download Assets</Link>
                                  )}
                                  <Link href={`/support?orderId=${order.id}&productId=${item.productId}&productName=${encodeURIComponent(item.name)}`} className="text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors shadow-sm text-center">Get Support</Link>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="lg:col-span-5">
                          <h3 className="mb-6 text-xs font-black uppercase tracking-[0.2em] text-gray-400">Shipment Timeline</h3>
                          <div className="rounded-4xl border border-white bg-white/50 p-6 shadow-sm">
                            <OrderTimeline order={order} />
                            
                            <div className="mt-10 grid grid-cols-1 gap-3">
                              {order.trackingUrl ? (
                                <a href={order.trackingUrl} target="_blank" rel="noreferrer" className="flex items-center justify-between rounded-2xl bg-primary-600 px-6 py-4 text-sm font-black text-white shadow-lg transition hover:bg-primary-700">
                                  Track Package <ExternalLink className="h-4 w-4" />
                                </a>
                              ) : (
                                <div className="rounded-2xl border-2 border-dashed border-gray-200 p-4 text-center text-xs font-bold text-gray-400">
                                  Tracking number will appear once shipped.
                                </div>
                              )}
                              <button 
                                onClick={() => onReorder(order)} 
                                disabled={reordering === order.id}
                                className="flex items-center justify-between rounded-2xl bg-gray-900 px-6 py-4 text-sm font-black text-white shadow-lg transition hover:bg-black disabled:opacity-50"
                              >
                                {reordering === order.id ? 'Adding to cart...' : 'Buy it again'} 
                                <RefreshCcw className={`h-4 w-4 ${reordering === order.id ? 'animate-spin' : ''}`} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </article>
              );
            })
          )}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <SupportCard icon={<CircleHelp className="h-6 w-6" />} title="Order Support" text="Need help with a delivery, return, or missing item?" href="/support" action="Talk to us" />
        <SupportCard icon={<ShoppingBag className="h-6 w-6" />} title="Collector Community" text="Share your latest pulls and rare finds with the hive." href="/community" action="Join Discord" />
        <SupportCard icon={<ShieldCheck className="h-6 w-6" />} title="Artist Quality" text="All purchases directly support our artists and creators." href="/shipping-policy" action="Learn more" />
      </section>

    </div>
  );
}

function MetricCard({ label, value, icon, dark }: { label: string; value: string; icon: React.ReactNode; dark?: boolean }) {
  return (
    <div className={`rounded-2xl border px-5 py-4 min-w-[140px] transition hover:scale-105 ${dark ? 'border-white/10 bg-white/5 text-white' : 'border-gray-100 bg-gray-50 text-gray-900'}`}>
      <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest opacity-60">{icon}{label}</p>
      <p className="mt-1 text-2xl font-black">{value}</p>
    </div>
  );
}

function FilterSelect({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <div className="relative group">
      <select 
        value={value} 
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none rounded-xl border-2 border-gray-50 bg-gray-50 px-4 py-2.5 pr-10 text-xs font-black text-gray-700 outline-none transition hover:border-gray-200 focus:border-primary-500 focus:bg-white"
      >
        {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 group-hover:text-gray-900" />
    </div>
  );
}

function SupportCard({ icon, title, text, href, action }: { icon: React.ReactNode; title: string; text: string; href: string; action: string }) {
  return (
    <Link href={href} className="group relative overflow-hidden rounded-4xl border border-gray-100 bg-white p-8 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl">
      <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-primary-50 transition-transform group-hover:scale-150" />
      <div className="relative">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-50 text-primary-600 transition-colors group-hover:bg-primary-600 group-hover:text-white">{icon}</div>
        <h3 className="text-xl font-black text-gray-900">{title}</h3>
        <p className="mt-2 text-sm font-medium text-gray-500 leading-relaxed">{text}</p>
        <p className="mt-6 inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-primary-600 group-hover:gap-3 transition-all">{action} <ArrowRight className="h-4 w-4" /></p>
      </div>
    </Link>
  );
}