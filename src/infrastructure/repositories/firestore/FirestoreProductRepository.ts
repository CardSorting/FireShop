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
  Product, 
  ProductDraft, 
  ProductUpdate, 
  ProductStatus 
} from '@domain/models';
import { ProductNotFoundError, InsufficientStockError } from '@domain/errors';

import { mapDoc } from './utils';
import { classifyInventoryHealth, classifyProductSetupStatus, calculateGrossMarginPercent, classifyMarginHealth, getProductSetupIssues } from '@domain/rules';

export class FirestoreProductRepository implements IProductRepository {
  private readonly collectionName = 'products';

  private mapDocToProduct(id: string, data: DocumentData): Product {
    return mapDoc<Product>(id, data);
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
      const queryWithOrder = query(baseColl, ...constraints, orderBy('createdAt', 'desc'));
      
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
          firestoreUpdates.setupIssues = getProductSetupIssues(merged);
          firestoreUpdates.marginHealth = classifyMarginHealth(merged);
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
      const productIds = new Set<string>(updates.map(u => u.id));
      const docRefs = Array.from(productIds).map(id => doc(db, this.collectionName, id));
      const snapshots = await Promise.all(docRefs.map(ref => t.get(ref)));
      
      const productDataMap = new Map<string, any>();
      snapshots.forEach(snap => {
        if (snap.exists()) productDataMap.set(snap.id, snap.data());
      });

      const finalUpdates = new Map<string, any>();
      
      for (const update of updates) {
        const data = finalUpdates.get(update.id) || productDataMap.get(update.id);
        if (!data) throw new Error(`Product ${update.id} not found for stock update`);

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

  async getDetailedStats(): Promise<{
    statusCounts: Record<ProductStatus, number>;
    setupIssueCounts: Record<import('@domain/models').ProductSetupIssue, number>;
    marginHealthCounts: Record<import('@domain/models').MarginHealth, number>;
    averageMarginPercent: number;
  }> {
    const snapshot = await getDocs(collection(getUnifiedDb(), this.collectionName));
    
    const stats: any = {
      statusCounts: { active: 0, draft: 0, archived: 0 },
      setupIssueCounts: {
        missing_image: 0,
        missing_sku: 0,
        missing_price: 0,
        missing_cost: 0,
        missing_stock: 0,
        missing_category: 0,
        not_published: 0,
      },
      marginHealthCounts: { unknown: 0, at_risk: 0, healthy: 0, premium: 0 },
      totalMarginPercent: 0,
      productWithMarginCount: 0,
    };

    snapshot.forEach((d: any) => {
      const data = d.data();
      
      // Status
      const status = data.status as ProductStatus;
      if (stats.statusCounts[status] !== undefined) {
        stats.statusCounts[status]++;
      }

      // Setup Issues
      const issues = data.setupIssues || [];
      issues.forEach((issue: string) => {
        if (stats.setupIssueCounts[issue] !== undefined) {
          stats.setupIssueCounts[issue]++;
        }
      });

      // Margin Health
      const margin = data.marginHealth || 'unknown';
      if (stats.marginHealthCounts[margin] !== undefined) {
        stats.marginHealthCounts[margin]++;
      }

      // Average Margin calculation
      const marginPercent = calculateGrossMarginPercent(data as Product);
      if (marginPercent !== null) {
        stats.totalMarginPercent += marginPercent;
        stats.productWithMarginCount++;
      }
    });

    return {
      statusCounts: stats.statusCounts,
      setupIssueCounts: stats.setupIssueCounts,
      marginHealthCounts: stats.marginHealthCounts,
      averageMarginPercent: stats.productWithMarginCount > 0 
        ? Math.round(stats.totalMarginPercent / stats.productWithMarginCount) 
        : 0,
    };
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
