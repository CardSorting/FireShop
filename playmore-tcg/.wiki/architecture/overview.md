# Architecture Overview

PlayMoreTCG is a Next.js App Router e-commerce application organized with Joy-Zoning layers.

## Layer Diagram

```mermaid
flowchart TD
  Browser[Browser / React UI] --> UI[src/ui]
  UI --> ApiClient[src/ui/apiClientServices.ts]
  ApiClient --> Routes[src/app/api route handlers]
  Routes --> ServerServices[src/infrastructure/server/services.ts]
  ServerServices --> Container[src/core/container.ts]
  Container --> Core[src/core services]
  Core --> Domain[src/domain models rules interfaces]
  Core --> InfraRepos[src/infrastructure repositories/services]
  InfraRepos --> SQLite[(SQLite via better-sqlite3 + Kysely)]
  Routes --> NextPages[src/app page/layout files]
```

## Dependency Rules

```mermaid
flowchart LR
  Domain[src/domain] --> None[No external I/O]
  Core[src/core] --> Domain
  Core --> Infrastructure[src/infrastructure]
  Infrastructure --> Domain
  UI[src/ui] --> Domain
  UI --> Api[Local /api facade]
  Utils[src/utils] --> Pure[Stateless helpers]
```

- Domain owns pure models, repository contracts, errors, and rules.
- Core orchestrates use cases and composes domain behavior with adapters.
- Infrastructure implements persistence, auth, payment, server sessions, and SQLite initialization.
- UI renders and dispatches intentions through API facades/hooks.
- App Router files are framework boundaries for pages and API routes.

## Verified Runtime Flow

```mermaid
sequenceDiagram
  participant U as UI Page
  participant C as apiClientServices
  participant R as Next API Route
  participant S as getServerServices
  participant O as Core Service
  participant D as Domain Rules
  participant DB as SQLite Adapter

  U->>C: service-shaped method call
  C->>R: fetch('/api/...')
  R->>S: getServerServices()
  S->>DB: initDatabase() once
  S->>O: getInitialServices()
  O->>D: validate/compute
  O->>DB: repository interface call
  DB-->>O: domain model data
  O-->>R: result
  R-->>C: JSON
  C-->>U: revived dates/result
```

## Logic Density

Observed primary logic hotspots:

- `src/domain/rules.ts`: validation, stock, cart, and order pure rules.
- `src/core/OrderService.ts`: checkout orchestration and rollback/reconciliation handling.
- `src/core/container.ts`: composition root and singleton/factory service creation.
- `src/infrastructure/sqlite/database.ts`: schema creation and SQLite pragmas.
- `src/ui/apiClientServices.ts`: browser HTTP facade and date revival.
- Admin/customer pages under `src/ui/pages/**`: interactive presentation flows.

## Structural Mentorship

When adding behavior, first decide whether it is a rule, orchestration step, adapter concern, or presentation concern. Put validation and deterministic calculations in Domain, use Core for multi-step use cases, keep SQLite/fetch/session details in Infrastructure or route handlers, and keep UI focused on rendering and event dispatch.
