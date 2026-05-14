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
  category: string;
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
  media: ProductMedia[];
  status: ProductStatus;
  set?: string;
  rarity?: string;
  metafields?: Record<string, string | number | boolean | null>;
  isDigital?: boolean;
  digitalAssets?: DigitalAsset[];
  shippingClassId?: string;
  hsCode?: string;
  publishedAt?: Date | null;
  templateSuffix?: string;
  standardizedProductType?: string;
  inventoryTracker?: string;
  inventoryPolicy?: 'deny' | 'continue';
  fulfillmentService?: string;
  taxable?: boolean;
  taxCode?: string;
  isGiftCard?: boolean;
  
  // Variations
  hasVariants?: boolean;
  options?: ProductOption[];
  variants?: ProductVariant[];

  createdAt: Date;
  updatedAt: Date;
}

export interface ProductOption {
  id: string;
  productId: string;
  name: string;
  position: number;
  values: string[];
}

export interface ProductVariant {
  id: string;
  productId: string;
  title: string;
  sku?: string;
  price: number; // cents
  compareAtPrice?: number; // cents
  cost?: number; // cents
  stock: number;
  option1?: string;
  option2?: string;
  option3?: string;
  imageUrl?: string;
  weightGrams?: number;
  hsCode?: string;
  inventoryPolicy?: 'deny' | 'continue';
  fulfillmentService?: string;
  taxable?: boolean;
  barcode?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DigitalAsset {
  id: string;
  name: string;
  url: string;
  size: number;
  mimeType: string;
  createdAt: Date;
}

export interface ProductMedia {
  id: string;
  url: string;
  altText?: string;
  position: number;
  width?: number;
  height?: number;
  size?: number;
  createdAt: Date;
}

export type ProductDraft = Omit<Product, 'id' | 'createdAt' | 'updatedAt'>;

export type ProductUpdate = Partial<ProductDraft>;



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
  | 'needs_attention'
  | 'low_stock'
  | 'missing_sku'
  | 'missing_cost'
  | 'needs_photos'
  | 'archived'
  | 'ready';

export type MarginHealth = 'unknown' | 'at_risk' | 'healthy' | 'premium';

export type ProductManagementSortKey =
  | 'updated_desc'
  | 'created_desc'
  | 'name_asc'
  | 'name_desc'
  | 'inventory_asc'
  | 'inventory_desc'
  | 'price_asc'
  | 'price_desc'
  | 'margin_asc'
  | 'margin_desc';

export interface ProductManagementFilters {
  query?: string;
  status?: ProductStatus | 'all';
  category?: string | 'all';
  vendor?: string | 'all';
  productType?: string | 'all';
  inventoryHealth?: InventoryHealth | 'all';
  setupStatus?: ProductSetupStatus | 'all';
  setupIssue?: ProductSetupIssue | 'all';
  marginHealth?: MarginHealth | 'all';
  tag?: string;
  hasSku?: boolean;
  hasImage?: boolean;
  hasCost?: boolean;
  sort?: ProductManagementSortKey;
  limit?: number;
  cursor?: string;
}

export interface ProductManagementFacetOption {
  label: string;
  value: string;
  count: number;
}

export interface ProductManagementFacets {
  statuses: ProductManagementFacetOption[];
  categories: ProductManagementFacetOption[];
  vendors: ProductManagementFacetOption[];
  productTypes: ProductManagementFacetOption[];
  inventoryHealth: ProductManagementFacetOption[];
  setupIssues: ProductManagementFacetOption[];
  marginHealth: ProductManagementFacetOption[];
  tags: ProductManagementFacetOption[];
}

export interface ProductManagementActiveFilter {
  key: keyof ProductManagementFilters;
  label: string;
  value: string;
}

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
  filteredCount: number;
  products: ProductManagementProduct[];
  facets: ProductManagementFacets;
  activeFilters: ProductManagementActiveFilter[];
  sort: ProductManagementSortKey;
  nextCursor?: string;
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

export interface ProductCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductType {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

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
  variantId?: string;
  variantTitle?: string;
  productHandle?: string;
  name: string;
  priceSnapshot: number; // cents at time of add
  quantity: number;
  imageUrl: string;
  isDigital?: boolean;
  shippingClassId?: string;
  weightGrams?: number;
}

export interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  total: number; // cents
  status: OrderStatus;
  shippingAddress: Address;
  paymentTransactionId: string | null;
  idempotencyKey?: string | null;
  discountCode?: string | null;
  discountAmount?: number | null;
  customerName?: string;
  customerEmail?: string;
  trackingNumber?: string | null;
  shippingCarrier?: string | null;
  trackingUrl?: string | null;
  estimatedDeliveryDate?: Date | null;
  fulfillmentEvents?: OrderFulfillmentEvent[];
  notes: OrderNote[];
  riskScore: number; // 0-100
  shippingClassId?: string;
  shippingAmount: number; // cents
  taxAmount: number; // cents
  fulfillmentLocationId: string | null;
  fulfillmentMethod: 'shipping' | 'pickup' | 'delivery';
  fulfillments: Fulfillment[];
  reconciliationRequired?: boolean;
  reconciliationNotes?: string[];
  refundedAmount?: number; // cents (Atomic tracking to prevent overflow)
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface Fulfillment {
  id: string;
  orderId: string;
  items: Array<{ productId: string; variantId?: string; quantity: number }>;
  trackingNumber: string;
  trackingCarrier: string;
  trackingUrl: string | null;
  status: 'pending' | 'shipped' | 'delivered' | 'cancelled';
  shippedAt: Date | null;
  deliveredAt: Date | null;
  createdAt: Date;
}

export type OrderFulfillmentEventType =
  | 'order_placed'
  | 'payment_confirmed'
  | 'processing'
  | 'label_created'
  | 'in_transit'
  | 'delivered'
  | 'cancelled'
  | 'ready_for_pickup'
  | 'picked_up'
  | 'delivery_started';

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
  variantId?: string;
  variantTitle?: string;
  productHandle?: string;
  name: string;
  quantity: number;
  unitPrice: number; // cents
  imageUrl?: string;
  digitalAssets?: DigitalAsset[];
  isDigital?: boolean;
  shippingClassId?: string;
  fulfilledQty: number;
  hsCode?: string;
}

