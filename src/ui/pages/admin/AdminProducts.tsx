"use client";

'use client';

/**
 * [LAYER: UI]
 * Admin product catalog — industrial-grade product operations for merchants.
 * Patterns modeled after Shopify Admin and Stripe Dashboard conventions.
 */
import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
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
  AlertCircle,
  Camera,
  Target,
  SearchCode,
  Upload
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
import { AdminFilterPanel } from '../../components/admin/AdminFilterPanel';
import { AdminImportDialog } from '../../components/admin/AdminImportDialog';
import type { ProductDraft } from '@domain/models';

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

/**
 * IDENTIFICATION BADGE — High-visibility product health indicator
 */
function HealthBadge({ product }: { product: ProductManagementProduct }) {
  const issues = [];
  if (!product.imageUrl || product.imageUrl.includes('placeholder')) issues.push({ label: 'No Photo', icon: Camera, color: 'bg-amber-100 text-amber-700' });
  if (!product.sku) issues.push({ label: 'No SKU', icon: Tag, color: 'bg-red-100 text-red-700' });
  if (product.marginHealth === 'at_risk') issues.push({ label: 'Low Margin', icon: AlertCircle, color: 'bg-red-100 text-red-700' });
  if (product.stock === 0) issues.push({ label: 'Sold Out', icon: Boxes, color: 'bg-gray-100 text-gray-700' });
  
  if (issues.length === 0) {
    return <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-green-700 ring-1 ring-green-100">Healthy</span>;
  }

  return (
    <div className="flex flex-wrap gap-1">
      {issues.slice(0, 2).map((issue, i) => {
        const Icon = issue.icon;
        return (
          <span key={i} className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-black uppercase tracking-widest ring-1 ring-black/5 ${issue.color}`}>
            <Icon className="h-2.5 w-2.5" />
            {issue.label}
          </span>
        );
      })}
      {issues.length > 2 && <span className="text-[9px] font-bold text-gray-400">+{issues.length - 2} more</span>}
    </div>
  );
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
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleteCandidate, setDeleteCandidate] = useState<ProductManagementProduct | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [savingBulk, setSavingBulk] = useState(false);
  const [bulkPatch, setBulkPatch] = useState<BulkPatch>(EMPTY_BULK_PATCH);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  const loadProducts = useCallback(async () => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    setLoading(true);
    setError(null);
    try {
      // Parse semantic search terms
      let finalQuery = query;
      let localStatus = statusFilter;
      let localCategory = category;
      let localVendor = vendorFilter;

      if (query.includes(':')) {
        const parts = query.split(' ');
        const textParts = [];
        for (const part of parts) {
          if (part.startsWith('status:')) localStatus = part.replace('status:', '') as any;
          else if (part.startsWith('cat:')) localCategory = part.replace('cat:', '') as any;
          else if (part.startsWith('vendor:')) localVendor = part.replace('vendor:', '') as any;
          else textParts.push(part);
        }
        finalQuery = textParts.join(' ');
      }

      const filters: ProductManagementFilters = {
        limit: 500,
        query: finalQuery.trim() || undefined,
        status: localStatus,
        category: localCategory,
        vendor: localVendor,
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
        services.productService.getProductManagementOverview(controller.signal),
        services.productService.getProductSavedView(activeView, { ...filters, signal: controller.signal }),
      ]);
      
      if (!controller.signal.aborted && isMounted.current) {
        setOverview(nextOverview);
        setSavedViewResult(savedView);
        setProducts(savedView.products);
        setSelectedIds(new Set());
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      setError(err instanceof Error ? err.message : 'Failed to load products');
    } finally {
      if (!controller.signal.aborted && isMounted.current) {
        setLoading(false);
      }
    }
  }, [activeView, category, costFilter, imageFilter, inventoryFilter, marginFilter, productTypeFilter, query, services.productService, setupFilter, skuFilter, sort, statusFilter, vendorFilter]);

  useEffect(() => {
    void loadProducts();
    return () => controllerRef.current?.abort();
  }, [loadProducts]);

  const vendorOptions = useMemo(() => {
    if (savedViewResult?.facets.vendors.length) return savedViewResult.facets.vendors.map((facet) => facet.value);
    return Array.from(new Set(products.map(vendorLabel).filter((label) => label !== '—'))).sort((a, b) => a.localeCompare(b));
  }, [products, savedViewResult]);

  const categoryOptions = useMemo(() => {
    return PRODUCT_CATEGORIES.filter(c => c !== 'all');
  }, []);

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

  const handleFilterChange = (key: string, value: any) => {
    switch(key) {
      case 'status': setStatusFilter(value); break;
      case 'category': setCategory(value); break;
      case 'vendor': setVendorFilter(value); break;
      case 'inventory': setInventoryFilter(value); break;
      case 'margin': setMarginFilter(value); break;
      case 'hasSku': setSkuFilter(value); break;
      case 'hasImage': setImageFilter(value); break;
    }
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const toggleAll = () => {
    setSelectedIds(selectedIds.size === products.length
      ? new Set()
      : new Set(products.map((product) => product.id)));
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
      if (isMounted.current) {
        setDeleting(false);
      }
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
      if (isMounted.current) {
        setSavingBulk(false);
      }
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
      if (isMounted.current) {
        setDeleting(false);
      }
    }
  }

  async function handleImport(data: any[]) {
    try {
      const user = await services.authService.getCurrentUser();
      const actor = { id: user?.id || 'unknown', email: user?.email || 'system' };

      const productsToCreate: ProductDraft[] = data.map(row => ({
        name: row.name || 'Unnamed Product',
        description: row.description || '',
        price: Math.round(Number(row.price || 0) * 100),
        category: (row.category || 'other') as any,
        productType: row.type || row.producttype || 'Other',
        stock: Number(row.stock || 0),
        status: (row.status || 'draft') as any,
        imageUrl: row.imageurl || row.image || '',
        media: [],
        sku: row.sku || '',
        vendor: row.vendor || '',
        handle: row.handle || undefined,
        tags: row.tags ? row.tags.split(',').map((t: string) => t.trim()) : [],
        trackQuantity: true,
        physicalItem: true,
      }));

      await services.productService.batchCreateProducts(productsToCreate, actor);
      await loadProducts();
    } catch (err) {
      throw err;
    }
  }

  const isSelectionMode = selectedIds.size > 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-24">
      <AdminPageHeader
        title="Products"
        subtitle="Manage listings, saved views, setup issues, margins, and bulk catalog operations"
        actions={
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsImportOpen(true)}
              className="hidden rounded-lg border bg-white px-4 py-2 text-xs font-bold text-gray-700 shadow-sm transition hover:bg-gray-50 sm:inline-flex active:scale-95"
            >
              Import
            </button>
            <Link href="/admin/products/bulk-edit" className="hidden rounded-lg border bg-white px-4 py-2 text-xs font-bold text-gray-700 shadow-sm transition hover:bg-gray-50 sm:inline-flex active:scale-95">
              Bulk editor
            </Link>
            <Link href="/admin/products/new" data-testid="add-product-button" className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-primary-700 active:scale-95">
              <Plus className="h-4 w-4" /> Add product
            </Link>
          </div>
        }
      />

      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700 animate-in slide-in-from-top-2">
          <AlertCircle className="h-5 w-5" />
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <AdminMetricCard label="Total products" value={overview?.totalProducts ?? '—'} icon={Package} color="info" onClick={() => setActiveView('all')} />
        <AdminMetricCard label="Active" value={overview?.statusCounts.active ?? '—'} icon={ArrowUpRight} color="success" onClick={() => setActiveView('active')} />
        <AdminMetricCard label="Attention Needed" value={overview ? Object.values(overview.setupIssueCounts).reduce((a, b) => a + b, 0) : '—'} icon={AlertTriangle} color="warning" onClick={() => setActiveView('needs_attention')} />
        <AdminMetricCard label="Low stock" value={overview?.lowStockCount ?? '—'} icon={Boxes} color={(overview?.lowStockCount ?? 0) > 0 ? 'warning' : 'success'} onClick={() => setActiveView('low_stock')} />
        <AdminMetricCard label="Healthy Margins" value={savedViewResult?.facets.marginHealth.find(m => m.value === 'healthy')?.count ?? '—'} icon={Target} color="success" />
      </div>

      <div className="rounded-xl border bg-white shadow-sm overflow-hidden flex flex-col">
        {/* Saved Views Tabs */}
        <div className="border-b px-4 bg-gray-50/30">
          <div className="flex items-center overflow-x-auto scrollbar-hide">
            {SAVED_VIEWS.map((view) => (
              <AdminTab
                key={view.value}
                label={view.label}
                count={savedViewResult?.totalCount && activeView === view.value ? savedViewResult.totalCount : undefined}
                active={activeView === view.value}
                icon={view.icon}
                onClick={() => setActiveView(view.value)}
              />
            ))}
          </div>
        </div>

        {/* Search and Filters Bar */}
        <div className="p-4 border-b bg-white flex flex-col gap-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1 group">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-600 transition-colors" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search products... (Try 'status:draft' or 'cat:booster')"
                className="w-full rounded-xl border bg-gray-50 py-2.5 pl-10 pr-3 text-sm focus:ring-2 focus:ring-primary-500 focus:bg-white outline-none transition-all shadow-sm group-hover:border-gray-300"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-focus-within:opacity-100 transition-opacity">
                <kbd className="rounded border bg-white px-1.5 py-0.5 text-[10px] font-bold text-gray-400 shadow-xs">ESC</kbd>
                <span className="text-[10px] font-medium text-gray-400">to clear</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setIsFilterPanelOpen(true)}
                className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-bold transition-all active:scale-95 shadow-sm ${
                  hasAnyFilters ? 'bg-primary-50 border-primary-200 text-primary-700' : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <SlidersHorizontal className="h-4 w-4" />
                Filters
                {hasAnyFilters && <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary-600 text-[10px] text-white">{activeFilterChips.length}</span>}
              </button>
              
              <div className="h-8 w-px bg-gray-200 mx-1 hidden sm:block" />
              
              <div className="flex rounded-xl border bg-gray-50 p-1 shadow-sm">
                <button onClick={() => setViewMode('list')} className={`rounded-lg px-2.5 py-1.5 transition ${viewMode === 'list' ? 'bg-white text-gray-900 shadow-sm ring-1 ring-black/5' : 'text-gray-400 hover:text-gray-600'}`} title="List view"><List className="h-4 w-4" /></button>
                <button onClick={() => setViewMode('grid')} className={`rounded-lg px-2.5 py-1.5 transition ${viewMode === 'grid' ? 'bg-white text-gray-900 shadow-sm ring-1 ring-black/5' : 'text-gray-400 hover:text-gray-600'}`} title="Grid view"><LayoutGrid className="h-4 w-4" /></button>
              </div>
            </div>
          </div>

          {/* Active Filter Chips */}
          {hasAnyFilters && (
            <div className="flex flex-wrap items-center gap-2 animate-in fade-in slide-in-from-left-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 mr-1">Active filters:</span>
              {activeFilterChips.map((chip) => (
                <button key={chip.key} onClick={chip.onRemove} className="inline-flex items-center gap-1.5 rounded-full border bg-white px-3 py-1 text-[11px] font-bold text-gray-700 shadow-sm hover:border-gray-300 transition-colors">
                  <span className="text-gray-400">{chip.label}:</span> {chip.value} <X className="h-3 w-3" />
                </button>
              ))}
              <button onClick={clearAllFilters} className="text-[10px] font-black uppercase tracking-widest text-primary-600 hover:text-primary-700 px-2">Clear all</button>
            </div>
          )}
        </div>

        {/* Table / Content */}
        <div className="flex-1 min-h-0 relative">
          {viewMode === 'list' ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className={`sticky top-0 z-10 border-b transition-colors duration-200 ${isSelectionMode ? 'bg-primary-600 text-white' : 'bg-gray-50 text-gray-500'}`}>
                  <tr>
                    <th className="w-12 px-4 py-3">
                      <input 
                        type="checkbox" 
                        checked={selectedIds.size > 0 && selectedIds.size === products.length} 
                        onChange={toggleAll} 
                        className={`h-4 w-4 rounded border-gray-300 transition-colors ${isSelectionMode ? 'text-white focus:ring-white bg-primary-500' : 'text-primary-600 focus:ring-primary-500'}`} 
                      />
                    </th>
                    {isSelectionMode ? (
                      <th colSpan={8} className="px-4 py-3 text-left">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black uppercase tracking-widest">{selectedIds.size} items selected</span>
                          <div className="flex items-center gap-3">
                            <button onClick={() => void applyBulkUpdate({ status: 'active' })} className="text-[10px] font-black uppercase tracking-widest bg-white/20 px-3 py-1 rounded-lg hover:bg-white/30 transition">Set Active</button>
                            <button onClick={() => void applyBulkUpdate({ status: 'archived' })} className="text-[10px] font-black uppercase tracking-widest bg-white/20 px-3 py-1 rounded-lg hover:bg-white/30 transition">Archive</button>
                            <button onClick={bulkDelete} className="text-[10px] font-black uppercase tracking-widest bg-red-500/20 px-3 py-1 rounded-lg hover:bg-red-500/30 text-red-100 transition border border-red-500/30">Delete Permanently</button>
                          </div>
                        </div>
                      </th>
                    ) : (
                      <>
                        <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest">Product</th>
                        <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest">Status</th>
                        <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest">Health</th>
                        <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest">Inventory</th>
                        <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest">Category</th>
                        <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-widest">Price</th>
                        <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-widest">Margin</th>
                        <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-widest">Actions</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loading && [1, 2, 3, 4, 5, 6].map((i) => <SkeletonRow key={i} columns={9} />)}
                  {!loading && products.map((product) => {
                    const isSelected = selectedIds.has(product.id);
                    return (
                      <tr key={product.id} className={`group transition-all duration-150 hover:bg-gray-50/80 ${isSelected ? 'bg-primary-50/40' : ''}`}>
                        <td className="px-4 py-3.5"><input type="checkbox" checked={isSelected} onChange={() => toggleSelect(product.id)} className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500" /></td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border bg-gray-50 shadow-xs group-hover:scale-105 transition-transform duration-200">
                              <img src={product.imageUrl} alt="" className="h-full w-full object-cover" />
                              {!product.imageUrl && <div className="flex h-full w-full items-center justify-center bg-gray-100"><ImageOff className="h-5 w-5 text-gray-300" /></div>}
                            </div>
                            <div className="min-w-0 space-y-0.5">
                              <Link href={`/admin/products/${product.id}/edit`} className="block font-bold text-gray-900 truncate hover:text-primary-600 transition-colors tracking-tight">{product.name}</Link>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider">{product.sku || 'NO-SKU'}</span>
                                <span className="text-[10px] text-gray-300">·</span>
                                <span className="text-[10px] font-medium text-gray-500 uppercase tracking-widest">{vendorLabel(product)}</span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5"><AdminStatusBadge status={product.status} type="order" /></td>
                        <td className="px-4 py-3.5"><HealthBadge product={product} /></td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-bold ${product.stock < 5 ? 'text-amber-600' : 'text-gray-900'}`}>{product.stock}</span>
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Units</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5"><span className="inline-flex items-center rounded-lg bg-gray-100 px-2 py-1 text-[10px] font-bold text-gray-600">{humanizeCategory(product.category)}</span></td>
                        <td className="px-4 py-3.5 text-right font-black text-gray-900">{formatCurrency(product.price)}</td>
                        <td className="px-4 py-3.5 text-right">
                          <div className="flex flex-col items-end">
                            <span className="font-bold text-gray-900">{product.grossMarginPercent !== null ? `${product.grossMarginPercent}%` : '—'}</span>
                            <span className={`text-[9px] font-black uppercase tracking-widest ${product.marginHealth === 'premium' ? 'text-green-600' : product.marginHealth === 'at_risk' ? 'text-red-600' : 'text-gray-400'}`}>
                              {product.marginHealth}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Link href={`/admin/products/${product.id}/edit`} className="p-2 text-gray-400 hover:text-primary-600 transition-colors"><Pencil className="h-4 w-4" /></Link>
                            <button onClick={() => setDeleteCandidate(product)} className="p-2 text-gray-400 hover:text-red-600 transition-colors"><Trash2 className="h-4 w-4" /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 p-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 bg-gray-50/50">
              {products.map((product) => {
                const isSelected = selectedIds.has(product.id);
                return (
                  <div 
                    key={product.id} 
                    onClick={() => toggleSelect(product.id)} 
                    className={`group relative flex flex-col rounded-2xl border bg-white p-3 transition-all duration-200 cursor-pointer hover:shadow-xl hover:border-primary-200 ${isSelected ? 'ring-2 ring-primary-500 border-transparent shadow-lg' : 'shadow-sm border-gray-100'}`}
                  >
                    <div className="relative aspect-square w-full overflow-hidden rounded-xl border bg-gray-50 mb-4">
                      <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-110" />
                      <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
                        <AdminStatusBadge status={product.status} type="order" />
                        {product.stock === 0 && <span className="rounded bg-red-600 px-1.5 py-0.5 text-[8px] font-black text-white uppercase tracking-tighter shadow-sm">Sold Out</span>}
                      </div>
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="space-y-0.5">
                        <h3 className="text-sm font-black text-gray-900 leading-tight group-hover:text-primary-600 transition-colors line-clamp-2">{product.name}</h3>
                        <p className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest">{product.sku || 'NO-SKU'}</p>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                        <span className="text-sm font-black text-gray-900">{formatCurrency(product.price)}</span>
                        <span className={`text-[10px] font-black uppercase tracking-widest ${product.stock < 5 ? 'text-amber-600' : 'text-gray-400'}`}>{product.stock} Units</span>
                      </div>
                      <HealthBadge product={product} />
                    </div>
                    
                    <div className={`absolute top-2 left-2 transition-all duration-300 ${isSelected ? 'scale-100 opacity-100' : 'scale-50 opacity-0 group-hover:opacity-100 group-hover:scale-100'}`}>
                      <div className={`h-6 w-6 rounded-full flex items-center justify-center border-2 border-white shadow-md transition-colors ${isSelected ? 'bg-primary-600' : 'bg-gray-200'}`}>
                        <Check className="h-3.5 w-3.5 text-white stroke-[4px]" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {!loading && products.length === 0 && (
            <div className="py-20">
              {query || hasAnyFilters ? (
                <AdminEmptyState 
                  title="No products found" 
                  description="We couldn't find any products matching your current filters or search term. Try expanding your search or clearing filters." 
                  icon={SearchCode} 
                  action={<button onClick={clearAllFilters} className="rounded-xl bg-gray-900 px-6 py-2.5 text-xs font-bold text-white shadow-lg transition hover:bg-gray-800 active:scale-95">Clear all filters</button>}
                />
              ) : (
                <AdminEmptyState 
                  title="Start your product catalog" 
                  description="You haven't added any products yet. Start by creating your first listing or importing your inventory from a CSV file." 
                  icon={Package} 
                  action={
                    <Link href="/admin/products/new" className="rounded-xl bg-primary-600 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-primary-500/20 transition hover:bg-primary-700 active:scale-95 flex items-center gap-2">
                      <Plus className="h-4 w-4" /> Add your first product
                    </Link>
                  }
                  secondaryAction={
                    <button 
                      onClick={() => setIsImportOpen(true)}
                      className="rounded-xl border bg-white px-6 py-2.5 text-xs font-bold text-gray-700 shadow-sm transition hover:bg-gray-50 active:scale-95 flex items-center gap-2"
                    >
                      <Upload className="h-4 w-4" /> Import from CSV
                    </button>
                  }
                />
              )}
            </div>
          )}
        </div>

        {/* Footer Stats */}
        <div className="bg-gray-50 border-t px-6 py-3 flex items-center justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest">
           <div>Showing {products.length} products · Sorted by {sortLabel(sort)}</div>
           <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-green-500" /> {overview?.statusCounts.active} Active</span>
              <span className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-amber-500" /> {overview?.lowStockCount} Low stock</span>
           </div>
        </div>
      </div>

      {/* Slide-over Filter Panel */}
      <AdminFilterPanel
        open={isFilterPanelOpen}
        onClose={() => setIsFilterPanelOpen(false)}
        filters={{
          status: statusFilter,
          category,
          vendor: vendorFilter,
          inventory: inventoryFilter,
          margin: marginFilter,
          hasSku: skuFilter,
          hasImage: imageFilter,
        }}
        onFilterChange={handleFilterChange}
        onReset={clearAllFilters}
        facets={{
          vendors: vendorOptions,
          categories: categoryOptions,
          counts: {} // Could be populated if domain supported it
        }}
      />

      <AdminConfirmDialog open={!!deleteCandidate} onClose={() => setDeleteCandidate(null)} onConfirm={confirmDelete} title="Delete product?" description={`"${deleteCandidate?.name}" will be permanently removed from your catalog. This cannot be undone.`} confirmLabel="Delete" loading={deleting} variant="danger" />
      
      <AdminImportDialog 
        open={isImportOpen} 
        onClose={() => setIsImportOpen(false)} 
        onImport={handleImport} 
        title="Import Products" 
        templateUrl="/templates/product_import_template.csv"
        description="Upload a CSV with name, price, stock, sku, category, etc. Prices should be in dollars."
      />

      {/* Bulk Action Context (Optional additional bar at bottom if needed, but we now have the integrated table header) */}
      <BulkActionBar
        selectedCount={selectedIds.size}
        onClear={() => setSelectedIds(new Set())}
        actions={
          <>
            <button onClick={() => router.push(`/admin/products/bulk-edit?ids=${Array.from(selectedIds).join(',')}`)} className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-bold text-white hover:bg-white/20 transition">Edit Details</button>
            <button onClick={bulkDelete} className="rounded-lg bg-red-500/20 px-3 py-1.5 text-xs font-bold text-red-200 hover:bg-red-500/30 transition border border-red-500/30">Delete Permanently</button>
          </>
        }
      />
    </div>
  );
}
