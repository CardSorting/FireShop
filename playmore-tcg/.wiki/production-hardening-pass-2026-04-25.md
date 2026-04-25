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
- The main production chunk remains above Vite's 500 kB warning threshold at 681.41 kB; further bundle reduction should target Firebase/lucide/shared dependency splitting.