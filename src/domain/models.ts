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
  notes?: string;
  metadata?: Record<string, JsonValue>;
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
  trackingNumber?: string | null;
  shippingCarrier?: string | null;
  trackingUrl?: string | null;
  estimatedDeliveryDate?: Date | null;
  fulfillmentEvents?: OrderFulfillmentEvent[];
  notes: OrderNote[];
  riskScore: number; // 0-100
  createdAt: Date;
  updatedAt: Date;
}

export type OrderFulfillmentEventType =
  | 'order_placed'
  | 'payment_confirmed'
  | 'processing'
  | 'label_created'
  | 'in_transit'
  | 'delivered'
  | 'cancelled';

export interface OrderFulfillmentEvent {
  id: string;
  type: OrderFulfillmentEventType;
  label: string;
  description: string;
  at: Date;
}

export interface OrderListFilter {
  status?: OrderStatus | 'all';
  query?: string;
  from?: Date;
  to?: Date;
}

export type OrderListSort =
  | 'newest'
  | 'oldest'
  | 'total_desc'
  | 'total_asc'
  | 'status';

export interface OrderNote {
  id: string;
  authorId: string;
  authorEmail: string;
  text: string;
  createdAt: Date;
}


export interface OrderItem {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number; // cents
  imageUrl?: string;
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

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

export type DiscountType = 'percentage' | 'fixed';
export type DiscountStatus = 'active' | 'scheduled' | 'expired';

export interface Discount {
  id: string;
  code: string;
  type: DiscountType;
  value: number;
  status: DiscountStatus;
  startsAt: Date;
  endsAt: Date | null;
  usageCount: number;
  createdAt: Date;
}

export type DiscountDraft = Omit<Discount, 'id' | 'usageCount' | 'createdAt'>;
export type DiscountUpdate = Partial<Omit<DiscountDraft, 'code'>>;

export interface CustomerSummary {
  id: string;
  name: string;
  email: string;
  orders: number;
  spent: number;
  lastOrder: Date | null;
  joined: Date;
  segment: 'new' | 'active' | 'inactive' | 'big_spender';
}

export interface AnalyticsTopProduct {
  name: string;
  revenue: number;
  sales: number;
  growth: number;
}

export interface AnalyticsData {
  totalRevenue: number;
  dailyRevenue: number[];
  revenueGrowth: number;
  averageOrderValue: number;
  topProducts: AnalyticsTopProduct[];
}