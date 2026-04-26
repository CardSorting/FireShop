# Changelog

## 2026-04-26 — Admin panel merchant-operations UX upgrade

### Problem verified

- The admin navigation in `src/ui/layouts/AdminLayout.tsx` exposed only basic Dashboard / Products / Orders links and did not guide non-technical staff through common ecommerce operating workflows.
- Product and inventory work shared the same product table, making daily restock decisions less direct than popular ecommerce admin strategies that separate catalog setup from stock-room operations.
- `src/domain/models.ts` and `src/domain/rules.ts` lacked pure operating vocabulary for inventory health, fulfillment buckets, and staff action items.
- `src/core/ProductService.ts` did not expose an inventory overview read model for stock health counts, inventory value, and restock-priority rows.
- `src/core/OrderService.ts::getAdminDashboardSummary()` did not yet include fulfillment pipeline counts, out-of-stock counts, or explicit action items for staff.
- No protected `/api/admin/inventory` backend endpoint or `/admin/inventory` admin page existed.
- `src/ui/pages/admin/AdminProductForm.tsx` was a single technical form rather than a guided merchant setup experience with preview/help copy.
- The admin pages lacked a unified component library, leading to inconsistent layouts and non-standard merchant UI patterns.

### Remediation performed

- Created a reusable admin UI library in `src/ui/components/admin/AdminComponents.tsx` featuring premium cards, headers, status badges, and empty states.
- Extended `src/domain/models.ts` with pure admin operations types: `InventoryHealth`, `FulfillmentBucket`, `AdminActionItem`, expanded `AdminDashboardSummary`, and `InventoryOverview`.
- Extended `src/domain/rules.ts` with pure classification helpers: `classifyInventoryHealth()`, `classifyFulfillmentBucket()`, and `nextOrderActionLabel()`.
- Added `ProductService.getInventoryOverview()` in `src/core/ProductService.ts`; Core now derives inventory health counts, total units, inventory value, and sorted restock-priority products from the product repository.
- Expanded `OrderService.getAdminDashboardSummary()` in `src/core/OrderService.ts` with fulfillment counts, out-of-stock count, low/out-of-stock watchlist logic, and priority action items linking staff to order or inventory workflows.
- Added protected Infrastructure endpoint `src/app/api/admin/inventory/route.ts`; `GET` requires `requireAdminSession()` and returns the Core inventory overview via shared `jsonError()` handling.
- Added `productService.getInventoryOverview()` to `src/ui/apiClientServices.ts` and routed it to `/api/admin/inventory`.
- Added `/admin/inventory` through `src/app/admin/inventory/page.tsx` and `src/ui/pages/admin/AdminInventory.tsx`, with stock health filtering, search, plain-language restock actions, inventory KPI cards, and edit-product links.
- Reworked `src/ui/layouts/AdminLayout.tsx` into a more approachable store-manager shell with Home, Orders, Inventory, Products, plus disabled/coming-soon Insights and Help cards.
- Upgraded `src/ui/pages/admin/AdminDashboard.tsx` into a “Today’s work” command center with action cards, fulfillment pipeline, out-of-stock KPI, ready-to-ship KPI, and clearer staff guidance.
- Upgraded `src/ui/pages/admin/AdminOrders.tsx` with a timeline-style status tracker for expanded orders, fulfillment status tabs, and better visual grouping.
- Upgraded `src/ui/pages/admin/AdminProductForm.tsx` with merchant guidance copy, sectioned layout, sticky customer preview card, and staff tip panel.
- Unified admin navigation in `src/ui/layouts/AdminLayout.tsx` with active link state detection and a global quick-action button.

### Verification evidence

- `npm run lint` completed successfully after the merchant-operations upgrade.
- `npm run build` completed successfully after the merchant-operations upgrade.
- The successful production build generated 25 app routes and listed new routes `/admin/inventory` and `/api/admin/inventory` alongside existing admin routes.

### Files intentionally changed in this pass

