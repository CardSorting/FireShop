/**
 * [LAYER: DOMAIN]
 */
import type { Product, ProductDraft, ProductUpdate, Cart, Order, OrderStatus, User, ProductStatus, Address } from './models';
import type {
  Discount,
  DiscountDraft,
  DiscountUpdate,
  JsonValue,
  Transfer,
} from './models';

export interface IProductRepository {
  getAll(options?: {
    category?: string;
    collection?: string;
    query?: string;
    status?: ProductStatus | 'all';
    inventoryHealth?: 'out_of_stock' | 'low_stock' | 'healthy' | 'all';
    setupStatus?: 'ready' | 'needs_attention' | 'all';
    limit?: number;
    cursor?: string;
  }): Promise<{ products: Product[]; nextCursor?: string }>;
  getById(id: string, transaction?: any): Promise<Product | null>;
  getByHandle(handle: string, transaction?: any): Promise<Product | null>;
  create(product: ProductDraft): Promise<Product>;
  update(id: string, updates: ProductUpdate, transaction?: any): Promise<Product>;
  delete(id: string): Promise<void>;
  updateStock(id: string, delta: number, transaction?: any): Promise<void>;
  updateVariantStock(variantId: string, delta: number, transaction?: any): Promise<void>;
  batchUpdateStock(updates: { id: string; variantId?: string; delta: number }[], transaction?: any): Promise<void>;
  batchSetInventory?(updates: { id: string; variantId?: string; stock: number }[]): Promise<void>;
  batchDelete?(ids: string[]): Promise<void>;
  batchUpdate?(updates: { id: string; updates: ProductUpdate }[]): Promise<Product[]>;
  getStats(): Promise<{
    totalProducts: number;
    totalUnits: number;
    inventoryValue: number;
    healthCounts: {
      out_of_stock: number;
      low_stock: number;
      healthy: number;
    };
  }>;
  getLowStockProducts(limit: number): Promise<Product[]>;
}

export interface ICartRepository {
  getByUserId(userId: string, transaction?: any): Promise<Cart | null>;
  save(cart: Cart, transaction?: any): Promise<void>;
  clear(userId: string, transaction?: any): Promise<void>;
}

export interface IOrderRepository {
  create(order: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>, transaction?: any): Promise<Order>;
  getById(id: string): Promise<Order | null>;
  getByIdempotencyKey(key: string): Promise<Order | null>;
  getByPaymentTransactionId(id: string): Promise<Order | null>;
  getByPaymentTransactionIdTransactional(id: string, transaction: any): Promise<Order | null>;
  getByUserId(userId: string, options?: {
    status?: OrderStatus | 'all';
    limit?: number;
    cursor?: string;
    from?: Date;
    to?: Date;
  }): Promise<{ orders: Order[]; nextCursor?: string }>;
  getAll(options?: {
    status?: OrderStatus;
    query?: string;
    limit?: number;
    cursor?: string;
    from?: Date;
    to?: Date;
  }): Promise<{ orders: Order[]; nextCursor?: string }>;
  save(order: Order, transaction?: any): Promise<void>;
  updateStatus(id: string, status: OrderStatus, transaction?: any): Promise<void>;
  updatePaymentTransactionId(id: string, paymentTransactionId: string): Promise<void>;
  batchUpdateStatus?(ids: string[], status: OrderStatus): Promise<void>;
  updateNotes(orderId: string, notes: import('./models').OrderNote[], transaction?: any): Promise<void>;
  updateFulfillment(orderId: string, data: { trackingNumber?: string; shippingCarrier?: string; trackingUrl?: string | null }, transaction?: any): Promise<void>;
  updateRiskScore(orderId: string, score: number, transaction?: any): Promise<void>;
  markForReconciliation(orderId: string, notes: string[], appendOnly?: boolean): Promise<void>;
  clearReconciliationFlag(orderId: string, transaction?: any): Promise<void>;
  updateMetadata(orderId: string, metadata: Record<string, any>, transaction?: any): Promise<void>;
  addFulfillmentEvent(orderId: string, event: import('./models').OrderFulfillmentEvent, transaction?: any): Promise<void>;
  addNote?(orderId: string, note: import('./models').OrderNote, transaction?: any): Promise<void>;
  getDashboardStats(): Promise<{
    totalRevenue: number;
    dailyRevenue: number[]; // Last 7 days, index 0 is 6 days ago, index 6 is today
    orderCountsByStatus: Record<OrderStatus, number>;
  }>;
  getTopProducts(limit: number): Promise<Array<{
    id: string;
    name: string;
    revenue: number;
    sales: number;
  }>>;
  hasUsedDiscount(userId: string, discountCode: string): Promise<boolean>;
  checkUserDiscountUsage(userId: string, discountCode: string, transaction: any): Promise<boolean>;
  recordUserDiscountUsage(userId: string, discountCode: string, transaction: any): Promise<void>;
  removeUserDiscountUsage(userId: string, discountCode: string, transaction: any): Promise<void>;
  markHeartbeat(orderId: string, userId: string, email: string): Promise<void>;
  getActiveViewers(orderId: string): Promise<Array<{ userId: string, email: string, lastActive: Date }>>;
}

