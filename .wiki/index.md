# PlayMoreTCG Knowledge Ledger

Definitive architectural bridge for humans and autonomous agents working in `/Users/bozoegg/Desktop/PlayMoreTCG`.

## Navigation

### Onboarding
- [Getting Started](./onboarding/getting-started.md) — environment requirements, install, first run, verification commands.
- [Walkthrough](./onboarding/walkthrough.md) — guided tour through Domain, Core, Infrastructure, UI, and Plumbing.
- [Troubleshooting](./onboarding/troubleshooting.md) — verified operational pitfalls and recovery commands.

### Architecture
- [Overview](./architecture/overview.md) — Joy-Zoning dependency graph, request/session flow, and structural rationale.
- [Directories](./architecture/directories.md) — top-level directory dictionary with constraints.
- [Schemas](./architecture/schemas.md) — domain models, repository contracts, service interfaces, API guard behavior.
- [Decisions](./architecture/decisions.md) — ADRs protecting architectural intent.
- [Risk Map](./architecture/risk-map.md) — fragile surfaces, blast radius, and mandatory tests.

### Agent
- [Agent Memory](./agent/agent-memory.md) — condensed strict constraints for future autonomous agents.
- [Patterns](./agent/patterns.md) — repeatable implementation/audit workflows.

### Ledger
- [Changelog](./changelog.md) — granular forensic citations for verified structural changes.

## Current verified state

- Framework/runtime stack: Next.js `16.0.10` declared in `package.json`, React `19.2.5`, TypeScript `~6.0.2`, ESLint `10.2.1`, Tailwind CSS `4.2.4` with `@tailwindcss/postcss`.
- Runtime scripts from `package.json`: `npm run dev`, `npm run build`, `npm run lint`, `npm run start`.
- TypeScript path aliases from `tsconfig.json`: `@domain/*`, `@core/*`, `@infrastructure/*`, `@ui/*`, `@utils/*`.
- Domain layer files verified: `src/domain/models.ts`, `src/domain/repositories.ts`, `src/domain/rules.ts`; these define pure models, repository/service contracts, and business validation without framework or filesystem imports.
- Core composition verified in `src/core/container.ts`; it orchestrates services and wires Infrastructure adapters through lazy singleton/factory creation.
- Infrastructure server bridge verified in `src/infrastructure/server/services.ts`; it initializes SQLite through `initDatabase()` once before returning the Core service container.
- Session integrity verified in `src/infrastructure/server/session.ts`; cookies use `pm_tcg_session`, a versioned base64url payload, signed `issuedAt` / `expiresAt`, HMAC-SHA256 signature, timing-safe comparison, production `SESSION_SECRET` length enforcement, server-side expiry rejection, explicit clearing options, and HTTP-only cookie options.
- API boundary hardening verified in `src/infrastructure/server/apiGuards.ts`; routes share session/admin guards, JSON-object parsing, bounded limits, order-status parsing, required-string/integer validation, checkout/cart/product/auth transport parsing, product category/rarity parsing, production-safe unexpected-error responses, and error-to-HTTP mapping.
- Additional API boundary hardening verified in `src/infrastructure/server/apiGuards.ts`: JSON request bodies are bounded to `32 * 1024` bytes, JSON content type is enforced when present, cookie-authenticated mutations with an `Origin` header must be same-origin, and checkout idempotency keys must match `/^[a-zA-Z0-9:_-]{16,160}$/`.
- Customer cart/order API identity is session-owned in `src/app/api/cart/route.ts`, `src/app/api/cart/items/route.ts`, and `src/app/api/orders/route.ts`; these routes derive `user.id` from `requireSessionUser()`.
- Checkout placement in `src/app/api/orders/route.ts` requires `parseCheckoutRequest()` and a non-empty `paymentMethodId`; no server route now substitutes a missing payment method with `'manual'`.
- Checkout placement in `src/app/api/orders/route.ts` now forwards optional `idempotencyKey` values from the API boundary into `OrderService.placeOrder()`.
- Core checkout orchestration in `src/core/OrderService.ts` accepts optional idempotency keys for `finalizeTrustedCheckout()` and `placeOrder()` and preserves UUID fallback behavior when no key is supplied.
- Trusted checkout integration in `src/infrastructure/services/TrustedCheckoutGateway.ts` enforces production HTTPS for `CHECKOUT_ENDPOINT`, aborts outbound checkout finalization after `15_000` ms, sends the idempotency key in the `Idempotency-Key` header, and validates the external order response shape before returning a Domain `Order`.
- Cart item mutation parsing in `src/app/api/cart/items/route.ts` is centralized through `parseCartItemMutation()` / `parseProductIdMutation()` rather than route-local string/number coercion.
- Admin/product mutation authorization is session-owned in `src/app/api/admin/orders/route.ts`, `src/app/api/admin/orders/[id]/route.ts`, `src/app/api/products/route.ts`, and `src/app/api/products/[id]/route.ts`; privileged paths require `requireAdminSession()`.
- Product create/update transport parsing in `src/app/api/products/route.ts` and `src/app/api/products/[id]/route.ts` uses `parseProductDraft()` / `parseProductUpdate()` before Core product service calls.
- SQLite authentication in `src/infrastructure/services/SQLiteAuthAdapter.ts` no longer reads or writes browser `localStorage`; server session state is owned by signed HTTP-only cookies and UI state remains outside this Infrastructure adapter.
- UI API client verified in `src/ui/apiClientServices.ts`; existing cart/order service signatures still accept `userId`, but `sessionScoped(userId)` discards it and requests no longer transmit it for session-owned endpoints.
- UI checkout idempotency propagation verified in `src/ui/pages/CheckoutPage.tsx` and `src/ui/apiClientServices.ts`; checkout finalization creates a stable `checkout-ui:${crypto.randomUUID()}` attempt key, sends it to `/api/orders`, and rotates it only after order confirmation.
- Browser security headers are configured globally in `next.config.ts`: CSP, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, and `Permissions-Policy` with Stripe allowances; production `script-src` omits `'unsafe-inline'` and `'unsafe-eval'` while development keeps them for local Next.js compatibility.
- ESLint ignores generated output via `eslint.config.js`: `dist`, `.next`, `playmore-tcg/.next`, and `next-env.d.ts`.

## Physical verification commands

Run these from the repository root:

```bash
npm run lint
npm run build
git --no-pager diff --stat
git status --short
```

## Mermaid: architectural bridge

```mermaid
graph TD
  Domain[src/domain: pure models, contracts, rules]
  Core[src/core: services and composition]
  Infra[src/infrastructure + src/app/api: adapters, DB, cookies, HTTP]
  UI[src/ui + app pages: React presentation and client API facade]
  Utils[src/utils: stateless helpers]

  Core --> Domain
  Core --> Infra
  Infra --> Domain
  Infra --> Core
  Infra --> Utils
  UI --> Domain
  UI --> Utils
  UI -. HTTP only .-> Infra
```

## Modified documentation files in this synchronization

- `.wiki/index.md`
- `.wiki/changelog.md`
- `.wiki/onboarding/getting-started.md`
- `.wiki/onboarding/walkthrough.md`
- `.wiki/onboarding/troubleshooting.md`
- `.wiki/architecture/overview.md`
- `.wiki/architecture/directories.md`
- `.wiki/architecture/schemas.md`
- `.wiki/architecture/decisions.md`
- `.wiki/architecture/risk-map.md`
- `.wiki/agent/agent-memory.md`
- `.wiki/agent/patterns.md`
