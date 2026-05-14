import { getInitialServices } from '../core/container';
import { logger } from '../utils/logger';
import { getUnifiedDb } from '../infrastructure/firebase/bridge';
import { collection, getDocs, doc, setDoc, query, where, serverTimestamp } from 'firebase/firestore';
import type { Order, Product } from '../domain/models';

/**
 * [RECONCILIATION SCRIPT]
 * 
 * Scans all products and orders to re-calculate the sovereign stats documents.
 * Run this periodically to fix drift caused by manual database edits or race conditions.
 */
async function reconcile() {
    logger.info('Starting Administrative Stats Reconciliation...');
    const db = getUnifiedDb();
    
    // 1. Reconcile Product Stats
    logger.info('[1/2] Reconciling Product Stats...');
    const productsSnapshot = await getDocs(collection(db, 'products'));
    let totalUnits = 0;
    let inventoryValue = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;
    let healthyStockCount = 0;
    let premiumMarginCount = 0;
    let healthyMarginCount = 0;
    let atRiskMarginCount = 0;
    let unknownMarginCount = 0;

    productsSnapshot.docs.forEach(d => {
        const p = d.data() as Product;
        const stock = p.stock || 0;
        totalUnits += stock;
        inventoryValue += stock * (p.cost || 0);

        if (stock <= 0) outOfStockCount++;
        else if (stock < 5) lowStockCount++;
        else healthyStockCount++;

        const margin = p.marginHealth || 'unknown';
        if (margin === 'premium') premiumMarginCount++;
        else if (margin === 'healthy') healthyMarginCount++;
        else if (margin === 'at_risk') atRiskMarginCount++;
        else unknownMarginCount++;
    });

    const productStats = {
        totalUnits,
        inventoryValue,
        inventoryStatus: {
            low: lowStockCount,
            out: outOfStockCount,
            healthy: healthyStockCount
        },
        marginHealth: {
            premium: premiumMarginCount,
            healthy: healthyMarginCount,
            atRisk: atRiskMarginCount,
            unknown: unknownMarginCount
        },
        lastReconciledAt: serverTimestamp()
    };

    await setDoc(doc(db, 'system_state', 'product_stats'), productStats, { merge: true });
    logger.info('Product stats reconciled successfully.');

    // 2. Reconcile Order Stats
    logger.info('[2/2] Reconciling Order Stats...');
    const ordersSnapshot = await getDocs(collection(db, 'orders'));
    let totalOrders = 0;
    let totalRevenue = 0;
    const statusCounts: Record<string, number> = {};
    const dailyRevenue: Record<string, number> = {};

    ordersSnapshot.docs.forEach(d => {
        const o = d.data() as Order;
        if (o.status === 'cancelled') return;

        totalOrders++;
        totalRevenue += o.total;

        statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;

        if (o.createdAt) {
            const dateStr = new Date(o.createdAt).toISOString().split('T')[0];
            dailyRevenue[dateStr] = (dailyRevenue[dateStr] || 0) + o.total;
        }
    });

    const orderStats = {
        totalOrders,
        totalRevenue,
        statusCounts,
        dailyRevenue,
        lastReconciledAt: serverTimestamp()
    };

    await setDoc(doc(db, 'system_state', 'order_stats'), orderStats, { merge: true });
    logger.info('Order stats reconciled successfully.');

    logger.info('Reconciliation Complete.');
}

// In a real environment, we'd use a CLI flag or check if it's the main module
// For now, we'll just export it.
export { reconcile };
