# Changelog

## 2026-04-26 — Third deep audit pass: checkout idempotency propagation, bounded JSON bodies, origin checks, and trusted checkout response validation

### Problem verified

- `src/core/OrderService.ts` generated a fresh trusted-checkout idempotency key for each finalization attempt, so the UI/API path could not preserve one stable retry key across refresh/retry of the same checkout attempt.
- `src/app/api/orders/route.ts` parsed checkout requests without accepting or forwarding an optional client attempt idempotency key.
- `src/infrastructure/server/apiGuards.ts::readJsonObject()` accepted JSON bodies without an explicit body-size ceiling, content-type enforcement, or same-origin mutation check for cookie-authenticated write requests.
- `src/infrastructure/services/TrustedCheckoutGateway.ts` called the configured checkout endpoint without a timeout/abort signal, without enforcing HTTPS for production endpoints, and returned `response.json()` as `Order` without validating the external response shape.
- `src/ui/pages/CheckoutPage.tsx` did not retain a stable checkout-attempt key for the lifecycle of a payment authorization/finalization attempt.

### Remediation performed

- Updated `src/core/OrderService.ts` so `finalizeTrustedCheckout()` and `placeOrder()` accept an optional `idempotencyKey`; Core now forwards a supplied key to either the trusted checkout gateway or the payment processor while preserving UUID fallback behavior when no key is supplied.
- Updated `src/app/api/orders/route.ts` to read `idempotencyKey` from `parseCheckoutRequest()` and pass it into `orderService.placeOrder()`.
- Extended `src/infrastructure/server/apiGuards.ts` with:
  - `MAX_JSON_BODY_BYTES` set to `32 * 1024` for request body bounds.
  - `assertTrustedMutationOrigin()` for same-origin validation on non-GET/HEAD/OPTIONS requests when an `Origin` header is present.
  - content-type enforcement for JSON body parsing.
  - raw body byte-length validation before JSON parsing.
  - `parseIdempotencyKey()` with the accepted pattern `/^[a-zA-Z0-9:_-]{16,160}$/`.
  - `parseCheckoutRequest()` returning optional `idempotencyKey` in addition to `shippingAddress` and `paymentMethodId`.
- Hardened `src/infrastructure/services/TrustedCheckoutGateway.ts` with:
  - a `15_000` ms abort timeout for trusted checkout fetches.
  - production HTTPS enforcement for `CHECKOUT_ENDPOINT`.
  - runtime validation of returned order status, address, items, totals, payment transaction id, and timestamps before converting the external payload to a Domain `Order`.
- Updated `src/ui/apiClientServices.ts` so `finalizeTrustedCheckout()` and `placeOrder()` can transmit an optional `idempotencyKey` to `/api/orders`.
- Updated `src/ui/pages/CheckoutPage.tsx` to create a stable `checkout-ui:${crypto.randomUUID()}` key in a `useRef`, send it with checkout finalization, and rotate it only after an order is confirmed.

### Verification evidence

- `npm run lint && npm run build` completed successfully after the hardening pass.
- The successful build completed Next.js production compilation, TypeScript validation, page-data collection, static page generation for 22 app routes, and listed dynamic API routes including `/api/orders`.
- `git --no-pager diff -- src/core/OrderService.ts src/infrastructure/server/apiGuards.ts src/app/api/orders/route.ts src/infrastructure/services/TrustedCheckoutGateway.ts src/ui/apiClientServices.ts src/ui/pages/CheckoutPage.tsx` verified the exact modified source files for this pass.

### Files intentionally changed in this pass

- `src/core/OrderService.ts`
- `src/infrastructure/server/apiGuards.ts`
- `src/app/api/orders/route.ts`
- `src/infrastructure/services/TrustedCheckoutGateway.ts`
- `src/ui/apiClientServices.ts`
- `src/ui/pages/CheckoutPage.tsx`
- `.wiki/changelog.md`
- `.wiki/index.md`

### Architectural notes

- Domain remained unchanged and pure; no HTTP, cookie, fetch, database, or framework concerns were added to `src/domain`.
- Core continues to orchestrate via Domain repository/service interfaces and delegates external checkout I/O to the Infrastructure `ICheckoutGateway` implementation.
- Infrastructure owns transport hardening, request parsing, same-origin checks, endpoint timeout behavior, and external response validation.
- UI only generates and carries a retry key as presentation/session state; it does not compute checkout totals, stock outcomes, or payment results.

