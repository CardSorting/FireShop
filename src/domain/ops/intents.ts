/** [LAYER: DOMAIN] Canonical operational intent cards. */
import type { DesiredOperationalState, OperationalIntentCard, OperationalIntentType } from './types';

export const OPERATIONAL_INTENT_CARDS: OperationalIntentCard[] = [
  {
    type: 'prepare_for_weekend_sales',
    title: 'Prepare for weekend sales',
    description: 'Decide what to promote, what to restock, and what to clear before demand increases.',
    category: 'revenue',
    defaultPriority: 'high',
    targets: ['discounts', 'inventory', 'catalog', 'storefront', 'procurement'],
  },
  {
    type: 'reduce_low_stock_risk',
    title: 'Reduce low-stock risk',
    description: 'Find products likely to run out and decide whether to reorder or stop promoting them.',
    category: 'risk',
    defaultPriority: 'urgent',
    targets: ['inventory', 'procurement', 'storefront'],
  },
  {
    type: 'improve_catalog_quality',
    title: 'Improve catalog quality',
    description: 'Find products missing SKU, cost, or photo data and decide which need attention before they sell.',
    category: 'catalog',
    defaultPriority: 'medium',
    targets: ['catalog', 'inventory'],
  },
  {
    type: 'clear_fulfillment_backlog',
    title: 'Clear fulfillment backlog',
    description: 'Review orders that are pending or confirmed but not yet processed to avoid shipping delays.',
    category: 'fulfillment',
    defaultPriority: 'high',
    targets: ['orders', 'fulfillment'],
  },
];

export function getOperationalIntentCard(type: OperationalIntentType): OperationalIntentCard {
  const card = OPERATIONAL_INTENT_CARDS.find((item) => item.type === type);
  if (!card) throw new Error(`Unknown operational intent: ${type}`);
  return card;
}

export function buildDefaultDesiredState(type: OperationalIntentType): DesiredOperationalState {
  const card = getOperationalIntentCard(type);
  const sharedApproval = {
    type: 'human_approval_required' as const,
    value: true,
    description: 'Store-changing actions require review before anything is executed.',
  };

  if (type === 'prepare_for_weekend_sales') {
    return {
      intentType: type,
      goal: 'Prepare the store for weekend sales without causing stockouts, margin problems, or fulfillment delays.',
      horizon: 'weekend',
      priority: card.defaultPriority,
      targets: card.targets,
      constraints: [
        { type: 'margin_floor', operator: '>=', value: 0.3, description: 'Protect gross margin at or above 30%.' },
        { type: 'max_discount', operator: '<=', value: 0.15, description: 'Do not propose discounts above 15% without explicit approval.' },
        { type: 'avoid_stockouts', value: true, description: 'Exclude or replenish low-stock products before promotion.' },
        sharedApproval,
      ],
    };
  }

  if (type === 'reduce_low_stock_risk') {
    return {
      intentType: type,
      goal: 'Reduce stockout risk for active products and keep the right items available to sell.',
      horizon: 'week',
      priority: card.defaultPriority,
      targets: card.targets,
      constraints: [
        { type: 'avoid_stockouts', value: true, description: 'Prioritize products already out of stock or near reorder point.' },
        { type: 'inventory_coverage_days', operator: '>=', value: 14, description: 'Aim for at least two weeks of coverage on replenishable SKUs.' },
        sharedApproval,
      ],
    };
  }

  if (type === 'clear_fulfillment_backlog') {
    return {
      intentType: type,
      goal: 'Clear the orders most likely to create delays or customer support issues.',
      horizon: 'today',
      priority: card.defaultPriority,
      targets: card.targets,
      constraints: [
        { type: 'fulfillment_delay_rate', operator: '<', value: 0.02, description: 'Keep delayed-order pressure below 2% of active orders.' },
        sharedApproval,
      ],
    };
  }

  return {
    intentType: type,
    goal: card.description,
    horizon: type === 'what_needs_attention_today' ? 'today' : 'week',
    priority: card.defaultPriority,
    targets: card.targets,
    constraints: [sharedApproval],
  };
}