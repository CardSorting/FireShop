# Sovereign Knowledge Ledger — PlayMoreTCG

This Knowledge Ledger is the definitive architectural bridge for PlayMoreTCG. It is organized as an Omni-Bridge hierarchy so humans and autonomous agents can find current setup, architecture, risk, and execution guidance without reading source first.

## Required Reading Order

1. [Agent Memory](./agent/agent-memory.md) — strict machine-readable constraints.
2. [Getting Started](./onboarding/getting-started.md) — local setup and first run.
3. [Architecture Overview](./architecture/overview.md) — system structure, diagrams, and request flow.
4. [Risk Map](./architecture/risk-map.md) — fragile areas and required verification probes.
5. [Patterns](./agent/patterns.md) — repeatable implementation recipes.

## Omni-Bridge Taxonomy

### Onboarding

- [Getting Started](./onboarding/getting-started.md)
- [Walkthrough](./onboarding/walkthrough.md)
- [Troubleshooting](./onboarding/troubleshooting.md)

### Architecture

- [Overview](./architecture/overview.md)
- [Directories](./architecture/directories.md)
- [Schemas](./architecture/schemas.md)
- [Decisions](./architecture/decisions.md)
- [Risk Map](./architecture/risk-map.md)

### Agent

- [Agent Memory](./agent/agent-memory.md)
- [Patterns](./agent/patterns.md)

### Root Ledger

- [Changelog](./changelog.md)

## Verified Present-State Snapshot — 2026-04-25

- Project root audited: `/Users/bozoegg/Desktop/PlayMoreTCG/playmore-tcg`.
- Application stack observed in `package.json`: Next.js 16 App Router, React 19, TypeScript 6, Tailwind CSS 4, SQLite via `better-sqlite3` and Kysely, bcryptjs auth, and Stripe client packages.
- Runtime scripts observed: `npm run dev`, `npm run build`, `npm run lint`, `npm run start`.
- Source zones observed under `src/`: `app`, `domain`, `core`, `infrastructure`, `ui`, `utils`, plus `index.css`.
- Next route handlers observed under `src/app/api/**/route.ts` for products, cart, orders, admin orders, and auth.
- Server service flow observed: `src/app/api/**/route.ts` → `src/infrastructure/server/services.ts` → `src/core/container.ts` → Core services → Domain repository interfaces → SQLite adapters.
- Environment keys observed in `.env.example`: `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `SESSION_SECRET`, `SQLITE_DATABASE_PATH`; `TrustedCheckoutGateway.ts` also reads optional `CHECKOUT_ENDPOINT`.
- SQLite schema observed in `src/infrastructure/sqlite/schema.ts` and `database.ts`: `products`, `users`, `carts`, `orders`, `hive_claims`, `hive_audit`.

## Ledger Scope

This documentation pass synchronized the `.wiki/` structure and content from physical observations of repository files. Generated folders such as `.next/`, `dist/`, and `node_modules/` are not architectural source of truth.
