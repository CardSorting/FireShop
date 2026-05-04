/**
 * [LAYER: INFRASTRUCTURE]
 * Firestore Implementation of Order Repository
 */
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter, 
  Timestamp,
  writeBatch,
  getUnifiedDb,
  type DocumentData,
  type QueryDocumentSnapshot
} from '../../firebase/bridge';
import type { IOrderRepository } from '@domain/repositories';
import type { Address, Order, OrderItem, OrderStatus } from '@domain/models';

import { mapDoc, mapTimestamp } from './utils';

export class FirestoreOrderRepository implements IOrderRepository {
  private readonly collectionName = 'orders';

  private mapDocToOrder(id: string, data: DocumentData): Order {
    return mapDoc<Order>(id, data);
  }

  async create(order: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>): Promise<Order> {
    if (order.idempotencyKey) {
      const existing = await this.getByIdempotencyKey(order.idempotencyKey);
      if (existing) return existing;
    }

    const id = crypto.randomUUID();
    const now = Timestamp.now();

    const orderData = {
      ...order,
      createdAt: now,
      updatedAt: now,
      riskScore: this.calculateRiskScore(order),
    };

    await setDoc(doc(getUnifiedDb(), this.collectionName, id), orderData);
    return (await this.getById(id))!;
  }

  async getById(id: string): Promise<Order | null> {
    const docSnap = await getDoc(doc(getUnifiedDb(), this.collectionName, id));
    if (!docSnap.exists()) return null;
    return this.mapDocToOrder(docSnap.id, docSnap.data());
  }

  async getByIdempotencyKey(key: string): Promise<Order | null> {
    const q = query(collection(getUnifiedDb(), this.collectionName), where('idempotencyKey', '==', key), limit(1));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    return this.mapDocToOrder(snapshot.docs[0].id, snapshot.docs[0].data());
  }

  async getByPaymentTransactionId(id: string): Promise<Order | null> {
    const q = query(collection(getUnifiedDb(), this.collectionName), where('paymentTransactionId', '==', id), limit(1));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    return this.mapDocToOrder(snapshot.docs[0].id, snapshot.docs[0].data());
  }

  async getByUserId(userId: string): Promise<Order[]> {
    const q = query(collection(getUnifiedDb(), this.collectionName), where('userId', '==', userId), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d: QueryDocumentSnapshot) => this.mapDocToOrder(d.id, d.data() as any));
  }

  async getAll(options?: {
    status?: OrderStatus;
    query?: string;
    limit?: number;
    cursor?: string;
  }): Promise<{ orders: Order[]; nextCursor?: string }> {
    let q = query(collection(getUnifiedDb(), this.collectionName), orderBy('createdAt', 'desc'));

    if (options?.status) {
      q = query(q, where('status', '==', options.status));
    }

    const limitVal = options?.limit ?? 20;
    q = query(q, limit(limitVal + 1));

    if (options?.cursor) {
      const cursorDoc = await getDoc(doc(getUnifiedDb(), this.collectionName, options.cursor));
      if (cursorDoc.exists()) {
        q = query(q, startAfter(cursorDoc));
      }
    }

    const snapshot = await getDocs(q);
    const results = snapshot.docs.map((d: QueryDocumentSnapshot) => this.mapDocToOrder(d.id, d.data() as any));
    
    const hasNextPage = results.length > limitVal;
    const orders = results.slice(0, limitVal);
    const nextCursor = hasNextPage ? orders[orders.length - 1].id : undefined;

    return { orders, nextCursor };
  }

  async updateStatus(id: string, status: OrderStatus): Promise<void> {
    await updateDoc(doc(getUnifiedDb(), this.collectionName, id), { status, updatedAt: Timestamp.now() });
  }

  async updatePaymentTransactionId(id: string, paymentTransactionId: string): Promise<void> {
    await updateDoc(doc(getUnifiedDb(), this.collectionName, id), { paymentTransactionId, updatedAt: Timestamp.now() });
  }

  async batchUpdateStatus(ids: string[], status: OrderStatus): Promise<void> {
    const batch = writeBatch(getUnifiedDb());
    const now = Timestamp.now();
    for (const id of ids) {
      batch.update(doc(getUnifiedDb(), this.collectionName, id), { status, updatedAt: now });
    }
    await batch.commit();
  }

  async updateNotes(orderId: string, notes: import('@domain/models').OrderNote[]): Promise<void> {
    await updateDoc(doc(getUnifiedDb(), this.collectionName, orderId), { notes, updatedAt: Timestamp.now() });
  }

  async updateFulfillment(orderId: string, data: { trackingNumber?: string; shippingCarrier?: string }): Promise<void> {
    await updateDoc(doc(getUnifiedDb(), this.collectionName, orderId), { ...data, updatedAt: Timestamp.now() });
  }

  async updateRiskScore(orderId: string, score: number): Promise<void> {
    await updateDoc(doc(getUnifiedDb(), this.collectionName, orderId), { riskScore: score, updatedAt: Timestamp.now() });
  }

  async getDashboardStats(): Promise<{
    totalRevenue: number;
    dailyRevenue: number[];
    orderCountsByStatus: Record<OrderStatus, number>;
  }> {
    const snapshot = await getDocs(collection(getUnifiedDb(), this.collectionName));
    const orderCountsByStatus: Record<OrderStatus, number> = {
      pending: 0,
      confirmed: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
    };
    let totalRevenue = 0;
    const dailyRevenue = new Array(7).fill(0);
    const now = new Date();

    snapshot.forEach((d: any) => {
      const data = d.data();
      const status = data.status as OrderStatus;
      if (orderCountsByStatus[status] !== undefined) {
        orderCountsByStatus[status]++;
      }
      if (status !== 'cancelled') {
        totalRevenue += data.total || 0;
        
        const createdAt = mapTimestamp(data.createdAt);
        const diffDays = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays >= 0 && diffDays < 7) {
          dailyRevenue[6 - diffDays] += data.total || 0;
        }
      }
    });

    return { totalRevenue, dailyRevenue, orderCountsByStatus };
  }

  async getTopProducts(limitVal: number): Promise<Array<{ id: string; name: string; revenue: number; sales: number }>> {
    const snapshot = await getDocs(collection(getUnifiedDb(), this.collectionName));
    const productStats: Record<string, { name: string; revenue: number; sales: number }> = {};

    snapshot.forEach((d: any) => {
      const data = d.data();
      if (data.status === 'cancelled') return;
      
      const items = (data.items || []) as OrderItem[];
      items.forEach(item => {
        if (!productStats[item.productId]) {
          productStats[item.productId] = { name: item.name, revenue: 0, sales: 0 };
        }
        productStats[item.productId].revenue += item.unitPrice * item.quantity;
        productStats[item.productId].sales += item.quantity;
      });
    });

    return Object.entries(productStats)
      .map(([id, stats]) => ({ id, ...stats }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, limitVal);
  }

  private calculateRiskScore(order: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>): number {
    let score = 5;
    if (order.total > 100000) score += 20;
    const itemCount = order.items.reduce((sum, i) => sum + i.quantity, 0);
    if (itemCount > 10) score += 10;
    if (order.shippingAddress.country.toUpperCase() !== 'US') score += 15;
    return Math.min(score, 100);
  }
}
