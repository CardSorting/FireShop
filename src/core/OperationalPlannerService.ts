/**
 * [LAYER: CORE]
 * Deterministic compiler from OperationalIntentIR + observed store state into a business-PR plan.
 */
import type {
  OperationalDiagnosis,
  OperationalIntentIR,
  OperationalPlan,
  OperationalStateSnapshot,
  ProposedOperation,
  RollbackStep,
} from '@domain/ops/types';
import { PolicyEngineService } from './PolicyEngineService';
import { SimulationService } from './SimulationService';

export class OperationalPlannerService {
  constructor(
    private policyEngine: PolicyEngineService = new PolicyEngineService(),
    private simulationService: SimulationService = new SimulationService()
  ) {}

  compile(intent: OperationalIntentIR, snapshot: OperationalStateSnapshot): OperationalPlan {
    const initialOperations = this.buildOperations(intent, snapshot);
    const governed = this.policyEngine.evaluateOperations(initialOperations);
    const simulations = this.simulationService.simulate(intent, snapshot, governed.operations);
    const rollbackPlan = this.buildRollback(governed.operations);
    const status = governed.approvals.length > 0 ? 'awaiting_approval' : 'draft';

    return {
      id: crypto.randomUUID(),
      intent,
      stateSnapshot: snapshot,
      diagnosis: this.diagnose(intent, snapshot),
      proposedOperations: governed.operations,
      risks: governed.risks,
      simulations,
      approvalsRequired: governed.approvals,
      rollbackPlan,
      status,
      generatedAt: new Date(),
    };
  }

  private diagnose(intent: OperationalIntentIR, snapshot: OperationalStateSnapshot): OperationalDiagnosis {
    const lowStock = snapshot.dashboard.lowStockCount;
    const outOfStock = snapshot.dashboard.outOfStockCount;
    const activeFulfillment = (snapshot.dashboard.fulfillmentCounts.to_review ?? 0) + (snapshot.dashboard.fulfillmentCounts.ready_to_ship ?? 0);
    const setupRemaining = Math.max(0, snapshot.setupProgress.totalCount - snapshot.setupProgress.completedCount);
    const attentionCount = snapshot.dashboard.attentionItems.length + snapshot.productManagement.productsNeedingAttention.length;

    const observations: OperationalDiagnosis['observations'] = [];
    if (lowStock > 0 || outOfStock > 0) {
      observations.push({
        id: 'inventory-drift',
        target: 'inventory',
        severity: outOfStock > 0 ? 'high' : 'medium',
        message: 'Inventory drift may constrain demand-generation plans.',
        evidence: `${lowStock} low-stock products and ${outOfStock} out-of-stock products detected.`,
      });
    }
    if (activeFulfillment > 0) {
      observations.push({
        id: 'fulfillment-pressure',
        target: 'fulfillment',
        severity: activeFulfillment > 10 ? 'high' : 'medium',
        message: 'Fulfillment queue should be cleared before increasing demand.',
        evidence: `${activeFulfillment} orders/tasks are currently to review or ready to ship.`,
      });
    }
    if (attentionCount > 0) {
      observations.push({
        id: 'catalog-attention',
        target: 'catalog',
        severity: attentionCount > 10 ? 'medium' : 'low',
        message: 'Catalog readiness issues reduce conversion and operational clarity.',
        evidence: `${attentionCount} dashboard/catalog attention signals are present.`,
      });
    }
    if (setupRemaining > 0) {
      observations.push({
        id: 'setup-drift',
        target: 'settings',
        severity: 'low',
        message: 'Store setup has remaining configuration drift.',
        evidence: `${snapshot.setupProgress.completedCount}/${snapshot.setupProgress.totalCount} setup items are complete.`,
      });
    }

    if (observations.length === 0) {
      observations.push({
        id: 'healthy-baseline',
        target: 'audit',
        severity: 'info',
        message: 'No urgent operational drift detected in the sampled state.',
        evidence: `Intent ${intent.desiredState.intentType} compiled against a healthy baseline.`,
      });
    }

    return {
      summary: `Here is the recommended action plan for: ${intent.desiredState.goal}`,
      observations,
    };
  }

