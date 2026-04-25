# Codebase Walkthrough

## 1. Start at App Router

`src/app/` contains route segments and API handlers. Page files delegate rendering to UI modules, while API route files return JSON through `NextResponse` and call server services.

Key observed routes:

- Customer pages: `/`, `/products`, `/products/[id]`, `/cart`, `/checkout`, `/orders`, `/login`, `/register`.
- Admin pages: `/admin`, `/admin/products`, `/admin/products/new`, `/admin/products/[id]/edit`, `/admin/orders`.
- API boundaries: `/api/products`, `/api/products/[id]`, `/api/cart`, `/api/cart/items`, `/api/orders`, `/api/admin/orders`, `/api/admin/orders/[id]`, and `/api/auth/*`.

## 2. Follow the Server Request Flow

1. A route handler in `src/app/api/**/route.ts` receives the HTTP request.
2. The handler calls `getServerServices()` from `src/infrastructure/server/services.ts`.
3. `getServerServices()` calls `initDatabase()` once, then returns `getInitialServices()`.
4. `src/core/container.ts` wires SQLite repositories, SQLite auth, Stripe payment, and Core services.
5. Core services call Domain repository interfaces and Domain rules.
6. SQLite infrastructure adapters perform persistence.

## 3. Find Business Rules

`src/domain/rules.ts` is the pure business-rule hotspot. It validates products, shipping addresses, cart item quantities, order items, stock availability, stock coalescing, and currency formatting.

## 4. Find Orchestration

`src/core/` contains service classes:

- `AuthService.ts`
- `CartService.ts`
- `OrderService.ts`
- `ProductService.ts`
- `container.ts`

`OrderService.ts` is especially sensitive because it coordinates checkout locks, stock deductions, payment processing, rollback on payment failure, order creation, and cart clearing.

## 5. Find Persistence

SQLite integration lives under `src/infrastructure/sqlite/` and `src/infrastructure/repositories/sqlite/`. The schema is typed in `schema.ts`; table creation is in `database.ts`.

## 6. Find Browser Integration

`src/ui/apiClientServices.ts` is the browser-side facade. It calls local `/api/*` endpoints with `fetch`, revives serialized dates, and exposes service-shaped client methods to UI pages/hooks.
