/**
 * [LAYER: INFRASTRUCTURE]
 */
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  limit,
  startAfter,
  runTransaction,
  serverTimestamp,
  orderBy,
  type CollectionReference,
  type DocumentData,
  type Firestore,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import { getDB } from '../FirebaseInitializer';
import { COLLECTIONS } from '@utils/constants';
import type { IProductRepository } from '@domain/repositories';
import type { Product, ProductDraft, ProductUpdate } from '@domain/models';
import { InsufficientStockError, ProductNotFoundError } from '@domain/errors';

function docToProduct(docSnap: QueryDocumentSnapshot<DocumentData>): Product {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    name: data.name,
    description: data.description,
    price: data.price,
    category: data.category,
    stock: data.stock,
    imageUrl: data.imageUrl,
    set: data.set,
    rarity: data.rarity,
    createdAt: data.createdAt?.toDate() ?? new Date(),
    updatedAt: data.updatedAt?.toDate() ?? new Date(),
  };
}

function sanitizeProductUpdate(updates: ProductUpdate): ProductUpdate {
  const sanitized: ProductUpdate = {
    ...(updates.name !== undefined ? { name: updates.name } : {}),
    ...(updates.description !== undefined ? { description: updates.description } : {}),
    ...(updates.price !== undefined ? { price: updates.price } : {}),
    ...(updates.category !== undefined ? { category: updates.category } : {}),
    ...(updates.stock !== undefined ? { stock: updates.stock } : {}),
    ...(updates.imageUrl !== undefined ? { imageUrl: updates.imageUrl } : {}),
    ...('set' in updates ? { set: updates.set } : {}),
    ...('rarity' in updates ? { rarity: updates.rarity } : {}),
  };

  return sanitized;
}

export class FirestoreProductRepository implements IProductRepository {
  private db: Firestore | null = null;
  private coll: CollectionReference<DocumentData> | null = null;

  /**
   * Get or create the Firestore instance
   * This ensures we use the singleton instance, not create our own
   */
  private async getDBInstance() {
    if (!this.db) {
      this.db = await getDB();
    }
    return this.db!;
  }



  async getAll(options?: {
    category?: string;
    limit?: number;
    cursor?: string;
  }): Promise<{ products: Product[]; nextCursor?: string }> {
    const db = await this.getDBInstance();
    const coll = this.coll || collection(db, COLLECTIONS.PRODUCTS);

    const cursorDoc = options?.cursor ? await getDoc(doc(coll, options.cursor)) : null;

    const q = query(
      coll,
      orderBy('createdAt', 'desc'),
      ...(options?.category ? [where('category', '==', options.category)] : []),
      ...(cursorDoc?.exists() ? [startAfter(cursorDoc)] : []),
      limit(options?.limit ?? 20)
    );

    const snapshot = await getDocs(q);
    const products = snapshot.docs.map(docToProduct);
    const nextCursor =
      snapshot.docs.length > 0
        ? snapshot.docs[snapshot.docs.length - 1].id
        : undefined;

    return { products, nextCursor };
  }

  async getById(id: string): Promise<Product | null> {
    const db = await this.getDBInstance();
    const coll = this.coll || collection(db, COLLECTIONS.PRODUCTS);
    
    const docSnap = await getDoc(doc(coll, id));
    if (!docSnap.exists()) return null;
    return docToProduct(docSnap);
  }

  async create(
    product: ProductDraft
  ): Promise<Product> {
    const db = await this.getDBInstance();
    const coll = this.coll || collection(db, COLLECTIONS.PRODUCTS);
    
    const ref = await addDoc(coll, {
      ...product,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return this.getById(ref.id) as Promise<Product>;
  }

  async update(id: string, updates: ProductUpdate): Promise<Product> {
    const db = await this.getDBInstance();
    const coll = this.coll || collection(db, COLLECTIONS.PRODUCTS);
    const ref = doc(coll, id);
    const sanitized = sanitizeProductUpdate(updates);
    
    await updateDoc(ref, {
      ...sanitized,
      updatedAt: serverTimestamp(),
    });
    const updated = await this.getById(id);
    if (!updated) throw new ProductNotFoundError(id);
    return updated;
  }

  async delete(id: string): Promise<void> {
    const db = await this.getDBInstance();
    const coll = this.coll || collection(db, COLLECTIONS.PRODUCTS);
    await deleteDoc(doc(coll, id));
  }

  async updateStock(id: string, delta: number): Promise<void> {
    const db = await this.getDBInstance();
    const coll = this.coll || collection(db, COLLECTIONS.PRODUCTS);
    const ref = doc(coll, id);
    
    await runTransaction(db, async (transaction) => {
      const docSnap = await transaction.get(ref);
      if (!docSnap.exists()) throw new ProductNotFoundError(id);
      const currentStock = docSnap.data().stock as number;
      const nextStock = currentStock + delta;
      if (nextStock < 0) throw new InsufficientStockError(id, Math.abs(delta), currentStock);
      transaction.update(ref, { stock: nextStock, updatedAt: serverTimestamp() });
    });
  }

  async batchUpdateStock(updates: { id: string; delta: number }[]): Promise<void> {
    if (updates.length === 0) return;

    const db = await this.getDBInstance();
    const coll = this.coll || collection(db, COLLECTIONS.PRODUCTS);
    
    await runTransaction(db, async (transaction) => {
      // Step 1: Read all documents
      const docs = await Promise.all(
        updates.map(update => transaction.get(doc(coll, update.id)))
      );

      // Step 2: Write all updates
      updates.forEach((update, index) => {
        const docSnap = docs[index];
        if (!docSnap.exists()) throw new ProductNotFoundError(update.id);
        const currentStock = docSnap.data().stock as number;
        const nextStock = currentStock + update.delta;
        if (nextStock < 0) throw new InsufficientStockError(update.id, Math.abs(update.delta), currentStock);
        transaction.update(doc(coll, update.id), { stock: nextStock, updatedAt: serverTimestamp() });
      });
    });
  }
}