/**
 * [LAYER: CORE]
 */
import type { IProductRepository } from '@domain/repositories';
import type {
  InventoryOverview,
  MarginHealth,
  Product,
  ProductDraft,
  ProductManagementActiveFilter,
  ProductManagementFacetOption,
  ProductManagementFacets,
  ProductManagementFilters,
  ProductManagementOverview,
  ProductManagementProduct,
  ProductManagementSortKey,
  ProductSavedView,
  ProductSavedViewResult,
  ProductSetupIssue,
  ProductStatus,
  ProductUpdate,
} from '@domain/models';
import { AuditService } from './AuditService';
import { ProductNotFoundError } from '@domain/errors';
import {
  assertValidProductDraft,
  assertValidProductUpdate,
  calculateGrossMarginPercent,
  classifyInventoryHealth,
  classifyMarginHealth,
  classifyProductSetupStatus,
  getProductSetupIssues,
} from '@domain/rules';

const PRODUCT_SAVED_VIEWS: ProductSavedView[] = [
  'all',
  'active',
  'drafts',
  'needs_attention',
  'low_stock',
  'missing_sku',
  'missing_cost',
  'needs_photos',
  'archived',
];

const DEFAULT_MANAGEMENT_SORT: ProductManagementSortKey = 'updated_desc';

const MANAGEMENT_SORTS: ProductManagementSortKey[] = [
  'updated_desc',
  'created_desc',
  'name_asc',
  'name_desc',
  'inventory_asc',
  'inventory_desc',
  'price_asc',
  'price_desc',
  'margin_asc',
  'margin_desc',
];

export function isProductSavedView(value: string): value is ProductSavedView {
  return PRODUCT_SAVED_VIEWS.includes(value as ProductSavedView);
}

export function isProductManagementSort(value: string): value is ProductManagementSortKey {
  return MANAGEMENT_SORTS.includes(value as ProductManagementSortKey);
}

export class ProductService {
  constructor(
    private repo: IProductRepository,
    private audit: AuditService
  ) {}

  async getProducts(options?: {
    category?: string;
    query?: string;
    limit?: number;
    cursor?: string;
  }): Promise<{ products: Product[]; nextCursor?: string }> {
    return this.repo.getAll(options);
  }

  async getInventoryOverview(): Promise<InventoryOverview> {
    const stats = await this.repo.getStats();
    
    // For the list of products in the overview, we still limit to 100 for performance
    const { products } = await this.repo.getAll({ limit: 100 });
    
    const enrichedProducts = products.map((product) => {
      const inventoryHealth = classifyInventoryHealth(product.stock);
      return { ...product, inventoryHealth };
    });

    return {
      totalProducts: stats.totalProducts,
      totalUnits: stats.totalUnits,
      inventoryValue: stats.inventoryValue,
      healthCounts: stats.healthCounts,
      products: enrichedProducts.sort((a, b) => {
        const rank = { out_of_stock: 0, low_stock: 1, healthy: 2 } as const;
        return rank[a.inventoryHealth] - rank[b.inventoryHealth] || a.stock - b.stock || a.name.localeCompare(b.name);
      }),
    };
  }

  async getProductManagementOverview(): Promise<ProductManagementOverview> {
    const { products } = await this.repo.getAll({ limit: 500 });
    const statusCounts: Record<ProductStatus, number> = { active: 0, draft: 0, archived: 0 };
    const setupIssueCounts: Record<ProductSetupIssue, number> = {
      missing_image: 0,
      missing_sku: 0,
      missing_price: 0,
      missing_cost: 0,
      missing_stock: 0,
      missing_category: 0,
      not_published: 0,
    };
    const marginHealthCounts: Record<MarginHealth, number> = {
      unknown: 0,
      at_risk: 0,
      healthy: 0,
      premium: 0,
    };
    let marginSum = 0;
    let marginCount = 0;

    const enriched = products.map((product) => {
      statusCounts[product.status] += 1;
      const setupIssues = getProductSetupIssues(product);
      for (const issue of setupIssues) setupIssueCounts[issue] += 1;
      const marginHealth = classifyMarginHealth(product);
      marginHealthCounts[marginHealth] += 1;
      const grossMarginPercent = calculateGrossMarginPercent(product);
      if (grossMarginPercent !== null) {
        marginSum += grossMarginPercent;
        marginCount += 1;
      }
      return this.enrichProductForManagement(product, setupIssues, marginHealth, grossMarginPercent);
    });

    return {
      totalProducts: products.length,
      statusCounts,
      setupIssueCounts,
      marginHealthCounts,
      lowStockCount: products.filter((product) => product.stock > 0 && product.stock < (product.reorderPoint ?? 5)).length,
      outOfStockCount: products.filter((product) => product.stock <= 0).length,
      averageMarginPercent: marginCount > 0 ? Math.round((marginSum / marginCount) * 10) / 10 : null,
      productsNeedingAttention: enriched
        .filter((product) => product.setupStatus === 'needs_attention')
        .sort((a, b) => b.setupIssues.length - a.setupIssues.length || a.name.localeCompare(b.name))
        .slice(0, 25),
    };
  }

