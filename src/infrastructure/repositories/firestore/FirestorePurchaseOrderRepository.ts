/**
 * [LAYER: INFRASTRUCTURE]
 * Firestore Implementation of Purchase Order Repository
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
  limit, 
  Timestamp,
  type DocumentData
} from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import type { IPurchaseOrderRepository } from '@domain/repositories';
import type { PurchaseOrder, PurchaseOrderStatus, ReceivingSession } from '@domain/models';

export class FirestorePurchaseOrderRepository implements IPurchaseOrderRepository {
  private readonly poCollection = 'purchase_orders';
  private readonly sessionCollection = 'receiving_sessions';

  private mapDocToPO(id: string, data: DocumentData): PurchaseOrder {
    return {
      ...data,
      id,
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
      updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(data.updatedAt),
      expectedAt: data.expectedAt ? (data.expectedAt instanceof Timestamp ? data.expectedAt.toDate() : new Date(data.expectedAt)) : undefined,
    } as PurchaseOrder;
  }

  async save(order: PurchaseOrder): Promise<PurchaseOrder> {
    const id = order.id || crypto.randomUUID();
    const now = Timestamp.now();
    const data = {
      ...order,
      id,
      updatedAt: now,
      createdAt: order.createdAt ? Timestamp.fromDate(new Date(order.createdAt)) : now,
      expectedAt: order.expectedAt ? Timestamp.fromDate(new Date(order.expectedAt)) : null,
    };
    await setDoc(doc(db, this.poCollection, id), data);
    return (await this.findById(id))!;
  }

  async findById(id: string): Promise<PurchaseOrder | null> {
    const docSnap = await getDoc(doc(db, this.poCollection, id));
    if (!docSnap.exists()) return null;
    return this.mapDocToPO(docSnap.id, docSnap.data());
  }

  async findAll(options?: {
    status?: PurchaseOrderStatus;
    supplier?: string;
    limit?: number;
    offset?: number;
  }): Promise<PurchaseOrder[]> {
    let q = query(collection(db, this.poCollection), orderBy('createdAt', 'desc'));
    if (options?.status) q = query(q, where('status', '==', options.status));
    if (options?.supplier) q = query(q, where('supplier', '==', options.supplier));
    if (options?.limit) q = query(q, limit(options.limit));
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => this.mapDocToPO(d.id, d.data()));
  }

  async count(options?: { status?: PurchaseOrderStatus }): Promise<number> {
    let q = query(collection(db, this.poCollection));
    if (options?.status) q = query(q, where('status', '==', options.status));
    const snapshot = await getDocs(q);
    return snapshot.size;
  }

  async updateStatus(id: string, status: PurchaseOrderStatus): Promise<PurchaseOrder> {
    await updateDoc(doc(db, this.poCollection, id), { status, updatedAt: Timestamp.now() });
    return (await this.findById(id))!;
  }

  async saveReceivingSession(session: ReceivingSession): Promise<ReceivingSession> {
    const id = session.id || crypto.randomUUID();
    const data = {
      ...session,
      id,
      receivedAt: Timestamp.fromDate(new Date(session.receivedAt)),
      completedAt: session.completedAt ? Timestamp.fromDate(new Date(session.completedAt)) : null,
    };
    await setDoc(doc(db, this.sessionCollection, id), data);
    return session;
  }

  async findReceivingSessions(purchaseOrderId: string): Promise<ReceivingSession[]> {
    const q = query(collection(db, this.sessionCollection), where('purchaseOrderId', '==', purchaseOrderId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({
      ...d.data(),
      id: d.id,
      receivedAt: d.data().receivedAt.toDate(),
      completedAt: d.data().completedAt?.toDate(),
    } as ReceivingSession));
  }

  async findReceivingSessionByIdempotencyKey(purchaseOrderId: string, idempotencyKey: string): Promise<ReceivingSession | null> {
    const q = query(
      collection(db, this.sessionCollection), 
      where('purchaseOrderId', '==', purchaseOrderId),
      where('idempotencyKey', '==', idempotencyKey),
      limit(1)
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    const d = snapshot.docs[0];
    return {
      ...d.data(),
      id: d.id,
      receivedAt: d.data().receivedAt.toDate(),
      completedAt: d.data().completedAt?.toDate(),
    } as ReceivingSession;
  }
}

// Helper to use orderBy which requires a secondary index or simple query
import { orderBy } from 'firebase/firestore';
