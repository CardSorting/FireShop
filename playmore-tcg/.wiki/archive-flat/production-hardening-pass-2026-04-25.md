# Production Hardening Pass — 2026-04-25

## Verification Snapshot

- `npm run lint` completed with 0 errors and 5 existing `react-hooks/exhaustive-deps` warnings.
- `npm run build` completed successfully.
- Production build now emits route-level chunks for home, products, product detail, cart, checkout, orders, login/register, and admin pages.
- The previous single large app bundle was reduced to a 233.83 kB `index` chunk plus lazy route chunks; the largest remaining generated chunk is `createLucideIcon` at 453.46 kB.
- `npm audit --omit=dev --json` reported 0 production vulnerabilities.

## Verified Changes

### Payment Boundary

- Removed the `loadStripe` import and `stripePromise` export from `src/infrastructure/services/StripePaymentProcessor.ts`.
- Removed the fake Stripe publishable-key fallback from the payment processor path.
- Changed `StripePaymentProcessor.processPayment` so browser-side payment capture fails closed with an explicit backend-configuration error instead of fabricating a `pi_*` transaction id.
- Added `src/ui/checkout/stripeClient.ts` to keep Stripe Elements client loading in the UI checkout boundary.
- `CheckoutPage` now shows a deployment-safe “Stripe is not configured” message and does not render Stripe Elements when `VITE_STRIPE_PUBLISHABLE_KEY` is absent.

### UI / Bundle Hardening

- Converted `src/ui/AppRouter.tsx` page imports to `React.lazy` route chunks behind `Suspense`.
- Lazy-loaded public pages, checkout, orders, auth pages, and admin pages instead of synchronously importing them into the initial router module.
- This reduced initial route coupling and produced separate build artifacts for heavy checkout/admin paths.

### JoyZoning Boundary Cleanup

- Removed `CartPage` direct `../../core/container` import.
- `CartPage` now obtains auth/cart/product services through the existing `useServices` hook only.
- Updated the misleading `src/core/container.ts` comment: core is documented as the composition root that intentionally wires infrastructure adapters.
- Added a singleton cache for the payment processor in `getInitialServices` so repeated service access does not recreate the payment adapter.

### Firestore Rules

- Added `isPendingClientOrder(data)` to `firestore.rules`.
- Client-created orders are now limited to `status == 'pending'` and `paymentTransactionId == null`.
- This blocks authenticated clients from directly creating already-confirmed orders with arbitrary transaction IDs.
- Admin status updates remain limited to `status` and `updatedAt` changes.

### Production Diagnostics

- Added `src/utils/logger.ts` as an environment-gated logging helper.
- Development-only `debug` and `info` output is suppressed in production.
- Replaced raw logging in Firebase auth/config paths, SQLite provider/repository/worker paths, cart page loading, seed loading, and error boundary handling with `logger` calls.
- `ErrorBoundary` now hides raw error detail in production UI and only renders detailed error text in development.

## Remaining Known Warnings / Risks

- `npm run lint` still reports 5 `react-hooks/exhaustive-deps` warnings in `ProductDetailPage`, `ProductsPage`, `AdminOrders`, `AdminProductForm`, and `AdminProducts`.
- Checkout now fails closed until a trusted backend/Cloud Function/Firebase extension payment confirmation path is implemented.
- Firestore rules still permit client-created pending orders; a fully hardened production payment design should move order creation/confirmation into a trusted backend service account path.
- The largest remaining generated chunk is `createLucideIcon` at 453.46 kB. A future pass should reduce icon-library import cost or replace broad icon dependencies with narrower SVG components.

## Second Deep Audit / Production Hardening Pass — 2026-04-25

### Verification Snapshot

- `npm run lint` completed with 0 errors and the same 5 existing `react-hooks/exhaustive-deps` warnings in `ProductDetailPage`, `ProductsPage`, `AdminOrders`, `AdminProductForm`, and `AdminProducts`.
- `npm run build` completed successfully after the second-pass changes.
- The production build emitted `CheckoutPage-CHwnSnVq.js` at 4.27 kB gzip 1.58 kB and a separate lazy `StripeCheckoutForm-DusrPY-u.js` chunk at 10.54 kB gzip 4.00 kB.
- The production build still reports Vite's >500 kB chunk warning for `dist/assets/index-gE1GGiph.js` at 681.41 kB gzip 207.93 kB.
- `npm audit --omit=dev --json` reported 0 production vulnerabilities.

