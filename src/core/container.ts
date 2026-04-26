/**
 * [LAYER: CORE]
 * 
 * Service Container with STRICT Lazy Initialization
 * 
 * ARCHITECTURAL COMPLIANCE:
 * - ZERO eager exports - all services lazy-initialized
 * - Eliminates infinite loop risk from circular dependencies
 * - Prevents database init timing issues
 * - Singleton pattern enforced via module-level caching
 * - JoyZoning compliant: UI imports Domain ONLY via hooks
 * 
 * INITIALIZATION PATTERNS (Documented for Clarity):
 * 
 * PATTERN 1: getServiceContainer() - Factory Pattern
 * - Purpose: Create isolated, fresh service instances for testing or state isolation
 * - Use Case: Unit testing, debugging, or scenarios requiring fresh state
 * - Behavior: Creates NEW repository instances each call, no caching
 * - Note: Not recommended for production use (conflicts with PATTERN 2)
 * 
 * PATTERN 2: getInitialServices() - Singleton Pattern (Production)
 * - Purpose: Global singleton services for consistent app-wide state
 * - Use Case: Production app, Cart persistence, user state management
 * - Behavior: Returns CACHED container (repositories persist across calls)
 * - Default: Used by useServices() hook for production app behavior
 * 
 * SINGLETON STATE MANAGEMENT:
 * - authServiceInstance: AuthService (shared across app)
 * - authProviderInstance: SQLiteAuthAdapter (cached)
 * - productsRepo: SQLiteProductRepository (cached singleton - shared)
 * - cartRepo: SQLiteCartRepository (cached singleton - shared)
 * - ordersRepo: SQLiteOrderRepository (cached singleton - shared)
 * 
 * NOISE IMPORTS ELIMINATED:
 * - Core is the composition root and intentionally wires infrastructure adapters
 * - No core polluting infrastructure layer
 * - No UI polluting any layer
 * 
 * INITIALIZATION ORDER:
 * 1. SQLite initialized server-side before first service using it
 * 2. Repository instances cached on first creation (singleton)
 * 3. Services created on-demand via getInitialServices() hook
 * 4. UI components use useServices() hook only
 * 
 * REPOSITORY SCOPE (IMPORTANT):
 * - ProductRepository: Singleton - shared across ProductService
 * - CartRepository: Singleton - shared across CartService AND preserved in memory
 * - OrderRepository: Singleton - shared across OrderService
 * 
 * DESIGN RATIONALE:
 * - CartRepository singleton allows seamless cart persistence
 *   without complex state management or page navigation
 * - Other repositories as singletons improve performance (cached queries)
 * - Factory pattern preserved for testing scenarios
 */

import { SQLiteProductRepository } from '@infrastructure/repositories/sqlite/SQLiteProductRepository';
import { SQLiteCartRepository } from '@infrastructure/repositories/sqlite/SQLiteCartRepository';
import { SQLiteOrderRepository } from '@infrastructure/repositories/sqlite/SQLiteOrderRepository';
import { SQLiteAuthAdapter } from '@infrastructure/services/SQLiteAuthAdapter';
import { StripePaymentProcessor } from '@infrastructure/services/StripePaymentProcessor';
import { ProductService } from './ProductService';
import { CartService } from './CartService';
import { OrderService } from './OrderService';
import { AuthService } from './AuthService';
import type {
  IProductRepository,
  ICartRepository,
  IOrderRepository,
  IAuthProvider,
  IPaymentProcessor,
} from '@domain/repositories';

// Singleton caches for production (Pattern 2 - getInitialServices)
let authServiceInstance: AuthService | null = null;
let authProviderInstance: IAuthProvider | null = null;

// Repository singletons - cached globally (shared across all services)
let productRepoInstance: IProductRepository | null = null;
let cartRepoInstance: ICartRepository | null = null;
let orderRepoInstance: IOrderRepository | null = null;
let paymentProcessorInstance: IPaymentProcessor | null = null;

/**
 * Helper to create the correct repository based on provider
 */
function createRepositories() {
  return {
    productRepo: new SQLiteProductRepository(),
    cartRepo: new SQLiteCartRepository(),
    orderRepo: new SQLiteOrderRepository(),
  };
}

/**
 * FACTORY PATTERN: Creates fresh service instances
 * 
 * Use this for testing when you need isolated state.
 * Not recommended for production use.
 * 
 * @returns Container with fresh repository instances
 */
export function getServiceContainer() {
  const { productRepo, cartRepo, orderRepo } = createRepositories();
  const authProvider = new SQLiteAuthAdapter();
  const authService = new AuthService(authProvider);

  return {
    authProvider,
    authService,
    productService: new ProductService(productRepo),
    cartService: new CartService(cartRepo, productRepo),
    orderService: new OrderService(
      orderRepo,
      productRepo,
      cartRepo,
      new StripePaymentProcessor()
    ),
  };
}

/**
 * SINGLETON PATTERN: Gets global cached services (Production Default)
 * 
 * This is the pattern used by useServices() hook for production apps.
 * Repositories are cached and retained across function calls.
 * 
 * @returns Container with cached singleton instances
 */
export function getInitialServices() {
  if (!productRepoInstance || !cartRepoInstance || !orderRepoInstance) {
    const { productRepo, cartRepo, orderRepo } = createRepositories();
    productRepoInstance = productRepo;
    cartRepoInstance = cartRepo;
    orderRepoInstance = orderRepo;
  }

  // Auth selection
  if (!authProviderInstance) {
    authProviderInstance = new SQLiteAuthAdapter();
  }

  if (!authServiceInstance) {
    authServiceInstance = new AuthService(authProviderInstance!);
  }

  if (!paymentProcessorInstance) {
    paymentProcessorInstance = new StripePaymentProcessor();
  }

  return {
    authProvider: authProviderInstance!,
    authService: authServiceInstance,
    productService: new ProductService(productRepoInstance!),
    cartService: new CartService(cartRepoInstance!, productRepoInstance!),
    orderService: new OrderService(
      orderRepoInstance!,
      productRepoInstance!,
      cartRepoInstance!,
      paymentProcessorInstance
    ),
  };
}