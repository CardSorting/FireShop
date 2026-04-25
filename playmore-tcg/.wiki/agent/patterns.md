# Agent and Developer Patterns

## Add a Domain Rule

1. Add pure validation/calculation in `src/domain/rules.ts` or a new Domain file.
2. Use domain models/errors only.
3. Call the rule from the relevant Core service.
4. Update `architecture/schemas.md` if model contracts change.
5. Update `architecture/risk-map.md` if blast radius changes.

## Add an API Route

1. Create the route under `src/app/api/.../route.ts`.
2. Parse request input at the route boundary.
3. Call `getServerServices()` from `src/infrastructure/server/services.ts`.
4. Delegate behavior to Core services.
5. Return `NextResponse.json(...)`.
6. Add/update the corresponding browser facade method in `src/ui/apiClientServices.ts` if UI needs it.
7. Document the endpoint in `architecture/schemas.md`.

## Add a SQLite Table or Column

1. Update `src/infrastructure/sqlite/schema.ts` interfaces.
2. Update `src/infrastructure/sqlite/database.ts` table creation/migration behavior.
3. Update repository serialization/deserialization.
4. Update Domain models/interfaces only if the business contract changes.
5. Verify affected API routes.
6. Update `architecture/schemas.md` and `architecture/risk-map.md`.

## Add UI Behavior

1. Put rendering and event handling in `src/ui`.
2. Use domain types where useful.
3. Call service-shaped methods from hooks/facades; do not import SQLite or server services.
4. Keep business outcomes in Domain/Core.
5. Verify route/page behavior through the Next app.

## Touch Checkout

1. Read `architecture/risk-map.md` first.
2. Inspect `src/core/OrderService.ts` and `src/domain/rules.ts`.
3. Preserve idempotency, stock coalescing, rollback, and reconciliation behavior.
4. Verify cart, stock, payment, order, and cart-clear scenarios.
5. Update architecture docs if the flow changes.

## Documentation Synchronization

1. Run a bounded status check: `git status --short`.
2. Inspect physical files that support each claim.
3. Update the most specific `.wiki/` file in the hierarchy.
4. Add a granular `changelog.md` entry with audit inputs and verified facts.
5. Do not base current-state docs on generated files or unbounded git history.
