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
import { FirestoreLocker } from '@infrastructure/repositories/firestore/FirestoreLocker';
import { ProductService } from './ProductService';
import { CartService } from './CartService';
import { OrderService } from './OrderService';
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
  };
}


/**
 * FACTORY PATTERN: Creates fresh service instances
 */
export function getServiceContainer() {
  const repos = createRepositories();
  const authProvider = new FirebaseAuthAdapter();
  const authService = new AuthService(authProvider);

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
      new FirestoreLocker(), // Replaced Mock locker for Firestore
      createCheckoutGateway()
    ),
    discountService: new DiscountService(repos.discountRepo, new AuditService()),
    settingsService: new SettingsService(repos.settingsRepo, repos.productRepo, repos.discountRepo, new AuditService()),
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
  };
}


/**
 * SINGLETON PATTERN: Gets global cached services (Production Default)
 */
export function getInitialServices() {
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
  }

  if (!authProviderInstance) {
    authProviderInstance = new FirebaseAuthAdapter();
  }

  if (!authServiceInstance) {
    authServiceInstance = new AuthService(authProviderInstance!);
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

  const getAuditService = () => {
    if (!auditServiceInstance) auditServiceInstance = new AuditService();
    return auditServiceInstance;
  };

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
      checkoutGatewayInstance ?? undefined
    ),
    discountService: new DiscountService(discountRepoInstance!, getAuditService()),
    settingsService: new SettingsService(settingsRepoInstance!, productRepoInstance!, discountRepoInstance!, getAuditService()),
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
  };
}