- `src/domain/models.ts`
- `src/domain/rules.ts`
- `src/core/ProductService.ts`
- `src/core/OrderService.ts`
- `src/app/api/admin/inventory/route.ts`
- `src/app/admin/inventory/page.tsx`
- `src/ui/apiClientServices.ts`
- `src/ui/layouts/AdminLayout.tsx`
- `src/ui/pages/admin/AdminInventory.tsx`
- `src/ui/pages/admin/AdminDashboard.tsx`
- `src/ui/pages/admin/AdminOrders.tsx`
- `src/ui/pages/admin/AdminProductForm.tsx`
- `.wiki/changelog.md`
- `.wiki/index.md`

### Architectural notes

- Domain additions are pure classifications/read-model shapes with no I/O, framework, database, or UI imports.
- Core owns orchestration and aggregation for dashboard/inventory read models.
- Infrastructure owns admin HTTP/session protection for `/api/admin/inventory` only.
- UI owns merchant-friendly navigation, staff copy, filtering, preview rendering, and workflow presentation.

## 2026-04-26 — Admin backend operations upgrade

### Problem verified

- The admin dashboard in `src/ui/pages/admin/AdminDashboard.tsx` loaded generic product and order lists client-side and computed only basic product/revenue/pending-order values in the UI.
- `src/core/OrderService.ts` did not expose a dedicated admin dashboard summary orchestration method for operational KPIs, recent orders, or low-stock inventory.
- There was no dedicated protected dashboard endpoint under `src/app/api/admin` for a backend-admin summary payload.
- `src/ui/pages/admin/AdminOrders.tsx` provided a simple order table/status dropdown but lacked status filtering, operator search, expanded fulfillment/shipping/payment detail inspection, error banners, and pagination controls.
- `src/ui/pages/admin/AdminProducts.tsx` provided CRUD table basics but lacked catalog search, category filtering, stock-health filtering, KPI cards, and load/delete error reporting.

### Remediation performed

- Added `AdminDashboardSummary` to `src/domain/models.ts` as a pure Domain shape for admin dashboard data: product count, low-stock count, total revenue, average order value, order counts by status, recent orders, and low-stock products.
- Added `OrderService.getAdminDashboardSummary()` in `src/core/OrderService.ts`; Core now orchestrates order/product repository reads, computes non-cancelled revenue, average order value, status counts, recent orders, and a low-stock product watchlist.
- Added protected Infrastructure route `src/app/api/admin/dashboard/route.ts`; `GET` requires `requireAdminSession()` and returns the Core dashboard summary through `jsonError()` handling.
- Extended `src/ui/apiClientServices.ts` with `orderService.getAdminDashboardSummary()` targeting `/api/admin/dashboard`.
- Added `src/utils/formatters.ts` with stateless formatting/search helpers: currency, short date, order status/category humanization, and search normalization.
- Rebuilt `src/ui/pages/admin/AdminDashboard.tsx` into an admin command center using the dedicated summary endpoint, KPI cards, recent order activity, low-stock watchlist, and controlled loading/error states.
- Upgraded `src/ui/pages/admin/AdminOrders.tsx` with status filtering, client search across order/customer/transaction/item values, cursor-based next-page controls, safe next-status dropdown options aligned with the Domain state machine, expanded order detail rows, and status-mutation error handling.
- Upgraded `src/ui/pages/admin/AdminProducts.tsx` with catalog search, category filtering, low/healthy stock filtering, product/low-stock/filtered KPI cards, formatted prices/categories, empty-state messaging, and delete/load error banners.
- Admin order processing now labels the status workflow as “Next action” and uses Domain-derived plain-language action labels from `nextOrderActionLabel()`, plus a timeline-style status tracker in the expanded view.
- Reusable admin UI library verified in `src/ui/components/admin/AdminComponents.tsx`; it provides `AdminPageHeader`, `AdminMetricCard`, `AdminActionPanel`, `AdminStatusBadge`, and `AdminEmptyState` for consistent, premium merchant experiences.
- Admin shell navigation in `src/ui/layouts/AdminLayout.tsx` now uses `usePathname` for active highlighting and includes a “Quick Action” product creation button.
- Formatting/search plumbing verified in `src/utils/formatters.ts`; stateless helpers format USD cents, short dates, status/category labels, and normalized search strings without importing app-specific layers.

### Verification evidence

