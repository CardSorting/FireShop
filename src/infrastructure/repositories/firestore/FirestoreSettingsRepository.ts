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
  getUnifiedDb,
  type QueryDocumentSnapshot
} from '../../firebase/bridge';
import type { ISettingsRepository } from '@domain/repositories';
import type { JsonValue } from '@domain/models';

export class FirestoreSettingsRepository implements ISettingsRepository {
  private readonly collectionName = 'settings';

  async get<T>(key: string): Promise<T | null> {
    const docSnap = await getDoc(doc(getUnifiedDb(), this.collectionName, key));
    if (!docSnap.exists()) return null;
    return (docSnap.data() as any).value as T;
  }

  async set(key: string, value: JsonValue): Promise<void> {
    await setDoc(doc(getUnifiedDb(), this.collectionName, key), {
      value,
      updatedAt: Timestamp.now()
    });
  }

  async getAll(): Promise<Record<string, JsonValue>> {
    const snapshot = await getDocs(collection(getUnifiedDb(), this.collectionName));
    const result: Record<string, JsonValue> = {};
    snapshot.forEach((d: any) => {
      result[d.id] = (d.data() as any).value;
    });
    return result;
  }
}
