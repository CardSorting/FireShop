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
  getUnifiedDb,
  serverTimestamp,
  type DocumentData,
  type QueryDocumentSnapshot
} from '../../firebase/bridge';
import { logger } from '@utils/logger';
import type { ITransferRepository } from '@domain/repositories';
import type { Transfer } from '@domain/models';
import { mapDoc } from './utils';

export class FirestoreTransferRepository implements ITransferRepository {
  private readonly collectionName = 'transfers';

  private mapDocToTransfer(id: string, data: DocumentData): Transfer {
    return mapDoc<Transfer>(id, data);
  }

  async getAll(): Promise<Transfer[]> {
    const q = query(collection(getUnifiedDb(), this.collectionName), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d: QueryDocumentSnapshot) => this.mapDocToTransfer(d.id, d.data() as any));
  }

  async update(id: string, updates: Partial<Transfer>, transaction?: any): Promise<void> {
    const docRef = doc(getUnifiedDb(), this.collectionName, id);
    const firestoreUpdates = {
      ...updates,
      updatedAt: serverTimestamp()
    };

    if (transaction) {
      transaction.update(docRef, firestoreUpdates);
    } else {
      await updateDoc(docRef, firestoreUpdates);
    }
  }

  async create(transfer: Transfer, transaction?: any): Promise<void> {
    const id = transfer.id || crypto.randomUUID();
    const docRef = doc(getUnifiedDb(), this.collectionName, id);
    const data = {
      ...transfer,
      id,
      createdAt: serverTimestamp(),
      expectedAt: transfer.expectedAt ? Timestamp.fromDate(new Date(transfer.expectedAt)) : serverTimestamp()
    };

    if (transaction) {
      transaction.set(docRef, data);
    } else {
      await setDoc(docRef, data);
    }
  }
}
