/**
 * [LAYER: INFRASTRUCTURE]
 * Firestore Implementation of Discount Repository
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
  serverTimestamp,
  type DocumentData,
  type QueryDocumentSnapshot
} from '../../firebase/bridge';
import { logger } from '@utils/logger';
import type { IDiscountRepository } from '@domain/repositories';
import type { Discount, DiscountDraft, DiscountUpdate } from '@domain/models';
import { mapDoc } from './utils';

export class FirestoreDiscountRepository implements IDiscountRepository {
  private readonly collectionName = 'discounts';

  private mapDocToDiscount(id: string, data: DocumentData): Discount {
    return mapDoc<Discount>(id, data);
  }

  async getAll(): Promise<Discount[]> {
    const snapshot = await getDocs(collection(getUnifiedDb(), this.collectionName));
    return snapshot.docs.map((d: QueryDocumentSnapshot) => this.mapDocToDiscount(d.id, d.data() as any));
  }

  async getById(id: string): Promise<Discount | null> {
    const docSnap = await getDoc(doc(getUnifiedDb(), this.collectionName, id));
    if (!docSnap.exists()) return null;
    return this.mapDocToDiscount(docSnap.id, docSnap.data() as any);
  }

  async getByCode(code: string, transaction?: any): Promise<Discount | null> {
    const q = query(collection(getUnifiedDb(), this.collectionName), where('code', '==', code.toUpperCase()), limit(1));
    const db = getUnifiedDb();
    
    if (transaction) {
      const snapshot = await getDocs(q); // getDocs still works for query building, but we want the doc from the transaction for consistency
      if (snapshot.empty) return null;
      const docRef = doc(db, this.collectionName, snapshot.docs[0].id);
      const docSnap = await transaction.get(docRef);
      if (!docSnap.exists()) return null;
      return this.mapDocToDiscount(docSnap.id, docSnap.data() as any);
    } else {
      const snapshot = await getDocs(q);
      if (snapshot.empty) return null;
      return this.mapDocToDiscount(snapshot.docs[0].id, snapshot.docs[0].data() as any);
    }
  }

  async create(discount: DiscountDraft): Promise<Discount> {
    const id = crypto.randomUUID();
    const now = serverTimestamp();
    const data = {
      ...discount,
      code: discount.code.toUpperCase(),
      createdAt: now,
      startsAt: discount.startsAt ? Timestamp.fromDate(new Date(discount.startsAt)) : now,
      endsAt: discount.endsAt ? Timestamp.fromDate(new Date(discount.endsAt)) : null,
      usageCount: 0
    };
    await setDoc(doc(getUnifiedDb(), this.collectionName, id), data);
    return (await this.getById(id))!;
  }

  async update(id: string, updates: DiscountUpdate): Promise<Discount> {
    const firestoreUpdates: any = { 
      ...updates,
      updatedAt: serverTimestamp()
    };
    if (updates.code) firestoreUpdates.code = updates.code.toUpperCase();
    if (updates.startsAt) firestoreUpdates.startsAt = Timestamp.fromDate(new Date(updates.startsAt));
    if (updates.endsAt) firestoreUpdates.endsAt = Timestamp.fromDate(new Date(updates.endsAt));
    
    await updateDoc(doc(getUnifiedDb(), this.collectionName, id), firestoreUpdates);
    return (await this.getById(id))!;
  }

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(getUnifiedDb(), this.collectionName, id));
  }

  async incrementUsage(id: string, transaction?: any): Promise<void> {
    const docRef = doc(getUnifiedDb(), this.collectionName, id);
    if (transaction) {
      transaction.update(docRef, { usageCount: increment(1) });
    } else {
      await updateDoc(docRef, { usageCount: increment(1) });
    }
  }
}
