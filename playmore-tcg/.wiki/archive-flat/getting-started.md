# Getting Started

## Prerequisites

- Node.js/npm available.
- Repository root: `/Users/bozoegg/Desktop/PlayMoreTCG/playmore-tcg` for this observed workspace.

## First Run

```bash
cd /Users/bozoegg/Desktop/PlayMoreTCG/playmore-tcg
npm install
cp .env.example .env
npm run dev
```

Open the local URL printed by Next.js.

## Optional Seed Step

README documents:

```bash
npx tsx src/infrastructure/services/SeedDataLoader.ts
```

Note: `tsx` is not listed in `package.json` devDependencies as observed during this pass; use this command only if the local environment can resolve `tsx` or add the dependency deliberately.

## Environmental Parity Checklist

```bash
npm run lint
npm run build
npm run dev
```

Confirm `.env` includes:

- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `SESSION_SECRET`
- `SQLITE_DATABASE_PATH`

SQLite defaults to `playmore.db` if `SQLITE_DATABASE_PATH` is absent, per `src/infrastructure/sqlite/database.ts`.