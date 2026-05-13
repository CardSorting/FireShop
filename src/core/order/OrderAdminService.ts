import * as crypto from 'node:crypto';
import type { IDiscountRepository, IOrderRepository, IProductRepository } from '@domain/repositories';
import type { Address, Order, OrderNote, OrderStatus } from '@domain/models';
import { OrderNotFoundError, ProductNotFoundError } from '@domain/errors';
import { assertValidOrderStatusTransition, calculateTax, coalesceStockUpdates } from '@domain/rules';
import { doc, getUnifiedDb, runTransaction, serverTimestamp } from '@infrastructure/firebase/bridge';
import { AuditService } from '../AuditService';
import { DiscountService } from '../DiscountService';
import { logger } from '@utils/logger';
import type { OrderActor } from './types';

export class OrderAdminService {
  constructor(
    private orderRepo: IOrderRepository,
    private productRepo: IProductRepository,
    private discountRepo: IDiscountRepository,
    private audit: AuditService
  ) {}

  async resolveReconciliation(
    id: string,
    resolutionAction: OrderStatus,
    reason: string,
    evidence: string,
    actor: OrderActor
  ): Promise<void> {
    const order = await this.orderRepo.getById(id);
    if (!order) throw new OrderNotFoundError(id);
    if (!order.reconciliationRequired) throw new Error('Order is not in a reconciliation state.');
    if (!reason?.trim()) throw new Error('A resolution reason is required.');
    if (!evidence?.trim()) throw new Error('Supporting evidence is required.');

    await runTransaction(getUnifiedDb(), async (transaction: any) => {
      await this.orderRepo.clearReconciliationFlag(id, transaction);
      await this.orderRepo.updateStatus(id, resolutionAction, transaction);
      await this.orderRepo.updateMetadata(id, {
        ...order.metadata,
        reconciliationResolvedAt: new Date().toISOString(),
        reconciliationResolvedBy: actor.id
      }, transaction);
    });

    const resolutionNote = `RECONCILIATION RESOLVED: Action=${resolutionAction}, Reason=${reason}, Evidence=${evidence}, By=${actor.email}`;
    await this.orderRepo.markForReconciliation(id, [resolutionNote], true);

    await this.audit.record({
      userId: actor.id,
      userEmail: actor.email,
      action: 'order_status_changed',
      targetId: id,
      details: { resolution: true, action: resolutionAction, reason, evidence }
    });
  }

  async updateOrderStatus(id: string, status: OrderStatus, actor: OrderActor): Promise<void> {
    const order = await this.orderRepo.getById(id);
    if (!order) throw new OrderNotFoundError(id);
    if (order.reconciliationRequired) {
      throw new Error('Order requires manual reconciliation and is locked for mutations.');
    }

    assertValidOrderStatusTransition(order.status, status);
    if (status === 'cancelled') {
      await this.releaseInventoryReservation(order);
    }

    await this.orderRepo.updateStatus(id, status);

    if ((status === 'cancelled' || status === 'refunded') && order.discountCode) {
      const discount = await this.discountRepo.getByCode(order.discountCode);
      if (discount) {
        await runTransaction(getUnifiedDb(), async (transaction: any) => {
          await this.discountRepo.decrementUsage(discount.id, transaction);
          if (order.userId) {
            await this.orderRepo.removeUserDiscountUsage(order.userId, order.discountCode!, transaction);
          }
        }).catch(error => {
          logger.error('Failed to rollback discount usage during order cancellation', { orderId: id, error });
        });
      }
    }

    await this.audit.record({
      userId: actor.id,
      userEmail: actor.email,
      action: 'order_status_changed',
      targetId: id,
      details: { from: order.status, to: status }
    });
  }

  async batchUpdateOrderStatus(ids: string[], status: OrderStatus, actor: OrderActor): Promise<void> {
    const validIds: string[] = [];
    for (const id of ids) {
      const order = await this.orderRepo.getById(id);
      if (!order) {
        logger.warn(`[batchUpdateOrderStatus] Order ${id} not found, skipping.`);
        continue;
      }
      assertValidOrderStatusTransition(order.status, status);
      validIds.push(id);
    }

    if (validIds.length === 0) return;

    if (this.orderRepo.batchUpdateStatus) {
      await this.orderRepo.batchUpdateStatus(validIds, status);
    } else {
      for (const id of validIds) {
        await this.orderRepo.updateStatus(id, status);
      }
    }

    await this.audit.record({
      userId: actor.id,
      userEmail: actor.email,
      action: 'order_status_changed',
      targetId: 'batch',
      details: { ids: validIds, to: status }
    });
  }

