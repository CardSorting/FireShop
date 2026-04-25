/**
 * [LAYER: INFRASTRUCTURE]
 */
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  serverTimestamp,
  type CollectionReference,
  type DocumentData,
  type Firestore,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import { getDB } from '../FirebaseInitializer';
import { COLLECTIONS } from '@utils/constants';
import type { IOrderRepository } from '@domain/repositories';
import type { Order, OrderStatus } from '@domain/models';

function docToOrder(docSnap: QueryDocumentSnapshot<DocumentData>): Order {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    userId: data.userId,
    items: data.items ?? [],
    total: data.total,
    status: data.status,
    shippingAddress: data.shippingAddress,
    paymentTransactionId: data.paymentTransactionId ?? null,
    createdAt: data.createdAt?.toDate() ?? new Date(),
    updatedAt: data.updatedAt?.toDate() ?? new Date(),
  };
}

export class FirestoreOrderRepository implements IOrderRepository {
  private db: Firestore | null = null;
  private coll: CollectionReference<DocumentData> | null = null;

  /**
   * Get or create the Firestore instance
   */
  private async getDBInstance() {
    if (!this.db) {
      this.db = await getDB();
    }
    return this.db!;
  }



  async create(
    order: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Order> {
    const db = await this.getDBInstance();
    const coll = this.coll || collection(db, COLLECTIONS.ORDERS);
    
    const ref = await addDoc(coll, {
      ...order,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return this.getById(ref.id) as Promise<Order>;
  }

  async getById(id: string): Promise<Order | null> {
    const db = await this.getDBInstance();
    const coll = this.coll || collection(db, COLLECTIONS.ORDERS);
    const docSnap = await getDoc(doc(coll, id));
    if (!docSnap.exists()) return null;
    return docToOrder(docSnap);
  }

  async getByUserId(userId: string): Promise<Order[]> {
    const db = await this.getDBInstance();
    const coll = this.coll || collection(db, COLLECTIONS.ORDERS);
    
    const q = query(
      coll,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(docToOrder);
  }

  async getAll(options?: {
    status?: OrderStatus;
    limit?: number;
    cursor?: string;
  }): Promise<{ orders: Order[]; nextCursor?: string }> {
    const db = await this.getDBInstance();
    const coll = this.coll || collection(db, COLLECTIONS.ORDERS);
    
    const cursorDoc = options?.cursor ? await getDoc(doc(coll, options.cursor)) : null;
    const constraints = [
      orderBy('createdAt', 'desc'),
      ...(options?.status ? [where('status', '==', options.status)] : []),
      ...(cursorDoc?.exists() ? [startAfter(cursorDoc)] : []),
      limit(options?.limit ?? 50),
    ];
    const q = query(coll, ...constraints);
    const snapshot = await getDocs(q);
    const orders = snapshot.docs.map(docToOrder);
    const nextCursor =
      snapshot.docs.length > 0
        ? snapshot.docs[snapshot.docs.length - 1].id
        : undefined;
    return { orders, nextCursor };
  }

  async updateStatus(id: string, status: OrderStatus): Promise<void> {
    const db = await this.getDBInstance();
    const coll = this.coll || collection(db, COLLECTIONS.ORDERS);
    const ref = doc(coll, id);
    await updateDoc(ref, {
      status,
      updatedAt: serverTimestamp(),
    });
  }
}