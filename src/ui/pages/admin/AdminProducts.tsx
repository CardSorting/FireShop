'use client';

/**
 * [LAYER: UI]
 * Admin product catalog — saved-view product operations for merchants.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useServices } from '../../hooks/useServices';
import type {
  MarginHealth,
  ProductManagementFilters,
  ProductManagementOverview,
  ProductManagementProduct,
  ProductSavedViewResult,
  ProductSavedView,
  ProductManagementSortKey,
  ProductStatus,
  ProductUpdate,
} from '@domain/models';
import {
  AlertTriangle,
  Archive,
  ArrowUpRight,
  Boxes,
  Check,
  ChevronDown,
  DollarSign,
  Filter,
  ImageOff,
  LayoutGrid,
  List,
  Package,
  Pencil,
  Plus,
  Search,
  SlidersHorizontal,
  Tag,
  Trash2,
  X,
} from 'lucide-react';
import { formatCurrency, humanizeCategory } from '@utils/formatters';
import {
  AdminPageHeader,
  AdminMetricCard,
  AdminEmptyState,
  AdminStatusBadge,
  BulkActionBar,
  AdminConfirmDialog,
  SkeletonRow,
  useToast,
  useAdminPageTitle,
  AdminTab,
} from '../../components/admin/AdminComponents';

const PRODUCT_CATEGORIES: Array<string | 'all'> = [
  'all',
  'booster',
  'single',
  'deck',
  'accessory',
  'box',
  'elite_trainer_box',
  'sealed_case',
  'graded_card',
  'supplies',
  'other',
];

const SAVED_VIEWS: Array<{ label: string; value: ProductSavedView; icon: typeof Package }> = [
  { label: 'All', value: 'all', icon: Package },
  { label: 'Active', value: 'active', icon: ArrowUpRight },
  { label: 'Drafts', value: 'drafts', icon: Pencil },
  { label: 'Needs attention', value: 'needs_attention', icon: AlertTriangle },
  { label: 'Low stock', value: 'low_stock', icon: AlertTriangle },
  { label: 'Missing SKU', value: 'missing_sku', icon: Tag },
  { label: 'No cost', value: 'missing_cost', icon: DollarSign },
  { label: 'Needs photos', value: 'needs_photos', icon: ImageOff },
  { label: 'Archived', value: 'archived', icon: Archive },
];

type ViewMode = 'list' | 'grid';
type InventoryFilter = 'all' | 'healthy' | 'low_stock' | 'out_of_stock';
type SetupFilter = 'all' | 'ready' | 'needs_attention' | 'missing_sku' | 'missing_cost' | 'missing_image';
type OptionalBooleanFilter = 'all' | 'yes' | 'no';

const SORT_OPTIONS: Array<{ label: string; value: ProductManagementSortKey }> = [
  { label: 'Recently updated', value: 'updated_desc' },
  { label: 'Newest created', value: 'created_desc' },
  { label: 'Product title A–Z', value: 'name_asc' },
  { label: 'Product title Z–A', value: 'name_desc' },
  { label: 'Inventory low to high', value: 'inventory_asc' },
  { label: 'Inventory high to low', value: 'inventory_desc' },
  { label: 'Price low to high', value: 'price_asc' },
  { label: 'Price high to low', value: 'price_desc' },
  { label: 'Margin low to high', value: 'margin_asc' },
  { label: 'Margin high to low', value: 'margin_desc' },
];

type BulkPatch = {
  status?: ProductStatus | 'none';
  category?: string | 'none';
  productType?: string;
  vendor?: string;
  supplier?: string;
  tags?: string;
  cost?: string;
  compareAtPrice?: string;
};

const EMPTY_BULK_PATCH: BulkPatch = {
  status: 'none',
  category: 'none',
  productType: '',
  vendor: '',
  supplier: '',
  tags: '',
  cost: '',
  compareAtPrice: '',
};

function issueLabel(issue: string) {
  return issue.replace(/^missing_/, 'Missing ').replace(/_/g, ' ');
}

function vendorLabel(product: ProductManagementProduct) {
  return product.vendor || product.supplier || product.manufacturer || '—';
}

function parseOptionalCents(value?: string) {
  if (!value?.trim()) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.round(parsed * 100) : undefined;
}

function booleanFilterValue(value: OptionalBooleanFilter): boolean | undefined {
  if (value === 'yes') return true;
  if (value === 'no') return false;
  return undefined;
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(value);
}

function productIdentifier(product: ProductManagementProduct) {
  if (product.sku) return `SKU ${product.sku}`;
  if (product.barcode) return `Barcode ${product.barcode}`;
  if (product.manufacturerSku) return `Mfr. SKU ${product.manufacturerSku}`;
  return 'No SKU or barcode';
}

function sortLabel(sort: ProductManagementSortKey) {
  return SORT_OPTIONS.find((option) => option.value === sort)?.label ?? 'Recently updated';
}

export function AdminProducts() {
  useAdminPageTitle('Products');
  const services = useServices();
  const { toast } = useToast();
  const router = useRouter();

  const [products, setProducts] = useState<ProductManagementProduct[]>([]);
  const [overview, setOverview] = useState<ProductManagementOverview | null>(null);
  const [savedViewResult, setSavedViewResult] = useState<ProductSavedViewResult | null>(null);
  const [activeView, setActiveView] = useState<ProductSavedView>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProductStatus | 'all'>('all');
  const [category, setCategory] = useState<string | 'all'>('all');
  const [vendorFilter, setVendorFilter] = useState('all');
  const [productTypeFilter, setProductTypeFilter] = useState('all');
  const [inventoryFilter, setInventoryFilter] = useState<InventoryFilter>('all');
  const [setupFilter, setSetupFilter] = useState<SetupFilter>('all');
  const [marginFilter, setMarginFilter] = useState<MarginHealth | 'all'>('all');
  const [skuFilter, setSkuFilter] = useState<OptionalBooleanFilter>('all');
  const [imageFilter, setImageFilter] = useState<OptionalBooleanFilter>('all');
  const [costFilter, setCostFilter] = useState<OptionalBooleanFilter>('all');
  const [sort, setSort] = useState<ProductManagementSortKey>('updated_desc');
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleteCandidate, setDeleteCandidate] = useState<ProductManagementProduct | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [savingBulk, setSavingBulk] = useState(false);
  const [bulkPatch, setBulkPatch] = useState<BulkPatch>(EMPTY_BULK_PATCH);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const filters: ProductManagementFilters = {
        limit: 500,
        query: query.trim() || undefined,
        status: statusFilter,
        category,
        vendor: vendorFilter,
        productType: productTypeFilter,
        inventoryHealth: inventoryFilter,
        setupStatus: setupFilter === 'ready' || setupFilter === 'needs_attention' ? setupFilter : 'all',
        setupIssue: setupFilter.startsWith('missing_') ? setupFilter as ProductManagementFilters['setupIssue'] : 'all',
        marginHealth: marginFilter,
        hasSku: booleanFilterValue(skuFilter),
        hasImage: booleanFilterValue(imageFilter),
        hasCost: booleanFilterValue(costFilter),
        sort,
      };
      const [nextOverview, savedView] = await Promise.all([
        services.productService.getProductManagementOverview(),
        services.productService.getProductSavedView(activeView, filters),
      ]);
      setOverview(nextOverview);
      setSavedViewResult(savedView);
      setProducts(savedView.products);
      setSelectedIds(new Set());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [activeView, category, costFilter, imageFilter, inventoryFilter, marginFilter, productTypeFilter, query, services.productService, setupFilter, skuFilter, sort, statusFilter, vendorFilter]);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  const vendorOptions = useMemo(() => {
    if (savedViewResult?.facets.vendors.length) return savedViewResult.facets.vendors.map((facet) => facet.value);
    return Array.from(new Set(products.map(vendorLabel).filter((label) => label !== '—'))).sort((a, b) => a.localeCompare(b));
  }, [products, savedViewResult]);

  const productTypeOptions = useMemo(() => {
    if (savedViewResult?.facets.productTypes.length) return savedViewResult.facets.productTypes.map((facet) => facet.value).filter((value) => value !== 'No type');
    return Array.from(new Set(products.map((product) => product.productType).filter(Boolean) as string[])).sort((a, b) => a.localeCompare(b));
  }, [products, savedViewResult]);

  const filteredProducts = products;

  const viewCounts = useMemo(() => ({
    all: overview?.totalProducts ?? products.length,
    active: overview?.statusCounts.active ?? 0,
    drafts: overview?.statusCounts.draft ?? 0,
    needs_attention: overview?.productsNeedingAttention.length ?? 0,
    low_stock: overview?.lowStockCount ?? 0,
    missing_sku: overview?.setupIssueCounts.missing_sku ?? 0,
    missing_cost: overview?.setupIssueCounts.missing_cost ?? 0,
    needs_photos: overview?.setupIssueCounts.missing_image ?? 0,
    archived: overview?.statusCounts.archived ?? 0,
  }), [overview, products.length]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: products.length };
    for (const product of products) counts[product.category] = (counts[product.category] ?? 0) + 1;
    return counts;
  }, [products]);

  const needsAttentionCount = overview
    ? Object.values(overview.setupIssueCounts).reduce((sum, count) => sum + count, 0)
    : 0;

  const activeFilterChips = useMemo(() => {
    const chips: Array<{ key: string; label: string; value: string; onRemove: () => void }> = [];
    if (query.trim()) chips.push({ key: 'query', label: 'Search', value: query.trim(), onRemove: () => setQuery('') });
    if (statusFilter !== 'all') chips.push({ key: 'status', label: 'Status', value: statusFilter, onRemove: () => setStatusFilter('all') });
    if (category !== 'all') chips.push({ key: 'category', label: 'Category', value: humanizeCategory(category), onRemove: () => setCategory('all') });
    if (vendorFilter !== 'all') chips.push({ key: 'vendor', label: 'Vendor', value: vendorFilter, onRemove: () => setVendorFilter('all') });
    if (productTypeFilter !== 'all') chips.push({ key: 'productType', label: 'Product type', value: productTypeFilter, onRemove: () => setProductTypeFilter('all') });
    if (inventoryFilter !== 'all') chips.push({ key: 'inventory', label: 'Inventory', value: inventoryFilter.replace(/_/g, ' '), onRemove: () => setInventoryFilter('all') });
    if (setupFilter !== 'all') chips.push({ key: 'setup', label: 'Setup', value: setupFilter.replace(/_/g, ' '), onRemove: () => setSetupFilter('all') });
    if (marginFilter !== 'all') chips.push({ key: 'margin', label: 'Margin', value: marginFilter.replace(/_/g, ' '), onRemove: () => setMarginFilter('all') });
    if (skuFilter !== 'all') chips.push({ key: 'sku', label: 'SKU', value: skuFilter === 'yes' ? 'Present' : 'Missing', onRemove: () => setSkuFilter('all') });
    if (imageFilter !== 'all') chips.push({ key: 'image', label: 'Photo', value: imageFilter === 'yes' ? 'Present' : 'Missing', onRemove: () => setImageFilter('all') });
    if (costFilter !== 'all') chips.push({ key: 'cost', label: 'Cost', value: costFilter === 'yes' ? 'Present' : 'Missing', onRemove: () => setCostFilter('all') });
    return chips;
  }, [category, costFilter, imageFilter, inventoryFilter, marginFilter, productTypeFilter, query, setupFilter, skuFilter, statusFilter, vendorFilter]);

  const hasAnyFilters = activeFilterChips.length > 0;

  function clearAllFilters() {
    setQuery('');
    setStatusFilter('all');
    setCategory('all');
    setVendorFilter('all');
    setProductTypeFilter('all');
    setInventoryFilter('all');
    setSetupFilter('all');
    setMarginFilter('all');
    setSkuFilter('all');
    setImageFilter('all');
    setCostFilter('all');
  }

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const toggleAll = () => {
    setSelectedIds(selectedIds.size === filteredProducts.length
      ? new Set()
      : new Set(filteredProducts.map((product) => product.id)));
  };

  async function confirmDelete() {
    if (!deleteCandidate) return;
    setDeleting(true);
    try {
      const user = await services.authService.getCurrentUser();
      await services.productService.deleteProduct(deleteCandidate.id, { id: user?.id || 'unknown', email: user?.email || 'system' });
      toast('success', `"${deleteCandidate.name}" deleted`);
      setDeleteCandidate(null);
      await loadProducts();
    } catch (err) {
      toast('error', err instanceof Error ? err.message : 'Failed to delete product');
    } finally {
      setDeleting(false);
    }
  }

  async function applyBulkUpdate(override?: ProductUpdate) {
    if (selectedIds.size === 0) return;
    const updates: ProductUpdate = override ?? {};

    if (!override) {
      if (bulkPatch.status && bulkPatch.status !== 'none') updates.status = bulkPatch.status;
      if (bulkPatch.category && bulkPatch.category !== 'none') updates.category = bulkPatch.category;
      if (bulkPatch.productType?.trim()) updates.productType = bulkPatch.productType.trim();
      if (bulkPatch.vendor?.trim()) updates.vendor = bulkPatch.vendor.trim();
      if (bulkPatch.supplier?.trim()) updates.supplier = bulkPatch.supplier.trim();
      if (bulkPatch.tags?.trim()) updates.tags = bulkPatch.tags.split(',').map((tag) => tag.trim()).filter(Boolean);
      const cost = parseOptionalCents(bulkPatch.cost);
      const compareAtPrice = parseOptionalCents(bulkPatch.compareAtPrice);
      if (cost !== undefined) updates.cost = cost;
      if (compareAtPrice !== undefined) updates.compareAtPrice = compareAtPrice;
    }

    if (Object.keys(updates).length === 0) {
      toast('info', 'Choose at least one bulk field to update');
      return;
    }

    setSavingBulk(true);
    try {
      const user = await services.authService.getCurrentUser();
      const actor = { id: user?.id || 'unknown', email: user?.email || 'system' };
      await services.productService.batchUpdateProducts(
        Array.from(selectedIds).map((id) => ({ id, updates })),
        actor,
      );
      toast('success', `Updated ${selectedIds.size} products`);
      setBulkPatch(EMPTY_BULK_PATCH);
      await loadProducts();
    } catch (err) {
      toast('error', err instanceof Error ? err.message : 'Bulk update failed');
    } finally {
      setSavingBulk(false);
    }
  }

  async function bulkDelete() {
    if (selectedIds.size === 0) return;
    setDeleting(true);
    try {
      const user = await services.authService.getCurrentUser();
      await services.productService.batchDeleteProducts(Array.from(selectedIds), { id: user?.id || 'unknown', email: user?.email || 'system' });
      toast('success', `${selectedIds.size} product${selectedIds.size > 1 ? 's' : ''} deleted`);
      await loadProducts();
    } catch (err) {
      toast('error', err instanceof Error ? err.message : 'Failed to delete products');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-24">
      <AdminPageHeader
        title="Products"
        subtitle="Manage listings, saved views, setup issues, margins, and bulk catalog operations"
        actions={
          <div className="flex items-center gap-2">
            <Link href="/admin/products/bulk-edit" className="hidden rounded-lg border bg-white px-4 py-2 text-xs font-bold text-gray-700 shadow-sm transition hover:bg-gray-50 sm:inline-flex">
              Bulk editor
            </Link>
            <Link href="/admin/products/new" data-testid="add-product-button" className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-primary-700">
              <Plus className="h-4 w-4" /> Add product
            </Link>
          </div>
        }
      />

      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</div>}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <AdminMetricCard label="Total products" value={overview?.totalProducts ?? '—'} icon={Package} color="info" onClick={() => setActiveView('all')} />
        <AdminMetricCard label="Active" value={overview?.statusCounts.active ?? '—'} icon={ArrowUpRight} color="success" onClick={() => setActiveView('active')} />
        <AdminMetricCard label="Needs attention" value={needsAttentionCount} icon={AlertTriangle} color={needsAttentionCount > 0 ? 'warning' : 'success'} description="Setup issue signals" onClick={() => setActiveView('needs_attention')} />
        <AdminMetricCard label="Low stock" value={overview?.lowStockCount ?? '—'} icon={Boxes} color={(overview?.lowStockCount ?? 0) > 0 ? 'warning' : 'success'} onClick={() => setActiveView('low_stock')} />
        <AdminMetricCard label="Missing SKU / cost" value={`${overview?.setupIssueCounts.missing_sku ?? 0} / ${overview?.setupIssueCounts.missing_cost ?? 0}`} icon={Tag} color="danger" />
      </div>

      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <div className="border-b px-4">
          <div className="flex items-center overflow-x-auto scrollbar-hide">
            {SAVED_VIEWS.map((view) => (
              <AdminTab
                key={view.value}
                label={view.label}
                count={viewCounts[view.value]}
                active={activeView === view.value}
                icon={view.icon}
                onClick={() => setActiveView(view.value)}
              />
            ))}
          </div>
        </div>

        <div className="space-y-4 border-b bg-gray-50/40 p-4">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-start">
            <div className="min-w-0 flex-1 space-y-1.5">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search by title, SKU, barcode, vendor, tag…"
                  className="w-full rounded-lg border bg-white py-2.5 pl-9 pr-3 text-sm focus:ring-2 focus:ring-primary-500 outline-none transition"
                />
              </div>
              <p className="text-[11px] font-medium text-gray-500">Try “charizard”, “SKU 123”, “barcode 0820”, a vendor, supplier, or tag. Filters below work like Shopify and Stripe list views.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as ProductStatus | 'all')} className="rounded-lg border bg-white px-3 py-2 text-xs font-bold text-gray-700 outline-none focus:ring-2 focus:ring-primary-500">
                <option value="all">Any status</option>
                <option value="active">Active</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </select>
              <select value={category} onChange={(event) => setCategory(event.target.value)} className="rounded-lg border bg-white px-3 py-2 text-xs font-bold text-gray-700 outline-none focus:ring-2 focus:ring-primary-500">
                {PRODUCT_CATEGORIES.map((item) => <option key={item} value={item}>{item === 'all' ? 'All categories' : humanizeCategory(item)} ({categoryCounts[item] ?? 0})</option>)}
              </select>
              <select value={vendorFilter} onChange={(event) => setVendorFilter(event.target.value)} className="rounded-lg border bg-white px-3 py-2 text-xs font-bold text-gray-700 outline-none focus:ring-2 focus:ring-primary-500">
                <option value="all">Any vendor/supplier</option>
                {vendorOptions.map((vendor) => <option key={vendor} value={vendor}>{vendor}</option>)}
              </select>
              <div className="relative">
                <Filter className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
                <select value={inventoryFilter} onChange={(event) => setInventoryFilter(event.target.value as InventoryFilter)} className="appearance-none rounded-lg border bg-white py-2 pl-9 pr-8 text-xs font-bold text-gray-700 outline-none focus:ring-2 focus:ring-primary-500">
                  <option value="all">Any inventory</option>
                  <option value="healthy">Healthy</option>
                  <option value="low_stock">Low stock</option>
                  <option value="out_of_stock">Out of stock</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
              </div>
              <select value={setupFilter} onChange={(event) => setSetupFilter(event.target.value as SetupFilter)} className="rounded-lg border bg-white px-3 py-2 text-xs font-bold text-gray-700 outline-none focus:ring-2 focus:ring-primary-500">
                <option value="all">Any setup</option>
                <option value="ready">Ready</option>
                <option value="needs_attention">Needs attention</option>
                <option value="missing_sku">Missing SKU</option>
                <option value="missing_cost">No cost</option>
                <option value="missing_image">Needs photos</option>
              </select>
              <select value={sort} onChange={(event) => setSort(event.target.value as ProductManagementSortKey)} className="rounded-lg border bg-white px-3 py-2 text-xs font-bold text-gray-700 outline-none focus:ring-2 focus:ring-primary-500">
                {SORT_OPTIONS.map((option) => <option key={option.value} value={option.value}>Sort: {option.label}</option>)}
              </select>
              <button onClick={() => setShowMoreFilters((open) => !open)} className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-bold transition ${showMoreFilters ? 'border-primary-200 bg-primary-50 text-primary-700' : 'bg-white text-gray-700 hover:bg-gray-50'}`}>
                <SlidersHorizontal className="h-3.5 w-3.5" /> More filters
              </button>
              <div className="flex rounded-lg border bg-white p-0.5">
                <button onClick={() => setViewMode('list')} className={`rounded-md p-1.5 transition ${viewMode === 'list' ? 'bg-gray-100 text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}><List className="h-3.5 w-3.5" /></button>
                <button onClick={() => setViewMode('grid')} className={`rounded-md p-1.5 transition ${viewMode === 'grid' ? 'bg-gray-100 text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}><LayoutGrid className="h-3.5 w-3.5" /></button>
              </div>
            </div>
          </div>
          {showMoreFilters && (
            <div className="grid gap-3 rounded-xl border bg-white p-4 shadow-sm md:grid-cols-2 xl:grid-cols-5">
              <label className="space-y-1 text-[11px] font-black uppercase tracking-widest text-gray-400">Product type
                <select value={productTypeFilter} onChange={(event) => setProductTypeFilter(event.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2 text-xs font-bold normal-case tracking-normal text-gray-700">
                  <option value="all">Any product type</option>
                  {productTypeOptions.map((type) => <option key={type} value={type}>{type}</option>)}
                </select>
              </label>
              <label className="space-y-1 text-[11px] font-black uppercase tracking-widest text-gray-400">Margin health
                <select value={marginFilter} onChange={(event) => setMarginFilter(event.target.value as MarginHealth | 'all')} className="mt-1 w-full rounded-lg border px-3 py-2 text-xs font-bold normal-case tracking-normal text-gray-700">
                  <option value="all">Any margin</option>
                  <option value="unknown">Unknown</option>
                  <option value="at_risk">At risk</option>
                  <option value="healthy">Healthy</option>
                  <option value="premium">Premium</option>
                </select>
              </label>
              <label className="space-y-1 text-[11px] font-black uppercase tracking-widest text-gray-400">SKU
                <select value={skuFilter} onChange={(event) => setSkuFilter(event.target.value as OptionalBooleanFilter)} className="mt-1 w-full rounded-lg border px-3 py-2 text-xs font-bold normal-case tracking-normal text-gray-700">
                  <option value="all">Any SKU state</option>
                  <option value="yes">Has SKU</option>
                  <option value="no">Missing SKU</option>
                </select>
              </label>
              <label className="space-y-1 text-[11px] font-black uppercase tracking-widest text-gray-400">Photos
                <select value={imageFilter} onChange={(event) => setImageFilter(event.target.value as OptionalBooleanFilter)} className="mt-1 w-full rounded-lg border px-3 py-2 text-xs font-bold normal-case tracking-normal text-gray-700">
                  <option value="all">Any photo state</option>
                  <option value="yes">Has photo</option>
                  <option value="no">Needs photo</option>
                </select>
              </label>
              <label className="space-y-1 text-[11px] font-black uppercase tracking-widest text-gray-400">Cost
                <select value={costFilter} onChange={(event) => setCostFilter(event.target.value as OptionalBooleanFilter)} className="mt-1 w-full rounded-lg border px-3 py-2 text-xs font-bold normal-case tracking-normal text-gray-700">
                  <option value="all">Any cost state</option>
                  <option value="yes">Has cost</option>
                  <option value="no">Missing cost</option>
                </select>
              </label>
            </div>
          )}
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              {activeFilterChips.map((chip) => (
                <button key={chip.key} onClick={chip.onRemove} className="inline-flex items-center gap-1.5 rounded-full border bg-white px-3 py-1 text-[11px] font-bold text-gray-700 shadow-sm hover:border-gray-300">
                  <span className="text-gray-400">{chip.label}:</span> {chip.value} <X className="h-3 w-3" />
                </button>
              ))}
              {hasAnyFilters && <button onClick={clearAllFilters} className="text-[11px] font-black text-primary-600 hover:text-primary-700">Clear all</button>}
              {!hasAnyFilters && <span className="text-[11px] font-bold text-gray-400">No filters applied</span>}
            </div>
            <p className="text-xs font-bold text-gray-500">
              Showing {savedViewResult?.filteredCount ?? filteredProducts.length} of {savedViewResult?.totalCount ?? overview?.totalProducts ?? filteredProducts.length} in this view · {sortLabel(sort)}
            </p>
          </div>
        </div>

        {viewMode === 'list' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="w-12 px-4 py-3"><input type="checkbox" checked={selectedIds.size > 0 && selectedIds.size === filteredProducts.length} onChange={toggleAll} className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500" /></th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-gray-400">Product</th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-gray-400">Status</th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-gray-400">Inventory</th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-gray-400">Category / type</th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-gray-400">Vendor / supplier</th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-gray-400">Identifiers</th>
                  <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-widest text-gray-400">Price</th>
                  <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-widest text-gray-400">Cost / margin</th>
                  <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-widest text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading && [1, 2, 3, 4, 5].map((i) => <SkeletonRow key={i} columns={10} />)}
                {!loading && filteredProducts.map((product) => {
                  const isSelected = selectedIds.has(product.id);
                  return (
                    <tr key={product.id} className={`group transition hover:bg-gray-50 ${isSelected ? 'bg-primary-50/40' : ''}`}>
                      <td className="px-4 py-3.5"><input type="checkbox" checked={isSelected} onChange={() => toggleSelect(product.id)} className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500" /></td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <img src={product.imageUrl} alt="" className="h-10 w-10 rounded border object-cover bg-gray-50" />
                          <div className="min-w-0 space-y-1">
                            <Link href={`/admin/products/${product.id}/edit`} className="block font-bold text-gray-900 truncate hover:text-primary-600 transition-colors">{product.name}</Link>
                            <p className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-wider">{productIdentifier(product)}</p>
                            <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">{product.setupIssues.length ? product.setupIssues.slice(0, 2).map(issueLabel).join(' · ') : 'Ready to sell'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5"><AdminStatusBadge status={product.status} type="order" /></td>
                      <td className="px-4 py-3.5"><div className="flex items-center gap-2"><AdminStatusBadge status={product.inventoryHealth} type="inventory" /><span className="text-xs font-bold text-gray-900">{product.stock}</span></div></td>
                      <td className="px-4 py-3.5"><div className="text-xs font-bold text-gray-900">{humanizeCategory(product.category)}</div><div className="text-[10px] text-gray-500">{product.productType || 'No type'}</div></td>
                      <td className="px-4 py-3.5 text-xs font-bold text-gray-700">{vendorLabel(product)}</td>
                      <td className="px-4 py-3.5">
                        <div className="text-xs font-mono font-bold text-gray-700">{product.sku || '—'}</div>
                        <div className="text-[10px] text-gray-500">{product.barcode ? `Barcode ${product.barcode}` : product.manufacturerSku ? `Mfr. ${product.manufacturerSku}` : `Updated ${formatDate(product.updatedAt)}`}</div>
                      </td>
                      <td className="px-4 py-3.5 text-right font-bold text-gray-900">{formatCurrency(product.price)}</td>
                      <td className="px-4 py-3.5 text-right"><div className="font-bold text-gray-900">{product.cost !== undefined ? formatCurrency(product.cost) : '—'}</div><div className="text-[10px] uppercase tracking-wider text-gray-500">{product.grossMarginPercent === null ? product.marginHealth : `${product.grossMarginPercent}%`}</div></td>
                      <td className="px-4 py-3.5 text-right"><button onClick={() => setDeleteCandidate(product)} className="p-2 text-gray-400 transition hover:text-red-600"><Trash2 className="h-4 w-4" /></button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-px bg-gray-100 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 border-t">
            {filteredProducts.map((product) => {
              const isSelected = selectedIds.has(product.id);
              return (
                <div key={product.id} onClick={() => toggleSelect(product.id)} className={`group relative bg-white p-4 transition hover:bg-gray-50 cursor-pointer ${isSelected ? 'bg-primary-50/40' : ''}`}>
                  <div className="aspect-square w-full overflow-hidden rounded-lg border bg-gray-50 mb-3"><img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" /></div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{humanizeCategory(product.category)} · {product.status}</p>
                    <h3 className="text-sm font-bold text-gray-900 truncate">{product.name}</h3>
                    <p className="text-[10px] font-mono font-bold text-gray-500 truncate">{productIdentifier(product)}</p>
                    <p className="text-[10px] font-medium text-gray-500 truncate">{vendorLabel(product)} · Updated {formatDate(product.updatedAt)}</p>
                    <div className="flex items-center justify-between pt-1"><span className="text-sm font-bold text-primary-600">{formatCurrency(product.price)}</span><span className={`text-[10px] font-bold ${product.inventoryHealth !== 'healthy' ? 'text-amber-600' : 'text-gray-400'}`}>{product.stock} units</span></div>
                    {product.setupIssues.length > 0 && <p className="rounded bg-amber-50 px-2 py-1 text-[10px] font-bold text-amber-700">{product.setupIssues.slice(0, 2).map(issueLabel).join(' · ')}</p>}
                  </div>
                  <div className={`absolute top-2 right-2 transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}><div className="h-5 w-5 rounded-full bg-primary-600 flex items-center justify-center border-2 border-white shadow-sm"><Check className="h-3 w-3 text-white stroke-[3px]" /></div></div>
                </div>
              );
            })}
          </div>
        )}

        {!loading && filteredProducts.length === 0 && <AdminEmptyState title="No products found" description="Try another saved view, search term, or filter combination." icon={Package} />}
      </div>

      <BulkActionBar
        selectedCount={selectedIds.size}
        onClear={() => setSelectedIds(new Set())}
        actions={
          <>
            <button onClick={() => router.push(`/admin/products/bulk-edit?ids=${Array.from(selectedIds).join(',')}`)} className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-bold text-white hover:bg-white/20 transition">Spreadsheet edit</button>
            <button onClick={() => void applyBulkUpdate({ status: 'active' })} className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-bold text-white hover:bg-white/20 transition">Set active</button>
            <button onClick={() => void applyBulkUpdate({ status: 'archived' })} className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-bold text-white hover:bg-white/20 transition">Archive</button>
            <button onClick={bulkDelete} className="rounded-lg bg-red-500/20 px-3 py-1.5 text-xs font-bold text-red-200 hover:bg-red-500/30 transition border border-red-500/30">Delete</button>
          </>
        }
      />

      {selectedIds.size > 0 && (
        <div className="fixed bottom-24 left-1/2 z-40 w-[min(920px,calc(100vw-2rem))] -translate-x-1/2 rounded-2xl border bg-white p-4 shadow-2xl">
          <div className="mb-3 flex items-center justify-between"><h3 className="text-xs font-black uppercase tracking-widest text-gray-500">Bulk edit selected products</h3><span className="text-xs font-bold text-gray-400">{selectedIds.size} selected</span></div>
          <div className="grid gap-2 md:grid-cols-4">
            <select value={bulkPatch.status} onChange={(event) => setBulkPatch((patch) => ({ ...patch, status: event.target.value as BulkPatch['status'] }))} className="rounded-lg border px-3 py-2 text-xs font-bold"><option value="none">Status unchanged</option><option value="active">Active</option><option value="draft">Draft</option><option value="archived">Archived</option></select>
            <select value={bulkPatch.category} onChange={(event) => setBulkPatch((patch) => ({ ...patch, category: event.target.value as BulkPatch['category'] }))} className="rounded-lg border px-3 py-2 text-xs font-bold"><option value="none">Category unchanged</option>{PRODUCT_CATEGORIES.filter((item) => item !== 'all').map((item) => <option key={item} value={item}>{humanizeCategory(item)}</option>)}</select>
            <input value={bulkPatch.productType} onChange={(event) => setBulkPatch((patch) => ({ ...patch, productType: event.target.value }))} placeholder="Product type" className="rounded-lg border px-3 py-2 text-xs font-bold" />
            <input value={bulkPatch.vendor} onChange={(event) => setBulkPatch((patch) => ({ ...patch, vendor: event.target.value }))} placeholder="Vendor / brand" className="rounded-lg border px-3 py-2 text-xs font-bold" />
            <input value={bulkPatch.supplier} onChange={(event) => setBulkPatch((patch) => ({ ...patch, supplier: event.target.value }))} placeholder="Supplier" className="rounded-lg border px-3 py-2 text-xs font-bold" />
            <input value={bulkPatch.tags} onChange={(event) => setBulkPatch((patch) => ({ ...patch, tags: event.target.value }))} placeholder="Tags, comma separated" className="rounded-lg border px-3 py-2 text-xs font-bold" />
            <input value={bulkPatch.cost} onChange={(event) => setBulkPatch((patch) => ({ ...patch, cost: event.target.value }))} placeholder="Cost" type="number" step="0.01" className="rounded-lg border px-3 py-2 text-xs font-bold" />
            <input value={bulkPatch.compareAtPrice} onChange={(event) => setBulkPatch((patch) => ({ ...patch, compareAtPrice: event.target.value }))} placeholder="Compare-at price" type="number" step="0.01" className="rounded-lg border px-3 py-2 text-xs font-bold" />
          </div>
          <div className="mt-3 flex justify-end"><button disabled={savingBulk} onClick={() => void applyBulkUpdate()} className="rounded-lg bg-primary-600 px-4 py-2 text-xs font-bold text-white disabled:opacity-50">{savingBulk ? 'Applying…' : 'Apply bulk changes'}</button></div>
        </div>
      )}

      <AdminConfirmDialog open={!!deleteCandidate} onClose={() => setDeleteCandidate(null)} onConfirm={confirmDelete} title="Delete product?" description={`"${deleteCandidate?.name}" will be permanently removed from your catalog. This cannot be undone.`} confirmLabel="Delete" loading={deleting} variant="danger" />
    </div>
  );
}
