'use client';
"use client";

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useServices } from '../../hooks/useServices';
import type { AdminDashboardSummary } from '@domain/models';
import type { SetupGuideProgress } from './AdminSettings';
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
  Zap,
  Image as ImageIcon,
  Plus,
  Search,
  Settings as SettingsIcon,
  Tag,
  MessageSquare
} from 'lucide-react';
import { formatCurrency, formatShortDate, formatBytes } from '@utils/formatters';
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
  const [setupProgress, setSetupProgress] = useState<SetupGuideProgress | null>(null);
  const [mediaStats, setMediaStats] = useState<{ count: number, size: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [customerCount, setCustomerCount] = useState(0);
  const controllerRef = useRef<AbortController | null>(null);

  const loadDashboard = useCallback(async () => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    setLoading(true);
    setError(null);
    try {
      const [dashSummary, users, progress, mediaRes] = await Promise.all([
        services.orderService.getAdminDashboardSummary(controller.signal),
        services.authService.getAllUsers(controller.signal),
        services.settingsService.getSetupProgress(controller.signal),
        fetch('/api/admin/media', { signal: controller.signal }).then(r => r.json())
      ]);
      
      if (!controller.signal.aborted) {
        setSummary(dashSummary);
        setCustomerCount(users.length);
        setSetupProgress(progress);
        if (mediaRes.files) {
          setMediaStats({
            count: mediaRes.files.length,
            size: mediaRes.files.reduce((acc: number, f: any) => acc + f.size, 0)
          });
        }
        setLastUpdated(new Date());
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, [services]);

  useEffect(() => {
    void loadDashboard();
    return () => controllerRef.current?.abort();
  }, [loadDashboard]);

  if (loading) return <SkeletonPage />;
  if (error) return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-6 shadow-sm">
      <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-100"><AlertTriangle className="h-6 w-6 text-red-600" /></div>
        <div className="flex-1">
          <p className="text-sm font-bold text-red-900">Failed to load dashboard</p>
          <p className="mt-0.5 text-xs text-red-700 font-medium">{error}</p>
        </div>
        <button onClick={loadDashboard} className="shrink-0 rounded-lg bg-red-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-red-700 active:scale-95">Try again</button>
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
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight sm:text-3xl">{getGreeting()} 👋</h1>
          <p className="mt-1 text-sm font-medium text-gray-500">Merchant Control Panel • Industrial Storefront</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={loadDashboard} className="hidden sm:flex items-center gap-2 rounded-lg border bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50">
            <Activity className="h-3.5 w-3.5 text-gray-400" /> Refresh data
          </button>
          <Link href="/" className="flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-gray-800">
            <ExternalLink className="h-3.5 w-3.5" /> View Store
          </Link>
        </div>
      </div>

      {/* ── KPI Grid ── */}
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <AdminMetricCard label="Total Revenue" value={formatCurrency(summary.totalRevenue)} icon={DollarSign} color="success" trend={{ value: `${Math.round(((summary.dailyRevenue[6] || 0) / (summary.dailyRevenue[5] || 1)) * 100 - 100)}%`, positive: (summary.dailyRevenue[6] || 0) >= (summary.dailyRevenue[5] || 0) }} description={<div className="flex items-center justify-between"><span className="text-[10px] font-bold text-gray-400 uppercase">7D Performance</span><AdminSparkline data={summary.dailyRevenue} color="success" /></div>} />
        <AdminMetricCard label="Pending Tasks" value={pendingCount + readyCount} icon={ShoppingBag} color="primary" onClick={() => router.push('/admin/orders')} description="Orders awaiting action" />
        <AdminMetricCard label="Out of Stock" value={summary.outOfStockCount} icon={Boxes} color={summary.outOfStockCount > 0 ? 'danger' : 'success'} onClick={() => router.push('/admin/inventory')} description={summary.outOfStockCount > 0 ? `${summary.outOfStockCount} items need restocking` : 'Inventory is healthy'} />
        <AdminMetricCard label="Media Assets" value={mediaStats?.count.toLocaleString() || '0'} icon={ImageIcon} color="info" onClick={() => router.push('/admin/files')} description={mediaStats ? `Using ${formatBytes(mediaStats.size)} getStorage()` : 'No media uploaded'} />
      </div>

      {/* ── Quick Actions (High Velocity) ── */}
      <section className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
        {[
          { label: 'Add Product', href: '/admin/products/new', icon: Plus, color: 'text-blue-600 bg-blue-50' },
          { label: 'Upload Media', href: '/admin/files', icon: ImageIcon, color: 'text-purple-600 bg-purple-50' },
          { label: 'Create Discount', href: '/admin/discounts/new', icon: Tag, color: 'text-green-600 bg-green-50' },
          { label: 'Support Tickets', href: '/admin/tickets', icon: MessageSquare, color: 'text-red-600 bg-red-50' },
        ].map((action) => (
          <Link key={action.label} href={action.href} className="group flex items-center gap-4 rounded-2xl border bg-white p-4 transition-all hover:border-primary-500 hover:shadow-lg active:scale-95">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl transition-colors ${action.color} group-hover:bg-primary-600 group-hover:text-white`}>
              <action.icon className="h-5 w-5" />
            </div>
            <span className="text-sm font-bold text-gray-900">{action.label}</span>
          </Link>
        ))}
      </section>

      <div className="grid gap-8 lg:grid-cols-12">
        {/* ── Left Column: Operations ── */}
        <div className="lg:col-span-8 space-y-8">
          <section className="rounded-xl border border-primary-100 bg-linear-to-br from-white to-primary-50/30 p-6 shadow-sm">
             <div className="flex items-start justify-between">
              <div className="space-y-1">
                <h2 className="text-sm font-bold text-gray-900 uppercase tracking-widest">Store Launch Sequence</h2>
                <p className="text-xs text-gray-500 font-medium">Industry-standard checklist for merchant readiness.</p>
              </div>
               <span className="text-[10px] font-bold text-primary-600 bg-primary-100 px-2 py-0.5 rounded-full">{setupProgress?.completedCount}/{setupProgress?.totalCount} READY</span>
             </div>
             <div className="mt-6 grid gap-3">
                {!setupProgress?.hasProducts && (
                  <Link href="/admin/products/new" className="flex items-center gap-4 rounded-lg bg-white p-4 shadow-xs ring-1 ring-black/5 transition hover:shadow-md cursor-pointer group">
                     <div className="h-6 w-6 shrink-0 rounded-full border-2 border-primary-500 flex items-center justify-center"><div className="h-2 w-2 rounded-full bg-primary-500" /></div>
                     <div className="flex-1"><p className="text-sm font-bold text-gray-900">Add your first product</p><p className="text-xs text-gray-500">Get your inventory online to start taking orders.</p></div>
                     <ArrowRight className="h-4 w-4 text-gray-300 transition-transform group-hover:translate-x-1" />
                  </Link>
                )}
                {!setupProgress?.hasPaymentConfigured && (
                  <Link href="/admin/settings" className="flex items-center gap-4 rounded-lg bg-white p-4 shadow-xs ring-1 ring-black/5 transition hover:shadow-md cursor-pointer group">
                     <div className="h-6 w-6 shrink-0 rounded-full border-2 border-primary-500 flex items-center justify-center"><div className="h-2 w-2 rounded-full bg-primary-500" /></div>
                     <div className="flex-1"><p className="text-sm font-bold text-gray-900">Connect a payment provider</p><p className="text-xs text-gray-500">Enable credit card payments via Stripe or PayPal.</p></div>
                     <ArrowRight className="h-4 w-4 text-gray-300 transition-transform group-hover:translate-x-1" />
                  </Link>
                )}
                {setupProgress?.hasProducts && setupProgress?.hasPaymentConfigured && (
                   <div className="flex items-center gap-4 rounded-lg bg-green-50/50 p-4 shadow-xs ring-1 ring-green-600/10 transition">
                      <div className="h-6 w-6 shrink-0 rounded-full bg-green-500 flex items-center justify-center"><CheckCircle2 className="h-4 w-4 text-white" /></div>
                      <div className="flex-1"><p className="text-sm font-bold text-gray-900">Store is Operational</p><p className="text-xs text-gray-500">Your storefront is ready to handle high-velocity traffic.</p></div>
                   </div>
                )}
             </div>
          </section>

          <section className="overflow-hidden rounded-xl border bg-white shadow-sm">
            <div className="flex items-center justify-between border-b px-6 py-4 bg-gray-50/50">
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Fulfillment Pipeline</h2>
              <Link href="/admin/orders" className="text-xs font-bold text-primary-600 transition hover:text-primary-700">Manage Orders →</Link>
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
                  <Link key={bucket.key} href="/admin/orders" className={`group flex flex-col items-center gap-2 p-6 text-center transition hover:bg-gray-50 ${isActive ? 'bg-primary-50/30' : ''}`}>
                    <div className={`rounded-lg p-2 ${isActive ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-400 group-hover:text-gray-600'}`}><Icon className="h-4 w-4" /></div>
                    <div><p className={`text-2xl font-bold tracking-tight ${isActive ? 'text-primary-700' : 'text-gray-900'}`}>{count}</p><p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{bucket.label}</p></div>
                  </Link>
                );
              })}
            </div>
          </section>
        </div>

        {/* ── Right Column: Insights ── */}
        <div className="lg:col-span-4 space-y-8">
          <section className="rounded-xl border bg-white shadow-sm overflow-hidden">
            <div className="flex items-center justify-between border-b px-5 py-4 bg-gray-50/50">
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Recent Activity</h2>
              <Link href="/admin/orders" className="text-[10px] font-bold text-primary-600 uppercase tracking-wider transition hover:text-primary-700">View All</Link>
            </div>
            <div className="divide-y divide-gray-100">
              {summary.recentOrders.slice(0, 5).map((order) => (
                <Link key={order.id} href="/admin/orders" className="flex items-center justify-between px-5 py-3 transition hover:bg-gray-50">
                  <div className="min-w-0"><p className="text-xs font-bold text-gray-900 truncate">#{order.id.slice(0, 8).toUpperCase()}</p><p className="mt-0.5 text-[10px] font-medium text-gray-500">{formatShortDate(order.createdAt)}</p></div>
                  <div className="text-right flex flex-col items-end gap-1.5"><p className="text-xs font-bold text-gray-900">{formatCurrency(order.total)}</p><AdminStatusBadge status={order.status} type="order" /></div>
                </Link>
              ))}
            </div>
          </section>

          <section className="rounded-xl border bg-white shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 border-b px-5 py-4 bg-gray-50/50">
              <ImageIcon className="h-4 w-4 text-primary-500" />
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Media Oversight</h2>
            </div>
            <div className="p-5 space-y-4">
               <div className="rounded-xl bg-gray-50 p-4 border border-gray-100">
                  <div className="flex items-center justify-between mb-2">
                     <span className="text-[10px] font-black uppercase text-gray-400">Host Storage</span>
                     <span className="text-[10px] font-bold text-gray-600">{formatBytes(mediaStats?.size || 0)}</span>
                  </div>
                  <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                     <div className="h-full bg-primary-600" style={{ width: `${Math.min((mediaStats?.size || 0) / (500 * 1024 * 1024) * 100, 100)}%` }} />
                  </div>
                  <p className="mt-2 text-[9px] text-gray-400 font-medium italic">Industry-standard Lean Local getStorage() active.</p>
               </div>
               <Link href="/admin/files" className="block w-full text-center py-2 text-[10px] font-bold text-primary-600 uppercase tracking-widest border border-primary-100 rounded-lg hover:bg-primary-50 transition">
                  Manage Asset Library
               </Link>
            </div>
          </section>
        </div>
      </div>

      {/* ── Footer Stats ── */}
      <div className="flex items-center justify-between border-t border-gray-200 pt-8 pb-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">System Sovereign</span>
          </div>
          {lastUpdated && <span className="text-[10px] font-medium text-gray-400">Last Sync: {lastUpdated?.toLocaleTimeString()}</span>}
        </div>
        <div className="flex items-center gap-6">
          <Link href="/admin/settings" className="text-[10px] font-bold text-gray-400 uppercase tracking-widest hover:text-gray-900 transition">Settings</Link>
          <Link href="/admin/tickets" className="text-[10px] font-bold text-gray-400 uppercase tracking-widest hover:text-gray-900 transition">Support</Link>
        </div>
      </div>
    </div>
  );
}