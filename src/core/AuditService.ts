/**
 * [LAYER: CORE]
 * System-wide audit logging for administrative forensics.
 * Compliant with BroccoliQ Level 7 integrity standards.
 */
import { Kysely, sql } from 'kysely';
import { getSQLiteDB } from '@infrastructure/sqlite/database';
import { logger } from '@utils/logger';
import type { Database } from '@infrastructure/sqlite/schema';
import crypto from 'crypto';

export type AuditAction = 
  | 'product_created' | 'product_updated' | 'product_deleted'
  | 'product_batch_updated' | 'product_batch_deleted'
  | 'order_placed' | 'order_status_changed' | 'order_refunded'
  | 'discount_created' | 'discount_updated' | 'discount_deleted'
  | 'settings_updated' | 'staff_added' | 'staff_removed'
  | 'checkout_reconciliation_required'
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
  private db: Kysely<Database>;

  constructor() {
    this.db = getSQLiteDB();
  }

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
    const now = new Date().toISOString();
    const detailsStr = JSON.stringify(params.details || {});

    // Forensic Integrity: Get the hash of the latest log to link the chain
    const lastEntry = await this.db
      .selectFrom('hive_audit')
      .select('hash')
      .orderBy('createdAt', 'desc')
      .limit(1)
      .executeTakeFirst();

    const previousHash = lastEntry?.hash || '0'.repeat(64);
    
    // Calculate current hash (id + action + targetId + details + previousHash + now)
    const payload = `${id}|${params.action}|${params.targetId}|${detailsStr}|${previousHash}|${now}`;
    const hash = crypto.createHash('sha256').update(payload).digest('hex');

    await this.db
      .insertInto('hive_audit')
      .values({
        id,
        userId: params.userId,
        userEmail: params.userEmail,
        action: params.action,
        targetId: params.targetId,
        details: detailsStr,
        hash,
        previousHash,
        createdAt: now,
      })
      .execute();

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
    let query = this.db
      .selectFrom('hive_audit')
      .selectAll()
      .orderBy('createdAt', 'desc')
      .limit(options?.limit || 50);

    if (options?.userId) query = query.where('userId', '=', options.userId);
    if (options?.action) query = query.where('action', '=', options.action);
    if (options?.targetId) query = query.where('targetId', '=', options.targetId);
    
    if (options?.query) {
      const needle = `%${options.query}%`;
      query = query.where((eb) => eb.or([
        eb('userEmail', 'like', needle),
        eb('action', 'like', needle),
        eb('details', 'like', needle),
        eb('targetId', 'like', needle)
      ]));
    }

    const rows = await query.execute();

    return rows.map(row => ({
      ...row,
      action: row.action as AuditAction,
      createdAt: new Date(row.createdAt),
    }));
  }

  async verifyChain(): Promise<{ valid: boolean; total: number; corruptedId?: string }> {
    const logs = await this.db
      .selectFrom('hive_audit')
      .selectAll()
      .orderBy('createdAt', 'asc')
      .execute();

    let expectedPreviousHash = '0'.repeat(64);

    for (const log of logs) {
      const payload = `${log.id}|${log.action}|${log.targetId}|${log.details}|${log.previousHash}|${log.createdAt}`;
      const actualHash = crypto.createHash('sha256').update(payload).digest('hex');

      if (actualHash !== log.hash || log.previousHash !== expectedPreviousHash) {
        logger.error(`[AuditService] Chain corruption detected at entry: ${log.id}`);
        return { valid: false, total: logs.length, corruptedId: log.id };
      }

      expectedPreviousHash = log.hash!;
    }

    logger.info(`[AuditService] Chain verified clean across ${logs.length} entries.`);
    return { valid: true, total: logs.length };
  }
}