- `npm run lint` completed successfully after the admin backend upgrade.
- `npm run build` completed successfully after the admin backend upgrade.
- The successful production build listed the new dynamic route `/api/admin/dashboard` alongside existing admin order/product routes.

### Files intentionally changed in this pass

- `src/domain/models.ts`
- `src/core/OrderService.ts`
- `src/app/api/admin/dashboard/route.ts`
- `src/ui/apiClientServices.ts`
- `src/ui/pages/admin/AdminDashboard.tsx`
- `src/ui/pages/admin/AdminOrders.tsx`
- `src/ui/pages/admin/AdminProducts.tsx`
- `src/utils/formatters.ts`
- `.wiki/changelog.md`
- `.wiki/index.md`

### Architectural notes

- Domain remains pure; it received only a serializable admin summary type.
- Core owns dashboard summary orchestration and aggregate KPI calculation over repository data.
- Infrastructure owns the protected admin HTTP endpoint and session/admin enforcement.
- UI renders admin state and dispatches service intentions through the existing API client facade.
- Plumbing helpers remain stateless and layer-agnostic; `src/utils/formatters.ts` intentionally avoids imports from Domain/Core/Infrastructure/UI.

## 2026-04-26 — Thirteenth deep audit pass: rate-limit HTTP semantics

### Problem verified

- The lightweight throttling added in `src/infrastructure/server/apiGuards.ts` stopped excessive mutation attempts, but exhausted buckets surfaced through `UnauthorizedError`, which mapped to HTTP 403 rather than HTTP 429.
- Rate-limited clients did not receive a `Retry-After` hint, making production retry/backoff behavior less explicit.

### Remediation performed

- Added an Infrastructure-local `RateLimitError` in `src/infrastructure/server/apiGuards.ts` carrying `retryAfterSeconds`.
- Updated `assertRateLimit()` to throw `RateLimitError` with the remaining fixed-window reset time when a bucket exceeds its allowed attempts.
- Updated `jsonError()` so `RateLimitError` is treated as an expected error, maps to HTTP `429`, and includes a `Retry-After` response header.

### Verification evidence

- `npm run lint && npm run build` completed successfully after this pass.
- The successful build completed Next.js production compilation, TypeScript validation, page-data collection, static generation for 22 app routes, and retained dynamic auth/checkout API routes.

### Files intentionally changed in this pass

- `src/infrastructure/server/apiGuards.ts`
- `.wiki/changelog.md`
- `.wiki/index.md`

### Architectural notes

- HTTP status and retry headers remain Infrastructure response-mapping concerns.
- Domain, Core, and UI were unchanged in this pass.

## 2026-04-26 — Twelfth deep audit pass: lightweight mutation abuse throttling

### Problem verified

- Authentication mutation routes were protected by validation and origin checks but had no application-level throttling to slow repeated credential or registration attempts.
- Checkout placement was protected by session ownership, idempotency, and locking, but had no request-rate guard before invoking session/cart/payment orchestration.
- `src/infrastructure/server/apiGuards.ts` did not provide a shared rate-limit primitive for high-risk HTTP mutation routes.

### Remediation performed

- Added an Infrastructure-local in-memory fixed-window throttle in `src/infrastructure/server/apiGuards.ts`:
  - `assertRateLimit(request, scope, maxAttempts, windowMs)`.
  - Client fingerprinting based on first `x-forwarded-for` value, `x-real-ip`, and a bounded `user-agent` segment.
  - Bucket pruning once bucket count reaches `10_000` to reduce unbounded memory growth risk.
  - Controlled `UnauthorizedError('Too many requests. Please wait and try again.')` on limit exhaustion.
- Applied `assertRateLimit(request, 'auth:sign-in', 10, 60_000)` to `src/app/api/auth/sign-in/route.ts` before JSON parsing and authentication provider calls.
- Applied `assertRateLimit(request, 'auth:sign-up', 5, 60_000)` to `src/app/api/auth/sign-up/route.ts` before JSON parsing and account creation.
- Applied `assertRateLimit(request, 'checkout:place-order', 12, 60_000)` to `src/app/api/orders/route.ts` before session/cart/checkout orchestration.

### Verification evidence

