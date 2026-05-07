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
  runTransaction,
  serverTimestamp,
  arrayUnion,
  getCount,
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
      return await runTransaction(getUnifiedDb(), async (transaction: any) => {
        // 1. Strict Idempotency Check
        if (order.idempotencyKey) {
          const q = query(
            collection(getUnifiedDb(), this.collectionName), 
            where('idempotencyKey', '==', order.idempotencyKey), 
            limit(1)
          );
          const snapshot = await getDocs(q);
          if (!snapshot.empty) {
            const existing = this.mapDocToOrder(snapshot.docs[0].id, snapshot.docs[0].data());
            logger.info('Duplicate order detected via atomic idempotency check', { key: order.idempotencyKey, orderId: existing.id });
            return existing;
          }
        }

        // 2. Generate Identity and Timestamps
        const id = crypto.randomUUID();
        const now = new Date(); // We use local date for the object but serverTimestamp for the DB

        const orderData = {
          ...order,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          riskScore: await this.calculateRiskScore(order),
        };

        // 3. Commit Atomic Block
        const docRef = doc(getUnifiedDb(), this.collectionName, id);
        transaction.set(docRef, orderData);

        // Return a pessimistic view of the order (will be updated by subsequent reads)
        return {
          ...order,
          id,
          createdAt: now,
          updatedAt: now,
          riskScore: orderData.riskScore
        } as Order;
      });
    } catch (err) {
      logger.error('Order creation failed in atomic block', { order, err });
      throw err;
    }
  }

  async getById(id: string): Promise<Order | null> {
    const docSnap = await getDoc(doc(getUnifiedDb(), this.collectionName, id));
    if (!docSnap.exists()) return null;
    return this.mapDocToOrder(docSnap.id, docSnap.data());
  }

  async save(order: Order, transaction?: any): Promise<void> {
    const { id, ...data } = order;
    const docRef = doc(getUnifiedDb(), this.collectionName, id);
    const updateData = {
      ...data,
      updatedAt: serverTimestamp(),
    };

    if (transaction) {
      transaction.set(docRef, updateData);
    } else {
      await setDoc(docRef, updateData);
    }
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
    from?: Date;
    to?: Date;
  }): Promise<{ orders: Order[]; nextCursor?: string }> {
    let q = query(collection(getUnifiedDb(), this.collectionName), orderBy('createdAt', 'desc'));

    if (options?.status) {
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

  async updateStatus(id: string, status: OrderStatus, transaction?: any): Promise<void> {
    const docRef = doc(getUnifiedDb(), this.collectionName, id);
    const updateData = { 
      status, 
      updatedAt: serverTimestamp() 
    };

    if (transaction) {
      transaction.update(docRef, updateData);
    } else {
      await updateDoc(docRef, updateData);
    }
  }

  async batchUpdateStatus(ids: string[], status: OrderStatus): Promise<void> {
    const db = getUnifiedDb();
    const batch = writeBatch(db);
    for (const id of ids) {
      batch.update(doc(db, this.collectionName, id), {
        status,
        updatedAt: serverTimestamp()
      });
    }
    await batch.commit();
  }

  async updatePaymentTransactionId(id: string, paymentTransactionId: string): Promise<void> {
    await updateDoc(doc(getUnifiedDb(), this.collectionName, id), { 
      paymentTransactionId, 
      updatedAt: serverTimestamp() 
    });
  }

  async updateNotes(orderId: string, notes: import('@domain/models').OrderNote[]): Promise<void> {
    await updateDoc(doc(getUnifiedDb(), this.collectionName, orderId), { 
      notes, 
      updatedAt: serverTimestamp() 
    });
  }

  async updateFulfillment(orderId: string, data: { trackingNumber?: string; shippingCarrier?: string; trackingUrl?: string | null }): Promise<void> {
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
    const db = getUnifiedDb();
    const ordersCol = collection(db, this.collectionName);

    // 1. Get status counts using atomic aggregations (High Performance)
    const statuses: OrderStatus[] = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
    const countPromises = statuses.map(async (status) => {
      const count = await getCount(query(ordersCol, where('status', '==', status)));
      return { status, count };
    });
    const countResults = await Promise.all(countPromises);
    const orderCountsByStatus = countResults.reduce((acc, res) => {
      acc[res.status] = res.count;
      return acc;
    }, {} as Record<OrderStatus, number>);

    // 2. Get recent orders for revenue trends (Last 30 days window)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentQ = query(ordersCol, where('createdAt', '>=', Timestamp.fromDate(thirtyDaysAgo)));
    const snapshot = await getDocs(recentQ);

    let recentRevenue = 0;
    const dailyRevenue = new Array(7).fill(0);
    const now = new Date();

    snapshot.forEach((d: any) => {
      const data = d.data();
      const status = data.status as OrderStatus;
      if (status !== 'cancelled') {
        recentRevenue += data.total || 0;
        const createdAt = mapTimestamp(data.createdAt);
        const diffDays = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays >= 0 && diffDays < 7) {
          dailyRevenue[6 - diffDays] += data.total || 0;
        }
      }
    });

    // 3. For Total Revenue (Forensic Truth), we'd ideally use a summary doc. 
    // For now, we'll return recentRevenue as a floor, but in a real production app, 
    // this would be served from a 'stats/global' document updated by Cloud Functions.
    return { totalRevenue: recentRevenue, dailyRevenue, orderCountsByStatus };
  }

  async getTopProducts(limitVal: number): Promise<Array<{ id: string; name: string; revenue: number; sales: number }>> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const q = query(
      collection(getUnifiedDb(), this.collectionName), 
      where('createdAt', '>=', Timestamp.fromDate(thirtyDaysAgo))
    );
    const snapshot = await getDocs(q);
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

  async hasUsedDiscount(userId: string, discountCode: string): Promise<boolean> {
    const q = query(
      collection(getUnifiedDb(), this.collectionName),
      where('userId', '==', userId),
      where('discountCode', '==', discountCode),
      limit(1)
    );
    const snapshot = await getDocs(q);
    return !snapshot.empty;
  }
  async markHeartbeat(orderId: string, userId: string, email: string): Promise<void> {
    const claimId = `${orderId}_${userId}`;
    const docRef = doc(getUnifiedDb(), 'order_claims', claimId);
    await setDoc(docRef, {
      orderId,
      userId,
      email,
      lastActive: serverTimestamp()
    }, { merge: true });
  }

  async getActiveViewers(orderId: string): Promise<Array<{ userId: string, email: string, lastActive: Date }>> {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const q = query(
      collection(getUnifiedDb(), 'order_claims'),
      where('orderId', '==', orderId),
      where('lastActive', '>=', Timestamp.fromDate(fiveMinutesAgo))
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d: QueryDocumentSnapshot) => {
      const data = d.data();
      return {
        userId: data.userId,
        email: data.email,
        lastActive: (data.lastActive as any).toDate()
      };
    });
  }
}
