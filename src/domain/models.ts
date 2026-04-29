/**
 * [LAYER: DOMAIN]
 */
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number; // cents
  compareAtPrice?: number; // cents
  cost?: number; // cents paid to manufacturer/wholesaler
  category: ProductCategory;
  productType?: string;
  vendor?: string;
  tags?: string[];
  collections?: string[];
  handle?: string;
  seoTitle?: string;
  seoDescription?: string;
  salesChannels?: ProductSalesChannel[];
  stock: number;
  trackQuantity?: boolean;
  continueSellingWhenOutOfStock?: boolean;
  reorderPoint?: number;
  reorderQuantity?: number;
  physicalItem?: boolean;
  weightGrams?: number;
  sku?: string;
  manufacturer?: string;
  supplier?: string;
  manufacturerSku?: string;
  barcode?: string;
  imageUrl: string;
  status: ProductStatus;
  set?: string;
  rarity?: string;
  metafields?: Record<string, string | number | boolean | null>;
  createdAt: Date;
  updatedAt: Date;
}

export type ProductDraft = Omit<Product, 'id' | 'createdAt' | 'updatedAt'>;

export type ProductUpdate = Partial<ProductDraft>;

export type ProductCategory = string;

export interface Supplier {
  id: string;
  name: string;
  contactName?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: Address;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Collection {
  id: string;
  name: string;
  handle: string;
  description?: string;
  imageUrl?: string;
  productCount: number;
  status: 'active' | 'archived' | 'draft';
  createdAt: Date;
  updatedAt: Date;
}


export type ProductStatus = 'active' | 'draft' | 'archived';

export type ProductSalesChannel = 'online_store' | 'pos' | 'draft_order';

export type ProductSetupIssue =
  | 'missing_image'
  | 'missing_sku'
  | 'missing_price'
  | 'missing_cost'
  | 'missing_stock'
  | 'missing_category'
  | 'not_published';

export type ProductSetupStatus = 'ready' | 'needs_attention';

export type ProductSavedView =
  | 'all'
  | 'active'
  | 'drafts'
  | 'low_stock'
  | 'missing_sku'
  | 'missing_cost'
  | 'needs_photos'
  | 'archived';

export type MarginHealth = 'unknown' | 'at_risk' | 'healthy' | 'premium';

export type ProductManagementProduct = Product & {
  setupStatus: ProductSetupStatus;
  setupIssues: ProductSetupIssue[];
  marginHealth: MarginHealth;
  grossMarginPercent: number | null;
  inventoryHealth: InventoryHealth;
};

export interface ProductSavedViewResult {
  view: ProductSavedView;
  totalCount: number;
  products: ProductManagementProduct[];
}

export interface ProductManagementOverview {
  totalProducts: number;
  statusCounts: Record<ProductStatus, number>;
  setupIssueCounts: Record<ProductSetupIssue, number>;
  marginHealthCounts: Record<MarginHealth, number>;
  lowStockCount: number;
  outOfStockCount: number;
  averageMarginPercent: number | null;
  productsNeedingAttention: ProductManagementProduct[];
}

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

// ─────────────────────────────────────────────
// Purchase Order & Receiving
// ─────────────────────────────────────────────

export type PurchaseOrderStatus = 'draft' | 'ordered' | 'partially_received' | 'received' | 'closed' | 'cancelled';

export type ReceivingDiscrepancyReason =
  | 'missing_items'
  | 'damaged_items'
  | 'wrong_item'
  | 'overage'
  | 'cost_mismatch'
  | 'other';

export type ReceivingLineDisposition =
  | 'add_to_stock'
  | 'quarantine'
  | 'return_to_supplier'
  | 'write_off';

export type PurchaseOrderWorkflowStepId =
  | 'create'
  | 'order'
  | 'receive'
  | 'reconcile'
  | 'close';

export interface PurchaseOrderWorkflowStep {
  id: PurchaseOrderWorkflowStepId;
  label: string;
  description: string;
  status: 'complete' | 'current' | 'blocked' | 'upcoming';
}

export interface PurchaseOrderReceivingSummary {
  orderedQty: number;
  receivedQty: number;
  openQty: number;
  damagedQty: number;
  discrepancyCount: number;
  stockableQty: number;
  progressPercent: number;
  nextActionLabel: string;
  nextActionDescription: string;
}

export type PurchaseOrderSavedView =
  | 'all'
  | 'drafts'
  | 'incoming'
  | 'partially_received'
  | 'ready_to_close'
  | 'exceptions'
  | 'closed';

export type ReceivingVarianceType = 'none' | 'short' | 'over' | 'damaged' | 'cost_mismatch';

export interface PurchaseOrderLineReceivingSummary {
  purchaseOrderItemId: string;
  productId: string;
  productName: string;
  sku: string;
  orderedQty: number;
  receivedQty: number;
  openQty: number;
  progressPercent: number;
  varianceType: ReceivingVarianceType;
  attentionRequired: boolean;
  nextActionLabel: string;
}

export interface PurchaseOrderItem {
  id: string;
  productId: string;
  sku: string;
  productName: string;
  orderedQty: number;
  receivedQty: number;
  unitCost: number; // cents
  totalCost: number; // cents
  notes?: string;
}

export interface PurchaseOrder {
  id: string;
  supplier: string;
  referenceNumber?: string;
  shippingCarrier?: string;
  trackingNumber?: string;
  expectedAt?: Date;
  status: PurchaseOrderStatus;
  items: PurchaseOrderItem[];
  notes?: string;
  totalCost: number; // cents
  createdAt: Date;
  updatedAt: Date;
}


export type ReceivingSessionStatus = 'in_progress' | 'completed' | 'cancelled';

export type ReceivedItemCondition = 'new' | 'damaged' | 'defective';

export interface ReceivedItem {
  id: string;
  purchaseOrderItemId: string;
  productId: string;
  sku: string;
  expectedQty: number;
  receivedQty: number;
  damagedQty?: number;
  unitCost: number; // cents
  condition: ReceivedItemCondition;
  discrepancyReason?: ReceivingDiscrepancyReason;
  disposition?: ReceivingLineDisposition;
  notes?: string;
}

export interface ReceivingSession {
  id: string;
  purchaseOrderId: string;
  status: ReceivingSessionStatus;
  receivedItems: ReceivedItem[];
  notes?: string;
  idempotencyKey?: string;
  locationId?: string;
  receivedAt: Date;
  completedAt?: Date;
  receivedBy: string;
}

// ─────────────────────────────────────────────
// Inventory Location & Levels
// ─────────────────────────────────────────────

export type InventoryLocationType = 'warehouse' | 'retail' | 'virtual';

export interface InventoryLocation {
  id: string;
  name: string;
  type: InventoryLocationType;
  address?: string;
  code?: string;
  isDefault: boolean;
  isActive: boolean;
  createdAt: Date;
}

export interface InventoryLevel {
  productId: string;
  locationId: string;
  availableQty: number;
  reservedQty: number;
  incomingQty: number;
  reorderPoint: number;
  reorderQty: number;
  updatedAt: Date;
}
