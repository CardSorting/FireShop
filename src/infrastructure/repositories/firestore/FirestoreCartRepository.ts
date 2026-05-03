/**
 * [LAYER: INFRASTRUCTURE]
 * Firestore Implementation of Cart Repository
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
  Timestamp,
  type DocumentData
} from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import type { ICartRepository } from '@domain/repositories';
import type { Cart } from '@domain/models';

export class FirestoreCartRepository implements ICartRepository {
  private readonly collectionName = 'carts';

  private mapDocToCart(id: string, data: DocumentData): Cart {
    return {
      ...data,
      id,
      updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(data.updatedAt),
    } as Cart;
  }

  async getByUserId(userId: string): Promise<Cart | null> {
    const q = query(collection(db, this.collectionName), where('userId', '==', userId), limit(1));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    return this.mapDocToCart(snapshot.docs[0].id, snapshot.docs[0].data());
  }

  async save(cart: Cart): Promise<void> {
    const existing = await this.getByUserId(cart.userId);
    const now = Timestamp.now();
    
    if (existing) {
      await updateDoc(doc(db, this.collectionName, existing.id), {
        items: cart.items,
        updatedAt: now
      });
    } else {
      const id = cart.id || crypto.randomUUID();
      await setDoc(doc(db, this.collectionName, id), {
        ...cart,
        id,
        updatedAt: now
      });
    }
  }

  async clear(userId: string): Promise<void> {
    const existing = await this.getByUserId(userId);
    if (existing) {
      await deleteDoc(doc(db, this.collectionName, existing.id));
    }
  }
}
