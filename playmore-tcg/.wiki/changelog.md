# Sovereign Knowledge Ledger Changelog

## 2026-04-25 — Omni-Bridge Hierarchical Taxonomy Synchronization

### Audit Inputs

- Executed bounded repository status and `.wiki` file discovery using `git status --short` and `find .wiki -maxdepth 3`.
- Observed `.wiki/` was flat before this pass, with root-level files such as `architecture.md`, `directories.md`, `schemas.md`, `patterns.md`, `decisions.md`, `risk-map.md`, `agent-memory.md`, `getting-started.md`, `walkthrough.md`, and `troubleshooting.md`.
- Read `package.json`, `README.md`, `.env.example`, `src/domain/models.ts`, `src/domain/repositories.ts`, `src/domain/rules.ts`, `src/core/OrderService.ts`, `src/core/container.ts`, `src/infrastructure/server/services.ts`, `src/infrastructure/sqlite/schema.ts`, `src/infrastructure/sqlite/database.ts`, `src/infrastructure/services/TrustedCheckoutGateway.ts`, `src/app/api/orders/route.ts`, and `src/ui/apiClientServices.ts`.
- Listed `playmore-tcg/src` recursively and `playmore-tcg` top-level entries to confirm source zones, generated directories, and project layout.

### Documentation Updates

- Rebuilt `.wiki/index.md` as the root dashboard and table of contents for the hierarchical taxonomy.
- Created `.wiki/onboarding/getting-started.md`, `.wiki/onboarding/walkthrough.md`, and `.wiki/onboarding/troubleshooting.md`.
- Created `.wiki/architecture/overview.md`, `.wiki/architecture/directories.md`, `.wiki/architecture/schemas.md`, `.wiki/architecture/decisions.md`, and `.wiki/architecture/risk-map.md`.
- Created `.wiki/agent/agent-memory.md` and `.wiki/agent/patterns.md`.
- Moved prior flat/root historical documentation files into `.wiki/archive-flat/` to keep root reserved for `index.md` and `changelog.md`.

### Verified Current-State Facts

- Active stack in `package.json`: Next.js 16, React 19, TypeScript 6, Tailwind CSS 4, `better-sqlite3`, Kysely, bcryptjs, and Stripe client libraries.
- Active scripts in `package.json`: `dev`, `build`, `lint`, and `start`.
- `src/domain/models.ts` defines product, user, cart, order, and address models plus category/status/role unions.
- `src/domain/repositories.ts` defines product/cart/order/auth/payment/checkout/lock interfaces.
- `src/domain/rules.ts` contains pure validation and calculation logic for product input, cart quantities, stock availability, order items, shipping address, stock coalescing, and cents formatting.
- `src/core/container.ts` wires SQLite repositories, `SQLiteAuthAdapter`, `StripePaymentProcessor`, and Core services, with both factory and singleton service access patterns.
- `src/infrastructure/server/services.ts` calls `initDatabase()` before returning `getInitialServices()`.
- `src/infrastructure/sqlite/database.ts` enables SQLite WAL, `synchronous = NORMAL`, and foreign keys, then creates `products`, `users`, `carts`, `orders`, `hive_claims`, and `hive_audit` tables if missing.
- `src/ui/apiClientServices.ts` is a browser-side service facade over local `/api/*` routes and revives `createdAt`/`updatedAt` date strings.
- `.env.example` includes `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `SESSION_SECRET`, and `SQLITE_DATABASE_PATH`; `TrustedCheckoutGateway.ts` additionally reads optional `CHECKOUT_ENDPOINT`.

## Historical Entries

Previous flat Knowledge Ledger files from earlier passes were archived under `.wiki/archive-flat/` during the taxonomy synchronization so the current root remains parseable and intentionally small.
