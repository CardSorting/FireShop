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
} from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import type { IInventoryLocationRepository } from '@domain/repositories';
import type { InventoryLocation } from '@domain/models';

export class FirestoreInventoryLocationRepository implements IInventoryLocationRepository {
  private readonly collectionName = 'inventory_locations';

  async save(location: InventoryLocation): Promise<InventoryLocation> {
    const id = location.id || crypto.randomUUID();
    const data = {
      ...location,
      id,
      createdAt: location.createdAt ? Timestamp.fromDate(new Date(location.createdAt)) : Timestamp.now()
    };
    await setDoc(doc(db, this.collectionName, id), data);
    return (await this.findById(id))!;
  }

  async findById(id: string): Promise<InventoryLocation | null> {
    const docSnap = await getDoc(doc(db, this.collectionName, id));
    if (!docSnap.exists()) return null;
    return { ...docSnap.data(), id: docSnap.id } as InventoryLocation;
  }

  async findAll(): Promise<InventoryLocation[]> {
    const snapshot = await getDocs(collection(db, this.collectionName));
    return snapshot.docs.map(d => ({ ...d.data(), id: d.id } as InventoryLocation));
  }

  async findDefault(): Promise<InventoryLocation | null> {
    const q = query(collection(db, this.collectionName), where('isDefault', '==', 1), limit(1));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    return { ...snapshot.docs[0].data(), id: snapshot.docs[0].id } as InventoryLocation;
  }

  async findActive(): Promise<InventoryLocation[]> {
    const q = query(collection(db, this.collectionName), where('isActive', '==', 1));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ ...d.data(), id: d.id } as InventoryLocation));
  }

  async update(id: string, location: Partial<InventoryLocation>): Promise<InventoryLocation> {
    await updateDoc(doc(db, this.collectionName, id), location);
    return (await this.findById(id))!;
  }
}
