'use client';

/**
 * [LAYER: UI]
 * Admin dashboard — High-performance overview page.
 * Optimized for merchant velocity and clarity.
 */
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useServices } from '../../hooks/useServices';
import type { AdminDashboardSummary } from '@domain/models';
import Link from 'next/link';
import { 
  ShoppingBag, 
  TrendingUp, 
  AlertTriangle,
  DollarSign,
  Boxes,
  CheckCircle2,
  ArrowRight,
  Clock,
  Package,
  Truck,
  ExternalLink,
  Users,
  Activity
} from 'lucide-react';
import { formatCurrency, formatShortDate } from '@utils/formatters';
import { 
  AdminMetricCard, 
  AdminActionPanel, 
  AdminStatusBadge, 
  SkeletonPage, 
  useAdminPageTitle, 
  AdminSparkline, 
  HelpTooltip 
} from '../../components/admin/AdminComponents';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export function AdminDashboard() {
  useAdminPageTitle('Home');
  const services = useServices();
  const router = useRouter();
  const [summary, setSummary] = useState<AdminDashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  async function loadDashboard() {
    setLoading(true);
    setError(null);
    try {
      setSummary(await services.orderService.getAdminDashboardSummary());
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadDashboard();
  }, [services]);

  if (loading) return <SkeletonPage />;
  if (error) return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-6 shadow-sm">
      <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-100">
          <AlertTriangle className="h-6 w-6 text-red-600" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-red-900">Failed to load dashboard</p>
          <p className="mt-0.5 text-xs text-red-700 font-medium">{error}</p>
        </div>
        <button
          onClick={loadDashboard}
          className="shrink-0 rounded-lg bg-red-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-red-700 active:scale-95"
        >
          Try again
        </button>
      </div>
    </div>
  );
  if (!summary) return null;

  const pendingCount = summary.fulfillmentCounts.to_review || 0;
  const readyCount = summary.fulfillmentCounts.ready_to_ship || 0;

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      {/* ── Page Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight sm:text-3xl">
            {getGreeting()}, Admin 👋
          </h1>
          <p className="mt-1 text-sm font-medium text-gray-500">
            Monitor your store&apos;s performance and fulfill orders.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={loadDashboard}
            className="hidden sm:flex items-center gap-2 rounded-lg border bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
          >
            <Activity className="h-3.5 w-3.5 text-gray-400" />
            Refresh data
          </button>
          <Link 
            href="/"
            className="flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-gray-800"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            View Store
          </Link>
        </div>
      </div>

      {/* ── KPI Grid ── */}
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <AdminMetricCard 
          label="Total Revenue"
          value={formatCurrency(summary.totalRevenue)} 
          icon={DollarSign} 
          color="success"
          trend={{ value: '12%', positive: true }}
          description={
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-gray-400 uppercase">7D Performance</span>
              <AdminSparkline data={[4500, 5200, 4800, 6100, 5900, 7200, 6800]} color="success" />
            </div>
          }
        />
        <AdminMetricCard 
          label="Pending Tasks"
          value={pendingCount + readyCount} 
          icon={ShoppingBag} 
          color="primary"
          onClick={() => router.push('/admin/orders')}
          description="Orders awaiting action"
        />
        <AdminMetricCard 
          label="Out of Stock"
          value={summary.outOfStockCount} 
          icon={Boxes} 
          color={summary.outOfStockCount > 0 ? 'danger' : 'success'}
          onClick={() => router.push('/admin/inventory')}
          description={summary.outOfStockCount > 0 ? `${summary.outOfStockCount} items need restocking` : 'Inventory is healthy'}
        />
        <AdminMetricCard 
          label="Active Customers"
          value="1,248" 
          icon={Users} 
          color="info"
          trend={{ value: '5%', positive: true }}
          description="Total registered users"
        />
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        {/* ── Left Column: Operations ── */}
        <div className="lg:col-span-8 space-y-8">
          {/* Fulfillment pipeline */}
          <section className="overflow-hidden rounded-xl border bg-white shadow-sm">
            <div className="flex items-center justify-between border-b px-6 py-4 bg-gray-50/50">
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Fulfillment Status</h2>
              <Link href="/admin/orders" className="text-xs font-bold text-primary-600 transition hover:text-primary-700">
                Manage Orders →
              </Link>
            </div>
            <div className="grid grid-cols-2 divide-x divide-y sm:grid-cols-5 sm:divide-y-0">
              {[
                { label: 'To Review', key: 'to_review', icon: Clock },
                { label: 'Ready to Ship', key: 'ready_to_ship', icon: Package },
                { label: 'In Transit', key: 'in_transit', icon: Truck },
                { label: 'Completed', key: 'completed', icon: CheckCircle2 },
                { label: 'Cancelled', key: 'cancelled', icon: AlertTriangle },
              ].map((bucket) => {
                const count = summary.fulfillmentCounts[bucket.key as keyof typeof summary.fulfillmentCounts] || 0;
                const Icon = bucket.icon;
                const isActive = count > 0 && (bucket.key === 'to_review' || bucket.key === 'ready_to_ship');
                
                return (
                  <Link 
                    key={bucket.key} 
                    href="/admin/orders" 
                    className={`group flex flex-col items-center gap-2 p-6 text-center transition hover:bg-gray-50 ${isActive ? 'bg-primary-50/30' : ''}`}
                  >
                    <div className={`rounded-lg p-2 ${isActive ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-400 group-hover:text-gray-600'}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className={`text-2xl font-bold tracking-tight ${isActive ? 'text-primary-700' : 'text-gray-900'}`}>{count}</p>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{bucket.label}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>

          {/* Actionable items */}
          <section>
            <div className="mb-4 flex items-center justify-between px-1">
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Things to do</h2>
              {summary.attentionItems.length > 0 && (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700 uppercase tracking-wider">
                  {summary.attentionItems.length} Actions Required
                </span>
              )}
            </div>
            <div className="space-y-4">
              {summary.attentionItems.map((item) => (
                <AdminActionPanel 
                  key={item.id}
                  title={item.label}
                  description={item.description}
                  buttonLabel="Resolve Now"
                  href={item.href}
                  variant={item.priority === 'high' ? 'primary' : 'outline'}
                />
              ))}
              {summary.attentionItems.length === 0 && (
                <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed bg-white p-12 text-center shadow-sm">
                  <div className="mb-4 rounded-full bg-green-50 p-3">
                    <CheckCircle2 className="h-8 w-8 text-green-500" />
                  </div>
                  <h3 className="text-sm font-bold text-gray-900">You&apos;re all caught up!</h3>
                  <p className="mt-1 text-xs font-medium text-gray-500">No urgent tasks need your attention right now.</p>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* ── Right Column: Insights ── */}
        <div className="lg:col-span-4 space-y-8">
          {/* Recent Orders List */}
          <section className="rounded-xl border bg-white shadow-sm overflow-hidden">
            <div className="flex items-center justify-between border-b px-5 py-4 bg-gray-50/50">
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Recent Orders</h2>
              <Link href="/admin/orders" className="text-[10px] font-bold text-primary-600 uppercase tracking-wider transition hover:text-primary-700">
                View All
              </Link>
            </div>
            <div className="divide-y divide-gray-100">
              {summary.recentOrders.map((order) => (
                <Link key={order.id} href="/admin/orders" className="flex items-center justify-between px-5 py-3 transition hover:bg-gray-50">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-gray-900 truncate">#{order.id.slice(0, 8).toUpperCase()}</p>
                    <p className="mt-0.5 text-[10px] font-medium text-gray-500">{formatShortDate(order.createdAt)}</p>
                  </div>
                  <div className="text-right flex flex-col items-end gap-1.5">
                    <p className="text-xs font-bold text-gray-900">{formatCurrency(order.total)}</p>
                    <AdminStatusBadge status={order.status} type="order" />
                  </div>
                </Link>
              ))}
              {summary.recentOrders.length === 0 && (
                <div className="p-8 text-center">
                  <p className="text-xs font-medium text-gray-400 italic">No orders recorded yet.</p>
                </div>
              )}
            </div>
          </section>

          {/* Activity Feed */}
          <section className="rounded-xl border bg-white shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 border-b px-5 py-4 bg-gray-50/50">
              <Activity className="h-4 w-4 text-primary-500" />
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Store Activity</h2>
            </div>
            <div className="p-5 space-y-6">
              {[
                { label: 'Payout of $1,240.00 processed', time: '2 hours ago', icon: DollarSign, color: 'text-green-600 bg-green-50' },
                { label: 'New customer "Alex Rivers" signed up', time: '5 hours ago', icon: Users, color: 'text-primary-600 bg-primary-50' },
                { label: 'Order #1042 was fulfilled', time: '8 hours ago', icon: CheckCircle2, color: 'text-blue-600 bg-blue-50' },
                { label: 'Stock alert: Base Set Booster pack', time: '12 hours ago', icon: AlertTriangle, color: 'text-amber-600 bg-amber-50' },
              ].map((activity, i) => {
                const Icon = activity.icon;
                return (
                  <div key={i} className="flex gap-4 relative">
                    {i !== 3 && <div className="absolute left-4 top-10 w-0.5 h-6 bg-gray-100" />}
                    <div className={`rounded-full p-2 h-8 w-8 flex items-center justify-center shrink-0 ${activity.color}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-gray-900 leading-tight">{activity.label}</p>
                      <p className="mt-1 text-[10px] text-gray-400 font-medium">{activity.time}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="bg-gray-50 px-5 py-3 border-t">
              <button className="text-[10px] font-bold text-gray-500 uppercase tracking-wider hover:text-gray-900 transition flex items-center gap-1.5">
                View All Activity <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          </section>

          {/* Inventory Watchlist */}
          <section className="rounded-xl border bg-white shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 border-b px-5 py-4 bg-gray-50/50">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Inventory Alerts</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {summary.lowStockProducts.map((product) => (
                <div key={product.id} className="flex items-center justify-between px-5 py-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg border bg-gray-50">
                      <img src={product.imageUrl} alt="" className="h-full w-full object-cover" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold text-gray-900">{product.name}</p>
                      <p className="text-[10px] font-bold text-red-500 uppercase">{product.stock} units left</p>
                    </div>
                  </div>
                  <Link 
                    href={`/admin/products/${product.id}/edit`} 
                    className="shrink-0 rounded-lg border border-gray-200 px-2.5 py-1 text-[10px] font-bold text-gray-700 transition hover:bg-gray-50"
                  >
                    Restock
                  </Link>
                </div>
              ))}
              {summary.lowStockProducts.length === 0 && (
                <div className="flex flex-col items-center p-8 text-center">
                  <div className="mb-2 rounded-full bg-green-50 p-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  </div>
                  <p className="text-xs font-medium text-gray-400">Inventory levels healthy.</p>
                </div>
              )}
            </div>
            {summary.lowStockProducts.length > 0 && (
              <div className="bg-gray-50 px-5 py-3 border-t">
                <Link href="/admin/inventory" className="text-[10px] font-bold text-gray-500 uppercase tracking-wider hover:text-gray-900 transition flex items-center gap-1.5">
                  View Full Inventory <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            )}
          </section>
        </div>
      </div>

      {/* ── Footer Stats ── */}
      <div className="flex items-center justify-between border-t border-gray-200 pt-8 pb-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Live Syncing</span>
          </div>
          {lastUpdated && (
            <span className="text-[10px] font-medium text-gray-400">
              Snapshot: {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          )}
        </div>
        <div className="flex items-center gap-6">
          <Link href="/admin/settings" className="text-[10px] font-bold text-gray-400 uppercase tracking-widest hover:text-gray-900 transition">Store Settings</Link>
          <button className="text-[10px] font-bold text-gray-400 uppercase tracking-widest hover:text-gray-900 transition">Documentation</button>
        </div>
      </div>
    </div>
  );
}