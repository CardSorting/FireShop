/**
 * [LAYER: CORE]
 * 
 * Service Container with STRICT Lazy Initialization
 */

import { FirestoreProductRepository } from '@infrastructure/repositories/firestore/FirestoreProductRepository';
import { FirestoreCartRepository } from '@infrastructure/repositories/firestore/FirestoreCartRepository';
import { FirestoreOrderRepository } from '@infrastructure/repositories/firestore/FirestoreOrderRepository';
import { FirestoreDiscountRepository } from '@infrastructure/repositories/firestore/FirestoreDiscountRepository';
import { FirebaseAuthAdapter } from '@infrastructure/services/FirebaseAuthAdapter';
import { StripePaymentProcessor } from '@infrastructure/services/StripePaymentProcessor';
import { StripeService } from '@infrastructure/services/StripeService';
import { TrustedCheckoutGateway } from '@infrastructure/services/TrustedCheckoutGateway';
import { BrevoEmailService } from '@infrastructure/services/BrevoEmailService';
import { FirestoreSettingsRepository } from '@infrastructure/repositories/firestore/FirestoreSettingsRepository';
import { FirestoreTransferRepository } from '@infrastructure/repositories/firestore/FirestoreTransferRepository';
import { FirestorePurchaseOrderRepository } from '@infrastructure/repositories/firestore/FirestorePurchaseOrderRepository';
import { FirestoreInventoryLocationRepository } from '@infrastructure/repositories/firestore/FirestoreInventoryLocationRepository';
import { FirestoreInventoryLevelRepository } from '@infrastructure/repositories/firestore/FirestoreInventoryLevelRepository';
import { FirestoreSupplierRepository } from '@infrastructure/repositories/firestore/FirestoreSupplierRepository';
import { FirestoreCollectionRepository } from '@infrastructure/repositories/firestore/FirestoreCollectionRepository';
import { FirestoreTaxonomyRepository } from '@infrastructure/repositories/firestore/FirestoreTaxonomyRepository';
import { FirestoreWishlistRepository } from '@infrastructure/repositories/firestore/FirestoreWishlistRepository';
import { FirestoreTicketRepository } from '@infrastructure/repositories/firestore/FirestoreTicketRepository';
import { FirestoreKnowledgebaseRepository } from '@infrastructure/repositories/firestore/FirestoreKnowledgebaseRepository';
import { FirestoreShippingRepository } from '@infrastructure/repositories/firestore/FirestoreShippingRepository';
import { FirestoreLocker } from '@infrastructure/repositories/firestore/FirestoreLocker';
import { ProductService } from './ProductService';
import { CartService } from './CartService';
import { OrderService } from './OrderService';
import { ShippingService } from './ShippingService';
import { AuthService } from './AuthService';
import { DiscountService } from './DiscountService';
import { SettingsService } from './SettingsService';
import { TransferService } from './TransferService';
import { PurchaseOrderService } from './PurchaseOrderService';
import { SupplierService } from './SupplierService';
import { CollectionService } from './CollectionService';
import { TaxonomyService } from './TaxonomyService';
import { WishlistService } from './WishlistService';
import { AuditService } from './AuditService';
import { FulfillmentService } from './FulfillmentService';
import { OrderManagementService } from './OrderManagementService';
import { OrderQueryService } from './OrderQueryService';
import { RefundService } from './RefundService';
import { RateLimitService } from './RateLimitService';
import { assertMultiStoreNotEnabled, SINGLE_STORE_ID } from './TenantContext';
import type {
  IProductRepository,
  ICartRepository,
  IOrderRepository,
  IDiscountRepository,
  ISettingsRepository,
  ITransferRepository,
  IPurchaseOrderRepository,
  ISupplierRepository,
  ICollectionRepository,
  IInventoryLocationRepository,
  IInventoryLevelRepository,
  ITaxonomyRepository,
  IWishlistRepository,
  ITicketRepository,
  IKnowledgebaseRepository,
  IAuthProvider,
  IPaymentProcessor,
  ILockProvider,
  ICheckoutGateway,
  IShippingRepository,
  IEmailService,
} from '@domain/repositories';

// Singleton caches for production (Pattern 2 - getInitialServices)
let authServiceInstance: AuthService | null = null;
let authProviderInstance: IAuthProvider | null = null;

// Repository singletons - cached globally (shared across all services)
let productRepoInstance: IProductRepository | null = null;
let cartRepoInstance: ICartRepository | null = null;
let orderRepoInstance: IOrderRepository | null = null;
let discountRepoInstance: IDiscountRepository | null = null;
let paymentProcessorInstance: IPaymentProcessor | null = null;
let lockProviderInstance: ILockProvider | null = null;
let checkoutGatewayInstance: ICheckoutGateway | null = null;
let settingsRepoInstance: ISettingsRepository | null = null;
let shippingRepoInstance: IShippingRepository | null = null;
let transferRepoInstance: ITransferRepository | null = null;
let transferServiceInstance: TransferService | null = null;
let auditServiceInstance: AuditService | null = null;
let purchaseOrderRepoInstance: IPurchaseOrderRepository | null = null;
let inventoryLocationRepoInstance: IInventoryLocationRepository | null = null;
let inventoryLevelRepoInstance: IInventoryLevelRepository | null = null;
let purchaseOrderServiceInstance: PurchaseOrderService | null = null;
let supplierServiceInstance: SupplierService | null = null;
let collectionServiceInstance: CollectionService | null = null;

