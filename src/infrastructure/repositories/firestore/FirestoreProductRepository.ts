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
import { classifyInventoryHealth, classifyProductSetupStatus } from '@domain/rules';

export class FirestoreProductRepository implements IProductRepository {
  private readonly collectionName = 'products';

  private mapDocToProduct(id: string, data: DocumentData): Product {
    return mapDoc<Product>(id, data);
  }

  async getAll(options: {
    category?: string;
    collection?: string;
    query?: string;
    status?: ProductStatus | 'all';
    inventoryHealth?: 'out_of_stock' | 'low_stock' | 'healthy' | 'all';
    setupStatus?: 'ready' | 'needs_attention' | 'all';
    limit?: number;
    cursor?: string;
  } = {}): Promise<{ products: Product[]; nextCursor?: string }> {
    try {
      let q = query(collection(getUnifiedDb(), this.collectionName), orderBy('createdAt', 'desc'));

      if (options.category) {
        q = query(q, where('category', '==', options.category));
      }

      if (options.query) {
        // Production Hardening: Use the pre-computed search keywords index for server-side search
        const searchStr = options.query.toLowerCase().trim();
        q = query(q, where('searchKeywords', 'array-contains', searchStr));
      }
      
      if (options.status && options.status !== 'all') {
        q = query(q, where('status', '==', options.status));
      }

      if (options.inventoryHealth && options.inventoryHealth !== 'all') {
        q = query(q, where('inventoryHealth', '==', options.inventoryHealth));
      }

      if (options.setupStatus && options.setupStatus !== 'all') {
        q = query(q, where('setupStatus', '==', options.setupStatus));
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
      const results = snapshot.docs.map((d: QueryDocumentSnapshot) => this.mapDocToProduct(d.id, d.data()));
      
      // Note: With searchKeywords, we no longer need the in-memory filtering here
      // which was limited by the fetch limit. The query above handles it server-side.

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

  async getById(id: string, transaction?: any): Promise<Product | null> {
    const docRef = doc(getUnifiedDb(), this.collectionName, id);
    const docSnap = transaction ? await transaction.get(docRef) : await getDoc(docRef);
    if (!docSnap.exists()) return null;
    return this.mapDocToProduct(docSnap.id, docSnap.data());
  }

  async getByHandle(handle: string, transaction?: any): Promise<Product | null> {
    if (transaction) {
      // Note: Firestore transactions do not support queries directly in the client SDK
      // but in admin SDK they do. Our bridge handles this if passed.
      // However, if we can't do it in a transaction, we fallback to a normal get.
      const q = query(collection(getUnifiedDb(), this.collectionName), where('handle', '==', handle), limit(1));
      const snapshot = await getDocs(q);
      if (snapshot.empty) return null;
      return this.mapDocToProduct(snapshot.docs[0].id, snapshot.docs[0].data());
    }
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
        searchKeywords: this.generateSearchKeywords(product.name, handle, product.sku),
        inventoryHealth: classifyInventoryHealth(product.stock),
        setupStatus: classifyProductSetupStatus(product as Product),
      };

      transaction.set(doc(getUnifiedDb(), this.collectionName, id), productData);
      return { ...productData, id, createdAt: new Date(), updatedAt: new Date() } as any as Product;
    });
  }

  async update(id: string, updates: ProductUpdate, transaction?: any): Promise<Product> {
    const docRef = doc(getUnifiedDb(), this.collectionName, id);
    const db = getUnifiedDb();
    const now = serverTimestamp();
    const firestoreUpdates: any = { ...updates, updatedAt: now };

    const operation = async (t: any) => {
      let current: Product | null = null;
      if (updates.name || updates.sku || updates.handle || updates.status || updates.stock !== undefined) {
        const docSnap = await t.get(docRef);
        if (docSnap.exists()) {
          current = this.mapDocToProduct(docSnap.id, docSnap.data());
          const merged = { ...current, ...updates } as Product;
          
          if (updates.name || updates.sku || updates.handle) {
            firestoreUpdates.searchKeywords = this.generateSearchKeywords(
              merged.name,
              merged.handle || '',
              merged.sku
            );
          }
          firestoreUpdates.inventoryHealth = classifyInventoryHealth(merged.stock);
          firestoreUpdates.setupStatus = classifyProductSetupStatus(merged);
        }
      }

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
        firestoreUpdates.variantIds = firestoreUpdates.variants.map((v: any) => v.id);
      }

      t.update(docRef, firestoreUpdates);
    };

    if (transaction) {
      await operation(transaction);
    } else {
      await runTransaction(db, operation);
    }

