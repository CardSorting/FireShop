# Architectural Decisions

## ADR-001: Use Next.js App Router as Framework Boundary

- Status: Active.
- Evidence: `package.json` scripts use `next`; routes and pages exist under `src/app`.
- Decision: Page and API routing are handled by Next.js App Router.
- Consequence: Browser/server boundaries must be respected. SQLite and secrets stay server-side.

## ADR-002: Preserve Joy-Zoning Layer Separation

- Status: Active.
- Evidence: `src/domain`, `src/core`, `src/infrastructure`, `src/ui`, and `src/utils` directories exist and are referenced in README.
- Decision: Place pure rules in Domain, orchestration in Core, adapters in Infrastructure, rendering in UI, and stateless helpers in Utils.
- Consequence: Refactors must avoid moving I/O into Domain or direct Infrastructure imports into UI.

## ADR-003: SQLite + Kysely Persistence

- Status: Active.
- Evidence: `better-sqlite3` and `kysely` dependencies; `src/infrastructure/sqlite/database.ts` initializes Kysely with `SqliteDialect`.
- Decision: Use SQLite for local/server persistence with typed schema interfaces.
- Consequence: Schema changes require updates in `schema.ts`, `database.ts`, repositories, and this ledger.

## ADR-004: Service Container Provides Composition Root

- Status: Active.
- Evidence: `src/core/container.ts` wires SQLite repositories, auth adapter, payment processor, and services.
- Decision: Use `getInitialServices()` singleton container for production service access and `getServiceContainer()` factory for isolated instances.
- Consequence: Changes to adapter wiring should be made in one place and verified through API routes.

## ADR-005: Browser Uses API Facade Instead of Direct Infrastructure

- Status: Active.
- Evidence: `src/ui/apiClientServices.ts` uses `fetch('/api/...')` and imports only domain types.
- Decision: UI talks to local API routes through a service-shaped facade.
- Consequence: Do not import SQLite repositories or server services into client components.

## ADR-006: Trusted Checkout Boundary Exists but Requires Configuration

- Status: Active.
- Evidence: `TrustedCheckoutGateway.ts` reads `CHECKOUT_ENDPOINT`; `OrderService.ts` supports `finalizeTrustedCheckout`.
- Decision: Production-safe checkout finalization can be delegated to a trusted backend endpoint.
- Consequence: Deployment must configure endpoint/payment behavior before considering checkout production-final.
