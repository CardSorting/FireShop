/**
 * [LAYER: INFRASTRUCTURE]
 * Firestore Implementation of Product Repository
 */
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  limit,
  runTransaction,
  Timestamp,
  writeBatch,
  getUnifiedDb,
  startAfter,
  serverTimestamp,
  type DocumentData,
  type QueryDocumentSnapshot,
  type Transaction
} from '../../firebase/bridge';
import { logger } from '@utils/logger';
import type { IProductRepository } from '@domain/repositories';
import type { 
  Product, 
  ProductDraft, 
  ProductUpdate, 
  ProductVariant, 
  ProductOption, 
  ProductMedia, 
  ProductStatus 
} from '@domain/models';
import { ProductNotFoundError, InsufficientStockError } from '@domain/errors';

import { mapDoc } from './utils';

export class FirestoreProductRepository implements IProductRepository {
  private readonly collectionName = 'products';

  private mapDocToProduct(id: string, data: DocumentData): Product {
    return mapDoc<Product>(id, data);
  }

  async getAll(options: {
    category?: string;
    collection?: string;
    query?: string;
    limit?: number;
    cursor?: string;
  }): Promise<{ products: Product[]; nextCursor?: string }> {
    try {
      let q = query(collection(getUnifiedDb(), this.collectionName), orderBy('createdAt', 'desc'));

      if (options.category) {
        q = query(q, where('category', '==', options.category));
      }
      
      if (options.collection) {
        q = query(q, where('collections', 'array-contains', options.collection));
      }

      if (options.limit) {
        q = query(q, limit(options.limit + 1));
      } else {
        q = query(q, limit(21));
      }

      if (options.cursor) {
        const cursorDoc = await getDoc(doc(getUnifiedDb(), this.collectionName, options.cursor));
        if (cursorDoc.exists()) {
          q = query(q, startAfter(cursorDoc));
        }
      }

      const snapshot = await getDocs(q);
      let results = snapshot.docs.map((d: QueryDocumentSnapshot) => this.mapDocToProduct(d.id, d.data()));
      
      // Production Hardening: Simple in-memory search for small/medium datasets
      if (options.query) {
        const searchStr = options.query.toLowerCase();
        results = results.filter((p: Product) => 
          p.name.toLowerCase().includes(searchStr) || 
          p.sku?.toLowerCase().includes(searchStr) ||
          p.handle?.toLowerCase().includes(searchStr)
        );
      }

      const limitVal = options.limit ?? 20;
      const hasNextPage = results.length > limitVal;
      const products = results.slice(0, limitVal);
      const nextCursor = hasNextPage ? products[products.length - 1].id : undefined;

      return { products, nextCursor };
    } catch (err) {
      logger.error('Product fetch failed', { options, err });
      return { products: [], nextCursor: undefined };
    }
  }

