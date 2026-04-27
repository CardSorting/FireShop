/**
 * [LAYER: INFRASTRUCTURE]
 * SQLite Implementation of Discount Repository
 */
import { Kysely } from 'kysely';
import { getSQLiteDB } from '../../sqlite/database';
import type { Database } from '../../sqlite/schema';
import type { IDiscountRepository } from '@domain/repositories';
import type { Discount, DiscountDraft, DiscountStatus, DiscountType, DiscountUpdate } from '@domain/models';
import { DomainError } from '@domain/errors';

const DISCOUNT_TYPES = new Set<DiscountType>(['percentage', 'fixed']);
const DISCOUNT_STATUSES = new Set<DiscountStatus>(['active', 'scheduled', 'expired']);

export class SQLiteDiscountRepository implements IDiscountRepository {
  private db: Kysely<Database>;

  constructor() {
    this.db = getSQLiteDB();
  }

  async getAll(): Promise<Discount[]> {
    const rows = await this.db
      .selectFrom('discounts')
      .selectAll()
      .orderBy('createdAt', 'desc')
      .execute();

    return rows.map(this.mapRow);
  }

  async getById(id: string): Promise<Discount | null> {
    const row = await this.db
      .selectFrom('discounts')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();

    return row ? this.mapRow(row) : null;
  }

  async getByCode(code: string): Promise<Discount | null> {
    const row = await this.db
      .selectFrom('discounts')
      .selectAll()
      .where('code', '=', code.toUpperCase())
      .executeTakeFirst();

    return row ? this.mapRow(row) : null;
  }

  async create(discount: DiscountDraft): Promise<Discount> {
    const row = {
      id: crypto.randomUUID(),
      code: discount.code.toUpperCase(),
      type: discount.type,
      value: discount.value,
      status: discount.status,
      startsAt: discount.startsAt.toISOString(),
      endsAt: discount.endsAt?.toISOString() || null,
      usageCount: 0,
      createdAt: new Date().toISOString(),
    };

    await this.db
      .insertInto('discounts')
      .values(row)
      .execute();

    return this.mapRow(row);
  }

  async update(id: string, updates: DiscountUpdate): Promise<Discount> {
    const updatePayload: Partial<Database['discounts']> = {};
    if (updates.status) updatePayload.status = updates.status;
    if (updates.type) updatePayload.type = updates.type;
    if (typeof updates.value === 'number') updatePayload.value = updates.value;
    if (updates.startsAt) updatePayload.startsAt = updates.startsAt.toISOString();
    if (updates.endsAt) updatePayload.endsAt = updates.endsAt.toISOString();
    if (updates.endsAt === null) updatePayload.endsAt = null;

    await this.db
      .updateTable('discounts')
      .set(updatePayload)
      .where('id', '=', id)
      .execute();

    const updated = await this.getById(id);
    if (!updated) throw new DomainError(`Discount '${id}' was not found after update.`);
    return updated;
  }

  async delete(id: string): Promise<void> {
    await this.db
      .deleteFrom('discounts')
      .where('id', '=', id)
      .execute();
  }

  async incrementUsage(id: string): Promise<void> {
    await this.db
      .updateTable('discounts')
      .set((eb) => ({
        usageCount: eb('usageCount', '+', 1)
      }))
      .where('id', '=', id)
      .execute();
  }

  private mapRow(row: Database['discounts']): Discount {
    if (!DISCOUNT_TYPES.has(row.type as DiscountType)) {
      throw new DomainError(`Stored discount type is invalid for discount '${row.id}'.`);
    }
    if (!DISCOUNT_STATUSES.has(row.status as DiscountStatus)) {
      throw new DomainError(`Stored discount status is invalid for discount '${row.id}'.`);
    }

    return {
      ...row,
      type: row.type as DiscountType,
      status: row.status as DiscountStatus,
      startsAt: new Date(row.startsAt),
      endsAt: row.endsAt ? new Date(row.endsAt) : null,
      createdAt: new Date(row.createdAt),
    };
  }
}
