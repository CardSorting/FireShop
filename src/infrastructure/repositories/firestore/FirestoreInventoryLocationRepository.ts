/**
 * [LAYER: INFRASTRUCTURE]
 * Firestore Implementation of Inventory Location Repository
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
  limit, 
  Timestamp,
  getUnifiedDb,
  serverTimestamp,
  type QueryDocumentSnapshot
} from '../../firebase/bridge';
import { logger } from '@utils/logger';
import type { IInventoryLocationRepository } from '@domain/repositories';
import type { InventoryLocation } from '@domain/models';
import { mapDoc } from './utils';

export class FirestoreInventoryLocationRepository implements IInventoryLocationRepository {
  private readonly collectionName = 'inventory_locations';

  async save(location: InventoryLocation): Promise<InventoryLocation> {
    const id = location.id || crypto.randomUUID();
    const data = {
      ...location,
      id,
      createdAt: location.createdAt ? Timestamp.fromDate(new Date(location.createdAt)) : serverTimestamp()
    };
    await setDoc(doc(getUnifiedDb(), this.collectionName, id), data);
    return (await this.findById(id))!;
  }

  async findById(id: string): Promise<InventoryLocation | null> {
    const docSnap = await getDoc(doc(getUnifiedDb(), this.collectionName, id));
    if (!docSnap.exists()) return null;
    return mapDoc<InventoryLocation>(docSnap.id, docSnap.data());
  }

  async findAll(): Promise<InventoryLocation[]> {
    const snapshot = await getDocs(collection(getUnifiedDb(), this.collectionName));
    return snapshot.docs.map((d: QueryDocumentSnapshot) => mapDoc<InventoryLocation>(d.id, d.data()));
  }

  async findDefault(): Promise<InventoryLocation | null> {
    const q = query(collection(getUnifiedDb(), this.collectionName), where('isDefault', '==', true), limit(1));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    return mapDoc<InventoryLocation>(snapshot.docs[0].id, snapshot.docs[0].data());
  }

  async findActive(): Promise<InventoryLocation[]> {
    const q = query(collection(getUnifiedDb(), this.collectionName), where('isActive', '==', true));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d: QueryDocumentSnapshot) => mapDoc<InventoryLocation>(d.id, d.data()));
  }

  async update(id: string, location: Partial<InventoryLocation>): Promise<InventoryLocation> {
    await updateDoc(doc(getUnifiedDb(), this.collectionName, id), {
      ...location,
      updatedAt: serverTimestamp()
    });
    return (await this.findById(id))!;
  }
}
