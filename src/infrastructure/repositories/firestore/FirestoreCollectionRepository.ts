/**
 * [LAYER: INFRASTRUCTURE]
 * Firestore Implementation of Collection Repository
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
  where, 
  limit, 
  increment,
  Timestamp,
  type DocumentData
} from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import type { ICollectionRepository } from '@domain/repositories';
import type { Collection } from '@domain/models';

export class FirestoreCollectionRepository implements ICollectionRepository {
  private readonly collectionName = 'collections';

  private mapDocToCollection(id: string, data: DocumentData): Collection {
    return {
      ...data,
      id,
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
      updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(data.updatedAt),
    } as Collection;
  }

  async getAll(options?: { status?: 'active' | 'archived'; limit?: number }): Promise<Collection[]> {
    let q = query(collection(db, this.collectionName));
    if (options?.status) q = query(q, where('status', '==', options.status));
    if (options?.limit) q = query(q, limit(options.limit));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => this.mapDocToCollection(d.id, d.data()));
  }

  async getById(id: string): Promise<Collection | null> {
    const docSnap = await getDoc(doc(db, this.collectionName, id));
    if (!docSnap.exists()) return null;
    return this.mapDocToCollection(docSnap.id, docSnap.data());
  }

  async getByHandle(handle: string): Promise<Collection | null> {
    const q = query(collection(db, this.collectionName), where('handle', '==', handle), limit(1));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    return this.mapDocToCollection(snapshot.docs[0].id, snapshot.docs[0].data());
  }

  async save(col: Collection): Promise<Collection> {
    const id = col.id || crypto.randomUUID();
    const now = Timestamp.now();
    const data = {
      ...col,
      id,
      updatedAt: now,
      createdAt: col.createdAt ? Timestamp.fromDate(new Date(col.createdAt)) : now
    };
    await setDoc(doc(db, this.collectionName, id), data);
    return (await this.getById(id))!;
  }

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(db, this.collectionName, id));
  }

  async updateProductCount(id: string, delta: number): Promise<void> {
    await updateDoc(doc(db, this.collectionName, id), { productCount: increment(delta), updatedAt: Timestamp.now() });
  }
}
