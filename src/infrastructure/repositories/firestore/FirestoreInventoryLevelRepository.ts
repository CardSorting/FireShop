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
  runTransaction
} from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import type { IInventoryLevelRepository } from '@domain/repositories';
import type { InventoryLevel } from '@domain/models';

export class FirestoreInventoryLevelRepository implements IInventoryLevelRepository {
  private readonly collectionName = 'inventory_levels';

  private getDocId(productId: string, locationId: string): string {
    return `${productId}_${locationId}`;
  }

  async findByProduct(productId: string): Promise<InventoryLevel[]> {
    const q = query(collection(db, this.collectionName), where('productId', '==', productId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => d.data() as InventoryLevel);
  }

  async findByLocation(locationId: string): Promise<InventoryLevel[]> {
    const q = query(collection(db, this.collectionName), where('locationId', '==', locationId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => d.data() as InventoryLevel);
  }

  async findByProductAndLocation(productId: string, locationId: string): Promise<InventoryLevel | null> {
    const docSnap = await getDoc(doc(db, this.collectionName, this.getDocId(productId, locationId)));
    if (!docSnap.exists()) return null;
    return docSnap.data() as InventoryLevel;
  }

  async save(level: InventoryLevel): Promise<InventoryLevel> {
    const id = this.getDocId(level.productId, level.locationId);
    await setDoc(doc(db, this.collectionName, id), {
      ...level,
      updatedAt: Timestamp.now()
    });
    return (await this.findByProductAndLocation(level.productId, level.locationId))!;
  }

  async adjustQuantity(productId: string, locationId: string, delta: number, reason: string): Promise<InventoryLevel> {
    const id = this.getDocId(productId, locationId);
    const docRef = doc(db, this.collectionName, id);
    
    await runTransaction(db, async (transaction) => {
      const docSnap = await transaction.get(docRef);
      if (!docSnap.exists()) {
        transaction.set(docRef, {
          productId,
          locationId,
          availableQty: delta,
          reservedQty: 0,
          incomingQty: 0,
          reorderPoint: 0,
          reorderQty: 0,
          updatedAt: Timestamp.now()
        });
      } else {
        transaction.update(docRef, {
          availableQty: increment(delta),
          updatedAt: Timestamp.now()
        });
      }
    });
    
    return (await this.findByProductAndLocation(productId, locationId))!;
  }

  async updateReorderPoint(productId: string, locationId: string, reorderPoint: number, reorderQty: number): Promise<InventoryLevel> {
    const id = this.getDocId(productId, locationId);
    await updateDoc(doc(db, this.collectionName, id), {
      reorderPoint,
      reorderQty,
      updatedAt: Timestamp.now()
    });
    return (await this.findByProductAndLocation(productId, locationId))!;
  }
}
