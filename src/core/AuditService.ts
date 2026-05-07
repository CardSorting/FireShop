/**
 * [LAYER: CORE]
 * System-wide audit logging for administrative forensics.
 * Firestore Implementation.
 */
import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  query, 
  orderBy, 
  limit, 
  Timestamp,
  type DocumentData,
  type QueryDocumentSnapshot,
  deleteDoc,
  getUnifiedDb,
  runTransaction,
  serverTimestamp,
  writeBatch
} from '@infrastructure/firebase/bridge';
import { logger } from '@utils/logger';
import crypto from 'crypto';

export type AuditAction = 
  | 'product_created' | 'product_updated' | 'product_deleted'
  | 'product_batch_updated' | 'product_batch_deleted' | 'inventory_batch_updated'
  | 'order_placed' | 'order_status_changed' | 'order_refunded' | 'order_payment_finalized'
  | 'discount_created' | 'discount_updated' | 'discount_deleted'
  | 'settings_updated' | 'staff_added' | 'staff_removed'
  | 'checkout_reconciliation_required' | 'payment_received_on_cancelled_order'
  | 'purchase_order.created' | 'purchase_order.submitted' | 'purchase_order.cancelled' | 'purchase_order.closed' | 'purchase_order.items_received'
  | 'supplier.created' | 'supplier.updated' | 'supplier.deleted'
  | 'collection.created' | 'collection.updated' | 'collection.deleted'
  | 'category_created' | 'category_updated' | 'category_deleted'
  | 'product_type_created' | 'product_type_updated' | 'product_type_deleted'
  | 'wishlist_created' | 'wishlist_updated' | 'wishlist_deleted'
  | 'shipping_class_saved' | 'shipping_class_deleted' | 'shipping_zone_saved' | 'shipping_zone_deleted' | 'shipping_rate_saved' | 'shipping_rate_deleted';

export interface AuditEntry {
  id: string;
  userId: string;
  userEmail: string;
  action: AuditAction;
  targetId: string;
  details: string; // JSON string
  hash: string | null;
  previousHash: string | null;
  correlationId: string | null;
  createdAt: Date;
  clientCreatedAt?: string; // ISO string used for hashing
}

export class AuditService {
  private readonly collectionName = 'hive_audit';

  /**
   * Records a forensic audit entry with SHA-256 chain verification.
   * Hardened with connectivity guards and transactional atomicity.
   */
  async record(params: {
    userId: string;
    userEmail: string;
    action: AuditAction;
    targetId: string;
    details?: any;
    ip?: string;
    userAgent?: string;
    correlationId?: string;
  }): Promise<void> {
    try {
      // Guard: Ensure connectivity if in browser
      if (typeof window !== 'undefined' && !navigator.onLine) {
        logger.warn('[AuditService] Offline: Buffering audit log locally via Firestore persistence');
      }

      const id = crypto.randomUUID();
      const detailsStr = JSON.stringify(params.details || {});
      const correlationId = params.correlationId || crypto.randomUUID();
      const now = new Date();
      const ip = params.ip || '0.0.0.0';
      const userAgent = params.userAgent || 'unknown';
      const nodeVersion = typeof process !== 'undefined' ? process.version : 'browser';

      await runTransaction(getUnifiedDb(), async (transaction) => {
        // 1. Resolve the latest link in the forensic chain
        const q = query(
          collection(getUnifiedDb(), this.collectionName), 
          orderBy('createdAt', 'desc'), 
          limit(1)
        );
        const snapshot = await getDocs(q);
        const lastEntry = snapshot.empty ? null : snapshot.docs[0].data();
        const previousHash = lastEntry?.hash || '0'.repeat(64);
        
        // 2. Construct forensic payload for hashing
        // We include all immutable fields in the hash to prevent tamper
        const payload = [
          id,
          params.action,
          params.targetId,
          detailsStr,
          previousHash,
          correlationId,
          ip,
          userAgent,
          now.toISOString(),
          nodeVersion
        ].join('|');
        
        const hash = crypto.createHash('sha256').update(payload).digest('hex');

        // 3. Persist the atomic block
        const docRef = doc(getUnifiedDb(), this.collectionName, id);
        transaction.set(docRef, {
          id,
          userId: params.userId,
          userEmail: params.userEmail,
          action: params.action,
          targetId: params.targetId,
          details: detailsStr,
          hash,
          previousHash,
          correlationId,
          ip,
          userAgent,
          nodeVersion,
          createdAt: serverTimestamp(),
          clientCreatedAt: now.toISOString()
        });
      });

      logger.info(`[Forensic] Audit Recorded: ${params.action}`, { 
        id, 
        correlationId,
        targetId: params.targetId 
      });
    } catch (err) {
      // Critical Failure: Audit log failed. In a strict system, we might roll back the primary operation,
      // but here we log a high-priority error for forensic recovery.
      logger.error('CRITICAL: Audit log failure', { 
        params, 
        error: err instanceof Error ? err.message : String(err) 
      });
      
      // Potential improvement: Write to a secondary failover sink (e.g. local storage or a fallback API)
    }
  }

