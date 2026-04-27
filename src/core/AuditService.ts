/**
 * [LAYER: CORE]
 * System-wide audit logging for administrative forensics.
 * Compliant with BroccoliQ Level 7 integrity standards.
 */
import { Kysely, sql } from 'kysely';
import { getSQLiteDB } from '@infrastructure/sqlite/database';
import { logger } from '@utils/logger';
import type { Database } from '@infrastructure/sqlite/schema';

export type AuditAction = 
  | 'product_created' | 'product_updated' | 'product_deleted'
  | 'product_batch_updated' | 'product_batch_deleted'
  | 'order_status_changed' | 'order_refunded'
  | 'discount_created' | 'discount_updated' | 'discount_deleted'
  | 'settings_updated' | 'staff_added' | 'staff_removed'
  | 'checkout_reconciliation_required';

export interface AuditEntry {
  id: string;
  userId: string;
  userEmail: string;
  action: AuditAction;
  targetId: string;
  details: string; // JSON string
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
  }): Promise<void> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    await this.db
      .insertInto('hive_audit')
      .values({
        id,
        userId: params.userId,
        userEmail: params.userEmail,
        action: params.action,
        targetId: params.targetId,
        details: JSON.stringify(params.details || {}),
        createdAt: now,
      })
      .execute();
  }

  async getRecentLogs(limit = 50): Promise<AuditEntry[]> {
    const rows = await this.db
      .selectFrom('hive_audit')
      .selectAll()
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .execute();

    return rows.map(row => ({
      ...row,
      action: row.action as AuditAction,
      createdAt: new Date(row.createdAt),
    }));
  }
}
