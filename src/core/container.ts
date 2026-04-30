/**
 * [LAYER: CORE]
 * 
 * Service Container with STRICT Lazy Initialization
 */

import { SQLiteProductRepository } from '@infrastructure/repositories/sqlite/SQLiteProductRepository';
import { SQLiteCartRepository } from '@infrastructure/repositories/sqlite/SQLiteCartRepository';
import { SQLiteOrderRepository } from '@infrastructure/repositories/sqlite/SQLiteOrderRepository';
import { SQLiteDiscountRepository } from '@infrastructure/repositories/sqlite/SQLiteDiscountRepository';
import { SQLiteAuthAdapter } from '@infrastructure/services/SQLiteAuthAdapter';
import { StripePaymentProcessor } from '@infrastructure/services/StripePaymentProcessor';
import { TrustedCheckoutGateway } from '@infrastructure/services/TrustedCheckoutGateway';
import { SovereignLocker } from '@infrastructure/sqlite/SovereignLocker';
import { SQLiteSettingsRepository } from '@infrastructure/repositories/sqlite/SQLiteSettingsRepository';
import { SQLiteTransferRepository } from '@infrastructure/repositories/sqlite/SQLiteTransferRepository';
import { SQLitePurchaseOrderRepository } from '@infrastructure/repositories/sqlite/SQLitePurchaseOrderRepository';
import { SQLiteInventoryLocationRepository } from '@infrastructure/repositories/sqlite/SQLiteInventoryLocationRepository';
import { SQLiteInventoryLevelRepository } from '@infrastructure/repositories/sqlite/SQLiteInventoryLevelRepository';
import { SQLiteSupplierRepository } from '@infrastructure/repositories/sqlite/SQLiteSupplierRepository';
import { SQLiteCollectionRepository } from '@infrastructure/repositories/sqlite/SQLiteCollectionRepository';
import { SQLiteTaxonomyRepository } from '@infrastructure/repositories/sqlite/SQLiteTaxonomyRepository';
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
import { SQLiteWishlistRepository } from '@infrastructure/repositories/sqlite/SQLiteWishlistRepository';
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
let taxonomyRepoInstance: ITaxonomyRepository | null = null;
let taxonomyServiceInstance: TaxonomyService | null = null;
let wishlistRepoInstance: IWishlistRepository | null = null;
let wishlistServiceInstance: WishlistService | null = null;

function createCheckoutGateway(): ICheckoutGateway | undefined {
  return process.env.CHECKOUT_ENDPOINT ? new TrustedCheckoutGateway() : undefined;
}

function createRepositories() {
  return {
    productRepo: new SQLiteProductRepository(),
    cartRepo: new SQLiteCartRepository(),
    orderRepo: new SQLiteOrderRepository(),
    discountRepo: new SQLiteDiscountRepository(),
    settingsRepo: new SQLiteSettingsRepository(),
    transferRepo: new SQLiteTransferRepository(),
    purchaseOrderRepo: new SQLitePurchaseOrderRepository(),
    inventoryLocationRepo: new SQLiteInventoryLocationRepository(),
    inventoryLevelRepo: new SQLiteInventoryLevelRepository(),
    supplierRepo: new SQLiteSupplierRepository(),
    collectionRepo: new SQLiteCollectionRepository(),
    taxonomyRepo: new SQLiteTaxonomyRepository(),
    wishlistRepo: new SQLiteWishlistRepository(),
  };
}


/**
 * FACTORY PATTERN: Creates fresh service instances
 */
export function getServiceContainer() {
  const {
    productRepo,
    cartRepo,
    orderRepo,
    discountRepo,
    settingsRepo,
    transferRepo,
    purchaseOrderRepo,
    inventoryLocationRepo,
    inventoryLevelRepo,
    wishlistRepo,
  } = createRepositories();
  const authProvider = new SQLiteAuthAdapter();
  const authService = new AuthService(authProvider);

  return {
    authProvider,
    authService,
    productService: new ProductService(productRepo, new AuditService()),
    cartService: new CartService(cartRepo, productRepo),
    orderService: new OrderService(
      orderRepo,
      productRepo,
      cartRepo,
      discountRepo,
      new StripePaymentProcessor(),
      new AuditService(),
      new SovereignLocker(),
      createCheckoutGateway()
    ),
    discountService: new DiscountService(discountRepo, new AuditService()),
    settingsService: new SettingsService(settingsRepo, productRepo, discountRepo, new AuditService()),
    transferService: new TransferService(transferRepo, productRepo),
    purchaseOrderService: new PurchaseOrderService(purchaseOrderRepo, productRepo, inventoryLevelRepo, new AuditService()),
    supplierService: new SupplierService(new SQLiteSupplierRepository(), new AuditService()),
    collectionService: new CollectionService(new SQLiteCollectionRepository(), new AuditService()),
    taxonomyService: new TaxonomyService(new SQLiteTaxonomyRepository(), new AuditService()),
    wishlistService: new WishlistService(wishlistRepo, productRepo, new AuditService()),
    auditService: new AuditService(),
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
  }

  if (!authProviderInstance) {
    authProviderInstance = new SQLiteAuthAdapter();
  }

  if (!authServiceInstance) {
    authServiceInstance = new AuthService(authProviderInstance!);
  }

  if (!paymentProcessorInstance) {
    paymentProcessorInstance = new StripePaymentProcessor();
  }

  if (!lockProviderInstance) {
    lockProviderInstance = new SovereignLocker();
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
      if (!supplierServiceInstance) supplierServiceInstance = new SupplierService(new SQLiteSupplierRepository(), getAuditService());
      return supplierServiceInstance;
    })(),
    collectionService: (() => {
      if (!collectionServiceInstance) collectionServiceInstance = new CollectionService(new SQLiteCollectionRepository(), getAuditService());
      return collectionServiceInstance;
    })(),
    taxonomyService: (() => {
      if (!taxonomyServiceInstance) taxonomyServiceInstance = new TaxonomyService(new SQLiteTaxonomyRepository(), getAuditService());
      return taxonomyServiceInstance;
    })(),
    wishlistService: (() => {
      if (!wishlistServiceInstance) wishlistServiceInstance = new WishlistService(wishlistRepoInstance!, productRepoInstance!, getAuditService());
      return wishlistServiceInstance;
    })(),
    inventoryLocationRepo: inventoryLocationRepoInstance!,
    inventoryLevelRepo: inventoryLevelRepoInstance!,
    auditService: getAuditService(),
  };
}