import { ILockProvider } from '../../../domain/repositories';
import { getUnifiedDb, runTransaction, doc, serverTimestamp } from '../../firebase/bridge';
import { logger } from '@utils/logger';

export class FirestoreLocker implements ILockProvider {
  private readonly collectionName = 'locks';

  async acquireLock(resourceId: string, owner: string, ttlMs: number = 30000): Promise<boolean> {
    const lockRef = doc(getUnifiedDb(), this.collectionName, resourceId);
    
    try {
      return await runTransaction(getUnifiedDb(), async (transaction: any) => {
        const docSnap = await transaction.get(lockRef);
        const now = Date.now();
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data && data.expiresAt > now && data.owner !== owner) {
            // Lock is held by someone else and hasn't expired
            return false;
          }
        }
        
        // Lock is available, expired, or we own it
        transaction.set(lockRef, {
          owner,
          expiresAt: now + ttlMs,
          acquiredAt: serverTimestamp(),
          acquiredAtMs: now
        });
        
        return true;
      });
    } catch (error) {
      logger.error('Error acquiring lock', { resourceId, owner, error });
      return false;
    }
  }

  async releaseLock(resourceId: string, owner: string): Promise<void> {
    const lockRef = doc(getUnifiedDb(), this.collectionName, resourceId);
    
    try {
      await runTransaction(getUnifiedDb(), async (transaction: any) => {
        const docSnap = await transaction.get(lockRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data && data.owner === owner) {
            transaction.delete(lockRef);
          }
        }
      });
    } catch (error) {
      logger.error('Error releasing lock', { resourceId, owner, error });
    }
  }
}
