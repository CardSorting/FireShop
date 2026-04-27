/**
 * [LAYER: INFRASTRUCTURE]
 * SQLite Implementation of Transfer Repository
 */
import { Kysely } from 'kysely';
import { getSQLiteDB } from '../../sqlite/database';
import type { Database } from '../../sqlite/schema';
import type { ITransferRepository } from '@domain/repositories';
import type { Transfer } from '@domain/models';

export class SQLiteTransferRepository implements ITransferRepository {
  private db: Kysely<Database>;

  constructor() {
    this.db = getSQLiteDB();
  }

  async getAll(): Promise<Transfer[]> {
    const rows = await this.db
      .selectFrom('transfers')
      .selectAll()
      .orderBy('createdAt', 'desc')
      .execute();

    return rows.map(this.mapRow);
  }

  async create(transfer: Transfer): Promise<void> {
    await this.db
      .insertInto('transfers')
      .values({
        id: transfer.id,
        source: transfer.source,
        status: transfer.status,
        items: JSON.stringify(transfer.items),
        itemsCount: transfer.itemsCount,
        receivedCount: transfer.receivedCount,
        expectedAt: transfer.expectedAt.toISOString(),
        createdAt: transfer.createdAt.toISOString(),
      })
      .execute();
  }

  async update(id: string, updates: Partial<Transfer>): Promise<void> {
    const updatePayload: any = { ...updates };
    if (updates.items) updatePayload.items = JSON.stringify(updates.items);
    if (updates.expectedAt) updatePayload.expectedAt = updates.expectedAt.toISOString();
    if (updates.createdAt) updatePayload.createdAt = updates.createdAt.toISOString();

    await this.db
      .updateTable('transfers')
      .set(updatePayload)
      .where('id', '=', id)
      .execute();
  }

  private mapRow(row: any): Transfer {
    return {
      ...row,
      items: JSON.parse(row.items || '[]'),
      expectedAt: new Date(row.expectedAt),
      createdAt: new Date(row.createdAt),
    } as Transfer;
  }

}