- `npm run lint && npm run build` completed successfully after this pass.
- The successful build completed Next.js production compilation, TypeScript validation, page-data collection, static generation for 22 app routes, and retained dynamic routes for `/api/auth/sign-in`, `/api/auth/sign-up`, and `/api/orders`.

### Files intentionally changed in this pass

- `src/infrastructure/server/apiGuards.ts`
- `src/app/api/auth/sign-in/route.ts`
- `src/app/api/auth/sign-up/route.ts`
- `src/app/api/orders/route.ts`
- `.wiki/changelog.md`
- `.wiki/index.md`

### Architectural notes

- Rate limiting is an Infrastructure HTTP-boundary concern; no Domain or Core changes were introduced.
- This is a lightweight per-process throttle, not a distributed production rate limiter. Multi-instance deployments should still place a shared edge/API-gateway limiter in front of these routes.

## 2026-04-26 — Eleventh deep audit pass: no-body mutation CSRF/origin coverage

### Problem verified

- `src/infrastructure/server/apiGuards.ts::assertTrustedMutationOrigin()` was hardened for mutation requests, but routes that did not parse a JSON body could bypass it because they never called `readJsonObject()`.
- `src/app/api/auth/sign-out/route.ts::POST()` cleared the signed session cookie without receiving a `Request`, so origin/fetch-site policy could not be applied to sign-out attempts.
- `src/app/api/cart/route.ts::DELETE()` cleared the current user's cart without applying the shared mutation-origin guard because it has no JSON request body.
- `src/app/api/products/[id]/route.ts::DELETE()` deleted admin products without applying the shared mutation-origin guard because it has no JSON request body.

### Remediation performed

- Updated `src/app/api/auth/sign-out/route.ts` so `POST(request: Request)` calls `assertTrustedMutationOrigin(request)` before clearing the session and wraps failures through `jsonError()`.
- Updated `src/app/api/cart/route.ts` so `DELETE(request: Request)` calls `assertTrustedMutationOrigin(request)` before resolving the session user and clearing the cart.
- Updated `src/app/api/products/[id]/route.ts` so `DELETE(request: Request)` calls `assertTrustedMutationOrigin(request)` before admin authorization and product deletion.
- Audited route handlers with `grep` for no-argument mutation handlers and `_request` mutation handlers; no remaining matches were found under `src/app/api`.

### Verification evidence

- `grep -R "export async function \\(POST\\|PUT\\|PATCH\\|DELETE\\)()\\|export async function \\(POST\\|PUT\\|PATCH\\|DELETE\\)(_request" -n src/app/api --include='route.ts' || true` returned no route-handler matches.
- `npm run lint && npm run build` completed successfully after this pass.
- The successful build completed Next.js production compilation, TypeScript validation, page-data collection, static generation for 22 app routes, and retained dynamic API routes including `/api/auth/sign-out`, `/api/cart`, and `/api/products/[id]`.

### Files intentionally changed in this pass

- `src/app/api/auth/sign-out/route.ts`
- `src/app/api/cart/route.ts`
- `src/app/api/products/[id]/route.ts`
- `.wiki/changelog.md`
- `.wiki/index.md`

### Architectural notes

- The new checks remain at the Infrastructure HTTP boundary.
- Domain, Core, and UI were unchanged in this pass.
- Shared origin/fetch-site policy now covers both JSON-body mutation routes and no-body mutation routes.

## 2026-04-26 — Tenth deep audit pass: order status state machine, stricter mutation origin checks, and session payload bounds

### Problem verified

- `src/core/OrderService.ts::updateOrderStatus()` forwarded admin status changes directly to the repository without loading the existing order or enforcing a Domain state transition rule, allowing invalid lifecycle jumps such as `delivered -> pending` or `cancelled -> shipped` if the repository accepted the update.
- `src/domain/rules.ts` did not expose a pure order-status transition guard for Core/admin orchestration to reuse.
- `src/domain/errors.ts` had product-not-found specificity but no order-specific not-found error for admin order mutation paths.
- `src/infrastructure/server/apiGuards.ts::assertTrustedMutationOrigin()` checked `Origin` when present but did not inspect `Sec-Fetch-Site`, did not reject malformed Origin values, and allowed production mutation requests with no Origin header.
- `src/infrastructure/server/session.ts` validated signed session expiry but did not bound future `issuedAt` clock skew and did not reject oversized encoded session cookies before setting them.

