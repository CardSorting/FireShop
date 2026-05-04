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
  deleteDoc
} from 'firebase/firestore';
import { getDb } from '@infrastructure/firebase/firebase';
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
    const id = crypto.randomUUID();
    const now = Timestamp.now();
    const detailsStr = JSON.stringify(params.details || {});

    // Get the latest log to link the chain
    const q = query(collection(getDb(), this.collectionName), orderBy('createdAt', 'desc'), limit(1));
    const snapshot = await getDocs(q);
    const lastEntry = snapshot.empty ? null : snapshot.docs[0].data();

    const previousHash = lastEntry?.hash || '0'.repeat(64);
    
    // Calculate current hash
    const payload = `${id}|${params.action}|${params.targetId}|${detailsStr}|${previousHash}|${now.toDate().toISOString()}`;
    const hash = crypto.createHash('sha256').update(payload).digest('hex');

    await setDoc(doc(getDb(), this.collectionName, id), {
      id,
      userId: params.userId,
      userEmail: params.userEmail,
      action: params.action,
      targetId: params.targetId,
      details: detailsStr,
      hash,
      previousHash,
      createdAt: now,
    });

    if (params.ip || params.userAgent) {
      logger.info(`[Forensic] Audit Event: ${params.action} by ${params.userEmail} (${params.ip || 'no-ip'})`);
    }
  }

  async getRecentLogs(options?: {
    limit?: number;
    userId?: string;
    action?: string;
    targetId?: string;
    query?: string;
  }): Promise<AuditEntry[]> {
    const q = query(collection(getDb(), this.collectionName), orderBy('createdAt', 'desc'), limit(options?.limit || 50));
    
    // Firestore limited filtering: multiple where + orderBy requires composite index
    // For now, we'll fetch and filter in memory if multiple options are present
    const snapshot = await getDocs(q);
    let logs = snapshot.docs.map(d => {
      const data = d.data();
      return {
        ...data,
        createdAt: data.createdAt.toDate(),
      } as AuditEntry;
    });

    if (options?.userId) logs = logs.filter(l => l.userId === options.userId);
    if (options?.action) logs = logs.filter(l => l.action === options.action);
    if (options?.targetId) logs = logs.filter(l => l.targetId === options.targetId);

    return logs;
  }

  async verifyChain(): Promise<{ valid: boolean; total: number; corruptedId?: string }> {
    const q = query(collection(getDb(), this.collectionName), orderBy('createdAt', 'asc'));
    const snapshot = await getDocs(q);
    const logs = snapshot.docs.map(d => ({ ...d.data(), id: d.id }));

    let expectedPreviousHash = '0'.repeat(64);

    for (const log of logs as any) {
      const createdAtStr = log.createdAt instanceof Timestamp ? log.createdAt.toDate().toISOString() : new Date(log.createdAt).toISOString();
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
    const snapshot = await getDocs(collection(getDb(), this.collectionName));
    const batchSize = 100;
    // Simple deletion for small numbers, but for safety:
    for (const d of snapshot.docs) {
      await deleteDoc(d.ref);
    }
  }
}
