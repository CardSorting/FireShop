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
    .addColumn('createdAt', 'text', (col) => col.notNull())
    .addColumn('updatedAt', 'text', (col) => col.notNull())
    .execute();

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
    .addColumn('createdAt', 'text', (col) => col.notNull())
    .addColumn('updatedAt', 'text', (col) => col.notNull())
    .execute();

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
    .addColumn('action', 'text', (col) => col.notNull())
    .addColumn('details', 'text', (col) => col.notNull())
    .addColumn('timestamp', 'text', (col) => col.notNull())
    .execute();
}
