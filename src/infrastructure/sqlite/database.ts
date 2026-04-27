/**
 * [LAYER: INFRASTRUCTURE]
 * Kysely SQLite database initialization
 */
import { Kysely, SqliteDialect } from 'kysely';
import SQLite from 'better-sqlite3';
import type { Database } from './schema';

let dbInstance: Kysely<Database> | null = null;

export function getSQLiteDB(): Kysely<Database> {
  if (dbInstance) return dbInstance;

  const sqlite = new SQLite(process.env.SQLITE_DATABASE_PATH ?? 'playmore.db');

  // Enable WAL mode for performance
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('synchronous = NORMAL');
  sqlite.pragma('foreign_keys = ON');

  const dialect = new SqliteDialect({
    database: sqlite,
  });

  dbInstance = new Kysely<Database>({
    dialect,
  });

  return dbInstance;
}

/**
 * Initialize tables if they don't exist
 */
export async function initDatabase() {
  const db = getSQLiteDB();

  await db.schema
    .createTable('products')
    .ifNotExists()
    .addColumn('id', 'text', (col) => col.primaryKey())
    .addColumn('name', 'text', (col) => col.notNull())
    .addColumn('description', 'text', (col) => col.notNull())
    .addColumn('price', 'integer', (col) => col.notNull())
    .addColumn('category', 'text', (col) => col.notNull())
    .addColumn('stock', 'integer', (col) => col.notNull())
    .addColumn('imageUrl', 'text', (col) => col.notNull())
    .addColumn('set', 'text')
    .addColumn('rarity', 'text')
    .addColumn('status', 'text', (col) => col.notNull().defaultTo('active'))
    .addColumn('createdAt', 'text', (col) => col.notNull())
    .addColumn('updatedAt', 'text', (col) => col.notNull())
    .execute();

  // Migration for existing tables: add 'status' if missing
  try {
    await db.schema.alterTable('products').addColumn('status', 'text', (col) => col.notNull().defaultTo('active')).execute();
  } catch {
    // Column likely already exists
  }

  await db.schema
    .createTable('users')
    .ifNotExists()
    .addColumn('id', 'text', (col) => col.primaryKey())
    .addColumn('email', 'text', (col) => col.notNull().unique())
    .addColumn('passwordHash', 'text', (col) => col.notNull())
    .addColumn('displayName', 'text', (col) => col.notNull())
    .addColumn('role', 'text', (col) => col.notNull())
    .addColumn('createdAt', 'text', (col) => col.notNull())
    .execute();

  await db.schema
    .createTable('carts')
    .ifNotExists()
    .addColumn('id', 'text', (col) => col.primaryKey())
    .addColumn('userId', 'text', (col) => col.notNull().unique())
    .addColumn('items', 'text', (col) => col.notNull())
    .addColumn('updatedAt', 'text', (col) => col.notNull())
    .execute();

  await db.schema
    .createTable('orders')
    .ifNotExists()
    .addColumn('id', 'text', (col) => col.primaryKey())
    .addColumn('userId', 'text', (col) => col.notNull())
    .addColumn('items', 'text', (col) => col.notNull())
    .addColumn('total', 'integer', (col) => col.notNull())
    .addColumn('status', 'text', (col) => col.notNull())
    .addColumn('shippingAddress', 'text', (col) => col.notNull())
    .addColumn('paymentTransactionId', 'text')
    .addColumn('riskScore', 'integer', (col) => col.notNull().defaultTo(0))
    .addColumn('createdAt', 'text', (col) => col.notNull())
    .addColumn('updatedAt', 'text', (col) => col.notNull())
    .execute();

  // Migration for riskScore if it doesn't exist
  try {
    await db.schema.alterTable('orders').addColumn('riskScore', 'integer', (col) => col.notNull().defaultTo(0)).execute();
  } catch (err) {
    // Ignore error if column already exists
  }

  // BroccoliQ Level 5: Sovereign Locking Table
  await db.schema
    .createTable('hive_claims')
    .ifNotExists()
    .addColumn('id', 'text', (col) => col.primaryKey()) // The locked resource
    .addColumn('owner', 'text', (col) => col.notNull())
    .addColumn('expiresAt', 'text', (col) => col.notNull())
    .addColumn('createdAt', 'text', (col) => col.notNull())
    .execute();

  // BroccoliQ Level 9: Autonomous Integrity Audit Log
  await db.schema
    .createTable('hive_audit')
    .ifNotExists()
    .addColumn('id', 'text', (col) => col.primaryKey())
    .addColumn('userId', 'text', (col) => col.notNull())
    .addColumn('userEmail', 'text', (col) => col.notNull())
    .addColumn('action', 'text', (col) => col.notNull())
    .addColumn('targetId', 'text', (col) => col.notNull())
    .addColumn('details', 'text', (col) => col.notNull())
    .addColumn('createdAt', 'text', (col) => col.notNull())
    .execute();

  // Migration for hive_audit if it was created with the old schema
  try {
    await db.schema.alterTable('hive_audit').addColumn('userId', 'text', (col) => col.notNull().defaultTo('system')).execute();
    await db.schema.alterTable('hive_audit').addColumn('userEmail', 'text', (col) => col.notNull().defaultTo('system@playmore.tcg')).execute();
    await db.schema.alterTable('hive_audit').addColumn('targetId', 'text', (col) => col.notNull().defaultTo('unknown')).execute();
    await db.schema.alterTable('hive_audit').renameColumn('timestamp', 'createdAt').execute();
  } catch (err) {
    // Columns might already exist
  }

  await db.schema
    .createTable('discounts')
    .ifNotExists()
    .addColumn('id', 'text', (col) => col.primaryKey())
    .addColumn('code', 'text', (col) => col.notNull().unique())
    .addColumn('type', 'text', (col) => col.notNull())
    .addColumn('value', 'integer', (col) => col.notNull())
    .addColumn('status', 'text', (col) => col.notNull())
    .addColumn('startsAt', 'text', (col) => col.notNull())
    .addColumn('endsAt', 'text')
    .addColumn('usageCount', 'integer', (col) => col.notNull().defaultTo(0))
    .addColumn('createdAt', 'text', (col) => col.notNull())
    .execute();

  await db.schema
    .createTable('settings')
    .ifNotExists()
    .addColumn('key', 'text', (col) => col.primaryKey())
    .addColumn('value', 'text', (col) => col.notNull())
    .addColumn('updatedAt', 'text', (col) => col.notNull())
    .execute();

  await db.schema
    .createTable('transfers')
    .ifNotExists()
    .addColumn('id', 'text', (col) => col.primaryKey())
    .addColumn('source', 'text', (col) => col.notNull())
    .addColumn('status', 'text', (col) => col.notNull())
    .addColumn('itemsCount', 'integer', (col) => col.notNull())
    .addColumn('receivedCount', 'integer', (col) => col.notNull())
    .addColumn('expectedAt', 'text', (col) => col.notNull())
    .addColumn('createdAt', 'text', (col) => col.notNull())
    .execute();

  // BroccoliQ Level 11: High-Velocity Performance Indices
  await db.schema
    .createIndex('idx_products_category')
    .on('products')
    .column('category')
    .ifNotExists()
    .execute();

  await db.schema
    .createIndex('idx_products_status')
    .on('products')
    .column('status')
    .ifNotExists()
    .execute();

  await db.schema
    .createIndex('idx_orders_userId')
    .on('orders')
    .column('userId')
    .ifNotExists()
    .execute();

  await db.schema
    .createIndex('idx_orders_status')
    .on('orders')
    .column('status')
    .ifNotExists()
    .execute();

  await db.schema
    .createIndex('idx_orders_createdAt')
    .on('orders')
    .column('createdAt')
    .ifNotExists()
    .execute();
}
