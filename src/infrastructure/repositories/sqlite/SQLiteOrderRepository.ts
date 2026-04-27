/**
 * [LAYER: INFRASTRUCTURE]
 * SQLite Implementation of Order Repository using Kysely
 */
import { Kysely } from 'kysely';
import { getSQLiteDB } from '../../sqlite/database';
import type { Database } from '../../sqlite/schema';
import type { OrderTable } from '../../sqlite/schema';
import type { IOrderRepository } from '@domain/repositories';
import type { Address, Order, OrderItem, OrderStatus } from '@domain/models';
import { DomainError } from '@domain/errors';

function isOrderItem(value: unknown): value is OrderItem {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const candidate = value as Partial<OrderItem>;
  return typeof candidate.productId === 'string'
    && typeof candidate.name === 'string'
    && Number.isInteger(candidate.quantity)
    && Number.isInteger(candidate.unitPrice);
}

function isAddress(value: unknown): value is Address {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const candidate = value as Partial<Address>;
  return typeof candidate.street === 'string'
    && typeof candidate.city === 'string'
    && typeof candidate.state === 'string'
    && typeof candidate.zip === 'string'
    && typeof candidate.country === 'string';
}

function parseOrderItems(value: string): OrderItem[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(value) as unknown;
  } catch {
    throw new DomainError('Stored order item data is invalid JSON.');
  }
  if (!Array.isArray(parsed) || !parsed.every(isOrderItem)) {
    throw new DomainError('Stored order item data is invalid.');
  }
  return parsed;
}

function parseAddress(value: string): Address {
  let parsed: unknown;
  try {
    parsed = JSON.parse(value) as unknown;
  } catch {
    throw new DomainError('Stored order address data is invalid JSON.');
  }
  if (!isAddress(parsed)) {
    throw new DomainError('Stored order address data is invalid.');
  }
  return parsed;
}

function parseOrderStatus(value: string): OrderStatus {
  if (value === 'pending' || value === 'confirmed' || value === 'shipped' || value === 'delivered' || value === 'cancelled') {
    return value;
  }
  throw new DomainError('Stored order status is invalid.');
}

export class SQLiteOrderRepository implements IOrderRepository {
  private db: Kysely<Database>;

  constructor() {
    this.db = getSQLiteDB();
  }

  private mapTableToOrder(row: any): Order {
    return {
      id: row.id,
      userId: row.userId,
      items: parseOrderItems(row.items),
      total: row.total,
      status: parseOrderStatus(row.status),
      shippingAddress: parseAddress(row.shippingAddress),
      paymentTransactionId: row.paymentTransactionId,
      customerName: row.displayName,
      customerEmail: row.email,
      riskScore: row.riskScore || 0,
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
        riskScore: Math.floor(Math.random() * 15), // Simulated analysis: low risk for new orders
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
      .innerJoin('users', 'users.id', 'orders.userId')
      .select([
        'orders.id',
        'orders.userId',
        'orders.items',
        'orders.total',
        'orders.status',
        'orders.shippingAddress',
        'orders.paymentTransactionId',
        'orders.riskScore',
        'orders.createdAt',
        'orders.updatedAt',
        'users.displayName',
        'users.email'
      ])
      .where('orders.id', '=', id)
      .executeTakeFirst();

    return result ? this.mapTableToOrder(result) : null;
  }

  async getByUserId(userId: string): Promise<Order[]> {
    const results = await this.db
      .selectFrom('orders')
      .innerJoin('users', 'users.id', 'orders.userId')
      .select([
        'orders.id',
        'orders.userId',
        'orders.items',
        'orders.total',
        'orders.status',
        'orders.shippingAddress',
        'orders.paymentTransactionId',
        'orders.riskScore',
        'orders.createdAt',
        'orders.updatedAt',
        'users.displayName',
        'users.email'
      ])
      .where('orders.userId', '=', userId)
      .orderBy('orders.createdAt', 'desc')
      .execute();

    return results.map(this.mapTableToOrder);
  }

  async getAll(options?: {
    status?: OrderStatus;
    limit?: number;
    cursor?: string;
  }): Promise<{ orders: Order[]; nextCursor?: string }> {
    let query = this.db
      .selectFrom('orders')
      .innerJoin('users', 'users.id', 'orders.userId')
      .select([
        'orders.id',
        'orders.userId',
        'orders.items',
        'orders.total',
        'orders.status',
        'orders.shippingAddress',
        'orders.paymentTransactionId',
        'orders.riskScore',
        'orders.createdAt',
        'orders.updatedAt',
        'users.displayName',
        'users.email'
      ]);

    if (options?.status) {
      query = query.where('orders.status', '=', options.status);
    }

    if (options?.cursor) {
      const cursorOrder = await this.db
        .selectFrom('orders')
        .select(['id', 'createdAt'])
        .where('id', '=', options.cursor)
        .executeTakeFirst();

      if (cursorOrder) {
        query = query.where((eb) => eb.or([
          eb('orders.createdAt', '<', cursorOrder.createdAt),
          eb.and([
            eb('orders.createdAt', '=', cursorOrder.createdAt),
            eb('orders.id', '>', cursorOrder.id),
          ]),
        ]));
      }
    }

    const limitCount = options?.limit ?? 20;
    const results = await query
      .orderBy('orders.createdAt', 'desc')
      .orderBy('orders.id', 'asc')
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

  async seed(order: Order): Promise<void> {
    await this.db
      .insertInto('orders')
      .values({
        id: order.id,
        userId: order.userId,
        items: JSON.stringify(order.items),
        total: order.total,
        status: order.status,
        shippingAddress: JSON.stringify(order.shippingAddress),
        paymentTransactionId: order.paymentTransactionId,
        riskScore: order.riskScore,
        createdAt: order.createdAt.toISOString(),
        updatedAt: order.updatedAt.toISOString(),
      })
      .execute();
  }
}
