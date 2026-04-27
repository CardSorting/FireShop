'use client';

/**
 * [LAYER: UI]
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  ArrowRight,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  CreditCard,
  HelpCircle,
  MapPin,
  MessageSquare,
  Package,
  Printer,
  RefreshCcw,
  Search,
  ShieldCheck,
  ShoppingBag,
  Truck,
} from 'lucide-react';
import type { Order, OrderStatus } from '@domain/models';
import { logger } from '@utils/logger';
import { useAuth } from '../hooks/useAuth';
import { useCart } from '../hooks/useCart';
import { useServices } from '../hooks/useServices';
import { formatMoney, formatDate, estimateDelivery } from '@utils/formatters';

const STATUS_CONFIG: Record<OrderStatus, { color: string; icon: typeof Clock; label: string; step: number; description: string }> = {
  pending: { color: 'text-amber-700 bg-amber-50 border-amber-100', icon: Clock, label: 'Order placed', step: 1, description: 'We received your order and are getting it ready for review.' },
  confirmed: { color: 'text-blue-700 bg-blue-50 border-blue-100', icon: CheckCircle2, label: 'Processing', step: 2, description: 'Payment is verified. Your items are being picked and packed.' },
  shipped: { color: 'text-purple-700 bg-purple-50 border-purple-100', icon: Truck, label: 'On the way', step: 3, description: 'Your package has shipped. Tracking details are available below.' },
  delivered: { color: 'text-green-700 bg-green-50 border-green-100', icon: Package, label: 'Delivered', step: 4, description: 'Your package was delivered. We hope you love your cards.' },
  cancelled: { color: 'text-red-700 bg-red-50 border-red-100', icon: AlertCircle, label: 'Cancelled', step: 0, description: 'This order was cancelled. Refund timing depends on your payment method.' },
};

const STATUS_FILTERS: Array<'all' | OrderStatus> = ['all', 'pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];


export function OrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const { addItem, openCart } = useCart();
  const services = useServices();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [reordering, setReordering] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | OrderStatus>('all');

  const loadOrders = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const result = await services.orderService.getOrders(user.id);
      setOrders([...result].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));
    } catch (err) {
      logger.error('Failed to load orders', err);
    } finally {
      setLoading(false);
    }
  }, [services.orderService, user]);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  const handleReorder = async (order: Order) => {
    setReordering(order.id);
    try {
      for (const item of order.items) await addItem(item.productId, item.quantity);
      openCart();
    } catch (err) {
      logger.error('Failed to reorder items', err);
    } finally {
      setReordering(null);
    }
  };

  const filteredOrders = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return orders.filter((order) => {
      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
      const matchesSearch = !query || order.id.toLowerCase().includes(query) || order.items.some((item) => item.name.toLowerCase().includes(query));
      return matchesStatus && matchesSearch;
    });
  }, [orders, searchQuery, statusFilter]);

  const latestOrder = orders[0];

  if (authLoading || loading) {
    return (
      <div className="mx-auto max-w-6xl space-y-8 px-4 py-16 animate-pulse">
        <div className="rounded-4xl bg-gray-100 h-52" />
        {[1, 2].map((item) => <div key={item} className="h-72 rounded-4xl bg-gray-50" />)}
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-28 text-center">
        <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-amber-50 text-amber-500">
          <ShieldCheck className="h-12 w-12" />
        </div>
        <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-600">Secure access required</p>
        <h1 className="mt-3 text-4xl font-black tracking-tight text-gray-900">Sign in to view orders</h1>
        <p className="mt-4 text-lg font-medium leading-7 text-gray-500">To protect your privacy and order details, please sign in to your account.</p>
        <div className="mt-10 flex flex-col items-center gap-4">
          <Link href="/login" className="inline-flex items-center gap-3 rounded-2xl bg-gray-900 px-10 py-5 font-black text-white shadow-xl transition hover:bg-black">Sign in <ArrowRight className="h-5 w-5" /></Link>
          <Link href="/products" className="text-sm font-bold text-gray-400 hover:text-gray-900">Continue shopping as guest</Link>
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-28 text-center">
        <div className="relative mx-auto mb-8 flex h-32 w-32 items-center justify-center rounded-full bg-gray-50">
          <div className="absolute inset-0 rounded-full bg-primary-100 opacity-20 animate-ping" />
          <ShoppingBag className="relative z-10 h-12 w-12 text-gray-300" />
        </div>
        <p className="text-xs font-black uppercase tracking-[0.2em] text-primary-600">Order history</p>
        <h1 className="mt-3 text-4xl font-black tracking-tight text-gray-900">No orders yet</h1>
        <p className="mt-4 text-lg font-medium leading-7 text-gray-500">Your purchases, receipts, and tracking links will appear here after checkout.</p>
        <Link href="/products" className="mt-10 inline-flex items-center gap-3 rounded-2xl bg-gray-900 px-10 py-5 font-black text-white shadow-xl transition hover:bg-black">Start shopping <ArrowRight className="h-5 w-5" /></Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <section className="mb-10 overflow-hidden rounded-4xl border border-gray-100 bg-gray-900 text-white shadow-2xl">
        <div className="grid grid-cols-1 lg:grid-cols-3">
          <div className="p-8 lg:col-span-2">
            <div className="mb-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-primary-300">
              <Link href="/" className="hover:text-white">Store</Link><ChevronRight className="h-3 w-3" /><span>Orders</span>
            </div>
            <h1 className="text-4xl font-black tracking-tight md:text-5xl">Your orders</h1>
            <p className="mt-4 max-w-2xl text-sm font-medium leading-6 text-gray-300">Track shipments, print receipts, reorder favorites, and get help without needing to understand fulfillment statuses.</p>
          </div>
          <div className="border-t border-white/10 bg-white/5 p-8 lg:border-l lg:border-t-0">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Latest order</p>
            {latestOrder && <div className="mt-4"><p className="font-mono text-sm font-black">#{latestOrder.id.toUpperCase().slice(0, 12)}</p><p className="mt-2 text-2xl font-black">{STATUS_CONFIG[latestOrder.status].label}</p><p className="mt-2 text-xs font-medium text-gray-300">Placed {formatDate(latestOrder.createdAt)}</p><Link href={`/orders/${latestOrder.id}`} className="mt-5 inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-primary-300 hover:text-white">View latest <ArrowRight className="h-3.5 w-3.5" /></Link></div>}
          </div>
        </div>
      </section>

      <div className="mb-8 flex flex-col gap-4 rounded-4xl border border-gray-100 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search by order number or item name" className="w-full rounded-2xl border-2 border-gray-100 bg-gray-50 py-4 pl-11 pr-4 text-sm font-bold outline-none transition focus:border-primary-500 focus:bg-white" />
        </div>
        <div className="relative md:w-56">
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as 'all' | OrderStatus)} className="w-full appearance-none rounded-2xl border-2 border-gray-100 bg-gray-50 px-4 py-4 text-sm font-black capitalize outline-none focus:border-primary-500">
            {STATUS_FILTERS.map((status) => <option key={status} value={status}>{status === 'all' ? 'All orders' : STATUS_CONFIG[status].label}</option>)}
          </select>
          <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        </div>
      </div>

      <div className="mb-8 flex gap-2 overflow-x-auto pb-1" aria-label="Order status filters">
        {STATUS_FILTERS.map((status) => {
          const active = statusFilter === status;
          const count = status === 'all' ? orders.length : orders.filter(o => o.status === status).length;
          if (count === 0 && status !== 'all') return null;
          
          return (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={`flex items-center gap-2 shrink-0 rounded-full border px-4 py-2 text-xs font-black transition ${active ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 bg-white text-gray-500 hover:border-primary-200 hover:text-primary-700'}`}
            >
              {status === 'all' ? 'All orders' : STATUS_CONFIG[status].label}
              <span className={`inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1 text-[10px] font-black ${active ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>{count}</span>
            </button>
          );
        })}
      </div>

      <div className="mb-6 flex items-center justify-between px-2">
        <p className="text-sm font-medium text-gray-500">
          Showing <span className="font-black text-gray-900">{filteredOrders.length}</span> {statusFilter === 'all' ? '' : statusFilter} order{filteredOrders.length === 1 ? '' : 's'}
          {searchQuery && <span> matching "<span className="font-black text-gray-900">{searchQuery}</span>"</span>}
        </p>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="rounded-4xl border border-gray-100 bg-white p-12 text-center shadow-sm">
          <Search className="mx-auto mb-4 h-10 w-10 text-gray-300" />
          <h2 className="text-2xl font-black text-gray-900">No matching orders</h2>
          <p className="mt-2 text-sm font-medium text-gray-500">Try a different item name, order number, or status filter.</p>
          <button onClick={() => { setSearchQuery(''); setStatusFilter('all'); }} className="mt-6 rounded-2xl bg-gray-900 px-6 py-3 text-xs font-black text-white">Clear filters</button>
        </div>
      ) : (
        <div className="space-y-8">
          {filteredOrders.map((order) => <OrderCard key={order.id} order={order} reordering={reordering === order.id} onReorder={() => handleReorder(order)} />)}
        </div>
      )}

      <section className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-3">
        <HelpCard icon={<MessageSquare className="h-6 w-6" />} title="Need assistance?" text="Get order help from collector support." href="/contact" action="Contact support" />
        <HelpCard icon={<CreditCard className="h-6 w-6" />} title="Payments & receipts" text="Print receipts from any order card." href="/orders" action="Review orders" />
        <HelpCard icon={<ShieldCheck className="h-6 w-6" />} title="Authenticity guarantee" text="Every card is checked before shipping." href="/products" action="Shop confidently" />
      </section>
    </div>
  );
}

function OrderCard({ order, reordering, onReorder }: { order: Order; reordering: boolean; onReorder: () => void }) {
  const config = STATUS_CONFIG[order.status];
  const StatusIcon = config.icon;
  const itemPreview = order.items.slice(0, 3);

  return (
    <article className="overflow-hidden rounded-4xl border border-gray-100 bg-white shadow-xl shadow-gray-200/40">
      <div className="grid grid-cols-1 border-b border-gray-100 lg:grid-cols-4">
        <div className="bg-gray-50 p-6 lg:border-r lg:border-gray-100">
          <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-black ${config.color}`}><StatusIcon className="h-4 w-4" /> {config.label}</div>
          <p className="mt-4 text-sm font-medium leading-6 text-gray-500">{config.description}</p>
        </div>
        <div className="grid grid-cols-2 gap-6 p-6 lg:col-span-3 md:grid-cols-4">
          <Meta icon={<Calendar className="h-4 w-4" />} label="Order date" value={formatDate(order.createdAt)} />
          <Meta label="Order number" value={`#${order.id.toUpperCase().slice(0, 12)}`} mono />
          <Meta icon={<MapPin className="h-4 w-4" />} label="Ship to" value={order.customerName || 'Customer'} />
          <div><p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Total</p><p className="mt-2 text-2xl font-black text-primary-600">{formatMoney(order.total)}</p></div>
        </div>
      </div>

      <div className="p-6">
        {order.status !== 'cancelled' && <ProgressBar step={config.step} />}

        {order.status === 'shipped' && (
          <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-primary-100 bg-primary-50 p-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-primary-600 shadow-sm"><Truck className="h-5 w-5" /></div><div><p className="text-sm font-black text-primary-950">Your order is on the way</p><p className="mt-1 text-xs font-medium text-primary-700">{order.shippingCarrier || 'Carrier'} {order.trackingNumber ? `• ${order.trackingNumber}` : '• tracking coming soon'}</p></div></div>
            <Link href={`/orders/${order.id}`} className="rounded-xl bg-white px-5 py-3 text-center text-xs font-black text-primary-700 shadow-sm hover:bg-primary-600 hover:text-white">Track package</Link>
          </div>
        )}

        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          {itemPreview.map((item) => (
            <Link key={item.productId} href={`/products/${item.productId}`} className="group flex items-center gap-4 rounded-2xl border border-gray-100 bg-gray-50/50 p-4 transition hover:bg-white hover:shadow-md">
              <img src={item.imageUrl || 'https://via.placeholder.com/150'} alt={item.name} className="h-16 w-16 rounded-xl object-cover shadow-sm" />
              <div className="min-w-0"><p className="truncate text-sm font-black text-gray-900 group-hover:text-primary-600">{item.name}</p><p className="mt-1 text-xs font-bold text-gray-500">Qty {item.quantity}</p></div>
            </Link>
          ))}
        </div>

        <div className="flex flex-col gap-4 border-t border-gray-100 pt-6 md:flex-row md:items-center md:justify-between">
          <div className="text-xs font-medium text-gray-500">{order.trackingNumber ? 'Tracking available' : 'Tracking added after packing'} • Estimated delivery by <span className="font-black text-gray-900">{estimateDelivery(order.createdAt)}</span></div>
          <div className="flex flex-wrap gap-3">
            <Link href={`/orders/${order.id}`} className="inline-flex items-center gap-2 rounded-2xl bg-gray-900 px-5 py-3 text-xs font-black text-white hover:bg-black">
              {order.status === 'shipped' ? 'Track package' : 'View details'} <ArrowRight className="h-4 w-4" />
            </Link>
            <button onClick={onReorder} disabled={reordering} className="inline-flex items-center gap-2 rounded-2xl border-2 border-gray-100 px-5 py-3 text-xs font-black text-gray-800 hover:bg-gray-50 disabled:opacity-50">{reordering ? <RefreshCcw className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />} Buy again</button>
            <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-2xl border-2 border-gray-100 px-5 py-3 text-xs font-black text-gray-500 hover:bg-gray-50"><Printer className="h-4 w-4" /> Print page receipt</button>
          </div>
        </div>
      </div>
    </article>
  );
}

function ProgressBar({ step }: { step: number }) {
  return (
    <div className="mb-8 px-2">
      <div className="relative"><div className="absolute top-3 h-1.5 w-full rounded-full bg-gray-100" /><div className="absolute top-3 h-1.5 rounded-full bg-primary-600" style={{ width: `${((step - 1) / 3) * 100}%` }} /><div className="relative flex justify-between">{[1, 2, 3, 4].map((number) => <div key={number} className={`h-7 w-7 rounded-full border-4 bg-white ${number <= step ? 'border-primary-600' : 'border-gray-100'}`}>{number === step && <div className="mx-auto mt-1.5 h-2 w-2 rounded-full bg-primary-600" />}</div>)}</div></div>
      <div className="mt-3 flex justify-between text-[10px] font-black uppercase tracking-widest text-gray-400"><span className={step >= 1 ? 'text-gray-900' : ''}>Placed</span><span className={step >= 2 ? 'text-gray-900' : ''}>Processing</span><span className={step >= 3 ? 'text-gray-900' : ''}>Shipped</span><span className={step >= 4 ? 'text-gray-900' : ''}>Delivered</span></div>
    </div>
  );
}

function Meta({ icon, label, value, mono }: { icon?: React.ReactNode; label: string; value: string; mono?: boolean }) {
  return <div><p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">{label}</p><p className={`mt-2 flex items-center gap-2 truncate text-sm font-black text-gray-900 ${mono ? 'font-mono' : ''}`}>{icon}{value}</p></div>;
}

function HelpCard({ icon, title, text, href, action }: { icon: React.ReactNode; title: string; text: string; href: string; action: string }) {
  return <Link href={href} className="rounded-4xl border border-gray-100 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"><div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-50 text-primary-600">{icon}</div><h3 className="text-lg font-black text-gray-900">{title}</h3><p className="mt-2 text-sm font-medium leading-6 text-gray-500">{text}</p><p className="mt-5 inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-primary-600">{action} <ArrowRight className="h-3.5 w-3.5" /></p></Link>;
}