export type OrderStatus =
  | 'draft'
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded'
  | 'partially_refunded'
  | 'ready_for_pickup'
  | 'delivery_started'
  | 'reconciling';

export interface Address {
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  zipCode?: string; // Normalized
  phone?: string;
  coordinates?: { lat: number, lng: number };
}

export interface Weight {
  value: number;
  unit: 'g' | 'kg' | 'lbs' | 'oz';
}

export interface Dimensions {
  length: number;
  width: number;
  height: number;
  unit: 'in' | 'cm';
}

export interface AdministrativeTask {
  id: string;
  label: string;
  count: number;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: 'fulfillment' | 'inventory' | 'payment' | 'risk';
}

export interface FulfillmentMilestone {
  id: string;
  label: string;
  status: 'pending' | 'active' | 'completed';
  description: string;
  actionRequired: boolean;
  actionLabel?: string;
}

export interface ShippingRateCard {
  id: string;
  carrierName: string;
  serviceLevel: string;
  minWeightLbs: number;
  maxWeightLbs: number;
  baseRate: number; // cents
  perLbSurcharge: number; // cents
}

export interface ShippingMargin {
  customerPaid: number;
  estimatedCost: number;
  actualCost?: number;
  margin: number; // cents
  marginPercent: number;
  health: 'profitable' | 'at_cost' | 'loss';
}

export interface OrderLogisticsAudit {
  orderId: string;
  margin: ShippingMargin;
  addressRisk: 'low' | 'medium' | 'high';
  slaStatus: 'on_track' | 'approaching_deadline' | 'breached';
  suggestedAction: string;
}