let taxonomyServiceInstance: TaxonomyService | null = null;
let stripeServiceInstance: StripeService | null = null;
let wishlistRepoInstance: IWishlistRepository | null = null;
let wishlistServiceInstance: WishlistService | null = null;
let ticketRepoInstance: ITicketRepository | null = null;
let kbRepoInstance: IKnowledgebaseRepository | null = null;
let shippingServiceInstance: ShippingService | null = null;
let emailServiceInstance: IEmailService | null = null;
let rateLimitServiceInstance: RateLimitService | null = null;

function createCheckoutGateway(): ICheckoutGateway | undefined {
  return process.env.CHECKOUT_ENDPOINT ? new TrustedCheckoutGateway() : undefined;
}

function createRepositories() {
  return {
    productRepo: new FirestoreProductRepository(),
    cartRepo: new FirestoreCartRepository(),
    orderRepo: new FirestoreOrderRepository(),
    discountRepo: new FirestoreDiscountRepository(),
    settingsRepo: new FirestoreSettingsRepository(),
    transferRepo: new FirestoreTransferRepository(),
    purchaseOrderRepo: new FirestorePurchaseOrderRepository(),
    inventoryLocationRepo: new FirestoreInventoryLocationRepository(),
    inventoryLevelRepo: new FirestoreInventoryLevelRepository(),
    supplierRepo: new FirestoreSupplierRepository(),
    collectionRepo: new FirestoreCollectionRepository(),
    taxonomyRepo: new FirestoreTaxonomyRepository(),
    wishlistRepo: new FirestoreWishlistRepository(),
    ticketRepo: new FirestoreTicketRepository(),
    kbRepo: new FirestoreKnowledgebaseRepository(),
    shippingRepo: new FirestoreShippingRepository(),
  };
}


/**
 * FACTORY PATTERN: Creates fresh service instances
 */
export function getServiceContainer() {
  assertMultiStoreNotEnabled();
  const repos = createRepositories();
  const authProvider = new FirebaseAuthAdapter();
  const authService = new AuthService(authProvider, new AuditService());

  return {
    authProvider,
    authService,
    productService: new ProductService(repos.productRepo, new AuditService()),
    cartService: new CartService(repos.cartRepo, repos.productRepo),
    orderService: new OrderService(
      repos.orderRepo,
      repos.productRepo,
      repos.cartRepo,
      repos.discountRepo,
      new StripePaymentProcessor(),
      new AuditService(),
      new FirestoreLocker(),
      createCheckoutGateway(),
      repos.shippingRepo
    ),
    fulfillmentService: new FulfillmentService(repos.orderRepo, repos.shippingRepo),
    orderManagementService: new OrderManagementService(repos.orderRepo, new AuditService()),
    orderQueryService: new OrderQueryService(repos.orderRepo),
    refundService: new RefundService(repos.orderRepo, new StripePaymentProcessor(), new AuditService(), repos.productRepo, repos.discountRepo),
    discountService: new DiscountService(repos.discountRepo, new AuditService(), repos.orderRepo),
    settingsService: new SettingsService(repos.settingsRepo, repos.productRepo, repos.discountRepo, new AuditService()),
    shippingService: new ShippingService(repos.shippingRepo, new AuditService()),
    transferService: new TransferService(repos.transferRepo, repos.productRepo),
    purchaseOrderService: new PurchaseOrderService(repos.purchaseOrderRepo, repos.productRepo, repos.inventoryLevelRepo, new AuditService()),
    supplierService: new SupplierService(repos.supplierRepo, new AuditService()),
    collectionService: new CollectionService(repos.collectionRepo, new AuditService()),
    taxonomyService: new TaxonomyService(repos.taxonomyRepo, new AuditService()),
    wishlistService: new WishlistService(repos.wishlistRepo, repos.productRepo, new AuditService()),
    stripeService: new StripeService(),
    auditService: new AuditService(),
    orderRepo: repos.orderRepo,
    inventoryLocationRepo: repos.inventoryLocationRepo,
    inventoryLevelRepo: repos.inventoryLevelRepo,
    ticketRepository: repos.ticketRepo,
    knowledgebaseRepository: repos.kbRepo,
    emailService: new BrevoEmailService(),
    rateLimitService: new RateLimitService(),
    tenantContext: { storeId: SINGLE_STORE_ID, multiStoreEnabled: false },
  };
}


/**
 * SINGLETON PATTERN: Gets global cached services (Production Default)
 */
