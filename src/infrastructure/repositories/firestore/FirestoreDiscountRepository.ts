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
  type DocumentData
} from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import type { IDiscountRepository } from '@domain/repositories';
import type { Discount, DiscountDraft, DiscountUpdate } from '@domain/models';

export class FirestoreDiscountRepository implements IDiscountRepository {
  private readonly collectionName = 'discounts';

  private mapDocToDiscount(id: string, data: DocumentData): Discount {
    return {
      ...data,
      id,
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
      startsAt: data.startsAt instanceof Timestamp ? data.startsAt.toDate() : new Date(data.startsAt),
      endsAt: data.endsAt ? (data.endsAt instanceof Timestamp ? data.endsAt.toDate() : new Date(data.endsAt)) : undefined,
    } as Discount;
  }

  async getAll(): Promise<Discount[]> {
    const snapshot = await getDocs(collection(db, this.collectionName));
    return snapshot.docs.map(d => this.mapDocToDiscount(d.id, d.data()));
  }

  async getById(id: string): Promise<Discount | null> {
    const docSnap = await getDoc(doc(db, this.collectionName, id));
    if (!docSnap.exists()) return null;
    return this.mapDocToDiscount(docSnap.id, docSnap.data());
  }

  async getByCode(code: string): Promise<Discount | null> {
    const q = query(collection(db, this.collectionName), where('code', '==', code.toUpperCase()), limit(1));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    return this.mapDocToDiscount(snapshot.docs[0].id, snapshot.docs[0].data());
  }

  async create(discount: DiscountDraft): Promise<Discount> {
    const id = crypto.randomUUID();
    const now = Timestamp.now();
    const data = {
      ...discount,
      code: discount.code.toUpperCase(),
      createdAt: now,
      startsAt: discount.startsAt ? Timestamp.fromDate(new Date(discount.startsAt)) : now,
      endsAt: discount.endsAt ? Timestamp.fromDate(new Date(discount.endsAt)) : null,
      usageCount: 0
    };
    await setDoc(doc(db, this.collectionName, id), data);
    return (await this.getById(id))!;
  }

  async update(id: string, updates: DiscountUpdate): Promise<Discount> {
    const firestoreUpdates: any = { ...updates };
    if (updates.code) firestoreUpdates.code = updates.code.toUpperCase();
    if (updates.startsAt) firestoreUpdates.startsAt = Timestamp.fromDate(new Date(updates.startsAt));
    if (updates.endsAt) firestoreUpdates.endsAt = Timestamp.fromDate(new Date(updates.endsAt));
    
    await updateDoc(doc(db, this.collectionName, id), firestoreUpdates);
    return (await this.getById(id))!;
  }

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(db, this.collectionName, id));
  }

  async incrementUsage(id: string): Promise<void> {
    await updateDoc(doc(db, this.collectionName, id), { usageCount: increment(1) });
  }
}
