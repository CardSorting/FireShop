/**
 * [LAYER: CORE]
 * Purchase Order & Receiving Orchestration Service
 */
import type {
  PurchaseOrder,
  PurchaseOrderItem,
  PurchaseOrderStatus,
  ReceivingSession,
  ReceivedItem,
  InventoryLevel,
  ReceivingDiscrepancyReason,
  ReceivingLineDisposition,
  PurchaseOrderReceivingSummary,
  PurchaseOrderWorkflowStep,
  PurchaseOrderLineReceivingSummary,
  PurchaseOrderSavedView,
} from '@domain/models';
import type {
  IPurchaseOrderRepository,
  IProductRepository,
  IInventoryLevelRepository,
  IInventoryLocationRepository,
} from '@domain/repositories';
import {
  PurchaseOrderNotFoundError,
  InvalidPurchaseOrderError,
  CannotCancelPurchaseOrderError,
  CannotReceivePurchaseOrderError,
  ProductNotFoundError,
} from '@domain/errors';
import { purchaseOrderRules } from '@domain/rules';
import { AuditService } from './AuditService';
import { runTransaction, getUnifiedDb, doc } from '@infrastructure/firebase/bridge';
import { logger } from '@utils/logger';

export interface CreatePurchaseOrderInput {
  supplier: string;
  referenceNumber?: string;
  shippingCarrier?: string;
  trackingNumber?: string;
  expectedAt?: Date | string;
  items: Array<{
    productId: string;
    orderedQty: number;
    unitCost: number;
    notes?: string;
  }>;
  notes?: string;
  adminUserId: string;
  adminUserEmail: string;
}

export interface ReceiveItemsInput {
  purchaseOrderId: string;
  receivedBy: string;
  idempotencyKey?: string;
  items: Array<{
    purchaseOrderItemId: string;
    receivedQty: number;
    damagedQty?: number;
    condition: 'new' | 'damaged' | 'defective';
    discrepancyReason?: ReceivingDiscrepancyReason;
    disposition?: ReceivingLineDisposition;
    notes?: string;
  }>;
  notes?: string;
  locationId?: string;
}

export interface ClosePurchaseOrderInput {
  id: string;
  discrepancyReason?: ReceivingDiscrepancyReason;
  notes?: string;
}

export interface GuidedPurchaseOrder {
  order: PurchaseOrder;
  summary: PurchaseOrderReceivingSummary;
  workflow: PurchaseOrderWorkflowStep[];
  lineSummaries: PurchaseOrderLineReceivingSummary[];
  receivingSessions: ReceivingSession[];
}

export interface PurchaseOrderWorkspaceOrder {
  order: PurchaseOrder;
  summary: PurchaseOrderReceivingSummary;
  workflow: PurchaseOrderWorkflowStep[];
  lineSummaries: PurchaseOrderLineReceivingSummary[];
  attentionRequired: boolean;
}

export interface PurchaseOrderWorkspace {
  countsByView: Record<PurchaseOrderSavedView, number>;
  metrics: {
    incomingUnits: number;
    openShipments: number;
    exceptionCount: number;
    overdueCount: number;
    receivingValue: number;
  };
  orders: PurchaseOrderWorkspaceOrder[];
  recentReceivingSessions: ReceivingSession[];
}

export class PurchaseOrderService {
  constructor(
    private purchaseOrderRepo: IPurchaseOrderRepository,
    private productRepo: IProductRepository,
    private inventoryLevelRepo: IInventoryLevelRepository,
    private auditService: AuditService
  ) {}


  // ─────────────────────────────────────────────
  // Purchase Order CRUD
  // ─────────────────────────────────────────────

