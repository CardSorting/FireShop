/**
 * [LAYER: INFRASTRUCTURE]
 * SQLite Implementation of Product Repository using Kysely
 */
import { Kysely } from 'kysely';
import { getSQLiteDB } from '../../sqlite/database';
import type { Database, ProductTable } from '../../sqlite/schema';
import type { IProductRepository } from '@domain/repositories';
import type { Product, ProductCategory, ProductStatus, CardRarity, ProductDraft, ProductUpdate } from '@domain/models';
import { DomainError, InsufficientStockError, ProductNotFoundError } from '@domain/errors';
import { coalesceStockUpdates } from '@domain/rules';
import { logger } from '@utils/logger';

function parseProductCategory(value: string): ProductCategory {
  if (value === 'booster' || value === 'single' || value === 'deck' || value === 'accessory' || value === 'box') {
    return value;
  }
  throw new DomainError('Stored product category is invalid.');
}

function parseCardRarity(value: string | null): CardRarity | undefined {
  if (value === null || value === '') return undefined;
  if (value === 'common' || value === 'uncommon' || value === 'rare' || value === 'holo' || value === 'secret') {
    return value;
  }
  throw new DomainError('Stored product rarity is invalid.');
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

  private mapTableToProduct(row: any): Product {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      price: row.price,
      category: parseProductCategory(row.category),
      stock: row.stock,
      imageUrl: row.imageUrl,
      status: parseProductStatus(row.status),
      set: row.set || undefined,
      rarity: parseCardRarity(row.rarity),
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
    this.authIndex = new Map();
    for (const row of results) {
      this.authIndex.set(row.id, this.mapTableToProduct(row));
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
        p.description.toLowerCase().includes(q)
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
      return result ? this.mapTableToProduct(result) : null;
    }
    
    return this.authIndex.get(id) || null;
  }

  async create(product: ProductDraft): Promise<Product> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    await this.db
      .insertInto('products')
      .values({
        id,
        name: product.name,
        description: product.description,
        price: product.price,
        category: product.category,
        stock: product.stock,
        imageUrl: product.imageUrl,
        status: product.status || 'active',
        set: product.set || null,
        rarity: product.rarity || null,
        createdAt: now,
        updatedAt: now,
      })
      .execute();

    this.invalidateIndex(); // Level 7: Flush the buffer so it reconstructs

    const created = await this.getById(id);
    if (!created) throw new Error('Failed to create product');
    return created;
  }

  async update(id: string, updates: ProductUpdate): Promise<Product> {
    const now = new Date().toISOString();
    
    // Whitelist updates to prevent SQL injection or accidental schema corruption
    const validFields: (keyof ProductUpdate)[] = [
      'name', 'description', 'price', 'category', 'stock', 'imageUrl', 'set', 'rarity', 'status'
    ];

    const finalUpdates: Partial<ProductTable> = { updatedAt: now };
    for (const field of validFields) {
      if (updates[field] !== undefined) {
        Object.assign(finalUpdates, { [field]: updates[field] ?? null });
      }
    }

    await this.db
      .updateTable('products')
      .set(finalUpdates)
      .where('id', '=', id)
      .execute();

    this.invalidateIndex(); // Level 7: Buffer flush

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
}