export interface ShippingLabel {
  id: string;
  fulfillmentId: string;
  carrier: string;
  service: string;
  trackingNumber: string;
  labelUrl: string;
  cost: number;
  format: 'zpl' | 'pdf' | 'png';
  createdAt: Date;
}

export interface CarrierManifest {
  id: string;
  carrier: string;
  fulfillmentIds: string[];
  totalLabels: number;
  totalWeightLbs: number;
  status: 'draft' | 'submitted' | 'scanned';
  createdAt: Date;
  submittedAt?: Date;
}

export interface ShippingRule {
  id: string;
  name: string;
  conditions: {
    minWeightLbs?: number;
    maxWeightLbs?: number;
    minValueCents?: number;
    maxValueCents?: number;
    destRegions?: string[];
  };
  preferredCarrier: string;
  preferredService: string;
  priority: number;
}

export interface LogisticsPerformance {
  avgFulfillmentTimeHours: number;
  onTimeDeliveryRate: number;
  carrierPerformance: Record<string, { avgTransitDays: number; breachRate: number }>;
  shippingProfitability: number; // Overall margin cents
}

export interface NavigationLink {
  label: string;
  href: string;
  icon?: string;
  isExternal?: boolean;
  children?: NavigationLink[];
}

export interface NavigationColumn {
  title: string;
  links: NavigationLink[];
}

export interface NavigationPromotion {
  imageUrl: string;
  title: string;
  subtitle?: string;
  linkText: string;
  linkHref: string;
}

export interface NavigationMenu {
  id: string; // e.g. "main-nav"
  shopCategories: NavigationColumn;
  shopCollections: NavigationColumn;
  featuredPromotion?: NavigationPromotion;
  otherLinks: NavigationLink[]; 
}

export interface AdminDashboardSummary {
  productCount: number;
  lowStockCount: number;
  outOfStockCount: number;
  totalRevenue: number;
  averageOrderValue: number;
  orderCountsByStatus: Record<OrderStatus, number>;
  fulfillmentCounts: Record<FulfillmentBucket, number>;
  activeTasks: AdministrativeTask[];
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

export type DiscountType = 'percentage' | 'fixed' | 'free_shipping';
export type DiscountStatus = 'active' | 'scheduled' | 'expired';
export type DiscountSelectionType = 'all_products' | 'specific_products' | 'specific_collections';
export type DiscountRequirementType = 'none' | 'minimum_amount' | 'minimum_quantity';
export type DiscountEligibilityType = 'everyone' | 'specific_customers' | 'specific_segments';

export interface Discount {
  id: string;
  code: string;
  type: DiscountType;
  value: number; // cents or percentage
  status: DiscountStatus;
  
  // Method
  isAutomatic: boolean;
  
  // Selection
  selectionType: DiscountSelectionType;
  selectedProductIds: string[];
  selectedCollectionIds: string[];
  
  // Requirements
  minimumRequirementType: DiscountRequirementType;
  minimumAmount: number | null; // cents
  minimumQuantity: number | null;
  
  // Eligibility
  eligibilityType: DiscountEligibilityType;
  eligibleCustomerIds: string[];
  eligibleCustomerSegments: string[];
  
  // Limits
  usageLimit: number | null;
  oncePerCustomer: boolean;
  usageCount: number;
  
  // Combinations
  combinesWith: {
    orderDiscounts: boolean;
    productDiscounts: boolean;
    shippingDiscounts: boolean;
  };

