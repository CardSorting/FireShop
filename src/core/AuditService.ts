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
  | 'order_placed' | 'order_status_changed' | 'order_refunded'
  | 'discount_created' | 'discount_updated' | 'discount_deleted'
  | 'settings_updated' | 'staff_added' | 'staff_removed'
  | 'checkout_reconciliation_required' | 'payment_received_on_cancelled_order'
  | 'purchase_order.created' | 'purchase_order.submitted' | 'purchase_order.cancelled' | 'purchase_order.closed' | 'purchase_order.items_received'
  | 'supplier.created' | 'supplier.updated' | 'supplier.deleted'
  | 'collection.created' | 'collection.updated' | 'collection.deleted'
  | 'category_created' | 'category_updated' | 'category_deleted'
  | 'product_type_created' | 'product_type_updated' | 'product_type_deleted'
  | 'wishlist_created' | 'wishlist_updated' | 'wishlist_deleted';

export interface AuditEntry {
  id: string;
  userId: string;
  userEmail: string;
  action: AuditAction;
  targetId: string;
  details: string; // JSON string
  hash: string | null;
  previousHash: string | null;
  createdAt: Date;
  clientCreatedAt?: string; // ISO string used for hashing
}

export class AuditService {
  private readonly collectionName = 'hive_audit';

  async record(params: {
    userId: string;
    userEmail: string;
    action: AuditAction;
    targetId: string;
    details?: any;
    ip?: string;
    userAgent?: string;
  }): Promise<void> {
    try {
      const id = crypto.randomUUID();
      const detailsStr = JSON.stringify(params.details || {});

      await runTransaction(getUnifiedDb(), async (transaction) => {
        // Get the latest log to link the chain atomically
        const q = query(
          collection(getUnifiedDb(), this.collectionName), 
          orderBy('createdAt', 'desc'), 
          limit(1)
        );
        const snapshot = await getDocs(q);
        const lastEntry = snapshot.empty ? null : snapshot.docs[0].data();
        const previousHash = lastEntry?.hash || '0'.repeat(64);
        
        const now = new Date();
        const payload = `${id}|${params.action}|${params.targetId}|${detailsStr}|${previousHash}|${now.toISOString()}`;
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
          createdAt: serverTimestamp(),
          clientCreatedAt: now.toISOString() // Store client date for hash verification later
        });
      });

      if (params.ip || params.userAgent) {
        logger.info(`[Forensic] Audit Event: ${params.action}`, { email: params.userEmail, targetId: params.targetId });
      }
    } catch (err) {
      logger.error('Failed to record audit entry', { params, err });
    }
  }

  async getRecentLogs(options?: {
    limit?: number;
    userId?: string;
    action?: string;
    targetId?: string;
    query?: string;
    signal?: AbortSignal;
  }): Promise<AuditEntry[]> {
    if (options?.signal?.aborted) return [];
    const q = query(collection(getUnifiedDb(), this.collectionName), orderBy('createdAt', 'desc'), limit(options?.limit || 50));
    
    // Firestore limited filtering: multiple where + orderBy requires composite index
    // For now, we'll fetch and filter in memory if multiple options are present
    const snapshot = await getDocs(q);
    if (options?.signal?.aborted) return [];
    let logs = snapshot.docs.map((d: QueryDocumentSnapshot) => {
      const data = d.data() as any;
      return {
        ...data,
        createdAt: data.createdAt.toDate(),
      } as AuditEntry;
    });

    if (options?.userId) logs = logs.filter((l: AuditEntry) => l.userId === options.userId);
    if (options?.action) logs = logs.filter((l: AuditEntry) => l.action === options.action);
    if (options?.targetId) logs = logs.filter((l: AuditEntry) => l.targetId === options.targetId);

    return logs;
  }

  async verifyChain(): Promise<{ valid: boolean; total: number; corruptedId?: string }> {
    const q = query(collection(getUnifiedDb(), this.collectionName), orderBy('createdAt', 'asc'));
    const snapshot = await getDocs(q);
    const logs = snapshot.docs.map((d: QueryDocumentSnapshot) => ({ ...d.data() as any, id: d.id }));

    let expectedPreviousHash = '0'.repeat(64);

    for (const log of logs) {
      const createdAtStr = log.clientCreatedAt || (log.createdAt instanceof Timestamp ? log.createdAt.toDate().toISOString() : new Date(log.createdAt).toISOString());
      const payload = `${log.id}|${log.action}|${log.targetId}|${log.details}|${log.previousHash}|${createdAtStr}`;
      const actualHash = crypto.createHash('sha256').update(payload).digest('hex');

      if (actualHash !== log.hash || log.previousHash !== expectedPreviousHash) {
        return { valid: false, total: logs.length, corruptedId: log.id };
      }

      expectedPreviousHash = log.hash!;
    }

    return { valid: true, total: logs.length };
  }

  async clearAll(): Promise<void> {
    const snapshot = await getDocs(collection(getUnifiedDb(), this.collectionName));
    if (snapshot.empty) return;

    const batch = writeBatch(getUnifiedDb());
    snapshot.docs.forEach((d: QueryDocumentSnapshot) => batch.delete(doc(getUnifiedDb(), this.collectionName, d.id)));
    await batch.commit();
    logger.warn('Audit logs cleared', { count: snapshot.size });
  }
}
