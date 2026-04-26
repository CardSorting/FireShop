/**
 * [LAYER: INFRASTRUCTURE]
 * SQLite Implementation of Cart Repository using Kysely
 */
import { Kysely } from 'kysely';
import { getSQLiteDB } from '../../sqlite/database';
import type { Database } from '../../sqlite/schema';
import type { CartTable } from '../../sqlite/schema';
import type { ICartRepository } from '@domain/repositories';
import type { Cart, CartItem } from '@domain/models';
import { DomainError } from '@domain/errors';
import { logger } from '@utils/logger';

function isCartItem(value: unknown): value is CartItem {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const candidate = value as Partial<CartItem>;
  return typeof candidate.productId === 'string'
    && typeof candidate.name === 'string'
    && Number.isInteger(candidate.priceSnapshot)
    && Number.isInteger(candidate.quantity)
    && typeof candidate.imageUrl === 'string';
}

function parseCartItems(value: string): CartItem[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(value) as unknown;
  } catch {
    throw new DomainError('Stored cart data is invalid JSON.');
  }
  if (!Array.isArray(parsed) || !parsed.every(isCartItem)) {
    throw new DomainError('Stored cart data is invalid.');
  }
  return parsed;
}

export class SQLiteCartRepository implements ICartRepository {
  private db: Kysely<Database>;

  // BroccoliQ Level 3: Dual-Buffering State
  private activeBuffer: Map<string, Cart | null> = new Map();
  private inFlightBuffer: Map<string, Cart | null> = new Map();
  private isFlushing = false;
  private flushTimer: NodeJS.Timeout | null = null;
  
  // BroccoliQ Level 11: Memory Backpressure Hardening
  private readonly MAX_BUFFER_SIZE = 5000;

  constructor() {
    this.db = getSQLiteDB();
    this.startFlushLoop();
  }

  private mapTableToCart(row: CartTable): Cart {
    return {
      id: row.id,
      userId: row.userId,
      items: parseCartItems(row.items),
      updatedAt: new Date(row.updatedAt),
    };
  }

  // BroccoliQ Level 7: The Triple-Layer Recursive Merge
  async getByUserId(userId: string): Promise<Cart | null> {
    // 1. Check Active Buffer (most recent)
    if (this.activeBuffer.has(userId)) {
      return this.activeBuffer.get(userId)!;
    }
    // 2. Check In-Flight Buffer
    if (this.inFlightBuffer.has(userId)) {
      return this.inFlightBuffer.get(userId)!;
    }
    // 3. Physical Disk Fallback
    const result = await this.db
      .selectFrom('carts')
      .selectAll()
      .where('userId', '=', userId)
      .executeTakeFirst();

    return result ? this.mapTableToCart(result) : null;
  }

  // BroccoliQ Level 3 & 11: 0ms Write to Memory with Backpressure
  async save(cart: Cart): Promise<void> {
    if (this.activeBuffer.size >= this.MAX_BUFFER_SIZE) {
      throw new Error('[Hive] Level 11 Backpressure: Active buffer saturated. System throttling writes to prevent OOM.');
    }
    this.activeBuffer.set(cart.userId, { ...cart, updatedAt: new Date() });
    await this.flushBufferToDisk();
  }

  async clear(userId: string): Promise<void> {
    if (this.activeBuffer.size >= this.MAX_BUFFER_SIZE) {
      throw new Error('[Hive] Level 11 Backpressure: Active buffer saturated. System throttling writes to prevent OOM.');
    }
    this.activeBuffer.set(userId, null);
    await this.flushBufferToDisk();
  }

  // BroccoliQ Level 4: Atomic Flush Synchronization
  private startFlushLoop() {
    this.flushTimer = setInterval(() => this.flushBufferToDisk(), 1000); // 1-second flush cycle (Agent Velocity)
  }

  private async flushBufferToDisk() {
    if (this.isFlushing) {
      while (this.isFlushing) {
        await new Promise(r => setTimeout(r, 10));
      }
    }
    if (this.activeBuffer.size === 0) return;
    
    this.isFlushing = true;
    
    // The Protected Swap (L3)
    this.inFlightBuffer = new Map(this.activeBuffer);
    this.activeBuffer.clear();

    try {
      await this.db.transaction().execute(async (trx) => {
        for (const [userId, cart] of this.inFlightBuffer.entries()) {
          if (cart === null) {
            await trx.deleteFrom('carts').where('userId', '=', userId).execute();
          } else {
            const exists = await trx
              .selectFrom('carts')
              .select('id')
              .where('userId', '=', userId)
              .executeTakeFirst();

            if (exists) {
              await trx
                .updateTable('carts')
                .set({
                  items: JSON.stringify(cart.items),
                  updatedAt: cart.updatedAt.toISOString(),
                })
                .where('userId', '=', userId)
                .execute();
            } else {
              await trx
                .insertInto('carts')
                .values({
                  id: cart.id || crypto.randomUUID(),
                  userId: cart.userId,
                  items: JSON.stringify(cart.items),
                  updatedAt: cart.updatedAt.toISOString(),
                })
                .execute();
            }
          }
        }
      });
    } catch (err) {
      logger.error('[Hive] Level 11 Alert: Cart Buffer Flush failed. Re-queuing ops to prevent data loss.', err);
      // Safely merge failed ops back into activeBuffer WITHOUT overwriting newer ops
      for (const [failedUserId, failedCart] of this.inFlightBuffer.entries()) {
        if (!this.activeBuffer.has(failedUserId)) {
          this.activeBuffer.set(failedUserId, failedCart);
        }
      }
    } finally {
      this.inFlightBuffer.clear();
      this.isFlushing = false;
    }
  }

  // BroccoliQ Level 9: Final Sovereign Flush (Graceful Shutdown)
  public async shutdown(): Promise<void> {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    
    // Wait for any in-flight flushes to complete
    while (this.isFlushing) {
      await new Promise(r => setTimeout(r, 10));
    }
    
    // Force one final flush if the active buffer has remaining ops
    if (this.activeBuffer.size > 0) {
      await this.flushBufferToDisk();
    }
  }
}