### Domain

- Added `ProductDraft` and `ProductUpdate` to `src/domain/models.ts` so product creation/update contracts exclude infrastructure-managed fields (`id`, `createdAt`, and `updatedAt`).
- Added `InvalidProductError` to `src/domain/errors.ts` for product invariant failures.
- Updated `IProductRepository` in `src/domain/repositories.ts` so `create` accepts `ProductDraft` and `update` accepts `ProductUpdate` instead of broad `Omit<Product, ...>` / `Partial<Product>` shapes.
- Added pure product invariant checks in `src/domain/rules.ts`:
  - required/max-length checks for name, description, and image URL;
  - integer/non-negative/maximum checks for price cents and stock;
  - enum checks for product category and optional rarity;
  - optional set-name length checks;
  - non-empty update payload enforcement.

### Core

- Updated `src/core/ProductService.ts` to validate product drafts with `assertValidProductDraft` before create operations.
- Updated `src/core/ProductService.ts` to validate product updates with `assertValidProductUpdate` before repository update operations.
- ProductService now depends on explicit `ProductDraft` and `ProductUpdate` domain types, reducing the risk of UI/admin callers mutating immutable product metadata.

### Infrastructure

- Updated `src/infrastructure/repositories/FirestoreProductRepository.ts` to implement the narrowed `ProductDraft` / `ProductUpdate` repository contract.
- Added Firestore product update payload sanitization so only mutable product fields are sent to `updateDoc`; immutable/server-controlled fields are not forwarded.
- Hardened Firestore product pagination by resolving the optional cursor document once and applying `startAfter` only when the cursor document exists.
- Hardened Firestore order pagination with the same cursor-existence guard.
- Updated Firestore stock transaction writes to also set `updatedAt: serverTimestamp()` when stock changes.
- Updated `src/infrastructure/repositories/sqlite/SQLiteProductRepository.ts` to implement `ProductDraft` / `ProductUpdate`.
- Replaced SQLite negative-stock `ProductNotFoundError` throws with `InsufficientStockError` in single and batch stock updates.
- Updated SQLite stock mutation writes to refresh `updatedAt` when stock changes.

### UI

- Added `src/ui/checkout/StripeCheckoutForm.tsx` as a lazy-loaded Stripe Elements form component.
- Removed direct Stripe Elements imports from `src/ui/pages/CheckoutPage.tsx`; the checkout page now loads the payment form through `React.lazy` and `Suspense` only when Stripe is configured.
- Replaced the checkout page `alert()` failure path with durable inline error state rendered in the checkout card.
- Normalized checkout country input to uppercase at the UI boundary and again before calling `OrderService.placeOrder`.

### Remaining Known Warnings / Risks After Second Pass

- The 5 hook dependency warnings remain unchanged and should be addressed in a dedicated hook-stability pass.
- The browser checkout path still fails closed because payment capture requires a trusted backend boundary; this pass improved UI loading/error handling but did not add a backend payment endpoint.

## Third Deep Audit / Production Hardening Pass — 2026-04-25

### Verification Snapshot

- `npm run lint` completed with 0 errors and 0 warnings after the third-pass hook-stability changes.
- `npm run build` completed successfully.
- The production build emitted lazy route chunks for auth, product, checkout, order, and admin pages.
- The production build still reports Vite's >500 kB chunk warning for `dist/assets/index-Cif9KhqJ.js` at 682.44 kB gzip 208.30 kB.
- `npm audit --omit=dev --json` reported 0 production vulnerabilities across 141 production dependencies.

### Strategic Audit Record

- Updated `/Users/bozoegg/Desktop/PlayMoreTCG/scratchpad.md` with the required strategic review sections for this audit cycle:
  - `Requirement Analysis`
  - `The Architect review`
  - `The Critic review`
  - `The SRE review`
- The scratchpad records the third-pass focus on checkout reconciliation, idempotency metadata, validation drift, local auth persistence risk, duplicate stock coalescing, hook warnings, and SKL evidence requirements.

### Domain