  async cleanupExpiredOrders(expirationMinutes = 60): Promise<{ count: number }> {
    const cutoff = new Date();
    cutoff.setMinutes(cutoff.getMinutes() - expirationMinutes);
    const { orders } = await this.orderRepo.getAll({ status: 'pending', to: cutoff });
    logger.info(`[OrderService] Cleaning up ${orders.length} expired pending orders (cutoff: ${expirationMinutes}m)`);

    for (const order of orders) {
      await this.updateOrderStatus(order.id, 'cancelled', {
        id: 'system',
        email: 'system@dreambees.art'
      });
      await this.audit.record({
        userId: 'system',
        userEmail: 'system@dreambees.art',
        action: 'order_status_changed',
        targetId: order.id,
        details: { from: 'pending', to: 'cancelled', reason: 'expired', expirationMinutes }
      });
    }

    return { count: orders.length };
  }

  async applyDiscountToOrder(orderId: string, code: string, actor: OrderActor): Promise<void> {
    const order = await this.orderRepo.getById(orderId);
    if (!order) throw new OrderNotFoundError(orderId);
    if (order.discountCode) throw new Error('Order already has a discount applied.');
    if (order.status !== 'confirmed' && order.status !== 'processing' && order.status !== 'pending') {
      throw new Error(`Cannot apply discount to order in status: ${order.status}`);
    }

    const discountService = new DiscountService(this.discountRepo, this.audit, this.orderRepo);
    const validation = await discountService.validateDiscount(code, order.total + (order.discountAmount || 0), order.userId);
    if (!validation.valid || !validation.discount) {
      throw new Error(`Invalid discount: ${validation.message}`);
    }

    const discountAmount = validation.discountAmount || 0;
    const newTotal = Math.max(0, order.total - discountAmount);

    await runTransaction(getUnifiedDb(), async (transaction: any) => {
      await this.orderRepo.updateMetadata(orderId, {
        ...(order.metadata || {}),
        manualDiscountAppliedAt: new Date().toISOString(),
        manualDiscountAppliedBy: actor.email,
        originalTotal: order.total
      }, transaction);

      await transaction.update(doc(getUnifiedDb(), 'orders', orderId), {
        discountCode: code,
        discountAmount: (order.discountAmount || 0) + discountAmount,
        total: newTotal,
        updatedAt: serverTimestamp()
      });

      await this.discountRepo.incrementUsage(validation.discount!.id, transaction);
    });

    await this.audit.record({
      userId: actor.id,
      userEmail: actor.email,
      action: 'order_status_changed',
      targetId: orderId,
      details: { action: 'manual_discount', code, amount: discountAmount }
    });
  }

  async updateShippingAddress(orderId: string, address: Address, actor: OrderActor): Promise<void> {
    const order = await this.orderRepo.getById(orderId);
    if (!order) throw new OrderNotFoundError(orderId);
    if (order.status === 'shipped' || order.status === 'delivered') {
      throw new Error('Cannot update address for an order that has already shipped.');
    }

    await runTransaction(getUnifiedDb(), async (transaction: any) => {
      await transaction.update(doc(getUnifiedDb(), 'orders', orderId), {
        shippingAddress: address,
        updatedAt: serverTimestamp()
      });

      if (this.orderRepo.addNote) {
        await this.orderRepo.addNote(orderId, {
          id: crypto.randomUUID(),
          authorId: actor.id,
          authorEmail: actor.email,
          text: `Shipping address updated by support to: ${address.street}, ${address.city}, ${address.state} ${address.zip}, ${address.country}`,
          createdAt: new Date()
        }, transaction);
      }
    });

    await this.audit.record({
      userId: actor.id,
      userEmail: actor.email,
      action: 'order_status_changed',
      targetId: orderId,
      details: { action: 'address_update', newAddress: address }
    });
  }

