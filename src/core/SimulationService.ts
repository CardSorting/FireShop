/**
 * [LAYER: CORE]
 * Data-driven operational strategy and predictive analytics.
 */
import type { OperationalIntentIR, OperationalStateSnapshot, ProposedOperation, SimulationResult } from '@domain/ops/types';
import { SIMULATION_COPY } from '@domain/ops/simulations';

export class SimulationService {
  simulate(intent: OperationalIntentIR, snapshot: OperationalStateSnapshot, operations: ProposedOperation[]): SimulationResult[] {
    const activeFulfillment = (snapshot.dashboard.fulfillmentCounts.to_review ?? 0) + (snapshot.dashboard.fulfillmentCounts.ready_to_ship ?? 0);
    const lowStock = snapshot.inventory.healthCounts.low_stock ?? snapshot.dashboard.lowStockCount;
    const outOfStock = snapshot.inventory.healthCounts.out_of_stock ?? snapshot.dashboard.outOfStockCount;
    const unknownMarginProducts = snapshot.productManagement.productsNeedingAttention.filter((product) => product.marginHealth === 'unknown').length;

    const simulations: SimulationResult[] = [
      {
        id: 'inventory-pressure',
        label: SIMULATION_COPY.inventory.label,
        summary: `${SIMULATION_COPY.inventory.summary} Current pressure: ${lowStock} low-stock and ${outOfStock} out-of-stock products.`,
        confidence: 'medium',
        impact: lowStock + outOfStock > 0 ? 'mixed' : 'positive',
        metrics: [
          { label: 'Low-stock products', value: lowStock, direction: lowStock > 0 ? 'up' : 'flat' },
          { label: 'Out-of-stock products', value: outOfStock, direction: outOfStock > 0 ? 'up' : 'flat' },
          { label: 'Proposed inventory operations', value: operations.filter((op) => op.target === 'inventory' || op.target === 'procurement').length },
        ],
      },
      {
        id: 'fulfillment-load',
        label: SIMULATION_COPY.fulfillment.label,
        summary: `${SIMULATION_COPY.fulfillment.summary} Active fulfillment queue: ${activeFulfillment} orders/tasks.`,
        confidence: 'medium',
        impact: activeFulfillment > 0 ? 'mixed' : 'positive',
        metrics: [
          { label: 'To review', value: snapshot.dashboard.fulfillmentCounts.to_review ?? 0, direction: 'flat' },
          { label: 'Ready to ship', value: snapshot.dashboard.fulfillmentCounts.ready_to_ship ?? 0, direction: 'flat' },
          { label: 'Fulfillment operations', value: operations.filter((op) => op.target === 'fulfillment' || op.target === 'orders').length },
        ],
      },
    ];

    if (intent.desiredState.targets.includes('discounts') || intent.desiredState.intentType === 'prepare_for_weekend_sales') {
      simulations.unshift({
        id: 'margin-protection',
        label: SIMULATION_COPY.margin.label,
        summary: `${SIMULATION_COPY.margin.summary} Current sampled average margin: ${snapshot.productManagement.averageMarginPercent ?? 'unknown'}%.`,
        confidence: snapshot.productManagement.averageMarginPercent === null ? 'low' : 'medium',
        impact: unknownMarginProducts > 0 ? 'mixed' : 'positive',
        metrics: [
          { label: 'Average margin sample', value: snapshot.productManagement.averageMarginPercent ?? 'Unknown', unit: typeof snapshot.productManagement.averageMarginPercent === 'number' ? '%' : undefined },
          { label: 'Unknown-margin attention items', value: unknownMarginProducts, direction: unknownMarginProducts > 0 ? 'up' : 'flat' },
          { label: 'Max discount constraint', value: '15', unit: '%' },
        ],
      });
    }

    return simulations;
  }
}