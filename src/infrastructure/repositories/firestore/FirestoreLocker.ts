import { ILockProvider } from '../../../domain/repositories';
import { getUnifiedDb, runTransaction, doc, serverTimestamp } from '../../firebase/bridge';
import { logger } from '@utils/logger';

export class FirestoreLocker implements ILockProvider {
  private readonly collectionName = 'locks';

  async acquireLock(resourceId: string, owner: string, ttlMs: number = 30000): Promise<{ success: boolean; fencingToken: number | null }> {
    const lockRef = doc(getUnifiedDb(), this.collectionName, resourceId);
    
    try {
      return await runTransaction(getUnifiedDb(), async (transaction: any) => {
        const docSnap = await transaction.get(lockRef);
        const now = Date.now();
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data && data.expiresAt > now && data.owner !== owner) {
            return { success: false, fencingToken: null };
          }
          
          // Monotonic fencing token: increment if exists, else start at 1
          const nextToken = (data?.fencingToken || 0) + 1;
          transaction.set(lockRef, {
            owner,
            expiresAt: now + ttlMs,
            acquiredAt: serverTimestamp(),
            acquiredAtMs: now,
            fencingToken: nextToken
          });
          return { success: true, fencingToken: nextToken };
        }
        
        const firstToken = 1;
        transaction.set(lockRef, {
          owner,
          expiresAt: now + ttlMs,
          acquiredAt: serverTimestamp(),
          acquiredAtMs: now,
          fencingToken: firstToken
        });
        
        return { success: true, fencingToken: firstToken };
      });
    } catch (error) {
      logger.error('Error acquiring lock', { resourceId, owner, error });
      return { success: false, fencingToken: null };
    }
  }

  async releaseLock(resourceId: string, owner: string, fencingToken?: number): Promise<void> {
    const lockRef = doc(getUnifiedDb(), this.collectionName, resourceId);
    
    try {
      await runTransaction(getUnifiedDb(), async (transaction: any) => {
        const docSnap = await transaction.get(lockRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          // Safety: only delete if BOTH owner and token match (preventing accidental deletion of a newer lock)
          const ownerMatch = data && data.owner === owner;
          const tokenMatch = !fencingToken || (data && data.fencingToken === fencingToken);
          
          if (ownerMatch && tokenMatch) {
            transaction.delete(lockRef);
          } else if (ownerMatch && !tokenMatch) {
            logger.warn('Prevented stale lock release: fencing token mismatch', { resourceId, owner, expectedToken: fencingToken, actualToken: data?.fencingToken });
          }
        }
      });
    } catch (error) {
      logger.error('Error releasing lock', { resourceId, owner, error });
    }
  }
}
