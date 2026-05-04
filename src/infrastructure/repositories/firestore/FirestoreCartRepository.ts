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
  getUnifiedDb,
  type DocumentData,
  type QueryDocumentSnapshot
} from '../../firebase/bridge';
import type { ICartRepository } from '@domain/repositories';
import type { Cart } from '@domain/models';

import { mapDoc } from './utils';

export class FirestoreCartRepository implements ICartRepository {
  private readonly collectionName = 'carts';

  private mapDocToCart(id: string, data: DocumentData): Cart {
    return mapDoc<Cart>(id, data);
  }

  async getByUserId(userId: string): Promise<Cart | null> {
    const q = query(collection(getUnifiedDb(), this.collectionName), where('userId', '==', userId), limit(1));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    return this.mapDocToCart(snapshot.docs[0].id, snapshot.docs[0].data() as any);
  }

  async save(cart: Cart): Promise<void> {
    const existing = await this.getByUserId(cart.userId);
    const now = Timestamp.now();
    
    if (existing) {
      await updateDoc(doc(getUnifiedDb(), this.collectionName, existing.id), {
        items: cart.items,
        updatedAt: now
      });
    } else {
      const id = cart.id || crypto.randomUUID();
      await setDoc(doc(getUnifiedDb(), this.collectionName, id), {
        ...cart,
        id,
        updatedAt: now
      });
    }
  }

  async clear(userId: string): Promise<void> {
    const existing = await this.getByUserId(userId);
    if (existing) {
      await deleteDoc(doc(getUnifiedDb(), this.collectionName, existing.id));
    }
  }
}
