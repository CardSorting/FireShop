'use client';

/**
 * [LAYER: UI]
 * Admin inventory — Stock management with health indicators, visual distribution
 * bar, and inline stock editing.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
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
  XCircle,
  Minus,
  Plus,
  Check,
  X,
  Download
} from 'lucide-react';
import { useServices } from '../../hooks/useServices';
import { formatCurrency, humanizeCategory, normalizeSearch } from '@utils/formatters';
import { AdminPageHeader, AdminMetricCard, AdminStatusBadge, AdminEmptyState, SkeletonPage, SkeletonRow, useToast, useAdminPageTitle } from '../../components/admin/AdminComponents';

const HEALTH_COPY: Record<InventoryHealth, { label: string; action: string }> = {
  out_of_stock: { label: 'Out of stock', action: 'Restock immediately to resume sales.' },
  low_stock: { label: 'Low stock', action: 'Restock soon to avoid stockouts.' },
  healthy: { label: 'Healthy', action: 'No action required.' },
};

type HealthFilter = InventoryHealth | 'all';

export function AdminInventory() {
  useAdminPageTitle('Inventory');
  const services = useServices();
  const { toast } = useToast();
  const [overview, setOverview] = useState<InventoryOverview | null>(null);
  const [query, setQuery] = useState('');
  const [health, setHealth] = useState<HealthFilter>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [savingStock, setSavingStock] = useState(false);

  async function handleExport() {
    toast('info', 'Generating stock report...');
    await new Promise(r => setTimeout(r, 1000));
    const headers = 'Product ID,Name,Category,Stock,Health\n';
    const csv = (overview?.products ?? []).map(p => `${p.id},${p.name},${p.category},${p.stock},${p.inventoryHealth}`).join('\n');
    const blob = new Blob([headers + csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventory-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast('success', 'Report downloaded');
  }

  const loadInventory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setOverview(await services.productService.getInventoryOverview());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load inventory');
    } finally {
      setLoading(false);
    }
  }, [services]);

  useEffect(() => {
    void loadInventory();
  }, [loadInventory]);

  async function saveStockEdit(productId: string) {
    const newStock = parseInt(editValue, 10);
    if (isNaN(newStock) || newStock < 0) {
      toast('error', 'Stock must be a non-negative number');
      return;
    }
    setSavingStock(true);
    try {
      await services.productService.updateProduct(productId, { stock: newStock });
      toast('success', 'Stock updated');
      setEditingId(null);
      await loadInventory();
    } catch (err) {
      toast('error', err instanceof Error ? err.message : 'Failed to update stock');
    } finally {
      setSavingStock(false);
    }
  }

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
      <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-100">
          <AlertTriangle className="h-6 w-6 text-red-600" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-red-900">Failed to load inventory</p>
          <p className="mt-0.5 text-sm text-red-700">{error}</p>
        </div>
        <button
          onClick={loadInventory}
          className="shrink-0 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 active:scale-95"
        >
          Try again
        </button>
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

  const totalProducts = overview.totalProducts || 1;
  const healthyPct = Math.round((overview.healthCounts.healthy / totalProducts) * 100);
  const lowPct = Math.round((overview.healthCounts.low_stock / totalProducts) * 100);
  const oosPct = 100 - healthyPct - lowPct;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <AdminPageHeader 
        title="Inventory" 
        subtitle="Track stock levels and manage availability."
        actions={
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 rounded-xl border bg-white px-3.5 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
          >
            <Download className="h-4 w-4 text-gray-400" />
            Export
          </button>
        }
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

      {/* ── Health Distribution Bar ── */}
      <div className="rounded-2xl border bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">Stock Health Distribution</h3>
          <div className="flex items-center gap-4 text-[10px]">
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-green-500" />Healthy ({overview.healthCounts.healthy})</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-amber-500" />Low ({overview.healthCounts.low_stock})</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-red-500" />Out ({overview.healthCounts.out_of_stock})</span>
          </div>
        </div>
        <div className="flex h-3 overflow-hidden rounded-full bg-gray-100">
          {healthyPct > 0 && <div className="bg-green-500 transition-all duration-500" style={{ width: `${healthyPct}%` }} />}
          {lowPct > 0 && <div className="bg-amber-500 transition-all duration-500" style={{ width: `${lowPct}%` }} />}
          {oosPct > 0 && <div className="bg-red-500 transition-all duration-500" style={{ width: `${oosPct}%` }} />}
        </div>
        <div className="mt-2 flex justify-between text-[10px] text-gray-400">
          <span>{healthyPct}% healthy</span>
          <span>{lowPct + oosPct}% needs attention</span>
        </div>
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
                    {editingId === product.id ? (
                      /* ── Inline stock editor ── */
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setEditValue(String(Math.max(0, parseInt(editValue) - 1)))}
                          className="rounded-md border p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <input
                          type="number"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveStockEdit(product.id);
                            if (e.key === 'Escape') setEditingId(null);
                          }}
                          className="w-16 rounded-lg border bg-white px-2 py-1 text-center text-sm font-semibold focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          autoFocus
                        />
                        <button
                          onClick={() => setEditValue(String(parseInt(editValue) + 1))}
                          className="rounded-md border p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => saveStockEdit(product.id)}
                          disabled={savingStock}
                          className="rounded-md bg-green-50 p-1 text-green-600 transition hover:bg-green-100 disabled:opacity-50"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="rounded-md bg-gray-50 p-1 text-gray-400 transition hover:bg-gray-100"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      /* ── Stock display (click to edit) ── */
                      <button
                        onClick={() => { setEditingId(product.id); setEditValue(String(product.stock)); }}
                        className="group/stock flex items-center gap-1 rounded-lg px-2 py-1 text-left transition hover:bg-gray-100"
                        title="Click to adjust stock"
                      >
                        <span className="text-sm font-semibold text-gray-900">{product.stock}</span>
                        <span className="text-[10px] text-gray-400">units</span>
                        <span className="ml-1 text-[10px] text-primary-500 opacity-0 transition group-hover/stock:opacity-100">edit</span>
                      </button>
                    )}
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