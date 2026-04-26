# Getting Started

## Environment requirements

- Node.js compatible with Next.js 16 and the repository lockfile. A previously verified shell used Node.js `v20.19.5` and npm `10.8.2`.
- Native build compatibility for `better-sqlite3`; if Node ABI changes, rebuild the package.
- A local SQLite database path is optional. If `SQLITE_DATABASE_PATH` is unset, `src/infrastructure/sqlite/database.ts` uses `playmore.db`.
- `SESSION_SECRET` is mandatory in production and must be at least 32 characters because `src/infrastructure/server/session.ts` refuses weak/missing production secrets.

## Install

```bash
npm install
```

If the active Node runtime changed after dependencies were installed:

```bash
npm rebuild better-sqlite3
```

## Development run

```bash
npm run dev
```

## Production verification

```bash
npm run lint
npm run build
npm run start
```

## Security/session checklist before deployment

1. Set `SESSION_SECRET` to a high-entropy value with length >= 32.
2. Verify `npm run build` succeeds after native dependency installation.
3. Confirm all cart/order calls go through session cookies; do not reintroduce `userId` request trust at API routes.
4. Confirm admin product/order mutations call `requireAdminSession()` from `src/infrastructure/server/apiGuards.ts`.
5. Validate Stripe CSP allowances in `next.config.ts` before changing checkout integrations.

## First files to inspect

- Domain contracts: `src/domain/models.ts`, `src/domain/repositories.ts`, `src/domain/rules.ts`.
- Composition: `src/core/container.ts`.
- Server service initialization: `src/infrastructure/server/services.ts`.
- Session and API guards: `src/infrastructure/server/session.ts`, `src/infrastructure/server/apiGuards.ts`.
- Client API facade: `src/ui/apiClientServices.ts`.
