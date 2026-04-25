# Architecture

## Verified Stack

PlayMoreTCG is a Next.js App Router ecommerce application using React 19, TypeScript, Tailwind CSS 4, SQLite through `better-sqlite3` + Kysely, bcryptjs auth, and Stripe client packages.

## Layer Map

```mermaid
flowchart TD
  UI[src/ui: React pages, components, hooks] --> APP[src/app: Next page wrappers]
  UI --> CLIENT[src/ui/apiClientServices.ts]
  CLIENT --> API[src/app/api/**/route.ts]
  APP --> UI
  API --> SERVER[src/infrastructure/server/services.ts]
  SERVER --> DBINIT[src/infrastructure/sqlite/database.ts initDatabase]
  SERVER --> CONTAINER[src/core/container.ts]
  CONTAINER --> CORE[src/core services]
  CORE --> DOMAIN[src/domain models, rules, errors, repository contracts]
  CONTAINER --> SQLITE[src/infrastructure/repositories/sqlite]
  SQLITE --> DB[(SQLite file via SQLITE_DATABASE_PATH or playmore.db)]
  CORE --> PAYMENT[src/infrastructure/services/StripePaymentProcessor]
  CORE --> CHECKOUT[src/infrastructure/services/TrustedCheckoutGateway optional CHECKOUT_ENDPOINT]
  API --> SESSION[src/infrastructure/server/session.ts HTTP-only session cookie]
```

## Request Flow

```mermaid
sequenceDiagram
  participant Browser
  participant UI as src/ui
  participant API as src/app/api route
  participant Server as getServerServices
  participant Core as Core Service
  participant Repo as SQLite Repository
  participant DB as SQLite
  Browser->>UI: user action
  UI->>API: fetch('/api/...')
  API->>Server: getServerServices()
  Server->>DB: initDatabase() once
  Server->>Core: getInitialServices()
  Core->>Repo: repository interface call
  Repo->>DB: Kysely/better-sqlite3 operation
  DB-->>Repo: rows
  Repo-->>Core: Domain-shaped model
  Core-->>API: result
  API-->>UI: JSON
```

## Composition Root

`src/core/container.ts` creates `SQLiteProductRepository`, `SQLiteCartRepository`, `SQLiteOrderRepository`, `SQLiteAuthAdapter`, and `StripePaymentProcessor`. `getInitialServices()` caches singleton repositories/providers for production. `getServiceContainer()` creates fresh instances for tests or isolated debugging.

## High-Density Logic Areas

- `src/core/OrderService.ts`: checkout orchestration, stock checks, locks, payment, rollback/reconciliation behavior.
- `src/domain/rules.ts`: business validations and calculations.
- `src/infrastructure/sqlite/database.ts`: table initialization and SQLite pragmas.
- `src/infrastructure/repositories/sqlite/*`: persistence mapping between SQLite rows and Domain models.
- `src/ui/pages/admin/AdminProductForm.tsx`, cart/products pages: dense UI state and forms.