## 2026-04-25 — Second deep audit pass: transport parsing, checkout payment requirement, session expiry, and CSP tightening

### Problem verified

- `src/app/api/orders/route.ts` accepted checkout payloads by casting `shippingAddress as never` and substituted missing `paymentMethodId` with the literal fallback `'manual'`, allowing the HTTP boundary to bypass explicit payment-method presence.
- `src/app/api/cart/items/route.ts` coerced untrusted JSON with `String(productId ?? '')` and `Number(quantity)`, allowing malformed transport data to cross into Core before explicit type validation.
- `src/app/api/products/route.ts` and `src/app/api/products/[id]/route.ts` passed admin product create/update JSON through broad casts instead of parsing transport payload shape at the Infrastructure boundary.
- `src/app/api/auth/sign-in/route.ts` and `src/app/api/auth/sign-up/route.ts` read raw `request.json()` directly and returned route-local error mappings instead of the shared API guard path.
- `src/infrastructure/server/session.ts` cryptographically signed session cookies but did not embed signed `issuedAt` / `expiresAt` values for server-side expiry rejection.
- `src/infrastructure/services/SQLiteAuthAdapter.ts` mixed SQLite server authentication with browser `localStorage` persistence, creating cross-context auth-state leakage in an Infrastructure adapter.
- `next.config.ts` always emitted CSP `script-src` with `'unsafe-inline'` and `'unsafe-eval'`, including production builds.

### Remediation performed

- Extended `src/infrastructure/server/apiGuards.ts` with transport parsers and strict helpers:
  - `requireInteger()` for JSON numbers that must already be whole numbers.
  - `optionalString()` for optional string fields without broad coercion.
  - `requireProductCategory()` and `optionalCardRarity()` for ecommerce enum parsing.
  - `parseCartItemMutation()` and `parseProductIdMutation()` for cart item API bodies.
  - `parseShippingAddress()` and `parseCheckoutRequest()` for checkout payloads.
  - `parseProductDraft()` and `parseProductUpdate()` for admin product mutations.
- Updated `src/app/api/orders/route.ts` to call `parseCheckoutRequest()` and require a non-empty `paymentMethodId`; the previous `'manual'` fallback was removed.
- Updated `src/app/api/cart/items/route.ts` to parse cart mutations through shared guards rather than `String(...)` / `Number(...)` request coercions.
- Updated product mutation routes to parse `ProductDraft` / `ProductUpdate` through shared Infrastructure guards before calling Core services.
- Updated auth sign-in/sign-up routes to use `readJsonObject()`, `requireString()`, and `jsonError()`.
- Updated `jsonError()` in `src/infrastructure/server/apiGuards.ts` to log unexpected errors through `src/utils/logger.ts` and return fallback messages for unexpected production 500 responses while preserving expected Domain/Auth/Unauthorized/ProductNotFound messages.
- Updated `src/infrastructure/server/session.ts` so the signed session payload includes `issuedAt` and `expiresAt`; `decodeSession()` rejects expired or malformed signed payloads server-side, and `clearSessionUser()` now clears with explicit cookie options.
- Removed all `localStorage` reads/writes from `src/infrastructure/services/SQLiteAuthAdapter.ts`; the adapter now remains a SQLite-backed auth provider without browser persistence concerns.
- Updated `next.config.ts` so production `script-src` omits `'unsafe-inline'` and `'unsafe-eval'`; those allowances remain only outside production for local Next.js development compatibility.

### Verification evidence

- `npm run lint && npm run build` completed successfully after this pass.
- `npm run build` completed Next.js production compilation, TypeScript validation, page-data collection, and route generation for 22 app routes.
- Targeted audit search found no remaining `as never`, no `localStorage`, no `paymentMethodId || 'manual'`, no unsafe cart `String(... ?? ...)` or `Number(quantity)` coercion patterns in `src`; the only `request.json()` occurrence is centralized inside `src/infrastructure/server/apiGuards.ts::readJsonObject()`.

