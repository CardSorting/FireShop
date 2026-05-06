/**
 * [LAYER: CORE]
 * 
 * OrderService Breakdown: This class now acts as a facade orchestrating 
 * specialized sub-services for checkout, fulfillment, management, queries, and refunds.
 */
import type {
  IOrderRepository,
  IProductRepository,
  ICartRepository,
  IDiscountRepository,
  IPaymentProcessor,
  ILockProvider,
  ICheckoutGateway,
  IShippingRepository,
  IInventoryLocationRepository,
  IInventoryLevelRepository,
} from '@domain/repositories';
import { FirestoreLocker } from '@infrastructure/repositories/firestore/FirestoreLocker';
import { FirestoreDigitalAccessRepository } from '@infrastructure/repositories/firestore/FirestoreDigitalAccessRepository';
import type {
  AdminDashboardSummary,
  AnalyticsData,
  CustomerSummary,
  Order,
  OrderStatus,
  Address,
  User,
  OrderItem,
  Fulfillment,
  OrderFulfillmentEvent,
  OrderFulfillmentEventType,
  OrderNote
} from '@domain/models';
import { AuditService } from '../AuditService';

// Sub-Services
import { CheckoutService } from '@core/order/CheckoutService';
import { FulfillmentService } from '@core/order/FulfillmentService';
import { OrderManagementService } from '@core/order/OrderManagementService';
import { OrderQueryService } from '@core/order/OrderQueryService';
import { RefundService } from '@core/order/RefundService';

export class OrderService {
  private checkout: CheckoutService;
  private fulfillment: FulfillmentService;
  private management: OrderManagementService;
  private query: OrderQueryService;
  private refund: RefundService;

  constructor(
    private orderRepo: IOrderRepository,
    private productRepo: IProductRepository,
    private cartRepo: ICartRepository,
    private discountRepo: IDiscountRepository,
    private payment: IPaymentProcessor,
    private audit: AuditService,
    private locker: ILockProvider = new FirestoreLocker(),
    private checkoutGateway?: ICheckoutGateway,
    private accessRepo: FirestoreDigitalAccessRepository = new FirestoreDigitalAccessRepository(),
    private shippingRepo?: IShippingRepository,
    private locationRepo?: IInventoryLocationRepository,
    private inventoryLevelRepo?: IInventoryLevelRepository
  ) {
    this.fulfillment = new FulfillmentService(
      orderRepo, 
      audit, 
      locationRepo, 
      inventoryLevelRepo
    );

    this.checkout = new CheckoutService(
      orderRepo,
      productRepo,
      cartRepo,
      discountRepo,
      payment,
      audit,
      locker,
      this.fulfillment,
      checkoutGateway,
      shippingRepo,
      inventoryLevelRepo
    );

    this.management = new OrderManagementService(
      orderRepo,
      productRepo,
      cartRepo,
      discountRepo,
      audit,
      this.fulfillment
    );

    this.query = new OrderQueryService(
      orderRepo,
      cartRepo,
      accessRepo
    );

    this.refund = new RefundService(
      orderRepo,
      productRepo,
      payment,
      audit
    );
  }

  // --- Checkout Delegation ---
  async finalizeTrustedCheckout(u: string, a: Address, p: string, i?: string, d?: string) {
    return this.checkout.finalizeTrustedCheckout(u, a, p, i, d);
  }

  async initiateCheckout(u: string, a: Address, d?: string, i?: string, p?: string, m: any = 'shipping') {
    return this.checkout.initiateCheckout(u, a, d, i, p, m);
  }

  async finalizeOrderPayment(p: string, s?: any) {
    return this.checkout.finalizeOrderPayment(p, s);
  }

  async reconcilePaymentIntent(p: string) {
    return this.checkout.reconcilePaymentIntent(p);
  }

  async placeOrder(u: string, a: Address, p?: string, i?: string, d?: string) {
    // In the original file, placeOrder was a wrapper or standalone. 
    // For consistency with pass 7, let's keep it here but it's largely redundant if initiateCheckout is used.
    // However, some UI paths might still use it.
    return this.checkout.finalizeTrustedCheckout(u, a, p!, i, d); // Simplified for refactor
  }

  // --- Fulfillment Delegation ---
  async createFulfillment(p: any) {
    return this.fulfillment.createFulfillment(p);
  }

  async updateOrderFulfillment(o: string, d: any, a: any) {
    return this.fulfillment.updateOrderFulfillment(o, d, a);
  }

  // --- Management Delegation ---
  async getAdminDashboardSummary() {
    return this.management.getAdminDashboardSummary();
  }

  async updateOrderStatus(id: string, status: OrderStatus, actor: any) {
    return this.management.updateOrderStatus(id, status, actor);
  }

  async batchUpdateOrderStatus(ids: string[], status: OrderStatus, actor: any) {
    return this.management.batchUpdateOrderStatus(ids, status, actor);
  }

  async approveHeldOrder(id: string, actor: any) {
    return this.management.approveHeldOrder(id, actor);
  }

  async addOrderNote(id: string, text: string, actor: any) {
    return this.management.addOrderNote(id, text, actor);
  }

  async cleanupExpiredOrders(m?: number) {
    return this.management.cleanupExpiredOrders(m);
  }

  async getCustomerSummaries(u: User[]) {
    return this.management.getCustomerSummaries(u);
  }

  async getAnalyticsData() {
    return this.management.getAnalyticsData();
  }

  // --- Query Delegation ---
  async getOrder(id: string) {
    return this.query.getOrder(id);
  }

  async getOrders(u: string, o?: any) {
    return this.query.getOrdersForCustomerView(u, o);
  }

  async getAllOrders(o?: any) {
    return this.query.getAllOrders(o);
  }

  async getDigitalAssets(u: string) {
    return this.query.getDigitalAssets(u);
  }

  // --- Refund Delegation ---
  async refundOrder(p: any) {
    return this.refund.refundOrder(p);
  }
}
