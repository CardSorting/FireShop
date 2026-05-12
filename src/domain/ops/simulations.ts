/** [LAYER: DOMAIN] Deterministic simulation heuristics for operational plans. */

export const SIMULATION_COPY = {
  margin: {
    label: 'Margin protection',
    summary: 'Plan excludes weak-margin or unknown-cost products from promotional pressure until cost data is reviewed.',
  },
  inventory: {
    label: 'Inventory pressure',
    summary: 'Low-stock and out-of-stock products should be replenished or removed from customer-facing promotions.',
  },
  fulfillment: {
    label: 'Fulfillment load',
    summary: 'Orders in review or ready-to-ship buckets should be cleared before demand generation increases.',
  },
} as const;