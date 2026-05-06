/**
 * [LAYER: INFRASTRUCTURE]
 * Firestore Implementation of Supplier Repository
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
  limit, 
  Timestamp,
  getUnifiedDb,
  serverTimestamp,
  type DocumentData,
  type QueryDocumentSnapshot
} from '../../firebase/bridge';
import { logger } from '@utils/logger';
import type { ISupplierRepository } from '@domain/repositories';
import type { Supplier } from '@domain/models';
import { mapDoc } from './utils';

export class FirestoreSupplierRepository implements ISupplierRepository {
  private readonly collectionName = 'suppliers';

  private mapDocToSupplier(id: string, data: DocumentData): Supplier {
    return mapDoc<Supplier>(id, data);
  }

  async getAll(options?: { query?: string; limit?: number; offset?: number }): Promise<Supplier[]> {
    let q = query(collection(getUnifiedDb(), this.collectionName));
    if (options?.limit) q = query(q, limit(options.limit));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d: QueryDocumentSnapshot) => this.mapDocToSupplier(d.id, d.data() as any));
  }

  async getById(id: string): Promise<Supplier | null> {
    const docSnap = await getDoc(doc(getUnifiedDb(), this.collectionName, id));
    if (!docSnap.exists()) return null;
    return this.mapDocToSupplier(docSnap.id, docSnap.data() as any);
  }

  async save(supplier: Supplier): Promise<Supplier> {
    const id = supplier.id || crypto.randomUUID();
    const now = serverTimestamp();
    const data = {
      ...supplier,
      id,
      updatedAt: now,
      createdAt: supplier.createdAt ? Timestamp.fromDate(new Date(supplier.createdAt)) : now
    };
    await setDoc(doc(getUnifiedDb(), this.collectionName, id), data);
    return (await this.getById(id))!;
  }

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(getUnifiedDb(), this.collectionName, id));
  }

  async count(): Promise<number> {
    const snapshot = await getDocs(collection(getUnifiedDb(), this.collectionName));
    return snapshot.size;
  }
}
