/**
 * [LAYER: INFRASTRUCTURE]
 * Distributed Locking Provider using SQLite for synchronization across multiple nodes/lambdas.
 * Compliant with BroccoliQ Level 7 integrity standards.
 */
import { Kysely } from 'kysely';
import { getSQLiteDB } from '../sqlite/database';
import type { Database } from '../sqlite/schema';
import type { ILockProvider } from '@domain/repositories';
import { logger } from '@utils/logger';

export class SQLiteLockProvider implements ILockProvider {
  private db: Kysely<Database>;

  constructor() {
    this.db = getSQLiteDB();
  }

  async acquireLock(resourceId: string, owner: string, ttlMs = 30000): Promise<boolean> {
    const now = Date.now();
    const expiresAt = new Date(now + ttlMs).toISOString();
    const nowIso = new Date(now).toISOString();

    try {
      // BroccoliQ Agent Shadow: Attempt to claim the lock.
      // We use a transaction and a check for existing expired locks.
      return await this.db.transaction().execute(async (trx) => {
        // 1. Prune expired locks for this resource to prevent permanent deadlocks
        await trx
          .deleteFrom('hive_claims')
          .where('id', '=', resourceId)
          .where('expiresAt', '<', nowIso)
          .execute();

        // 2. Try to insert the new lock
        try {
          await trx
            .insertInto('hive_claims')
            .values({
              id: resourceId,
              owner,
              expiresAt,
              createdAt: nowIso,
            })
            .execute();
          return true;
        } catch (err) {
          // If insert fails, it means someone else holds the lock
          return false;
        }
      });
    } catch (err) {
      logger.error(`Failed to acquire lock for ${resourceId}`, err);
      return false;
    }
  }

  async releaseLock(resourceId: string, owner: string): Promise<void> {
    try {
      await this.db
        .deleteFrom('hive_claims')
        .where('id', '=', resourceId)
        .where('owner', '=', owner)
        .execute();
    } catch (err) {
      logger.error(`Failed to release lock for ${resourceId}`, err);
    }
  }
}
