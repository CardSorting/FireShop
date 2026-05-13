/**
 * [LAYER: INFRASTRUCTURE]
 * Firestore Implementation of Customer Segment Repository
 */
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  query, 
  orderBy,
  serverTimestamp,
  getUnifiedDb
} from '../../firebase/bridge';
import { logger } from '@utils/logger';
import type { ICustomerSegmentRepository } from '@domain/repositories';
import type { CustomerSegment } from '@domain/models';
import { mapDoc } from './utils';

export class FirestoreCustomerSegmentRepository implements ICustomerSegmentRepository {
  private readonly collectionName = 'customerSegments';

  async getAll(): Promise<CustomerSegment[]> {
    try {
      const q = query(collection(getUnifiedDb(), this.collectionName), orderBy('name', 'asc'));
      const snap = await getDocs(q);
      return snap.docs.map((d: any) => mapDoc<CustomerSegment>(d.id, d.data()));
    } catch (err) {
      logger.error('Failed to fetch segments', err);
      return [];
    }
  }

  async getById(id: string): Promise<CustomerSegment | null> {
    const snap = await getDoc(doc(getUnifiedDb(), this.collectionName, id));
    if (!snap.exists()) return null;
    return mapDoc<CustomerSegment>(snap.id, snap.data());
  }

  async create(segment: Omit<CustomerSegment, 'id' | 'createdAt' | 'updatedAt' | 'customerCount'>): Promise<CustomerSegment> {
    const id = crypto.randomUUID();
    const now = serverTimestamp();
    const data = {
      ...segment,
      customerCount: 0,
      createdAt: now,
      updatedAt: now
    };
    await setDoc(doc(getUnifiedDb(), this.collectionName, id), data);
    return { ...data, id, createdAt: new Date(), updatedAt: new Date() } as any;
  }

  async update(id: string, updates: Partial<CustomerSegment>): Promise<CustomerSegment> {
    const data = { ...updates, updatedAt: serverTimestamp() };
    await updateDoc(doc(getUnifiedDb(), this.collectionName, id), data);
    return (await this.getById(id))!;
  }

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(getUnifiedDb(), this.collectionName, id));
  }

  async updateCustomerCount(id: string, count: number): Promise<void> {
    await updateDoc(doc(getUnifiedDb(), this.collectionName, id), {
      customerCount: count,
      lastCalculatedAt: serverTimestamp()
    });
  }
}