export interface IAuthProvider {
  getCurrentUser(): Promise<User | null>;
  signIn(email: string, password: string): Promise<User>;
  signInWithGoogle(): Promise<User>;
  signUp(email: string, password: string, displayName: string): Promise<User>;
  signOut(): Promise<void>;
  onAuthStateChanged(callback: (user: User | null) => void): () => void;
  getAllUsers?(): Promise<User[]>;
  updateUser?(id: string, updates: Partial<User>): Promise<User>;
}


export interface IPaymentProcessor {
  processPayment(params: {
    amount: number;
    orderId: string;
    paymentMethodId?: string;
    idempotencyKey: string;
  }): Promise<{ success: boolean; transactionId: string | null }>;
  refundPayment(transactionId: string, amount: number, idempotencyKey: string): Promise<{ success: boolean }>;
}

export interface ICheckoutGateway {
  finalizeCheckout(params: {
    userId: string;
    shippingAddress: import('./models').Address;
    paymentMethodId: string;
    idempotencyKey: string;
    discountCode?: string;
  }): Promise<Order>;
}

export interface ILockProvider {
  acquireLock(resourceId: string, owner: string, ttlMs?: number): Promise<{ success: boolean; fencingToken: number | null }>;
  releaseLock(resourceId: string, owner: string, fencingToken?: number): Promise<void>;
}

export interface IDiscountRepository {
  getAll(): Promise<Discount[]>;
  getById(id: string, transaction?: any): Promise<Discount | null>;
  getByCode(code: string, transaction?: any): Promise<Discount | null>;
  create(discount: DiscountDraft): Promise<Discount>;
  update(id: string, updates: DiscountUpdate): Promise<Discount>;
  delete(id: string): Promise<void>;
  incrementUsage(id: string, transaction?: any): Promise<void>;
  decrementUsage(id: string, transaction?: any): Promise<void>;
}

export interface ITransferRepository {
  getAll(): Promise<Transfer[]>;
  update(id: string, updates: Partial<Transfer>, transaction?: any): Promise<void>;
  create?(transfer: Transfer, transaction?: any): Promise<void>;
}

export interface ISettingsRepository {
  get<T>(key: string): Promise<T | null>;
  set(key: string, value: JsonValue): Promise<void>;
  getAll(): Promise<Record<string, JsonValue>>;
}

export interface IPurchaseOrderRepository {
  save(order: import('./models').PurchaseOrder, transaction?: any): Promise<import('./models').PurchaseOrder>;
  findById(id: string): Promise<import('./models').PurchaseOrder | null>;
  findAll(options?: {
    status?: import('./models').PurchaseOrderStatus;
    supplier?: string;
    limit?: number;
    offset?: number;
  }): Promise<import('./models').PurchaseOrder[]>;
  count(options?: { status?: import('./models').PurchaseOrderStatus }): Promise<number>;
  updateStatus(id: string, status: import('./models').PurchaseOrderStatus, transaction?: any): Promise<import('./models').PurchaseOrder>;
  saveReceivingSession?(session: import('./models').ReceivingSession, transaction?: any): Promise<import('./models').ReceivingSession>;
  findReceivingSessions?(purchaseOrderId: string): Promise<import('./models').ReceivingSession[]>;
  findReceivingSessionByIdempotencyKey?(purchaseOrderId: string, idempotencyKey: string): Promise<import('./models').ReceivingSession | null>;
}

