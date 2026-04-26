/**
 * [LAYER: INFRASTRUCTURE]
 * SQLite Implementation of Order Repository using Kysely
 */
import { Kysely } from 'kysely';
import { getSQLiteDB } from '../../sqlite/database';
import type { Database } from '../../sqlite/schema';
import type { OrderTable } from '../../sqlite/schema';
import type { IOrderRepository } from '@domain/repositories';
import type { Order, OrderStatus } from '@domain/models';

export class SQLiteOrderRepository implements IOrderRepository {
  private db: Kysely<Database>;

  constructor() {
    this.db = getSQLiteDB();
  }

  private mapTableToOrder(row: OrderTable): Order {
    return {
      id: row.id,
      userId: row.userId,
      items: JSON.parse(row.items),
      total: row.total,
      status: row.status as OrderStatus,
      shippingAddress: JSON.parse(row.shippingAddress),
      paymentTransactionId: row.paymentTransactionId,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    };
  }

  async create(order: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>): Promise<Order> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    await this.db
      .insertInto('orders')
      .values({
        id,
        userId: order.userId,
        items: JSON.stringify(order.items),
        total: order.total,
        status: order.status,
        shippingAddress: JSON.stringify(order.shippingAddress),
        paymentTransactionId: order.paymentTransactionId || null,
        createdAt: now,
        updatedAt: now,
      })
      .execute();

    const created = await this.getById(id);
    if (!created) throw new Error('Failed to create order');
    return created;
  }

  async getById(id: string): Promise<Order | null> {
    const result = await this.db
      .selectFrom('orders')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();

    return result ? this.mapTableToOrder(result) : null;
  }

  async getByUserId(userId: string): Promise<Order[]> {
    const results = await this.db
      .selectFrom('orders')
      .selectAll()
      .where('userId', '=', userId)
      .orderBy('createdAt', 'desc')
      .execute();

    return results.map(this.mapTableToOrder);
  }

  async getAll(options?: {
    status?: OrderStatus;
    limit?: number;
    cursor?: string;
  }): Promise<{ orders: Order[]; nextCursor?: string }> {
    let query = this.db.selectFrom('orders').selectAll();

    if (options?.status) {
      query = query.where('status', '=', options.status);
    }

    if (options?.cursor) {
      query = query.where('id', '>', options.cursor);
    }

    const limitCount = options?.limit ?? 20;
    const results = await query
      .orderBy('createdAt', 'desc')
      .orderBy('id', 'asc')
      .limit(limitCount)
      .execute();

    const orders = results.map(this.mapTableToOrder);
    const nextCursor = orders.length === limitCount ? orders[orders.length - 1].id : undefined;

    return { orders, nextCursor };
  }

  async updateStatus(id: string, status: OrderStatus): Promise<void> {
    const now = new Date().toISOString();
    await this.db
      .updateTable('orders')
      .set({
        status,
        updatedAt: now,
      })
      .where('id', '=', id)
      .execute();
  }
}