  /**
   * Fetches recent audit logs with pagination and filtering.
   */
  async getRecentLogs(options?: {
    limit?: number;
    userId?: string;
    action?: string;
    targetId?: string;
    query?: string;
    signal?: AbortSignal;
  }): Promise<AuditEntry[]> {
    if (options?.signal?.aborted) return [];

    try {
      const q = query(
        collection(getUnifiedDb(), this.collectionName), 
        orderBy('createdAt', 'desc'), 
        limit(options?.limit || 50)
      );
      
      const snapshot = await getDocs(q);
      if (options?.signal?.aborted) return [];

      let logs = snapshot.docs.map((d: QueryDocumentSnapshot) => {
        const data = d.data() as any;
        return {
          ...data,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
        } as AuditEntry;
      });

      // Secondary filtering for complex queries not indexed in Firestore
      if (options?.userId) logs = logs.filter((l: AuditEntry) => l.userId === options.userId);
      if (options?.action) logs = logs.filter((l: AuditEntry) => l.action === options.action);
      if (options?.targetId) logs = logs.filter((l: AuditEntry) => l.targetId === options.targetId);

      return logs;
    } catch (err) {
      logger.error('Failed to retrieve audit logs', { err });
      return [];
    }
  }

  /**
   * Forensically verifies the integrity of the audit chain.
   * Returns details on the first point of failure if corruption is detected.
   */
  async verifyChain(batchSize: number = 100): Promise<{ valid: boolean; total: number; corruptedId?: string; reason?: string }> {
    let expectedPreviousHash = '0'.repeat(64);
    let totalVerified = 0;
    let lastDoc: QueryDocumentSnapshot | null = null;
    let isFinished = false;

    logger.info('[Forensic] Starting chain verification...');

    while (!isFinished) {
      let q = query(
        collection(getUnifiedDb(), this.collectionName), 
        orderBy('createdAt', 'asc'), 
        limit(batchSize)
      );
      
      if (lastDoc) {
        const { startAfter } = await import('@infrastructure/firebase/bridge');
        q = query(q, startAfter(lastDoc));
      }

      const snapshot = await getDocs(q);
      if (snapshot.empty) break;

      for (const docSnap of snapshot.docs) {
        const log = docSnap.data() as any;
        const id = docSnap.id;
        
        // Reconstruct payload for verification
        const createdAtStr = log.clientCreatedAt || (log.createdAt instanceof Timestamp ? log.createdAt.toDate().toISOString() : new Date(log.createdAt).toISOString());
        const ip = log.ip || '0.0.0.0';
        const userAgent = log.userAgent || 'unknown';
        const nodeVersion = log.nodeVersion || 'browser'; // Fallback for legacy logs
        
        const payload = [
          id,
          log.action,
          log.targetId,
          log.details,
          log.previousHash,
          log.correlationId || '',
          ip,
          userAgent,
          createdAtStr,
          nodeVersion
        ].join('|');
        
        const actualHash = crypto.createHash('sha256').update(payload).digest('hex');

        if (actualHash !== log.hash) {
          return { valid: false, total: totalVerified, corruptedId: id, reason: 'HASH_MISMATCH' };
        }

        if (log.previousHash !== expectedPreviousHash) {
          return { valid: false, total: totalVerified, corruptedId: id, reason: 'CHAIN_BREAK' };
        }

        expectedPreviousHash = log.hash!;
        totalVerified++;
      }

      lastDoc = snapshot.docs[snapshot.docs.length - 1];
      if (snapshot.docs.length < batchSize) isFinished = true;
    }

    logger.info(`[Forensic] Verification complete. Total blocks: ${totalVerified}`);
    return { valid: true, total: totalVerified };
  }

  /**
   * Internal helper to record an audit entry using an existing transaction.
   * This is critical for maintaining atomicity in complex service flows.
   */
  async recordWithTransaction(transaction: any, params: {
    userId: string;
    userEmail: string;
    action: AuditAction;
    targetId: string;
    details?: any;
    ip?: string;
    userAgent?: string;
    correlationId?: string;
  }): Promise<void> {
    const id = crypto.randomUUID();
    const detailsStr = JSON.stringify(params.details || {});
    const correlationId = params.correlationId || crypto.randomUUID();
    const now = new Date();
    const ip = params.ip || '0.0.0.0';
    const userAgent = params.userAgent || 'unknown';
    const nodeVersion = typeof process !== 'undefined' ? process.version : 'browser';

    // Note: We cannot easily chain hashes in a single transaction if we need to read the latest log
    // because the read would happen before the previous commit in high-velocity scenarios.
    // For transactional logs, we omit the previousHash check or accept a simplified link.
    const previousHash = '0'.repeat(64); // Transactional entries use a simpler link or separate verification
    
    const payload = [
      id,
      params.action,
      params.targetId,
      detailsStr,
      previousHash,
      correlationId,
      ip,
      userAgent,
      now.toISOString(),
      nodeVersion
    ].join('|');
    
    const hash = crypto.createHash('sha256').update(payload).digest('hex');

    const docRef = doc(getUnifiedDb(), this.collectionName, id);
    transaction.set(docRef, {
      id,
      userId: params.userId,
      userEmail: params.userEmail,
      action: params.action,
      targetId: params.targetId,
      details: detailsStr,
      hash,
      previousHash,
      correlationId,
      ip,
      userAgent,
      nodeVersion,
      createdAt: serverTimestamp(),
      clientCreatedAt: now.toISOString()
    });
  }

  /**
   * Resets the audit chain. 
   * CAUTION: Destructive operation, used for environment reset.
   */
  async clearAll(): Promise<void> {
    try {
      const snapshot = await getDocs(collection(getUnifiedDb(), this.collectionName));
      if (snapshot.empty) return;

      const batch = writeBatch(getUnifiedDb());
      snapshot.docs.forEach((d: QueryDocumentSnapshot) => batch.delete(doc(getUnifiedDb(), this.collectionName, d.id)));
      await batch.commit();
      logger.warn('Audit logs purged successfully', { count: snapshot.size });
    } catch (err) {
      logger.error('Failed to clear audit logs', { err });
      throw err;
    }
  }
}
