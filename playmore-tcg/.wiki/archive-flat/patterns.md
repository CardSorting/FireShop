# Implementation Patterns

## Add a New API Route

1. Create `src/app/api/<resource>/route.ts` or nested `[id]/route.ts`.
2. Export the needed method: `GET`, `POST`, `PATCH`, `DELETE`.
3. Call `const services = await getServerServices()` from `@infrastructure/server/services`.
4. Delegate behavior to an existing Core service or add a Core method if orchestration is missing.
5. Keep validation/business decisions in Domain/Core, not in raw route code.
6. Return `NextResponse.json(...)` and map domain errors consistently.
7. Add/update UI facade methods in `src/ui/apiClientServices.ts` if browser UI needs the route.

## Add or Change Business Rules

1. Start in `src/domain/models.ts` or `src/domain/rules.ts`.
2. Keep the code pure and testable without mocks.
3. Update Core services to invoke the rule.
4. Update repositories only if persisted shape changes.
5. Update `.wiki/schemas.md` and `.wiki/risk-map.md` if the rule affects checkout, stock, auth, or orders.

## Update DB State or Schema

1. Update `src/infrastructure/sqlite/schema.ts` TypeScript table interfaces.
2. Update `src/infrastructure/sqlite/database.ts` table creation logic.
3. Update affected SQLite repository mapping code.
4. Verify JSON-string fields (`carts.items`, `orders.items`, `orders.shippingAddress`) are serialized/deserialized safely.
5. Run `npm run build` and exercise affected API routes.

## Add a Page

1. Implement presentation in `src/ui/pages` or components in `src/ui/components`.
2. Add a thin App Router wrapper in `src/app/**/page.tsx`.
3. Use hooks/client facades for data access; do not import SQLite/server infrastructure into UI.

## Contributor Path

1. Pull latest, inspect `git status --short`.
2. Read `agent-memory.md`, `risk-map.md`, and the relevant layer docs.
3. Make the smallest layer-correct change.
4. Run `npm run lint` and `npm run build`.
5. Manually exercise impacted route/page.
6. Update `.wiki/` if architecture, API, schemas, risks, or setup changed.