# Walkthrough

## What This App Does

PlayMoreTCG is a trading-card ecommerce app with product browsing, product detail, cart management, checkout, order history, account auth, and admin product/order management.

## How to Read the Codebase

1. Start with `src/domain/models.ts` for the business vocabulary.
2. Read `src/domain/repositories.ts` for contracts that persistence/auth/payment adapters must satisfy.
3. Read `src/core/*Service.ts` for orchestration.
4. Read `src/infrastructure/server/services.ts` and `src/core/container.ts` to understand runtime wiring.
5. Read `src/app/api/**/route.ts` for server HTTP boundaries.
6. Read `src/ui/pages` and `src/ui/apiClientServices.ts` for browser behavior.

## Standard Development Workflow

1. Inspect `git status --short`.
2. Identify the affected Joy-Zoning layer.
3. Make the smallest change in the correct layer.
4. Verify with `npm run lint` and `npm run build`.
5. Manually test the impacted page/API path.
6. Update `.wiki/` when architecture, API, schemas, setup, or risk changes.