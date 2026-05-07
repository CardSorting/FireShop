/**
 * [LAYER: INFRASTRUCTURE]
 * Firestore Implementation of Inventory Level Repository
 */
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  query, 
  where, 
  increment,
  Timestamp,
  runTransaction,
  getUnifiedDb,
  serverTimestamp,
  type QueryDocumentSnapshot
} from '../../firebase/bridge';
import { logger } from '@utils/logger';
import type { IInventoryLevelRepository } from '@domain/repositories';
import type { InventoryLevel } from '@domain/models';
import { mapDoc } from './utils';

export class FirestoreInventoryLevelRepository implements IInventoryLevelRepository {
  private readonly collectionName = 'inventory_levels';

  private getDocId(productId: string, locationId: string): string {
    return `${productId}_${locationId}`;
  }

  async findByProduct(productId: string): Promise<InventoryLevel[]> {
    const q = query(collection(getUnifiedDb(), this.collectionName), where('productId', '==', productId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d: QueryDocumentSnapshot) => d.data() as any as InventoryLevel);
  }

  async findByLocation(locationId: string): Promise<InventoryLevel[]> {
    const q = query(collection(getUnifiedDb(), this.collectionName), where('locationId', '==', locationId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d: QueryDocumentSnapshot) => d.data() as any as InventoryLevel);
  }

  async findByProductAndLocation(productId: string, locationId: string): Promise<InventoryLevel | null> {
    const docSnap = await getDoc(doc(getUnifiedDb(), this.collectionName, this.getDocId(productId, locationId)));
    if (!docSnap.exists()) return null;
    return docSnap.data() as any as InventoryLevel;
  }

  async save(level: InventoryLevel): Promise<InventoryLevel> {
    const id = this.getDocId(level.productId, level.locationId);
    await setDoc(doc(getUnifiedDb(), this.collectionName, id), {
      ...level,
      updatedAt: serverTimestamp()
    });
    return (await this.findByProductAndLocation(level.productId, level.locationId))!;
  }

  async adjustQuantity(productId: string, locationId: string, delta: number, reason: string): Promise<InventoryLevel> {
    const id = this.getDocId(productId, locationId);
    const docRef = doc(getUnifiedDb(), this.collectionName, id);
    
    await runTransaction(getUnifiedDb(), async (transaction) => {
      const docSnap = await transaction.get(docRef);
      if (!docSnap.exists()) {
        if (delta < 0) throw new Error(`Cannot initialize inventory with negative quantity for ${productId}`);
        transaction.set(docRef, {
          productId,
          locationId,
          availableQty: delta,
          reservedQty: 0,
          incomingQty: 0,
          reorderPoint: 0,
          reorderQty: 0,
          updatedAt: serverTimestamp()
        });
      } else {
        const data = docSnap.data() as any;
        const currentQty = data.availableQty || 0;
        const nextQty = currentQty + delta;
        
        if (nextQty < 0) {
          throw new Error(`Insufficient inventory: ${productId} at ${locationId}. Requested: ${Math.abs(delta)}, Available: ${currentQty}`);
        }

        transaction.update(docRef, {
          availableQty: nextQty,
          updatedAt: serverTimestamp()
        });
      }
    });
    
    return (await this.findByProductAndLocation(productId, locationId))!;
  }

  async updateReorderPoint(productId: string, locationId: string, reorderPoint: number, reorderQty: number): Promise<InventoryLevel> {
    const id = this.getDocId(productId, locationId);
    await updateDoc(doc(getUnifiedDb(), this.collectionName, id), {
      reorderPoint,
      reorderQty,
      updatedAt: serverTimestamp()
    });
    return (await this.findByProductAndLocation(productId, locationId))!;
  }
}
