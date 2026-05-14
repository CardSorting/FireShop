/**
 * [LAYER: INFRASTRUCTURE]
 * Firestore Implementation of Product Repository
 * 
 * Industrialized for high-concurrency, transactional integrity, and query resilience.
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
  ProductUpdate, 
  ProductStatus,
  ProductStats
} from '@domain/models';

import { ProductNotFoundError, InsufficientStockError } from '@domain/errors';

import { mapDoc } from './utils';
import { classifyInventoryHealth, classifyProductSetupStatus, calculateGrossMarginPercent, classifyMarginHealth, getProductSetupIssues } from '@domain/rules';

export class FirestoreProductRepository implements IProductRepository {
  private readonly collectionName = 'products';
  private readonly statsDocPath = 'system_state/product_stats';


  private mapDocToProduct(id: string, data: DocumentData): Product {
    return mapDoc<Product>(id, data);
  }

  /**
   * Re-calculates and applies all derived domain fields to a raw data object.
   * Ensures Firestore records stay synchronized with domain rules after any mutation.
   */
  private applyDerivedFields(data: any): any {
    const product = this.mapDocToProduct(data.id || 'temp', data);
    return {
      ...data,
      inventoryHealth: classifyInventoryHealth(product.stock),
      setupStatus: classifyProductSetupStatus(product),
      setupIssues: getProductSetupIssues(product),
      marginHealth: classifyMarginHealth(product),
    };
  }

  /**
   * Universal fetch with filter support.
   * Handles composite index requirements by providing fallback sorting logic.
   */
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

      // 1. Build Filters
      if (options.category) {
        constraints.push(where('category', '==', options.category));
      }

      if (options.query) {
        const searchStr = options.query.toLowerCase().trim();
        constraints.push(where('searchKeywords', 'array-contains', searchStr));
      }
      
      if (options.status && options.status !== 'all') {
        constraints.push(where('status', '==', options.status));
      }

      if (options.inventoryHealth && options.inventoryHealth !== 'all') {
        constraints.push(where('inventoryHealth', '==', options.inventoryHealth));
      }

      if (options.setupStatus && options.setupStatus !== 'all') {
        constraints.push(where('setupStatus', '==', options.setupStatus));
      }

      if (options.collection) {
        constraints.push(where('collections', 'array-contains', options.collection));
      }

      // 2. Build Query with Order
      // Note: Adding orderBy here requires composite indexes for any active filters.
      // Optimization: If only 1 result is requested, skip ordering to avoid index requirements.
      const shouldOrder = options.limit !== 1;
      const queryWithOrder = shouldOrder 
        ? query(baseColl, ...constraints, orderBy('createdAt', 'desc'))
        : query(baseColl, ...constraints);
      
      let snapshot;
      try {
        snapshot = await this.executePaginatedQuery(queryWithOrder, options);
      } catch (err: any) {
        // 3. Fallback logic for missing indexes (HTTP 400)
        // If the composite index is missing, we fetch without server-side ordering
        // and sort in-memory. This keeps the app functional during deployment.
        if (err?.code === 400 || err?.status === 400 || String(err).includes('index')) {
          logger.warn('Product query failed (missing index), falling back to in-memory sort', { options });
          const unorderedQuery = query(baseColl, ...constraints);
          snapshot = await this.executePaginatedQuery(unorderedQuery, options, true);
        } else {
          throw err;
        }
      }

      const results = snapshot.docs.map((d: QueryDocumentSnapshot) => this.mapDocToProduct(d.id, d.data()));
      
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
    return this.mapDocToProduct(docSnap.id, docSnap.data());
  }

  async getByHandle(handle: string, transaction?: any): Promise<Product | null> {
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
        setupIssues: getProductSetupIssues(product as Product),
        marginHealth: classifyMarginHealth(product as Product),
      };

      const productRef = doc(getUnifiedDb(), this.collectionName, id);
      transaction.set(productRef, productData);
      
      const createdProduct = { ...productData, id, createdAt: new Date(), updatedAt: new Date() } as any as Product;
      const deltas = this.getProductStatsDeltas(null, createdProduct);
      this.applyStatsDeltas(transaction, deltas);
      
      return createdProduct;
    });
  }


  async batchCreate(products: ProductDraft[]): Promise<Product[]> {
    const db = getUnifiedDb();
    const results: Product[] = [];
    const now = serverTimestamp();

    // Industrialization: Batch creation with transaction safety
    return await runTransaction(db, async (transaction: Transaction) => {
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

        const productData = {
          ...draft,
          createdAt: now,
          updatedAt: now,
          variants,
          variantIds: variants.map(v => v.id),
          options: draft.options?.map(o => ({ ...o, id: o.id || crypto.randomUUID() })) || [],
          media: draft.media?.map(m => ({ ...m, id: m.id || crypto.randomUUID(), createdAt: now })) || [],
          handle,
          searchKeywords: this.generateSearchKeywords(draft.name, handle, draft.sku),
          inventoryHealth: classifyInventoryHealth(draft.stock),
          setupStatus: classifyProductSetupStatus(draft as Product),
          setupIssues: getProductSetupIssues(draft as Product),
          marginHealth: classifyMarginHealth(draft as Product),
        };

        const productRef = doc(db, this.collectionName, id);
        transaction.set(productRef, productData);
        
        const createdProduct = { ...productData, id, createdAt: new Date(), updatedAt: new Date() } as any as Product;
        const deltas = this.getProductStatsDeltas(null, createdProduct);
        Object.entries(deltas).forEach(([path, delta]) => {
          accumulatedDeltas[path] = (accumulatedDeltas[path] || 0) + delta;
        });
        results.push(createdProduct);
      }
      this.applyStatsDeltas(transaction, accumulatedDeltas);
      return results;
    });
  }


  async update(id: string, updates: ProductUpdate, transaction?: any): Promise<Product> {
    const docRef = doc(getUnifiedDb(), this.collectionName, id);
    const db = getUnifiedDb();
    const now = serverTimestamp();
    const firestoreUpdates: any = { ...updates, updatedAt: now };

    const operation = async (t: any) => {
      let current: Product | null = null;
      const docSnap = await t.get(docRef);
      if (!docSnap.exists()) throw new ProductNotFoundError(id);
      
      current = this.mapDocToProduct(docSnap.id, docSnap.data());
      const currentData = docSnap.data() as any;
      const merged = { ...current, ...updates } as Product;
      
      // PRODUCTION HARDENING: Handle internal variant stock update signal
      const variantUpdate = (updates as any)._variantStockUpdate;
      if (variantUpdate) {
        const variants = [...(currentData.variants || [])];
        const vIdx = variants.findIndex((v: any) => v.id === variantUpdate.variantId);
        if (vIdx !== -1) {
          variants[vIdx].stock = variantUpdate.stock;
          variants[vIdx].updatedAt = serverTimestamp();
          (merged as any).variants = variants;
          (merged as any).stock = variants.reduce((sum: number, v: any) => sum + (v.stock || 0), 0);
          firestoreUpdates.variants = variants;
          firestoreUpdates.stock = (merged as any).stock;
        }
        delete (firestoreUpdates as any)._variantStockUpdate;
      }

      if (updates.name || updates.sku || updates.handle || updates.status || updates.stock !== undefined || variantUpdate) {
        if (updates.name || updates.sku || updates.handle) {
          firestoreUpdates.searchKeywords = this.generateSearchKeywords(
            merged.name,
            merged.handle || '',
            merged.sku
          );
        }
        firestoreUpdates.inventoryHealth = classifyInventoryHealth(merged.stock);
        firestoreUpdates.setupStatus = classifyProductSetupStatus(merged);
        firestoreUpdates.setupIssues = getProductSetupIssues(merged);
        firestoreUpdates.marginHealth = classifyMarginHealth(merged);
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

      if (updates.variants && !variantUpdate) {
        firestoreUpdates.variants = updates.variants.map(v => ({
          ...v,
          id: v.id || crypto.randomUUID(),
          createdAt: v.createdAt ? Timestamp.fromDate(new Date(v.createdAt)) : now,
          updatedAt: now
        }));
        firestoreUpdates.variantIds = firestoreUpdates.variants.map((v: any) => v.id);
      }

      t.update(docRef, firestoreUpdates);

      // Re-map to get the final product state for stats update
      const updatedProduct = this.mapDocToProduct(id, { ...currentData, ...firestoreUpdates });
      await this.updateProductStats(t, current, updatedProduct);
    };

    };

    if (transaction) {
      await operation(transaction);
    } else {
      await runTransaction(db, operation);
    }

    return (await this.getById(id))!;
  }

  async delete(id: string): Promise<void> {
    const db = getUnifiedDb();
    await runTransaction(db, async (t) => {
      const docRef = doc(db, this.collectionName, id);
      const snap = await t.get(docRef);
      if (snap.exists()) {
        const product = this.mapDocToProduct(id, snap.data());
        t.delete(docRef);
        this.applyStatsDeltas(t, this.getProductStatsDeltas(product, null));
      }
    });
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

      const oldProduct = this.mapDocToProduct(id, data);
      const updatedData = this.applyDerivedFields({ ...data, id, stock: nextStock, updatedAt: serverTimestamp() });
      t.update(docRef, updatedData);
      
      const newProduct = this.mapDocToProduct(id, updatedData);
      this.applyStatsDeltas(t, this.getProductStatsDeltas(oldProduct, newProduct));
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
      const oldProduct = this.mapDocToProduct(productId, data);

      const updatedData = this.applyDerivedFields({ 
        ...data, 
        id: productId,
        variants, 
        stock: totalStock,
        updatedAt: serverTimestamp() 
      });

      t.update(docRef, updatedData);
      
      const newProduct = this.mapDocToProduct(productId, updatedData);
      this.applyStatsDeltas(t, this.getProductStatsDeltas(oldProduct, newProduct));
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
      const productIds = new Set<string>(updates.map(u => u.id));
      const docRefs = Array.from(productIds).map(id => doc(db, this.collectionName, id));
      const snapshots = await Promise.all(docRefs.map(ref => t.get(ref)));
      
      const productDataMap = new Map<string, any>();
      snapshots.forEach(snap => {
        if (snap.exists()) productDataMap.set(snap.id, snap.data());
      });

      const finalUpdates = new Map<string, any>();
      const accumulatedDeltas: Record<string, number> = {};
      
      for (const update of updates) {
        const data = finalUpdates.get(update.id) || productDataMap.get(update.id);
        if (!data) throw new Error(`Product ${update.id} not found for stock update`);

        const oldProduct = this.mapDocToProduct(update.id, data);
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

        const enriched = this.applyDerivedFields({ ...workingData, id: update.id });
        t.update(doc(db, this.collectionName, update.id), enriched);
        
        const newProduct = this.mapDocToProduct(update.id, enriched);
        const deltas = this.getProductStatsDeltas(oldProduct, newProduct);
        Object.entries(deltas).forEach(([path, delta]) => {
          accumulatedDeltas[path] = (accumulatedDeltas[path] || 0) + delta;
        });
      }
      this.applyStatsDeltas(t, accumulatedDeltas);
    };

    if (transaction) {
      await operation(transaction);
    } else {
      await runTransaction(db, operation);
    }
  }

  async batchUpdate(updates: { id: string; updates: ProductUpdate }[]): Promise<Product[]> {
    const db = getUnifiedDb();
    
    return await runTransaction(db, async (t: any) => {
      const results: Product[] = [];
      const accumulatedDeltas: Record<string, number> = {};

      for (const update of updates) {
        const docRef = doc(db, this.collectionName, update.id);
        const docSnap = await t.get(docRef);
        if (!docSnap.exists()) continue;

        const currentData = docSnap.data() as any;
        const currentProduct = this.mapDocToProduct(update.id, currentData);
        const mergedData = { ...currentData, ...update.updates, id: update.id, updatedAt: serverTimestamp() };
        
        const variantUpdate = (update.updates as any)._variantStockUpdate;
        if (variantUpdate) {
          const variants = [...(currentData.variants || [])];
          const vIdx = variants.findIndex((v: any) => v.id === variantUpdate.variantId);
          if (vIdx !== -1) {
            variants[vIdx].stock = variantUpdate.stock;
            variants[vIdx].updatedAt = serverTimestamp();
            mergedData.variants = variants;
            mergedData.stock = variants.reduce((sum: number, v: any) => sum + (v.stock || 0), 0);
          }
          delete (mergedData as any)._variantStockUpdate;
        }

        const enriched = this.applyDerivedFields(mergedData);
        t.update(docRef, enriched);
        
        const updatedProduct = this.mapDocToProduct(update.id, enriched);
        const deltas = this.getProductStatsDeltas(currentProduct, updatedProduct);
        Object.entries(deltas).forEach(([path, delta]) => {
          accumulatedDeltas[path] = (accumulatedDeltas[path] || 0) + delta;
        });
        
        results.push(updatedProduct);
      }
      this.applyStatsDeltas(t, accumulatedDeltas);
      return results;
    });
  }

  async getStats(): Promise<ProductStats> {
    const db = getUnifiedDb();
    const statsSnap = await getDoc(doc(db, this.statsDocPath));
    if (!statsSnap.exists()) {
      return this.initializeProductStats();
    }
    return statsSnap.data() as ProductStats;
  }

  async getDetailedStats(): Promise<ProductStats> {
    return this.getStats();
  }

  private async initializeProductStats(): Promise<ProductStats> {
    logger.info('[Stats] Initializing product stats via collection scan...');
    const db = getUnifiedDb();
    const snapshot = await getDocs(collection(db, this.collectionName));
    
    const stats: ProductStats = {
      totalProducts: 0,
      totalUnits: 0,
      inventoryValue: 0,
      lowStockCount: 0,
      outOfStockCount: 0,
      statusCounts: { active: 0, draft: 0, archived: 0 },
      marginHealthCounts: { unknown: 0, at_risk: 0, healthy: 0, premium: 0 },
      totalMarginPercent: 0,
      productWithMarginCount: 0,
      updatedAt: new Date()
    };

    snapshot.forEach((d: any) => {
      const data = d.data();
      const product = this.mapDocToProduct(d.id, data);
      
      stats.totalProducts++;
      stats.totalUnits += product.stock || 0;
      stats.inventoryValue += (product.stock || 0) * (product.price || 0);

      if (product.stock <= 0) stats.outOfStockCount++;
      else if (product.stock < 10) stats.lowStockCount++;

      
      stats.statusCounts[product.status] = (stats.statusCounts[product.status] || 0) + 1;
      
      const marginHealth = product.marginHealth || 'unknown';
      stats.marginHealthCounts[marginHealth] = (stats.marginHealthCounts[marginHealth] || 0) + 1;
      
      const marginPercent = calculateGrossMarginPercent(product);
      if (marginPercent !== null) {
        stats.totalMarginPercent += marginPercent;
        stats.productWithMarginCount++;
      }
    });

    await setDoc(doc(db, this.statsDocPath), stats);
    return stats;
  }

  private getProductStatsDeltas(oldProduct: Product | null, newProduct: Product | null): Record<string, number> {
    const deltas: Record<string, number> = {};
    
    const getStockHealth = (stock: number) => {
      if (stock <= 0) return 'out';
      if (stock < 10) return 'low';
      return 'healthy';
    };

    if (oldProduct && !newProduct) {
      // Deletion
      deltas['totalProducts'] = -1;
      deltas['totalUnits'] = -(oldProduct.stock || 0);
      deltas['inventoryValue'] = -((oldProduct.stock || 0) * (oldProduct.price || 0));
      deltas[`statusCounts.${oldProduct.status}`] = -1;
      deltas[`marginHealthCounts.${oldProduct.marginHealth || 'unknown'}`] = -1;
      
      const health = getStockHealth(oldProduct.stock);
      if (health === 'low') deltas['lowStockCount'] = -1;
      if (health === 'out') deltas['outOfStockCount'] = -1;
      
      const margin = calculateGrossMarginPercent(oldProduct);
      if (margin !== null) {
        deltas['totalMarginPercent'] = -margin;
        deltas['productWithMarginCount'] = -1;
      }
    } else if (!oldProduct && newProduct) {
      // Creation
      deltas['totalProducts'] = 1;
      deltas['totalUnits'] = newProduct.stock || 0;
      deltas['inventoryValue'] = (newProduct.stock || 0) * (newProduct.price || 0);
      deltas[`statusCounts.${newProduct.status}`] = 1;
      deltas[`marginHealthCounts.${newProduct.marginHealth || 'unknown'}`] = 1;
      
      const health = getStockHealth(newProduct.stock);
      if (health === 'low') deltas['lowStockCount'] = 1;
      if (health === 'out') deltas['outOfStockCount'] = 1;
      
      const margin = calculateGrossMarginPercent(newProduct);
      if (margin !== null) {
        deltas['totalMarginPercent'] = margin;
        deltas['productWithMarginCount'] = 1;
      }
    } else if (oldProduct && newProduct) {
      // Update
      if (oldProduct.stock !== newProduct.stock || oldProduct.price !== newProduct.price) {
        deltas['totalUnits'] = (newProduct.stock || 0) - (oldProduct.stock || 0);
        deltas['inventoryValue'] = 
          ((newProduct.stock || 0) * (newProduct.price || 0)) - 
          ((oldProduct.stock || 0) * (oldProduct.price || 0));
      }

      if (oldProduct.status !== newProduct.status) {
        deltas[`statusCounts.${oldProduct.status}`] = (deltas[`statusCounts.${oldProduct.status}`] || 0) - 1;
        deltas[`statusCounts.${newProduct.status}`] = (deltas[`statusCounts.${newProduct.status}`] || 0) + 1;
      }
      
      if (oldProduct.marginHealth !== newProduct.marginHealth) {
        deltas[`marginHealthCounts.${oldProduct.marginHealth || 'unknown'}`] = (deltas[`marginHealthCounts.${oldProduct.marginHealth || 'unknown'}`] || 0) - 1;
        deltas[`marginHealthCounts.${newProduct.marginHealth || 'unknown'}`] = (deltas[`marginHealthCounts.${newProduct.marginHealth || 'unknown'}`] || 0) + 1;
      }
      
      const oldHealth = getStockHealth(oldProduct.stock);
      const newHealth = getStockHealth(newProduct.stock);
      if (oldHealth !== newHealth) {
        if (oldHealth === 'low') deltas['lowStockCount'] = (deltas['lowStockCount'] || 0) - 1;
        if (oldHealth === 'out') deltas['outOfStockCount'] = (deltas['outOfStockCount'] || 0) - 1;
        if (newHealth === 'low') deltas['lowStockCount'] = (deltas['lowStockCount'] || 0) + 1;
        if (newHealth === 'out') deltas['outOfStockCount'] = (deltas['outOfStockCount'] || 0) + 1;
      }
      
      const oldMargin = calculateGrossMarginPercent(oldProduct);
      const newMargin = calculateGrossMarginPercent(newProduct);
      if (oldMargin !== newMargin) {
        if (oldMargin !== null) {
          deltas['totalMarginPercent'] = (deltas['totalMarginPercent'] || 0) - oldMargin;
          deltas['productWithMarginCount'] = (deltas['productWithMarginCount'] || 0) - 1;
        }
        if (newMargin !== null) {
          deltas['totalMarginPercent'] = (deltas['totalMarginPercent'] || 0) + newMargin;
          deltas['productWithMarginCount'] = (deltas['productWithMarginCount'] || 0) + 1;
        }
      }
    }

    return deltas;
  }

  private applyStatsDeltas(t: Transaction, deltas: Record<string, number>) {
    const statsRef = doc(getUnifiedDb(), this.statsDocPath);
    const updates: any = { updatedAt: serverTimestamp() };
    let hasUpdates = false;

    for (const [path, delta] of Object.entries(deltas)) {
      if (delta !== 0) {
        updates[path] = increment(delta);
        hasUpdates = true;
      }
    }

    if (hasUpdates) {
      t.set(statsRef, updates, { merge: true });
    }
  }


  async getLowStockProducts(limitVal: number): Promise<Product[]> {
    // Note: status + stock index is required for this query.
    const q = query(
      collection(getUnifiedDb(), this.collectionName), 
      where('status', '==', 'active'),
      where('stock', '<', 10),
      orderBy('stock', 'asc'),
      limit(limitVal)
    );
    try {
      const snapshot = await getDocs(q);
      return snapshot.docs.map((d: QueryDocumentSnapshot) => this.mapDocToProduct(d.id, d.data()));
    } catch (err) {
      logger.error('Failed to fetch low stock products', err);
      // Fallback: simple fetch with status only
      const fallback = query(
        collection(getUnifiedDb(), this.collectionName), 
        where('status', '==', 'active'),
        limit(limitVal)
      );
      const snapshot = await getDocs(fallback);
      return snapshot.docs
        .map((d: QueryDocumentSnapshot) => this.mapDocToProduct(d.id, d.data()))
        .filter((p: Product) => p.stock < 10)
        .sort((a: Product, b: Product) => a.stock - b.stock);
    }
  }

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
      if (excludeId && snapshot.docs[0].id === excludeId) return currentHandle;

      attempts++;
      currentHandle = `${handle}-${attempts}`;
    }

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
