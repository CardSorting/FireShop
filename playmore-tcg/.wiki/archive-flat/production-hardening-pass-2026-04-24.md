# Production Hardening Pass — 2026-04-24

## Verification Snapshot

- `npm run lint` completed with 0 errors and 5 `react-hooks/exhaustive-deps` warnings.
- `npm run build` completed successfully. The previous browser externalization warnings for `fs`, `path`, `util`, and `better-sqlite3` were removed by excluding/externalizing `better-sqlite3` in Vite config.
- `npm audit --omit=dev --json` reported 0 production vulnerabilities.

## Verified Changes

### Domain

- Added `ILockProvider` to `src/domain/repositories.ts` so checkout locking is represented as a domain contract rather than a concrete SQLite dependency.
- Added checkout/payment/address domain errors in `src/domain/errors.ts`: `CheckoutInProgressError`, `PaymentFailedError`, and `InvalidAddressError`.
- Added `assertValidShippingAddress` to `src/domain/rules.ts` and wired checkout to validate shipping addresses before stock/payment mutation.

### Core

- Removed the direct `SovereignLocker` import from `src/core/OrderService.ts`.
- `OrderService` now depends on `ILockProvider`; its default fallback is an in-memory lock provider.
- `OrderService` now throws domain-specific checkout and payment failures instead of generic checkout/payment `Error` instances.
- Fixed `prefer-const` lint failures in `src/core/CartService.ts`.

### Infrastructure

- Typed Firestore repository document conversion and collection references in `FirestoreCartRepository`, `FirestoreOrderRepository`, and `FirestoreProductRepository`.
- Added transaction-level negative-stock guards to Firestore stock updates and SQLite product stock updates.
- Removed explicit `any` usage from SQLite repositories, SQLite auth adapter, Firebase initializer helpers, and Sovereign locker catch paths.
- Updated `vite.config.ts` to exclude/externalize `better-sqlite3` from the browser build path.
- Updated `src/main.tsx` so browser bootstrap no longer initializes the selected DB on load.
- Kept SQLite initialization behind dynamic imports in `src/infrastructure/dbProvider.ts` for server-side/local tooling paths.

### UI

- Repaired `useAuth` initial subscription behavior by subscribing once and removing the synchronous loading flip effect.
- Typed checkout form props and replaced checkout `any` catch handling with `unknown` narrowing.
- Integrated shared address validation into checkout button eligibility.
- Removed the admin dashboard’s eager `DatabaseMigration` rendering so SQLite migration tooling is no longer part of the normal admin dashboard bundle.
- Converted `DatabaseMigration` to lazy-load `MigrationService` only when migration is invoked.

### Security Rules

- Expanded `firestore.rules` with helper functions for admin checks, signed-in checks, cart item shape validation, address validation, product validation, and order validation.
- Product writes are now admin-only and shape-validated.
- Cart writes are user-scoped and item-shape bounded.
- Order creation is user-scoped and shape-validated; order updates are admin-only and limited to status/updatedAt changes.

### Plumbing

- Added `src/utils/validators.ts` with pure validators for email, password, display name, address, price cents, and stock.

## Remaining Known Warnings

- `npm run lint` still reports 5 `react-hooks/exhaustive-deps` warnings in UI pages. These are warnings, not blocking errors, and should be addressed in a follow-up hook-stability cleanup pass.
- Production bundle remains above Vite’s 500 KB chunk warning threshold (`739.71 kB`, `221.95 kB gzip`). The next performance pass should lazy-load admin routes, Stripe checkout, Firebase-heavy paths, and icon subsets.