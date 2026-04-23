/**
 * [LAYER: INFRASTRUCTURE]
 * Migration Service: Syncs SQLite data to Firebase
 */
import { Kysely } from 'kysely';
import { getSQLiteDB } from '../sqlite/database';
import type { Database } from '../sqlite/schema';
import { 
  doc, 
  writeBatch, 
  serverTimestamp 
} from 'firebase/firestore';
import { db as firestore } from '../firebaseConfig';
import { COLLECTIONS } from '@utils/constants';

export class MigrationService {
  private sqlite: Kysely<Database>;

  constructor() {
    this.sqlite = getSQLiteDB();
  }

  async migrateToFirebase(onProgress: (progress: string) => void): Promise<void> {
    onProgress('Starting migration...');

    // 1. Migrate Products
    onProgress('Migrating products...');
    const products = await this.sqlite.selectFrom('products').selectAll().execute();
    if (products.length > 0) {
      const batch = writeBatch(firestore);
      for (const p of products) {
        const ref = doc(firestore, COLLECTIONS.PRODUCTS, p.id);
        batch.set(ref, {
          name: p.name,
          description: p.description,
          price: p.price,
          category: p.category,
          stock: p.stock,
          imageUrl: p.imageUrl,
          set: p.set,
          rarity: p.rarity,
          createdAt: serverTimestamp(), // Best practice to reset or parse from p.createdAt
          updatedAt: serverTimestamp(),
        });
      }
      await batch.commit();
      onProgress(`Migrated ${products.length} products.`);
    }

    // 2. Migrate Orders
    onProgress('Migrating orders...');
    const orders = await this.sqlite.selectFrom('orders').selectAll().execute();
    if (orders.length > 0) {
      const batch = writeBatch(firestore);
      for (const o of orders) {
        const ref = doc(firestore, COLLECTIONS.ORDERS, o.id);
        batch.set(ref, {
          userId: o.userId,
          items: JSON.parse(o.items),
          total: o.total,
          status: o.status,
          shippingAddress: JSON.parse(o.shippingAddress),
          paymentTransactionId: o.paymentTransactionId,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      await batch.commit();
      onProgress(`Migrated ${orders.length} orders.`);
    }

    // 3. Migrate Users
    onProgress('Migrating users...');
    const users = await this.sqlite.selectFrom('users').selectAll().execute();
    if (users.length > 0) {
      const batch = writeBatch(firestore);
      for (const u of users) {
        const ref = doc(firestore, COLLECTIONS.USERS, u.id);
        batch.set(ref, {
          email: u.email,
          displayName: u.displayName,
          role: u.role,
          createdAt: serverTimestamp(),
        });
      }
      await batch.commit();
      onProgress(`Migrated ${users.length} users.`);
    }

    onProgress('Migration complete! Please update your .env to use Firebase.');
  }
}
