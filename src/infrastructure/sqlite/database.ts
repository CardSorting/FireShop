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
    .addColumn('compareAtPrice', 'integer')
    .addColumn('cost', 'integer')
    .addColumn('category', 'text', (col) => col.notNull())
    .addColumn('productType', 'text')
    .addColumn('vendor', 'text')
    .addColumn('tags', 'text')
    .addColumn('collections', 'text')
    .addColumn('handle', 'text')
    .addColumn('seoTitle', 'text')
    .addColumn('seoDescription', 'text')
    .addColumn('salesChannels', 'text')
    .addColumn('stock', 'integer', (col) => col.notNull())
    .addColumn('trackQuantity', 'integer')
    .addColumn('continueSellingWhenOutOfStock', 'integer')
    .addColumn('reorderPoint', 'integer')
    .addColumn('reorderQuantity', 'integer')
    .addColumn('physicalItem', 'integer')
    .addColumn('weightGrams', 'integer')
    .addColumn('sku', 'text')
    .addColumn('manufacturer', 'text')
    .addColumn('supplier', 'text')
    .addColumn('manufacturerSku', 'text')
    .addColumn('barcode', 'text')
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

  // Product intake metadata migrations for existing catalogs.
  try { await db.schema.alterTable('products').addColumn('compareAtPrice', 'integer').execute(); } catch {}
  try { await db.schema.alterTable('products').addColumn('cost', 'integer').execute(); } catch {}
  try { await db.schema.alterTable('products').addColumn('productType', 'text').execute(); } catch {}
  try { await db.schema.alterTable('products').addColumn('vendor', 'text').execute(); } catch {}
  try { await db.schema.alterTable('products').addColumn('tags', 'text').execute(); } catch {}
  try { await db.schema.alterTable('products').addColumn('collections', 'text').execute(); } catch {}
  try { await db.schema.alterTable('products').addColumn('handle', 'text').execute(); } catch {}
  try { await db.schema.alterTable('products').addColumn('seoTitle', 'text').execute(); } catch {}
  try { await db.schema.alterTable('products').addColumn('seoDescription', 'text').execute(); } catch {}
  try { await db.schema.alterTable('products').addColumn('salesChannels', 'text').execute(); } catch {}
  try { await db.schema.alterTable('products').addColumn('trackQuantity', 'integer').execute(); } catch {}
  try { await db.schema.alterTable('products').addColumn('continueSellingWhenOutOfStock', 'integer').execute(); } catch {}
  try { await db.schema.alterTable('products').addColumn('reorderPoint', 'integer').execute(); } catch {}
  try { await db.schema.alterTable('products').addColumn('reorderQuantity', 'integer').execute(); } catch {}
  try { await db.schema.alterTable('products').addColumn('physicalItem', 'integer').execute(); } catch {}
  try { await db.schema.alterTable('products').addColumn('weightGrams', 'integer').execute(); } catch {}
  try { await db.schema.alterTable('products').addColumn('sku', 'text').execute(); } catch {}
  try { await db.schema.alterTable('products').addColumn('manufacturer', 'text').execute(); } catch {}
  try { await db.schema.alterTable('products').addColumn('supplier', 'text').execute(); } catch {}
  try { await db.schema.alterTable('products').addColumn('manufacturerSku', 'text').execute(); } catch {}
  try { await db.schema.alterTable('products').addColumn('barcode', 'text').execute(); } catch {}

  await db.schema
    .createTable('users')
    .ifNotExists()
    .addColumn('id', 'text', (col) => col.primaryKey())
    .addColumn('email', 'text', (col) => col.notNull().unique())
    .addColumn('passwordHash', 'text', (col) => col.notNull())
    .addColumn('displayName', 'text', (col) => col.notNull())
    .addColumn('role', 'text', (col) => col.notNull())
    .addColumn('notes', 'text')
    .addColumn('metadata', 'text')
    .addColumn('createdAt', 'text', (col) => col.notNull())
    .execute();

  // Migration for users: add notes and metadata
  try {
    await db.schema.alterTable('users').addColumn('notes', 'text').execute();
  } catch {}
  try {
    await db.schema.alterTable('users').addColumn('metadata', 'text').execute();
  } catch {}


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
    .addColumn('idempotencyKey', 'text')
    .addColumn('discountCode', 'text')
    .addColumn('discountAmount', 'integer')
    .addColumn('trackingNumber', 'text')
    .addColumn('shippingCarrier', 'text')
    .addColumn('notes', 'text', (col) => col.notNull().defaultTo('[]'))
    .addColumn('riskScore', 'integer', (col) => col.notNull().defaultTo(0))
    .addColumn('createdAt', 'text', (col) => col.notNull())
    .addColumn('updatedAt', 'text', (col) => col.notNull())
    .execute();

  // Migration for fulfillment columns
  try {
    await db.schema.alterTable('orders').addColumn('trackingNumber', 'text').execute();
  } catch {}
  try {
    await db.schema.alterTable('orders').addColumn('shippingCarrier', 'text').execute();
  } catch {}
  try {
    await db.schema.alterTable('orders').addColumn('notes', 'text', (col) => col.notNull().defaultTo('[]')).execute();
  } catch {}

  // Migration for riskScore if it doesn't exist
  try {
    await db.schema.alterTable('orders').addColumn('riskScore', 'integer', (col) => col.notNull().defaultTo(0)).execute();
  } catch (err) {}

  try { await db.schema.alterTable('orders').addColumn('idempotencyKey', 'text').execute(); } catch {}
  try { await db.schema.alterTable('orders').addColumn('discountCode', 'text').execute(); } catch {}
  try { await db.schema.alterTable('orders').addColumn('discountAmount', 'integer').execute(); } catch {}

  try {
    await db.schema
      .createIndex('idx_orders_idempotency')
      .on('orders')
      .column('idempotencyKey')
      .unique()
      .ifNotExists()
      .execute();
  } catch {}


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
    .addColumn('hash', 'text')
    .addColumn('previousHash', 'text')
    .addColumn('createdAt', 'text', (col) => col.notNull())
    .execute();

  // Migration for hive_audit: add hash and previousHash
  try {
    await db.schema.alterTable('hive_audit').addColumn('hash', 'text').execute();
  } catch {}
  try {
    await db.schema.alterTable('hive_audit').addColumn('previousHash', 'text').execute();
  } catch {}

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

  // ─────────────────────────────────────────────
  // Purchase Order & Receiving Tables
  // ─────────────────────────────────────────────

  await db.schema
    .createTable('purchase_orders')
    .ifNotExists()
    .addColumn('id', 'text', (col) => col.primaryKey())
    .addColumn('supplier', 'text', (col) => col.notNull())
    .addColumn('referenceNumber', 'text')
    .addColumn('shippingCarrier', 'text')
    .addColumn('trackingNumber', 'text')
    .addColumn('expectedAt', 'text')
    .addColumn('status', 'text', (col) => col.notNull().defaultTo('draft'))
    .addColumn('notes', 'text')
    .addColumn('totalCost', 'integer', (col) => col.notNull().defaultTo(0))
    .addColumn('createdAt', 'text', (col) => col.notNull())
    .addColumn('updatedAt', 'text', (col) => col.notNull())
    .execute();

  try { await db.schema.alterTable('purchase_orders').addColumn('shippingCarrier', 'text').execute(); } catch {}
  try { await db.schema.alterTable('purchase_orders').addColumn('trackingNumber', 'text').execute(); } catch {}
  try { await db.schema.alterTable('purchase_orders').addColumn('expectedAt', 'text').execute(); } catch {}

  await db.schema
    .createTable('purchase_order_items')
    .ifNotExists()
    .addColumn('id', 'text', (col) => col.primaryKey())
    .addColumn('purchaseOrderId', 'text', (col) => col.notNull())
    .addColumn('productId', 'text', (col) => col.notNull())
    .addColumn('sku', 'text', (col) => col.notNull())
    .addColumn('productName', 'text', (col) => col.notNull())
    .addColumn('orderedQty', 'integer', (col) => col.notNull())
    .addColumn('receivedQty', 'integer', (col) => col.notNull().defaultTo(0))
    .addColumn('unitCost', 'integer', (col) => col.notNull().defaultTo(0))
    .addColumn('totalCost', 'integer', (col) => col.notNull().defaultTo(0))
    .addColumn('notes', 'text')
    .execute();

  await db.schema
    .createTable('receiving_sessions')
    .ifNotExists()
    .addColumn('id', 'text', (col) => col.primaryKey())
    .addColumn('purchaseOrderId', 'text', (col) => col.notNull())
    .addColumn('status', 'text', (col) => col.notNull().defaultTo('in_progress'))
    .addColumn('notes', 'text')
    .addColumn('idempotencyKey', 'text')
    .addColumn('locationId', 'text')
    .addColumn('receivedAt', 'text', (col) => col.notNull())
    .addColumn('completedAt', 'text')
    .addColumn('receivedBy', 'text', (col) => col.notNull())
    .execute();

  try { await db.schema.alterTable('receiving_sessions').addColumn('idempotencyKey', 'text').execute(); } catch {}
  try { await db.schema.alterTable('receiving_sessions').addColumn('locationId', 'text').execute(); } catch {}

  await db.schema
    .createTable('receiving_items')
    .ifNotExists()
    .addColumn('id', 'text', (col) => col.primaryKey())
    .addColumn('receivingSessionId', 'text', (col) => col.notNull())
    .addColumn('purchaseOrderItemId', 'text', (col) => col.notNull())
    .addColumn('productId', 'text', (col) => col.notNull())
    .addColumn('sku', 'text', (col) => col.notNull())
    .addColumn('expectedQty', 'integer', (col) => col.notNull())
    .addColumn('receivedQty', 'integer', (col) => col.notNull())
    .addColumn('damagedQty', 'integer', (col) => col.notNull().defaultTo(0))
    .addColumn('unitCost', 'integer', (col) => col.notNull())
    .addColumn('condition', 'text', (col) => col.notNull().defaultTo('new'))
    .addColumn('discrepancyReason', 'text')
    .addColumn('disposition', 'text')
    .addColumn('notes', 'text')
    .execute();

  try { await db.schema.alterTable('receiving_items').addColumn('damagedQty', 'integer', (col) => col.notNull().defaultTo(0)).execute(); } catch {}
  try { await db.schema.alterTable('receiving_items').addColumn('discrepancyReason', 'text').execute(); } catch {}
  try { await db.schema.alterTable('receiving_items').addColumn('disposition', 'text').execute(); } catch {}

  // ─────────────────────────────────────────────
  // Inventory Location Tables
  // ─────────────────────────────────────────────

  await db.schema
    .createTable('inventory_locations')
    .ifNotExists()
    .addColumn('id', 'text', (col) => col.primaryKey())
    .addColumn('name', 'text', (col) => col.notNull())
    .addColumn('type', 'text', (col) => col.notNull().defaultTo('warehouse'))
    .addColumn('address', 'text')
    .addColumn('isDefault', 'integer', (col) => col.notNull().defaultTo(0))
    .addColumn('isActive', 'integer', (col) => col.notNull().defaultTo(1))
    .addColumn('createdAt', 'text', (col) => col.notNull())
    .execute();

  await db.schema
    .createTable('inventory_levels')
    .ifNotExists()
    .addColumn('productId', 'text', (col) => col.notNull())
    .addColumn('locationId', 'text', (col) => col.notNull())
    .addColumn('availableQty', 'integer', (col) => col.notNull().defaultTo(0))
    .addColumn('reservedQty', 'integer', (col) => col.notNull().defaultTo(0))
    .addColumn('incomingQty', 'integer', (col) => col.notNull().defaultTo(0))
    .addColumn('reorderPoint', 'integer', (col) => col.notNull().defaultTo(0))
    .addColumn('reorderQty', 'integer', (col) => col.notNull().defaultTo(0))
    .addColumn('updatedAt', 'text', (col) => col.notNull())
    .execute();

  await db.schema
    .createTable('suppliers')
    .ifNotExists()
    .addColumn('id', 'text', (col) => col.primaryKey())
    .addColumn('name', 'text', (col) => col.notNull())
    .addColumn('contactName', 'text')
    .addColumn('email', 'text')
    .addColumn('phone', 'text')
    .addColumn('website', 'text')
    .addColumn('address', 'text')
    .addColumn('notes', 'text')
    .addColumn('createdAt', 'text', (col) => col.notNull())
    .addColumn('updatedAt', 'text', (col) => col.notNull())
    .execute();

  await db.schema
    .createTable('collections')
    .ifNotExists()
    .addColumn('id', 'text', (col) => col.primaryKey())
    .addColumn('name', 'text', (col) => col.notNull())
    .addColumn('handle', 'text', (col) => col.notNull().unique())
    .addColumn('description', 'text')
    .addColumn('imageUrl', 'text')
    .addColumn('productCount', 'integer', (col) => col.notNull().defaultTo(0))
    .addColumn('status', 'text', (col) => col.notNull().defaultTo('active'))
    .addColumn('createdAt', 'text', (col) => col.notNull())
    .addColumn('updatedAt', 'text', (col) => col.notNull())
    .execute();

  await db.schema
    .createTable('product_categories')
    .ifNotExists()
    .addColumn('id', 'text', (col) => col.primaryKey())
    .addColumn('name', 'text', (col) => col.notNull())
    .addColumn('slug', 'text', (col) => col.notNull().unique())
    .addColumn('description', 'text')
    .addColumn('createdAt', 'text', (col) => col.notNull())
    .addColumn('updatedAt', 'text', (col) => col.notNull())
    .execute();


  await db.schema
    .createTable('product_types')
    .ifNotExists()
    .addColumn('id', 'text', (col) => col.primaryKey())
    .addColumn('name', 'text', (col) => col.notNull().unique())
    .addColumn('createdAt', 'text', (col) => col.notNull())
    .addColumn('updatedAt', 'text', (col) => col.notNull())
    .execute();

  await db.schema
    .createTable('product_media')
    .ifNotExists()
    .addColumn('id', 'text', (col) => col.primaryKey())
    .addColumn('productId', 'text', (col) => col.notNull())
    .addColumn('url', 'text', (col) => col.notNull())
    .addColumn('altText', 'text')
    .addColumn('position', 'integer', (col) => col.notNull().defaultTo(0))
    .addColumn('width', 'integer')
    .addColumn('height', 'integer')
    .addColumn('size', 'integer')
    .addColumn('createdAt', 'text', (col) => col.notNull())
    .execute();

  await db.schema
    .createIndex('idx_product_media_productId')
    .on('product_media')
    .column('productId')
    .ifNotExists()
    .execute();

  // ─────────────────────────────────────────────
  // Wishlist Tables
  // ─────────────────────────────────────────────

  await db.schema
    .createTable('wishlists')
    .ifNotExists()
    .addColumn('id', 'text', (col) => col.primaryKey())
    .addColumn('userId', 'text', (col) => col.notNull())
    .addColumn('name', 'text', (col) => col.notNull())
    .addColumn('isDefault', 'integer', (col) => col.notNull().defaultTo(0))
    .addColumn('createdAt', 'text', (col) => col.notNull())
    .addColumn('updatedAt', 'text', (col) => col.notNull())
    .execute();

  await db.schema
    .createTable('wishlist_items')
    .ifNotExists()
    .addColumn('id', 'text', (col) => col.primaryKey())
    .addColumn('wishlistId', 'text', (col) => col.notNull())
    .addColumn('productId', 'text', (col) => col.notNull())
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
    .createIndex('idx_products_sku_unique')
    .on('products')
    .column('sku')
    .unique()
    .ifNotExists()
    .execute();

  await db.schema
    .createIndex('idx_products_supplier')
    .on('products')
    .column('supplier')
    .ifNotExists()
    .execute();

  await db.schema
    .createIndex('idx_products_manufacturer')
    .on('products')
    .column('manufacturer')
    .ifNotExists()
    .execute();

  await db.schema
    .createIndex('idx_products_vendor')
    .on('products')
    .column('vendor')
    .ifNotExists()
    .execute();

  await db.schema
    .createIndex('idx_products_handle_unique')
    .on('products')
    .column('handle')
    .unique()
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

  // ─────────────────────────────────────────────
  // Indexes for new tables
  // ─────────────────────────────────────────────

  await db.schema
    .createIndex('idx_purchase_orders_status')
    .on('purchase_orders')
    .column('status')
    .ifNotExists()
    .execute();

  await db.schema
    .createIndex('idx_purchase_orders_supplier')
    .on('purchase_orders')
    .column('supplier')
    .ifNotExists()
    .execute();

  await db.schema
    .createIndex('idx_purchase_order_items_poId')
    .on('purchase_order_items')
    .column('purchaseOrderId')
    .ifNotExists()
    .execute();

  await db.schema
    .createIndex('idx_receiving_sessions_poId')
    .on('receiving_sessions')
    .column('purchaseOrderId')
    .ifNotExists()
    .execute();

  await db.schema
    .createIndex('idx_receiving_sessions_idempotency')
    .on('receiving_sessions')
    .columns(['purchaseOrderId', 'idempotencyKey'])
    .ifNotExists()
    .execute();

  await db.schema
    .createIndex('idx_inventory_levels_productId')
    .on('inventory_levels')
    .column('productId')
    .ifNotExists()
    .execute();

  await db.schema
    .createIndex('idx_inventory_levels_locationId')
    .on('inventory_levels')
    .column('locationId')
    .ifNotExists()
    .execute();

  await db.schema
    .createIndex('idx_suppliers_name')
    .on('suppliers')
    .column('name')
    .ifNotExists()
    .execute();

  await db.schema
    .createIndex('idx_collections_status')
    .on('collections')
    .column('status')
    .ifNotExists()
    .execute();

  await db.schema
    .createIndex('idx_product_categories_slug')
    .on('product_categories')
    .column('slug')
    .unique()
    .ifNotExists()
    .execute();


  await db.schema
    .createIndex('idx_product_types_name')
    .on('product_types')
    .column('name')
    .unique()
    .ifNotExists()
    .execute();

  await db.schema
    .createIndex('idx_wishlists_userId')
    .on('wishlists')
    .column('userId')
    .ifNotExists()
    .execute();

  await db.schema
    .createIndex('idx_wishlist_items_wishlistId')
    .on('wishlist_items')
    .column('wishlistId')
    .ifNotExists()
    .execute();

  await db.schema
    .createTable('support_tickets')
    .ifNotExists()
    .addColumn('id', 'text', (col) => col.primaryKey())
    .addColumn('userId', 'text', (col) => col.notNull())
    .addColumn('customerEmail', 'text', (col) => col.notNull())
    .addColumn('customerName', 'text')
    .addColumn('orderId', 'text')
    .addColumn('productId', 'text')
    .addColumn('subject', 'text', (col) => col.notNull())
    .addColumn('status', 'text', (col) => col.notNull())
    .addColumn('priority', 'text', (col) => col.notNull())
    .addColumn('createdAt', 'text', (col) => col.notNull())
    .addColumn('updatedAt', 'text', (col) => col.notNull())
    .execute();

  await db.schema
    .createTable('ticket_messages')
    .ifNotExists()
    .addColumn('id', 'text', (col) => col.primaryKey())
    .addColumn('ticketId', 'text', (col) => col.notNull())
    .addColumn('senderId', 'text', (col) => col.notNull())
    .addColumn('senderType', 'text', (col) => col.notNull())
    .addColumn('visibility', 'text', (col) => col.notNull().defaultTo('public'))
    .addColumn('content', 'text', (col) => col.notNull())
    .addColumn('createdAt', 'text', (col) => col.notNull())
    .execute();

  try {
    await db.schema.alterTable('ticket_messages').addColumn('visibility', 'text', (col) => col.notNull().defaultTo('public')).execute();
  } catch (err) {}
}

