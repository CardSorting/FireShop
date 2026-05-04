/**
 * [LAYER: INFRASTRUCTURE]
 * Firestore Implementation of Settings Repository
 */
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  Timestamp,
} from 'firebase/firestore';
import { getDb } from '../../firebase/firebase';
import type { ISettingsRepository } from '@domain/repositories';
import type { JsonValue } from '@domain/models';

export class FirestoreSettingsRepository implements ISettingsRepository {
  private readonly collectionName = 'settings';

  async get<T>(key: string): Promise<T | null> {
    const docSnap = await getDoc(doc(getDb(), this.collectionName, key));
    if (!docSnap.exists()) return null;
    return docSnap.data().value as T;
  }

  async set(key: string, value: JsonValue): Promise<void> {
    await setDoc(doc(getDb(), this.collectionName, key), {
      value,
      updatedAt: Timestamp.now()
    });
  }

  async getAll(): Promise<Record<string, JsonValue>> {
    const snapshot = await getDocs(collection(getDb(), this.collectionName));
    const result: Record<string, JsonValue> = {};
    snapshot.forEach(d => {
      result[d.id] = d.data().value;
    });
    return result;
  }
}
