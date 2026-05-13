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
  Timestamp,
  runTransaction
} from '@infrastructure/firebase/bridge';
import { logger } from '@utils/logger';
import { AuditService } from './AuditService';

export class RateLimitService {
  private readonly collectionName = 'system_rate_limits';
  private readonly emergencyBuckets = new Map<string, { attempts: number; expiresAt: number }>();
  private audit: AuditService;

  constructor(auditService: AuditService) {
    this.audit = auditService;
  }

  /**
   * Checks if an action is allowed for a given key.
   * @param key Unique key (e.g., IP or User ID)
   * @param limit Max attempts
   * @param windowMs Time window in milliseconds
   */
  async isAllowed(key: string, limit: number, windowMs: number): Promise<{ allowed: boolean; remaining: number; resetTime?: Date }> {
    // PRODUCTION HARDENING: Anonymize the key (IP/User ID) via SHA-256 before storage
    // to prevent PII leakage (GDPR/CCPA) in the persistent rate-limit ledger.
    const crypto = await import('crypto');
    const hashedKey = crypto.createHash('sha256').update(key).digest('hex');
    const id = `limit_${hashedKey.slice(0, 32)}`;
    
    const db = getUnifiedDb();
    const docRef = doc(db, this.collectionName, id);

    try {
      return await runTransaction(db, async (transaction: any) => {
        const docSnap = await transaction.get(docRef);
        const now = Date.now();
        
        if (!docSnap.exists()) {
          const expiresAt = new Date(now + windowMs);
          transaction.set(docRef, {
            attempts: 1,
            firstAttempt: serverTimestamp(),
            expiresAt: expiresAt
          });
          return { allowed: true, remaining: limit - 1 };
        }

        const data = docSnap.data();
        const firstAttempt = (data.firstAttempt as Timestamp)?.toDate?.()?.getTime() || now;
        const expiresAt = (data.expiresAt as Timestamp)?.toDate?.() || new Date(now);
        const expiresAtTime = expiresAt.getTime();
        
        if (now > expiresAtTime) {
          // Window expired, reset
          const newExpiresAt = new Date(now + windowMs);
          transaction.set(docRef, {
            attempts: 1,
            firstAttempt: serverTimestamp(),
            expiresAt: newExpiresAt
          });
          return { allowed: true, remaining: limit - 1 };
        }

        if (data.attempts >= limit) {
          // Forensic: Record rate-limit breach as potential abuse
          await this.audit.record({
            userId: 'system',
            userEmail: 'security-alerts@dreambees.art',
            action: 'security_alert',
            targetId: hashedKey,
            details: { type: 'rate_limit_breach', limit }
          });
          return { allowed: false, remaining: 0, resetTime: expiresAt };
        }

        // Increment attempts atomically
        const nextAttempts = data.attempts + 1;
        transaction.update(docRef, {
          attempts: nextAttempts,
          updatedAt: serverTimestamp()
        });

        return { allowed: true, remaining: limit - nextAttempts };
      });
    } catch (err) {
      logger.error('[RateLimit] Error checking limit', { key, err });
      return this.checkEmergencyBucket(key, limit, windowMs);
    }
  }

  private checkEmergencyBucket(key: string, limit: number, windowMs: number): { allowed: boolean; remaining: number; resetTime?: Date } {
    const now = Date.now();
    const existing = this.emergencyBuckets.get(key);

    if (!existing || existing.expiresAt <= now) {
      this.emergencyBuckets.set(key, { attempts: 1, expiresAt: now + windowMs });
      return { allowed: true, remaining: limit - 1 };
    }

    if (existing.attempts >= limit) {
      return { allowed: false, remaining: 0, resetTime: new Date(existing.expiresAt) };
    }

    existing.attempts += 1;
    return { allowed: true, remaining: limit - existing.attempts };
  }
}