  async getProductSavedView(
    view: ProductSavedView,
    options?: ProductManagementFilters
  ): Promise<ProductSavedViewResult> {
    const { products } = await this.repo.getAll({
      query: options?.query,
      limit: 1000,
    });
    const savedViewProducts = products
      .map((product) => this.enrichProductForManagement(product))
      .filter((product) => this.matchesSavedView(product, view));

    const facets = this.buildManagementFacets(savedViewProducts);
    const activeFilters = this.buildActiveFilters(options);
    const sort = options?.sort && MANAGEMENT_SORTS.includes(options.sort) ? options.sort : DEFAULT_MANAGEMENT_SORT;
    const filtered = savedViewProducts
      .filter((product) => this.matchesManagementFilters(product, options))
      .sort((a, b) => this.compareManagedProducts(a, b, sort, view));

    const cursorIndex = options?.cursor ? filtered.findIndex((product) => product.id === options.cursor) : -1;
    const cursorFiltered = cursorIndex >= 0 ? filtered.slice(cursorIndex + 1) : filtered;
    const limit = Math.min(Math.max(options?.limit ?? 100, 1), 500);
    const limited = cursorFiltered.slice(0, limit);

    return {
      view,
      totalCount: savedViewProducts.length,
      filteredCount: filtered.length,
      products: limited,
      facets,
      activeFilters,
      sort,
      nextCursor: cursorFiltered.length > limit ? limited[limited.length - 1]?.id : undefined,
    };
  }

  async getProductManagementList(options?: ProductManagementFilters & { view?: ProductSavedView }): Promise<ProductSavedViewResult> {
    return this.getProductSavedView(options?.view ?? 'all', options);
  }

  private enrichProductForManagement(
    product: Product,
    setupIssues = getProductSetupIssues(product),
    marginHealth = classifyMarginHealth(product),
    grossMarginPercent = calculateGrossMarginPercent(product)
  ): ProductManagementProduct {
    return {
      ...product,
      setupStatus: classifyProductSetupStatus(product),
      setupIssues,
      marginHealth,
      grossMarginPercent,
      inventoryHealth: classifyInventoryHealth(product.stock),
    };
  }

  private matchesSavedView(product: ProductManagementProduct, view: ProductSavedView): boolean {
    if (view === 'all') return true;
    if (view === 'active') return product.status === 'active';
    if (view === 'drafts') return product.status === 'draft';
    if (view === 'archived') return product.status === 'archived';
    if (view === 'needs_attention') return product.setupStatus === 'needs_attention';
    if (view === 'low_stock') return product.stock > 0 && product.stock < (product.reorderPoint ?? 5);
    if (view === 'missing_sku') return product.setupIssues.includes('missing_sku');
    if (view === 'missing_cost') return product.setupIssues.includes('missing_cost');
    if (view === 'needs_photos') return product.setupIssues.includes('missing_image');
    return false;
  }

  private matchesManagementFilters(product: ProductManagementProduct, filters?: ProductManagementFilters): boolean {
    if (!filters) return true;
    if (filters.status && filters.status !== 'all' && product.status !== filters.status) return false;
    if (filters.category && filters.category !== 'all' && product.category !== filters.category) return false;
    if (filters.vendor && filters.vendor !== 'all' && this.vendorLabel(product) !== filters.vendor) return false;
    if (filters.productType && filters.productType !== 'all' && product.productType !== filters.productType) return false;
    if (filters.inventoryHealth && filters.inventoryHealth !== 'all' && product.inventoryHealth !== filters.inventoryHealth) return false;
    if (filters.setupStatus && filters.setupStatus !== 'all' && product.setupStatus !== filters.setupStatus) return false;
    if (filters.setupIssue && filters.setupIssue !== 'all' && !product.setupIssues.includes(filters.setupIssue)) return false;
    if (filters.marginHealth && filters.marginHealth !== 'all' && product.marginHealth !== filters.marginHealth) return false;
    if (filters.tag && !(product.tags ?? []).some((tag) => tag.toLowerCase() === filters.tag?.toLowerCase())) return false;
    if (filters.hasSku !== undefined && Boolean(product.sku?.trim()) !== filters.hasSku) return false;
    if (filters.hasImage !== undefined && Boolean(product.imageUrl?.trim()) !== filters.hasImage) return false;
    if (filters.hasCost !== undefined && Boolean(product.cost !== undefined) !== filters.hasCost) return false;
    return true;
  }

