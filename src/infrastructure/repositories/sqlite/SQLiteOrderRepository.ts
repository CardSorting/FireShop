/**
 * [LAYER: INFRASTRUCTURE]
 * SQLite Implementation of Order Repository using Kysely
 */
import { Kysely, sql } from 'kysely';
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

  private mapTableToOrder = (row: any): Order => {
    return {
      id: row.id,
      userId: row.userId,
      items: parseOrderItems(row.items),
      total: row.total,
      status: parseOrderStatus(row.status),
      shippingAddress: parseAddress(row.shippingAddress),
      paymentTransactionId: row.paymentTransactionId,
      trackingNumber: row.trackingNumber,
      shippingCarrier: row.shippingCarrier,
      notes: row.notes ? JSON.parse(row.notes) : [],
      customerName: row.displayName ?? null,
      customerEmail: row.email ?? null,
      riskScore: row.riskScore || 0,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    };
  };


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
        notes: JSON.stringify([]),
        riskScore: this.calculateRiskScore(order),
        createdAt: now,
        updatedAt: now,
      })
      .execute();

    const created = await this.getById(id);
    if (!created) throw new Error('Failed to create order');
    return created;
  }

  private calculateRiskScore(order: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>): number {
    let score = 5; // Base score
    
    // Rule 1: High value orders (>$1000)
    if (order.total > 100000) score += 20;
    
    // Rule 2: Many items (>10 units)
    const itemCount = order.items.reduce((sum, i) => sum + i.quantity, 0);
    if (itemCount > 10) score += 10;
    
    // Rule 3: International shipping risk (Non-domestic addresses flagged for verification)
    if (order.shippingAddress.country.toUpperCase() !== 'US') {
      score += 15;
    }

    return Math.min(score, 100);
  }

  async getById(id: string): Promise<Order | null> {
    const result = await this.db
      .selectFrom('orders')
      .leftJoin('users', 'users.id', 'orders.userId')
      .select([
        'orders.id',
        'orders.userId',
        'orders.items',
        'orders.total',
        'orders.status',
        'orders.shippingAddress',
        'orders.paymentTransactionId',
        'orders.trackingNumber',
        'orders.shippingCarrier',
        'orders.notes',
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
      .leftJoin('users', 'users.id', 'orders.userId')
      .select([
        'orders.id',
        'orders.userId',
        'orders.items',
        'orders.total',
        'orders.status',
        'orders.shippingAddress',
        'orders.paymentTransactionId',
        'orders.trackingNumber',
        'orders.shippingCarrier',
        'orders.notes',
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

  async updateNotes(orderId: string, notes: import('@domain/models').OrderNote[]): Promise<void> {
    await this.db
      .updateTable('orders')
      .set({ notes: JSON.stringify(notes), updatedAt: new Date().toISOString() })
      .where('id', '=', orderId)
      .execute();
  }

  async updateFulfillment(orderId: string, data: { trackingNumber?: string; shippingCarrier?: string }): Promise<void> {
    await this.db
      .updateTable('orders')
      .set({
        trackingNumber: data.trackingNumber ?? null,
        shippingCarrier: data.shippingCarrier ?? null,
        updatedAt: new Date().toISOString(),
      })
      .where('id', '=', orderId)
      .execute();
  }

  async getAll(options?: {
    status?: OrderStatus;
    query?: string;
    limit?: number;
    cursor?: string;
  }): Promise<{ orders: Order[]; nextCursor?: string }> {
    let query = this.db
      .selectFrom('orders')
      .leftJoin('users', 'users.id', 'orders.userId')
      .select([
        'orders.id',
        'orders.userId',
        'orders.items',
        'orders.total',
        'orders.status',
        'orders.shippingAddress',
        'orders.paymentTransactionId',
        'orders.trackingNumber',
        'orders.shippingCarrier',
        'orders.notes',
        'orders.riskScore',
        'orders.createdAt',
        'orders.updatedAt',
        'users.displayName',
        'users.email'
      ]);

    if (options?.status) {
      query = query.where('orders.status', '=', options.status);
    }

    if (options?.query) {
      const q = `%${options.query}%`;
      query = query.where((eb) => eb.or([
        eb('orders.id', 'like', q),
        eb('orders.userId', 'like', q),
        eb('orders.items', 'like', q),
        eb('users.displayName', 'like', q),
        eb('users.email', 'like', q)
      ]));
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

  async batchUpdateStatus(ids: string[], status: OrderStatus): Promise<void> {
    const now = new Date().toISOString();
    await this.db
      .updateTable('orders')
      .set({
        status,
        updatedAt: now,
      })
      .where('id', 'in', ids)
      .execute();
  }

  async getDashboardStats(): Promise<{
    totalRevenue: number;
    dailyRevenue: number[];
    orderCountsByStatus: Record<OrderStatus, number>;
  }> {
    const counts = await this.db
      .selectFrom('orders')
      .select([
        'status',
        (eb) => eb.fn.count<number>('id').as('count')
      ])
      .groupBy('status')
      .execute();

    const orderCountsByStatus: Record<OrderStatus, number> = {
      pending: 0,
      confirmed: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
    };

    for (const row of counts) {
      const status = row.status as OrderStatus;
      if (orderCountsByStatus[status] !== undefined) {
        orderCountsByStatus[status] = Number(row.count);
      }
    }

    const revenueResult = await this.db
      .selectFrom('orders')
      .select((eb) => eb.fn.sum<number>('total').as('totalRevenue'))
      .where('status', '!=', 'cancelled')
      .executeTakeFirst();

    // Daily revenue for last 7 days
    const dailyRevenue = new Array(7).fill(0);
    const now = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(now.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const dailyResults = await this.db
      .selectFrom('orders')
      .select([
        'createdAt',
        'total'
      ])
      .where('status', '!=', 'cancelled')
      .where('createdAt', '>=', sevenDaysAgo.toISOString())
      .execute();

    for (const row of dailyResults) {
      const orderDate = new Date(row.createdAt);
      const diffDays = Math.floor((now.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays >= 0 && diffDays < 7) {
        dailyRevenue[6 - diffDays] += row.total;
      }
    }

    return {
      totalRevenue: Number(revenueResult?.totalRevenue ?? 0),
      dailyRevenue,
      orderCountsByStatus,
    };
  }

  async getTopProducts(limit: number): Promise<Array<{ id: string; name: string; revenue: number; sales: number }>> {
    // BroccoliQ Level 8: Native SQL JSON Analytics
    const result = await sql<any>`
      SELECT 
        json_extract(item.value, '$.productId') as id,
        json_extract(item.value, '$.name') as name,
        SUM(json_extract(item.value, '$.unitPrice') * json_extract(item.value, '$.quantity')) as revenue,
        SUM(json_extract(item.value, '$.quantity')) as sales
      FROM orders, json_each(orders.items) as item
      WHERE orders.status != 'cancelled'
      GROUP BY id
      ORDER BY revenue DESC
      LIMIT ${limit}
    `.execute(this.db);

    return result.rows.map(row => ({
      id: String(row.id),
      name: String(row.name),
      revenue: Number(row.revenue),
      sales: Number(row.sales)
    }));
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
        notes: JSON.stringify(order.notes),
        riskScore: order.riskScore,
        createdAt: order.createdAt.toISOString(),
        updatedAt: order.updatedAt.toISOString(),
      })
      .execute();
  }
}
