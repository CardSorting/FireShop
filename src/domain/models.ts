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
  status: ProductStatus;
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

export type ProductStatus = 'active' | 'draft' | 'archived';

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
  customerName?: string;
  customerEmail?: string;
  riskScore: number; // 0-100
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

export interface AdminDashboardSummary {
  productCount: number;
  lowStockCount: number;
  outOfStockCount: number;
  totalRevenue: number;
  averageOrderValue: number;
  orderCountsByStatus: Record<OrderStatus, number>;
  fulfillmentCounts: Record<FulfillmentBucket, number>;
  attentionItems: AdminActionItem[];
  recentOrders: Order[];
  lowStockProducts: Product[];
  dailyRevenue: number[]; // Last 7 days
}

export interface TransferItem {
  productId: string;
  name: string;
  quantity: number;
}

export interface Transfer {
  id: string;
  source: string;
  status: 'pending' | 'in_transit' | 'received' | 'cancelled';
  items: TransferItem[];
  itemsCount: number;
  receivedCount: number;
  expectedAt: Date;
  createdAt: Date;
}


export type InventoryHealth = 'out_of_stock' | 'low_stock' | 'healthy';

export type FulfillmentBucket = 'to_review' | 'ready_to_ship' | 'in_transit' | 'completed' | 'cancelled';

export interface AdminActionItem {
  id: string;
  label: string;
  description: string;
  href: string;
  priority: 'high' | 'medium' | 'low';
}

export interface InventoryOverview {
  totalProducts: number;
  totalUnits: number;
  inventoryValue: number;
  healthCounts: Record<InventoryHealth, number>;
  products: Array<Product & { inventoryHealth: InventoryHealth }>;
}