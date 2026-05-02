/**
 * [LAYER: INFRASTRUCTURE]
 * SQLite Schema definition for Kysely
 */


export interface ProductTable {
  id: string;
  name: string;
  description: string;
  price: number;
  compareAtPrice: number | null;
  cost: number | null;
  category: string;
  productType: string | null;
  vendor: string | null;
  tags: string | null;
  collections: string | null;
  handle: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  salesChannels: string | null;
  stock: number;
  trackQuantity: number | null;
  continueSellingWhenOutOfStock: number | null;
  reorderPoint: number | null;
  reorderQuantity: number | null;
  physicalItem: number | null;
  weightGrams: number | null;
  sku: string | null;
  manufacturer: string | null;
  supplier: string | null;
  manufacturerSku: string | null;
  barcode: string | null;
  imageUrl: string;
  set: string | null;
  rarity: string | null;
  status: string; // 'active' | 'draft' | 'archived'
  createdAt: string; // ISO string for SQLite
  updatedAt: string;
}

export interface UserTable {
  id: string;
  email: string;
  passwordHash: string;
  displayName: string;
  role: string;
  notes: string | null;
  metadata: string | null; // JSON
  createdAt: string;
}


export interface CartTable {
  id: string;
  userId: string;
  items: string; // JSON string
  updatedAt: string;
}

export interface OrderTable {
  id: string;
  userId: string;
  items: string; // JSON string
  total: number;
  status: string;
  shippingAddress: string; // JSON string
  paymentTransactionId: string | null;
  idempotencyKey: string | null;
  discountCode: string | null;
  discountAmount: number | null;
  trackingNumber: string | null;
  shippingCarrier: string | null;
  notes: string; // JSON string
  riskScore: number;
  createdAt: string;
  updatedAt: string;
}


export interface HiveClaimTable {
  id: string; // The resource being locked (e.g., 'checkout_user123' or 'stock_prod1')
  owner: string; // The agent/process owning the lock
  expiresAt: string; // ISO date string for TTL
  createdAt: string;
}

export interface HiveAuditTable {
  id: string;
  userId: string;
  userEmail: string;
  action: string;
  targetId: string;
  details: string; // JSON string
  hash: string | null;
  previousHash: string | null;
  createdAt: string; // ISO string
}


export interface DiscountTable {
  id: string;
  code: string;
  type: string; // 'percentage' | 'fixed' | 'free_shipping'
  value: number;
  status: string; // 'active' | 'expired' | 'scheduled'
  isAutomatic: number; // 0 | 1
  metadata: string | null; // JSON string for selection, requirements, eligibility, limits, combinations
  startsAt: string;
  endsAt: string | null;
  usageCount: number;
  createdAt: string;
}

export interface SettingTable {
  key: string;
  value: string; // JSON string
  updatedAt: string;
}

export interface TransferTable {
  id: string;
  source: string;
  status: string;
  items: string; // JSON string of TransferItem[]
  itemsCount: number;
  receivedCount: number;
  expectedAt: string;
  createdAt: string;
}

// ─────────────────────────────────────────────
// Purchase Order Tables
// ─────────────────────────────────────────────

export interface PurchaseOrderTable {
  id: string;
  supplier: string;
  referenceNumber: string | null;
  shippingCarrier: string | null;
  trackingNumber: string | null;
  expectedAt: string | null;
  status: string; // 'draft' | 'ordered' | 'partially_received' | 'received' | 'cancelled'
  notes: string | null;
  totalCost: number;
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseOrderItemTable {
  id: string;
  purchaseOrderId: string;
  productId: string;
  sku: string;
  productName: string;
  orderedQty: number;
  receivedQty: number;
  unitCost: number;
  totalCost: number;
  notes: string | null;
}

export interface ReceivingSessionTable {
  id: string;
  purchaseOrderId: string;
  status: string; // 'in_progress' | 'completed' | 'cancelled'
  notes: string | null;
  idempotencyKey: string | null;
  locationId: string | null;
  receivedAt: string;
  completedAt: string | null;
  receivedBy: string;
}

export interface ReceivingItemTable {
  id: string;
  receivingSessionId: string;
  purchaseOrderItemId: string;
  productId: string;
  sku: string;
  expectedQty: number;
  receivedQty: number;
  damagedQty: number;
  unitCost: number;
  condition: string; // 'new' | 'damaged' | 'defective'
  discrepancyReason: string | null;
  disposition: string | null;
  notes: string | null;
}

// ─────────────────────────────────────────────
// Inventory Location Tables
// ─────────────────────────────────────────────

export interface InventoryLocationTable {
  id: string;
  name: string;
  type: string; // 'warehouse' | 'retail' | 'virtual'
  address: string | null;
  isDefault: number; // 0 | 1
  isActive: number; // 0 | 1
  createdAt: string;
}

export interface InventoryLevelTable {
  productId: string;
  locationId: string;
  availableQty: number;
  reservedQty: number;
  incomingQty: number;
  reorderPoint: number;
  reorderQty: number;
  updatedAt: string;
}

export interface SupplierTable {
  id: string;
  name: string;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  address: string | null; // JSON string
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CollectionTable {
  id: string;
  name: string;
  handle: string;
  description: string | null;
  imageUrl: string | null;
  productCount: number;
  status: string; // 'active' | 'archived'
  createdAt: string;
  updatedAt: string;
}

export interface ProductCategoryTable {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProductTypeTable {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}


export interface WishlistTable {
  id: string;
  userId: string;
  name: string;
  isDefault: number; // 0 | 1
  createdAt: string;
  updatedAt: string;
}

export interface WishlistItemTable {
  id: string;
  wishlistId: string;
  productId: string;
  createdAt: string;
}

export interface ProductMediaTable {
  id: string;
  productId: string;
  url: string;
  altText: string | null;
  position: number;
  width: number | null;
  height: number | null;
  size: number | null;
  createdAt: string;
}

export interface SupportTicketTable {
  id: string;
  userId: string;
  customerEmail: string;
  customerName: string | null;
  orderId: string | null;
  productId: string | null;
  subject: string;
  status: string;
  priority: string;
  createdAt: string;
  updatedAt: string;
}

export interface TicketMessageTable {
  id: string;
  ticketId: string;
  senderId: string;
  senderType: string;
  visibility: string;
  content: string;
  createdAt: string;
}

export interface Database {
  products: ProductTable;
  product_media: ProductMediaTable;
  users: UserTable;
  carts: CartTable;
  orders: OrderTable;
  hive_claims: HiveClaimTable;
  hive_audit: HiveAuditTable;
  discounts: DiscountTable;
  settings: SettingTable;
  transfers: TransferTable;
  purchase_orders: PurchaseOrderTable;
  purchase_order_items: PurchaseOrderItemTable;
  receiving_sessions: ReceivingSessionTable;
  receiving_items: ReceivingItemTable;
  inventory_locations: InventoryLocationTable;
  inventory_levels: InventoryLevelTable;
  suppliers: SupplierTable;
  collections: CollectionTable;
  product_categories: ProductCategoryTable;
  product_types: ProductTypeTable;
  wishlists: WishlistTable;
  wishlist_items: WishlistItemTable;
  support_tickets: SupportTicketTable;
  ticket_messages: TicketMessageTable;
}