  private compareManagedProducts(a: ProductManagementProduct, b: ProductManagementProduct, sort: ProductManagementSortKey, view: ProductSavedView): number {
    if (sort === 'name_asc') return a.name.localeCompare(b.name);
    if (sort === 'name_desc') return b.name.localeCompare(a.name);
    if (sort === 'created_desc') return b.createdAt.getTime() - a.createdAt.getTime() || a.name.localeCompare(b.name);
    if (sort === 'inventory_asc') return a.stock - b.stock || a.name.localeCompare(b.name);
    if (sort === 'inventory_desc') return b.stock - a.stock || a.name.localeCompare(b.name);
    if (sort === 'price_asc') return a.price - b.price || a.name.localeCompare(b.name);
    if (sort === 'price_desc') return b.price - a.price || a.name.localeCompare(b.name);
    if (sort === 'margin_asc') return (a.grossMarginPercent ?? -1) - (b.grossMarginPercent ?? -1) || a.name.localeCompare(b.name);
    if (sort === 'margin_desc') return (b.grossMarginPercent ?? -1) - (a.grossMarginPercent ?? -1) || a.name.localeCompare(b.name);
    if (view === 'low_stock') return a.stock - b.stock || a.name.localeCompare(b.name);
    if (view === 'missing_sku' || view === 'missing_cost' || view === 'needs_photos' || view === 'needs_attention') {
      return b.setupIssues.length - a.setupIssues.length || a.name.localeCompare(b.name);
    }
    return b.updatedAt.getTime() - a.updatedAt.getTime() || a.name.localeCompare(b.name);
  }

  private buildManagementFacets(products: ProductManagementProduct[]): ProductManagementFacets {
    return {
      statuses: this.toFacetOptions(this.countBy(products, (product) => product.status), this.statusLabel),
      categories: this.toFacetOptions(this.countBy(products, (product) => product.category), this.titleize),
      vendors: this.toFacetOptions(this.countBy(products, (product) => this.vendorLabel(product), (value) => value !== '—')),
      productTypes: this.toFacetOptions(this.countBy(products, (product) => product.productType ?? 'No type')),
      inventoryHealth: this.toFacetOptions(this.countBy(products, (product) => product.inventoryHealth), this.titleize),
      setupIssues: this.toFacetOptions(this.countBy(products.flatMap((product) => product.setupIssues), (issue) => issue), this.titleize),
      marginHealth: this.toFacetOptions(this.countBy(products, (product) => product.marginHealth), this.titleize),
      tags: this.toFacetOptions(this.countBy(products.flatMap((product) => product.tags ?? []), (tag) => tag)).slice(0, 25),
    };
  }

  private buildActiveFilters(filters?: ProductManagementFilters): ProductManagementActiveFilter[] {
    if (!filters) return [];
    const active: ProductManagementActiveFilter[] = [];
    const add = (key: keyof ProductManagementFilters, label: string, value: string | undefined | boolean) => {
      if (value === undefined || value === '' || value === 'all') return;
      active.push({ key, label, value: typeof value === 'boolean' ? (value ? 'Yes' : 'No') : this.titleize(value) });
    };
    add('query', 'Search', filters.query);
    add('status', 'Status', filters.status);
    add('category', 'Category', filters.category);
    add('vendor', 'Vendor', filters.vendor);
    add('productType', 'Product type', filters.productType);
    add('inventoryHealth', 'Inventory', filters.inventoryHealth);
    add('setupStatus', 'Setup', filters.setupStatus);
    add('setupIssue', 'Issue', filters.setupIssue);
    add('marginHealth', 'Margin', filters.marginHealth);
    add('tag', 'Tag', filters.tag);
    add('hasSku', 'Has SKU', filters.hasSku);
    add('hasImage', 'Has photo', filters.hasImage);
    add('hasCost', 'Has cost', filters.hasCost);
    return active;
  }

  private countBy<T>(items: T[], picker: (item: T) => string, include: (value: string) => boolean = Boolean): Map<string, number> {
    const counts = new Map<string, number>();
    for (const item of items) {
      const value = picker(item);
      if (!include(value)) continue;
      counts.set(value, (counts.get(value) ?? 0) + 1);
    }
    return counts;
  }

