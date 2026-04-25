# Architectural Decision Records

## ADR-001: Next.js App Router as Runtime Shell

- Decision: Use `src/app` for pages, layouts, and API routes.
- Evidence: `package.json` scripts use Next; route handlers exist under `src/app/api/**/route.ts`.
- Why: Co-locates server route handlers with page wrappers and supports server-only SQLite access.

## ADR-002: SQLite via `better-sqlite3` and Kysely

- Decision: Use SQLite as local persistence with Kysely typing.
- Evidence: dependencies include `better-sqlite3` and `kysely`; `database.ts` creates a `SqliteDialect`.
- Why: Simple local ecommerce persistence without a separate DB service.

## ADR-003: Joy-Zoning Layer Split

- Decision: Preserve Domain/Core/Infrastructure/UI/Plumbing separation.
- Evidence: source directories and imports use `@domain`, `@core`, `@infrastructure`, `@ui`, `@utils` aliases.
- Why: Keeps pure business rules distinct from persistence, routing, and rendering.

## ADR-004: API Facade for Browser UI

- Decision: Browser UI calls local `/api/*` routes through `src/ui/apiClientServices.ts` rather than direct SQLite repositories.
- Why: SQLite and secrets are server-only concerns.

## ADR-005: Singleton Production Service Container

- Decision: `getInitialServices()` caches repository/provider/payment instances.
- Evidence: module-level caches in `src/core/container.ts`.
- Why: Consistent app-wide services and avoided eager initialization/circular timing problems.

## ADR-006: Checkout Requires Server Trust Boundary

- Decision: `OrderService.finalizeTrustedCheckout` uses `ICheckoutGateway` when configured and rejects browser-side finalization without a trusted endpoint.
- Evidence: `OrderService.ts` and `TrustedCheckoutGateway.ts`.
- Why: Payment capture and finalization must remain server-authoritative.