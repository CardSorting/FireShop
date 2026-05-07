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
  Timestamp,
  getUnifiedDb,
  serverTimestamp,
  type DocumentData,
  type QueryDocumentSnapshot
} from '../../firebase/bridge';
import { logger } from '@utils/logger';
import type { ICartRepository } from '@domain/repositories';
import type { Cart } from '@domain/models';

import { mapDoc } from './utils';

export class FirestoreCartRepository implements ICartRepository {
  private readonly collectionName = 'carts';

  private mapDocToCart(id: string, data: DocumentData): Cart {
    return mapDoc<Cart>(id, data);
  }

  async getByUserId(userId: string, transaction?: any): Promise<Cart | null> {
    try {
      const docRef = doc(getUnifiedDb(), this.collectionName, userId);
      let data: DocumentData | undefined;
      let id: string;

      if (transaction) {
        const docSnap = await transaction.get(docRef);
        if (!docSnap.exists()) return null;
        data = docSnap.data();
        id = docSnap.id;
      } else {
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) return null;
        data = docSnap.data();
        id = docSnap.id;
      }

      return this.mapDocToCart(id, data!);
    } catch (err) {
      logger.error('Failed to get cart', { userId, err });
      return null;
    }
  }

  async save(cart: Cart, transaction?: any): Promise<void> {
    try {
      const id = cart.userId; // Production Hardening: Use userId as ID for atomicity and speed
      const docRef = doc(getUnifiedDb(), this.collectionName, id);
      const updateData = {
        ...cart,
        id,
        updatedAt: serverTimestamp()
      };

      if (transaction) {
        transaction.set(docRef, updateData);
      } else {
        await setDoc(docRef, updateData, { merge: true });
      }
    } catch (err) {
      logger.error('Failed to save cart', { userId: cart.userId, err });
      throw err;
    }
  }

  async clear(userId: string): Promise<void> {
    try {
      await deleteDoc(doc(getUnifiedDb(), this.collectionName, userId));
    } catch (err) {
      logger.error('Failed to clear cart', { userId, err });
      throw err;
    }
  }
}