### Remediation performed

- Added a pure Domain order-status state machine in `src/domain/rules.ts`:
  - `pending -> confirmed | cancelled`
  - `confirmed -> shipped | cancelled`
  - `shipped -> delivered`
  - terminal `delivered` and `cancelled` states
  - same-status updates remain idempotent.
- Added `canTransitionOrderStatus()` and `assertValidOrderStatusTransition()` to Domain rules; invalid transitions throw `InvalidOrderError`.
- Added `OrderNotFoundError` in `src/domain/errors.ts` for order-specific 404 semantics.
- Updated `src/core/OrderService.ts::updateOrderStatus()` to load the current order, throw `OrderNotFoundError` when absent, and enforce `assertValidOrderStatusTransition()` before writing the new status.
- Updated `src/infrastructure/server/apiGuards.ts` so mutation origin checks now:
  - apply only to `POST`, `PUT`, `PATCH`, and `DELETE` methods.
  - reject cross-site `Sec-Fetch-Site` values before body parsing.
  - reject missing `Origin` headers in production mutation requests.
  - reject malformed Origin headers with `UnauthorizedError`.
  - map `OrderNotFoundError` to HTTP 404 via `jsonError()`.
- Updated `src/infrastructure/server/session.ts` with:
  - `MAX_SESSION_CLOCK_SKEW_MS = 60 * 1000`, rejecting signed session payloads issued too far in the future.
  - `MAX_SESSION_COOKIE_BYTES = 4096`, rejecting encoded session cookies that exceed safe browser cookie size limits.

### Verification evidence

- `npm run lint && npm run build` completed successfully after this pass.
- The successful build completed Next.js production compilation, TypeScript validation, page-data collection, static generation for 22 app routes, and retained dynamic admin/API routes including `/api/admin/orders/[id]`, `/api/orders`, and auth/cart/product routes.
- `git --no-pager diff -- src/domain/errors.ts src/domain/rules.ts src/core/OrderService.ts src/infrastructure/server/apiGuards.ts src/infrastructure/server/session.ts` verified the exact modified source files for this pass.

### Files intentionally changed in this pass

- `src/domain/errors.ts`
- `src/domain/rules.ts`
- `src/core/OrderService.ts`
- `src/infrastructure/server/apiGuards.ts`
- `src/infrastructure/server/session.ts`
- `.wiki/changelog.md`
- `.wiki/index.md`

### Architectural notes

- Domain owns the order lifecycle rule as pure, testable business logic with no I/O or framework dependencies.
- Core orchestrates the admin status mutation by loading current state and applying the Domain state machine before delegating persistence.
- Infrastructure owns HTTP mutation-origin policy, error-to-response mapping, and signed cookie payload bounds.
- UI was unchanged in this pass.

## 2026-04-26 — Ninth deep audit pass: product enum hydration and composite cursor pagination

### Problem verified

- `src/infrastructure/repositories/sqlite/SQLiteProductRepository.ts` hydrated persisted product `category` and `rarity` values with direct TypeScript casts, allowing invalid stored enum strings to become Domain `Product` values.
- SQLite product pagination in `SQLiteProductRepository.ts` ordered by `createdAt desc, id asc` but applied cursor filtering as `id > cursor`, which is not equivalent to the composite sort order and can skip or duplicate rows when IDs do not correlate with creation timestamps.
- SQLite admin order pagination in `SQLiteOrderRepository.ts` had the same composite-order mismatch: `createdAt desc, id asc` ordering with `id > cursor` filtering.

### Remediation performed

- Added stored product enum validation in `SQLiteProductRepository.ts` with `parseProductCategory()` and `parseCardRarity()`; invalid stored category/rarity values now raise controlled `DomainError` messages instead of silently hydrating invalid Domain models.
- Updated the SQL fallback product pagination path to resolve the cursor row's `createdAt`/`id` and apply a composite cursor predicate matching the sort order: rows with older `createdAt`, or same `createdAt` and greater `id`.
- Updated admin order pagination in `SQLiteOrderRepository.ts` to resolve the cursor order's `createdAt`/`id` and apply the same composite cursor predicate matching `createdAt desc, id asc`.

