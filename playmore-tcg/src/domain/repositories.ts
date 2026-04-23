/**
 * [LAYER: DOMAIN]
 */
import type { Product, Cart, Order, OrderStatus, User } from './models';

export interface IProductRepository {
  getAll(options?: {
    category?: string;
    limit?: number;
    cursor?: string;
  }): Promise<{ products: Product[]; nextCursor?: string }>;
  getById(id: string): Promise<Product | null>;
  create(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product>;
  update(id: string, updates: Partial<Product>): Promise<Product>;
  delete(id: string): Promise<void>;
  updateStock(id: string, delta: number): Promise<void>;
  batchUpdateStock?(updates: { id: string; delta: number }[]): Promise<void>;
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
}

export interface IAuthProvider {
  getCurrentUser(): Promise<User | null>;
  signIn(email: string, password: string): Promise<User>;
  signUp(email: string, password: string, displayName: string): Promise<User>;
  signOut(): Promise<void>;
  onAuthStateChanged(callback: (user: User | null) => void): () => void;
}

export interface IPaymentProcessor {
  processPayment(params: {
    amount: number;
    orderId: string;
    paymentMethodId?: string;
  }): Promise<{ success: boolean; transactionId: string | null }>;
}