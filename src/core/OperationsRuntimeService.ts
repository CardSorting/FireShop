/**
 * [LAYER: CORE]
 * Business operations compiler runtime.
 */
import type { OperationalActor, OperationalIntentType, OperationalPlan, OperationalStateSnapshot } from '@domain/ops/types';
import { buildDefaultDesiredState, OPERATIONAL_INTENT_CARDS } from '@domain/ops/intents';
import type { ProductService } from './ProductService';
import type { OrderQueryService } from './OrderQueryService';
import type { PurchaseOrderService } from './PurchaseOrderService';
import type { SettingsService } from './SettingsService';
import { AuditService } from './AuditService';
import { OperationalPlannerService } from './OperationalPlannerService';

export class OperationsRuntimeService {
  constructor(
    private orderQueryService: OrderQueryService,
    private productService: ProductService,
    private purchaseOrderService: PurchaseOrderService,
    private settingsService: SettingsService,
    private auditService: AuditService,
    private planner: OperationalPlannerService = new OperationalPlannerService(auditService)
  ) {}

  getIntentCards() {
    return OPERATIONAL_INTENT_CARDS;
  }

  async compilePlan(intentType: OperationalIntentType, actor: OperationalActor): Promise<OperationalPlan> {
    const intent = {
      id: crypto.randomUUID(),
      source: 'intent_card' as const,
      desiredState: buildDefaultDesiredState(intentType),
      actor,
      createdAt: new Date(),
    };

    const snapshot = await this.captureState();
    const plan = this.planner.compile(intent, snapshot);

    await this.auditService.record({
      userId: actor.userId,
      userEmail: actor.email,
      action: 'ops_plan_generated',
      targetId: plan.id,
      details: {
        intentType,
        status: plan.status,
        operationCount: plan.proposedOperations.length,
        approvalCount: plan.approvalsRequired.length,
      },
    });

    return plan;
  }

  /**
   * EXECUTION ENGINE: Performs the real business logic for a plan's operations.
   */
  async executePlan(plan: OperationalPlan, actor: OperationalActor): Promise<OperationalPlan> {
    const executedOperations = [...plan.proposedOperations];
    
    for (let i = 0; i < executedOperations.length; i++) {
      const op = executedOperations[i];
      if (op.status !== 'proposed' && op.status !== 'approved') continue;
      if (op.requiresApproval && op.status !== 'approved') continue;

      try {
        await this.executeTool(op.tool, op.input, actor);
        executedOperations[i] = { ...op, status: 'executed' };
      } catch (error: any) {
        executedOperations[i] = { ...op, status: 'failed', error: error.message };
      }
    }

    const updatedPlan = {
      ...plan,
      proposedOperations: executedOperations,
      status: executedOperations.every(op => op.status === 'executed' || op.status === 'failed') ? 'completed' : 'partially_executed' as any,
      executedAt: new Date(),
    };

    await this.auditService.record({
      userId: actor.userId,
      userEmail: actor.email,
      action: 'ops_plan_executed',
      targetId: plan.id,
      details: {
        status: updatedPlan.status,
        totalOperations: executedOperations.length,
        executedCount: executedOperations.filter(o => o.status === 'executed').length,
      }
    });

    return updatedPlan;
  }

  private async executeTool(toolId: string, input: any, actor: OperationalActor) {
    switch (toolId) {
      case 'purchase_order.draft':
        return this.purchaseOrderService.createDraft({
          supplier: 'Pending Selection',
          referenceNumber: `OPS-${Date.now().toString().slice(-6)}`,
          items: input.products.map((p: any) => ({
            productId: p.productId,
            sku: 'PENDING',
            productName: p.name,
            orderedQty: p.suggestedQty,
            receivedQty: 0,
            unitCost: 0,
            totalCost: 0
          }))
        });

      case 'discount.draft':
        return this.settingsService.createDiscountDraft({
          code: `WEEKEND-${Date.now().toString().slice(-4)}`,
          type: 'percentage',
          value: input.percentOff,
          status: 'scheduled',
          isAutomatic: false,
          selectionType: 'specific_products',
          selectedProductIds: [], // Would be filtered based on logic in real app
          selectedCollectionIds: [],
          minimumRequirementType: 'none',
          minimumAmount: null,
          minimumQuantity: null,
          eligibilityType: 'everyone',
          eligibleCustomerIds: [],
          eligibleCustomerSegments: [],
          usageLimit: null,
          oncePerCustomer: true,
          combinesWith: { orderDiscounts: false, productDiscounts: false, shippingDiscounts: false },
          startsAt: new Date(),
          endsAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
        });

      case 'product.update_listing_quality':
        // This tool performs a bulk 'touch' to re-verify metadata and health
        const productIds = input.products.map((p: any) => p.id);
        return this.productService.batchReverify(productIds);

      case 'order.prioritize_fulfillment':
        // Moves orders from 'pending' to 'processing' or adds a high-priority tag
        return this.orderQueryService.prioritizeFulfillmentQueue();

      case 'storefront.draft_featured_collection':
        // In v1 this just adds a task for the merchant to review the homepage
        return this.auditService.record({
          userId: actor.userId,
          userEmail: actor.email,
          action: 'merchandising_review_triggered',
          targetId: 'homepage',
          details: { reason: 'Stock-aware merchandising update suggested', suggestedExclusions: input.excludeProductIds }
        });

      default:
        throw new Error(`Tool ${toolId} not implemented in runtime.`);
    }
  }

  private async captureState(): Promise<OperationalStateSnapshot> {
    const [dashboard, productManagement, inventory, purchaseOrders, setupProgress] = await Promise.all([
      this.orderQueryService.getAdminDashboardSummary(),
      this.productService.getProductManagementOverview(),
      this.productService.getInventoryOverview(),
      this.purchaseOrderService.getPurchaseOrderWorkspace(),
      this.settingsService.getSetupProgress(),
    ]);

    return {
      capturedAt: new Date(),
      dashboard: {
        productCount: dashboard.productCount,
        lowStockCount: dashboard.lowStockCount,
        outOfStockCount: dashboard.outOfStockCount,
        totalRevenue: dashboard.totalRevenue,
        averageOrderValue: dashboard.averageOrderValue,
        orderCountsByStatus: dashboard.orderCountsByStatus,
        fulfillmentCounts: dashboard.fulfillmentCounts,
        activeTasks: dashboard.activeTasks,
        attentionItems: dashboard.attentionItems,
        dailyRevenue: dashboard.dailyRevenue,
      },
      productManagement: {
        totalProducts: productManagement.totalProducts,
        setupIssueCounts: productManagement.setupIssueCounts,
        marginHealthCounts: productManagement.marginHealthCounts,
        lowStockCount: productManagement.lowStockCount,
        outOfStockCount: productManagement.outOfStockCount,
        averageMarginPercent: productManagement.averageMarginPercent,
        productsNeedingAttention: productManagement.productsNeedingAttention,
      },
      inventory: {
        totalProducts: inventory.totalProducts,
        totalUnits: inventory.totalUnits,
        inventoryValue: inventory.inventoryValue,
        healthCounts: inventory.healthCounts,
        products: inventory.products,
      },
      purchaseOrders: {
        countsByView: purchaseOrders.countsByView,
        metrics: purchaseOrders.metrics,
      },
      setupProgress,
    };
  }
}