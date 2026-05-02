/**
 * [LAYER: INFRASTRUCTURE]
 * SQLite Implementation of Product Repository using Kysely
 */
import { Kysely } from 'kysely';
import { getSQLiteDB } from '../../sqlite/database';
import type { Database, ProductTable } from '../../sqlite/schema';
import type { IProductRepository } from '@domain/repositories';
import type { Product, ProductStatus, ProductDraft, ProductUpdate, ProductSalesChannel } from '@domain/models';
import { DomainError, InsufficientStockError, InvalidProductError, ProductNotFoundError } from '@domain/errors';
import { coalesceStockUpdates } from '@domain/rules';
import { logger } from '@utils/logger';
import { sql } from 'kysely';

function parseProductCategory(value: string): string {
  return value || 'other';
}

function nullableText(value: string | undefined): string | null {
  return value?.trim() || null;
}

function stringifyStringList(value: string[] | undefined): string | null {
  if (!value || value.length === 0) return null;
  return JSON.stringify(value.map((item) => item.trim()).filter(Boolean));
}

function parseStringList(value: string | null): string[] | undefined {
  if (!value) return undefined;
  try {
    const parsed = JSON.parse(value) as unknown;
    if (Array.isArray(parsed) && parsed.every((item) => typeof item === 'string')) {
      return parsed;
    }
  } catch {
    throw new DomainError('Stored product list metadata is invalid JSON.');
  }
  throw new DomainError('Stored product list metadata is invalid.');
}

function stringifySalesChannels(value: ProductSalesChannel[] | undefined): string | null {
  if (!value || value.length === 0) return null;
  return JSON.stringify(value);
}

function parseSalesChannels(value: string | null): ProductSalesChannel[] | undefined {
  if (!value) return undefined;
  const allowed: ProductSalesChannel[] = ['online_store', 'pos', 'draft_order'];
  try {
    const parsed = JSON.parse(value) as unknown;
    if (Array.isArray(parsed) && parsed.every((item): item is ProductSalesChannel => allowed.includes(item as ProductSalesChannel))) {
      return parsed;
    }
  } catch {
    throw new DomainError('Stored product sales channels are invalid JSON.');
  }
  throw new DomainError('Stored product sales channels are invalid.');
}

function nullableBoolean(value: boolean | undefined): number | null {
  if (value === undefined) return null;
  return value ? 1 : 0;
}

function parseNullableBoolean(value: number | null | undefined): boolean | undefined {
  if (value === null || value === undefined) return undefined;
  return value === 1;
}

function isUniqueSkuConstraintError(error: unknown): boolean {
  return error instanceof Error
    && (error.message.includes('idx_products_sku_unique') || error.message.includes('products.sku'));
}

function parseClassification(value: string | null): string | undefined {
  return value || undefined;
}

function parseProductStatus(value: string | null): ProductStatus {
  if (value === 'active' || value === 'draft' || value === 'archived') {
    return value;
  }
  return 'active'; // Default for safety
}

export class SQLiteProductRepository implements IProductRepository {
  private db: Kysely<Database>;
  
  // BroccoliQ Level 7: Memory-First Auth-Index
  private authIndex: Map<string, Product> | null = null;
  
  // BroccoliQ Level 11: Hardened Memory Limit
  private readonly MAX_INDEX_SIZE = 10000;
  private isCatalogTooLarge = false;

  constructor() {
    this.db = getSQLiteDB();
  }

