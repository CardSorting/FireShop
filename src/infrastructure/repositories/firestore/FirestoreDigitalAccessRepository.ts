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
  getUnifiedDb,
  serverTimestamp,
  type QueryDocumentSnapshot
} from '../../firebase/bridge';
import { logger } from '@utils/logger';
import { mapDoc } from './utils';

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
    try {
      await setDoc(doc(getUnifiedDb(), this.collectionName, log.id), {
        ...log,
        createdAt: serverTimestamp(),
      });
      logger.info(`[Forensic] Digital Asset Access Recorded`, { assetId: log.assetId, userId: log.userId });
    } catch (err) {
      logger.error('Failed to record digital access log', { log, err });
    }
  }

  async getLogsByUserAndAssets(userId: string, assetIds: string[]): Promise<DigitalAccessLog[]> {
    if (assetIds.length === 0) return [];
    
    // Firestore has a limit on 'in' queries (10-30 items depending on version)
    // For this app, it should be fine.
    const q = query(
      collection(getUnifiedDb(), this.collectionName),
      where('userId', '==', userId),
      where('assetId', 'in', assetIds),
      orderBy('createdAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d: QueryDocumentSnapshot) => mapDoc<DigitalAccessLog>(d.id, d.data()));
  }
}