  startsAt: Date;
  endsAt: Date | null;
  createdAt: Date;
}

export type DiscountDraft = Omit<Discount, 'id' | 'usageCount' | 'createdAt'>;
export type DiscountUpdate = Partial<DiscountDraft>;

export interface CustomerSummary {
  id: string;
  name: string;
  email: string;
  orders: number;
  spent: number;
  lastOrder: Date | null;
  joined: Date;
  segment: 'new' | 'active' | 'inactive' | 'big_spender' | 'one_time' | 'returning' | 'vip';
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
  | 'duplicate_shipment'
  | 'supplier_substitution'
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
  dueState: 'not_scheduled' | 'on_track' | 'arriving_soon' | 'overdue' | 'complete';
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
  isPickupLocation: boolean;
  pickupInstructions?: string;
  deliveryRadiusMiles?: number;
  deliveryFee?: number; // cents
  coordinates?: { lat: number, lng: number };
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

// ─────────────────────────────────────────────
// Wishlist & Collections
// ─────────────────────────────────────────────

export interface Wishlist {
  id: string;
  userId: string;
  name: string;
  isDefault: boolean;
  itemIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface WishlistItem {
  id: string;
  wishlistId: string;
  productId: string;
  createdAt: Date;
}

// ─────────────────────────────────────────────
// Support & Tickets
// ─────────────────────────────────────────────

export type TicketStatus = 'new' | 'open' | 'pending' | 'on_hold' | 'solved' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TicketType = 'question' | 'incident' | 'problem' | 'task';

export interface SupportTicket {
  id: string;
  userId: string;
  customerEmail: string;
  customerName?: string;
  assigneeId?: string;
  assigneeName?: string;
  orderId?: string;
  productId?: string;
  subject: string;
  status: TicketStatus;
  priority: TicketPriority;
  type?: TicketType;
  tags?: string[];
  slaDeadline?: Date;
  messages: TicketMessage[];
  createdAt: Date;
  updatedAt: Date;
}

export interface TicketMessage {
  id: string;
  ticketId: string;
  senderId: string;
  senderType: 'customer' | 'agent' | 'system';
  visibility: 'public' | 'internal';
  content: string;
  createdAt: Date;
}

export interface SupportMacro {
  id: string;
  name: string;
  content: string;
  category: string;
  slug?: string;
}

// ─────────────────────────────────────────────
// Knowledgebase & FAQ
// ─────────────────────────────────────────────

export interface KnowledgebaseCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon?: string;
  articleCount: number;
}

export interface KnowledgebaseArticle {
  id: string;
  categoryId: string;
  categoryName?: string;
  title: string;
  slug: string;
  content: string; // Markdown or HTML
  excerpt: string;
  authorName?: string;
  authorId?: string; // LINK to Author
  viewCount: number;
  helpfulCount: number;
  notHelpfulCount: number;
  tags?: string[];
  type: 'article' | 'blog';
  status: 'draft' | 'review' | 'published' | 'archived' | 'scheduled';
  featuredImageUrl?: string;
  featuredImageAlt?: string;
  relatedProductIds?: string[];
  isFeatured?: boolean;
  publishedAt?: Date;
  scheduledAt?: Date;
  
  // SEO & Social
  metaTitle?: string;
  metaDescription?: string;
  canonicalUrl?: string;
  ogImage?: string;
  ogTitle?: string;
  ogDescription?: string;

  createdAt: Date;
  updatedAt: Date;
  seriesId?: string; // LINK to BlogSeries
  seriesPosition?: number;
}

export interface BlogSeries {
  id: string;
  title: string;
  slug: string;
  description: string;
  featuredImageUrl?: string;
  categoryIds: string[];
  articleCount: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  createdAt: Date;
  updatedAt: Date;
}

export interface Author {
  id: string;
  name: string;
  bio: string;
  avatarUrl?: string;
  role: string;
  socialLinks?: { twitter?: string; instagram?: string; website?: string; github?: string };

  createdAt: Date;
  updatedAt: Date;
}

export interface BlogComment {
  id: string;
  postId: string;
  postTitle?: string; // CONTEXT for admin moderation
  userId: string;

