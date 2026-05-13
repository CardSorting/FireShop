import * as crypto from 'node:crypto';
import type {
  ICartRepository,
  ICheckoutGateway,
  IDiscountRepository,
  ILockProvider,
  IOrderRepository,
  IPaymentProcessor,
  IProductRepository,
  IShippingRepository,
} from '@domain/repositories';
import type {
  Address,
  CarrierManifest,
  LogisticsPerformance,
  Order,
  OrderFulfillmentEventType,
  OrderNote,
  OrderStatus,
  ShippingLabel,
} from '@domain/models';
import { AuditService } from './AuditService';
import { OrderAdminService } from './order/OrderAdminService';
import { OrderCheckoutService } from './order/OrderCheckoutService';
import { OrderFulfillmentWorkflowService } from './order/OrderFulfillmentWorkflowService';
import { OrderLogisticsService } from './order/OrderLogisticsService';
import { OrderReadService } from './order/OrderReadService';
import type { FulfillmentMethod, OrderActor } from './order/types';

/**
 * [LAYER: CORE]
 *
 * Compatibility facade for order operations. The implementation is split by
 * concern under `src/core/order/` so checkout, logistics, fulfillment, reads,
 * and admin mutations can evolve independently.
 */
export class OrderService {
  private readonly checkoutService: OrderCheckoutService;
  private readonly logisticsService: OrderLogisticsService;
  private readonly fulfillmentWorkflowService: OrderFulfillmentWorkflowService;
  private readonly readService: OrderReadService;
  private readonly adminService: OrderAdminService;

  constructor(
    orderRepo: IOrderRepository,
    productRepo: IProductRepository,
    cartRepo: ICartRepository,
    discountRepo: IDiscountRepository,
    payment: IPaymentProcessor,
    audit: AuditService,
    locker: ILockProvider,
    private checkoutGateway?: ICheckoutGateway,
    shippingRepo?: IShippingRepository
  ) {
    this.checkoutService = new OrderCheckoutService(
      orderRepo,
      productRepo,
      cartRepo,
      discountRepo,
      payment,
      audit,
      locker,
      shippingRepo
    );
    this.logisticsService = new OrderLogisticsService(orderRepo, productRepo);
    this.fulfillmentWorkflowService = new OrderFulfillmentWorkflowService(orderRepo);
    this.readService = new OrderReadService(orderRepo);
    this.adminService = new OrderAdminService(orderRepo, productRepo, discountRepo, audit);
  }

  autoAssignShippingMethod(orderId: string): Promise<{ carrier: string; service: string }> {
    return this.logisticsService.autoAssignShippingMethod(orderId);
  }

  // RETIRED: Labels cannot be created directly in the backend. 
  // Use exportOrdersToPirateShipCsv instead.
  /*
  prepareBatchLabels(orderIds: string[]): Promise<ShippingLabel[]> {
    return this.logisticsService.prepareBatchLabels(orderIds);
  }
  */

  exportOrdersToPirateShipCsv(
    orderIds: string[],
    packageDimensions?: { length: string; width: string; height: string },
    tareWeightLbs?: number
  ): Promise<string> {
    return this.logisticsService.exportOrdersToPirateShipCsv(orderIds, packageDimensions, tareWeightLbs);
  }

  createCarrierManifest(carrier: string, orderIds: string[]): Promise<CarrierManifest> {
    return this.logisticsService.createCarrierManifest(carrier, orderIds);
  }

  getLogisticsPerformanceReport(): Promise<LogisticsPerformance> {
    return this.logisticsService.getLogisticsPerformanceReport();
  }

  initiateCheckout(
    userId: string,
    shippingAddress: Address,
    userEmail?: string,
    userName?: string,
    discountCode?: string,
    idempotencyKey?: string,
    paymentMethodId?: string,
    fulfillmentMethod: FulfillmentMethod = 'shipping'
  ): Promise<Order> {
    return this.checkoutService.initiateCheckout(
      userId,
      shippingAddress,
      userEmail,
      userName,
      discountCode,
      idempotencyKey,
      paymentMethodId,
      fulfillmentMethod
    );
  }

  finalizeOrderPayment(paymentIntentId: string, stripePi?: any): Promise<Order> {
    return this.checkoutService.finalizeOrderPayment(paymentIntentId, stripePi);
  }

