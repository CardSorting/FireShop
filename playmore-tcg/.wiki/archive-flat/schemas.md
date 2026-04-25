# Schemas and Contracts

## Domain Models (`src/domain/models.ts`)

- `Product`: `id`, `name`, `description`, `price` in cents, `category`, `stock`, `imageUrl`, optional `set`, optional `rarity`, `createdAt`, `updatedAt`.
- `ProductCategory`: `booster | single | deck | accessory | box`.
- `CardRarity`: `common | uncommon | rare | holo | secret`.
- `User`: `id`, `email`, `displayName`, `role`, `createdAt`.
- `UserRole`: `customer | admin`.
- `Cart`: `id`, `userId`, `items`, `updatedAt`.
- `CartItem`: `productId`, `name`, `priceSnapshot`, `quantity`, `imageUrl`.
- `Order`: `id`, `userId`, `items`, `total`, `status`, `shippingAddress`, `paymentTransactionId`, `createdAt`, `updatedAt`.
- `OrderStatus`: `pending | confirmed | shipped | delivered | cancelled`.
- `Address`: `street`, `city`, `state`, `zip`, `country`.

## Repository Interfaces (`src/domain/repositories.ts`)

- `IProductRepository`: list/get/create/update/delete/updateStock/batchUpdateStock.
- `ICartRepository`: get by user, save, clear.
- `IOrderRepository`: create/get/list/updateStatus.
- `IAuthProvider`: current user, sign in/up/out, auth-state subscription.
- `IPaymentProcessor`: `processPayment({ amount, orderId, paymentMethodId?, idempotencyKey })`.
- `ICheckoutGateway`: `finalizeCheckout({ userId, shippingAddress, paymentMethodId, idempotencyKey })`.
- `ILockProvider`: acquire/release lock.

## SQLite Tables (`src/infrastructure/sqlite/schema.ts` and `database.ts`)

- `products`: id, name, description, price, category, stock, imageUrl, set, rarity, createdAt, updatedAt.
- `users`: id, email unique, passwordHash, displayName, role, createdAt.
- `carts`: id, userId unique, items JSON string, updatedAt.
- `orders`: id, userId, items JSON string, total, status, shippingAddress JSON string, paymentTransactionId nullable, createdAt, updatedAt.
- `hive_claims`: id resource key, owner, expiresAt, createdAt.
- `hive_audit`: id, action, details, timestamp.

SQLite initialization enables WAL, `synchronous = NORMAL`, and foreign keys.

## Environment Schema

Observed in `.env.example`:

- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `SESSION_SECRET`
- `SQLITE_DATABASE_PATH`

Observed in `TrustedCheckoutGateway.ts`:

- `CHECKOUT_ENDPOINT` optional trusted server-side checkout finalization URL.