  async swapOrderItem(orderId: string, oldProductId: string, newProductId: string, actor: OrderActor): Promise<void> {
    const changed = await runTransaction(getUnifiedDb(), async (transaction: any) => {
      const order = await (this.orderRepo.getById as any)(orderId, transaction) as Order | null;
      if (!order) throw new OrderNotFoundError(orderId);

      const oldItem = order.items.find(item => item.productId === oldProductId);
      const alreadySwapped = order.items.find(item => item.productId === newProductId);
      if (!oldItem && alreadySwapped) return false;
      if (!oldItem) throw new Error('Item not found in order');

      const newProduct = await this.productRepo.getById(newProductId, transaction);
      if (!newProduct) throw new ProductNotFoundError(newProductId);
      if (!newProduct.isDigital && newProduct.stock < oldItem.quantity) {
        throw new Error('New product does not have sufficient stock.');
      }

      const stockUpdates = [];
      if (!oldItem.isDigital) {
        stockUpdates.push({ id: oldProductId, variantId: oldItem.variantId, delta: oldItem.quantity });
      }
      if (!newProduct.isDigital) {
        stockUpdates.push({ id: newProductId, delta: -oldItem.quantity });
      }
      if (stockUpdates.length > 0) {
        await this.productRepo.batchUpdateStock(stockUpdates, transaction);
      }

      const newItems = order.items.map(item => {
        if (item.productId !== oldProductId) return item;
        return {
          ...item,
          productId: newProductId,
          variantId: undefined,
          variantTitle: undefined,
          name: newProduct.name,
          imageUrl: newProduct.imageUrl,
          unitPrice: newProduct.price,
          productHandle: newProduct.handle,
          isDigital: newProduct.isDigital,
          digitalAssets: newProduct.isDigital ? newProduct.digitalAssets : undefined,
          shippingClassId: newProduct.shippingClassId,
        };
      });

      const subtotal = newItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
      const hasPhysicalItems = newItems.some(item => !item.isDigital);
      const newShippingAmount = hasPhysicalItems ? order.shippingAmount : 0;
      const newTaxAmount = calculateTax({
        subtotal,
        shipping: newShippingAmount,
        discount: order.discountAmount || 0,
        address: order.shippingAddress
      });
      const newTotal = subtotal + newShippingAmount + newTaxAmount - (order.discountAmount || 0);

      await transaction.update(doc(getUnifiedDb(), 'orders', orderId), {
        items: newItems,
        shippingAmount: newShippingAmount,
        taxAmount: newTaxAmount,
        total: Math.max(0, newTotal),
        updatedAt: serverTimestamp()
      });

      if (this.orderRepo.addNote) {
        await this.orderRepo.addNote(orderId, {
          id: crypto.randomUUID(),
          authorId: actor.id,
          authorEmail: actor.email,
          text: `Swapped item: ${oldItem.name} -> ${newProduct.name}`,
          createdAt: new Date()
        }, transaction);
      }

      return true;
    });

    if (!changed) return;

    await this.audit.record({
      userId: actor.id,
      userEmail: actor.email,
      action: 'order_status_changed',
      targetId: orderId,
      details: { action: 'item_swap', old: oldProductId, new: newProductId }
    });
  }

  async upgradeShipping(orderId: string, carrier: string, service: string, actor: OrderActor): Promise<void> {
    const order = await this.orderRepo.getById(orderId);
    if (!order) throw new OrderNotFoundError(orderId);
    if (order.status !== 'confirmed' && order.status !== 'processing' && order.status !== 'pending') {
      throw new Error('Order is already shipped or delivered.');
    }

    await this.orderRepo.updateFulfillment(orderId, { shippingCarrier: carrier });
    await this.orderRepo.updateMetadata(orderId, {
      ...(order.metadata || {}),
      shippingServiceUpgrade: service,
      upgradedBy: actor.email,
      upgradedAt: new Date().toISOString()
    });

    if (this.orderRepo.addNote) {
      await this.orderRepo.addNote(orderId, {
        id: crypto.randomUUID(),
        authorId: actor.id,
        authorEmail: actor.email,
        text: `Shipping upgraded to ${carrier} ${service} (Cost waived)`,
        createdAt: new Date()
      });
    }

    await this.audit.record({
      userId: actor.id,
      userEmail: actor.email,
      action: 'order_status_changed',
      targetId: orderId,
      details: { action: 'shipping_upgrade', carrier, service }
    });
  }