  async getById(id: string): Promise<Product | null> {
    const docRef = doc(getUnifiedDb(), this.collectionName, id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    return this.mapDocToProduct(docSnap.id, docSnap.data());
  }

  async getByHandle(handle: string): Promise<Product | null> {
    const q = query(collection(getUnifiedDb(), this.collectionName), where('handle', '==', handle), limit(1));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    const d = snapshot.docs[0];
    return this.mapDocToProduct(d.id, d.data());
  }

  async create(product: ProductDraft): Promise<Product> {
    const id = crypto.randomUUID();
    
    return await runTransaction(getUnifiedDb(), async (transaction: Transaction) => {
      const baseHandle = product.handle || product.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const handle = await this.ensureUniqueHandle(baseHandle, undefined);
      
      const now = serverTimestamp();
      const variants = product.variants?.map(v => ({ 
        ...v, 
        id: v.id || crypto.randomUUID(), 
        createdAt: now, 
        updatedAt: now 
      })) || [];

      const productData = {
        ...product,
        createdAt: now,
        updatedAt: now,
        variants,
        variantIds: variants.map(v => v.id),
        options: product.options?.map(o => ({ ...o, id: o.id || crypto.randomUUID() })) || [],
        media: product.media?.map(m => ({ ...m, id: m.id || crypto.randomUUID(), createdAt: now })) || [],
        handle,
      };

      transaction.set(doc(getUnifiedDb(), this.collectionName, id), productData);
      return { ...productData, id, createdAt: new Date(), updatedAt: new Date() } as any as Product;
    });
  }

  async update(id: string, updates: ProductUpdate): Promise<Product> {
    const docRef = doc(getUnifiedDb(), this.collectionName, id);
    const now = serverTimestamp();
    
    const firestoreUpdates: any = { ...updates, updatedAt: now };

    if (updates.handle) {
      firestoreUpdates.handle = await this.ensureUniqueHandle(updates.handle, id);
    }
    
    if (updates.media) {
      firestoreUpdates.media = updates.media.map(m => ({
        ...m,
        id: m.id || crypto.randomUUID(),
        createdAt: m.createdAt ? Timestamp.fromDate(new Date(m.createdAt)) : now
      }));
    }

    if (updates.variants) {
      firestoreUpdates.variants = updates.variants.map(v => ({
        ...v,
        id: v.id || crypto.randomUUID(),
        createdAt: v.createdAt ? Timestamp.fromDate(new Date(v.createdAt)) : now,
        updatedAt: now
      }));
      // Sync variant index
      firestoreUpdates.variantIds = firestoreUpdates.variants.map((v: any) => v.id);
    }

    await updateDoc(docRef, firestoreUpdates);
    return (await this.getById(id))!;
  }

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(getUnifiedDb(), this.collectionName, id));
  }

  async updateStock(id: string, delta: number): Promise<void> {
    await runTransaction(getUnifiedDb(), async (transaction: any) => {
      const docRef = doc(getUnifiedDb(), this.collectionName, id);
      const docSnap = await transaction.get(docRef);
      if (!docSnap.exists()) throw new ProductNotFoundError(id);

      const data = docSnap.data() as any;
      const currentStock = data.stock || 0;
      const nextStock = currentStock + delta;

      if (nextStock < 0) throw new InsufficientStockError(id, Math.abs(delta), currentStock);

      transaction.update(docRef, { stock: nextStock, updatedAt: serverTimestamp() });
    });
  }

  async updateVariantStock(variantId: string, delta: number): Promise<void> {
    // Production Hardening: Optimized lookup using variantIds array index
    const q = query(collection(getUnifiedDb(), this.collectionName), where('variantIds', 'array-contains', variantId), limit(1));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      // Fallback: This might be an old product without the index, or the variant doesn't exist
      throw new Error(`Product containing variant ${variantId} not found`);
    }

    const productDoc = snapshot.docs[0];
    const productId = productDoc.id;

    await runTransaction(getUnifiedDb(), async (transaction: any) => {
      const docRef = doc(getUnifiedDb(), this.collectionName, productId);
      const docSnap = await transaction.get(docRef);
      const data = docSnap.data()!;
      const variants = [...(data.variants || [])];
      const variantIndex = variants.findIndex((v: any) => v.id === variantId);
      
      if (variantIndex === -1) throw new Error(`Variant ${variantId} not found in product ${productId}`);
      
      const currentStock = variants[variantIndex].stock || 0;
      const nextStock = currentStock + delta;
      if (nextStock < 0) throw new InsufficientStockError(productId, Math.abs(delta), currentStock);

      variants[variantIndex].stock = nextStock;
      variants[variantIndex].updatedAt = serverTimestamp();

      const totalStock = variants.reduce((sum, v) => sum + (v.stock || 0), 0);

      transaction.update(docRef, { 
        variants, 
        stock: totalStock,
        updatedAt: serverTimestamp() 
      });
    });
  }

  async batchUpdateStock(updates: { id: string; variantId?: string; delta: number }[]): Promise<void> {
    await runTransaction(getUnifiedDb(), async (transaction: Transaction) => {
      // Collect all unique product IDs we need to load
      const productIds = new Set<string>();
      const variantToProductMap = new Map<string, string>();

      for (const update of updates) {
        if (update.variantId) {
          // We need the productId for the variant. For hardening, we'll fetch it first if not known
          // but inside a transaction we should ideally have them.
          // Strategy: Batch fetch all docs containing these variantIds first
          const q = query(collection(getUnifiedDb(), this.collectionName), where('variantIds', 'array-contains', update.variantId));
          const snap = await getDocs(q);
          if (!snap.empty) {
            const pId = snap.docs[0].id;
            productIds.add(pId);
            variantToProductMap.set(update.variantId, pId);
          }
        } else {
          productIds.add(update.id);
        }
      }

      // Load all relevant product documents
      const docs = await Promise.all(Array.from(productIds).map(id => transaction.get(doc(getUnifiedDb(), this.collectionName, id))));
      const docMap = new Map<string, any>();
      docs.forEach(d => { if (d.exists()) docMap.set(d.id, d.data()); });

      // Apply updates
      for (const update of updates) {
        const pId = update.variantId ? variantToProductMap.get(update.variantId) : update.id;
        if (!pId) continue;

        const data = docMap.get(pId);
        if (!data) continue;

        if (update.variantId) {
          const variants = [...(data.variants || [])];
          const vIdx = variants.findIndex((v: any) => v.id === update.variantId);
          if (vIdx !== -1) {
            const current = variants[vIdx].stock || 0;
            if (current + update.delta < 0) throw new InsufficientStockError(pId, Math.abs(update.delta), current);
            variants[vIdx].stock = current + update.delta;
            variants[vIdx].updatedAt = serverTimestamp();
            data.variants = variants;
            data.stock = variants.reduce((sum: number, v: any) => sum + (v.stock || 0), 0);
          }
        } else {
          const current = data.stock || 0;
          if (current + update.delta < 0) throw new InsufficientStockError(pId, Math.abs(update.delta), current);
          data.stock = current + update.delta;
        }
        data.updatedAt = serverTimestamp();
      }

      // Commit all changes
      for (const [id, data] of docMap.entries()) {
        transaction.update(doc(getUnifiedDb(), this.collectionName, id), data);
      }
    });
  }

  async batchUpdate(updates: { id: string; updates: ProductUpdate }[]): Promise<Product[]> {
    const batch = writeBatch(getUnifiedDb());
    const now = serverTimestamp();
    
    for (const update of updates) {
      const docRef = doc(getUnifiedDb(), this.collectionName, update.id);
      batch.update(docRef, { ...update.updates, updatedAt: now });
    }
    
    await batch.commit();
    return Promise.all(updates.map(u => this.getById(u.id))).then(results => results.filter(Boolean) as Product[]);
  }

  async batchSetInventory(updates: { id: string; variantId?: string; stock: number }[]): Promise<void> {
    await runTransaction(getUnifiedDb(), async (transaction: any) => {
      for (const update of updates) {
        const docRef = doc(getUnifiedDb(), this.collectionName, update.id);
        const docSnap = await transaction.get(docRef);
        if (!docSnap.exists()) continue;
        
        if (update.variantId) {
          const data = docSnap.data() as any;
          const variants = [...(data.variants || [])];
          const vIdx = variants.findIndex((v: any) => v.id === update.variantId);
          if (vIdx !== -1) {
            variants[vIdx].stock = update.stock;
            variants[vIdx].updatedAt = serverTimestamp();
            const total = variants.reduce((sum, v) => sum + (v.stock || 0), 0);
            transaction.update(docRef, { variants, stock: total, updatedAt: serverTimestamp() });
          }
        } else {
          transaction.update(docRef, { stock: update.stock, updatedAt: serverTimestamp() });
        }
      }
    });
  }

  async getStats(): Promise<{
    totalProducts: number;
    totalUnits: number;
    inventoryValue: number;
    healthCounts: {
      out_of_stock: number;
      low_stock: number;
      healthy: number;
    };
  }> {
    const snapshot = await getDocs(collection(getUnifiedDb(), this.collectionName));
    const stats = {
      totalProducts: 0,
      totalUnits: 0,
      inventoryValue: 0,
      healthCounts: {
        out_of_stock: 0,
        low_stock: 0,
        healthy: 0,
      }
    };

    snapshot.forEach((d: any) => {
      const data = d.data();
      stats.totalProducts++;
      const stock = data.stock || 0;
      stats.totalUnits += stock;
      stats.inventoryValue += stock * (data.price || 0);

      if (stock <= 0) stats.healthCounts.out_of_stock++;
      else if (stock < 10) stats.healthCounts.low_stock++;
      else stats.healthCounts.healthy++;
    });

    return stats;
  }

  async getLowStockProducts(limitVal: number): Promise<Product[]> {
    const q = query(
      collection(getUnifiedDb(), this.collectionName), 
      where('status', '==', 'active'),
      where('stock', '<', 10),
      orderBy('stock', 'asc'),
      limit(limitVal)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d: QueryDocumentSnapshot) => this.mapDocToProduct(d.id, d.data()));
  }

  /**
   * Internal helper to ensure a handle is unique in the 'products' collection.
   * If a collision is found, appends a numeric suffix (e.g., '-1', '-2').
   */
  private async ensureUniqueHandle(handle: string, excludeId?: string): Promise<string> {
    let currentHandle = handle;
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      const q = query(
        collection(getUnifiedDb(), this.collectionName), 
        where('handle', '==', currentHandle), 
        limit(1)
      );
      const snapshot = await getDocs(q);

      if (snapshot.empty) return currentHandle;
      
      // If the only product with this handle is the one we are updating, it's fine
      if (excludeId && snapshot.docs[0].id === excludeId) return currentHandle;

      attempts++;
      currentHandle = `${handle}-${attempts}`;
    }

    // If we still have a collision after 10 attempts, append a random string for ultimate safety
    return `${handle}-${crypto.randomUUID().slice(0, 4)}`;
  }
}
