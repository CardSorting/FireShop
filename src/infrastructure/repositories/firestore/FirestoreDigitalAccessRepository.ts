/**
 * [LAYER: INFRASTRUCTURE]
 * Firestore Implementation of Digital Access Log Repository
 */
import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  query, 
  where, 
  orderBy, 
  Timestamp,
} from 'firebase/firestore';
import { db } from '../../firebase/firebase';

export interface DigitalAccessLog {
  id: string;
  userId: string;
  assetId: string;
  ipAddress: string;
  userAgent: string;
  createdAt: Date;
}

export class FirestoreDigitalAccessRepository {
  private readonly collectionName = 'digital_access_logs';

  async record(log: Omit<DigitalAccessLog, 'createdAt'>): Promise<void> {
    await setDoc(doc(db, this.collectionName, log.id), {
      ...log,
      createdAt: Timestamp.now(),
    });
  }

  async getLogsByUserAndAssets(userId: string, assetIds: string[]): Promise<DigitalAccessLog[]> {
    if (assetIds.length === 0) return [];
    
    // Firestore has a limit on 'in' queries (10-30 items depending on version)
    // For this app, it should be fine.
    const q = query(
      collection(db, this.collectionName),
      where('userId', '==', userId),
      where('assetId', 'in', assetIds),
      orderBy('createdAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => {
      const data = d.data();
      return {
        ...data,
        createdAt: data.createdAt.toDate(),
      } as DigitalAccessLog;
    });
  }
}
