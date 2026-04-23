/**
 * [LAYER: INFRASTRUCTURE]
 * SQLite Schema definition for Kysely
 */


export interface ProductTable {
  id: string; // Using string to match Firebase IDs
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

export interface Database {
  products: ProductTable;
  users: UserTable;
  carts: CartTable;
  orders: OrderTable;
}
