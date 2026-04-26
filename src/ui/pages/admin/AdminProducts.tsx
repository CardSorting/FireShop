'use client';

/**
 * [LAYER: UI]
 * Admin product catalog — Shopify-style with grid/list toggle.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useServices } from '../../hooks/useServices';
import type { Product, ProductCategory } from '@domain/models';
import { 
  Plus, 
  Pencil, 
  Search, 
  Trash2, 
  Package, 
  AlertTriangle, 
  Boxes,
  MoreHorizontal,
  Download,
  Upload,
  LayoutGrid,
  List,
  ArrowUpDown
} from 'lucide-react';
import { formatCurrency, humanizeCategory, normalizeSearch } from '@utils/formatters';
import { 
  AdminPageHeader, 
  AdminMetricCard, 
  AdminEmptyState, 
  AdminStatusBadge,
  BulkActionBar,
  AdminConfirmDialog,
  SkeletonRow,
  SkeletonCard,
  useToast
} from '../../components/admin/AdminComponents';
import { classifyInventoryHealth } from '@domain/rules';

const CATEGORIES: Array<ProductCategory | 'all'> = ['all', 'booster', 'single', 'deck', 'accessory', 'box'];
type StockFilter = 'all' | 'low' | 'healthy';
type SortKey = 'name' | 'price' | 'stock' | 'date';
type ViewMode = 'list' | 'grid';

export function AdminProducts() {
  const services = useServices();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<ProductCategory | 'all'>('all');
  const [stockFilter, setStockFilter] = useState<StockFilter>('all');
  const [sortBy, setSortBy] = useState<SortKey>('date');
  const [sortAsc, setSortAsc] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [deleteCandidate, setDeleteCandidate] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await services.productService.getProducts({
        limit: 100,
        category: category === 'all' ? undefined : category,
      });
      setProducts(result.products);
      setSelectedIds(new Set());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [category, services.productService]);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  async function confirmDelete() {
    if (!deleteCandidate) return;
    setDeleting(true);
    try {
      await services.productService.deleteProduct(deleteCandidate.id);
      toast('success', `"${deleteCandidate.name}" deleted`);
      setDeleteCandidate(null);
      await loadProducts();
    } catch (err) {
      toast('error', err instanceof Error ? err.message : 'Failed to delete product');
    } finally {
      setDeleting(false);
    }
  }

  async function bulkDelete() {
    if (selectedIds.size === 0) return;
    setDeleting(true);
    try {
      await services.productService.batchDeleteProducts(Array.from(selectedIds));
      toast('success', `${selectedIds.size} product${selectedIds.size > 1 ? 's' : ''} deleted`);
      setSelectedIds(new Set());
      await loadProducts();
    } catch (err) {
      toast('error', err instanceof Error ? err.message : 'Failed to delete products');
    } finally {
      setDeleting(false);
    }
  }

  const filteredProducts = useMemo(() => {
    const needle = normalizeSearch(query);
    let result = products.filter((product) => {
      const matchesSearch = !needle || [product.name, product.description, product.set ?? '', product.rarity ?? '']
        .some((value) => normalizeSearch(value).includes(needle));
      const matchesStock = stockFilter === 'all'
        || (stockFilter === 'low' && product.stock < 5)
        || (stockFilter === 'healthy' && product.stock >= 5);
      return matchesSearch && matchesStock;
    });

    // Sort
    result = [...result].sort((a, b) => {
      let cmp = 0;
      switch (sortBy) {
        case 'name': cmp = a.name.localeCompare(b.name); break;
        case 'price': cmp = a.price - b.price; break;
        case 'stock': cmp = a.stock - b.stock; break;
        case 'date': cmp = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(); break;
      }
      return sortAsc ? cmp : -cmp;
    });

    return result;
  }, [products, query, stockFilter, sortBy, sortAsc]);

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const toggleAll = () => {
    if (selectedIds.size === filteredProducts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredProducts.map(p => p.id)));
    }
  };

  const handleSort = (key: SortKey) => {
    if (sortBy === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortBy(key);
      setSortAsc(key === 'name');
    }
  };

  const lowStockCount = products.filter((product) => product.stock < 5).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-20">
      <AdminPageHeader 
        title="Products" 
        subtitle="Manage your catalog, pricing, and availability."
        actions={
          <div className="flex items-center gap-2">
            <button className="hidden sm:flex items-center gap-2 rounded-xl border bg-white px-3.5 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50">
              <Upload className="h-4 w-4 text-gray-400" />
              Import
            </button>
            <button className="hidden sm:flex items-center gap-2 rounded-xl border bg-white px-3.5 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50">
              <Download className="h-4 w-4 text-gray-400" />
              Export
            </button>
            <Link
              href="/admin/products/new"
              className="flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700 active:scale-95"
            >
              <Plus className="h-4 w-4" />
              Add product
            </Link>
          </div>
        }
      />

      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      {/* ── KPI Row ── */}
      <div className="grid gap-4 sm:grid-cols-3">
        {loading ? (
          [1,2,3].map(i => <SkeletonCard key={i} />)
        ) : (
          <>
            <AdminMetricCard label="Total Products" value={products.length} icon={Package} color="info" />
            <AdminMetricCard 
              label="Low Stock" 
              value={lowStockCount} 
              icon={AlertTriangle} 
              color={lowStockCount > 0 ? 'warning' : 'success'}
              description={lowStockCount > 0 ? 'Items need restocking' : 'All levels healthy'}
            />
            <AdminMetricCard label="Showing" value={filteredProducts.length} icon={Boxes} color="primary" />
          </>
        )}
      </div>

      {/* ── Filters + View Toggle ── */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input 
              value={query} 
              onChange={(event) => setQuery(event.target.value)} 
              placeholder="Search products…" 
              className="w-full rounded-xl border bg-white py-2 pl-9 pr-3 text-sm shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent" 
            />
          </div>
          <select 
            value={category} 
            onChange={(event) => setCategory(event.target.value as ProductCategory | 'all')} 
            className="rounded-xl border bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm focus:ring-2 focus:ring-primary-500"
          >
            {CATEGORIES.map((value) => <option key={value} value={value}>{value === 'all' ? 'All categories' : humanizeCategory(value)}</option>)}
          </select>
          <select 
            value={stockFilter} 
            onChange={(event) => setStockFilter(event.target.value as StockFilter)} 
            className="rounded-xl border bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All stock</option>
            <option value="low">Low stock</option>
            <option value="healthy">In stock</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-xl border bg-white p-0.5 shadow-sm">
            <button 
              onClick={() => setViewMode('list')}
              className={`rounded-lg p-2 transition ${viewMode === 'list' ? 'bg-gray-100 text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
              aria-label="List view"
            >
              <List className="h-4 w-4" />
            </button>
            <button 
              onClick={() => setViewMode('grid')}
              className={`rounded-lg p-2 transition ${viewMode === 'grid' ? 'bg-gray-100 text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
              aria-label="Grid view"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ── LIST VIEW ── */}
      {viewMode === 'list' && (
        <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
          <div className="overflow-x-auto styled-scrollbar">
            <table className="w-full text-sm">
              <thead className="border-b bg-gray-50/80">
                <tr>
                  <th className="w-10 px-4 py-3">
                    <input 
                      type="checkbox" 
                      checked={selectedIds.size > 0 && selectedIds.size === filteredProducts.length}
                      ref={input => {
                        if (input) input.indeterminate = selectedIds.size > 0 && selectedIds.size < filteredProducts.length;
                      }}
                      onChange={toggleAll}
                      className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                  </th>
                  <th className="px-4 py-3 text-left">
                    <button onClick={() => handleSort('name')} className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-gray-500 hover:text-gray-700">
                      Product
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Category</th>
                  <th className="px-4 py-3 text-left">
                    <button onClick={() => handleSort('price')} className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-gray-500 hover:text-gray-700">
                      Price
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left">
                    <button onClick={() => handleSort('stock')} className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-gray-500 hover:text-gray-700">
                      Stock
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading && [1,2,3,4,5].map(i => <SkeletonRow key={i} columns={6} />)}
                {!loading && filteredProducts.map((p) => {
                  const isSelected = selectedIds.has(p.id);
                  return (
                    <tr key={p.id} className={`group transition hover:bg-gray-50 ${isSelected ? 'bg-primary-50/40' : ''}`}>
                      <td className="px-4 py-3">
                        <input 
                          type="checkbox" 
                          checked={isSelected}
                          onChange={() => toggleSelect(p.id)}
                          className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <img src={p.imageUrl} alt="" className="h-10 w-10 rounded-lg border object-cover" />
                          <div className="min-w-0">
                            <Link href={`/admin/products/${p.id}/edit`} className="block truncate text-sm font-medium text-gray-900 hover:text-primary-600">
                              {p.name}
                            </Link>
                            <p className="truncate text-xs text-gray-500">{p.description.slice(0, 60)}{p.description.length > 60 ? '…' : ''}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <AdminStatusBadge status={p.category} type="category" />
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-semibold text-gray-900">{formatCurrency(p.price)}</p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <AdminStatusBadge status={classifyInventoryHealth(p.stock)} type="inventory" />
                          <span className="text-xs text-gray-500">{p.stock}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 transition group-hover:opacity-100">
                          <Link
                            href={`/admin/products/${p.id}/edit`}
                            className="rounded-lg p-1.5 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
                            title="Edit"
                          >
                            <Pencil className="h-4 w-4" />
                          </Link>
                          <button
                            onClick={() => setDeleteCandidate(p)}
                            className="rounded-lg p-1.5 text-gray-400 transition hover:bg-red-50 hover:text-red-600"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {!loading && filteredProducts.length === 0 && (
            <AdminEmptyState
              title="No products found"
              description="Try adjusting your search or filters, or add a new product."
              icon={Package}
              action={
                <Link href="/admin/products/new" className="text-sm font-semibold text-primary-600 hover:underline">
                  Add your first product
                </Link>
              }
            />
          )}
        </div>
      )}

      {/* ── GRID VIEW ── */}
      {viewMode === 'grid' && (
        <>
          {loading && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {[1,2,3,4,5,6,7,8].map(i => (
                <div key={i} className="rounded-2xl border bg-white p-4 shadow-sm">
                  <div className="skeleton aspect-square w-full rounded-xl" />
                  <div className="mt-3 skeleton h-4 w-3/4 rounded" />
                  <div className="mt-2 skeleton h-3 w-1/2 rounded" />
                </div>
              ))}
            </div>
          )}
          {!loading && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredProducts.map((p) => {
                const isSelected = selectedIds.has(p.id);
                const health = classifyInventoryHealth(p.stock);
                return (
                  <div 
                    key={p.id} 
                    className={`group relative overflow-hidden rounded-2xl border bg-white shadow-sm transition hover:shadow-md ${isSelected ? 'ring-2 ring-primary-500' : ''}`}
                  >
                    {/* Selection checkbox */}
                    <div className="absolute left-3 top-3 z-10">
                      <input 
                        type="checkbox" 
                        checked={isSelected}
                        onChange={() => toggleSelect(p.id)}
                        className={`h-4 w-4 rounded border-gray-300 bg-white/90 text-primary-600 shadow-sm focus:ring-primary-500 transition ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                      />
                    </div>
                    {/* Stock badge */}
                    {health !== 'healthy' && (
                      <div className="absolute right-3 top-3 z-10">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold shadow-sm ${
                          health === 'out_of_stock' ? 'bg-red-500 text-white' : 'bg-amber-500 text-white'
                        }`}>
                          {health === 'out_of_stock' ? 'Out of stock' : 'Low stock'}
                        </span>
                      </div>
                    )}
                    <Link href={`/admin/products/${p.id}/edit`} className="block">
                      <div className="aspect-square overflow-hidden bg-gray-100">
                        <img src={p.imageUrl} alt={p.name} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
                      </div>
                      <div className="p-4">
                        <div className="mb-2">
                          <AdminStatusBadge status={p.category} type="category" />
                        </div>
                        <h3 className="truncate text-sm font-semibold text-gray-900 group-hover:text-primary-600">{p.name}</h3>
                        <div className="mt-2 flex items-center justify-between">
                          <p className="text-base font-bold text-gray-900">{formatCurrency(p.price)}</p>
                          <p className="text-xs text-gray-500">{p.stock} in stock</p>
                        </div>
                      </div>
                    </Link>
                    {/* Quick actions */}
                    <div className="absolute bottom-4 right-4 flex gap-1 opacity-0 transition group-hover:opacity-100">
                      <button
                        onClick={(e) => { e.preventDefault(); setDeleteCandidate(p); }}
                        className="rounded-lg bg-white/90 p-1.5 text-gray-500 shadow-sm backdrop-blur-sm transition hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {!loading && filteredProducts.length === 0 && (
            <AdminEmptyState
              title="No products found"
              description="Try adjusting your search or filters."
              icon={Package}
              action={
                <Link href="/admin/products/new" className="text-sm font-semibold text-primary-600 hover:underline">
                  Add your first product
                </Link>
              }
            />
          )}
        </>
      )}

      {/* ── Bulk Action Bar ── */}
      <BulkActionBar
        selectedCount={selectedIds.size}
        onClear={() => setSelectedIds(new Set())}
        actions={
          <>
            <button
              onClick={bulkDelete}
              disabled={deleting}
              className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/20 disabled:opacity-50"
            >
              <Trash2 className="h-3.5 w-3.5 text-red-400" />
              Delete
            </button>
          </>
        }
      />

      {/* ── Delete Confirmation Dialog ── */}
      <AdminConfirmDialog
        open={!!deleteCandidate}
        onClose={() => setDeleteCandidate(null)}
        onConfirm={confirmDelete}
        title="Delete product?"
        description={`"${deleteCandidate?.name}" will be permanently removed from your catalog. This cannot be undone.`}
        confirmLabel="Delete"
        loading={deleting}
        variant="danger"
      />
    </div>
  );
}
