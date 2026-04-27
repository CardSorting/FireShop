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
    limit?: number;
    cursor?: string;
  }): Promise<{ orders: Order[]; nextCursor?: string }>;
  updateStatus(id: string, status: OrderStatus): Promise<void>;
  batchUpdateStatus?(ids: string[], status: OrderStatus): Promise<void>;
  seed?(order: Order): Promise<void>;
}

export interface IAuthProvider {
  getCurrentUser(): Promise<User | null>;
  signIn(email: string, password: string): Promise<User>;
  signUp(email: string, password: string, displayName: string): Promise<User>;
  signOut(): Promise<void>;
  onAuthStateChanged(callback: (user: User | null) => void): () => void;
  getAllUsers?(): Promise<User[]>;
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

export interface ISettingsRepository {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T): Promise<void>;
  getAll(): Promise<Record<string, any>>;
}