  async setOrderHold(orderId: string, reason: string, actor: OrderActor): Promise<void> {
    const order = await this.orderRepo.getById(orderId);
    if (!order) throw new OrderNotFoundError(orderId);
    if (order.status !== 'confirmed' && order.status !== 'processing' && order.status !== 'pending') {
      throw new Error('Only unfulfilled orders can be placed on hold.');
    }

    await this.orderRepo.updateMetadata(orderId, {
      ...(order.metadata || {}),
      onHold: true,
      holdReason: reason,
      heldBy: actor.email,
      heldAt: new Date().toISOString()
    });

    if (this.orderRepo.addNote) {
      await this.orderRepo.addNote(orderId, {
        id: crypto.randomUUID(),
        authorId: actor.id,
        authorEmail: actor.email,
        text: `Order placed on HOLD: ${reason}`,
        createdAt: new Date()
      });
    }

    await this.audit.record({
      userId: actor.id,
      userEmail: actor.email,
      action: 'order_status_changed',
      targetId: orderId,
      details: { action: 'hold', reason }
    });
  }

  async releaseOrderHold(orderId: string, actor: OrderActor): Promise<void> {
    const order = await this.orderRepo.getById(orderId);
    if (!order) throw new OrderNotFoundError(orderId);

    const metadata = { ...(order.metadata || {}) };
    delete metadata.onHold;
    delete metadata.holdReason;
    delete metadata.heldBy;
    delete metadata.heldAt;

    await this.orderRepo.updateMetadata(orderId, metadata);

    if (this.orderRepo.addNote) {
      await this.orderRepo.addNote(orderId, {
        id: crypto.randomUUID(),
        authorId: actor.id,
        authorEmail: actor.email,
        text: 'Order hold RELEASED. Fulfillment can resume.',
        createdAt: new Date()
      });
    }

    await this.audit.record({
      userId: actor.id,
      userEmail: actor.email,
      action: 'order_status_changed',
      targetId: orderId,
      details: { action: 'release_hold' }
    });
  }

  async addOrderNote(id: string, text: string, actor: OrderActor): Promise<OrderNote> {
    const order = await this.orderRepo.getById(id);
    if (!order) throw new OrderNotFoundError(id);

    const note: OrderNote = {
      id: crypto.randomUUID(),
      authorId: actor.id,
      authorEmail: actor.email,
      text,
      createdAt: new Date()
    };

    if (this.orderRepo.addNote) {
      await this.orderRepo.addNote(id, note);
    } else {
      await this.orderRepo.updateNotes(id, [...order.notes, note]);
    }

    return note;
  }

  async updateOrderFulfillment(
    id: string,
    data: { trackingNumber?: string; shippingCarrier?: string },
    actor: OrderActor
  ): Promise<void> {
    const order = await this.orderRepo.getById(id);
    if (!order) throw new OrderNotFoundError(id);

    await this.orderRepo.updateFulfillment(id, data);
    await this.audit.record({
      userId: actor.id,
      userEmail: actor.email,
      action: 'order_status_changed',
      targetId: id,
      details: { fulfillmentUpdate: data, previousStatus: order.status }
    });
  }

  private async releaseInventoryReservation(order: Order): Promise<void> {
    if (!order.metadata?.inventoryReserved || order.metadata.inventoryReservationReleased) return;

    const stockUpdates = coalesceStockUpdates(order.items
      .filter(item => !item.isDigital)
      .map(item => ({
        id: item.productId,
        variantId: item.variantId,
        delta: item.quantity
      })));

    if (stockUpdates.length > 0) {
      await this.productRepo.batchUpdateStock(stockUpdates);
    }

    await this.orderRepo.updateMetadata(order.id, {
      ...(order.metadata || {}),
      inventoryReservationReleased: true,
      inventoryReservationReleasedAt: new Date().toISOString(),
    });
  }
}
