import { ILockProvider } from '../../../domain/repositories';
import { adminDb } from '../../firebase/admin';

export class FirestoreLocker implements ILockProvider {
  async acquireLock(resourceId: string, owner: string, ttlMs: number = 30000): Promise<boolean> {
    const lockRef = adminDb.collection('locks').doc(resourceId);
    
    try {
      return await adminDb.runTransaction(async (transaction: any) => {
        const doc = await transaction.get(lockRef);
        const now = Date.now();
        
        if (doc.exists) {
          const data = doc.data();
          if (data && data.expiresAt > now && data.owner !== owner) {
            // Lock is held by someone else and hasn't expired
            return false;
          }
        }
        
        // Lock is available, expired, or we own it
        transaction.set(lockRef, {
          owner,
          expiresAt: now + ttlMs,
          acquiredAt: now
        });
        
        return true;
      });
    } catch (error) {
      console.error('Error acquiring lock:', error);
      return false;
    }
  }

  async releaseLock(resourceId: string, owner: string): Promise<void> {
    const lockRef = adminDb.collection('locks').doc(resourceId);
    
    try {
      await adminDb.runTransaction(async (transaction: any) => {
        const doc = await transaction.get(lockRef);
        if (doc.exists) {
          const data = doc.data();
          if (data && data.owner === owner) {
            transaction.delete(lockRef);
          }
        }
      });
    } catch (error) {
      console.error('Error releasing lock:', error);
    }
  }
}
