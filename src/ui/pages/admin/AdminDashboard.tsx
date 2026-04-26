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
  Activity,
  Zap
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
  const [customerCount, setCustomerCount] = useState(0);

  async function loadDashboard() {
    setLoading(true);
    setError(null);
    try {
      const [dashSummary, users] = await Promise.all([
        services.orderService.getAdminDashboardSummary(),
        services.authService.getAllUsers()
      ]);
      setSummary(dashSummary);
      setCustomerCount(users.length);
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
          value={customerCount.toLocaleString()} 
          icon={Users} 
          color="info"
          onClick={() => router.push('/admin/customers')}
          description="Total registered users"
        />
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        {/* ── Left Column: Operations ── */}
        <div className="lg:col-span-8 space-y-8">
          {/* Setup Guide / Growth Guide (Shopify Style) */}
          <section className="rounded-xl border border-primary-100 bg-linear-to-br from-white to-primary-50/30 p-6 shadow-sm">
             <div className="flex items-start justify-between">
               <div className="space-y-1">
                 <h2 className="text-sm font-bold text-gray-900 uppercase tracking-widest">Next steps for PlayMoreTCG</h2>
                 <p className="text-xs text-gray-500 font-medium">Complete these tasks to optimize your store for the upcoming set release.</p>
               </div>
               <span className="text-[10px] font-bold text-primary-600 bg-primary-100 px-2 py-0.5 rounded-full">2/4 COMPLETED</span>
             </div>
             
             <div className="mt-6 grid gap-3">
                <div className="flex items-center gap-4 rounded-lg bg-white p-4 shadow-xs ring-1 ring-black/5 transition hover:shadow-md cursor-pointer group">
                   <div className="h-6 w-6 shrink-0 rounded-full border-2 border-primary-500 flex items-center justify-center">
                      <div className="h-2 w-2 rounded-full bg-primary-500" />
                   </div>
                   <div className="flex-1">
                      <p className="text-sm font-bold text-gray-900">Set up automatic discounts</p>
                      <p className="text-xs text-gray-500">Boost sales by offering automated 'Buy X Get Y' deals.</p>
                   </div>
                   <ArrowRight className="h-4 w-4 text-gray-300 transition-transform group-hover:translate-x-1" />
                </div>

                <div className="flex items-center gap-4 rounded-lg bg-white p-4 shadow-xs ring-1 ring-black/5 transition hover:shadow-md cursor-pointer group opacity-60">
                   <div className="h-6 w-6 shrink-0 rounded-full bg-green-500 flex items-center justify-center">
                      <CheckCircle2 className="h-4 w-4 text-white" />
                   </div>
                   <div className="flex-1">
                      <p className="text-sm font-bold text-gray-900 line-through">Configure store branding</p>
                      <p className="text-xs text-gray-500">Upload your logo and set your primary brand colors.</p>
                   </div>
                </div>
             </div>
          </section>

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

          {/* Smart Insights (AI-style) */}
          <div className="grid gap-4 sm:grid-cols-2">
             <div className="rounded-xl border bg-linear-to-br from-indigo-50 to-white p-5 shadow-sm border-indigo-100">
                <div className="flex items-center gap-2 mb-3">
                   <Zap className="h-4 w-4 text-indigo-500" />
                   <h3 className="text-xs font-bold text-indigo-900 uppercase tracking-widest">Inventory Insight</h3>
                </div>
                <p className="text-sm font-bold text-gray-900">High demand for "Base Set" items</p>
                <p className="text-xs text-gray-600 mt-1">Orders for Base Set cards are up 40% this week. Consider increasing stock levels.</p>
                <button className="mt-4 text-[10px] font-bold text-indigo-600 uppercase tracking-widest hover:underline">View Stock Report</button>
             </div>
             <div className="rounded-xl border bg-linear-to-br from-amber-50 to-white p-5 shadow-sm border-amber-100">
                <div className="flex items-center gap-2 mb-3">
                   <Users className="h-4 w-4 text-amber-500" />
                   <h3 className="text-xs font-bold text-amber-900 uppercase tracking-widest">Customer Insight</h3>
                </div>
                <p className="text-sm font-bold text-gray-900">New "Whale" customers</p>
                <p className="text-xs text-gray-600 mt-1">3 new customers spent over $1,000 this week. Send a personalized thank you note?</p>
                <button className="mt-4 text-[10px] font-bold text-amber-600 uppercase tracking-widest hover:underline">View Segments</button>
             </div>
          </div>
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
              {summary.recentOrders.map((order, i) => (
                <div key={order.id} className="flex gap-4 relative">
                  {i !== summary.recentOrders.length - 1 && <div className="absolute left-4 top-10 w-0.5 h-6 bg-gray-100" />}
                  <div className={`rounded-full p-2 h-8 w-8 flex items-center justify-center shrink-0 ${
                    order.status === 'confirmed' ? 'text-primary-600 bg-primary-50' : 
                    order.status === 'shipped' ? 'text-blue-600 bg-blue-50' :
                    order.status === 'delivered' ? 'text-green-600 bg-green-50' :
                    'text-gray-600 bg-gray-50'
                  }`}>
                    {order.status === 'shipped' ? <Truck className="h-4 w-4" /> : 
                     order.status === 'delivered' ? <CheckCircle2 className="h-4 w-4" /> :
                     <ShoppingBag className="h-4 w-4" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-gray-900 leading-tight">
                      Order #{order.id.slice(0, 8).toUpperCase()} was {order.status}
                    </p>
                    <p className="mt-1 text-[10px] text-gray-400 font-medium">{formatShortDate(order.createdAt)}</p>
                  </div>
                </div>
              ))}
              {summary.recentOrders.length === 0 && (
                <p className="text-center text-xs text-gray-400 py-4 italic">No recent activity</p>
              )}
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
              Snapshot: {lastUpdated?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
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