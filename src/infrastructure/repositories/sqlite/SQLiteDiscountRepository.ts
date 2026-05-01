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

const DISCOUNT_TYPES = new Set<DiscountType>(['percentage', 'fixed', 'free_shipping']);
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
    const metadata = {
      selectionType: discount.selectionType,
      selectedProductIds: discount.selectedProductIds,
      selectedCollectionIds: discount.selectedCollectionIds,
      minimumRequirementType: discount.minimumRequirementType,
      minimumAmount: discount.minimumAmount,
      minimumQuantity: discount.minimumQuantity,
      eligibilityType: discount.eligibilityType,
      eligibleCustomerIds: discount.eligibleCustomerIds,
      eligibleCustomerSegments: discount.eligibleCustomerSegments,
      usageLimit: discount.usageLimit,
      oncePerCustomer: discount.oncePerCustomer,
      combinesWith: discount.combinesWith,
    };

    const row = {
      id: crypto.randomUUID(),
      code: discount.code.toUpperCase(),
      type: discount.type,
      value: discount.value,
      status: discount.status,
      isAutomatic: discount.isAutomatic ? 1 : 0,
      metadata: JSON.stringify(metadata),
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
    const existing = await this.getById(id);
    if (!existing) throw new DomainError(`Discount '${id}' not found.`);

    const metadata = {
      selectionType: updates.selectionType ?? existing.selectionType,
      selectedProductIds: updates.selectedProductIds ?? existing.selectedProductIds,
      selectedCollectionIds: updates.selectedCollectionIds ?? existing.selectedCollectionIds,
      minimumRequirementType: updates.minimumRequirementType ?? existing.minimumRequirementType,
      minimumAmount: updates.minimumAmount ?? existing.minimumAmount,
      minimumQuantity: updates.minimumQuantity ?? existing.minimumQuantity,
      eligibilityType: updates.eligibilityType ?? existing.eligibilityType,
      eligibleCustomerIds: updates.eligibleCustomerIds ?? existing.eligibleCustomerIds,
      eligibleCustomerSegments: updates.eligibleCustomerSegments ?? existing.eligibleCustomerSegments,
      usageLimit: updates.usageLimit ?? existing.usageLimit,
      oncePerCustomer: updates.oncePerCustomer ?? existing.oncePerCustomer,
      combinesWith: updates.combinesWith ?? existing.combinesWith,
    };

    const updatePayload: any = {};
    if (updates.status) updatePayload.status = updates.status;
    if (updates.type) updatePayload.type = updates.type;
    if (typeof updates.value === 'number') updatePayload.value = updates.value;
    if (updates.startsAt) updatePayload.startsAt = updates.startsAt.toISOString();
    if (updates.endsAt !== undefined) updatePayload.endsAt = updates.endsAt?.toISOString() || null;
    if (updates.isAutomatic !== undefined) updatePayload.isAutomatic = updates.isAutomatic ? 1 : 0;
    updatePayload.metadata = JSON.stringify(metadata);

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

  private mapRow(row: any): Discount {
    const metadata = row.metadata ? JSON.parse(row.metadata) : {};
    
    return {
      id: row.id,
      code: row.code,
      type: row.type as DiscountType,
      value: row.value,
      status: row.status as DiscountStatus,
      isAutomatic: row.isAutomatic === 1,
      selectionType: metadata.selectionType || 'all_products',
      selectedProductIds: metadata.selectedProductIds || [],
      selectedCollectionIds: metadata.selectedCollectionIds || [],
      minimumRequirementType: metadata.minimumRequirementType || 'none',
      minimumAmount: metadata.minimumAmount || null,
      minimumQuantity: metadata.minimumQuantity || null,
      eligibilityType: metadata.eligibilityType || 'everyone',
      eligibleCustomerIds: metadata.eligibleCustomerIds || [],
      eligibleCustomerSegments: metadata.eligibleCustomerSegments || [],
      usageLimit: metadata.usageLimit || null,
      oncePerCustomer: !!metadata.oncePerCustomer,
      usageCount: row.usageCount,
      combinesWith: metadata.combinesWith || {
        orderDiscounts: false,
        productDiscounts: false,
        shippingDiscounts: false,
      },
      startsAt: new Date(row.startsAt),
      endsAt: row.endsAt ? new Date(row.endsAt) : null,
      createdAt: new Date(row.createdAt),
    };
  }
}