  private buildOperations(intent: OperationalIntentIR, snapshot: OperationalStateSnapshot): ProposedOperation[] {
    const operations: ProposedOperation[] = [];
    const topLowStockProducts = snapshot.inventory.products
      .filter((product) => product.inventoryHealth !== 'healthy')
      .slice(0, 6);
    const catalogAttention = snapshot.productManagement.productsNeedingAttention.slice(0, 6);
    const activeFulfillment = (snapshot.dashboard.fulfillmentCounts.to_review ?? 0) + (snapshot.dashboard.fulfillmentCounts.ready_to_ship ?? 0);

    if (topLowStockProducts.length > 0 && ['prepare_for_weekend_sales', 'reduce_low_stock_risk', 'what_needs_attention_today'].includes(intent.desiredState.intentType)) {
      operations.push({
        id: 'draft-replenishment-po',
        tool: 'purchase_order.draft',
        target: 'procurement',
        title: 'Restock at-risk products',
        description: `Review ${topLowStockProducts.length} low-stock products and prepare a reorder draft if the quantities look right.`,
        diff: `+ Reorder candidates: ${topLowStockProducts.map((product) => product.name).join(', ')}`,
        input: {
          products: topLowStockProducts.map((product) => ({
            productId: product.id,
            name: product.name,
            currentStock: product.stock,
            suggestedQty: Math.max(product.reorderQuantity ?? 5, (product.reorderPoint ?? 5) * 2),
          })),
        },
        riskLevel: 'medium',
        requiresApproval: true,
        reversible: true,
        beforeSummary: `${topLowStockProducts.length} products are low or out of stock.`,
        afterSummary: 'You have a clear reorder list to review before contacting a supplier.',
        status: 'proposed',
      });
    }

    if (intent.desiredState.intentType === 'prepare_for_weekend_sales') {
      operations.push({
        id: 'draft-weekend-discount',
        tool: 'discount.draft',
        target: 'discounts',
        title: 'Promote only safe-to-sell products',
        description: 'Use a small weekend discount only on products with enough stock and known margin.',
        diff: '+ Suggest 10% weekend promo for healthy-stock products\n- Exclude low-stock and unknown-cost products',
        input: { percentOff: 10, excludeProductIds: topLowStockProducts.map((product) => product.id), requiresMarginKnown: true },
        riskLevel: 'medium',
        requiresApproval: true,
        reversible: true,
        beforeSummary: 'No governed weekend promotion exists in this plan.',
        afterSummary: 'You can run a safer promotion without accidentally pushing products that may sell out.',
        status: 'proposed',
      });

      operations.push({
        id: 'draft-featured-products',
        tool: 'storefront.draft_featured_collection',
        target: 'storefront',
        title: 'Feature products with enough inventory',
        description: 'Update the featured set toward products that can handle extra demand.',
        diff: '+ Feature healthy-stock products\n- Avoid featuring low-stock or sold-out products',
        input: { excludeProductIds: topLowStockProducts.map((product) => product.id), maxItems: 4 },
        riskLevel: 'medium',
        requiresApproval: true,
        reversible: true,
        beforeSummary: 'Homepage merchandising may not reflect current operational constraints.',
        afterSummary: 'Homepage attention is pointed toward products the store can actually fulfill.',
        status: 'proposed',
      });
    }

    if (catalogAttention.length > 0 && ['improve_catalog_quality', 'prepare_for_weekend_sales', 'what_needs_attention_today'].includes(intent.desiredState.intentType)) {
      operations.push({
        id: 'catalog-quality-pass',
        tool: 'product.update_listing_quality',
        target: 'catalog',
        title: 'Fix listing issues that block conversion',
        description: `Review ${catalogAttention.length} products with missing setup data before sending more traffic to them.`,
        diff: `+ Review SKU/cost/photo/status issues for ${catalogAttention.length} products`,
        input: {
          products: catalogAttention.map((product) => ({ id: product.id, name: product.name, issues: product.setupIssues })),
        },
        riskLevel: 'low',
        requiresApproval: false,
        reversible: true,
        beforeSummary: `${catalogAttention.length} sampled products need listing attention.`,
        afterSummary: 'You have a focused listing cleanup queue instead of hunting through product tables.',
        status: 'proposed',
      });
    }

    if (activeFulfillment > 0 && ['clear_fulfillment_backlog', 'prepare_for_weekend_sales', 'what_needs_attention_today'].includes(intent.desiredState.intentType)) {
      operations.push({
        id: 'prioritize-fulfillment',
        tool: 'order.prioritize_fulfillment',
        target: 'fulfillment',
        title: 'Clear active fulfillment work first',
        description: 'Handle orders in review or ready-to-ship before increasing demand.',
        diff: `+ Clear ${activeFulfillment} active fulfillment tasks before promotion`,
        input: { toReview: snapshot.dashboard.fulfillmentCounts.to_review ?? 0, readyToShip: snapshot.dashboard.fulfillmentCounts.ready_to_ship ?? 0 },
        riskLevel: 'low',
        requiresApproval: false,
        reversible: false,
        beforeSummary: `${activeFulfillment} tasks are in active fulfillment buckets.`,
        afterSummary: 'Weekend sales are less likely to create preventable delays.',
        status: 'proposed',
      });
    }

    if (snapshot.setupProgress.completedCount < snapshot.setupProgress.totalCount && intent.desiredState.intentType === 'what_needs_attention_today') {
      operations.push({
        id: 'review-setup-drift',
        tool: 'settings.review_setup',
        target: 'settings',
        title: 'Finish store setup tasks',
        description: 'Review incomplete payment, shipping, domain, product, or store-name setup tasks.',
        diff: `+ Review ${snapshot.setupProgress.totalCount - snapshot.setupProgress.completedCount} remaining setup tasks`,
        input: { setupProgress: snapshot.setupProgress },
        riskLevel: 'low',
        requiresApproval: false,
        reversible: false,
        beforeSummary: 'Setup progress is not complete.',
        afterSummary: 'The remaining setup work is visible in one place.',
        status: 'proposed',
      });
    }

    if (operations.length === 0) {
      operations.push({
        id: 'record-healthy-baseline',
        tool: 'settings.review_setup',
        target: 'audit',
        title: 'No urgent action needed',
        description: 'No immediate store-changing action is recommended from the current sample.',
        diff: '+ Keep monitoring; no urgent store change suggested',
        input: { intentType: intent.desiredState.intentType },
        riskLevel: 'low',
        requiresApproval: false,
        reversible: false,
        beforeSummary: 'Store state was sampled for drift.',
        afterSummary: 'Plan records that no urgent reconciliation is needed.',
        status: 'proposed',
      });
    }

    return operations;
  }

  private buildRollback(operations: ProposedOperation[]): RollbackStep[] {
    return operations.map((operation) => ({
      id: `rollback:${operation.id}`,
      operationId: operation.id,
      description: operation.reversible
        ? `Keep ${operation.title.toLowerCase()} as a draft until approved; discard draft to roll back.`
        : `${operation.title} is informational or ordering-only and does not mutate business state in v1.`,
      available: operation.reversible,
    }));
  }
}