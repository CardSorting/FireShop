# Troubleshooting and Gotchas

## `better-sqlite3` Build or Runtime Errors

- Verify Node/npm environment supports native modules.
- Run `npm install` again after Node version changes.
- Confirm `next.config.ts` keeps `better-sqlite3` server-external.

## Missing Database

- `initDatabase()` creates tables if needed when server services initialize.
- Check `SQLITE_DATABASE_PATH`; default is `playmore.db`.

## Auth Does Not Persist

- Check `SESSION_SECRET` exists in `.env`.
- Verify browser accepts the HTTP-only session cookie.
- Exercise `/api/auth/me` after sign-in.

## Checkout Fails

- Placeholder Stripe publishable key may be insufficient for real payment flows.
- `TrustedCheckoutGateway` requires `CHECKOUT_ENDPOINT` if trusted finalization path is used.
- Review `OrderService.ts` for stock, lock, payment, and rollback behavior.

## Seed Command Fails

- README references `npx tsx src/infrastructure/services/SeedDataLoader.ts`; `tsx` was not observed in `package.json` devDependencies during this pass.

## Git Shows `.next/` Changes

- `.next/` is generated Next.js cache. Do not document it as source and do not hand-edit it.