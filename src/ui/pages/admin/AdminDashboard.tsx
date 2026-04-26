'use client';

/**
 * [LAYER: UI]
 * Admin dashboard — Shopify Home-inspired overview page.
 */
import { useEffect, useState } from 'react';
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
  ExternalLink
} from 'lucide-react';
import { formatCurrency, formatShortDate } from '@utils/formatters';
import { AdminPageHeader, AdminMetricCard, AdminActionPanel, AdminStatusBadge, SkeletonPage } from '../../components/admin/AdminComponents';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export function AdminDashboard() {
  const services = useServices();
  const [summary, setSummary] = useState<AdminDashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setSummary(await services.orderService.getAdminDashboardSummary());
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [services]);

  if (loading) return <SkeletonPage />;
  if (error) return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
      <div className="flex items-center gap-3">
        <AlertTriangle className="h-5 w-5 text-red-600" />
        <div>
          <p className="text-sm font-semibold text-red-900">Failed to load dashboard</p>
          <p className="text-sm text-red-700">{error}</p>
        </div>
      </div>
    </div>
  );
  if (!summary) return null;

  const pendingCount = summary.fulfillmentCounts.to_review || 0;
  const readyCount = summary.fulfillmentCounts.ready_to_ship || 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* ── Welcome header ── */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
          {getGreeting()} 👋
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Here&apos;s what&apos;s happening with your store today.
        </p>
      </div>

      {/* ── Attention banner (Shopify-style) ── */}
      {(pendingCount > 0 || summary.outOfStockCount > 0) && (
        <div className="rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-amber-900">
                  {pendingCount > 0 ? `${pendingCount} order${pendingCount > 1 ? 's' : ''} waiting for review` : `${summary.outOfStockCount} product${summary.outOfStockCount > 1 ? 's' : ''} out of stock`}
                </p>
                <p className="text-xs text-amber-700">
                  {pendingCount > 0 ? 'Review and confirm to start fulfillment.' : 'Restock to resume sales on these items.'}
                </p>
              </div>
            </div>
            <Link 
              href={pendingCount > 0 ? '/admin/orders' : '/admin/inventory'} 
              className="inline-flex items-center gap-1.5 rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-700"
            >
              {pendingCount > 0 ? 'Review orders' : 'Manage stock'}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      )}

      {/* ── KPI Metrics (Stripe-style) ── */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminMetricCard 
          label="Total Revenue" 
          value={formatCurrency(summary.totalRevenue)} 
          icon={DollarSign} 
          color="success"
          trend={{ value: '+12%', positive: true }}
          description="Lifetime gross sales"
        />
        <AdminMetricCard 
          label="Pending Orders" 
          value={pendingCount + readyCount} 
          icon={ShoppingBag} 
          color="primary"
          description="Awaiting action"
          onClick={() => { window.location.href = '/admin/orders'; }}
        />
        <AdminMetricCard 
          label="Out of Stock" 
          value={summary.outOfStockCount} 
          icon={Boxes} 
          color={summary.outOfStockCount > 0 ? 'danger' : 'success'}
          description={summary.outOfStockCount > 0 ? 'Restock needed' : 'All stocked'}
          onClick={() => { window.location.href = '/admin/inventory'; }}
        />
        <AdminMetricCard 
          label="Avg. Order Value" 
          value={formatCurrency(summary.averageOrderValue)} 
          icon={TrendingUp} 
          color="info"
          description="Per transaction"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* ── Main content area ── */}
        <div className="lg:col-span-3 space-y-6">
          {/* Fulfillment pipeline (Shopify-style visual) */}
          <section className="rounded-2xl border bg-white shadow-sm">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h2 className="text-sm font-semibold text-gray-900">Fulfillment Pipeline</h2>
              <Link href="/admin/orders" className="text-xs font-medium text-primary-600 transition hover:text-primary-700">
                View all orders →
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-px bg-gray-100 sm:grid-cols-5">
              {Object.entries(summary.fulfillmentCounts).map(([bucket, count]) => {
                const labels: Record<string, { label: string; icon: typeof Clock }> = {
                  to_review: { label: 'To Review', icon: Clock },
                  ready_to_ship: { label: 'Ready to Ship', icon: Package },
                  in_transit: { label: 'In Transit', icon: Truck },
                  completed: { label: 'Completed', icon: CheckCircle2 },
                  cancelled: { label: 'Cancelled', icon: AlertTriangle },
                };
                const meta = labels[bucket] || { label: bucket, icon: Clock };
                const Icon = meta.icon;
                const isUrgent = (bucket === 'to_review' || bucket === 'ready_to_ship') && count > 0;
                return (
                  <Link 
                    key={bucket} 
                    href="/admin/orders" 
                    className={`flex flex-col items-center gap-1 bg-white p-5 text-center transition hover:bg-gray-50 ${isUrgent ? 'ring-1 ring-inset ring-primary-100' : ''}`}
                  >
                    <Icon className={`h-4 w-4 ${isUrgent ? 'text-primary-500' : 'text-gray-400'}`} />
                    <p className={`text-xl font-bold ${isUrgent ? 'text-primary-700' : 'text-gray-900'}`}>{count}</p>
                    <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400">{meta.label}</p>
                  </Link>
                );
              })}
            </div>
          </section>

          {/* Priority actions */}
          {summary.attentionItems.length > 0 && (
            <section className="rounded-2xl border bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-sm font-semibold text-gray-900">Things to do</h2>
              <div className="space-y-3">
                {summary.attentionItems.map((item) => (
                  <AdminActionPanel 
                    key={item.id}
                    title={item.label}
                    description={item.description}
                    buttonLabel="Take action"
                    href={item.href}
                    variant={item.priority === 'high' ? 'primary' : 'outline'}
                  />
                ))}
              </div>
            </section>
          )}

          {summary.attentionItems.length === 0 && (
            <section className="rounded-2xl border bg-white p-8 shadow-sm">
              <div className="flex flex-col items-center text-center">
                <div className="rounded-2xl bg-green-50 p-3">
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                </div>
                <p className="mt-3 text-sm font-semibold text-gray-900">You&apos;re all caught up!</p>
                <p className="mt-1 text-xs text-gray-500">No urgent items need your attention right now.</p>
              </div>
            </section>
          )}
        </div>

        {/* ── Sidebar ── */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent orders */}
          <section className="rounded-2xl border bg-white shadow-sm">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <h2 className="text-sm font-semibold text-gray-900">Recent Orders</h2>
              <Link href="/admin/orders" className="text-xs font-medium text-primary-600 transition hover:text-primary-700">
                View all →
              </Link>
            </div>
            <div className="divide-y divide-gray-50">
              {summary.recentOrders.map((order) => (
                <Link key={order.id} href="/admin/orders" className="flex items-center justify-between px-5 py-3 transition hover:bg-gray-50">
                  <div>
                    <p className="font-mono text-[10px] text-gray-400">#{order.id.slice(0, 8).toUpperCase()}</p>
                    <p className="mt-0.5 text-sm font-semibold text-gray-900">{formatCurrency(order.total)}</p>
                    <p className="text-[10px] text-gray-500">{formatShortDate(order.createdAt)}</p>
                  </div>
                  <AdminStatusBadge status={order.status} type="order" />
                </Link>
              ))}
              {summary.recentOrders.length === 0 && (
                <div className="px-5 py-8 text-center">
                  <p className="text-sm text-gray-400">No orders yet</p>
                </div>
              )}
            </div>
          </section>

          {/* Low stock watch */}
          <section className="rounded-2xl border bg-white shadow-sm">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <h2 className="text-sm font-semibold text-gray-900">Low Stock</h2>
              </div>
              <Link href="/admin/inventory" className="text-xs font-medium text-primary-600 transition hover:text-primary-700">
                View all →
              </Link>
            </div>
            <div className="divide-y divide-gray-50">
              {summary.lowStockProducts.map((product) => (
                <div key={product.id} className="flex items-center justify-between px-5 py-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <img src={product.imageUrl} alt="" className="h-9 w-9 rounded-lg border object-cover" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-gray-900">{product.name}</p>
                      <p className="text-[10px] text-gray-500">{product.stock} unit{product.stock !== 1 ? 's' : ''} left</p>
                    </div>
                  </div>
                  <Link 
                    href={`/admin/products/${product.id}/edit`} 
                    className="shrink-0 rounded-lg bg-amber-50 px-2.5 py-1 text-[10px] font-semibold text-amber-700 transition hover:bg-amber-100"
                  >
                    Restock
                  </Link>
                </div>
              ))}
              {summary.lowStockProducts.length === 0 && (
                <div className="flex flex-col items-center px-5 py-8 text-center">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <p className="mt-2 text-sm text-gray-400">All inventory levels healthy</p>
                </div>
              )}
            </div>
          </section>

          {/* Quick links */}
          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-gray-900">Quick Links</h2>
            <div className="space-y-2">
              {[
                { label: 'Add new product', href: '/admin/products/new', icon: Package },
                { label: 'View storefront', href: '/', icon: ExternalLink },
              ].map(link => (
                <Link key={link.href} href={link.href} className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-gray-600 transition hover:bg-gray-50 hover:text-gray-900">
                  <link.icon className="h-4 w-4 text-gray-400" />
                  {link.label}
                  <ArrowRight className="ml-auto h-3.5 w-3.5 text-gray-300" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}