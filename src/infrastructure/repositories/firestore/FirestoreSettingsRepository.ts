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
  serverTimestamp,
  type QueryDocumentSnapshot
} from '../../firebase/bridge';
import { logger } from '@utils/logger';
import type { ISettingsRepository } from '@domain/repositories';
import type { JsonValue } from '@domain/models';

export class FirestoreSettingsRepository implements ISettingsRepository {
  private readonly collectionName = 'settings';

  async get<T>(key: string): Promise<T | null> {
    try {
      const docSnap = await getDoc(doc(getUnifiedDb(), this.collectionName, key));
      if (!docSnap.exists()) return null;
      return (docSnap.data() as any).value as T;
    } catch (err) {
      logger.error('Failed to get setting', { key, err });
      return null;
    }
  }

  async set(key: string, value: JsonValue): Promise<void> {
    try {
      await setDoc(doc(getUnifiedDb(), this.collectionName, key), {
        value,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      logger.error('Failed to set setting', { key, err });
      throw err;
    }
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
