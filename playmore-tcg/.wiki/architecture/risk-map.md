# Risk Map

## Checkout / Orders — High Risk

Files:

- `src/core/OrderService.ts`
- `src/domain/rules.ts`
- `src/infrastructure/services/StripePaymentProcessor.ts`
- `src/infrastructure/services/TrustedCheckoutGateway.ts`
- `src/app/api/orders/route.ts`

Why fragile: checkout coordinates cart validation, stock verification, stock deduction, payment, rollback, order creation, and cart clearing.

If touched, verify:

- Empty cart rejection.
- Insufficient stock rejection.
- Stock rollback on payment failure.
- Order creation only after successful payment.
- Cart clearing only after order success.

## SQLite Schema / Repositories — High Risk

Files:

- `src/infrastructure/sqlite/schema.ts`
- `src/infrastructure/sqlite/database.ts`
- `src/infrastructure/repositories/sqlite/*.ts`

Why fragile: schema types, table creation, serialization, and domain model mapping must stay aligned.

If touched, verify API routes that read/write the changed entity and update `architecture/schemas.md`.

## Auth / Session — Medium-High Risk

Files:

- `src/app/api/auth/*/route.ts`
- `src/infrastructure/services/SQLiteAuthAdapter.ts`
- `src/infrastructure/server/session.ts`
- `src/ui/hooks/useAuth.tsx`

Why fragile: role-based admin access and HTTP-only/session behavior depend on correct server/client boundaries.

If touched, verify sign-up, sign-in, sign-out, current-user lookup, and admin route access.

## UI API Facade — Medium Risk

File: `src/ui/apiClientServices.ts`

Why fragile: all client service calls and date revival flow through this facade.

If touched, verify customer pages and admin pages that consume service-shaped methods.

## Environment / Deployment — Medium Risk

Files:

- `.env.example`
- `next.config.ts`
- `src/infrastructure/sqlite/database.ts`
- `src/infrastructure/services/TrustedCheckoutGateway.ts`

Why fragile: missing environment values can change DB path, session safety, and checkout behavior.

If touched, update onboarding and schema docs.

## Generated Artifacts — Documentation Risk

Directories:

- `.next/`
- `dist/`
- `node_modules/`

Why fragile: these are noisy and may appear modified without representing source changes.

If touched, do not document generated internals as application architecture.
