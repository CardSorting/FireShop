# Troubleshooting

## Native SQLite binding fails with `ERR_DLOPEN_FAILED`

Observed failure mode: `better-sqlite3` native binary compiled for a different Node ABI than the active runtime.

Recovery:

```bash
npm rebuild better-sqlite3
npm run build
```

Verification:

```bash
node -e "const sqlite = require('better-sqlite3'); const db = new sqlite(':memory:'); console.log('ok', process.version, process.versions.modules); db.close();"
```

## Production session errors

`src/infrastructure/server/session.ts` requires `SESSION_SECRET` with at least 32 characters in production. If missing or short, signing/verifying sessions throws.

Recovery:

```bash
SESSION_SECRET='replace-with-at-least-32-random-characters' npm run build
```

For real deployments, configure the secret in the hosting environment rather than shell history.

## Cart/order returns unauthorized

Customer cart/order routes now derive identity from the signed HTTP-only session. Do not pass `userId` in query/body and expect authorization.

Check:
- User has signed in via `/api/auth/sign-in`.
- Browser is retaining the `pm_tcg_session` cookie.
- `SESSION_SECRET` did not rotate unexpectedly between sign-in and API calls.

## Admin product/order mutation returns forbidden

Admin routes call `requireAdminSession()`. The signed session must contain a Domain `User` whose `role` is `admin`.

Check:
- Auth adapter returns `role: 'admin'` for the signed-in user.
- The cookie is signed by the current `SESSION_SECRET`.
- The route has not bypassed centralized guards.

## ESLint scans generated Next output

`eslint.config.js` intentionally ignores `dist`, `.next`, `playmore-tcg/.next`, and `next-env.d.ts`. If generated output appears under another nested path, add that generated path to `globalIgnores` rather than editing generated files.

## Tailwind utilities absent in build

Tailwind v4 is configured through `postcss.config.mjs` with `@tailwindcss/postcss`; `tailwind.config.ts` scans `src/app`, `src/ui`, and `src/core`.

Check:

```bash
npm run build
```

Then inspect served pages for generated CSS links and expected utility classes.
