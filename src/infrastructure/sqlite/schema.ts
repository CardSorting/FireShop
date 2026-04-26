/**
 * [LAYER: INFRASTRUCTURE]
 * SQLite Schema definition for Kysely
 */


export interface ProductTable {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  imageUrl: string;
  set: string | null;
  rarity: string | null;
  createdAt: string; // ISO string for SQLite
  updatedAt: string;
}

export interface UserTable {
  id: string;
  email: string;
  passwordHash: string;
  displayName: string;
  role: string;
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
  action: string;
  details: string;
  timestamp: string;
}

export interface Database {
  products: ProductTable;
  users: UserTable;
  carts: CartTable;
  orders: OrderTable;
  hive_claims: HiveClaimTable;
  hive_audit: HiveAuditTable;
}
