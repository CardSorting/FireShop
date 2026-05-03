/**
 * [LAYER: INFRASTRUCTURE]
 * Firestore Implementation of Transfer Repository
 */
import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  query, 
  orderBy, 
  Timestamp,
  type DocumentData
} from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import type { ITransferRepository } from '@domain/repositories';
import type { Transfer } from '@domain/models';

export class FirestoreTransferRepository implements ITransferRepository {
  private readonly collectionName = 'transfers';

  private mapDocToTransfer(id: string, data: DocumentData): Transfer {
    return {
      ...data,
      id,
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
      expectedAt: data.expectedAt instanceof Timestamp ? data.expectedAt.toDate() : new Date(data.expectedAt),
    } as Transfer;
  }

  async getAll(): Promise<Transfer[]> {
    const q = query(collection(db, this.collectionName), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => this.mapDocToTransfer(d.id, d.data()));
  }

  async update(id: string, updates: Partial<Transfer>): Promise<void> {
    await updateDoc(doc(db, this.collectionName, id), {
      ...updates,
      updatedAt: Timestamp.now()
    });
  }

  async create(transfer: Transfer): Promise<void> {
    const id = transfer.id || crypto.randomUUID();
    await setDoc(doc(db, this.collectionName, id), {
      ...transfer,
      id,
      createdAt: Timestamp.now(),
      expectedAt: transfer.expectedAt ? Timestamp.fromDate(new Date(transfer.expectedAt)) : Timestamp.now()
    });
  }
}