export interface IInventoryLocationRepository {
  save(location: import('./models').InventoryLocation): Promise<import('./models').InventoryLocation>;
  findById(id: string): Promise<import('./models').InventoryLocation | null>;
  findAll(): Promise<import('./models').InventoryLocation[]>;
  findDefault(): Promise<import('./models').InventoryLocation | null>;
  findActive(): Promise<import('./models').InventoryLocation[]>;
  update(id: string, location: Partial<import('./models').InventoryLocation>): Promise<import('./models').InventoryLocation>;
}

export interface IInventoryLevelRepository {
  findByProduct(productId: string): Promise<import('./models').InventoryLevel[]>;
  findByLocation(locationId: string): Promise<import('./models').InventoryLevel[]>;
  findByProductAndLocation(productId: string, locationId: string): Promise<import('./models').InventoryLevel | null>;
  save(level: import('./models').InventoryLevel): Promise<import('./models').InventoryLevel>;
  adjustQuantity(productId: string, locationId: string, delta: number, reason: string, transaction?: any): Promise<import('./models').InventoryLevel>;
  updateReorderPoint(productId: string, locationId: string, reorderPoint: number, reorderQty: number): Promise<import('./models').InventoryLevel>;
}

export interface ISupplierRepository {
  getAll(options?: { query?: string; limit?: number; offset?: number }): Promise<import('./models').Supplier[]>;
  getById(id: string): Promise<import('./models').Supplier | null>;
  save(supplier: import('./models').Supplier): Promise<import('./models').Supplier>;
  delete(id: string): Promise<void>;
  count(options?: { query?: string }): Promise<number>;
}

export interface ICollectionRepository {
  getAll(options?: { status?: 'active' | 'archived'; limit?: number }): Promise<import('./models').Collection[]>;
  getById(id: string): Promise<import('./models').Collection | null>;
  getByHandle(handle: string): Promise<import('./models').Collection | null>;
  save(collection: import('./models').Collection): Promise<import('./models').Collection>;
  delete(id: string): Promise<void>;
  updateProductCount(id: string, delta: number): Promise<void>;
}

export interface ITaxonomyRepository {
  // Categories
  getAllCategories(): Promise<import('./models').ProductCategory[]>;
  getCategoryById(id: string): Promise<import('./models').ProductCategory | null>;
  getCategoryBySlug(slug: string): Promise<import('./models').ProductCategory | null>;
  saveCategory(category: import('./models').ProductCategory): Promise<import('./models').ProductCategory>;
  deleteCategory(id: string): Promise<void>;

  // Types
  getAllTypes(): Promise<import('./models').ProductType[]>;
  getTypeById(id: string): Promise<import('./models').ProductType | null>;
  saveType(type: import('./models').ProductType): Promise<import('./models').ProductType>;
  deleteType(id: string): Promise<void>;
}


export interface IWishlistRepository {
  getByUserId(userId: string): Promise<import('./models').Wishlist[]>;
  getById(id: string): Promise<import('./models').Wishlist | null>;
  create(wishlist: Omit<import('./models').Wishlist, 'id' | 'createdAt' | 'updatedAt'>): Promise<import('./models').Wishlist>;
  update(id: string, name: string): Promise<import('./models').Wishlist>;
  delete(id: string): Promise<void>;
  addItem(wishlistId: string, productId: string): Promise<void>;
  removeItem(wishlistId: string, productId: string): Promise<void>;
  getItems(wishlistId: string): Promise<import('./models').Product[]>;
  isProductInWishlist(userId: string, productId: string): Promise<boolean>;
}

export interface ITicketRepository {
  getTickets(options?: { status?: string; userId?: string; assigneeId?: string; limit?: number }): Promise<import('./models').SupportTicket[]>;
  getTicketById(id: string): Promise<import('./models').SupportTicket | null>;
  getTicketForCustomer(id: string, userId: string): Promise<import('./models').SupportTicket | null>;
  createTicket(ticket: import('./models').SupportTicket): Promise<void>;
  updateTicketProperties(id: string, updates: Partial<import('./models').SupportTicket>): Promise<void>;
  updateTicketStatus(id: string, status: string): Promise<void>;
  updateTicketPriority(id: string, priority: string): Promise<void>;
  addMessage(message: import('./models').TicketMessage): Promise<void>;
  batchUpdateTickets(ids: string[], updates: Partial<import('./models').SupportTicket>): Promise<void>;
  getTicketHealthMetrics(): Promise<{ slaCompliance: number; unassignedRate: number; totalActive: number }>;
  getCustomerSupportSummary(userId: string): Promise<{ totalTickets: number; resolvedCount: number; totalSpend: number; recentOrders: any[] }>;
  getMacros(): Promise<any[]>;
  addMacro(macro: { name: string; content: string; category: string; slug?: string }): Promise<void>;
  updateMacro(id: string, updates: Partial<{ name: string; content: string; category: string; slug: string }>): Promise<void>;
  deleteMacro(id: string): Promise<void>;
  markHeartbeat(ticketId: string, userId: string, userName: string): Promise<void>;
  getActiveViewers(ticketId: string, currentUserId: string): Promise<any[]>;
}

