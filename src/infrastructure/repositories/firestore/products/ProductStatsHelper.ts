import { Product, ProductDraft, ProductStatus, ProductSetupIssue, MarginHealth } from '@domain/models';
import { calculateGrossMarginPercent } from '@domain/rules';
import { Timestamp, serverTimestamp, increment, Transaction, doc, getUnifiedDb, setDoc, getDoc, getDocs, collection } from '../../../firebase/bridge';
import { logger } from '@utils/logger';

export interface ProductStats {
  totalProducts: number;
  totalUnits: number;
  inventoryValue: number;
  lowStockCount: number;
  outOfStockCount: number;
  statusCounts: Record<ProductStatus, number>;
  marginHealthCounts: Record<MarginHealth, number>;
  totalMarginPercent: number;
  productWithMarginCount: number;
  updatedAt: Date | any;
}

export const STATS_DOC_PATH = 'system_state/product_stats';

export function getProductStatsDeltas(oldProduct: Product | null, newProduct: Product | null): Record<string, number> {
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
    deltas[`marginHealthCounts.${(oldProduct as any).marginHealth || 'unknown'}`] = -1;
    
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
    deltas[`marginHealthCounts.${(newProduct as any).marginHealth || 'unknown'}`] = 1;
    
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
    
    if ((oldProduct as any).marginHealth !== (newProduct as any).marginHealth) {
      deltas[`marginHealthCounts.${(oldProduct as any).marginHealth || 'unknown'}`] = (deltas[`marginHealthCounts.${(oldProduct as any).marginHealth || 'unknown'}`] || 0) - 1;
      deltas[`marginHealthCounts.${(newProduct as any).marginHealth || 'unknown'}`] = (deltas[`marginHealthCounts.${(newProduct as any).marginHealth || 'unknown'}`] || 0) + 1;
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

export function applyStatsDeltas(t: Transaction, deltas: Record<string, number>) {
  const statsRef = doc(getUnifiedDb(), STATS_DOC_PATH);
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

export async function initializeProductStats(collectionName: string, mapFn: (id: string, data: any) => Product): Promise<ProductStats> {
  logger.info('[Stats] Initializing product stats via collection scan...');
  const db = getUnifiedDb();
  const snapshot = await getDocs(collection(db, collectionName));
  
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
    const product = mapFn(d.id, data);
    
    stats.totalProducts++;
    stats.totalUnits += product.stock || 0;
    stats.inventoryValue += (product.stock || 0) * (product.price || 0);

    if (product.stock <= 0) stats.outOfStockCount++;
    else if (product.stock < 10) stats.lowStockCount++;

    stats.statusCounts[product.status] = (stats.statusCounts[product.status] || 0) + 1;
    
    const marginHealth = (product.marginHealth || 'unknown') as MarginHealth;
    stats.marginHealthCounts[marginHealth] = (stats.marginHealthCounts[marginHealth] || 0) + 1;
    
    const marginPercent = calculateGrossMarginPercent(product);
    if (marginPercent !== null) {
      stats.totalMarginPercent += marginPercent;
      stats.productWithMarginCount++;
    }
  });

  await setDoc(doc(db, STATS_DOC_PATH), stats);
  return stats;
}
