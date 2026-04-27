/**
 * [LAYER: DOMAIN]
 */
import type { Product, ProductDraft, ProductUpdate, Cart, Order, OrderStatus, User } from './models';

export interface IProductRepository {
  getAll(options?: {
    category?: string;
    query?: string;
    limit?: number;
    cursor?: string;
  }): Promise<{ products: Product[]; nextCursor?: string }>;
  getById(id: string): Promise<Product | null>;
  create(product: ProductDraft): Promise<Product>;
  update(id: string, updates: ProductUpdate): Promise<Product>;
  delete(id: string): Promise<void>;
  updateStock(id: string, delta: number): Promise<void>;
  batchUpdateStock?(updates: { id: string; delta: number }[]): Promise<void>;
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
  getByUserId(userId: string): Promise<Cart | null>;
  save(cart: Cart): Promise<void>;
  clear(userId: string): Promise<void>;
}

export interface IOrderRepository {
  create(order: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>): Promise<Order>;
  getById(id: string): Promise<Order | null>;
  getByUserId(userId: string): Promise<Order[]>;
  getAll(options?: {
    status?: OrderStatus;
    query?: string;
    limit?: number;
    cursor?: string;
  }): Promise<{ orders: Order[]; nextCursor?: string }>;
  updateStatus(id: string, status: OrderStatus): Promise<void>;
  batchUpdateStatus?(ids: string[], status: OrderStatus): Promise<void>;
  seed?(order: Order): Promise<void>;
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
}

export interface IAuthProvider {
  getCurrentUser(): Promise<User | null>;
  signIn(email: string, password: string): Promise<User>;
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
}

export interface ICheckoutGateway {
  finalizeCheckout(params: {
    userId: string;
    shippingAddress: import('./models').Address;
    paymentMethodId: string;
    idempotencyKey: string;
  }): Promise<Order>;
}

export interface ILockProvider {
  acquireLock(resourceId: string, owner: string, ttlMs?: number): Promise<boolean>;
  releaseLock(resourceId: string, owner: string): Promise<void>;
}

export interface IDiscountRepository {
  getAll(): Promise<any[]>;
  getById(id: string): Promise<any | null>;
  getByCode(code: string): Promise<any | null>;
  create(discount: any): Promise<any>;
  update(id: string, updates: any): Promise<any>;
  delete(id: string): Promise<void>;
  incrementUsage(id: string): Promise<void>;
}

export interface ITransferRepository {
  getAll(): Promise<import('./models').Transfer[]>;
  update(id: string, updates: Partial<import('./models').Transfer>): Promise<void>;
  create?(transfer: import('./models').Transfer): Promise<void>;
}

export interface ISettingsRepository {
  get<T>(key: string): Promise<T | null>;
  set(key: string, value: any): Promise<void>;
  getAll(): Promise<Record<string, any>>;
}