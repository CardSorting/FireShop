# Getting Started

## Requirements

- Node.js/npm capable of running the package versions in `package.json`.
- Native build support for `better-sqlite3` because SQLite is a native dependency.
- A local `.env` file copied from `.env.example`.

## Install

```bash
cd /Users/bozoegg/Desktop/PlayMoreTCG/playmore-tcg
npm install
```

## Configure Environment

Copy the example file:

```bash
cp .env.example .env
```

Observed keys:

| Key | Required | Source Evidence | Purpose |
|---|---:|---|---|
| `SQLITE_DATABASE_PATH` | Yes | `.env.example`, `src/infrastructure/sqlite/database.ts` | SQLite database file path; defaults to `playmore.db` if unset. |
| `SESSION_SECRET` | Yes | `.env.example` | Session signing/verification support. |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Optional until Stripe UI is configured | `.env.example`, Stripe client dependencies | Browser Stripe publishable key. |
| `CHECKOUT_ENDPOINT` | Optional | `src/infrastructure/services/TrustedCheckoutGateway.ts` | Trusted backend checkout finalization endpoint. |

## First Run

```bash
npm run dev
```

The app uses Next.js App Router. Customer pages are under `src/app/*`; API route handlers are under `src/app/api/*`.

## Optional Seed Data

The repository contains `src/infrastructure/services/SeedDataLoader.ts`. The README documents:

```bash
npx tsx src/infrastructure/services/SeedDataLoader.ts
```

If `tsx` is not installed locally, install the project dependencies first and verify whether the package is available before relying on the seed command.

## Production Build

```bash
npm run build
npm run start
```

`next.config.ts` configures `better-sqlite3` as a server external package, so SQLite access belongs on the server side only.
