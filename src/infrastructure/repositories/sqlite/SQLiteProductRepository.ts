/**
 * [LAYER: INFRASTRUCTURE]
 * SQLite Implementation of Product Repository using Kysely
 */
import { Kysely, sql } from 'kysely';
import { getSQLiteDB } from '../../sqlite/database';
import type { Database, ProductTable, ProductVariantTable, ProductOptionTable, ProductMediaTable } from '../../sqlite/schema';
import type { IProductRepository } from '@domain/repositories';
import type { Product, ProductDraft, ProductUpdate, ProductVariant, ProductOption, ProductMedia, ProductStatus } from '@domain/models';
import { ProductNotFoundError, InsufficientStockError } from '@domain/errors';
import { coalesceStockUpdates } from '@domain/rules';

export class SQLiteProductRepository implements IProductRepository {
  private db: Kysely<Database>;
  private indexInvalidated = false;

  constructor() {
    this.db = getSQLiteDB();
  }

  private mapTableToProduct(row: ProductTable, variants: ProductVariant[] = [], options: ProductOption[] = [], media: ProductMedia[] = []): Product {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      price: row.price,
      compareAtPrice: row.compareAtPrice ?? undefined,
      cost: row.cost ?? undefined,
      category: row.category,
      productType: row.productType ?? undefined,
      vendor: row.vendor ?? undefined,
      tags: row.tags ? JSON.parse(row.tags) : [],
      collections: row.collections ? JSON.parse(row.collections) : [],
      handle: row.handle ?? undefined,
      seoTitle: row.seoTitle ?? undefined,
      seoDescription: row.seoDescription ?? undefined,
      salesChannels: row.salesChannels ? JSON.parse(row.salesChannels) : [],
      stock: row.stock,
      trackQuantity: !!row.trackQuantity,
      continueSellingWhenOutOfStock: !!row.continueSellingWhenOutOfStock,
      reorderPoint: row.reorderPoint ?? undefined,
      reorderQuantity: row.reorderQuantity ?? undefined,
      physicalItem: !!row.physicalItem,
      weightGrams: row.weightGrams ?? undefined,
      sku: row.sku ?? undefined,
      manufacturer: row.manufacturer ?? undefined,
      supplier: row.supplier ?? undefined,
      manufacturerSku: row.manufacturerSku ?? undefined,
      barcode: row.barcode ?? undefined,
      imageUrl: row.imageUrl,
      status: row.status as ProductStatus,
      set: row.set ?? undefined,
      rarity: row.rarity ?? undefined,
      isDigital: !!row.isDigital,
      digitalAssets: row.digitalAssets ? JSON.parse(row.digitalAssets) : undefined,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
      hasVariants: !!row.hasVariants,
      variants: variants.length > 0 ? variants : undefined,
      options: options.length > 0 ? options : undefined,
      media: media
    };
  }

  private mapTableToVariant(row: ProductVariantTable): ProductVariant {
    return {
      id: row.id,
      productId: row.productId,
      title: row.title,
      price: row.price,
      compareAtPrice: row.compareAtPrice ?? undefined,
      cost: row.cost ?? undefined,
      sku: row.sku ?? undefined,
      barcode: row.barcode ?? undefined,
      stock: row.stock,
      option1: row.option1 ?? undefined,
      option2: row.option2 ?? undefined,
      option3: row.option3 ?? undefined,
      imageUrl: row.imageUrl ?? undefined,
      weightGrams: row.weightGrams ?? undefined,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt)
    };
  }

  private mapTableToOption(row: ProductOptionTable): ProductOption {
    return {
      id: row.id,
      productId: row.productId,
      name: row.name,
      values: JSON.parse(row.values),
      position: row.position
    };
  }

  private mapTableToMedia(row: ProductMediaTable): ProductMedia {
    return {
      id: row.id,
      url: row.url,
      altText: row.altText ?? undefined,
      position: row.position,
      width: row.width ?? undefined,
      height: row.height ?? undefined,
      size: row.size ?? undefined,
      createdAt: new Date(row.createdAt)
    };
  }

  async getAll(options: {
    category?: string;
    query?: string;
    limit?: number;
    cursor?: string;
  }): Promise<{ products: Product[]; nextCursor?: string }> {
    let query = this.db.selectFrom('products').selectAll();

    if (options.category) {
      query = query.where('category', '=', options.category);
    }

    if (options.query) {
      const searchTerm = `%${options.query}%`;
      query = query.where((eb) =>
        eb.or([
          eb('name', 'like', searchTerm),
          eb('description', 'like', searchTerm),
          eb('sku', 'like', searchTerm)
        ])
      );
    }

    const limit = options.limit ?? 20;
    const results = await query
      .orderBy('createdAt', 'desc')
      .limit(limit + 1)
      .execute();

    const hasNextPage = results.length > limit;
    const products = results.slice(0, limit);
    const nextCursor = hasNextPage ? products[products.length - 1].id : undefined;

    const enrichedProducts = await Promise.all(products.map(async (p) => {
      // For list view, we usually don't need full variant/option data unless specifically asked,
      // but to stay consistent with the interface, let's load minimal data if hasVariants is true.
      if (p.hasVariants) {
        const variants = await this.db.selectFrom('product_variants').selectAll().where('productId', '=', p.id).execute();
        const opts = await this.db.selectFrom('product_options').selectAll().where('productId', '=', p.id).execute();
        const media = await this.db.selectFrom('product_media').selectAll().where('productId', '=', p.id).execute();
        return this.mapTableToProduct(p, variants.map(v => this.mapTableToVariant(v)), opts.map(o => this.mapTableToOption(o)), media.map(m => this.mapTableToMedia(m)));
      }
      const media = await this.db.selectFrom('product_media').selectAll().where('productId', '=', p.id).execute();
      return this.mapTableToProduct(p, [], [], media.map(m => this.mapTableToMedia(m)));
    }));

    return { products: enrichedProducts, nextCursor };
  }

  async getById(id: string): Promise<Product | null> {
    const row = await this.db.selectFrom('products').selectAll().where('id', '=', id).executeTakeFirst();
    if (!row) return null;

    const [variants, options, media] = await Promise.all([
      this.db.selectFrom('product_variants').selectAll().where('productId', '=', id).execute(),
      this.db.selectFrom('product_options').selectAll().where('productId', '=', id).execute(),
      this.db.selectFrom('product_media').selectAll().where('productId', '=', id).execute()
    ]);

    return this.mapTableToProduct(
      row,
      variants.map(v => this.mapTableToVariant(v)),
      options.map(o => this.mapTableToOption(o)),
      media.map(m => this.mapTableToMedia(m))
    );
  }

  async getByHandle(handle: string): Promise<Product | null> {
    const row = await this.db.selectFrom('products').selectAll().where('handle', '=', handle).executeTakeFirst();
    if (!row) return null;

    const [variants, options, media] = await Promise.all([
      this.db.selectFrom('product_variants').selectAll().where('productId', '=', row.id).execute(),
      this.db.selectFrom('product_options').selectAll().where('productId', '=', row.id).execute(),
      this.db.selectFrom('product_media').selectAll().where('productId', '=', row.id).execute()
    ]);

    return this.mapTableToProduct(
      row,
      variants.map(v => this.mapTableToVariant(v)),
      options.map(o => this.mapTableToOption(o)),
      media.map(m => this.mapTableToMedia(m))
    );
  }

  async create(product: ProductDraft): Promise<Product> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    await this.db.transaction().execute(async (trx) => {
      await trx.insertInto('products').values({
        id,
        name: product.name,
        description: product.description,
        price: product.price,
        compareAtPrice: product.compareAtPrice ?? null,
        cost: product.cost ?? null,
        category: product.category,
        productType: product.productType ?? null,
        vendor: product.vendor ?? null,
        tags: product.tags ? JSON.stringify(product.tags) : null,
        collections: product.collections ? JSON.stringify(product.collections) : null,
        handle: product.handle || product.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        seoTitle: product.seoTitle ?? null,
        seoDescription: product.seoDescription ?? null,
        salesChannels: product.salesChannels ? JSON.stringify(product.salesChannels) : null,
        stock: product.stock,
        trackQuantity: product.trackQuantity ? 1 : 0,
        continueSellingWhenOutOfStock: product.continueSellingWhenOutOfStock ? 1 : 0,
        reorderPoint: product.reorderPoint ?? null,
        reorderQuantity: product.reorderQuantity ?? null,
        physicalItem: product.physicalItem ? 1 : 0,
        weightGrams: product.weightGrams ?? null,
        sku: product.sku ?? null,
        manufacturer: product.manufacturer ?? null,
        supplier: product.supplier ?? null,
        manufacturerSku: product.manufacturerSku ?? null,
        barcode: product.barcode ?? null,
        imageUrl: product.imageUrl,
        status: product.status,
        set: product.set ?? null,
        rarity: product.rarity ?? null,
        isDigital: product.isDigital ? 1 : 0,
        digitalAssets: product.digitalAssets ? JSON.stringify(product.digitalAssets) : null,
        createdAt: now,
        updatedAt: now,
        hasVariants: product.hasVariants ? 1 : 0
      }).execute();

      // Options
      if (product.options && product.options.length > 0) {
        for (const o of product.options) {
          await trx.insertInto('product_options').values({
            id: o.id || crypto.randomUUID(),
            productId: id,
            name: o.name,
            values: JSON.stringify(o.values),
            position: o.position
          }).execute();
        }
      }

      // Variants
      if (product.variants && product.variants.length > 0) {
        for (const v of product.variants) {
          await trx.insertInto('product_variants').values({
            id: v.id || crypto.randomUUID(),
            productId: id,
            title: v.title,
            price: v.price,
            compareAtPrice: v.compareAtPrice ?? null,
            cost: v.cost ?? null,
            sku: v.sku ?? null,
            barcode: v.barcode ?? null,
            stock: v.stock,
            option1: v.option1 ?? null,
            option2: v.option2 ?? null,
            option3: v.option3 ?? null,
            imageUrl: v.imageUrl ?? null,
            weightGrams: v.weightGrams ?? null,
            createdAt: now,
            updatedAt: now
          }).execute();
        }
      }

      // Media
      if (product.media && product.media.length > 0) {
        for (const m of product.media) {
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
    });

    this.invalidateIndex();
    return (await this.getById(id))!;
  }

  async update(id: string, updates: ProductUpdate): Promise<Product> {
    const now = new Date().toISOString();
    const finalUpdates: any = { updatedAt: now };

    const nullableText = (v?: string) => v === undefined ? undefined : (v || null);
    const nullableBoolean = (v?: boolean) => v === undefined ? undefined : (v ? 1 : 0);

    const fields = [
      'name', 'description', 'price', 'compareAtPrice', 'cost', 'category',
      'productType', 'vendor', 'tags', 'collections', 'handle', 'seoTitle',
      'seoDescription', 'salesChannels', 'stock', 'trackQuantity',
      'continueSellingWhenOutOfStock', 'reorderPoint', 'reorderQuantity',
      'physicalItem', 'weightGrams', 'sku', 'manufacturer', 'supplier',
      'manufacturerSku', 'barcode', 'imageUrl', 'status', 'set', 'rarity',
      'isDigital', 'digitalAssets', 'hasVariants'
    ];

    for (const field of fields) {
      if ((updates as any)[field] !== undefined) {
        const value = (updates as any)[field];
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

        if (updates.options !== undefined) {
          await trx.deleteFrom('product_options').where('productId', '=', id).execute();
          if (updates.options && updates.options.length > 0) {
            for (const o of updates.options) {
              await trx.insertInto('product_options').values({
                id: o.id || crypto.randomUUID(),
                productId: id,
                name: o.name,
                values: JSON.stringify(o.values),
                position: o.position
              }).execute();
            }
          }
        }

        if (updates.variants !== undefined) {
          await trx.deleteFrom('product_variants').where('productId', '=', id).execute();
          if (updates.variants && updates.variants.length > 0) {
            for (const v of updates.variants) {
              await trx.insertInto('product_variants').values({
                id: v.id || crypto.randomUUID(),
                productId: id,
                title: v.title,
                price: v.price,
                compareAtPrice: v.compareAtPrice ?? null,
                cost: v.cost ?? null,
                sku: v.sku ?? null,
                barcode: v.barcode ?? null,
                stock: v.stock,
                option1: v.option1 ?? null,
                option2: v.option2 ?? null,
                option3: v.option3 ?? null,
                imageUrl: v.imageUrl ?? null,
                weightGrams: v.weightGrams ?? null,
                createdAt: v.createdAt ? v.createdAt.toISOString() : now,
                updatedAt: now
              }).execute();
            }
          }
        }
      });
    } catch (err) {
      if (err instanceof Error && err.message.includes('UNIQUE constraint failed: products.handle')) {
        throw new Error(`A product with the handle "${updates.handle}" already exists.`);
      }
      throw err;
    }

    this.invalidateIndex();
    return (await this.getById(id))!;
  }

  async delete(id: string): Promise<void> {
    await this.db.transaction().execute(async (trx) => {
      // Delete child records first
      await trx.deleteFrom('product_variants').where('productId', '=', id).execute();
      await trx.deleteFrom('product_options').where('productId', '=', id).execute();
      await trx.deleteFrom('product_media').where('productId', '=', id).execute();
      
      // Delete parent
      const result = await trx.deleteFrom('products').where('id', '=', id).execute();
      if (Number(result[0].numDeletedRows) === 0) {
        throw new ProductNotFoundError(id);
      }
    });
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

      await trx
        .updateTable('products')
        .set({ stock: nextStock, updatedAt: new Date().toISOString() })
        .where('id', '=', id)
        .execute();
    });
    this.invalidateIndex();
  }

  async batchUpdateStock(updates: { id: string, variantId?: string, delta: number }[]): Promise<void> {
    const coalescedUpdates = coalesceStockUpdates(updates);
    if (coalescedUpdates.length === 0) return;

    await this.db.transaction().execute(async (trx) => {
      for (const update of coalescedUpdates) {
        if (update.variantId) {
          await this.updateVariantStockInTransaction(trx, update.variantId, update.delta);
        } else {
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
      }
    });
    this.invalidateIndex();
  }

  private async updateVariantStockInTransaction(trx: any, variantId: string, delta: number): Promise<void> {
    const variant = await trx
      .selectFrom('product_variants')
      .select(['productId', 'stock'])
      .where('id', '=', variantId)
      .executeTakeFirst();

    if (!variant) throw new Error(`Variant not found: ${variantId}`);

    const nextVariantStock = variant.stock + delta;
    if (nextVariantStock < 0) throw new Error(`Insufficient stock for variant: ${variantId}`);

    // Update variant stock
    await trx
      .updateTable('product_variants')
      .set({ stock: nextVariantStock, updatedAt: new Date().toISOString() })
      .where('id', '=', variantId)
      .execute();

    // Sync parent product stock (sum of all variants)
    const allVariants = await trx
      .selectFrom('product_variants')
      .select('stock')
      .where('productId', '=', variant.productId)
      .execute();
    
    const totalStock = allVariants.reduce((sum: number, v: any) => sum + (v.stock || 0), 0);

    await trx
      .updateTable('products')
      .set({ stock: totalStock, updatedAt: new Date().toISOString() })
      .where('id', '=', variant.productId)
      .execute();
  }

  async updateVariantStock(variantId: string, delta: number): Promise<void> {
    await this.db.transaction().execute(async (trx) => {
      await this.updateVariantStockInTransaction(trx, variantId, delta);
    });
    this.invalidateIndex();
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

  private invalidateIndex() {
    this.indexInvalidated = true;
  }
}