- Updated `src/domain/repositories.ts` so `IPaymentProcessor.processPayment` now requires an `idempotencyKey` parameter in addition to amount, order id, and optional payment method id.
- Added `CheckoutReconciliationError` to `src/domain/errors.ts` for the specific case where payment succeeds but checkout finalization fails.
- Added pure stock-coalescing helpers to `src/domain/rules.ts`:
  - `coalesceCartStockDeductions(items)` converts cart lines into product stock deltas.
  - `coalesceStockUpdates(updates)` merges duplicate product deltas and drops zero-net updates.
- Domain remains free of Firestore, SQLite, Stripe, browser APIs, timers, and logging imports.

### Core

- Updated `src/core/AuthService.ts` to centralize sign-in/sign-up validation before delegating to auth infrastructure:
  - email format validation;
  - password presence for sign-in;
  - password strength validation for sign-up;
  - display-name validation for sign-up;
  - email normalization to lowercase/trimmed form before provider calls.
- Updated `src/core/OrderService.ts` checkout orchestration:
  - generates a checkout attempt id with `crypto.randomUUID()`;
  - derives an idempotency key from user id and checkout attempt id;
  - passes the attempt id and idempotency key to the payment processor boundary;
  - uses domain coalescing for stock deductions and compensation updates;
  - throws `CheckoutReconciliationError` when payment succeeds but order creation or cart clearing fails.

### Infrastructure

- Updated `src/infrastructure/services/StripePaymentProcessor.ts` to implement the expanded payment contract requiring `idempotencyKey`.
- Updated `src/infrastructure/repositories/FirestoreProductRepository.ts` so `batchUpdateStock` coalesces duplicate stock deltas before transaction reads/writes.
- Updated `src/infrastructure/repositories/sqlite/SQLiteProductRepository.ts` so `batchUpdateStock` coalesces duplicate stock deltas before the SQLite transaction loop.
- Updated `src/infrastructure/services/SQLiteAuthAdapter.ts`:
  - sign-in normalizes email before lookup;
  - sign-up normalizes email before insert;
  - display names are trimmed before persistence;
  - duplicate/insert failures are mapped to a generic account-creation error.

### UI

- Updated `src/ui/pages/RegisterPage.tsx` to use the shared validator utilities for display name, email, and password strength before calling auth.
- Updated `src/ui/pages/LoginPage.tsx` to validate email format and password presence before calling auth.
- Updated `src/ui/pages/admin/AdminProductForm.tsx`:
  - uses shared price/stock validators before saving;
  - guards against invalid numeric parsing;
  - renders save failures inline instead of silently resetting the saving state;
  - wraps edit-load logic with `useCallback` and an effect dependency list that satisfies React hooks linting.
- Updated hook stability in `ProductDetailPage`, `ProductsPage`, `AdminOrders`, and `AdminProducts` by wrapping async load functions in `useCallback` and using complete effect dependencies.
- The previous five `react-hooks/exhaustive-deps` warnings were reduced to zero.

### Remaining Known Warnings / Risks After Third Pass

- Checkout still fails closed until a trusted backend/Cloud Function/Firebase extension payment-confirmation path is implemented.
- The new `idempotencyKey` is passed through the payment contract, but true payment idempotency must be enforced by the future trusted backend/payment provider call.
- `CheckoutReconciliationError` surfaces paid-but-not-finalized failures, but no durable reconciliation queue/table has been added in this browser-only pass.
- The local SQLite auth adapter still stores current user state in `localStorage`; privileged production decisions must continue to be enforced by trusted server/rules boundaries.
- The main production chunk remains above Vite's 500 kB warning threshold at 682.44 kB gzip 208.30 kB.

## Fourth Deep Audit / Production Hardening Pass — 2026-04-25

### Verification Snapshot

- `npm run build` completed successfully after the fourth-pass changes.
- `npm run lint` completed with no reported ESLint errors or warnings.
- The production build still reports Vite's existing >500 kB main chunk warning: `dist/assets/index-CLbsYcyP.js` at 684.13 kB gzip 208.75 kB.
- `git diff --stat` verified changes across `.env.example`, Firestore rules, Domain/Core/Infrastructure checkout files, and checkout/admin UI files.

### Domain

