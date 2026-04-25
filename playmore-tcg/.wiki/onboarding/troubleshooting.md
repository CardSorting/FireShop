# Troubleshooting

## `better-sqlite3` install or build failures

`better-sqlite3` is a native package. Re-run `npm install` in the project root and ensure local native build tooling is available. Do not move SQLite calls into browser/UI code.

## Missing database file

`src/infrastructure/sqlite/database.ts` opens `process.env.SQLITE_DATABASE_PATH ?? 'playmore.db'`. If `.env` is missing, the app may create/use `playmore.db` in the working directory.

## Empty product catalog

Run the seed loader documented in README: `npx tsx src/infrastructure/services/SeedDataLoader.ts`. If unavailable, inspect installed dev tools before adding new dependencies.

## Checkout errors

Observed checkout paths include local `StripePaymentProcessor` wiring in `src/core/container.ts` and optional `TrustedCheckoutGateway` support via `CHECKOUT_ENDPOINT`. Verify `.env`, payment method inputs, cart contents, and stock.

## Session/auth confusion

Auth routes live under `src/app/api/auth/*`; SQLite auth is implemented by `src/infrastructure/services/SQLiteAuthAdapter.ts`; server session helpers live in `src/infrastructure/server/session.ts`.

## Generated-file noise

`.next/`, `dist/`, and `node_modules/` are generated/heavy directories. Do not treat their contents as architectural source of truth during documentation or refactors.
