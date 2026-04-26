/**
 * [LAYER: DOMAIN]
 */
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number; // cents
  category: ProductCategory;
  stock: number;
  imageUrl: string;
  set?: string;
  rarity?: CardRarity;
  createdAt: Date;
  updatedAt: Date;
}

export type ProductDraft = Omit<Product, 'id' | 'createdAt' | 'updatedAt'>;

export type ProductUpdate = Partial<ProductDraft>;

export type ProductCategory =
  | 'booster'
  | 'single'
  | 'deck'
  | 'accessory'
  | 'box';

export type CardRarity =
  | 'common'
  | 'uncommon'
  | 'rare'
  | 'holo'
  | 'secret';

export interface User {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  createdAt: Date;
}

export type UserRole = 'customer' | 'admin';

export interface Cart {
  id: string;
  userId: string;
  items: CartItem[];
  updatedAt: Date;
}

export interface CartItem {
  productId: string;
  name: string;
  priceSnapshot: number; // cents at time of add
  quantity: number;
  imageUrl: string;
}

export interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  total: number; // cents
  status: OrderStatus;
  shippingAddress: Address;
  paymentTransactionId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderItem {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number; // cents
}

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export interface Address {
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}