### Verification evidence

- `npm run lint && npm run build` completed successfully after this pass.
- The successful build completed Next.js production compilation, TypeScript validation, page-data collection, static generation for 22 app routes, and retained dynamic API routes for `/api/products`, `/api/products/[id]`, and `/api/admin/orders`.

### Files intentionally changed in this pass

- `src/infrastructure/repositories/sqlite/SQLiteProductRepository.ts`
- `src/infrastructure/repositories/sqlite/SQLiteOrderRepository.ts`
- `.wiki/changelog.md`
- `.wiki/index.md`

### Architectural notes

- Domain remained unchanged; Infrastructure validates persisted adapter data before returning Domain models.
- Pagination correctness remains a repository concern and now aligns filtering with the actual persisted sort order.

## 2026-04-26 — Eighth deep audit pass: strict session cookies and additional browser isolation headers

### Problem verified

- `src/infrastructure/server/session.ts` duplicated session cookie option objects and used `sameSite: 'lax'`, leaving a broader cross-site cookie send surface than necessary for the same-origin API model.
- `src/infrastructure/server/session.ts::decodeSession()` relied on signed `expiresAt` validation but did not independently cap session age from `issuedAt` against the configured TTL.
- `next.config.ts` lacked several browser isolation / transport hardening headers: HSTS for production, COOP, CORP, and DNS prefetch control.

### Remediation performed

- Added `sessionCookieOptions()` in `src/infrastructure/server/session.ts` to centralize cookie options for session set/clear paths.
- Changed session cookies to `sameSite: 'strict'` while preserving `httpOnly`, production-only `secure`, root path, and max-age behavior.
- Added an independent issued-at age cap in `decodeSession()` so signed sessions are rejected if `Date.now() - issuedAt` exceeds `SESSION_TTL_SECONDS` even if a malformed payload attempted an inconsistent expiry.
- Added `Cross-Origin-Opener-Policy: same-origin`, `Cross-Origin-Resource-Policy: same-origin`, and `X-DNS-Prefetch-Control: off` to global headers in `next.config.ts`.
- Added production-only `Strict-Transport-Security: max-age=31536000; includeSubDomains` to global headers in `next.config.ts`.

### Verification evidence

- `npm run lint && npm run build` completed successfully after this pass.
- The successful build completed Next.js production compilation, TypeScript validation, page-data collection, static generation for 22 app routes, and retained auth/session API routes.

### Files intentionally changed in this pass

- `src/infrastructure/server/session.ts`
- `next.config.ts`
- `.wiki/changelog.md`
- `.wiki/index.md`

### Architectural notes

- Session cookie and browser header policy remain Infrastructure concerns.
- Domain and Core were unchanged in this pass.

## 2026-04-26 — Seventh deep audit pass: API expected-error mapping and client fetch cache/credential policy

### Problem verified

- `src/app/api/admin/orders/[id]/route.ts` used raw `Error('status is required.')` for a client validation failure, causing `jsonError()` to classify the missing-status condition as unexpected rather than an expected Domain-level bad request.
- `src/ui/apiClientServices.ts` used `fetch()` without an explicit cache policy or credentials policy, leaving request behavior implicit for session-cookie-backed ecommerce API calls.

### Remediation performed

- Updated `src/app/api/admin/orders/[id]/route.ts` to throw `DomainError('status is required.')` for missing admin order status, preserving expected error classification and HTTP mapping through `jsonError()`.
- Updated `src/ui/apiClientServices.ts::request()` to set `cache: 'no-store'` so customer/admin API reads and mutations do not use stale browser/runtime cache data.
- Updated `src/ui/apiClientServices.ts::request()` to set `credentials: 'same-origin'` explicitly for the signed HTTP-only session cookie model.

### Verification evidence

- `npm run lint && npm run build` completed successfully after this pass.
- The successful build completed Next.js production compilation, TypeScript validation, page-data collection, static generation for 22 app routes, and retained dynamic API routes for admin orders and customer session/cart/order flows.