  finalizeTrustedCheckout(
    userId: string,
    shippingAddress: Address,
    paymentMethodId: string,
    idempotencyKey?: string,
    discountCode?: string
  ): Promise<Order> {
    if (this.checkoutGateway) {
      return this.checkoutGateway.finalizeCheckout({
        userId,
        shippingAddress,
        paymentMethodId,
        idempotencyKey: idempotencyKey || crypto.randomUUID(),
        discountCode
      });
    }

    return this.placeOrder(userId, shippingAddress, paymentMethodId, idempotencyKey, discountCode);
  }

  advanceFulfillment(orderId: string, trackingNumber?: string, actor?: OrderActor): Promise<void> {
    return this.fulfillmentWorkflowService.advanceFulfillment(orderId, trackingNumber, actor);
  }

  recordFulfillmentEvent(
    orderId: string,
    type: OrderFulfillmentEventType,
    label: string,
    description: string
  ): Promise<void> {
    return this.fulfillmentWorkflowService.recordFulfillmentEvent(orderId, type, label, description);
  }

  resolveReconciliation(
    id: string,
    resolutionAction: OrderStatus,
    reason: string,
    evidence: string,
    actor: OrderActor
  ): Promise<void> {
    return this.adminService.resolveReconciliation(id, resolutionAction, reason, evidence, actor);
  }

  updateOrderStatus(
    id: string,
    status: OrderStatus,
    actor: OrderActor = { id: 'system', email: 'system@dreambees.art' }
  ): Promise<void> {
    return this.adminService.updateOrderStatus(id, status, actor);
  }

  placeOrder(
    userId: string,
    shippingAddress: Address,
    paymentMethodId: string,
    idempotencyKey?: string,
    discountCode?: string,
    userEmail?: string,
    userName?: string
  ): Promise<Order> {
    return this.initiateCheckout(userId, shippingAddress, userEmail, userName, discountCode, idempotencyKey, paymentMethodId);
  }

  getAllOrders(options?: any): Promise<{ orders: Order[]; nextCursor?: string }> {
    return this.readService.getAllOrders(options);
  }

  getOrdersForCustomerView(userId: string, options?: any): Promise<{ orders: Order[]; nextCursor?: string }> {
    return this.readService.getOrdersForCustomerView(userId, options);
  }

  batchUpdateOrderStatus(ids: string[], status: OrderStatus, actor: OrderActor): Promise<void> {
    return this.adminService.batchUpdateOrderStatus(ids, status, actor);
  }

  cleanupExpiredOrders(expirationMinutes = 60): Promise<{ count: number }> {
    return this.adminService.cleanupExpiredOrders(expirationMinutes);
  }

  getDigitalAssets(userId: string) {
    return this.readService.getDigitalAssets(userId);
  }

  getOrder(id: string, requestingUserId?: string): Promise<Order | null> {
    return this.readService.getOrder(id, requestingUserId);
  }

  applyDiscountToOrder(orderId: string, code: string, actor: OrderActor): Promise<void> {
    return this.adminService.applyDiscountToOrder(orderId, code, actor);
  }

  updateShippingAddress(orderId: string, address: Address, actor: OrderActor): Promise<void> {
    return this.adminService.updateShippingAddress(orderId, address, actor);
  }

  swapOrderItem(orderId: string, oldProductId: string, newProductId: string, actor: OrderActor): Promise<void> {
    return this.adminService.swapOrderItem(orderId, oldProductId, newProductId, actor);
  }

  upgradeShipping(orderId: string, carrier: string, service: string, actor: OrderActor): Promise<void> {
    return this.adminService.upgradeShipping(orderId, carrier, service, actor);
  }

  setOrderHold(orderId: string, reason: string, actor: OrderActor): Promise<void> {
    return this.adminService.setOrderHold(orderId, reason, actor);
  }

  releaseOrderHold(orderId: string, actor: OrderActor): Promise<void> {
    return this.adminService.releaseOrderHold(orderId, actor);
  }

  addOrderNote(id: string, text: string, actor: OrderActor): Promise<OrderNote> {
    return this.adminService.addOrderNote(id, text, actor);
  }

  updateOrderFulfillment(
    id: string,
    data: { trackingNumber?: string; shippingCarrier?: string },
    actor: OrderActor
  ): Promise<void> {
    return this.adminService.updateOrderFulfillment(id, data, actor);
  }

  getOrders(userId: string, options?: any): Promise<{ orders: Order[]; nextCursor?: string }> {
    return this.readService.getOrders(userId, options);
  }

  getAdminOrder(orderId: string): Promise<Order | null> {
    return this.readService.getAdminOrder(orderId);
  }
}