  userName: string;
  userAvatar?: string;
  content: string;
  status: 'pending' | 'published' | 'spam';
  likes: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Subscriber {
  id: string;
  email: string;
  source: string; // e.g., 'blog_footer', 'exit_intent'
  metadata?: Record<string, any>;
  subscribedAt: Date;
}

export interface ContentEngagement {
  id: string;
  postId: string;
  userId?: string;
  type: 'view' | 'share' | 'helpful' | 'not_helpful';
  metadata?: Record<string, any>;
  createdAt: Date;
}


// ─────────────────────────────────────────────
// Reviews & Ratings
// ─────────────────────────────────────────────

export interface ReviewReply {
  id: string;
  authorName: string;
  authorRole: 'merchant' | 'artist';
  content: string;
  createdAt: Date;
}

export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number; // 1-5
  title: string;
  content: string;
  images?: string[];
  helpfulCount: number;
  isVerified: boolean;
  status: 'pending' | 'published' | 'hidden';
  replies?: ReviewReply[];
  createdAt: Date;
  updatedAt: Date;
}

export type ReviewDraft = Omit<Review, 'id' | 'helpfulCount' | 'status' | 'createdAt' | 'updatedAt'>;

export interface IReviewRepository {
  getByProductId(productId: string, options?: { limit?: number; offset?: number; sort?: string }): Promise<{ reviews: Review[]; total: number; averageRating: number }>;
  create(review: ReviewDraft): Promise<Review>;
  voteHelpful(reviewId: string): Promise<void>;
  getStats(productId: string): Promise<{
    averageRating: number;
    totalReviews: number;
    ratingCounts: Record<number, number>;
  }>;
}

// ─────────────────────────────────────────────
// Shipping & Logistics
// ─────────────────────────────────────────────

export interface ShippingClass {
  id: string;
  name: string;
  description?: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ShippingZone {
  id: string;
  name: string;
  countries: string[]; // ISO 2-letter codes
  createdAt: Date;
  updatedAt: Date;
}

export type ShippingRateType = 'flat' | 'weight_based' | 'price_based';

export interface ShippingRate {
  id: string;
  shippingZoneId: string;
  shippingClassId: string;
  name: string;
  type: ShippingRateType;
  minLimit?: number; // grams or cents
  maxLimit?: number; // grams or cents
  amount: number; // cents
  carrier?: string; // e.g. 'UPS', 'USPS', 'FedEx'
  serviceCode?: string; // e.g. 'ground', 'priority'
  createdAt: Date;
  updatedAt: Date;
}


// ─────────────────────────────────────────────
// Marketing & Campaigns
// ─────────────────────────────────────────────

export type CampaignType =
  | 'welcome_series'
  | 'abandoned_cart'
  | 'browse_abandonment'
  | 'site_abandonment'
  | 'post_purchase'
  | 'replenishment'
  | 'review_request'
  | 'comeback_offer'
  | 'product_upsell'
  | 'loyalty_reward'
  | 'cross_sell'
  | 'win_back'
  | 'sunset';
export type CampaignStatus = 'draft' | 'active' | 'paused' | 'archived' | 'completed';
export type CampaignChannel = 'email' | 'sms' | 'concierge_push' | 'store_notice';
export type CampaignLifecycleStage = 'reach' | 'acquisition' | 'intent_capture' | 'consideration' | 'conversion' | 'retention' | 'winback' | 'loyalty' | 'sunset';
export type CampaignOfferStrategy = 'none' | 'social_proof' | 'help_first' | 'free_shipping' | 'tiered_discount' | 'bundle_value' | 'vip_access';

export interface MarketingCampaign {
  id: string;
  name: string;
  description: string;
  type: CampaignType;
  status: CampaignStatus;
  channels: CampaignChannel[];
  
  // Triggers
  triggerType: 'event' | 'segment' | 'schedule';
  triggerConfig: {
    delayHours?: number;
    inactivityDays?: number;
    minimumCartValue?: number;
    specificProductIds?: string[];
    specificCollectionIds?: string[];
    segmentId?: string;
  };

  // Content & AI
  aiPersonalizationEnabled: boolean;
  baseTemplateId?: string;
  subjectTemplate?: string;
  bodyTemplate?: string;
  discountCode?: string; // LINK to Discount
  
  // Goals & Metrics
  goalType: 'purchase' | 'visit' | 'click';
  conversionWindowDays: number;
  lifecycleStage?: CampaignLifecycleStage;
  offerStrategy?: CampaignOfferStrategy;
  suppressionRules?: {
    excludeRecentPurchasersDays?: number;
    excludeActiveTicket?: boolean;
    excludeRecentCampaignDays?: number;
    requireConsent?: boolean;
  };
  learningObjective?: string;