### Files intentionally changed in this pass

- `src/app/api/admin/orders/[id]/route.ts`
- `src/ui/apiClientServices.ts`
- `.wiki/changelog.md`
- `.wiki/index.md`

### Architectural notes

- Domain error typing is reused at the Infrastructure HTTP boundary for expected transport validation failures.
- UI remains a client API facade; it does not compute business outcomes, but now makes session and cache behavior explicit for transport calls.

## 2026-04-26 — Sixth deep audit pass: cart flush wait semantics, persisted JSON parse containment, and stock compare-and-swap

### Problem verified

- `src/infrastructure/repositories/sqlite/SQLiteCartRepository.ts::flushBufferToDisk()` returned immediately when another flush was already running, so a concurrent `save()` / `clear()` could acknowledge before the caller's write-through flush actually persisted.
- `src/infrastructure/repositories/sqlite/SQLiteCartRepository.ts` and `src/infrastructure/repositories/sqlite/SQLiteOrderRepository.ts` added shape validation, but invalid JSON syntax in persisted fields could still escape as raw `SyntaxError` instead of controlled `DomainError` messages.
- `src/infrastructure/repositories/sqlite/SQLiteProductRepository.ts::updateStock()` and `batchUpdateStock()` performed read-then-write stock updates without checking that the row's stock value was unchanged at update time, leaving a lost-update risk under concurrent writers.

### Remediation performed

- Updated `SQLiteCartRepository.ts::flushBufferToDisk()` to wait while a flush is in progress instead of returning immediately, then re-check the active buffer before exiting.
- Wrapped persisted cart JSON parsing in `SQLiteCartRepository.ts` with controlled `DomainError('Stored cart data is invalid JSON.')` handling.
- Wrapped persisted order item/address JSON parsing in `SQLiteOrderRepository.ts` with controlled `DomainError` handling for invalid JSON syntax.
- Updated `SQLiteProductRepository.ts::updateStock()` and `batchUpdateStock()` to add a `where('stock', '=', product.stock)` compare-and-swap predicate and verify exactly one row was updated; failed compare-and-swap attempts now surface as `InsufficientStockError` rather than silently overwriting concurrent stock changes.

### Verification evidence

- `npm run lint && npm run build` completed successfully after this pass.
- The successful build completed Next.js production compilation, TypeScript validation, page-data collection, static generation for 22 app routes, and retained dynamic API routes for cart, order, and product flows.

### Files intentionally changed in this pass

- `src/infrastructure/repositories/sqlite/SQLiteCartRepository.ts`
- `src/infrastructure/repositories/sqlite/SQLiteOrderRepository.ts`
- `src/infrastructure/repositories/sqlite/SQLiteProductRepository.ts`
- `.wiki/changelog.md`
- `.wiki/index.md`

### Architectural notes

- Domain remained unchanged; Infrastructure now applies stronger adapter-level concurrency and persistence safeguards before exposing data to Core.
- The stock compare-and-swap checks preserve repository contract behavior while reducing oversell/lost-update risk in SQLite writes.

## 2026-04-26 — Fifth deep audit pass: cart write-through durability and stored JSON shape validation

### Problem verified

- `src/infrastructure/repositories/sqlite/SQLiteCartRepository.ts` acknowledged `save()` and `clear()` after staging cart mutations in memory; persistence depended on a later one-second flush loop, leaving a crash/window risk for cart writes and checkout cart clearing.
- `src/infrastructure/repositories/sqlite/SQLiteCartRepository.ts` parsed stored cart item JSON with an unchecked `JSON.parse(row.items)` result.
- `src/infrastructure/repositories/sqlite/SQLiteOrderRepository.ts` parsed stored `items` and `shippingAddress` JSON with unchecked `JSON.parse(...)` and cast `row.status as OrderStatus`, allowing corrupted persisted rows to hydrate into Domain models without shape validation.

### Remediation performed

