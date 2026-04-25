# Next.js + SQLite Migration Pass — 2026-04-25

## Verification Snapshot

- Latest observed commit: `83b60a8` on `main`, also matching `origin/main` and `origin/HEAD`.
- Commit message states the project was migrated from Vite/React Router/Firebase to a Next.js App Router application backed by the existing SQLite/better-sqlite3 stack.
- Workspace audit before this documentation update observed no uncommitted source diff from `git status --short` / `git diff --stat`.
- The source tree contains App Router pages under `src/app/**`, route handlers under `src/app/api/**`, UI page components under `src/ui/pages/**`, Core services under `src/core/**`, Domain contracts under `src/domain/**`, and SQLite/server adapters under `src/infrastructure/**`.

## Verified Application Runtime Shape

### Framework and Build Configuration

- `package.json` scripts are Next.js-oriented:
  - `dev`: `next dev`
  - `build`: `next build`
  - `start`: `next start`
  - `lint`: `eslint .`
- `package.json` runtime dependencies include `next`, `react`, `react-dom`, `better-sqlite3`, `kysely`, `bcryptjs`, Stripe client packages, and `lucide-react`.
- `next.config.ts` sets `serverExternalPackages: ['better-sqlite3']`, keeping the native SQLite package on the server side.
- `tsconfig.json` includes Next plugin configuration, `.next/types/**/*.ts`, `.next/dev/types/**/*.ts`, and layer aliases for `@domain/*`, `@core/*`, `@infrastructure/*`, `@ui/*`, and `@utils/*`.

### Next App Router Boundary

- `src/app/layout.tsx` defines root metadata and wraps all pages with `ErrorBoundary`, `AuthProvider`, `Navbar`, and a shared layout shell.
- App Router page wrappers such as `src/app/page.tsx` import and render UI page components from `src/ui/pages/*`.
- Product, cart, checkout, orders, login, register, and admin screens are represented as App Router routes under `src/app/**`.
- Admin route wrappers exist for dashboard, orders, products, new product, and edit product screens.

### API Route Boundary

- `src/app/api/products/route.ts` handles product listing and creation with `NextResponse`, then delegates product operations to Core services returned by `getServerServices()`.
- `src/app/api/orders/route.ts` handles user order lookup and checkout/order placement with `NextResponse`, then delegates to `orderService` from `getServerServices()`.
- The source tree includes API route handlers for admin orders, auth session/sign-in/sign-out/sign-up, cart, cart items, orders, products, and product detail operations.

### Server Infrastructure Boundary

- `src/infrastructure/server/services.ts` calls `initDatabase()` once and then returns the singleton Core service container via `getInitialServices()`.
- `src/infrastructure/sqlite/database.ts` opens SQLite with `process.env.SQLITE_DATABASE_PATH ?? 'playmore.db'`, enables WAL/synchronous/foreign-key pragmas, and initializes `products`, `users`, `carts`, `orders`, `hive_claims`, and `hive_audit` tables.
- `src/core/container.ts` wires SQLite repositories, `SQLiteAuthAdapter`, and `StripePaymentProcessor` into `ProductService`, `CartService`, `OrderService`, and `AuthService`.

### Browser UI Service Boundary

- `src/ui/hooks/useServices.ts` memoizes `createApiClientServices()` for UI components.
- `src/ui/apiClientServices.ts` implements browser-side service facades using `fetch` against local `/api/*` routes.
- `src/ui/apiClientServices.ts` revives `createdAt` and `updatedAt` string fields into `Date` objects after API responses.
- UI service facades expose auth, product, cart, order, admin-order, and product-management operations without constructing SQLite repositories in browser components.

## Layer Alignment Notes

- Domain remains represented by pure type/contracts files such as `src/domain/models.ts` and `src/domain/repositories.ts`.
- Core remains the orchestration/composition layer through service classes and `src/core/container.ts`.
- Infrastructure owns Next route handlers, server service initialization, SQLite database access, repositories, auth adapter, sessions, and payment/checkout adapters.
- UI owns React components, hooks, layouts, page components, checkout UI, and API-backed browser service facades.

## Risks / Follow-Up Items

- Generated `.next/` artifacts appear in the latest commit file list. These are build outputs and should be reviewed against `.gitignore` policy if the repository intends to keep generated build artifacts out of source control.
- `src/core/container.ts` still wires infrastructure adapters directly as the current composition root. This is intentional in the file comments, but future refactors should keep this wiring isolated and avoid importing concrete infrastructure into UI components.
- `src/app/api/orders/route.ts` currently calls `orderService.placeOrder(userId, shippingAddress, paymentMethodId || 'manual')`; trusted payment/finalization semantics should continue to be reviewed against the hardening notes in `.wiki/production-hardening-pass-2026-04-25.md`.