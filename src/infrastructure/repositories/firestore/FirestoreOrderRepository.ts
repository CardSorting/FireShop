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
  serverTimestamp,
  arrayUnion,
  type DocumentData,
  type QueryDocumentSnapshot
} from '../../firebase/bridge';
import { logger } from '@utils/logger';
import type { IOrderRepository } from '@domain/repositories';
import type { Address, Order, OrderItem, OrderStatus } from '@domain/models';

import { mapDoc, mapTimestamp } from './utils';

export class FirestoreOrderRepository implements IOrderRepository {
  private readonly collectionName = 'orders';

  private mapDocToOrder(id: string, data: DocumentData): Order {
    return mapDoc<Order>(id, data);
  }

  async create(order: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>): Promise<Order> {
    try {
      if (order.idempotencyKey) {
        const existing = await this.getByIdempotencyKey(order.idempotencyKey);
        if (existing) {
          logger.info('Duplicate order detected via idempotency key', { key: order.idempotencyKey });
          return existing;
        }
      }

      const id = crypto.randomUUID();
      const now = serverTimestamp();

      const orderData = {
        ...order,
        createdAt: now,
        updatedAt: now,
        riskScore: await this.calculateRiskScore(order),
      };

      await setDoc(doc(getUnifiedDb(), this.collectionName, id), orderData);
      const result = await this.getById(id);
      if (!result) throw new Error(`Failed to retrieve newly created order: ${id}`);
      return result;
    } catch (err) {
      logger.error('Order creation failed', { order, err });
      throw err;
    }
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

  async getByUserId(userId: string, options?: {
    status?: OrderStatus | 'all';
    limit?: number;
    cursor?: string;
    from?: Date;
    to?: Date;
  }): Promise<{ orders: Order[]; nextCursor?: string }> {
    let q = query(
      collection(getUnifiedDb(), this.collectionName), 
      where('userId', '==', userId), 
      orderBy('createdAt', 'desc')
    );

    if (options?.status && options.status !== 'all') {
      q = query(q, where('status', '==', options.status));
    }

    if (options?.from) {
      q = query(q, where('createdAt', '>=', Timestamp.fromDate(options.from)));
    }

    if (options?.to) {
      q = query(q, where('createdAt', '<=', Timestamp.fromDate(options.to)));
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
    await updateDoc(doc(getUnifiedDb(), this.collectionName, id), { 
      status, 
      updatedAt: serverTimestamp() 
    });
  }

  async updatePaymentTransactionId(id: string, paymentTransactionId: string): Promise<void> {
    await updateDoc(doc(getUnifiedDb(), this.collectionName, id), { 
      paymentTransactionId, 
      updatedAt: serverTimestamp() 
    });
  }

  async batchUpdateStatus(ids: string[], status: OrderStatus): Promise<void> {
    const batch = writeBatch(getUnifiedDb());
    const now = serverTimestamp();
    for (const id of ids) {
      batch.update(doc(getUnifiedDb(), this.collectionName, id), { status, updatedAt: now });
    }
    await batch.commit();
  }

  async updateNotes(orderId: string, notes: import('@domain/models').OrderNote[]): Promise<void> {
    await updateDoc(doc(getUnifiedDb(), this.collectionName, orderId), { 
      notes, 
      updatedAt: serverTimestamp() 
    });
  }

  async updateFulfillment(orderId: string, data: { trackingNumber?: string; shippingCarrier?: string }): Promise<void> {
    await updateDoc(doc(getUnifiedDb(), this.collectionName, orderId), { 
      ...data, 
      updatedAt: serverTimestamp() 
    });
  }

  async updateRiskScore(orderId: string, score: number): Promise<void> {
    await updateDoc(doc(getUnifiedDb(), this.collectionName, orderId), { 
      riskScore: score, 
      updatedAt: serverTimestamp() 
    });
  }

  async addFulfillmentEvent(orderId: string, event: import('@domain/models').OrderFulfillmentEvent): Promise<void> {
    await updateDoc(doc(getUnifiedDb(), this.collectionName, orderId), {
      fulfillmentEvents: arrayUnion(event),
      updatedAt: serverTimestamp()
    });
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

  private async calculateRiskScore(order: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>): Promise<number> {
    let score = 5; // Base score

    // Velocity Check: Rapid successive orders from same user
    if (order.userId) {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      const recent = await this.getByUserId(order.userId, { from: fiveMinutesAgo, limit: 10 });
      if (recent.orders.length >= 3) score += 40; // High velocity
      if (recent.orders.length >= 1) score += 5;
    }

    // Threshold Checks
    if (order.total > 50000) score += 10; // >$500
    if (order.total > 150000) score += 25; // >$1500

    // Volume Checks
    const totalQty = order.items.reduce((sum, i) => sum + i.quantity, 0);
    if (totalQty > 20) score += 15;
    
    // Geographical Checks
    const country = order.shippingAddress.country.toUpperCase();
    if (country !== 'US' && country !== 'CA' && country !== 'GB') {
      score += 20; // International non-primary markets
    }

    // Heuristics: High-risk item combinations
    const hasDigital = order.items.some(i => i.isDigital);
    const hasPhysical = order.items.some(i => !i.isDigital);
    if (hasDigital && hasPhysical) {
      score += 10; // Mixed orders can be harder to verify
    }

    // Heuristics: High-value items
    const hasExpensiveItem = order.items.some(i => i.unitPrice > 30000); // >$300 item
    if (hasExpensiveItem) score += 15;

    return Math.min(score, 100);
  }
}
