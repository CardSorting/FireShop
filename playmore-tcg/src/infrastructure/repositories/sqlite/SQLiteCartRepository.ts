/**
 * [LAYER: INFRASTRUCTURE]
 * SQLite Implementation of Cart Repository using Kysely
 */
import { Kysely } from 'kysely';
import { getSQLiteDB } from '../../sqlite/database';
import type { Database } from '../../sqlite/schema';
import type { ICartRepository } from '@domain/repositories';
import type { Cart } from '@domain/models';

export class SQLiteCartRepository implements ICartRepository {
  private db: Kysely<Database>;

  constructor() {
    this.db = getSQLiteDB();
  }

  private mapTableToCart(row: any): Cart {
    return {
      id: row.id,
      userId: row.userId,
      items: JSON.parse(row.items),
      updatedAt: new Date(row.updatedAt),
    };
  }

  async getByUserId(userId: string): Promise<Cart | null> {
    const result = await this.db
      .selectFrom('carts')
      .selectAll()
      .where('userId', '=', userId)
      .executeTakeFirst();

    return result ? this.mapTableToCart(result) : null;
  }

  async save(cart: Cart): Promise<void> {
    const now = new Date().toISOString();
    
    // Check if exists
    const existing = await this.getByUserId(cart.userId);
    
    if (existing) {
      await this.db
        .updateTable('carts')
        .set({
          items: JSON.stringify(cart.items),
          updatedAt: now,
        })
        .where('userId', '=', cart.userId)
        .execute();
    } else {
      await this.db
        .insertInto('carts')
        .values({
          id: cart.id || crypto.randomUUID(),
          userId: cart.userId,
          items: JSON.stringify(cart.items),
          updatedAt: now,
        })
        .execute();
    }
  }


  async clear(userId: string): Promise<void> {
    await this.db
      .deleteFrom('carts')
      .where('userId', '=', userId)
      .execute();
  }
}
