# Schemas and Interfaces

## Domain Models

Observed in `src/domain/models.ts`:

- `Product`: `id`, `name`, `description`, `price` in cents, `category`, `stock`, `imageUrl`, optional `set`, optional `rarity`, timestamps.
- `ProductDraft`: product input without generated id/timestamps.
- `ProductUpdate`: partial draft.
- `ProductCategory`: `booster | single | deck | accessory | box`.
- `CardRarity`: `common | uncommon | rare | holo | secret`.
- `User`: `id`, `email`, `displayName`, `role`, `createdAt`.
- `UserRole`: `customer | admin`.
- `Cart`: `id`, `userId`, `items`, `updatedAt`.
- `CartItem`: `productId`, `name`, `priceSnapshot`, `quantity`, `imageUrl`.
- `Order`: `id`, `userId`, `items`, `total`, `status`, `shippingAddress`, `paymentTransactionId`, timestamps.
- `OrderStatus`: `pending | confirmed | shipped | delivered | cancelled`.
- `Address`: `street`, `city`, `state`, `zip`, `country`.

## Domain Interfaces

Observed in `src/domain/repositories.ts`:

- `IProductRepository`: list/get/create/update/delete/update stock/batch stock update.
- `ICartRepository`: get by user, save, clear.
- `IOrderRepository`: create/get/list/update status.
- `IAuthProvider`: current user, sign in, sign up, sign out, auth-state callback.
- `IPaymentProcessor`: process payment with amount/order/payment/idempotency data.
- `ICheckoutGateway`: trusted checkout finalization.
- `ILockProvider`: acquire/release resource locks.

## SQLite Tables

Observed in `src/infrastructure/sqlite/schema.ts` and created in `database.ts`:

| Table | Key Columns | Notes |
|---|---|---|
| `products` | `id`, `name`, `price`, `category`, `stock`, timestamps | Product catalog. |
| `users` | `id`, unique `email`, `passwordHash`, `displayName`, `role`, `createdAt` | SQLite-backed auth. |
| `carts` | `id`, unique `userId`, `items`, `updatedAt` | `items` stored as JSON text. |
| `orders` | `id`, `userId`, `items`, `total`, `status`, `shippingAddress`, `paymentTransactionId`, timestamps | `items` and `shippingAddress` stored as JSON text. |
| `hive_claims` | `id`, `owner`, `expiresAt`, `createdAt` | Lock/claim table. |
| `hive_audit` | `id`, `action`, `details`, `timestamp` | Integrity/audit log. |

## Environment Schema

| Key | Observed In | Behavior |
|---|---|---|
| `SQLITE_DATABASE_PATH` | `.env.example`, `database.ts` | SQLite file path; default is `playmore.db`. |
| `SESSION_SECRET` | `.env.example` | Secret for auth/session behavior. |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `.env.example` | Client-exposed Stripe publishable key. |
| `CHECKOUT_ENDPOINT` | `TrustedCheckoutGateway.ts` | Optional server endpoint for trusted checkout finalization. |

## API Surface

Observed route files under `src/app/api`:

- `GET /api/products`, `POST /api/products`
- `GET /api/products/[id]`, `PATCH /api/products/[id]`, `DELETE /api/products/[id]`
- `GET /api/cart`, `DELETE /api/cart`
- `POST /api/cart/items`, `PATCH /api/cart/items`, `DELETE /api/cart/items`
- `GET /api/orders`, `POST /api/orders`
- `GET /api/admin/orders`
- `PATCH /api/admin/orders/[id]`
- `GET /api/auth/me`
- `POST /api/auth/sign-in`, `POST /api/auth/sign-out`, `POST /api/auth/sign-up`
