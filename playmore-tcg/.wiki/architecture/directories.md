# Directory Dictionary

## Repository Root

| Path | Purpose | Constraints |
|---|---|---|
| `.wiki/` | Sovereign Knowledge Ledger. | Must keep hierarchical taxonomy: onboarding, architecture, agent, root index/changelog. |
| `.env.example` | Environment key template. | Do not commit secrets. |
| `.next/` | Next.js generated output. | Ignore for architectural decisions. |
| `dist/` | Generated/build output. | Ignore for source architecture. |
| `node_modules/` | Installed dependencies. | Never edit manually. |
| `public/` | Static assets such as favicon/icons. | No business logic. |
| `src/` | Application source. | Follow Joy-Zoning boundaries. |
| `package.json` | Scripts and dependency manifest. | Source of stack and command truth. |
| `next.config.ts` | Next.js configuration. | Server external package config affects SQLite runtime. |
| `tsconfig.json` | TypeScript/path alias configuration. | Keep aliases aligned with source zones. |
| `README.md`, `SECURITY.md`, `PRODUCTION_READY_METRICS.md` | Project-facing documentation. | Keep consistent with `.wiki/` when architecture changes. |

## Source Directories

| Path | Layer | Purpose | Constraints |
|---|---|---|---|
| `src/app/` | Framework boundary | Next.js pages, layouts, and API route handlers. | Route handlers may call server infrastructure; pages should delegate UI rendering. |
| `src/domain/` | Domain | Models, repository interfaces, domain errors, and pure rules. | No I/O, no framework imports, no environment access. |
| `src/core/` | Core | Application services and composition container. | Coordinate; do not implement low-level persistence or UI. |
| `src/infrastructure/` | Infrastructure | SQLite, repositories, auth adapter, payment adapter, server services/session. | Implement domain contracts; isolate I/O details. |
| `src/ui/` | UI | React pages, components, hooks, layouts, browser API facade. | Render state and call local API/services; avoid direct infrastructure imports. |
| `src/utils/` | Plumbing | Constants, logger, validators/helpers. | Stateless and context-light. |
| `src/index.css` | Styling | Tailwind/theme CSS entry. | No application logic. |

## Infrastructure Subdirectories

- `src/infrastructure/repositories/sqlite/`: SQLite implementations of domain repository contracts.
- `src/infrastructure/server/`: server-only service/session helpers for route handlers.
- `src/infrastructure/services/`: auth/payment/checkout/seed service adapters.
- `src/infrastructure/sqlite/`: Kysely database access, schema types, lock/integrity helpers.
- `src/infrastructure/ui/`: present in tree; audit before using because no representative file was observed in this pass.

## UI Subdirectories

- `src/ui/pages/`: page-level React views.
- `src/ui/pages/admin/`: admin page-level views.
- `src/ui/components/`: shared components.
- `src/ui/checkout/`: Stripe checkout UI/client helpers.
- `src/ui/hooks/`: auth/service hooks.
- `src/ui/layouts/`: layout components such as navigation/admin layout.
