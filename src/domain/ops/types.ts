/**
 * [LAYER: DOMAIN]
 * Governance-aware operational language primitives.
 *
 * These types are the first "Operational IR" for post-dashboard workflows:
 * humans declare desired business state, the runtime compiles it into an
 * inspectable, policy-aware plan, and deterministic services perform execution
 * only after approval in later phases.
 */

import type {
  AdminDashboardSummary,
  InventoryOverview,
  ProductManagementOverview,
} from '@domain/models';

export interface OpsSetupProgress {
  hasProducts: boolean;
  hasStoreName: boolean;
  hasPaymentConfigured: boolean;
  hasShippingRates: boolean;
  hasCustomDomain: boolean;
  completedCount: number;
  totalCount: number;
}

export interface OpsPurchaseOrderSnapshot {
  countsByView: Partial<Record<'all' | 'drafts' | 'incoming' | 'partially_received' | 'ready_to_close' | 'exceptions' | 'closed', number>>;
  metrics: {
    incomingUnits: number;
    openShipments: number;
    exceptionCount: number;
    overdueCount: number;
    receivingValue: number;
  };
}

export type OperationalIntentType =
  | 'what_needs_attention_today'
  | 'prepare_for_weekend_sales'
  | 'reduce_low_stock_risk'
  | 'improve_catalog_quality'
  | 'clear_fulfillment_backlog';

export type OperationalIntentSource = 'intent_card' | 'natural_language' | 'scheduled_policy' | 'api';

export type OperationalPriority = 'low' | 'medium' | 'high' | 'urgent';

export type OperationalTarget =
  | 'catalog'
  | 'inventory'
  | 'orders'
  | 'fulfillment'
  | 'procurement'
  | 'discounts'
  | 'storefront'
  | 'support'
  | 'settings'
  | 'audit';

export type ConstraintOperator = '<' | '<=' | '=' | '>=' | '>';

export interface OperationalConstraint {
  type:
    | 'margin_floor'
    | 'max_discount'
    | 'avoid_stockouts'
    | 'fulfillment_delay_rate'
    | 'inventory_coverage_days'
    | 'human_approval_required';
  operator?: ConstraintOperator;
  value: string | number | boolean;
  description: string;
}

export interface OperationalActor {
  userId: string;
  email: string;
}

export interface DesiredOperationalState {
  intentType: OperationalIntentType;
  goal: string;
  horizon: 'today' | 'weekend' | 'week' | 'month';
  priority: OperationalPriority;
  constraints: OperationalConstraint[];
  targets: OperationalTarget[];
}

export interface OperationalIntentIR {
  id: string;
  source: OperationalIntentSource;
  desiredState: DesiredOperationalState;
  actor: OperationalActor;
  createdAt: Date;
}

export interface OperationalStateSnapshot {
  capturedAt: Date;
  dashboard: Pick<
    AdminDashboardSummary,
    | 'productCount'
    | 'lowStockCount'
    | 'outOfStockCount'
    | 'totalRevenue'
    | 'averageOrderValue'
    | 'orderCountsByStatus'
    | 'fulfillmentCounts'
    | 'activeTasks'
    | 'attentionItems'
    | 'dailyRevenue'
  >;
  productManagement: Pick<
    ProductManagementOverview,
    | 'totalProducts'
    | 'setupIssueCounts'
    | 'marginHealthCounts'
    | 'lowStockCount'
    | 'outOfStockCount'
    | 'averageMarginPercent'
    | 'productsNeedingAttention'
  >;
  inventory: Pick<InventoryOverview, 'totalProducts' | 'totalUnits' | 'inventoryValue' | 'healthCounts' | 'products'>;
  purchaseOrders: OpsPurchaseOrderSnapshot;
  setupProgress: OpsSetupProgress;
}

export interface OperationalDiagnosis {
  summary: string;
  observations: Array<{
    id: string;
    target: OperationalTarget;
    severity: 'info' | 'low' | 'medium' | 'high' | 'critical';
    message: string;
    evidence: string;
  }>;
}

export type OperationRiskLevel = 'low' | 'medium' | 'high' | 'critical';

export type ProposedOperationStatus = 'proposed' | 'approved' | 'executed' | 'rejected' | 'failed';

export interface ProposedOperation {
  id: string;
  tool:
    | 'product.batch_update_inventory'
    | 'product.update_listing_quality'
    | 'purchase_order.draft'
    | 'discount.draft'
    | 'order.add_internal_note'
    | 'order.prioritize_fulfillment'
    | 'storefront.draft_featured_collection'
    | 'settings.review_setup';
  target: OperationalTarget;
  title: string;
  description: string;
  diff: string;
  input: Record<string, unknown>;
  riskLevel: OperationRiskLevel;
  requiresApproval: boolean;
  reversible: boolean;
  beforeSummary?: string;
  afterSummary?: string;
  status: ProposedOperationStatus;
  error?: string;
}

export interface PolicyRisk {
  id: string;
  operationId?: string;
  target: OperationalTarget;
  severity: OperationRiskLevel;
  effect: 'allow' | 'require_approval' | 'require_step_up_auth' | 'deny' | 'require_simulation';
  reason: string;
}

export interface ApprovalRequirement {
  id: string;
  operationId: string;
  level: 'standard' | 'step_up';
  reason: string;
  status: 'required' | 'approved' | 'rejected';
}

export interface SimulationResult {
  id: string;
  label: string;
  summary: string;
  confidence: 'low' | 'medium' | 'high';
  impact: 'positive' | 'neutral' | 'negative' | 'mixed';
  metrics: Array<{
    label: string;
    value: string | number;
    unit?: string;
    direction?: 'up' | 'down' | 'flat';
  }>;
}

export interface RollbackStep {
  id: string;
  operationId?: string;
  description: string;
  available: boolean;
}

export type OperationalPlanStatus =
  | 'draft'
  | 'awaiting_approval'
  | 'approved'
  | 'executing'
  | 'executed'
  | 'rejected'
  | 'failed';

export interface OperationalPlan {
  id: string;
  intent: OperationalIntentIR;
  stateSnapshot: OperationalStateSnapshot;
  diagnosis: OperationalDiagnosis;
  proposedOperations: ProposedOperation[];
  risks: PolicyRisk[];
  simulations: SimulationResult[];
  approvalsRequired: ApprovalRequirement[];
  rollbackPlan: RollbackStep[];
  status: OperationalPlanStatus;
  generatedAt: Date;
}

export interface OperationalIntentCard {
  type: OperationalIntentType;
  title: string;
  description: string;
  category: 'revenue' | 'risk' | 'catalog' | 'fulfillment' | 'overview';
  defaultPriority: OperationalPriority;
  targets: OperationalTarget[];
}