  // Multi-step Sequence
  isSequence: boolean;
  steps: CampaignStep[];
  
  // Frequency & Governance
  frequencyCapDays?: number; // Min days between ANY marketing message
  priority: number; // 1-10 (10 is highest)
  
  // Dynamic Incentives
  dynamicIncentivesEnabled: boolean;
  incentiveRules?: Array<{
    minRfmScore: number;
    discountCode: string;
  }>;

  // Analytics (Denormalized for list views)
  sentCount: number;
  clickCount: number;
  conversionCount: number;
  revenueGenerated: number; // cents

  createdAt: Date;
  updatedAt: Date;
}

export interface CampaignEvent {
  id: string;
  campaignId: string;
  userId: string;
  customerEmail: string;
  channel: CampaignChannel;
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'clicked' | 'converted' | 'bounced' | 'complained';
  
  // Sequence context
  stepIndex?: number; // 0-indexed step in the campaign sequence
  variantId?: string; // If split test
  nextStepDueAt?: Date;

  // Content (Snapshot of what was actually sent)
  subject: string;
  body: string;
  personalizedMetadata?: Record<string, any>;
  
  // Transactional context
  relatedOrderId?: string;
  conversionValue?: number; // cents
  
  error?: string;
  sentAt?: Date;
  clickedAt?: Date;
  convertedAt?: Date;
  createdAt: Date;
}

export interface CustomerSegment {
  id: string;
  name: string;
  description: string;
  queryType: 'manual' | 'dynamic';
  rules: SegmentRule[];
  customerCount: number;
  lastCalculatedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface SegmentRule {
  field: 'total_spent' | 'order_count' | 'last_order_days' | 'tags' | 'category_interest' | 'location' | 'loyalty_tier';
  operator: 'gt' | 'lt' | 'eq' | 'contains' | 'not_contains';
  value: any;
}

export interface CampaignStep {
  id: string;
  delayHours: number;
  subjectTemplate?: string;
  bodyTemplate?: string;
  discountCode?: string;
  channel: CampaignChannel;
  objective?: 'reminder' | 'objection_handling' | 'social_proof' | 'incentive' | 'concierge_assist' | 'last_call';
  offerStrategy?: CampaignOfferStrategy;
  
  // A/B Testing
  isSplitTest: boolean;
  variants?: CampaignVariant[];
}

export interface CampaignVariant {
  id: string;
  weight: number; // 0-100
  subjectTemplate: string;
  bodyTemplate: string;
  
  // Metrics
  sentCount: number;
  conversionCount: number;
}

export interface MarketingOverview {
  activeCampaigns: number;
  totalCampaignRevenue: number; // cents
  avgConversionRate: number;
  topPerformingCampaigns: MarketingCampaign[];
  recentCampaignEvents: CampaignEvent[];
}

export type MarketingCampaignDraft = Omit<MarketingCampaign, 'id' | 'sentCount' | 'clickCount' | 'conversionCount' | 'revenueGenerated' | 'createdAt' | 'updatedAt'>;
export type MarketingCampaignUpdate = Partial<MarketingCampaignDraft>;

// ─────────────────────────────────────────────
// Statistics & Dashboard Aggregations
// ─────────────────────────────────────────────

export interface OrderStats {
  totalRevenue: number;
  totalOrders: number;
  orderCountsByStatus: Record<OrderStatus, number>;
  dailyRevenue: Record<string, number>; // YYYY-MM-DD -> cents
  updatedAt: Date;
}

export interface ProductStats {
  totalProducts: number;
  totalUnits: number;
  inventoryValue: number;
  lowStockCount: number;
  outOfStockCount: number;
  statusCounts: Record<ProductStatus, number>;
  marginHealthCounts: Record<MarginHealth, number>;
  totalMarginPercent: number; // Sum for average calculation
  productWithMarginCount: number;
  updatedAt: Date;
}


