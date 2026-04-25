# Agent Memory — PlayMoreTCG

```yaml
project: PlayMoreTCG
root: /Users/bozoegg/Desktop/PlayMoreTCG/playmore-tcg
ledger_taxonomy_required: true
root_ledger_files:
  - .wiki/index.md
  - .wiki/changelog.md
required_ledger_dirs:
  - .wiki/onboarding
  - .wiki/architecture
  - .wiki/agent
stack:
  framework: Next.js App Router
  react: 19
  language: TypeScript
  styling: Tailwind CSS 4
  database: SQLite via better-sqlite3 + Kysely
  auth: SQLite-backed auth + session routes
  payments: Stripe packages + optional trusted checkout endpoint
source_layers:
  domain: src/domain pure models/rules/interfaces/errors; no I/O
  core: src/core orchestration and container; coordinates domain + adapters
  infrastructure: src/infrastructure SQLite/server/auth/payment adapters
  app: src/app Next pages and API route handlers
  ui: src/ui React pages/components/hooks/browser API facade
  utils: src/utils stateless helpers
critical_flow: src/app/api/** -> src/infrastructure/server/services.ts -> src/core/container.ts -> core services -> domain interfaces/rules -> infrastructure repositories
high_risk_files:
  - src/core/OrderService.ts
  - src/domain/rules.ts
  - src/infrastructure/sqlite/database.ts
  - src/infrastructure/sqlite/schema.ts
  - src/ui/apiClientServices.ts
commands:
  install: npm install
  dev: npm run dev
  build: npm run build
  lint: npm run lint
env_keys:
  - SQLITE_DATABASE_PATH
  - SESSION_SECRET
  - NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  - CHECKOUT_ENDPOINT optional in TrustedCheckoutGateway
never_treat_as_source_truth:
  - .next
  - dist
  - node_modules
```

## Absolute Constraints

- Before completion, update `.wiki/` with verified current-state facts.
- Keep Domain pure: no `fetch`, filesystem, SQLite, sessions, environment variables, or framework imports.
- Keep UI away from direct Infrastructure imports; use API routes/facades.
- Schema changes must update `src/infrastructure/sqlite/schema.ts`, `database.ts`, repository mappings, and `.wiki/architecture/schemas.md`.
- Checkout changes require risk-map verification.
