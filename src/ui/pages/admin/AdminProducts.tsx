'use client';

/**
 * [LAYER: UI]
 * Admin product catalog — Shopify-style with high-velocity bulk tools.
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
  Download,
  Upload,
  LayoutGrid,
  List,
  ArrowUpDown,
  Save,
  X,
  MoreVertical,
  ChevronRight,
  Filter,
  Tag,
  ArrowUpRight,
  ChevronDown,
  Check
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
  useToast,
  useAdminPageTitle,
  AdminTab
} from '../../components/admin/AdminComponents';
import { classifyInventoryHealth } from '@domain/rules';

const CATEGORY_TABS = [
  { label: 'All', value: 'all', icon: Package },
  { label: 'Boosters', value: 'booster', icon: Package },
  { label: 'Singles', value: 'single', icon: Tag },
  { label: 'Decks', value: 'deck', icon: Boxes },
  { label: 'Accessories', value: 'accessory', icon: Boxes },
  { label: 'Boxes', value: 'box', icon: Package },
];

type StockFilter = 'all' | 'low' | 'healthy';
type StatusFilter = 'active' | 'archived' | 'draft' | 'all';
type SortKey = 'name' | 'price' | 'stock' | 'date';
type ViewMode = 'list' | 'grid';

export function AdminProducts() {
  useAdminPageTitle('Products');
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
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [deleteCandidate, setDeleteCandidate] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkEditing, setIsBulkEditing] = useState(false);
  const [bulkChanges, setBulkChanges] = useState<Record<string, { price: number; stock: number }>>({});
  const [savingBulk, setSavingBulk] = useState(false);

  // Status counts for tabs
  const counts = useMemo(() => {
    const map: Record<string, number> = { all: products.length };
    products.forEach(p => {
      map[p.category] = (map[p.category] || 0) + 1;
    });
    return map;
  }, [products]);

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
      const user = await services.authService.getCurrentUser();
      const actor = { id: user?.id || 'unknown', email: user?.email || 'system' };
      await services.productService.deleteProduct(deleteCandidate.id, actor);
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
      const user = await services.authService.getCurrentUser();
      const actor = { id: user?.id || 'unknown', email: user?.email || 'system' };
      await services.productService.batchDeleteProducts(Array.from(selectedIds), actor);
      toast('success', `${selectedIds.size} product${selectedIds.size > 1 ? 's' : ''} deleted`);
      setSelectedIds(new Set());
      await loadProducts();
    } catch (err) {
      toast('error', err instanceof Error ? err.message : 'Failed to delete products');
    } finally {
      setDeleting(false);
    }
  }

  async function handleBulkSave() {
    setSavingBulk(true);
    try {
      const entries = Object.entries(bulkChanges);
      if (entries.length === 0) {
        setIsBulkEditing(false);
        return;
      }
      const user = await services.authService.getCurrentUser();
      const actor = { id: user?.id || 'unknown', email: user?.email || 'system' };
      await Promise.all(entries.map(([id, changes]) => services.productService.updateProduct(id, changes, actor)));
      toast('success', `Updated ${entries.length} products`);
      setIsBulkEditing(false);
      setBulkChanges({});
      await loadProducts();
    } catch (err) {
      toast('error', err instanceof Error ? err.message : 'Bulk update failed');
    } finally {
      setSavingBulk(false);
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
      
      const matchesStatus = statusFilter === 'all' || product.status === statusFilter;
      return matchesSearch && matchesStock && matchesStatus;
    });

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

  const toggleSelect = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
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
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <AdminPageHeader 
        title="Products" 
        subtitle="Manage your catalog, pricing, and availability"
        actions={
          <div className="flex items-center gap-2">
            <button 
              onClick={() => toast('info', 'Exporting catalog...')}
              className="flex items-center gap-2 rounded-lg border bg-white px-4 py-2 text-xs font-bold text-gray-700 shadow-sm transition hover:bg-gray-50"
            >
              <Download className="h-3.5 w-3.5 text-gray-400" />
              Export CSV
            </button>
            <Link
              href="/admin/products/new"
              className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-primary-700 active:scale-95"
            >
              <Plus className="h-4 w-4" />
              Add product
            </Link>
          </div>
        }
      />

      {/* ── KPI Grid ── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AdminMetricCard label="Total products" value={products.length} icon={Package} color="info" />
        <AdminMetricCard label="Active" value={products.length} icon={ArrowUpRight} color="success" />
        <AdminMetricCard 
          label="Low stock" 
          value={lowStockCount} 
          icon={AlertTriangle} 
          color={lowStockCount > 0 ? 'warning' : 'success'}
        />
        <AdminMetricCard label="Drafts" value={0} icon={Pencil} color="info" />
      </div>

      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between border-b px-4">
          <div className="flex items-center overflow-x-auto scrollbar-hide">
            {CATEGORY_TABS.map((tab) => (
              <AdminTab
                key={tab.value}
                label={tab.label}
                count={tab.value === 'all' ? products.length : counts[tab.value]}
                active={category === tab.value}
                onClick={() => {
                  setCategory(tab.value as ProductCategory | 'all');
                }}
              />
            ))}
          </div>
          <div className="flex items-center gap-1 border-l pl-4">
             <button 
               onClick={() => setStatusFilter('active')}
               className={`px-3 py-4 text-[10px] font-bold uppercase tracking-widest transition relative ${statusFilter === 'active' ? 'text-primary-600' : 'text-gray-400 hover:text-gray-900'}`}
             >
               Active
               {statusFilter === 'active' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600" />}
             </button>
             <button 
               onClick={() => setStatusFilter('draft')}
               className={`px-3 py-4 text-[10px] font-bold uppercase tracking-widest transition relative ${statusFilter === 'draft' ? 'text-primary-600' : 'text-gray-400 hover:text-gray-900'}`}
             >
               Draft
               {statusFilter === 'draft' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600" />}
             </button>
             <button 
               onClick={() => setStatusFilter('archived')}
               className={`px-3 py-4 text-[10px] font-bold uppercase tracking-widest transition relative ${statusFilter === 'archived' ? 'text-primary-600' : 'text-gray-400 hover:text-gray-900'}`}
             >
               Archived
               {statusFilter === 'archived' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600" />}
             </button>
          </div>
        </div>

        {/* ── Search & Filter Bar ── */}
        <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input 
              value={query} 
              onChange={(e) => setQuery(e.target.value)} 
              placeholder="Search by name, set, or rarity…" 
              className="w-full rounded-lg border bg-gray-50 py-2 pl-9 pr-3 text-sm focus:ring-2 focus:ring-primary-500 outline-none transition" 
            />
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Filter className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
              <select
                value={stockFilter}
                onChange={(e) => setStockFilter(e.target.value as StockFilter)}
                className="appearance-none rounded-lg border bg-gray-50 py-2 pl-9 pr-8 text-xs font-bold text-gray-700 focus:ring-2 focus:ring-primary-500 cursor-pointer outline-none"
              >
                <option value="all">Any stock</option>
                <option value="low">Low stock</option>
                <option value="healthy">In stock</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
            </div>
            
            <div className="flex rounded-lg border bg-gray-50 p-0.5">
              <button 
                onClick={() => setViewMode('list')}
                className={`rounded-md p-1.5 transition ${viewMode === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <List className="h-3.5 w-3.5" />
              </button>
              <button 
                onClick={() => setViewMode('grid')}
                className={`rounded-md p-1.5 transition ${viewMode === 'grid' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* ── View Render ── */}
        {viewMode === 'list' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="w-12 px-4 py-3">
                    <input 
                      type="checkbox" 
                      checked={selectedIds.size > 0 && selectedIds.size === filteredProducts.length}
                      ref={input => { if (input) input.indeterminate = selectedIds.size > 0 && selectedIds.size < filteredProducts.length; }}
                      onChange={toggleAll}
                      className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-gray-400">Product</th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-gray-400">Status</th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-gray-400">Inventory</th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-gray-400">Category</th>
                  <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-widest text-gray-400">Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading && [1,2,3,4,5].map(i => <SkeletonRow key={i} columns={6} />)}
                {!loading && filteredProducts.map((p) => {
                  const isSelected = selectedIds.has(p.id);
                  return (
                    <tr 
                      key={p.id}
                      className={`group transition hover:bg-gray-50 ${isSelected ? 'bg-primary-50/40' : ''}`}
                    >
                      <td className="px-4 py-3.5">
                        <input 
                          type="checkbox" 
                          checked={isSelected}
                          onChange={() => toggleSelect(p.id)}
                          className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <img src={p.imageUrl} alt="" className="h-10 w-10 rounded border object-cover bg-gray-50" />
                          <div className="min-w-0">
                            <Link href={`/admin/products/${p.id}/edit`} className="block font-bold text-gray-900 truncate hover:text-primary-600 transition-colors">
                              {p.name}
                            </Link>
                            <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">{p.set || 'No Set'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <AdminStatusBadge status={p.status} type="order" />
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <AdminStatusBadge status={classifyInventoryHealth(p.stock)} type="inventory" />
                          <span className="text-xs font-bold text-gray-900">{p.stock}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <AdminStatusBadge status={p.category} type="category" />
                      </td>
                      <td className="px-4 py-3.5 text-right font-bold text-gray-900 tracking-tight">
                        {formatCurrency(p.price)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          /* Grid View */
          <div className="grid grid-cols-2 gap-px bg-gray-100 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 border-t">
            {filteredProducts.map((p) => {
              const isSelected = selectedIds.has(p.id);
              return (
                <div 
                  key={p.id}
                  onClick={() => toggleSelect(p.id)}
                  className={`group relative bg-white p-4 transition hover:bg-gray-50 cursor-pointer ${isSelected ? 'bg-primary-50/40' : ''}`}
                >
                  <div className="aspect-square w-full overflow-hidden rounded-lg border bg-gray-50 mb-3">
                    <img src={p.imageUrl} alt={p.name} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{p.category}</p>
                    <h3 className="text-sm font-bold text-gray-900 truncate">{p.name}</h3>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-sm font-bold text-primary-600">{formatCurrency(p.price)}</span>
                      <span className={`text-[10px] font-bold ${p.stock < 5 ? 'text-amber-600' : 'text-gray-400'}`}>{p.stock} units</span>
                    </div>
                  </div>
                  <div className={`absolute top-2 right-2 transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                    <div className="h-5 w-5 rounded-full bg-primary-600 flex items-center justify-center border-2 border-white shadow-sm">
                      <Check className="h-3 w-3 text-white stroke-[3px]" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!loading && filteredProducts.length === 0 && (
          <AdminEmptyState 
            title="No products found" 
            description="Try adjusting your filters or search query."
            icon={Package}
          />
        )}
      </div>

      <BulkActionBar 
        selectedCount={selectedIds.size}
        onClear={() => setSelectedIds(new Set())}
        actions={
          <>
            <button 
              onClick={() => setIsBulkEditing(true)} 
              className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-bold text-white hover:bg-white/20 transition"
            >
              Update prices
            </button>
            <button onClick={bulkDelete} className="rounded-lg bg-red-500/20 px-3 py-1.5 text-xs font-bold text-red-200 hover:bg-red-500/30 transition border border-red-500/30">Delete</button>
          </>
        }
      />

      {/* ── Bulk Price Editor Slide-over ── */}
      {isBulkEditing && (
        <>
          <div className="fixed inset-0 z-60 bg-gray-900/40 backdrop-blur-sm" onClick={() => setIsBulkEditing(false)} />
          <div className="fixed inset-y-0 right-0 z-70 w-full max-w-2xl overflow-y-auto bg-white shadow-2xl animate-in slide-in-from-right duration-300 border-l">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-6 py-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Bulk Price Editor</h2>
                <p className="text-xs text-gray-500">Updating {selectedIds.size} products</p>
              </div>
              <button 
                onClick={() => setIsBulkEditing(false)}
                className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-900"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-0">
               <table className="w-full text-sm">
                 <thead className="bg-gray-50 border-b sticky top-[68px] z-10">
                   <tr>
                     <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-gray-400">Product</th>
                     <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-gray-400 w-32">New Price</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-100">
                   {products.filter(p => selectedIds.has(p.id)).map(p => {
                     const currentPrice = bulkChanges[p.id]?.price ?? p.price;
                     const isChanged = bulkChanges[p.id]?.price !== undefined;
                     
                     return (
                       <tr key={p.id} className="group hover:bg-gray-50/50">
                         <td className="px-6 py-4">
                           <div className="flex items-center gap-3">
                             <img src={p.imageUrl} alt="" className="h-8 w-8 rounded border object-cover" />
                             <span className="text-xs font-bold text-gray-900 truncate max-w-[240px]">{p.name}</span>
                           </div>
                         </td>
                         <td className="px-6 py-4">
                           <div className="relative">
                             <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
                             <input 
                               type="number"
                               value={currentPrice}
                               onChange={(e) => setBulkChanges({
                                 ...bulkChanges,
                                 [p.id]: { stock: p.stock, price: parseFloat(e.target.value) || 0 }
                               })}
                               className={`w-full rounded-lg border bg-white py-1.5 pl-6 pr-2 text-xs font-bold focus:ring-2 focus:ring-primary-500 outline-none transition ${isChanged ? 'border-primary-500 ring-1 ring-primary-500' : ''}`}
                             />
                           </div>
                         </td>
                       </tr>
                     );
                   })}
                 </tbody>
               </table>
            </div>

            <div className="sticky bottom-0 bg-gray-50 border-t px-6 py-4 flex items-center justify-between">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                {Object.keys(bulkChanges).length} items changed
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => { setIsBulkEditing(false); setBulkChanges({}); }}
                  className="rounded-lg border bg-white px-4 py-2 text-xs font-bold text-gray-700 shadow-sm transition hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleBulkSave}
                  disabled={savingBulk || Object.keys(bulkChanges).length === 0}
                  className="flex items-center gap-2 rounded-lg bg-primary-600 px-6 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-primary-700 disabled:opacity-50"
                >
                  {savingBulk ? 'Saving...' : 'Apply changes'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

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
