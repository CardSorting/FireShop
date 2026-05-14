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
  increment,
  getCount,
  type DocumentData,
  type QueryDocumentSnapshot
} from '../../firebase/bridge';
import { logger } from '@utils/logger';
import type { IOrderRepository } from '@domain/repositories';
import type { Address, Order, OrderItem, OrderStatus, OrderStats } from '@domain/models';


import { mapDoc, mapTimestamp } from './utils';

export class FirestoreOrderRepository implements IOrderRepository {
  private readonly collectionName = 'orders';
  private readonly statsDocPath = 'system_state/order_stats';


  private mapDocToOrder(id: string, data: DocumentData): Order {
    return mapDoc<Order>(id, data);
  }

  async create(order: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>, transaction?: any): Promise<Order> {
    const db = getUnifiedDb();
    const operation = async (t: any) => {
      // 1. Strict Idempotency Check (Transactional Point-Read)
      if (order.idempotencyKey) {
        const idempRef = doc(db, 'order_idempotency_keys', order.idempotencyKey);
        const idempSnap = await t.get(idempRef);
        
        if (idempSnap.exists()) {
          const { orderId } = idempSnap.data();
          // Production Hardening: Use transactional point-read instead of non-transactional getById
          // to maintain ACID guarantees within the idempotency check.
          const existingRef = doc(db, this.collectionName, orderId);
          const existingSnap = await t.get(existingRef);
          if (existingSnap.exists()) {
            logger.info('Duplicate order detected via atomic idempotency check', { key: order.idempotencyKey, orderId });
            return this.mapDocToOrder(existingSnap.id, existingSnap.data());
          }
        }
      }

      // 2. Generate Identity and Timestamps
      const id = crypto.randomUUID();
      const now = new Date();

      const orderData = {
        ...order,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        riskScore: await this.calculateRiskScore(order),
      };

      // 3. Commit Atomic Block
      const docRef = doc(db, this.collectionName, id);
      t.set(docRef, orderData);

      if (order.idempotencyKey) {
        const idempRef = doc(db, 'order_idempotency_keys', order.idempotencyKey);
        t.set(idempRef, { orderId: id, createdAt: serverTimestamp() });
      }

      if (order.paymentTransactionId) {
        const payRef = doc(db, 'order_payment_intent_map', order.paymentTransactionId);
        t.set(payRef, { orderId: id, createdAt: serverTimestamp() });
      }

      // 4. Update Sovereign Stats (Atomic)
      this.applyOrderStatsDeltas(t, {
        revenueDelta: order.total,
        orderDelta: 1,
        statusChanges: [{ to: order.status }]
      });


      return {
        ...order,
        id,
        createdAt: now,
        updatedAt: now,
        riskScore: orderData.riskScore
      } as Order;
    };

    if (transaction) {
      return await operation(transaction);
    } else {
      return await runTransaction(db, operation);
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

  async getByPaymentTransactionIdTransactional(id: string, transaction: any): Promise<Order | null> {
    const mapRef = doc(getUnifiedDb(), 'order_payment_intent_map', id);
    const mapSnap = await transaction.get(mapRef);
    
    if (!mapSnap.exists()) return null;
    
    const { orderId } = mapSnap.data();
    const orderRef = doc(getUnifiedDb(), this.collectionName, orderId);
    const orderSnap = await transaction.get(orderRef);
    
    if (!orderSnap.exists()) return null;
    return this.mapDocToOrder(orderSnap.id, orderSnap.data());
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
    const db = getUnifiedDb();
    const docRef = doc(db, this.collectionName, id);
    
    const operation = async (t: any) => {
      const snap = await t.get(docRef);
      if (!snap.exists()) return;
      const oldStatus = snap.data().status as OrderStatus;
      
      t.update(docRef, { 
        status, 
        updatedAt: serverTimestamp() 
      });

      if (oldStatus !== status) {
        this.applyOrderStatsDeltas(t, {
          statusChanges: [{ from: oldStatus, to: status }]
        });
      }
    };

    if (transaction) {
      await operation(transaction);
    } else {
      await runTransaction(db, operation);
    }
  }

  async batchUpdateStatus(ids: string[], status: OrderStatus): Promise<void> {
    const db = getUnifiedDb();
    await runTransaction(db, async (t: any) => {
      const statusChanges: { from: OrderStatus; to: OrderStatus }[] = [];
      
      for (const id of ids) {
        const docRef = doc(db, this.collectionName, id);
        const snap = await t.get(docRef);
        if (snap.exists()) {
          const oldStatus = snap.data().status as OrderStatus;
          if (oldStatus !== status) {
            t.update(docRef, { status, updatedAt: serverTimestamp() });
            statusChanges.push({ from: oldStatus, to: status });
          }
        }
      }

      if (statusChanges.length > 0) {
        this.applyOrderStatsDeltas(t, { statusChanges });
      }
    });
  }


  async updatePaymentTransactionId(id: string, paymentTransactionId: string): Promise<void> {
    const db = getUnifiedDb();
    // Production Hardening: Atomically update both the order doc AND the PI→Order lookup map.
    // Without the map write, finalizeOrderPayment (called by webhook) cannot resolve the order
    // via getByPaymentTransactionIdTransactional.
    await runTransaction(db, async (t: any) => {
      const orderRef = doc(db, this.collectionName, id);
      t.update(orderRef, { 
        paymentTransactionId, 
        updatedAt: serverTimestamp() 
      });
      const mapRef = doc(db, 'order_payment_intent_map', paymentTransactionId);
      t.set(mapRef, { orderId: id, createdAt: serverTimestamp() });
    });
  }



  async updateFulfillment(orderId: string, data: { trackingNumber?: string; shippingCarrier?: string; trackingUrl?: string | null }, transaction?: any): Promise<void> {
    const docRef = doc(getUnifiedDb(), this.collectionName, orderId);
    const updateData = { ...data, updatedAt: serverTimestamp() };
    if (transaction) transaction.update(docRef, updateData);
    else await updateDoc(docRef, updateData);
  }

  async updateRiskScore(orderId: string, score: number, transaction?: any): Promise<void> {
    const docRef = doc(getUnifiedDb(), this.collectionName, orderId);
    const data = { riskScore: score, updatedAt: serverTimestamp() };
    if (transaction) transaction.update(docRef, data);
    else await updateDoc(docRef, data);
  }

  async recordRefund(orderId: string, amount: number, transaction?: any): Promise<void> {
    const docRef = doc(getUnifiedDb(), this.collectionName, orderId);
    const data = { 
      refundedAmount: increment(amount), 
      updatedAt: serverTimestamp() 
    };
    if (transaction) transaction.update(docRef, data);
    else await updateDoc(docRef, data);
  }

  async markForReconciliation(orderId: string, notes: string[], appendOnly = false): Promise<void> {
    const docRef = doc(getUnifiedDb(), this.collectionName, orderId);
    const payload: Record<string, any> = {
      reconciliationNotes: arrayUnion(...notes),
      updatedAt: serverTimestamp()
    };
    // appendOnly=true: used during resolution to record notes without re-locking the order
    if (!appendOnly) payload.reconciliationRequired = true;
    await updateDoc(docRef, payload);
  }

  async clearReconciliationFlag(orderId: string, transaction?: any): Promise<void> {
    const docRef = doc(getUnifiedDb(), this.collectionName, orderId);
    const data = { 
      reconciliationRequired: false, 
      updatedAt: serverTimestamp() 
    };
    if (transaction) transaction.update(docRef, data);
    else await updateDoc(docRef, data);
  }

  async updateMetadata(orderId: string, metadata: Record<string, any>, transaction?: any): Promise<void> {
    const docRef = doc(getUnifiedDb(), this.collectionName, orderId);
    
    // PRODUCTION HARDENING: Transform the metadata object into dot-notation updates
    // to prevent overwriting the entire metadata map. This ensures atomic property updates.
    const updates: Record<string, any> = {
      updatedAt: serverTimestamp()
    };
    
    Object.entries(metadata).forEach(([key, value]) => {
      updates[`metadata.${key}`] = value;
    });

    if (transaction) transaction.update(docRef, updates);
    else await updateDoc(docRef, updates);
  }

  async addFulfillmentEvent(orderId: string, event: import('@domain/models').OrderFulfillmentEvent, transaction?: any): Promise<void> {
    const docRef = doc(getUnifiedDb(), this.collectionName, orderId);
    const data = { fulfillmentEvents: arrayUnion(event), updatedAt: serverTimestamp() };
    if (transaction) transaction.update(docRef, data);
    else await updateDoc(docRef, data);
  }

  async addNote(orderId: string, note: import('@domain/models').OrderNote, transaction?: any): Promise<void> {
    const docRef = doc(getUnifiedDb(), this.collectionName, orderId);
    const data = { notes: arrayUnion(note), updatedAt: serverTimestamp() };
    if (transaction) transaction.update(docRef, data);
    else await updateDoc(docRef, data);
  }

  async getOrderStats(): Promise<OrderStats> {
    const db = getUnifiedDb();
    const statsSnap = await getDoc(doc(db, this.statsDocPath));
    if (!statsSnap.exists()) {
      // Fallback to manual aggregation for initialization (First run)
      return this.initializeOrderStats();
    }
    return statsSnap.data() as OrderStats;
  }

  async getDashboardStats(): Promise<OrderStats> {
    return this.getOrderStats();
  }

  private async initializeOrderStats(): Promise<OrderStats> {
    logger.info('[Stats] Initializing order stats via collection scan...');
    const db = getUnifiedDb();
    const snapshot = await getDocs(collection(db, this.collectionName));
    
    const stats: OrderStats = {
      totalRevenue: 0,
      totalOrders: 0,
      orderCountsByStatus: {} as any,
      dailyRevenue: {},
      updatedAt: new Date()
    };

    snapshot.forEach((d: any) => {
      const data = d.data();
      const status = data.status as OrderStatus;
      if (status !== 'cancelled' && status !== 'refunded') {
        stats.totalRevenue += data.total || 0;
        const createdAt = mapTimestamp(data.createdAt);
        const day = createdAt.toISOString().split('T')[0];
        stats.dailyRevenue[day] = (stats.dailyRevenue[day] || 0) + (data.total || 0);
      }
      stats.totalOrders++;
      stats.orderCountsByStatus[status] = (stats.orderCountsByStatus[status] || 0) + 1;
    });

    await setDoc(doc(db, this.statsDocPath), stats);
    return stats;
  }

  private applyOrderStatsDeltas(t: any, updates: { 
    revenueDelta?: number; 
    orderDelta?: number; 
    statusChanges?: { from?: OrderStatus; to: OrderStatus }[] 
  }) {
    const db = getUnifiedDb();
    const statsRef = doc(db, this.statsDocPath);
    
    const firestoreUpdates: any = {
      updatedAt: serverTimestamp()
    };

    if (updates.revenueDelta) {
      firestoreUpdates.totalRevenue = increment(updates.revenueDelta);
      const today = new Date().toISOString().split('T')[0];
      firestoreUpdates[`dailyRevenue.${today}`] = increment(updates.revenueDelta);
    }
    
    if (updates.orderDelta) {
      firestoreUpdates.totalOrders = increment(updates.orderDelta);
    }

    if (updates.statusChanges) {
      const increments: Record<string, number> = {};
      for (const change of updates.statusChanges) {
        if (change.from) {
          increments[change.from] = (increments[change.from] || 0) - 1;
        }
        increments[change.to] = (increments[change.to] || 0) + 1;
      }

      for (const [status, delta] of Object.entries(increments)) {
        if (delta !== 0) {
          firestoreUpdates[`orderCountsByStatus.${status}`] = increment(delta);
        }
      }
    }

    t.set(statsRef, firestoreUpdates, { merge: true });
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

    // 1. Stripe Radar Integration (Primary Signal)
    // If Stripe has already performed advanced ML risk analysis, we weight it heavily.
    const stripeRisk = order.metadata?.stripe_risk_score; // 0-100
    if (typeof stripeRisk === 'number') {
      return stripeRisk; // Trust Stripe's ML substrate
    }

    // 2. Velocity Check: Rapid successive orders from same user
    if (order.userId) {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      const recent = await this.getByUserId(order.userId, { from: fiveMinutesAgo, limit: 10 });
      if (recent.orders.length >= 3) score += 40; // High velocity
      if (recent.orders.length >= 1) score += 5;
    }

    // 3. Email Reputation (Forensic Discovery)
    const disposableDomains = ['tempmail.com', '10minutemail.com', 'guerrillamail.com', 'sharklasers.com', 'mailinator.com'];
    const email = (order.customerEmail || '').toLowerCase();
    if (disposableDomains.some(domain => email.endsWith(domain))) {
      score += 50; // Extremely high risk signal
    }

    // 4. Threshold & Volume Checks
    if (order.total > 50000) score += 10; // >$500
    if (order.total > 150000) score += 25; // >$1500
    if (!order.userId && order.total > 20000) score += 20; // Unauthenticated high-value

    const totalQty = order.items.reduce((sum, i) => sum + i.quantity, 0);
    if (totalQty > 20) score += 15;
    
    // 5. Geographical Signals
    const country = (order.shippingAddress.country || '').toUpperCase();
    if (country !== 'US' && country !== 'CA' && country !== 'GB' && country !== 'AU') {
      score += 20; // International non-primary markets
    }

    // 6. Heuristics: High-risk item combinations
    const hasDigital = order.items.some(i => i.isDigital);
    const hasPhysical = order.items.some(i => !i.isDigital);
    if (hasDigital && hasPhysical) score += 10;

    const hasExpensiveItem = order.items.some(i => i.unitPrice > 30000); // >$300 item
    if (hasExpensiveItem) score += 15;

    return Math.min(score, 100);
  }

  async hasUsedDiscount(userId: string, discountCode: string): Promise<boolean> {
    // Production Hardening: Exclude cancelled/refunded orders from usage check.
    const q = query(
      collection(getUnifiedDb(), this.collectionName),
      where('userId', '==', userId),
      where('discountCode', '==', discountCode),
      limit(10)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.some((d: QueryDocumentSnapshot) => {
      const status = d.data().status;
      return status !== 'cancelled' && status !== 'refunded';
    });
  }

  /**
   * Transactional check for user-specific discount usage.
   * Uses a dedicated document to ensure atomicity via point-read (t.get).
   */
  async checkUserDiscountUsage(userId: string, discountCode: string, transaction: any): Promise<boolean> {
    const id = `${userId}_${discountCode}`;
    const docRef = doc(getUnifiedDb(), 'user_discount_usage', id);
    const docSnap = await transaction.get(docRef);
    return docSnap.exists();
  }

  /**
   * Records a user's discount usage atomically.
   */
  async recordUserDiscountUsage(userId: string, discountCode: string, transaction: any): Promise<void> {
    const id = `${userId}_${discountCode}`;
    const docRef = doc(getUnifiedDb(), 'user_discount_usage', id);
    transaction.set(docRef, { used: true, usedAt: serverTimestamp() });
  }
  
  async removeUserDiscountUsage(userId: string, discountCode: string, transaction: any): Promise<void> {
    const id = `${userId}_${discountCode}`;
    const docRef = doc(getUnifiedDb(), 'user_discount_usage', id);
    transaction.delete(docRef);
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

  async getLogisticsStats(): Promise<{
    avgFulfillmentTimeHours: number;
    onTimeDeliveryRate: number;
    carrierPerformance: Record<string, { avgTransitDays: number; breachRate: number }>;
    shippingProfitability: number;
  }> {
    const db = getUnifiedDb();
    // We fetch a sample of delivered orders to calculate performance
    const q = query(
      collection(db, this.collectionName), 
      where('status', '==', 'delivered'),
      limit(500)
    );
    const snapshot = await getDocs(q);
    
    let totalFulfillmentTimeMs = 0;
    let deliveredCount = 0;
    let onTimeCount = 0;
    let totalShippingRevenue = 0;
    let totalShippingCost = 0;

    const carrierStats: Record<string, { totalTransitTimeMs: number; count: number; breaches: number }> = {};

    snapshot.forEach((d: any) => {
      const data = d.data();
      const createdAt = mapTimestamp(data.createdAt);
      const updatedAt = mapTimestamp(data.updatedAt);
      
      totalFulfillmentTimeMs += (updatedAt.getTime() - createdAt.getTime());
      deliveredCount++;

      // On-time calculation
      if (data.estimatedDeliveryDate) {
        const estimated = mapTimestamp(data.estimatedDeliveryDate);
        if (updatedAt <= estimated) onTimeCount++;
      }

      totalShippingRevenue += data.shippingAmount || 0;
      // In a real app, costs would be tracked in fulfillments
      const totalCost = (data.fulfillments || []).reduce((sum: number, f: any) => sum + (f.cost || 0), 0);
      totalShippingCost += totalCost;

      // Carrier stats
      (data.fulfillments || []).forEach((f: any) => {
        const carrier = f.shippingCarrier || 'Unknown';
        if (!carrierStats[carrier]) {
          carrierStats[carrier] = { totalTransitTimeMs: 0, count: 0, breaches: 0 };
        }
        
        const fEvents = data.fulfillmentEvents || [];
        const shippedEvent = fEvents.find((e: any) => e.type === 'shipped');
        const deliveredEvent = fEvents.find((e: any) => e.type === 'delivered');
        
        if (shippedEvent && deliveredEvent) {
          const transitTime = mapTimestamp(deliveredEvent.at).getTime() - mapTimestamp(shippedEvent.at).getTime();
          carrierStats[carrier].totalTransitTimeMs += transitTime;
          carrierStats[carrier].count++;
          
          if (data.estimatedDeliveryDate && mapTimestamp(deliveredEvent.at) > mapTimestamp(data.estimatedDeliveryDate)) {
            carrierStats[carrier].breaches++;
          }
        }
      });
    });

    const performance: Record<string, { avgTransitDays: number; breachRate: number }> = {};
    for (const [carrier, stats] of Object.entries(carrierStats)) {
      performance[carrier] = {
        avgTransitDays: stats.count > 0 ? (stats.totalTransitTimeMs / stats.count) / (1000 * 60 * 60 * 24) : 0,
        breachRate: stats.count > 0 ? stats.breaches / stats.count : 0
      };
    }

    return {
      avgFulfillmentTimeHours: deliveredCount > 0 ? (totalFulfillmentTimeMs / deliveredCount) / (1000 * 60 * 60) : 0,
      onTimeDeliveryRate: deliveredCount > 0 ? (onTimeCount / deliveredCount) * 100 : 100,
      carrierPerformance: performance,
      shippingProfitability: totalShippingRevenue - totalShippingCost
    };
  }
}