### Files intentionally changed in this pass

- `next.config.ts`
- `src/infrastructure/server/apiGuards.ts`
- `src/infrastructure/server/session.ts`
- `src/infrastructure/services/SQLiteAuthAdapter.ts`
- `src/app/api/auth/sign-in/route.ts`
- `src/app/api/auth/sign-up/route.ts`
- `src/app/api/cart/items/route.ts`
- `src/app/api/orders/route.ts`
- `src/app/api/products/route.ts`
- `src/app/api/products/[id]/route.ts`
- `.wiki/index.md`
- `.wiki/changelog.md`

### Architectural notes

- Domain remained unchanged and pure; no HTTP, cookie, crypto, database, or framework concerns were moved into `src/domain`.
- Core service APIs remained unchanged; the hardening is concentrated at Infrastructure HTTP/session/adapter boundaries.
- UI behavior was not changed in this pass; server validation is authoritative for malformed or missing checkout/cart/product/auth payloads.

## 2026-04-25 — Deep production hardening pass: signed sessions, API authorization, and headers

### Problem verified

- Customer cart and order API routes accepted `userId` from request query strings or JSON bodies, creating an IDOR risk at the HTTP boundary.
- Admin order APIs and product mutation APIs did not consistently require a verified admin session before exposing or mutating privileged resources.
- `src/infrastructure/server/session.ts` stored the session payload as base64url JSON without a cryptographic signature, so cookie integrity was not enforced before trusting user and role fields.
- API request parsing was route-local and inconsistent for malformed JSON, pagination limits, and order-status values.
- `next.config.ts` did not apply baseline browser security headers.
- `npm run lint` initially scanned generated nested Next output under `playmore-tcg/.next`, producing generated-file lint failures unrelated to application source.

### Remediation performed

- Updated `src/infrastructure/server/session.ts` to encode versioned session payloads as `payload.signature`, where the signature is HMAC-SHA256 using `SESSION_SECRET`.
- Added timing-safe signature comparison and payload shape validation before returning a `User` from `getSessionUser()`.
- Added `src/infrastructure/server/apiGuards.ts` with:
  - `requireSessionUser()` for authenticated customer API access.
  - `requireAdminSession()` for privileged API access.
  - `readJsonObject()` for JSON-object body enforcement.
  - `parseBoundedLimit()` for pagination clamping.
  - `parseOrderStatus()` for allowed order status values.
  - `jsonError()` for consistent Domain/Auth/Unauthorized/Product-not-found response mapping.
- Updated customer cart and order routes to derive `user.id` from the signed session rather than trusting request-supplied identity:
  - `src/app/api/cart/route.ts`
  - `src/app/api/cart/items/route.ts`
  - `src/app/api/orders/route.ts`
- Updated admin and product mutation routes to require admin sessions and validate incoming request data:
  - `src/app/api/admin/orders/route.ts`
  - `src/app/api/admin/orders/[id]/route.ts`
  - `src/app/api/products/route.ts`
  - `src/app/api/products/[id]/route.ts`
- Updated `src/ui/apiClientServices.ts` so cart/order client calls no longer send `userId` to session-owned API endpoints while preserving existing UI-facing method signatures.
- Updated `next.config.ts` to emit baseline security headers for all routes, with CSP allowances for Stripe script/connect/frame usage.
- Updated `eslint.config.js` to ignore `playmore-tcg/.next` generated output.

### Verification evidence

- `npm run lint` completed without reported lint errors after generated nested `.next` output was ignored and source lint issues were resolved.
- `npm run build` completed successfully.
- The successful build used Next.js `16.2.4`, completed TypeScript validation, collected page data, generated 22 static pages, and listed dynamic API routes including `/api/cart`, `/api/orders`, `/api/admin/orders`, `/api/products`, and `/api/products/[id]`.

### Files intentionally changed

- `src/infrastructure/server/session.ts`
- `src/infrastructure/server/apiGuards.ts`
- `src/app/api/cart/route.ts`
- `src/app/api/cart/items/route.ts`
- `src/app/api/orders/route.ts`
- `src/app/api/admin/orders/route.ts`
- `src/app/api/admin/orders/[id]/route.ts`
- `src/app/api/products/route.ts`
- `src/app/api/products/[id]/route.ts`
- `src/ui/apiClientServices.ts`
- `next.config.ts`
- `eslint.config.js`
- `.wiki/index.md`
- `.wiki/changelog.md`