  private mapTableToProduct(row: any, media: any[] = []): Product {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      price: row.price,
      compareAtPrice: row.compareAtPrice ?? undefined,
      cost: row.cost ?? undefined,
      category: parseProductCategory(row.category),
      productType: row.productType || undefined,
      vendor: row.vendor || undefined,
      tags: parseStringList(row.tags),
      collections: parseStringList(row.collections),
      handle: row.handle || undefined,
      seoTitle: row.seoTitle || undefined,
      seoDescription: row.seoDescription || undefined,
      salesChannels: parseSalesChannels(row.salesChannels),
      stock: row.stock,
      trackQuantity: parseNullableBoolean(row.trackQuantity),
      continueSellingWhenOutOfStock: parseNullableBoolean(row.continueSellingWhenOutOfStock),
      reorderPoint: row.reorderPoint ?? undefined,
      reorderQuantity: row.reorderQuantity ?? undefined,
      physicalItem: parseNullableBoolean(row.physicalItem),
      weightGrams: row.weightGrams ?? undefined,
      sku: row.sku || undefined,
      manufacturer: row.manufacturer || undefined,
      supplier: row.supplier || undefined,
      manufacturerSku: row.manufacturerSku || undefined,
      barcode: row.barcode || undefined,
      imageUrl: row.imageUrl,
      media: media.map(m => ({
        id: m.id,
        url: m.url,
        altText: m.altText || undefined,
        position: m.position,
        width: m.width || undefined,
        height: m.height || undefined,
        size: m.size || undefined,
        createdAt: new Date(m.createdAt)
      })).sort((a, b) => a.position - b.position),
      status: parseProductStatus(row.status),
      set: row.set || undefined,
      rarity: parseClassification(row.rarity),
      isDigital: parseNullableBoolean(row.isDigital),
      digitalAssets: row.digitalAssets ? JSON.parse(row.digitalAssets) : undefined,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    };
  }

  // BroccoliQ Level 7 & 11: Ensure the index is warmed into RAM, but safely.
  // Exposed publicly as Level 9 Sovereign Warmup
  public async warmup(): Promise<void> {
    return this.ensureIndexWarm();
  }

  private async ensureIndexWarm(): Promise<void> {
    if (this.authIndex !== null || this.isCatalogTooLarge) return;
    
    // Check catalog size first to prevent OOM
    const countResult = await this.db
      .selectFrom('products')
      .select(({ fn }) => fn.count<number>('id').as('total_count'))
      .executeTakeFirst();
      
    if (countResult && countResult.total_count > this.MAX_INDEX_SIZE) {
      logger.warn('[Hive] Level 11 Alert: Product catalog exceeds safe memory limit. Falling back to physical disk reads.', {
        count: countResult.total_count,
        max: this.MAX_INDEX_SIZE,
      });
      this.isCatalogTooLarge = true;
      return;
    }

    const results = await this.db.selectFrom('products').selectAll().execute();
    const mediaResults = await this.db.selectFrom('product_media').selectAll().execute();
    
    // Group media by productId
    const mediaMap = new Map<string, any[]>();
    for (const m of mediaResults) {
      if (!mediaMap.has(m.productId)) mediaMap.set(m.productId, []);
      mediaMap.get(m.productId)!.push(m);
    }

    this.authIndex = new Map();
    for (const row of results) {
      this.authIndex.set(row.id, this.mapTableToProduct(row, mediaMap.get(row.id) || []));
    }
  }

  private invalidateIndex() {
    this.authIndex = null;
    this.isCatalogTooLarge = false; // Level 11 Fix: Re-evaluate safe limits after mutations
  }

  async getAll(options?: {
    category?: string;
    query?: string;
    limit?: number;
    cursor?: string;
  }): Promise<{ products: Product[]; nextCursor?: string }> {
    // BroccoliQ Level 7: O(1) Reactive Lookups from RAM
    await this.ensureIndexWarm();
    
    // Level 11 Fallback: If catalog is too large, use standard SQL
    if (this.isCatalogTooLarge || !this.authIndex) {
      let query = this.db.selectFrom('products').selectAll();

      if (options?.category) {
        query = query.where('category', '=', options.category);
      }

      if (options?.query) {
        const q = `%${options.query}%`;
        query = query.where((eb) => eb.or([
          eb('name', 'like', q),
          eb('description', 'like', q),
          eb('productType', 'like', q),
          eb('vendor', 'like', q),
          eb('tags', 'like', q),
          eb('collections', 'like', q),
          eb('handle', 'like', q),
          eb('sku', 'like', q),
          eb('manufacturer', 'like', q),
          eb('supplier', 'like', q),
          eb('manufacturerSku', 'like', q),
          eb('barcode', 'like', q),
        ]));
      }

      if (options?.cursor) {
        const cursorProduct = await this.db
          .selectFrom('products')
          .select(['id', 'createdAt'])
          .where('id', '=', options.cursor)
          .executeTakeFirst();

        if (cursorProduct) {
          query = query.where((eb) => eb.or([
            eb('createdAt', '<', cursorProduct.createdAt),
            eb.and([
              eb('createdAt', '=', cursorProduct.createdAt),
              eb('id', '>', cursorProduct.id),
            ]),
          ]));
        }
      }

      const limitCount = options?.limit ?? 20;
      const results = await query
        .orderBy('createdAt', 'desc')
        .orderBy('id', 'asc')
        .limit(limitCount)
        .execute();

      const products = results.map((row) => this.mapTableToProduct(row));
      
      // Level 11: Hydrate media for the visible page
      if (products.length > 0) {
        const productIds = products.map(p => p.id);
        const media = await this.db.selectFrom('product_media')
          .selectAll()
          .where('productId', 'in', productIds)
          .execute();
        
        const mediaMap = new Map<string, any[]>();
        for (const m of media) {
          if (!mediaMap.has(m.productId)) mediaMap.set(m.productId, []);
          mediaMap.get(m.productId)!.push(m);
        }

        for (const p of products) {
          p.media = (mediaMap.get(p.id) || []).map(m => ({
            id: m.id,
            url: m.url,
            altText: m.altText || undefined,
            position: m.position,
            width: m.width || undefined,
            height: m.height || undefined,
            size: m.size || undefined,
            createdAt: new Date(m.createdAt)
          })).sort((a, b) => a.position - b.position);
        }
      }

      const nextCursor = products.length === limitCount ? products[products.length - 1].id : undefined;
      return { products, nextCursor };
    }
    
    let allProducts = Array.from(this.authIndex.values());
    
    // Sort deterministically like the DB would
    allProducts.sort((a, b) => {
      const timeDiff = b.createdAt.getTime() - a.createdAt.getTime();
      if (timeDiff !== 0) return timeDiff;
      return a.id.localeCompare(b.id);
    });

    if (options?.category) {
      allProducts = allProducts.filter(p => p.category === options.category);
    }

    if (options?.query) {
      const q = options.query.toLowerCase();
      allProducts = allProducts.filter(p => 
        p.name.toLowerCase().includes(q) || 
        p.description.toLowerCase().includes(q) ||
        (p.productType?.toLowerCase().includes(q) ?? false) ||
        (p.vendor?.toLowerCase().includes(q) ?? false) ||
        (p.tags?.some((tag) => tag.toLowerCase().includes(q)) ?? false) ||
        (p.collections?.some((collection) => collection.toLowerCase().includes(q)) ?? false) ||
        (p.handle?.toLowerCase().includes(q) ?? false) ||
        (p.sku?.toLowerCase().includes(q) ?? false) ||
        (p.manufacturer?.toLowerCase().includes(q) ?? false) ||
        (p.supplier?.toLowerCase().includes(q) ?? false) ||
        (p.manufacturerSku?.toLowerCase().includes(q) ?? false) ||
        (p.barcode?.toLowerCase().includes(q) ?? false)
      );
    }

    if (options?.cursor) {
      const cursorIndex = allProducts.findIndex(p => p.id === options.cursor);
      if (cursorIndex !== -1) {
        allProducts = allProducts.slice(cursorIndex + 1);
      }
    }

    const limitCount = options?.limit ?? 20;
    const products = allProducts.slice(0, limitCount);
    const nextCursor = products.length === limitCount ? products[products.length - 1].id : undefined;

    return { products, nextCursor };
  }

  async getById(id: string): Promise<Product | null> {
    // BroccoliQ Level 7: Instant Memory-First Lookup
    await this.ensureIndexWarm();
    
    // Level 11 Fallback
    if (this.isCatalogTooLarge || !this.authIndex) {
      const result = await this.db
        .selectFrom('products')
        .selectAll()
        .where('id', '=', id)
        .executeTakeFirst();
      
      if (!result) return null;

      const media = await this.db
        .selectFrom('product_media')
        .selectAll()
        .where('productId', '=', id)
        .execute();

      return this.mapTableToProduct(result, media);
    }

    return this.authIndex.get(id) || null;
  }

  async getByHandle(handle: string): Promise<Product | null> {
    await this.ensureIndexWarm();
    
    if (this.isCatalogTooLarge || !this.authIndex) {
      const result = await this.db
        .selectFrom('products')
        .selectAll()
        .where('handle', '=', handle)
        .executeTakeFirst();
      
      if (!result) return null;

      const media = await this.db
        .selectFrom('product_media')
        .selectAll()
        .where('productId', '=', result.id)
        .execute();

      return this.mapTableToProduct(result, media);
    }
    
    for (const product of this.authIndex.values()) {
      if (product.handle === handle) return product;
    }
    return null;
  }

  async create(product: ProductDraft): Promise<Product> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    try {
      await this.db
        .insertInto('products')
        .values({
          id,
          name: product.name,
          description: product.description,
          price: product.price,
          compareAtPrice: product.compareAtPrice ?? null,
          cost: product.cost ?? null,
          category: product.category,
          productType: nullableText(product.productType),
          vendor: nullableText(product.vendor),
          tags: stringifyStringList(product.tags),
          collections: stringifyStringList(product.collections),
          handle: nullableText(product.handle),
          seoTitle: nullableText(product.seoTitle),
          seoDescription: nullableText(product.seoDescription),
          salesChannels: stringifySalesChannels(product.salesChannels),
          stock: product.stock,
          trackQuantity: nullableBoolean(product.trackQuantity),
          continueSellingWhenOutOfStock: nullableBoolean(product.continueSellingWhenOutOfStock),
          reorderPoint: product.reorderPoint ?? null,
          reorderQuantity: product.reorderQuantity ?? null,
          physicalItem: nullableBoolean(product.physicalItem),
          weightGrams: product.weightGrams ?? null,
          sku: nullableText(product.sku),
          manufacturer: nullableText(product.manufacturer),
          supplier: nullableText(product.supplier),
          manufacturerSku: nullableText(product.manufacturerSku),
          barcode: nullableText(product.barcode),
          imageUrl: product.imageUrl,
          status: product.status || 'active',
          set: product.set || null,
          rarity: product.rarity || null,
          isDigital: nullableBoolean(product.isDigital),
          digitalAssets: product.digitalAssets ? JSON.stringify(product.digitalAssets) : null,
          createdAt: now,
          updatedAt: now,
        })
        .execute();

      if (product.media && product.media.length > 0) {
        for (const m of product.media) {
          await this.db.insertInto('product_media').values({
            id: m.id || crypto.randomUUID(),
            productId: id,
            url: m.url,
            altText: m.altText || null,
            position: m.position,
            width: m.width || null,
            height: m.height || null,
            size: m.size || null,
            createdAt: m.createdAt ? m.createdAt.toISOString() : now
          }).execute();
        }
      }
    } catch (error) {
      if (isUniqueSkuConstraintError(error)) {
        throw new InvalidProductError('SKU must be unique');
      }
      throw error;
    }

    this.invalidateIndex(); 

    const created = await this.getById(id);
    if (!created) throw new Error('Failed to create product');
    return created;
  }

  async update(id: string, updates: ProductUpdate): Promise<Product> {
    const now = new Date().toISOString();
    
    const validFields: (keyof ProductUpdate)[] = [
      'name', 'description', 'price', 'compareAtPrice', 'cost', 'category', 'productType', 'vendor', 'tags', 'collections', 'handle', 'seoTitle', 'seoDescription', 'salesChannels', 'stock', 'trackQuantity', 'continueSellingWhenOutOfStock', 'reorderPoint', 'reorderQuantity', 'physicalItem', 'weightGrams', 'sku', 'manufacturer', 'supplier', 'manufacturerSku', 'barcode', 'imageUrl', 'set', 'rarity', 'status', 'isDigital', 'digitalAssets'
    ];

    const finalUpdates: Partial<ProductTable> = { updatedAt: now };
    for (const field of validFields) {
      if (updates[field] !== undefined) {
        const value = updates[field];
        const finalValue = Array.isArray(value)
          ? JSON.stringify(value)
          : typeof value === 'boolean'
            ? nullableBoolean(value)
            : typeof value === 'string'
              ? nullableText(value)
              : value;
        Object.assign(finalUpdates, { [field]: finalValue ?? null });
      }
    }

    try {
      await this.db.transaction().execute(async (trx) => {
        if (Object.keys(finalUpdates).length > 1) { // more than just updatedAt
          await trx
            .updateTable('products')
            .set(finalUpdates)
            .where('id', '=', id)
            .execute();
        }

        if (updates.media !== undefined) {
          await trx.deleteFrom('product_media').where('productId', '=', id).execute();
          if (updates.media && updates.media.length > 0) {
            for (const m of updates.media) {
              await trx.insertInto('product_media').values({
                id: m.id || crypto.randomUUID(),
                productId: id,
                url: m.url,
                altText: m.altText || null,
                position: m.position,
                width: m.width || null,
                height: m.height || null,
                size: m.size || null,
                createdAt: m.createdAt ? m.createdAt.toISOString() : now
              }).execute();
            }
          }
        }
      });
    } catch (error) {
      if (isUniqueSkuConstraintError(error)) {
        throw new InvalidProductError('SKU must be unique');
      }
      throw error;
    }

    this.invalidateIndex(); 

    const updated = await this.getById(id);
    if (!updated) throw new ProductNotFoundError(id);
    return updated;
  }


  async delete(id: string): Promise<void> {
    await this.db.deleteFrom('products').where('id', '=', id).execute();
    this.invalidateIndex();
  }

  async updateStock(id: string, delta: number): Promise<void> {
    await this.db.transaction().execute(async (trx) => {
      const product = await trx
        .selectFrom('products')
        .select('stock')
        .where('id', '=', id)
        .executeTakeFirst();

      if (!product) throw new ProductNotFoundError(id);

      const nextStock = product.stock + delta;
      if (nextStock < 0) throw new InsufficientStockError(id, Math.abs(delta), product.stock);

      const result = await trx
        .updateTable('products')
        .set({ stock: nextStock, updatedAt: new Date().toISOString() })
        .where('id', '=', id)
        .where('stock', '=', product.stock)
        .execute();

      if (Number(result[0]?.numUpdatedRows ?? 0) !== 1) {
        throw new InsufficientStockError(id, Math.abs(delta), product.stock);
      }
    });
    this.invalidateIndex();
  }

  /**
   * BroccoliQ Level 6: Builder's Punch
   * Merges multiple consecutive stock updates into a single atomic transaction 
   * to bypass sequential IO latency.
   */
  async batchUpdateStock(updates: { id: string, delta: number }[]): Promise<void> {
    const coalescedUpdates = coalesceStockUpdates(updates);
    if (coalescedUpdates.length === 0) return;

    await this.db.transaction().execute(async (trx) => {
      // We lock rows or simply read current state and write
      for (const update of coalescedUpdates) {
        const product = await trx
          .selectFrom('products')
          .select('stock')
          .where('id', '=', update.id)
          .executeTakeFirst();

        if (!product) throw new ProductNotFoundError(update.id);

        const nextStock = product.stock + update.delta;
        if (nextStock < 0) throw new InsufficientStockError(update.id, Math.abs(update.delta), product.stock);

        const result = await trx
          .updateTable('products')
          .set({ stock: nextStock, updatedAt: new Date().toISOString() })
          .where('id', '=', update.id)
          .where('stock', '=', product.stock)
          .execute();

        if (Number(result[0]?.numUpdatedRows ?? 0) !== 1) {
          throw new InsufficientStockError(update.id, Math.abs(update.delta), product.stock);
        }
      }
    });

    this.invalidateIndex(); // Ensure RAM stays synchronous with physical state
  }

  async getStats(): Promise<{
    totalProducts: number;
    totalUnits: number;
    inventoryValue: number;
    healthCounts: {
      out_of_stock: number;
      low_stock: number;
      healthy: number;
    };
  }> {
    const stats = await this.db
      .selectFrom('products')
      .select([
        (eb) => eb.fn.count<number>('id').as('totalProducts'),
        (eb) => eb.fn.sum<number>('stock').as('totalUnits'),
        (eb) => eb.fn.sum<number>(sql<number>`${eb.ref('stock')} * ${eb.ref('price')}`).as('inventoryValue'),
      ])
      .executeTakeFirst();

    const healthCounts = {
      out_of_stock: 0,
      low_stock: 0,
      healthy: 0,
    };

    // Low stock is < 10, Out of stock is 0
    const healthResults = await this.db
      .selectFrom('products')
      .select([
        'stock',
        (eb) => eb.fn.count<number>('id').as('count')
      ])
      .groupBy('stock')
      .execute();

    for (const row of healthResults) {
      if (row.stock <= 0) healthCounts.out_of_stock += Number(row.count);
      else if (row.stock < 10) healthCounts.low_stock += Number(row.count);
      else healthCounts.healthy += Number(row.count);
    }

    return {
      totalProducts: Number(stats?.totalProducts ?? 0),
      totalUnits: Number(stats?.totalUnits ?? 0),
      inventoryValue: Number(stats?.inventoryValue ?? 0),
      healthCounts,
    };
  }

  async getLowStockProducts(limit: number): Promise<Product[]> {
    // We consider low stock as anything less than 10
    const results = await this.db
      .selectFrom('products')
      .selectAll()
      .where('stock', '<', 10)
      .where('status', '=', 'active')
      .orderBy('stock', 'asc')
      .limit(limit)
      .execute();

    return results.map(row => this.mapTableToProduct(row));
  }
}
