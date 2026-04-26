'use client';

/**
 * [LAYER: UI]
 * Admin inventory — Stock management with health indicators, visual distribution
 * bar, and high-velocity bulk stock editing.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { 
  AlertTriangle, 
  Boxes, 
  DollarSign, 
  Activity,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Search,
  Plus
} from 'lucide-react';
import { useServices } from '../../hooks/useServices';
import { formatCurrency, normalizeSearch } from '@utils/formatters';
import { 
  AdminPageHeader, 
  AdminMetricCard, 
  AdminStatusBadge, 
  AdminEmptyState, 
  SkeletonPage, 
  useToast, 
  useAdminPageTitle, 
  AdminTab 
} from '../../components/admin/AdminComponents';
import type { InventoryOverview, InventoryHealth } from '@domain/models';

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
  
  // Bulk editing state
  const [isBulkEditing, setIsBulkEditing] = useState(false);
  const [bulkChanges, setBulkChanges] = useState<Record<string, number>>({});
  const [savingBulk, setSavingBulk] = useState(false);

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

  async function handleBulkSave() {
    const entries = Object.entries(bulkChanges);
    if (entries.length === 0) {
      setIsBulkEditing(false);
      return;
    }

    setSavingBulk(true);
    try {
      await Promise.all(
        entries.map(([id, stock]) => services.productService.updateProduct(id, { stock }))
      );
      toast('success', `Updated stock for ${entries.length} items`);
      setIsBulkEditing(false);
      setBulkChanges({});
      await loadInventory();
    } catch (err) {
      toast('error', err instanceof Error ? err.message : 'Bulk update failed');
    } finally {
      setSavingBulk(false);
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
  
  const HEALTH_TABS = [
    { value: 'all', label: 'All', count: overview?.totalProducts ?? 0, icon: Boxes },
    { value: 'out_of_stock', label: 'Out of stock', count: overview?.healthCounts.out_of_stock ?? 0, icon: XCircle },
    { value: 'low_stock', label: 'Low stock', count: overview?.healthCounts.low_stock ?? 0, icon: AlertTriangle },
    { value: 'healthy', label: 'In stock', count: overview?.healthCounts.healthy ?? 0, icon: CheckCircle2 },
  ];

  const totalProducts = overview?.totalProducts || 1;
  const healthyPct = Math.round(((overview?.healthCounts.healthy ?? 0) / totalProducts) * 100);
  const lowPct = Math.round(((overview?.healthCounts.low_stock ?? 0) / totalProducts) * 100);
  const oosPct = 100 - healthyPct - lowPct;

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-500">
      <AdminPageHeader 
        title="Inventory" 
        subtitle="Track stock levels and manage availability"
        actions={
          <div className="flex items-center gap-2">
            {!isBulkEditing ? (
              <button 
                onClick={() => setIsBulkEditing(true)}
                className="flex items-center gap-2 rounded-lg border bg-white px-4 py-2 text-xs font-bold text-gray-700 shadow-sm transition hover:bg-gray-50"
              >
                <Plus className="h-3.5 w-3.5" />
                Bulk update
              </button>
            ) : (
              <>
                <button 
                  onClick={() => { setIsBulkEditing(false); setBulkChanges({}); }}
                  className="rounded-lg px-4 py-2 text-xs font-bold text-gray-500 transition hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleBulkSave}
                  disabled={savingBulk || Object.keys(bulkChanges).length === 0}
                  className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-primary-700 disabled:opacity-50"
                >
                  {savingBulk ? 'Saving...' : 'Save changes'}
                </button>
              </>
            )}
          </div>
        }
      />

      {/* ── KPI Grid ── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AdminMetricCard label="Units on Hand" value={overview?.totalUnits ?? 0} icon={Activity} color="primary" />
        <AdminMetricCard label="Inventory Value" value={formatCurrency(overview?.inventoryValue ?? 0)} icon={DollarSign} color="success" />
        <AdminMetricCard label="Stock Health" value={`${healthyPct}%`} icon={CheckCircle2} color="success" description="Overall health score" />
        <AdminMetricCard label="Needs Attention" value={(overview?.healthCounts.out_of_stock ?? 0) + (overview?.healthCounts.low_stock ?? 0)} icon={AlertTriangle} color="warning" />
      </div>

      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        {/* ── Tabs ── */}
        <div className="flex items-center border-b px-2 overflow-x-auto scrollbar-hide">
          {HEALTH_TABS.map((tab) => (
            <AdminTab
              key={tab.value}
              label={tab.label}
              count={tab.count}
              active={health === tab.value}
              onClick={() => setHealth(tab.value as HealthFilter)}
              icon={tab.icon}
            />
          ))}
        </div>

        {/* ── Distribution Bar ── */}
        <div className="p-4 bg-gray-50/50 border-b">
          <div className="flex h-1.5 overflow-hidden rounded-full bg-gray-200">
            <div className="bg-green-500 transition-all" style={{ width: `${healthyPct}%` }} />
            <div className="bg-amber-500 transition-all" style={{ width: `${lowPct}%` }} />
            <div className="bg-red-500 transition-all" style={{ width: `${oosPct}%` }} />
          </div>
          <div className="mt-2 flex items-center justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            <div className="flex gap-3">
              <span className="flex items-center gap-1"><div className="h-1.5 w-1.5 rounded-full bg-green-500" /> {healthyPct}% Healthy</span>
              <span className="flex items-center gap-1"><div className="h-1.5 w-1.5 rounded-full bg-amber-500" /> {lowPct}% Low</span>
              <span className="flex items-center gap-1"><div className="h-1.5 w-1.5 rounded-full bg-red-500" /> {oosPct}% Out</span>
            </div>
            <span>{overview?.totalUnits} units total</span>
          </div>
        </div>

        {/* ── Search Bar ── */}
        <div className="p-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input 
              value={query} 
              onChange={(e) => setQuery(e.target.value)} 
              placeholder="Search products by name or category…" 
              className="w-full rounded-lg border bg-gray-50 py-2 pl-9 pr-3 text-sm focus:ring-2 focus:ring-primary-500 outline-none transition" 
            />
          </div>
        </div>

        {/* ── Table ── */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-gray-400">Product</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-gray-400">Health</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-gray-400">Quantity</th>
                <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-widest text-gray-400">Retail Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.map((p) => {
                const currentStock = bulkChanges[p.id] !== undefined ? bulkChanges[p.id] : p.stock;
                const isChanged = bulkChanges[p.id] !== undefined && bulkChanges[p.id] !== p.stock;

                return (
                  <tr key={p.id} className="group transition hover:bg-gray-50">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <img src={p.imageUrl} alt="" className="h-10 w-10 rounded border object-cover bg-gray-50" />
                        <div className="min-w-0">
                          <p className="font-bold text-gray-900 truncate tracking-tight">{p.name}</p>
                          <p className="text-[10px] font-medium text-gray-500 uppercase tracking-widest">{p.category}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <AdminStatusBadge status={p.inventoryHealth} type="inventory" />
                    </td>
                    <td className="px-4 py-3.5">
                      {isBulkEditing ? (
                        <div className="flex items-center gap-2">
                          <input 
                            type="number"
                            value={currentStock}
                            onChange={(e) => setBulkChanges({ ...bulkChanges, [p.id]: parseInt(e.target.value) || 0 })}
                            className={`w-20 rounded border bg-white px-2 py-1 text-sm font-bold focus:ring-2 focus:ring-primary-500 outline-none transition ${isChanged ? 'border-primary-500 ring-1 ring-primary-500' : ''}`}
                          />
                          {isChanged && <button onClick={() => {
                            const next = { ...bulkChanges };
                            delete next[p.id];
                            setBulkChanges(next);
                          }} className="text-primary-600 hover:text-primary-700"><RotateCcw className="h-3.5 w-3.5" /></button>}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className={`font-bold ${p.stock < 5 ? 'text-amber-600' : 'text-gray-900'}`}>{p.stock}</span>
                          <span className="text-[10px] text-gray-400 font-bold uppercase">Units</span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-right font-bold text-gray-900 tracking-tight">
                      {formatCurrency(currentStock * p.price)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {products.length === 0 && (
            <AdminEmptyState 
              title="No products found" 
              description="Adjust your search or filters to see more inventory items."
              icon={Boxes}
            />
          )}
        </div>
      </div>
    </div>
  );
}