### Architectural notes

- Domain remained pure; no framework, cookie, crypto, database, or fetch imports were added to `src/domain`.
- Core service signatures were preserved; identity enforcement moved to the Infrastructure HTTP boundary.
- Infrastructure now owns session integrity, request parsing, API authorization, and deployment headers.
- UI continues dispatching service intentions but no longer acts as the authority for customer identity on cart/order requests.

## 2026-04-25 — Initialized Tailwind CSS v4 PostCSS pipeline

### Problem verified

- The app was reported as rendering blank with Tailwind CSS not working as intended.
- The project used Tailwind CSS v4 syntax in `src/index.css` with `@import "tailwindcss";` and `@theme` tokens.
- The project had `tailwindcss` installed but did not have the Tailwind v4 PostCSS bridge package `@tailwindcss/postcss` or a root `postcss.config.*` file.

### Remediation performed

- Installed `@tailwindcss/postcss` as a development dependency.
- Added `postcss.config.mjs` with the `@tailwindcss/postcss` plugin.
- Added `tailwind.config.ts` with explicit content globs for:
  - `./src/app/**/*.{js,ts,jsx,tsx,mdx}`
  - `./src/ui/**/*.{js,ts,jsx,tsx,mdx}`
  - `./src/core/**/*.{js,ts,jsx,tsx,mdx}`
- Preserved the existing global stylesheet path: `src/app/layout.tsx` imports `../index.css`.

### Verification evidence

- `npm run build` completed successfully after the Tailwind initialization changes.
- `npm run start -- -p 3020` served `/` with HTTP `200`.
- The rendered HTML included a stylesheet reference: `/_next/static/chunks/0w82n6tqno.lj.css`.
- The compiled CSS asset contained expected Tailwind utilities used by the UI, including `.bg-primary-700`, `.text-primary-700`, `.min-h-screen`, `.flex-col`, and `.bg-gray-50`.

### Files intentionally changed

- `package.json` and `package-lock.json` were updated by installing `@tailwindcss/postcss`.
- `postcss.config.mjs` was added for Tailwind v4 PostCSS initialization.
- `tailwind.config.ts` was added for explicit utility content scanning.
- `.wiki/index.md` and `.wiki/changelog.md` document this verified repair.

### Notes

- No Domain or Core source-code changes were required.
- No UI component source-code changes were required; the repair was limited to build/styling initialization.

## 2026-04-25 — Rebuilt `better-sqlite3` for active Node runtime

### Problem verified

- The application failed on `GET /api/products?limit=4` with `ERR_DLOPEN_FAILED` when `src/infrastructure/sqlite/database.ts` attempted to instantiate `better-sqlite3`.
- The native module at `node_modules/better-sqlite3/build/Release/better_sqlite3.node` had been compiled for `NODE_MODULE_VERSION 131`.
- The active shell/runtime reported Node.js `v20.19.5`, which requires `NODE_MODULE_VERSION 115`.

### Remediation performed

- Ran `npm rebuild better-sqlite3` from `/Users/bozoegg/Desktop/PlayMoreTCG`.
- This rebuilt the installed native dependency artifact for the currently active Node.js runtime.

### Verification evidence

- Direct native module load check succeeded:
  - Command shape: `node -e "const sqlite = require('better-sqlite3'); const db = new sqlite(':memory:'); ..."`
  - Observed output: `better-sqlite3 loads under v20.19.5 ABI 115`
- Production build succeeded with `npm run build`.
- Next.js build completed route generation for dynamic API routes including `/api/products` and `/api/products/[id]`.

### Files intentionally changed

- `node_modules/better-sqlite3/build/Release/better_sqlite3.node` was modified by `npm rebuild better-sqlite3`.
- `.wiki/index.md` and `.wiki/changelog.md` document this verified repair.

### Notes

- No Domain, Core, UI, or application source-code changes were required.
- The `/sw.js 404` log is separate from the SQLite native binding failure and was not remediated as part of this repair.