export function getInitialServices() {
  assertMultiStoreNotEnabled();
  const getAuditService = () => {
    if (!auditServiceInstance) auditServiceInstance = new AuditService();
    return auditServiceInstance;
  };

  if (!productRepoInstance || !cartRepoInstance || !orderRepoInstance || !discountRepoInstance || !settingsRepoInstance || !transferRepoInstance) {
    const repos = createRepositories();
    productRepoInstance = repos.productRepo;
    cartRepoInstance = repos.cartRepo;
    orderRepoInstance = repos.orderRepo;
    discountRepoInstance = repos.discountRepo;
    settingsRepoInstance = repos.settingsRepo;
    transferRepoInstance = repos.transferRepo;
    purchaseOrderRepoInstance = repos.purchaseOrderRepo;
    inventoryLocationRepoInstance = repos.inventoryLocationRepo;
    inventoryLevelRepoInstance = repos.inventoryLevelRepo;
    wishlistRepoInstance = repos.wishlistRepo;
    ticketRepoInstance = repos.ticketRepo;
    kbRepoInstance = repos.kbRepo;
    shippingRepoInstance = repos.shippingRepo;
  }

  if (!authProviderInstance) {
    authProviderInstance = new FirebaseAuthAdapter();
  }

  if (!authServiceInstance) {
    authServiceInstance = new AuthService(authProviderInstance!, getAuditService());
  }

  if (!paymentProcessorInstance) {
    paymentProcessorInstance = new StripePaymentProcessor();
  }

  if (!lockProviderInstance) {
    lockProviderInstance = new FirestoreLocker();
  }

  if (!checkoutGatewayInstance && process.env.CHECKOUT_ENDPOINT) {
    checkoutGatewayInstance = new TrustedCheckoutGateway();
  }

  return {
    authProvider: authProviderInstance!,
    authService: authServiceInstance,
    productService: new ProductService(productRepoInstance!, getAuditService()),
    cartService: new CartService(cartRepoInstance!, productRepoInstance!),
    orderService: new OrderService(
      orderRepoInstance!,
      productRepoInstance!,
      cartRepoInstance!,
      discountRepoInstance!,
      paymentProcessorInstance!,
      getAuditService(),
      lockProviderInstance!,
      checkoutGatewayInstance ?? undefined,
      shippingRepoInstance!
    ),
    fulfillmentService: new FulfillmentService(orderRepoInstance!, shippingRepoInstance!),
    orderManagementService: new OrderManagementService(orderRepoInstance!, getAuditService()),
    orderQueryService: new OrderQueryService(orderRepoInstance!),
    refundService: new RefundService(orderRepoInstance!, paymentProcessorInstance!, getAuditService(), productRepoInstance!, discountRepoInstance!),
    discountService: new DiscountService(discountRepoInstance!, getAuditService(), orderRepoInstance!),
    settingsService: new SettingsService(settingsRepoInstance!, productRepoInstance!, discountRepoInstance!, getAuditService()),
    shippingService: (() => {
      if (!shippingServiceInstance) shippingServiceInstance = new ShippingService(shippingRepoInstance!, getAuditService());
      return shippingServiceInstance;
    })(),
    transferService: (() => {
      if (!transferServiceInstance) transferServiceInstance = new TransferService(transferRepoInstance!, productRepoInstance!);
      return transferServiceInstance;
    })(),
    purchaseOrderService: (() => {
      if (!purchaseOrderServiceInstance) {
        purchaseOrderServiceInstance = new PurchaseOrderService(
          purchaseOrderRepoInstance!,
          productRepoInstance!,
          inventoryLevelRepoInstance!,
          getAuditService()
        );
      }
      return purchaseOrderServiceInstance;
    })(),
    supplierService: (() => {
      if (!supplierServiceInstance) supplierServiceInstance = new SupplierService(new FirestoreSupplierRepository(), getAuditService());
      return supplierServiceInstance;
    })(),
    collectionService: (() => {
      if (!collectionServiceInstance) collectionServiceInstance = new CollectionService(new FirestoreCollectionRepository(), getAuditService());
      return collectionServiceInstance;
    })(),
    taxonomyService: (() => {
      if (!taxonomyServiceInstance) taxonomyServiceInstance = new TaxonomyService(new FirestoreTaxonomyRepository(), getAuditService());
      return taxonomyServiceInstance;
    })(),
    wishlistService: (() => {
      if (!wishlistServiceInstance) wishlistServiceInstance = new WishlistService(wishlistRepoInstance!, productRepoInstance!, getAuditService());
      return wishlistServiceInstance;
    })(),
    orderRepo: orderRepoInstance!,
    inventoryLocationRepo: inventoryLocationRepoInstance!,
    inventoryLevelRepo: inventoryLevelRepoInstance!,
    ticketRepository: ticketRepoInstance!,
    knowledgebaseRepository: kbRepoInstance!,
    auditService: getAuditService(),
    stripeService: (() => {
      if (!stripeServiceInstance) stripeServiceInstance = new StripeService();
      return stripeServiceInstance;
    })(),
    emailService: (() => {
      if (!emailServiceInstance) emailServiceInstance = new BrevoEmailService();
      return emailServiceInstance;
    })(),
    rateLimitService: (() => {
      if (!rateLimitServiceInstance) rateLimitServiceInstance = new RateLimitService();
      return rateLimitServiceInstance;
    })(),
    tenantContext: { storeId: SINGLE_STORE_ID, multiStoreEnabled: false },
  };
}
