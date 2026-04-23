/**
 * [LAYER: INFRASTRUCTURE]
 * SQLite Implementation of Product Repository using Kysely
 */
import { Kysely } from 'kysely';
import { getSQLiteDB } from '../../sqlite/database';
import type { Database } from '../../sqlite/schema';
import type { IProductRepository } from '@domain/repositories';
import type { Product, ProductCategory, CardRarity } from '@domain/models';
import { ProductNotFoundError } from '@domain/errors';

export class SQLiteProductRepository implements IProductRepository {
  private db: Kysely<Database>;

  constructor() {
    this.db = getSQLiteDB();
  }

  private mapTableToProduct(row: any): Product {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      price: row.price,
      category: row.category as ProductCategory,
      stock: row.stock,
      imageUrl: row.imageUrl,
      set: row.set || undefined,
      rarity: (row.rarity as CardRarity) || undefined,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    };
  }

  async getAll(options?: {
    category?: string;
    limit?: number;
    cursor?: string;
  }): Promise<{ products: Product[]; nextCursor?: string }> {
    let query = this.db.selectFrom('products').selectAll();

    if (options?.category) {
      query = query.where('category', '=', options.category);
    }

    if (options?.cursor) {
      // In a production app, cursor-based pagination on non-unique fields (like createdAt)
      // should use a tuple comparison or deterministic sort order.
      // For now, we stick to ID-based pagination for simplicity.
      query = query.where('id', '>', options.cursor);
    }

    const limitCount = options?.limit ?? 20;
    const results = await query
      .orderBy('createdAt', 'desc')
      .orderBy('id', 'asc') // Secondary sort for deterministic pagination
      .limit(limitCount)
      .execute();

    const products = results.map(this.mapTableToProduct);
    const nextCursor = products.length === limitCount ? products[products.length - 1].id : undefined;

    return { products, nextCursor };
  }

  async getById(id: string): Promise<Product | null> {
    const result = await this.db
      .selectFrom('products')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();

    return result ? this.mapTableToProduct(result) : null;
  }

  async create(
    product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Product> {
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
        set: product.set || null,
        rarity: product.rarity || null,
        createdAt: now,
        updatedAt: now,
      })
      .execute();

    const created = await this.getById(id);
    if (!created) throw new Error('Failed to create product');
    return created;
  }

  async update(id: string, updates: Partial<Product>): Promise<Product> {
    const now = new Date().toISOString();
    
    // Whitelist updates to prevent SQL injection or accidental schema corruption
    const validFields: (keyof typeof updates)[] = [
      'name', 'description', 'price', 'category', 'stock', 'imageUrl', 'set', 'rarity'
    ];

    const finalUpdates: any = { updatedAt: now };
    for (const field of validFields) {
      if (updates[field] !== undefined) {
        finalUpdates[field] = updates[field] === undefined ? null : updates[field];
      }
    }

    await this.db
      .updateTable('products')
      .set(finalUpdates)
      .where('id', '=', id)
      .execute();

    const updated = await this.getById(id);
    if (!updated) throw new ProductNotFoundError(id);
    return updated;
  }


  async delete(id: string): Promise<void> {
    await this.db.deleteFrom('products').where('id', '=', id).execute();
  }

  async updateStock(id: string, delta: number): Promise<void> {
    await this.db.transaction().execute(async (trx) => {
      const product = await trx
        .selectFrom('products')
        .select('stock')
        .where('id', '=', id)
        .executeTakeFirst();

      if (!product) throw new ProductNotFoundError(id);

      await trx
        .updateTable('products')
        .set({ stock: product.stock + delta })
        .where('id', '=', id)
        .execute();
    });
  }
}