  async createPurchaseOrder(input: CreatePurchaseOrderInput): Promise<PurchaseOrder> {
    if (!input.supplier.trim()) {
      throw new InvalidPurchaseOrderError('Supplier name is required');
    }
    if (input.items.length === 0) {
      throw new InvalidPurchaseOrderError('At least one item is required');
    }

    const items: PurchaseOrderItem[] = [];
    for (const inputItem of input.items) {
      if (inputItem.orderedQty <= 0) {
        throw new InvalidPurchaseOrderError(`Ordered quantity must be positive for ${inputItem.productId}`);
      }
      if (inputItem.unitCost < 0) {
        throw new InvalidPurchaseOrderError(`Unit cost cannot be negative for ${inputItem.productId}`);
      }

      const product = await this.productRepo.getById(inputItem.productId);
      if (!product) throw new ProductNotFoundError(inputItem.productId);

      items.push({
        id: crypto.randomUUID(),
        productId: inputItem.productId,
        sku: product.sku || inputItem.productId,
        productName: product.name,
        orderedQty: inputItem.orderedQty,
        receivedQty: 0,
        unitCost: inputItem.unitCost,
        totalCost: inputItem.orderedQty * inputItem.unitCost,
        notes: inputItem.notes,
      });
    }

    const order: PurchaseOrder = {
      id: '', // Will be set by repository
      supplier: input.supplier,
      referenceNumber: input.referenceNumber,
      shippingCarrier: input.shippingCarrier,
      trackingNumber: input.trackingNumber,
      expectedAt: input.expectedAt ? new Date(input.expectedAt) : undefined,
      status: 'draft',
      items,
      notes: input.notes,
      totalCost: purchaseOrderRules.calculateTotalCost(items),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const saved = await this.purchaseOrderRepo.save(order);

    await this.auditService.record({
      userId: input.adminUserId,
      userEmail: input.adminUserEmail,
      action: 'purchase_order.created',
      targetId: saved.id,
      details: { supplier: saved.supplier, itemCount: saved.items.length }
    });

    return saved;
  }


  async getPurchaseOrder(id: string): Promise<PurchaseOrder> {
    const order = await this.purchaseOrderRepo.findById(id);
    if (!order) throw new PurchaseOrderNotFoundError(id);
    return order;
  }

  async getGuidedPurchaseOrder(id: string): Promise<GuidedPurchaseOrder> {
    const order = await this.getPurchaseOrder(id);
    const receivingSessions = this.purchaseOrderRepo.findReceivingSessions
      ? await this.purchaseOrderRepo.findReceivingSessions(id)
      : [];
    const baseSummary = purchaseOrderRules.calculateReceivingSummary(order);
    const damagedQty = receivingSessions.reduce(
      (sum, session) => sum + session.receivedItems.reduce((lineSum, item) => lineSum + (item.damagedQty ?? 0), 0),
      0
    );
    const discrepancyCount = receivingSessions.reduce(
      (sum, session) => sum + session.receivedItems.filter((item) => item.discrepancyReason).length,
      0
    );
    const stockableQty = receivingSessions.reduce(
      (sum, session) => sum + session.receivedItems.reduce((lineSum, item) => {
        if ((item.disposition ?? 'add_to_stock') !== 'add_to_stock') return lineSum;
        return lineSum + Math.max(0, item.receivedQty - (item.damagedQty ?? 0));
      }, 0),
      0
    );

    return {
      order,
      summary: {
        ...baseSummary,
        damagedQty,
        discrepancyCount,
        stockableQty,
      },
      workflow: purchaseOrderRules.buildWorkflowSteps(order),
      lineSummaries: purchaseOrderRules.calculateLineReceivingSummaries(order),
      receivingSessions,
    };
  }

  async getPurchaseOrderWorkspace(): Promise<PurchaseOrderWorkspace> {
    const orders = await this.purchaseOrderRepo.findAll({ limit: 100 });
    const views: PurchaseOrderSavedView[] = ['all', 'drafts', 'incoming', 'partially_received', 'ready_to_close', 'exceptions', 'closed'];
    const countsByView = views.reduce((acc, view) => {
      acc[view] = orders.filter((order) => purchaseOrderRules.matchesSavedView(order, view)).length;
      return acc;
    }, {} as Record<PurchaseOrderSavedView, number>);

    const workspaceOrders = orders.map((order) => {
      const lineSummaries = purchaseOrderRules.calculateLineReceivingSummaries(order);
      return {
        order,
        summary: purchaseOrderRules.calculateReceivingSummary(order),
        workflow: purchaseOrderRules.buildWorkflowSteps(order),
        lineSummaries,
        attentionRequired: lineSummaries.some((line) => line.attentionRequired),
      };
    });

    const metrics = workspaceOrders.reduce((acc, workspaceOrder) => {
      const { order, summary, attentionRequired } = workspaceOrder;
      if (purchaseOrderRules.canReceive(order)) {
        acc.openShipments += 1;
        acc.incomingUnits += summary.openQty;
        acc.receivingValue += order.items.reduce((sum, item) => sum + Math.max(0, item.orderedQty - item.receivedQty) * item.unitCost, 0);
      }
      if (attentionRequired) acc.exceptionCount += 1;
      if (summary.dueState === 'overdue') acc.overdueCount += 1;
      return acc;
    }, {
      incomingUnits: 0,
      openShipments: 0,
      exceptionCount: 0,
      overdueCount: 0,
      receivingValue: 0,
    });

    const recentReceivingSessions: ReceivingSession[] = [];
    if (this.purchaseOrderRepo.findReceivingSessions) {
      for (const order of orders.slice(0, 20)) {
        recentReceivingSessions.push(...await this.purchaseOrderRepo.findReceivingSessions(order.id));
      }
      recentReceivingSessions.sort((a, b) => b.receivedAt.getTime() - a.receivedAt.getTime());
    }

    return {
      countsByView,
      metrics,
      orders: workspaceOrders,
      recentReceivingSessions: recentReceivingSessions.slice(0, 10),
    };
  }

  async listPurchaseOrders(options?: {
    status?: PurchaseOrderStatus;
    supplier?: string;
    limit?: number;
    offset?: number;
  }): Promise<PurchaseOrder[]> {
    return await this.purchaseOrderRepo.findAll(options);
  }

  async countPurchaseOrders(status?: PurchaseOrderStatus): Promise<number> {
    return await this.purchaseOrderRepo.count({ status });
  }

  // ─────────────────────────────────────────────
  // Workflow Actions
  // ─────────────────────────────────────────────

  async submitOrder(id: string, adminUserId: string, adminUserEmail: string): Promise<PurchaseOrder> {
    const order = await this.getPurchaseOrder(id);
    if (!purchaseOrderRules.canSubmit(order)) {
      throw new InvalidPurchaseOrderError('Cannot submit order in current status or with no items');
    }
    const updated = await this.purchaseOrderRepo.updateStatus(id, 'ordered');

    await this.auditService.record({
      userId: adminUserId,
      userEmail: adminUserEmail,
      action: 'purchase_order.submitted',
      targetId: id,
      details: { status: 'ordered' }
    });

    return updated;
  }


  async cancelOrder(id: string, adminUserId: string, adminUserEmail: string): Promise<PurchaseOrder> {
    const order = await this.getPurchaseOrder(id);
    if (!purchaseOrderRules.canCancel(order)) {
      throw new CannotCancelPurchaseOrderError(order.status);
    }
    const updated = await this.purchaseOrderRepo.updateStatus(id, 'cancelled');

    await this.auditService.record({
      userId: adminUserId,
      userEmail: adminUserEmail,
      action: 'purchase_order.cancelled',
      targetId: id,
      details: { status: 'cancelled' }
    });

    return updated;
  }


  async closeOrder(input: ClosePurchaseOrderInput, adminUserId: string, adminUserEmail: string): Promise<PurchaseOrder> {
    const order = await this.getPurchaseOrder(input.id);
    if (!purchaseOrderRules.canClose(order)) {
      throw new InvalidPurchaseOrderError('Only received or partially received purchase orders can be closed');
    }
    const summary = purchaseOrderRules.calculateReceivingSummary(order);
    if (summary.openQty > 0 && !purchaseOrderRules.isValidDiscrepancyReason(input.discrepancyReason)) {
      throw new InvalidPurchaseOrderError('Choose a reason before closing with missing items');
    }

    const notes = [order.notes, input.notes]
      .filter((value): value is string => Boolean(value?.trim()))
      .join('\n');

    const saved = await this.purchaseOrderRepo.save({
      ...order,
      status: 'closed',
      notes: notes || order.notes,
      updatedAt: new Date(),
    });

    await this.auditService.record({
      userId: adminUserId,
      userEmail: adminUserEmail,
      action: 'purchase_order.closed',
      targetId: input.id,
      details: { discrepancyReason: input.discrepancyReason, notes: input.notes }
    });

    return saved;
  }


  // ─────────────────────────────────────────────
  // Receiving Workflow
  // ─────────────────────────────────────────────

  async receiveItems(input: ReceiveItemsInput, actor: { id: string, email: string }): Promise<{
    purchaseOrder: PurchaseOrder;
    session: ReceivingSession;
    inventoryUpdates: InventoryLevel[];
  }> {
    if (input.idempotencyKey && this.purchaseOrderRepo.findReceivingSessionByIdempotencyKey) {
      const existingSession = await this.purchaseOrderRepo.findReceivingSessionByIdempotencyKey(
        input.purchaseOrderId,
        input.idempotencyKey
      );
      if (existingSession) {
        return {
          purchaseOrder: await this.getPurchaseOrder(input.purchaseOrderId),
          session: existingSession,
          inventoryUpdates: [],
        };
      }
    }

    const order = await this.getPurchaseOrder(input.purchaseOrderId);
    if (!purchaseOrderRules.canReceive(order)) {
      throw new CannotReceivePurchaseOrderError(order.status);
    }

    // Map purchase order items by ID for quick lookup
    const poItemsById = new Map(order.items.map((i) => [i.id, i]));

    const receivedItems: ReceivedItem[] = [];
    const poItemUpdates: Map<string, PurchaseOrderItem> = new Map();

    for (const inputItem of input.items) {
      const poItem = poItemsById.get(inputItem.purchaseOrderItemId);
      if (!poItem) {
        throw new InvalidPurchaseOrderError(`Invalid purchase order item: ${inputItem.purchaseOrderItemId}`);
      }

      const currentReceived = poItem.receivedQty;
      const currentSessionReceived = poItemUpdates.get(inputItem.purchaseOrderItemId)?.receivedQty ?? currentReceived;
      const openQty = Math.max(0, poItem.orderedQty - currentSessionReceived);
      const damagedQty = inputItem.damagedQty ?? (inputItem.condition === 'new' ? 0 : inputItem.receivedQty);
      const disposition = inputItem.disposition ?? (inputItem.condition === 'new' ? 'add_to_stock' : 'quarantine');

      if (!purchaseOrderRules.validateReceiveQty(poItem.orderedQty, currentSessionReceived, inputItem.receivedQty)) {
        throw new InvalidPurchaseOrderError(
          `Cannot receive ${inputItem.receivedQty} of ${poItem.productName} (already received ${currentSessionReceived}, ordered ${poItem.orderedQty})`
        );
      }
      if (damagedQty < 0 || damagedQty > inputItem.receivedQty) {
        throw new InvalidPurchaseOrderError('Damaged quantity must be between zero and the quantity received');
      }
      if ((damagedQty > 0 || inputItem.condition !== 'new') && !purchaseOrderRules.isValidDiscrepancyReason(inputItem.discrepancyReason)) {
        throw new InvalidPurchaseOrderError(`Choose a discrepancy reason for ${poItem.productName}`);
      }

      receivedItems.push({
        id: crypto.randomUUID(),
        purchaseOrderItemId: inputItem.purchaseOrderItemId,
        productId: poItem.productId,
        sku: poItem.sku,
        expectedQty: openQty,
        receivedQty: inputItem.receivedQty,
        damagedQty,
        unitCost: poItem.unitCost,
        condition: inputItem.condition,
        discrepancyReason: inputItem.discrepancyReason,
        disposition,
        notes: inputItem.notes,
      });

      // Track new totals
      const newReceivedQty = currentSessionReceived + inputItem.receivedQty;
      poItemUpdates.set(inputItem.purchaseOrderItemId, {
        ...poItem,
        receivedQty: newReceivedQty,
      });
    }

    // Build updated items array preserving order
    const updatedItems = order.items.map((item) => {
      const updated = poItemUpdates.get(item.id);
      return updated ?? item;
    });

    // Determine new status
    const newStatus = purchaseOrderRules.calculateReceivedStatus(updatedItems);

    try {
      return await runTransaction(getUnifiedDb(), async (transaction: any) => {
        // 1. Update Product Costs (Atomic)
        for (const receivedItem of receivedItems) {
          if (receivedItem.condition === 'new' && receivedItem.receivedQty > 0) {
            const docRef = doc(getUnifiedDb(), 'products', receivedItem.productId);
            const docSnap = await transaction.get(docRef);
            if (docSnap.exists()) {
              const product = docSnap.data();
              if (product && (product.cost === undefined || product.cost === 0)) {
                await this.productRepo.update(receivedItem.productId, { cost: receivedItem.unitCost }, transaction);
              }
            }
          }
        }

        // 2. Update Inventory Levels (Atomic)
        const inventoryUpdates: InventoryLevel[] = [];
        const locationId = input.locationId || 'default';

        for (const receivedItem of receivedItems) {
          const stockableQty = (receivedItem.disposition ?? 'add_to_stock') === 'add_to_stock'
            ? Math.max(0, receivedItem.receivedQty - (receivedItem.damagedQty ?? 0))
            : 0;
          if (stockableQty > 0) {
            const level = await this.inventoryLevelRepo.adjustQuantity(
              receivedItem.productId,
              locationId,
              stockableQty,
              `Received from PO ${input.purchaseOrderId}`,
              transaction
            );
            inventoryUpdates.push(level);
          }
        }

        // 3. Update Purchase Order Status & Items (Atomic)
        const updatedOrder: PurchaseOrder = {
          ...order,
          items: updatedItems,
          status: newStatus,
          totalCost: purchaseOrderRules.calculateTotalCost(updatedItems),
          updatedAt: new Date(),
        };

        const savedOrder = await this.purchaseOrderRepo.save(updatedOrder, transaction);

        // 4. Create Receiving Session Record (Atomic)
        const session: ReceivingSession = {
          id: crypto.randomUUID(),
          purchaseOrderId: input.purchaseOrderId,
          status: 'completed',
          receivedItems,
          notes: input.notes,
          idempotencyKey: input.idempotencyKey,
          locationId: input.locationId,
          receivedAt: new Date(),
          completedAt: new Date(),
          receivedBy: input.receivedBy,
        };

        const savedSession = this.purchaseOrderRepo.saveReceivingSession
          ? await this.purchaseOrderRepo.saveReceivingSession(session, transaction)
          : session;

        // 5. Record Audit (Transactional)
        await this.auditService.recordWithTransaction(transaction, {
          userId: actor.id,
          userEmail: actor.email,
          action: 'purchase_order.items_received',
          targetId: input.purchaseOrderId,
          details: { 
            sessionId: session.id,
            itemCount: input.items.length,
            totalQty: input.items.reduce((s, i) => s + i.receivedQty, 0)
          }
        });

        return {
          purchaseOrder: savedOrder,
          session: savedSession,
          inventoryUpdates,
        };
      });
    } catch (err) {
      logger.error('Failed to receive items for purchase order', { id: input.purchaseOrderId, err });
      throw err;
    }
  }


  // ─────────────────────────────────────────────
  // Overview Dashboard
  // ─────────────────────────────────────────────

  async getPurchaseOrderOverview(): Promise<{
    totalOrders: number;
    draftCount: number;
    orderedCount: number;
    partiallyReceivedCount: number;
    receivedCount: number;
    closedCount: number;
    cancelledCount: number;
    needsReceivingCount: number;
    recentOrders: PurchaseOrder[];
  }> {
    const totalOrders = await this.purchaseOrderRepo.count();
    const draftCount = await this.purchaseOrderRepo.count({ status: 'draft' });
    const orderedCount = await this.purchaseOrderRepo.count({ status: 'ordered' });
    const partiallyReceivedCount = await this.purchaseOrderRepo.count({ status: 'partially_received' });
    const receivedCount = await this.purchaseOrderRepo.count({ status: 'received' });
    const closedCount = await this.purchaseOrderRepo.count({ status: 'closed' });
    const cancelledCount = await this.purchaseOrderRepo.count({ status: 'cancelled' });
    const recentOrders = await this.purchaseOrderRepo.findAll({ limit: 10 });

    return {
      totalOrders,
      draftCount,
      orderedCount,
      partiallyReceivedCount,
      receivedCount,
      closedCount,
      cancelledCount,
      needsReceivingCount: orderedCount + partiallyReceivedCount,
      recentOrders,
    };
  }
}