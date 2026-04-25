# Agent Memory Core

machine_readable: true
project: PlayMoreTCG
last_verified: 2026-04-25

## Absolute Constraints

- Do not put I/O, `fetch`, SQLite, filesystem access, cookies, or external service calls in `src/domain/`.
- Do not let `src/ui/` import `src/infrastructure/` directly; UI should render state and call API/client service facades.
- Route handlers live under `src/app/api/**/route.ts` and should delegate to `getServerServices()` instead of constructing raw repositories inline.
- SQLite/Kysely table shape is documented by `src/infrastructure/sqlite/schema.ts`; table creation is in `src/infrastructure/sqlite/database.ts`.
- Core services coordinate Domain contracts and Infrastructure adapters; avoid raw database implementation details in Core.
- Keep env secrets out of git. `.env.example` is safe template only.
- Documentation claims must be grounded in physical file observations.

## Architecture Axioms

- Domain → no app dependencies.
- Core → Domain plus adapter contracts; current container composes Infrastructure implementations.
- Infrastructure → external world adapters: SQLite, sessions, auth, Stripe, trusted checkout endpoint.
- UI → React pages/components/hooks and browser API facades.
- Plumbing → stateless utilities.

## Do Nots

- Do not edit `.next/`, `node_modules/`, or generated build artifacts for source fixes.
- Do not read full git history or full repository diffs for documentation passes; use `git status --short` or limited logs only.
- Do not treat legacy deleted `knowledgebase/*` as active source of truth.