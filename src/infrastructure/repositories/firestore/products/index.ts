/**
 * [LAYER: INFRASTRUCTURE]
 * Firestore Implementation of Product Repository
 * 
 * Industrialized for high-concurrency, transactional integrity, and query resilience.
 * Broken down into modular directory structure for enhanced maintainability.
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
  getUnifiedDb,
  startAfter,
  serverTimestamp,
  type DocumentData,
  type QueryDocumentSnapshot,
  type Transaction
} from '../../../firebase/bridge';
import { logger } from '@utils/logger';
import type { IProductRepository } from '@domain/repositories';
import type { 
  Product,
  ProductDraft,
  ProductUpdate, 
  ProductStatus,
  ProductStats
} from '@domain/models';

import { ProductNotFoundError, InsufficientStockError } from '@domain/errors';
import { 
  mapDocToProduct, 
  applyDerivedFields, 
  generateSearchKeywords 
} from './ProductMapper';
import { 
  getProductStatsDeltas, 
  applyStatsDeltas, 
  initializeProductStats,
  STATS_DOC_PATH
} from './ProductStatsHelper';

export class FirestoreProductRepository implements IProductRepository {
  private readonly collectionName = 'products';

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
      const db = getUnifiedDb();
      const baseColl = collection(db, this.collectionName);
      const constraints: any[] = [];

      if (options.category) constraints.push(where('category', '==', options.category));
      if (options.query) {
        const searchStr = options.query.toLowerCase().trim();
        constraints.push(where('searchKeywords', 'array-contains', searchStr));
      }
      if (options.status && options.status !== 'all') constraints.push(where('status', '==', options.status));
      if (options.inventoryHealth && options.inventoryHealth !== 'all') constraints.push(where('inventoryHealth', '==', options.inventoryHealth));
      if (options.setupStatus && options.setupStatus !== 'all') constraints.push(where('setupStatus', '==', options.setupStatus));
      if (options.collection) constraints.push(where('collections', 'array-contains', options.collection));

      const shouldOrder = options.limit !== 1;
      const queryWithOrder = shouldOrder 
        ? query(baseColl, ...constraints, orderBy('createdAt', 'desc'))
        : query(baseColl, ...constraints);
      
      let snapshot;
      try {
        snapshot = await this.executePaginatedQuery(queryWithOrder, options);
      } catch (err: any) {
        if (err?.code === 400 || err?.status === 400 || String(err).includes('index')) {
          logger.warn('Product query failed (missing index), falling back to in-memory sort', { options });
          const unorderedQuery = query(baseColl, ...constraints);
          snapshot = await this.executePaginatedQuery(unorderedQuery, options, true);
        } else {
          throw err;
        }
      }

      const results = snapshot.docs.map((d: QueryDocumentSnapshot) => mapDocToProduct(d.id, d.data()));
      const limitVal = options.limit ?? 20;
      const hasNextPage = results.length > limitVal;
      const products = results.slice(0, limitVal);
      const nextCursor = hasNextPage ? products[products.length - 1].id : undefined;

      return { products, nextCursor };
    } catch (err) {
      logger.error('Product fetch failed permanently', { options, err });
      return { products: [], nextCursor: undefined };
    }
  }

  private async executePaginatedQuery(q: any, options: any, isFallback = false) {
    let finalQuery = q;
    const limitVal = options.limit ?? 20;
    finalQuery = query(finalQuery, limit(limitVal + 1));

    if (options.cursor && !isFallback) {
      const cursorDoc = await getDoc(doc(getUnifiedDb(), this.collectionName, options.cursor));
      if (cursorDoc.exists()) {
        finalQuery = query(finalQuery, startAfter(cursorDoc));
      }
    }
    return await getDocs(finalQuery);
  }

  async getById(id: string, transaction?: any): Promise<Product | null> {
    const docRef = doc(getUnifiedDb(), this.collectionName, id);
    const docSnap = transaction ? await transaction.get(docRef) : await getDoc(docRef);
    if (!docSnap.exists()) return null;
    return mapDocToProduct(docSnap.id, docSnap.data() as DocumentData);
  }

  async getByHandle(handle: string, transaction?: any): Promise<Product | null> {
    const q = query(collection(getUnifiedDb(), this.collectionName), where('handle', '==', handle), limit(1));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    const d = snapshot.docs[0];
    return mapDocToProduct(d.id, d.data() as DocumentData);
  }

  async create(product: ProductDraft): Promise<Product> {
    return await runTransaction(getUnifiedDb(), async (transaction: Transaction) => {
      const id = crypto.randomUUID();
      const baseHandle = product.handle || product.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const handle = await this.ensureUniqueHandle(baseHandle, undefined);
      
      const now = serverTimestamp();
      const variants = product.variants?.map(v => ({ 
        ...v, 
        id: v.id || crypto.randomUUID(), 
        createdAt: now, 
        updatedAt: now 
      })) || [];

      const productData = applyDerivedFields({
        ...product,
        id,
        createdAt: now,
        updatedAt: now,
        variants,
        variantIds: variants.map(v => v.id),
        options: product.options?.map(o => ({ ...o, id: o.id || crypto.randomUUID() })) || [],
        media: product.media?.map(m => ({ ...m, id: m.id || crypto.randomUUID(), createdAt: now })) || [],
        handle,
        searchKeywords: generateSearchKeywords(product.name, handle, product.sku),
      });

      const productRef = doc(getUnifiedDb(), this.collectionName, id);
      transaction.set(productRef, productData);
      
      const createdProduct = mapDocToProduct(id, productData);
      const deltas = getProductStatsDeltas(null, createdProduct);
      applyStatsDeltas(transaction, deltas);
      
      return createdProduct;
    });
  }

  async batchCreate(products: ProductDraft[]): Promise<Product[]> {
    const db = getUnifiedDb();
    return await runTransaction(db, async (transaction: Transaction) => {
      const results: Product[] = [];
      const now = serverTimestamp();
      const accumulatedDeltas: Record<string, number> = {};

      for (const draft of products) {
        const id = crypto.randomUUID();
        const baseHandle = draft.handle || draft.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const handle = await this.ensureUniqueHandle(baseHandle, undefined);
        
        const variants = draft.variants?.map(v => ({ 
          ...v, 
          id: v.id || crypto.randomUUID(), 
          createdAt: now, 
          updatedAt: now 
        })) || [];

        const productData = applyDerivedFields({
          ...draft,
          id,
          createdAt: now,
          updatedAt: now,
          variants,
          variantIds: variants.map(v => v.id),
          options: draft.options?.map(o => ({ ...o, id: o.id || crypto.randomUUID() })) || [],
          media: draft.media?.map(m => ({ ...m, id: m.id || crypto.randomUUID(), createdAt: now })) || [],
          handle,
          searchKeywords: generateSearchKeywords(draft.name, handle, draft.sku),
        });

        const productRef = doc(db, this.collectionName, id);
        transaction.set(productRef, productData);
        
        const createdProduct = mapDocToProduct(id, productData);
        const deltas = getProductStatsDeltas(null, createdProduct);
        Object.entries(deltas).forEach(([path, delta]) => {
          accumulatedDeltas[path] = (accumulatedDeltas[path] || 0) + delta;
        });
        results.push(createdProduct);
      }
      applyStatsDeltas(transaction, accumulatedDeltas);
      return results;
    });
  }

  async update(id: string, updates: ProductUpdate, transaction?: any): Promise<Product> {
    const db = getUnifiedDb();
    const operation = async (t: Transaction) => {
      const docRef = doc(db, this.collectionName, id);
      const docSnap = await t.get(docRef);
      if (!docSnap.exists()) throw new ProductNotFoundError(id);
      
      const currentData = docSnap.data();
      const currentProduct = mapDocToProduct(id, currentData as DocumentData);
      
      const now = serverTimestamp();
      let firestoreUpdates: any = { ...updates, updatedAt: now };

      // Handle variant stock update signal
      const variantUpdate = (updates as any)._variantStockUpdate;
      if (variantUpdate) {
        const variants = [...((currentData as any)?.variants || [])];
        const vIdx = variants.findIndex((v: any) => v.id === variantUpdate.variantId);
        if (vIdx !== -1) {
          variants[vIdx].stock = variantUpdate.stock;
          variants[vIdx].updatedAt = now;
          firestoreUpdates.variants = variants;
          firestoreUpdates.stock = variants.reduce((sum: number, v: any) => sum + (v.stock || 0), 0);
        }
        delete firestoreUpdates._variantStockUpdate;
      }

      if (updates.name || updates.sku || updates.handle) {
        const mergedName = updates.name || currentProduct.name;
        const mergedHandle = updates.handle || currentProduct.handle;
        const mergedSku = updates.sku || currentProduct.sku;
        firestoreUpdates.searchKeywords = generateSearchKeywords(mergedName, mergedHandle || '', mergedSku);
      }

      if (updates.handle) {
        firestoreUpdates.handle = await this.ensureUniqueHandle(updates.handle, id);
      }

      const mergedData = { ...(currentData as any), ...(firestoreUpdates as any), id };
      const enriched = applyDerivedFields(mergedData);
      
      t.update(docRef, enriched);
      
      const updatedProduct = mapDocToProduct(id, enriched);
      const deltas = getProductStatsDeltas(currentProduct, updatedProduct);
      applyStatsDeltas(t, deltas);
      
      return updatedProduct;
    };

    if (transaction) return await operation(transaction);
    return await runTransaction(db, operation);
  }

  async delete(id: string): Promise<void> {
    const db = getUnifiedDb();
    await runTransaction(db, async (t) => {
      const docRef = doc(db, this.collectionName, id);
      const snap = await t.get(docRef);
      if (snap.exists()) {
        const product = mapDocToProduct(id, snap.data() as DocumentData);
        t.delete(docRef);
        applyStatsDeltas(t, getProductStatsDeltas(product, null));
      }
    });
  }

  async updateStock(id: string, delta: number, transaction?: any): Promise<void> {
    const db = getUnifiedDb();
    const operation = async (t: Transaction) => {
      const docRef = doc(db, this.collectionName, id);
      const docSnap = await t.get(docRef);
      if (!docSnap.exists()) throw new ProductNotFoundError(id);

      const data = docSnap.data() as any;
      const currentStock = data.stock || 0;
      const nextStock = currentStock + delta;
      if (nextStock < 0) throw new InsufficientStockError(id, Math.abs(delta), currentStock);

      const oldProduct = mapDocToProduct(id, data);
      const updatedData = applyDerivedFields({ ...(data as any), id, stock: nextStock, updatedAt: serverTimestamp() });
      t.update(docRef, updatedData);
      
      const newProduct = mapDocToProduct(id, updatedData);
      applyStatsDeltas(t, getProductStatsDeltas(oldProduct, newProduct));
    };

    if (transaction) await operation(transaction);
    else await runTransaction(db, operation);
  }

  async updateVariantStock(variantId: string, delta: number, transaction?: any): Promise<void> {
    const db = getUnifiedDb();
    const operation = async (t: Transaction) => {
      const q = query(collection(db, this.collectionName), where('variantIds', 'array-contains', variantId), limit(1));
      const snapshot = await getDocs(q);
      if (snapshot.empty) throw new Error(`Product containing variant ${variantId} not found`);
      
      const productId = snapshot.docs[0].id;
      const docRef = doc(db, this.collectionName, productId);
      const docSnap = await t.get(docRef);
      const data = docSnap.data() as any;
      const variants = [...(data.variants || [])];
      const vIdx = variants.findIndex((v: any) => v.id === variantId);
      if (vIdx === -1) throw new Error(`Variant ${variantId} not found in product ${productId}`);
      
      const current = variants[vIdx].stock || 0;
      if (current + delta < 0) throw new InsufficientStockError(productId, Math.abs(delta), current);

      variants[vIdx].stock = current + delta;
      variants[vIdx].updatedAt = serverTimestamp();
      const totalStock = variants.reduce((sum, v) => sum + (v.stock || 0), 0);

      const oldProduct = mapDocToProduct(productId, data);
      const updatedData = applyDerivedFields({ ...data, id: productId, variants, stock: totalStock, updatedAt: serverTimestamp() });
      t.update(docRef, updatedData);
      
      const newProduct = mapDocToProduct(productId, updatedData);
      applyStatsDeltas(t, getProductStatsDeltas(oldProduct, newProduct));
    };

    if (transaction) await operation(transaction);
    else await runTransaction(db, operation);
  }

  async batchUpdateStock(updates: { id: string; variantId?: string; delta: number }[], transaction?: any): Promise<void> {
    const db = getUnifiedDb();
    const operation = async (t: Transaction) => {
      const productIds = new Set<string>(updates.map(u => u.id));
      const snapshots = await Promise.all(Array.from(productIds).map(id => t.get(doc(db, this.collectionName, id))));
      const productMap = new Map<string, any>();
      snapshots.forEach(snap => { if (snap.exists()) productMap.set(snap.id, snap.data()); });

      const accumulatedDeltas: Record<string, number> = {};
      const finalUpdates = new Map<string, any>();

      for (const update of updates) {
        const data = finalUpdates.get(update.id) || productMap.get(update.id);
        if (!data) continue;

        const oldProduct = mapDocToProduct(update.id, data);
        const workingData = { ...data };

        if (update.variantId) {
          const variants = [...(workingData.variants || [])];
          const vIdx = variants.findIndex((v: any) => v.id === update.variantId);
          if (vIdx !== -1) {
            const current = variants[vIdx].stock || 0;
            if (current + update.delta < 0) throw new InsufficientStockError(update.id, Math.abs(update.delta), current);
            variants[vIdx].stock = current + update.delta;
            variants[vIdx].updatedAt = serverTimestamp();
            workingData.variants = variants;
            workingData.stock = variants.reduce((sum: number, v: any) => sum + (v.stock || 0), 0);
          }
        } else {
          const current = workingData.stock || 0;
          if (current + update.delta < 0) throw new InsufficientStockError(update.id, Math.abs(update.delta), current);
          workingData.stock = current + update.delta;
        }

        workingData.updatedAt = serverTimestamp();
        const enriched = applyDerivedFields({ ...workingData, id: update.id });
        finalUpdates.set(update.id, enriched);
        t.update(doc(db, this.collectionName, update.id), enriched);

        const newProduct = mapDocToProduct(update.id, enriched);
        const deltas = getProductStatsDeltas(oldProduct, newProduct);
        Object.entries(deltas).forEach(([path, delta]) => {
          accumulatedDeltas[path] = (accumulatedDeltas[path] || 0) + delta;
        });
      }
      applyStatsDeltas(t, accumulatedDeltas);
    };

    if (transaction) await operation(transaction);
    else await runTransaction(db, operation);
  }

  async batchSetInventory(updates: { id: string; variantId?: string; stock: number }[]): Promise<void> {
    const db = getUnifiedDb();
    await runTransaction(db, async (t: Transaction) => {
      const productIds = new Set<string>(updates.map(u => u.id));
      const snapshots = await Promise.all(Array.from(productIds).map(id => t.get(doc(db, this.collectionName, id))));
      const productMap = new Map<string, any>();
      snapshots.forEach(snap => { if (snap.exists()) productMap.set(snap.id, snap.data()); });

      const accumulatedDeltas: Record<string, number> = {};

      for (const update of updates) {
        const data = productMap.get(update.id);
        if (!data) continue;

        const oldProduct = mapDocToProduct(update.id, data);
        const workingData = { ...data };

        if (update.variantId) {
          const variants = [...(workingData.variants || [])];
          const vIdx = variants.findIndex((v: any) => v.id === update.variantId);
          if (vIdx !== -1) {
            variants[vIdx].stock = update.stock;
            variants[vIdx].updatedAt = serverTimestamp();
            workingData.variants = variants;
            workingData.stock = variants.reduce((sum: number, v: any) => sum + (v.stock || 0), 0);
          }
        } else {
          workingData.stock = update.stock;
        }

        workingData.updatedAt = serverTimestamp();
        const enriched = applyDerivedFields({ ...workingData, id: update.id });
        t.update(doc(db, this.collectionName, update.id), enriched);

        const newProduct = mapDocToProduct(update.id, enriched);
        const deltas = getProductStatsDeltas(oldProduct, newProduct);
        Object.entries(deltas).forEach(([path, delta]) => {
          accumulatedDeltas[path] = (accumulatedDeltas[path] || 0) + delta;
        });
      }
      applyStatsDeltas(t, accumulatedDeltas);
    });
  }

  async batchDelete(ids: string[]): Promise<void> {
    const db = getUnifiedDb();
    await runTransaction(db, async (t: Transaction) => {
      const accumulatedDeltas: Record<string, number> = {};
      for (const id of ids) {
        const docRef = doc(db, this.collectionName, id);
        const snap = await t.get(docRef);
        if (snap.exists()) {
          const product = mapDocToProduct(id, snap.data() as DocumentData);
          t.delete(docRef);
          const deltas = getProductStatsDeltas(product, null);
          Object.entries(deltas).forEach(([path, delta]) => {
            accumulatedDeltas[path] = (accumulatedDeltas[path] || 0) + delta;
          });
        }
      }
      applyStatsDeltas(t, accumulatedDeltas);
    });
  }

  async batchUpdate(updates: { id: string; updates: ProductUpdate }[]): Promise<Product[]> {
    const db = getUnifiedDb();
    return await runTransaction(db, async (t: Transaction) => {
      const results: Product[] = [];
      const accumulatedDeltas: Record<string, number> = {};

      for (const update of updates) {
        const docRef = doc(db, this.collectionName, update.id);
        const docSnap = await t.get(docRef);
        if (!docSnap.exists()) continue;

        const currentData = docSnap.data() as any;
        const currentProduct = mapDocToProduct(update.id, currentData);
        
        // Handle internal variant stock update signal
        const mergedData = { ...(currentData as any), ...(update.updates as any), id: update.id, updatedAt: serverTimestamp() };
        const variantUpdate = (update.updates as any)._variantStockUpdate;
        if (variantUpdate) {
          const variants = [...(currentData.variants || [])];
          const vIdx = variants.findIndex((v: any) => v.id === variantUpdate.variantId);
          if (vIdx !== -1) {
            variants[vIdx].stock = variantUpdate.stock;
            variants[vIdx].updatedAt = serverTimestamp();
            (mergedData as any).variants = variants;
            (mergedData as any).stock = variants.reduce((sum: number, v: any) => sum + (v.stock || 0), 0);
          }
          delete (mergedData as any)._variantStockUpdate;
        }

        const enriched = applyDerivedFields(mergedData);
        t.update(docRef, enriched);
        
        const updatedProduct = mapDocToProduct(update.id, enriched);
        const deltas = getProductStatsDeltas(currentProduct, updatedProduct);
        Object.entries(deltas).forEach(([path, delta]) => {
          accumulatedDeltas[path] = (accumulatedDeltas[path] || 0) + delta;
        });
        results.push(updatedProduct);
      }
      applyStatsDeltas(t, accumulatedDeltas);
      return results;
    });
  }

  async getStats(): Promise<ProductStats> {
    const db = getUnifiedDb();
    const statsSnap = await getDoc(doc(db, STATS_DOC_PATH));
    if (!statsSnap.exists()) return initializeProductStats(this.collectionName, mapDocToProduct);
    return statsSnap.data() as ProductStats;
  }

  async getDetailedStats(): Promise<ProductStats> { return this.getStats(); }

  async getLowStockProducts(limitVal: number): Promise<Product[]> {
    const q = query(
      collection(getUnifiedDb(), this.collectionName), 
      where('status', '==', 'active'),
      where('stock', '<', 10),
      orderBy('stock', 'asc'),
      limit(limitVal)
    );
    try {
      const snapshot = await getDocs(q);
      return snapshot.docs.map((d: QueryDocumentSnapshot) => mapDocToProduct(d.id, d.data() as DocumentData));
    } catch (err) {
      logger.error('Failed to fetch low stock products', err);
      const fallback = query(collection(getUnifiedDb(), this.collectionName), where('status', '==', 'active'), limit(limitVal));
      const snap = await getDocs(fallback);
      return snap.docs.map((d: QueryDocumentSnapshot) => mapDocToProduct(d.id, d.data())).filter((p: Product) => p.stock < 10).sort((a: Product, b: Product) => a.stock - b.stock);
    }
  }

  private async ensureUniqueHandle(handle: string, excludeId?: string): Promise<string> {
    let current = handle;
    for (let i = 0; i < 10; i++) {
      const q = query(collection(getUnifiedDb(), this.collectionName), where('handle', '==', current), limit(1));
      const snap = await getDocs(q);
      if (snap.empty || (excludeId && snap.docs[0].id === excludeId)) return current;
      current = `${handle}-${i + 1}`;
    }
    return `${handle}-${crypto.randomUUID().slice(0, 4)}`;
  }
}