  private toFacetOptions(counts: Map<string, number>, labeler: (value: string) => string = (value) => value): ProductManagementFacetOption[] {
    return Array.from(counts.entries())
      .map(([value, count]) => ({ value, label: labeler(value), count }))
      .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
  }

  private vendorLabel(product: Product): string {
    return product.vendor || product.supplier || product.manufacturer || '—';
  }

  private statusLabel(value: string): string {
    if (value === 'active') return 'Active';
    if (value === 'draft') return 'Draft';
    if (value === 'archived') return 'Archived';
    return value;
  }

  private titleize(value: string): string {
    return value.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  async getProduct(id: string): Promise<Product> {
    const product = await this.repo.getById(id);
    if (!product) throw new ProductNotFoundError(id);
    return product;
  }

  async getProductByHandle(handle: string): Promise<Product> {
    const product = await this.repo.getByHandle(handle);
    if (!product) throw new ProductNotFoundError(handle);
    return product;
  }

  async createProduct(data: ProductDraft, actor: { id: string, email: string }): Promise<Product> {
    assertValidProductDraft(data);
    const product = await this.repo.create(data);
    await this.audit.record({
      userId: actor.id,
      userEmail: actor.email,
      action: 'product_created',
      targetId: product.id,
      details: {
        name: product.name,
        sku: product.sku ?? null,
        manufacturer: product.manufacturer ?? null,
        supplier: product.supplier ?? null,
      }
    });
    return product;
  }

  async updateProduct(id: string, updates: ProductUpdate, actor: { id: string, email: string }): Promise<Product> {
    assertValidProductUpdate(updates);
    const product = await this.repo.update(id, updates);
    await this.audit.record({
      userId: actor.id,
      userEmail: actor.email,
      action: 'product_updated',
      targetId: id,
      details: updates
    });
    return product;
  }

  async deleteProduct(id: string, actor: { id: string, email: string }): Promise<void> {
    await this.repo.delete(id);
    await this.audit.record({
      userId: actor.id,
      userEmail: actor.email,
      action: 'product_deleted',
      targetId: id
    });
  }

  async batchUpdateProducts(updates: { id: string; updates: ProductUpdate }[], actor: { id: string, email: string }): Promise<Product[]> {
    updates.forEach(({ updates: u }) => assertValidProductUpdate(u));
    
    let products: Product[];
    if (this.repo.batchUpdate) {
      products = await this.repo.batchUpdate(updates);
    } else {
      products = await Promise.all(updates.map(({ id, updates: u }) => this.repo.update(id, u)));
    }

    await this.audit.record({
      userId: actor.id,
      userEmail: actor.email,
      action: 'product_batch_updated',
      targetId: 'multiple',
      details: { count: updates.length, ids: updates.map(u => u.id) }
    });

    return products;
  }

  async batchUpdateInventory(updates: { id: string; variantId?: string; stock: number }[], actor: { id: string, email: string }): Promise<void> {
    const deltaUpdates = await Promise.all(updates.map(async (u) => {
      const product = await this.repo.getById(u.id);
      if (!product) throw new ProductNotFoundError(u.id);
      
      let currentStock = product.stock;
      if (u.variantId) {
        const variant = product.variants?.find(v => v.id === u.variantId);
        if (!variant) throw new Error(`Variant ${u.variantId} not found`);
        currentStock = variant.stock;
      }
      
      return { id: u.id, variantId: u.variantId, delta: u.stock - currentStock };
    }));

    if (this.repo.batchUpdateStock) {
      await this.repo.batchUpdateStock(deltaUpdates);
    } else {
      for (const update of deltaUpdates) {
        if (update.variantId) {
          await this.repo.updateVariantStock(update.variantId, update.delta);
        } else {
          await this.repo.updateStock(update.id, update.delta);
        }
      }
    }

    await this.audit.record({
      userId: actor.id,
      userEmail: actor.email,
      action: 'inventory_batch_updated',
      targetId: 'multiple',
      details: { count: updates.length }
    });
  }

  async batchDeleteProducts(ids: string[], actor: { id: string, email: string }): Promise<void> {
    if (this.repo.batchDelete) {
      await this.repo.batchDelete(ids);
    } else {
      await Promise.all(ids.map((id) => this.repo.delete(id)));
    }

    await this.audit.record({
      userId: actor.id,
      userEmail: actor.email,
      action: 'product_batch_deleted',
      targetId: 'multiple',
      details: { count: ids.length, ids }
    });
  }
}
