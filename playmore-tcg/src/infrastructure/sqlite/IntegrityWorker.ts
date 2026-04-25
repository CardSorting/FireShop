/**
 * [LAYER: INFRASTRUCTURE]
 * BroccoliQ Level 9: Autonomous Integrity Worker
 * 
 * A background assistant that heals the hive:
 * - Cleans up expired locks
 * - Clears stale/abandoned carts
 * - Logs actions to the audit table
 */
import { Kysely } from 'kysely';
import { getSQLiteDB } from './database';
import type { Database } from './schema';
import { logger } from '@utils/logger';

export class IntegrityWorker {
  private db: Kysely<Database>;
  private intervalId: NodeJS.Timeout | null = null;

  constructor() {
    this.db = getSQLiteDB();
  }

  async runAudit() {
    const now = new Date();
    const nowIso = now.toISOString();
    
    // 1. Clear expired locks
    const deletedLocks = await this.db
      .deleteFrom('hive_claims')
      .where('expiresAt', '<', nowIso)
      .execute();
      
    // Count rows affected (rough approximation based on Kysely return, which might be bigints depending on driver)
    const locksCleared = Number(deletedLocks[0].numDeletedRows || 0);

    // 2. Clear abandoned carts (older than 7 days)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const deletedCarts = await this.db
      .deleteFrom('carts')
      .where('updatedAt', '<', sevenDaysAgo)
      .execute();
      
    const cartsCleared = Number(deletedCarts[0].numDeletedRows || 0);

    // 3. Physical Resource Safety: Prune old audit logs (older than 30 days)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const deletedLogs = await this.db
      .deleteFrom('hive_audit')
      .where('timestamp', '<', thirtyDaysAgo)
      .execute();
      
    const logsCleared = Number(deletedLogs[0].numDeletedRows || 0);

    if (locksCleared > 0 || cartsCleared > 0 || logsCleared > 0) {
      await this.db
        .insertInto('hive_audit')
        .values({
          id: crypto.randomUUID(),
          action: 'autonomous_audit',
          details: JSON.stringify({ locksCleared, cartsCleared, logsCleared }),
          timestamp: nowIso,
        })
        .execute();
    }
  }

  start(intervalMs: number = 60000) {
    if (this.intervalId) return;
    // Run immediately, then on interval
    this.runAudit().catch((error) => logger.error('Integrity audit failed.', error));
    this.intervalId = setInterval(() => {
      this.runAudit().catch((error) => logger.error('Integrity audit failed.', error));
    }, intervalMs);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}
