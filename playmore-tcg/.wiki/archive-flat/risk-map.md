# Risk and Blast-Radius Map

## Checkout and Stock (`src/core/OrderService.ts`)

- Risk: stock deduction, payment processing, rollback, lock release, and order creation are tightly coupled.
- If touched, test: add-to-cart, checkout success, payment failure, insufficient stock, duplicate checkout attempts, cart clearing, order history.

## SQLite Schema and Repositories

- Risk: `schema.ts`, `database.ts`, and `repositories/sqlite/*` must agree on column names, date conversion, and JSON serialization.
- If touched, test: product CRUD, cart persistence, order creation/listing, auth sign-up/sign-in.

## Sessions and Auth

- Risk: HTTP-only session behavior gates `/api/auth/me`, admin layouts/pages, and sign-out.
- If touched, test: register, login, refresh, logout, admin access denial for customers.

## UI API Facade (`src/ui/apiClientServices.ts`)

- Risk: browser date revival and payload shape mismatches can silently break pages.
- If touched, test: products, product detail, cart, checkout, orders, admin products/orders.

## Environment

- Risk: missing `SESSION_SECRET`, bad `SQLITE_DATABASE_PATH`, or placeholder Stripe key affects local runtime.
- If touched, test: `npm run dev`, auth, checkout page load, database creation.

## Generated Files

- Risk: `.next/` modifications are generated cache noise.
- If touched, revert/ignore unless intentionally changing build output policy.