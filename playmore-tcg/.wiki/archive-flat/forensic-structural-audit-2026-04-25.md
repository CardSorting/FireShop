# Forensic Structural Audit — 2026-04-25

## Scope

This pass documents the current structural state and environmental reality of the `playmore-tcg/` workspace as physically observed on 2026-04-25. It prioritizes the living file tree, configuration, entry points, service boundaries, and logic-density hotspots over historical git analysis.

## Verification Probes

- Workspace hierarchy was mapped with `find /Users/bozoegg/Desktop/PlayMoreTCG/playmore-tcg` while pruning heavyweight generated directories such as `node_modules` and `.next`.
- Documentation locations were verified under `playmore-tcg/.wiki` and `playmore-tcg/knowledgebase`.
- Runtime and compiler configuration were verified by reading `package.json`, `next.config.ts`, `.env.example`, and `tsconfig.json`.
- Layer representatives were read directly from `src/app`, `src/core`, `src/domain`, `src/infrastructure`, and `src/ui`.
- Logic density was probed with TypeScript/TSX line counts under `src/`.
- `git status --short` returned no output before this documentation edit, indicating no pre-existing uncommitted changes were observed during this pass.

## Workspace Architecture

The repository has an outer workspace at `/Users/bozoegg/Desktop/PlayMoreTCG` and the application project root at `playmore-tcg/`.

Observed top-level project directories include:

- `.wiki/` — Sovereign Knowledge Ledger entries and changelog.
- `knowledgebase/` — broader system documentation (`01-system-overview.md` through `06-testing-strategies.md` plus `index.md`).
- `public/` — static assets including `favicon.svg` and `icons.svg`.
- `src/` — active application source.
- `dist/` — generated build output present at the project root.

Observed `src/` source distribution:

| Area | Observed file count | Role |
| --- | ---: | --- |
| `src/app` | 26 | Next.js App Router pages, layouts, and route handlers. |
| `src/ui` | 20 | Browser-facing pages, layouts, hooks, checkout components, and API-backed client service facade. |
| `src/infrastructure` | 14 | SQLite persistence, server service bootstrap, session handling, auth/payment/seed adapters, lock/integrity utilities. |
| `src/core` | 5 | Application service orchestration and composition container. |
| `src/domain` | 4 | Pure models, repository contracts, domain errors, and business rules. |
| `src/utils` | 3 | Shared constants, logging, and validators. |
| `src/index.css` | 1 | Global styling entry. |

## Active Tech Stack and Environment

`package.json` verifies a private TypeScript/React ecommerce application using:

- Next.js `^16.0.10` with scripts `dev`, `build`, and `start` mapped to `next dev`, `next build`, and `next start`.
- React `^19.2.5` and React DOM `^19.2.5`.
- SQLite persistence through `better-sqlite3` `^12.9.0` and Kysely `^0.28.16`.
- Stripe browser integration packages `@stripe/react-stripe-js` and `@stripe/stripe-js`.
- Password hashing via `bcryptjs`.
- Styling/tooling dependencies including Tailwind CSS, ESLint, TypeScript, and React hook linting.

`next.config.ts` contains `serverExternalPackages: ['better-sqlite3']`, confirming that the SQLite native module is treated as server-side external infrastructure.

`.env.example` documents the runtime configuration surface:

- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `SESSION_SECRET`
- `SQLITE_DATABASE_PATH`

`src/infrastructure/sqlite/database.ts` falls back to `playmore.db` when `SQLITE_DATABASE_PATH` is absent and configures SQLite with WAL mode, `synchronous = NORMAL`, and foreign keys enabled.

`tsconfig.json` verifies strict TypeScript settings and path aliases for `@domain/*`, `@core/*`, `@infrastructure/*`, `@ui/*`, and `@utils/*`.

## Entry Points and Service Boundaries

### App Router Shell

`src/app/layout.tsx` is the root layout. It sets metadata for `PlayMoreTCG`, imports global CSS from `src/index.css`, and wraps page content with `ErrorBoundary`, `AuthProvider`, `Navbar`, and a flex-based application shell.

### Route Handlers

`src/app/api/products/route.ts` exposes product listing and creation through `GET` and `POST`. It obtains services through `getServerServices()` and returns `NextResponse` JSON.

`src/app/api/orders/route.ts` exposes order lookup and placement through `GET` and `POST`. It requires `userId` for order lookup and delegates placement to `services.orderService.placeOrder(...)`.

### Server Service Bootstrap

`src/infrastructure/server/services.ts` guards one-time initialization with an `initialized` boolean, calls `initDatabase()`, then returns `getInitialServices()` from `src/core/container.ts`.

### Core Composition

`src/core/container.ts` wires SQLite repositories, `SQLiteAuthAdapter`, `StripePaymentProcessor`, and Core services. It exposes:

- `getServiceContainer()` for fresh, isolated instances.
- `getInitialServices()` for cached singleton repositories/providers used by production paths.

### Browser Service Facade

`src/ui/apiClientServices.ts` is marked `'use client'`. It avoids direct SQLite construction and instead provides browser-side service-like facades backed by `fetch('/api/...')` calls. It revives `createdAt` and `updatedAt` string fields to `Date` instances.

## Domain and Data Model Reality

`src/domain/models.ts` defines core business entities and value shapes: `Product`, `ProductDraft`, `ProductUpdate`, `User`, `Cart`, `CartItem`, `Order`, `OrderItem`, `Address`, and role/status/category/rarity union types.

`src/domain/rules.ts` contains primary pure business logic and validations, including product validation, cart total calculation, cart item validation, stock coalescing, shipping address validation, order item validation, and cart item mutation helpers.

`src/infrastructure/sqlite/schema.ts` defines physical SQLite table shapes for `products`, `users`, `carts`, `orders`, `hive_claims`, and `hive_audit`. `src/infrastructure/sqlite/database.ts` creates those tables if they do not exist.

## Logic Density and Hotspots

Line-count probing under `src/` identified these largest TypeScript/TSX files:

| File | Lines | Interpretation |
| --- | ---: | --- |
| `src/infrastructure/repositories/sqlite/SQLiteProductRepository.ts` | 273 | Highest persistence-adapter density; likely product query/mutation hotspot. |
| `src/ui/pages/admin/AdminProductForm.tsx` | 233 | Highest UI form complexity; likely admin product create/edit hotspot. |
| `src/domain/rules.ts` | 230 | Primary pure business-rule concentration. |
| `src/core/OrderService.ts` | 194 | Checkout/order orchestration hotspot. |
| `src/ui/pages/CartPage.tsx` | 188 | Cart interaction and rendering hotspot. |
| `src/ui/pages/ProductsPage.tsx` | 182 | Product listing/search/browse UI hotspot. |
| `src/infrastructure/sqlite/SovereignLocker.ts` | 167 | Locking/integrity infrastructure hotspot. |
| `src/core/container.ts` | 162 | Composition and singleton lifecycle hotspot. |
| `src/ui/pages/CheckoutPage.tsx` | 157 | Checkout UI orchestration hotspot. |
| `src/infrastructure/repositories/sqlite/SQLiteCartRepository.ts` | 154 | Cart persistence hotspot. |

These hotspots indicate that active complexity is concentrated in SQLite repositories, domain validation/rules, order/checkout orchestration, and admin/customer commerce UI pages.

## Knowledge Synchrony Notes

- `.wiki/index.md` now references this present-state audit and summarizes the verified source distribution and environment variables.
- `.wiki/changelog.md` records this pass separately from the earlier migration/hardening entries.
- Existing historical records remain valid as history, but this file is the current structural snapshot for the observed workspace state on 2026-04-25.
