import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Kysely, SqliteDialect } from 'kysely';
import SQLite from 'better-sqlite3';
import { SQLiteProductRepository } from './SQLiteProductRepository';
import { initDatabase, getSQLiteDB } from '../../sqlite/database';
import type { Database } from '../../sqlite/schema';
import type { ProductDraft } from '@domain/models';

describe('SQLiteProductRepository', () => {
  let db: Kysely<Database>;
  let repo: SQLiteProductRepository;

  beforeEach(async () => {
    // Force in-memory database for testing
    process.env.SQLITE_DATABASE_PATH = ':memory:';
    
    // We need to clear the cached dbInstance in database.ts if it exists
    // Since we can't easily clear the module state without complex hacks,
    // we'll assume for these tests we can just use getSQLiteDB()
    // and it will create a new one since it's the first time or we've set the env var.
    // NOTE: In a real project, you'd want a more robust way to reset the DB instance.
    
    db = getSQLiteDB();
    await initDatabase();
    repo = new SQLiteProductRepository();
  });

  it('should create and retrieve a product', async () => {
    const draft: ProductDraft = {
      name: 'Test Product',
      description: 'Test Description',
      price: 1000,
      stock: 5,
      category: 'Test Category',
      imageUrl: 'http://test.com/image.png',
      status: 'active',
      media: []
    };

    const created = await repo.create(draft);
    expect(created.id).toBeDefined();
    expect(created.name).toBe('Test Product');

    const retrieved = await repo.getById(created.id);
    expect(retrieved).not.toBeNull();
    expect(retrieved?.id).toBe(created.id);
  });

  it('should update stock atomicly', async () => {
    const draft: ProductDraft = {
      name: 'Stock Product',
      description: 'Desc',
      price: 100,
      stock: 10,
      category: 'Cat',
      imageUrl: 'img',
      status: 'active',
      media: []
    };

    const product = await repo.create(draft);
    
    await repo.updateStock(product.id, -3);
    const updated = await repo.getById(product.id);
    expect(updated?.stock).toBe(7);
  });

  it('should throw InsufficientStockError if stock would go negative', async () => {
    const product = await repo.create({
      name: 'Limit Product',
      description: 'Desc',
      price: 100,
      stock: 5,
      category: 'Cat',
      imageUrl: 'img',
      status: 'active',
      media: []
    });

    await expect(repo.updateStock(product.id, -10)).rejects.toThrow(/Insufficient stock/i);
  });
});
