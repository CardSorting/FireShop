'use client';

/**
 * [LAYER: UI]
 * Admin inventory — Stock management with health indicators.
 */
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import type { InventoryHealth, InventoryOverview } from '@domain/models';
import { 
  AlertTriangle, 
  PackageSearch, 
  Search, 
  Boxes, 
  DollarSign, 
  Activity,
  ArrowRight,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { useServices } from '../../hooks/useServices';
import { formatCurrency, humanizeCategory, normalizeSearch } from '@utils/formatters';
import { AdminPageHeader, AdminMetricCard, AdminStatusBadge, AdminEmptyState, SkeletonPage, SkeletonRow } from '../../components/admin/AdminComponents';

const HEALTH_COPY: Record<InventoryHealth, { label: string; action: string }> = {
  out_of_stock: { label: 'Out of stock', action: 'Restock immediately to resume sales.' },
  low_stock: { label: 'Low stock', action: 'Restock soon to avoid stockouts.' },
  healthy: { label: 'Healthy', action: 'No action required.' },
};

type HealthFilter = InventoryHealth | 'all';

export function AdminInventory() {
  const services = useServices();
  const [overview, setOverview] = useState<InventoryOverview | null>(null);
  const [query, setQuery] = useState('');
  const [health, setHealth] = useState<HealthFilter>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setOverview(await services.productService.getInventoryOverview());
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load inventory');
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [services]);

  const products = useMemo(() => {
    const needle = normalizeSearch(query);
    return (overview?.products ?? []).filter((product) => {
      const matchesHealth = health === 'all' || product.inventoryHealth === health;
      const matchesSearch = !needle || [product.name, product.set ?? '', product.category, product.rarity ?? '']
        .some((value) => normalizeSearch(value).includes(needle));
      return matchesHealth && matchesSearch;
    });
  }, [health, overview, query]);

  if (loading) return <SkeletonPage />;
  if (error) return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
      <div className="flex items-center gap-3">
        <AlertTriangle className="h-5 w-5 text-red-600" />
        <p className="text-sm text-red-700">{error}</p>
      </div>
    </div>
  );
  if (!overview) return null;

  const HEALTH_TABS: { value: HealthFilter; label: string; count: number; icon: typeof Boxes }[] = [
    { value: 'all', label: 'All', count: overview.totalProducts, icon: Boxes },
    { value: 'out_of_stock', label: 'Out of stock', count: overview.healthCounts.out_of_stock, icon: XCircle },
    { value: 'low_stock', label: 'Low stock', count: overview.healthCounts.low_stock, icon: AlertTriangle },
    { value: 'healthy', label: 'In stock', count: overview.healthCounts.healthy, icon: CheckCircle2 },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <AdminPageHeader 
        title="Inventory" 
        subtitle="Track stock levels and manage availability."
      />

      {/* ── KPIs ── */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminMetricCard label="Total SKUs" value={overview.totalProducts} icon={Boxes} color="info" />
        <AdminMetricCard label="Units on Hand" value={overview.totalUnits} icon={Activity} color="primary" />
        <AdminMetricCard label="Inventory Value" value={formatCurrency(overview.inventoryValue)} icon={DollarSign} color="success" />
        <AdminMetricCard 
          label="Needs Attention" 
          value={overview.healthCounts.out_of_stock + overview.healthCounts.low_stock} 
          icon={AlertTriangle} 
          color={overview.healthCounts.out_of_stock > 0 ? 'danger' : 'warning'}
          description={overview.healthCounts.out_of_stock > 0 ? `${overview.healthCounts.out_of_stock} out of stock` : 'Low stock items'}
        />
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-1 overflow-x-auto rounded-xl border bg-white p-1 shadow-sm no-scrollbar">
          {HEALTH_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setHealth(tab.value)}
              className={`flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition ${
                health === tab.value 
                  ? 'bg-gray-900 text-white shadow-sm' 
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              {tab.label}
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                health === tab.value ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        <div className="relative lg:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input 
            value={query} 
            onChange={(event) => setQuery(event.target.value)} 
            placeholder="Search inventory…" 
            className="w-full rounded-xl border bg-white py-2 pl-9 pr-3 text-sm shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent" 
          />
        </div>
      </div>

      {/* ── Table ── */}
      <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
        <div className="overflow-x-auto styled-scrollbar">
          <table className="w-full text-sm">
            <thead className="border-b bg-gray-50/80">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Product</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Stock</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Action</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Value</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {products.map((product) => (
                <tr key={product.id} className="group transition hover:bg-gray-50">
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <img src={product.imageUrl} alt="" className="h-10 w-10 rounded-lg border object-cover" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-gray-900">{product.name}</p>
                        <p className="text-xs text-gray-500">{humanizeCategory(product.category)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <AdminStatusBadge status={product.inventoryHealth} type="inventory" />
                  </td>
                  <td className="px-4 py-3.5">
                    <p className="text-sm font-semibold text-gray-900">{product.stock}</p>
                    <p className="text-[10px] text-gray-400">units</p>
                  </td>
                  <td className="px-4 py-3.5">
                    <p className="text-xs text-gray-500">{HEALTH_COPY[product.inventoryHealth].action}</p>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <p className="text-sm font-semibold text-gray-900">{formatCurrency(product.stock * product.price)}</p>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <Link 
                      href={`/admin/products/${product.id}/edit`} 
                      className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium text-primary-600 transition hover:bg-primary-50"
                    >
                      Edit
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {products.length === 0 && (
          <AdminEmptyState 
            title="No matches found" 
            description="Adjust your search or filters to see more inventory items." 
            icon={PackageSearch} 
            action={
              <button onClick={() => { setHealth('all'); setQuery(''); }} className="text-sm font-semibold text-primary-600 hover:underline">
                Clear all filters
              </button>
            }
          />
        )}
      </div>
    </div>
  );
}