    return (await this.getById(id))!;
  }

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(getUnifiedDb(), this.collectionName, id));
  }

  async updateStock(id: string, delta: number, transaction?: any): Promise<void> {
    const db = getUnifiedDb();
    const operation = async (t: any) => {
      const docRef = doc(db, this.collectionName, id);
      const docSnap = await t.get(docRef);
      if (!docSnap.exists()) throw new ProductNotFoundError(id);

      const data = docSnap.data() as any;
      const currentStock = data.stock || 0;
      const nextStock = currentStock + delta;

      if (nextStock < 0) throw new InsufficientStockError(id, Math.abs(delta), currentStock);

      t.update(docRef, { stock: nextStock, updatedAt: serverTimestamp() });
    };

    if (transaction) {
      await operation(transaction);
    } else {
      await runTransaction(db, operation);
    }
  }

  async updateVariantStock(variantId: string, delta: number, transaction?: any): Promise<void> {
    const db = getUnifiedDb();
    
    const operation = async (t: any) => {
      // Find the product by variant ID using a query (outside of the transaction write phase if possible, but here we need the ID)
      // Since Firestore transactions don't support queries, we must find the product ID first.
      const q = query(collection(db, this.collectionName), where('variantIds', 'array-contains', variantId), limit(1));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        throw new Error(`Product containing variant ${variantId} not found`);
      }
      const productId = snapshot.docs[0].id;
      const docRef = doc(db, this.collectionName, productId);
      const docSnap = await t.get(docRef);
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

      t.update(docRef, { 
        variants, 
        stock: totalStock,
        updatedAt: serverTimestamp() 
      });
    };

    if (transaction) {
      await operation(transaction);
    } else {
      await runTransaction(db, operation);
    }
  }

  async batchUpdateStock(updates: { id: string; variantId?: string; delta: number }[], transaction?: any): Promise<void> {
    const db = getUnifiedDb();
    const operation = async (t: any) => {
      // 1. Group unique product IDs to load
      const productIds = new Set<string>(updates.map(u => u.id));
      
      // 2. Load all products transactionally
      const docRefs = Array.from(productIds).map(id => doc(db, this.collectionName, id));
      const snapshots = await Promise.all(docRefs.map(ref => t.get(ref)));
      
      const productDataMap = new Map<string, any>();
      snapshots.forEach(snap => {
        if (snap.exists()) productDataMap.set(snap.id, snap.data());
      });

      // 3. Apply updates to the loaded data (locally first)
      const finalUpdates = new Map<string, any>();
      
      for (const update of updates) {
        const data = finalUpdates.get(update.id) || productDataMap.get(update.id);
        if (!data) throw new Error(`Product ${update.id} not found for stock update`);

        // Create a working copy
        const workingData = { ...data };

        if (update.variantId) {
          const variants = [...(workingData.variants || [])];
          const vIdx = variants.findIndex((v: any) => v.id === update.variantId);
          if (vIdx === -1) throw new Error(`Variant ${update.variantId} not found in product ${update.id}`);
          
          const current = variants[vIdx].stock || 0;
          if (current + update.delta < 0) throw new InsufficientStockError(update.id, Math.abs(update.delta), current);
          
          variants[vIdx].stock = current + update.delta;
          variants[vIdx].updatedAt = serverTimestamp();
          
          workingData.variants = variants;
          workingData.stock = variants.reduce((sum: number, v: any) => sum + (v.stock || 0), 0);
        } else {
          const current = workingData.stock || 0;
          if (current + update.delta < 0) throw new InsufficientStockError(update.id, Math.abs(update.delta), current);
          workingData.stock = current + update.delta;
        }
        
        workingData.updatedAt = serverTimestamp();
        finalUpdates.set(update.id, workingData);
      }

      // 4. Commit all updates to the transaction
      for (const [id, data] of finalUpdates.entries()) {
        t.update(doc(db, this.collectionName, id), data);
      }
    };

    if (transaction) {
      await operation(transaction);
    } else {
      await runTransaction(db, operation);
    }
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

  private generateSearchKeywords(name: string, handle: string, sku?: string): string[] {
    const keywords = new Set<string>();
    
    const tokenize = (str: string) => {
      return str.toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .split(/\s+/)
        .filter(t => t.length > 1);
    };

    tokenize(name).forEach(t => keywords.add(t));
    tokenize(handle.replace(/-/g, ' ')).forEach(t => keywords.add(t));
    if (sku) tokenize(sku).forEach(t => keywords.add(t));

    // Add common prefixes for partial matching (Edge N-grams)
    const addPrefixes = (str: string) => {
      const clean = str.toLowerCase().replace(/[^a-z0-9]/g, '');
      for (let i = 2; i <= Math.min(clean.length, 10); i++) {
        keywords.add(clean.substring(0, i));
      }
    };

    tokenize(name).forEach(addPrefixes);
    if (sku) addPrefixes(sku);

    return Array.from(keywords);
  }
}
