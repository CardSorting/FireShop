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
  orderBy,
  Timestamp,
  getUnifiedDb,
  serverTimestamp,
  type DocumentData,
  type QueryDocumentSnapshot,
  type Transaction
} from '../../firebase/bridge';
import { logger } from '@utils/logger';
import type { IPurchaseOrderRepository } from '@domain/repositories';
import type { PurchaseOrder, PurchaseOrderStatus, ReceivingSession } from '@domain/models';
import { mapDoc } from './utils';

export class FirestorePurchaseOrderRepository implements IPurchaseOrderRepository {
  private readonly poCollection = 'purchase_orders';
  private readonly sessionCollection = 'receiving_sessions';

  private mapDocToPO(id: string, data: DocumentData): PurchaseOrder {
    return mapDoc<PurchaseOrder>(id, data);
  }

  async save(order: PurchaseOrder, transaction?: any): Promise<PurchaseOrder> {
    const id = order.id || crypto.randomUUID();
    const docRef = doc(getUnifiedDb(), this.poCollection, id);
    const data = {
      ...order,
      id,
      updatedAt: serverTimestamp(),
      createdAt: order.createdAt ? Timestamp.fromDate(new Date(order.createdAt)) : serverTimestamp(),
      expectedAt: order.expectedAt ? Timestamp.fromDate(new Date(order.expectedAt)) : null,
    };

    if (transaction) {
      transaction.set(docRef, data);
    } else {
      await setDoc(docRef, data);
    }
    return (await this.findById(id))!;
  }

  async findById(id: string): Promise<PurchaseOrder | null> {
    const docSnap = await getDoc(doc(getUnifiedDb(), this.poCollection, id));
    if (!docSnap.exists()) return null;
    return this.mapDocToPO(docSnap.id, docSnap.data() as any);
  }

  async findAll(options?: {
    status?: PurchaseOrderStatus;
    supplier?: string;
    limit?: number;
    offset?: number;
  }): Promise<PurchaseOrder[]> {
    let q = query(collection(getUnifiedDb(), this.poCollection), orderBy('createdAt', 'desc'));
    if (options?.status) q = query(q, where('status', '==', options.status));
    if (options?.supplier) q = query(q, where('supplier', '==', options.supplier));
    if (options?.limit) q = query(q, limit(options.limit));
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d: QueryDocumentSnapshot) => this.mapDocToPO(d.id, d.data() as any));
  }

  async count(options?: { status?: PurchaseOrderStatus }): Promise<number> {
    let q = query(collection(getUnifiedDb(), this.poCollection));
    if (options?.status) q = query(q, where('status', '==', options.status));
    const snapshot = await getDocs(q);
    return snapshot.size;
  }

  async updateStatus(id: string, status: PurchaseOrderStatus, transaction?: Transaction): Promise<PurchaseOrder> {
    const docRef = doc(getUnifiedDb(), this.poCollection, id);
    const updates = { 
      status, 
      updatedAt: serverTimestamp() 
    };

    if (transaction) {
      transaction.update(docRef, updates);
    } else {
      await updateDoc(docRef, updates);
    }
    return (await this.findById(id))!;
  }

  async saveReceivingSession(session: ReceivingSession, transaction?: Transaction): Promise<ReceivingSession> {
    const id = session.id || crypto.randomUUID();
    const docRef = doc(getUnifiedDb(), this.sessionCollection, id);
    const data = {
      ...session,
      id,
      receivedAt: Timestamp.fromDate(new Date(session.receivedAt)),
      completedAt: session.completedAt ? Timestamp.fromDate(new Date(session.completedAt)) : null,
      updatedAt: serverTimestamp(),
    };

    if (transaction) {
      transaction.set(docRef, data);
    } else {
      await setDoc(docRef, data);
    }
    return session;
  }

  async findReceivingSessions(purchaseOrderId: string): Promise<ReceivingSession[]> {
    const q = query(collection(getUnifiedDb(), this.sessionCollection), where('purchaseOrderId', '==', purchaseOrderId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d: QueryDocumentSnapshot) => {
      const data = d.data() as any;
      return {
        ...data,
        id: d.id,
        receivedAt: data.receivedAt.toDate(),
        completedAt: data.completedAt?.toDate(),
      } as ReceivingSession;
    });
  }

  async findReceivingSessionByIdempotencyKey(purchaseOrderId: string, idempotencyKey: string): Promise<ReceivingSession | null> {
    const q = query(
      collection(getUnifiedDb(), this.sessionCollection), 
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

// Helper to use orderBy from bridge