- Updated `src/infrastructure/repositories/sqlite/SQLiteCartRepository.ts` so `save()` and `clear()` call `flushBufferToDisk()` before returning, converting cart write acknowledgement into write-through persistence while keeping the existing buffer/flush loop as a coalescing fallback.
- Added cart item runtime guards in `SQLiteCartRepository.ts`; stored cart items must be an array of objects with string `productId`, string `name`, integer `priceSnapshot`, integer `quantity`, and string `imageUrl`, otherwise a controlled `DomainError` is thrown.
- Added order item, address, and order-status runtime guards in `SQLiteOrderRepository.ts`; stored order rows now validate item arrays, shipping address shape, and allowed order status strings before returning a Domain `Order`.

### Verification evidence

- `npm run lint && npm run build` completed successfully after this pass.
- The successful build completed Next.js production compilation, TypeScript validation, page-data collection, static generation for 22 app routes, and retained dynamic API routes for `/api/cart`, `/api/cart/items`, and `/api/orders`.

### Files intentionally changed in this pass

- `src/infrastructure/repositories/sqlite/SQLiteCartRepository.ts`
- `src/infrastructure/repositories/sqlite/SQLiteOrderRepository.ts`
- `.wiki/changelog.md`
- `.wiki/index.md`

### Architectural notes

- Domain remained unchanged; Infrastructure performs defensive hydration validation before returning persisted JSON as Domain models.
- Cart persistence remains inside the SQLite repository adapter; UI and Core service contracts did not change.

## 2026-04-26 — Fourth deep audit pass: trusted checkout wiring, durable checkout locks, and malformed JSON containment

### Problem verified

- `src/core/container.ts` still constructed `OrderService` without `TrustedCheckoutGateway`, so the trusted checkout adapter was hardened but not wired into the production singleton/factory service graph when `CHECKOUT_ENDPOINT` was configured.
- `src/core/container.ts` also relied on the `OrderService` default in-memory lock provider, which does not coordinate checkout mutual exclusion across server processes even though `src/infrastructure/sqlite/SovereignLocker.ts` implements the Domain `ILockProvider` contract against SQLite.
- `src/infrastructure/server/apiGuards.ts::readJsonObject()` bounded request size but `JSON.parse()` exceptions could still escape as unexpected errors rather than a controlled `DomainError` response for malformed JSON.
- `src/infrastructure/services/TrustedCheckoutGateway.ts` accepted endpoint strings without explicit URL parse error handling, protocol allow-listing, credential rejection, network/timeout error normalization, or response content-type validation.

### Remediation performed

- Updated `src/core/container.ts` to import and wire `TrustedCheckoutGateway` when `process.env.CHECKOUT_ENDPOINT` is present.
- Updated `src/core/container.ts` to inject `SovereignLocker` into both factory-created and singleton-created `OrderService` instances, replacing the fallback in-memory checkout lock for composed services with a SQLite-backed `ILockProvider`.
- Added singleton caches in `src/core/container.ts` for `ILockProvider` and optional `ICheckoutGateway` to keep production service composition stable across requests.
- Updated `src/infrastructure/server/apiGuards.ts` so malformed JSON parse failures are converted into `DomainError('Request body must be valid JSON.')`.
- Further hardened `src/infrastructure/services/TrustedCheckoutGateway.ts` by validating endpoint URL construction, allowing only `http:`/`https:` protocols, rejecting embedded URL credentials, mapping aborts to timeout-specific `PaymentFailedError`, mapping other fetch failures to a generic reachability error, and requiring an `application/json` response before order parsing.

### Verification evidence

- `npm run lint && npm run build` completed successfully after this pass.
- The successful build completed Next.js production compilation, TypeScript validation, page-data collection, static generation for 22 app routes, and retained `/api/orders` as a dynamic route.

### Files intentionally changed in this pass

- `src/core/container.ts`
- `src/infrastructure/server/apiGuards.ts`
- `src/infrastructure/services/TrustedCheckoutGateway.ts`
- `.wiki/changelog.md`
- `.wiki/index.md`

### Architectural notes

- Domain contracts remained unchanged; existing `ILockProvider` and `ICheckoutGateway` contracts were used rather than adding Infrastructure concerns to Domain.
- Core remains the composition root and wires Infrastructure adapters through dependency injection.
- Infrastructure owns durable SQLite locking, transport parsing, outbound trusted checkout I/O, and external response validation.

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