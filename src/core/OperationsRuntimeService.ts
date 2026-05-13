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