# API Surface

Observed route handlers under `src/app/api/**/route.ts` export these HTTP methods.

## Products

- `GET /api/products` — list products; observed search params include category/limit/cursor patterns through repository contract.
- `POST /api/products` — create product.
- `GET /api/products/[id]` — fetch one product.
- `PATCH /api/products/[id]` — update product.
- `DELETE /api/products/[id]` — delete product.

## Cart

- `GET /api/cart?userId=...` — fetch a user cart.
- `DELETE /api/cart` — clear cart using JSON body containing `userId`.
- `POST /api/cart/items` — add item using JSON body containing `userId`, `productId`, `quantity`.
- `PATCH /api/cart/items` — update item quantity using JSON body containing `userId`, `productId`, `quantity`.
- `DELETE /api/cart/items` — remove item using JSON body containing `userId`, `productId`.

## Orders

- `GET /api/orders?userId=...` — fetch customer orders.
- `POST /api/orders` — place/finalize an order.

## Admin Orders

- `GET /api/admin/orders` — list orders; observed search params include status/limit/cursor patterns through repository contract.
- `PATCH /api/admin/orders/[id]` — update order status.

## Auth

- `GET /api/auth/me` — return current session user from `src/infrastructure/server/session.ts`.
- `POST /api/auth/sign-in` — sign in.
- `POST /api/auth/sign-up` — create account.
- `POST /api/auth/sign-out` — clear session.

## Route Handler Pattern

API handlers should use `getServerServices()` from `src/infrastructure/server/services.ts`, which initializes SQLite once and returns Core services from `src/core/container.ts`.