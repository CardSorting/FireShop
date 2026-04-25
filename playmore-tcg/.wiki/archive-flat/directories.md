# Directory Dictionary

## Top-Level

- `.wiki/`: Sovereign Knowledge Ledger. Documentation only; must reflect observed repository state.
- `src/`: primary application source.
- `public/`: static browser assets such as `favicon.svg` and `icons.svg`.
- `.next/`: generated Next.js build/dev cache. Do not edit manually.
- `dist/`: generated artifacts observed at root. Do not treat as source of truth.
- `node_modules/`: installed dependencies. Do not edit.
- Root config files: `package.json`, `package-lock.json`, `next.config.ts`, `tsconfig.json`, `eslint.config.js`, `.env.example`, `.gitignore`, `next-env.d.ts`.
- Root docs: `README.md`, `SECURITY.md`, `PRODUCTION_READY_METRICS.md`.

## `src/`

- `src/domain/`: pure models, repository/service contracts, errors, and rules. No I/O.
- `src/core/`: application services and composition logic: `AuthService`, `CartService`, `OrderService`, `ProductService`, `container.ts`.
- `src/infrastructure/`: concrete adapters and outside-world concerns.
  - `repositories/sqlite/`: Kysely/better-sqlite3 repository implementations.
  - `server/`: server-only service/session helpers.
  - `services/`: auth, Stripe payment, seed loader, trusted checkout gateway.
  - `sqlite/`: database initialization, schema typing, locking/integrity helpers.
- `src/app/`: Next.js App Router pages, layouts, and API route handlers.
- `src/ui/`: browser presentation: pages, components, hooks, layouts, client API service facade, Stripe checkout UI.
- `src/utils/`: stateless helpers such as constants, logger, validators.
- `src/index.css`: Tailwind/theme stylesheet.

## Constraints

- `src/app/api` may call Infrastructure server helpers; UI code should not.
- Domain contracts may be imported by Core, Infrastructure, and UI as types/business vocabulary.
- Generated folders (`.next`, `dist`) are not evidence for source architecture except to note their presence.