- Added explicit validation constants to `src/domain/rules.ts` for cart quantity, order item count, product field lengths, address field lengths, maximum price cents, and maximum stock.
- Updated product draft/update validation in `src/domain/rules.ts` to use those constants rather than duplicated numeric literals.
- Hardened `assertValidShippingAddress` to reject address fields longer than 120 characters.
- Added `assertValidOrderItems` in `src/domain/rules.ts` to validate cart/order item shape before checkout orchestration.
- Added `InvalidOrderError` in `src/domain/errors.ts` for order/cart item invariant failures.
- Added `ICheckoutGateway` to `src/domain/repositories.ts` as the trusted checkout finalization boundary; the Domain contract is still pure and contains no Stripe, Firebase, fetch, or browser implementation.

### Core

- Updated `src/core/OrderService.ts` to validate cart items with `assertValidOrderItems` before stock/payment orchestration.
- Added `OrderService.finalizeTrustedCheckout(userId, shippingAddress, paymentMethodId)` as the preferred checkout path for browser callers.
- `finalizeTrustedCheckout` validates shipping address and payment method input, derives an idempotency key, and delegates finalization to `ICheckoutGateway`.
- `OrderService.placeOrder` now routes to the trusted finalization path when a checkout gateway and payment method are available, preserving the existing legacy orchestration only as a fallback path.
- Updated `src/core/container.ts` to wire `TrustedCheckoutGateway` into `OrderService` in both factory and singleton service construction paths.

### Infrastructure

- Added `src/infrastructure/services/TrustedCheckoutGateway.ts` as a fetch-based adapter for `VITE_CHECKOUT_ENDPOINT`.
- The trusted checkout adapter fails closed with `PaymentFailedError` when no endpoint is configured.
- Updated `src/infrastructure/services/StripePaymentProcessor.ts` so browser-side payment capture failures throw `PaymentFailedError` instead of generic `Error`.
- Updated `.env.example` with `VITE_STRIPE_PUBLISHABLE_KEY` and `VITE_CHECKOUT_ENDPOINT` placeholders.

### Firestore Rules

- Aligned `firestore.rules` product validation with Domain constraints:
  - product name maximum is now 120 characters;
  - product description must be non-empty and at most 2000 characters;
  - product image URL must be non-empty and at most 2000 characters;
  - optional set is capped at 120 characters;
  - optional rarity is constrained to the Domain rarity enum.
- Hardened cart/order item validation in rules with non-empty product id/name/image URL and maximum item price checks.
- Hardened shipping-address rule validation with 120-character maximums on street, city, state, and zip.
- Renamed the client-created order helper to `isPendingClientOrderRequest` to clarify that authenticated clients may only create pending orders without payment transaction ids.
- Added `isTrustedOrderFinalization()` to document the trusted/admin finalization path for confirmed orders and transaction id updates.

### UI

- Updated `src/ui/pages/CheckoutPage.tsx` so successful Stripe payment-method creation calls `orderService.finalizeTrustedCheckout` rather than the legacy browser-side `placeOrder` path.
- Added checkout status state for `authorizing` and `finalizing` UI feedback, including a non-refresh warning while the trusted checkout service finalizes the order.
- Updated `src/ui/checkout/StripeCheckoutForm.tsx` button copy to distinguish payment authorization from trusted order finalization.
- Replaced raw `confirm()` product deletion in `src/ui/pages/admin/AdminProducts.tsx` with explicit modal state, consequence text, cancellation, disabled deleting state, and accessible delete button labeling.
- Replaced `window.confirm()` in `src/ui/components/admin/DatabaseMigration.tsx` with explicit confirmation modal state describing Firestore overwrite risk and backup/environment prerequisites.

### Remaining Known Warnings / Risks After Fourth Pass

- Checkout now depends on `VITE_CHECKOUT_ENDPOINT`; without a trusted endpoint deployed, checkout fails closed by design.
- `TrustedCheckoutGateway` expects the server endpoint to enforce authentication, Stripe secret-key handling, idempotency, stock deduction, order finalization, cart cleanup, and durable reconciliation.
- Firestore `isTrustedOrderFinalization()` currently maps to admin custom claims; production deployments should prefer service-account/Cloud Function execution for checkout finalization rather than human admin credentials.
- The main client bundle remains above Vite's 500 kB warning threshold and should be addressed in a future bundle-splitting/icon-import pass.