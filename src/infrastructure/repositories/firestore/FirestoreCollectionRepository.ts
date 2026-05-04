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
  getUnifiedDb,
  type DocumentData,
  type QueryDocumentSnapshot
} from '../../firebase/bridge';
import type { ICollectionRepository } from '@domain/repositories';
import type { Collection } from '@domain/models';

import { mapDoc } from './utils';

export class FirestoreCollectionRepository implements ICollectionRepository {
  private readonly collectionName = 'collections';

  private mapDocToCollection(id: string, data: DocumentData): Collection {
    return mapDoc<Collection>(id, data);
  }

  async getAll(options?: { status?: 'active' | 'archived'; limit?: number }): Promise<Collection[]> {
    let q = query(collection(getUnifiedDb(), this.collectionName));
    if (options?.status) q = query(q, where('status', '==', options.status));
    if (options?.limit) q = query(q, limit(options.limit));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d: QueryDocumentSnapshot) => this.mapDocToCollection(d.id, d.data() as any));
  }

  async getById(id: string): Promise<Collection | null> {
    const docSnap = await getDoc(doc(getUnifiedDb(), this.collectionName, id));
    if (!docSnap.exists()) return null;
    return this.mapDocToCollection(docSnap.id, docSnap.data() as any);
  }

  async getByHandle(handle: string): Promise<Collection | null> {
    const q = query(collection(getUnifiedDb(), this.collectionName), where('handle', '==', handle), limit(1));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    return this.mapDocToCollection(snapshot.docs[0].id, snapshot.docs[0].data() as any);
  }

  async save(col: Collection): Promise<Collection> {
    const id = col.id || crypto.randomUUID();
    const now = Timestamp.now();
    
    // Ensure handle is unique
    const handle = await this.ensureUniqueHandle(col.handle, id);

    const data = {
      ...col,
      id,
      handle,
      updatedAt: now,
      createdAt: col.createdAt ? Timestamp.fromDate(new Date(col.createdAt)) : now
    };
    await setDoc(doc(getUnifiedDb(), this.collectionName, id), data);
    return (await this.getById(id))!;
  }

  private async ensureUniqueHandle(handle: string, excludeId?: string): Promise<string> {
    let currentHandle = handle;
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      const q = query(
        collection(getUnifiedDb(), this.collectionName), 
        where('handle', '==', currentHandle), 
        limit(1)
      );
      const snapshot = await getDocs(q);

      if (snapshot.empty) return currentHandle;
      if (excludeId && snapshot.docs[0].id === excludeId) return currentHandle;

      attempts++;
      currentHandle = `${handle}-${attempts}`;
    }

    return `${handle}-${crypto.randomUUID().slice(0, 4)}`;
  }

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(getUnifiedDb(), this.collectionName, id));
  }

  async updateProductCount(id: string, delta: number): Promise<void> {
    await updateDoc(doc(getUnifiedDb(), this.collectionName, id), { productCount: increment(delta), updatedAt: Timestamp.now() });
  }
}