export interface IKnowledgebaseRepository {
  getCategories(): Promise<import('./models').KnowledgebaseCategory[]>;
  getArticles(options?: { categoryId?: string; type?: 'article' | 'blog'; status?: 'published' | 'draft' | 'all'; limit?: number; cursor?: string }): Promise<{ articles: import('./models').KnowledgebaseArticle[]; nextCursor?: string }>;
  getArticleById(id: string): Promise<import('./models').KnowledgebaseArticle | null>;
  getArticleBySlug(slug: string): Promise<import('./models').KnowledgebaseArticle | null>;

  searchArticles(queryString: string): Promise<import('./models').KnowledgebaseArticle[]>;
  getPopularArticles(limitVal?: number): Promise<import('./models').KnowledgebaseArticle[]>;
  addFeedback(articleId: string, isHelpful: boolean, userId?: string, reason?: string): Promise<void>;
  saveCategory(category: import('./models').KnowledgebaseCategory): Promise<void>;
  saveArticle(article: import('./models').KnowledgebaseArticle): Promise<void>;
  deleteArticle(id: string): Promise<void>;

  // Author management
  getAuthors(): Promise<import('./models').Author[]>;
  getAuthorById(id: string): Promise<import('./models').Author | null>;
  saveAuthor(author: import('./models').Author): Promise<void>;
  deleteAuthor(id: string): Promise<void>;

  // Comment management
  getComments(postId: string): Promise<import('./models').BlogComment[]>;
  getAllComments(): Promise<import('./models').BlogComment[]>;
  addComment(comment: Omit<import('./models').BlogComment, 'id' | 'createdAt' | 'updatedAt' | 'likes'>): Promise<import('./models').BlogComment>;

  updateCommentStatus(commentId: string, status: 'pending' | 'spam' | 'approved'): Promise<void>;
  deleteComment(commentId: string): Promise<void>;

  // CRM & Analytics
  subscribe(email: string, source: string): Promise<void>;
  getSubscribers(): Promise<import('./models').Subscriber[]>;
  trackEngagement(postId: string, type: 'view' | 'share', userId?: string): Promise<void>;
  incrementViewCount(postId: string): Promise<void>;

  // Batch Operations
  batchUpdateArticles(ids: string[], updates: Partial<import('./models').KnowledgebaseArticle>): Promise<void>;
  batchDeleteArticles(ids: string[]): Promise<void>;
}



export interface IShippingRepository {
  // Classes
  getAllClasses(): Promise<import('./models').ShippingClass[]>;
  getClassById(id: string): Promise<import('./models').ShippingClass | null>;
  saveClass(shippingClass: import('./models').ShippingClass): Promise<import('./models').ShippingClass>;
  deleteClass(id: string): Promise<void>;

  // Zones
  getAllZones(): Promise<import('./models').ShippingZone[]>;
  getZoneById(id: string): Promise<import('./models').ShippingZone | null>;
  saveZone(zone: import('./models').ShippingZone): Promise<import('./models').ShippingZone>;
  deleteZone(id: string): Promise<void>;

  // Rates
  getRatesByZone(zoneId: string): Promise<import('./models').ShippingRate[]>;
  getRatesByClass(classId: string): Promise<import('./models').ShippingRate[]>;
  saveRate(rate: import('./models').ShippingRate): Promise<import('./models').ShippingRate>;
  deleteRate(id: string): Promise<void>;
  getAllRates(): Promise<import('./models').ShippingRate[]>;
}

export interface IEmailService {
  sendEmail(params: {
    to: string;
    subject: string;
    text?: string;
    html?: string;
    from?: string;
    idempotencyKey?: string;
  }): Promise<void>;
  sendPasswordResetEmail(email: string, resetLink: string, idempotencyKey?: string): Promise<void>;
  sendPasswordChangedEmail(email: string, idempotencyKey?: string): Promise<void>;
}
