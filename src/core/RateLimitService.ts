/**
 * [LAYER: CORE]
 * Simple Rate Limiting Service to prevent abuse of critical endpoints.
 * Uses Firestore for persistent, distributed rate limiting.
 */
import { 
  doc, 
  getDoc, 
  setDoc, 
  getUnifiedDb,
  serverTimestamp,
  Timestamp
} from '@infrastructure/firebase/bridge';
import { logger } from '@utils/logger';

export class RateLimitService {
  private readonly collectionName = 'system_rate_limits';

  /**
   * Checks if an action is allowed for a given key.
   * @param key Unique key (e.g., IP or User ID)
   * @param limit Max attempts
   * @param windowMs Time window in milliseconds
   */
  async isAllowed(key: string, limit: number, windowMs: number): Promise<{ allowed: boolean; remaining: number; resetTime?: Date }> {
    const id = `limit_${key.replace(/[^a-zA-Z0-9]/g, '_')}`;
    const docRef = doc(getUnifiedDb(), this.collectionName, id);

    try {
      const docSnap = await getDoc(docRef);
      const now = Date.now();
      
      if (!docSnap.exists()) {
        await setDoc(docRef, {
          attempts: 1,
          firstAttempt: serverTimestamp(),
          expiresAt: new Date(now + windowMs)
        });
        return { allowed: true, remaining: limit - 1 };
      }

      const data = docSnap.data();
      if (!data) return { allowed: true, remaining: limit };

      const firstAttempt = (data.firstAttempt as Timestamp)?.toDate?.()?.getTime() || now;
      const expiresAt = (data.expiresAt as Timestamp)?.toDate?.() || new Date(now);
      
      if (now > expiresAt.getTime()) {
        // Window expired, reset
        await setDoc(docRef, {
          attempts: 1,
          firstAttempt: serverTimestamp(),
          expiresAt: new Date(now + windowMs)
        });
        return { allowed: true, remaining: limit - 1 };
      }

      if (data.attempts >= limit) {
        return { allowed: false, remaining: 0, resetTime: expiresAt };
      }

      // Increment attempts
      await setDoc(docRef, {
        ...data,
        attempts: data.attempts + 1
      }, { merge: true });

      return { allowed: true, remaining: limit - (data.attempts + 1) };
    } catch (err) {
      logger.error('[RateLimit] Error checking limit', { key, err });
      // Fail open to avoid blocking users on db errors, but log it
      return { allowed: true, remaining: 1 };
    }
  }
}
