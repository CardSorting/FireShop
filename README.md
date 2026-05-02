# PlayMoreTCG — E-Commerce Platform

A full-stack ecommerce application for trading card game products, built with **Next.js**, **React**, **TypeScript**, **Tailwind CSS**, and **SQLite**.

## Architecture (Joy-Zoning)

| Layer | Path | Responsibility |
|---|---|---|
| **Domain** | `src/domain/` | Pure business logic: models, rules, errors, repository contracts |
| **Core** | `src/core/` | Application orchestration: services coordinate domain + infrastructure |
| **Infrastructure** | `src/infrastructure/` | Adapters: SQLite repositories, API-backed client services, payment processors |
| **UI** | `src/ui/` | React components, pages, hooks, layouts |
| **Plumbing** | `src/utils/` | Stateless helpers: constants, formatters, validators |

## Features

### Customer
- Browse products with category filtering
- Product detail pages with SEO-friendly handles and canonical routing
- Digital Locker: Access purchased digital assets securely from the account dashboard
- Support Center: Submit tickets and browse a merchant-managed knowledgebase
- Add to cart (quantity selector)
- Full cart management (update qty, remove items)
- Checkout with shipping address + mock payment
- Order history with status tracking
- Account creation & login

### Admin
- **Support CRM**: Full-stack ticketing system with "Quick Reply" macros, real-time agent collision detection, and customer feedback loops.
- **Digital Vault**: Memory-efficient, streaming-first ingestion for massive digital assets and high-fidelity fulfillment tracking.
- **Unified Dashboard**: Real-time stats, revenue charts, fulfillment pipeline, and priority action items.
- **Order Management**: Fulfillment tracking, status transitions, and detailed order insights.
- **Inventory Health**: Automated stock classification (Healthy, Low, Out) and restock recommendations.
- **Bulk Product Editor**: High-speed spreadsheet-style interface for mass price and stock updates.
- **Customer CRM**: LTV tracking, automated segmentation (Big Spenders, New, etc.), and CSV exports.
- **SEO Management**: Canonical handle generation, JSON-LD structured data, and automated sitemap/robots orchestration.
- **Command Palette**: Global `Cmd+K` interface for rapid navigation across the admin panel.
- **Role-based Access Control**: Hardened session-based protection for all administrative routes.

## Tech Stack

| Concern | Technology |
|---|---|
| Framework | Next.js App Router + React 19 + TypeScript |
| Styling | Tailwind CSS 4 |
| Router | Next.js App Router |
| Auth | SQLite-backed auth via Next API routes and HTTP-only session cookie |
| Database | SQLite via better-sqlite3 + Kysely |
| Icons | Lucide React |

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Copy `.env.example` to `.env` and adjust local values if needed:
```bash
cp .env.example .env
```

Required environment variables:
- `SQLITE_DATABASE_PATH`
- `SESSION_SECRET`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (optional until Stripe checkout is configured)

### 3. Seed Mock Products
```bash
npx tsx src/infrastructure/services/SeedDataLoader.ts
```

### 4. Start Dev Server
```bash
npm run dev
```

### 5. Build for Production
```bash
npm run build
```

## Admin Setup
Users are stored in SQLite. You can use the pre-created admin account for development. See the [Admin Access Guide](.wiki/admin-access.md) for credentials and instructions.

## Project Structure

```
src/
├── domain/          # Models, rules, errors, repository interfaces
├── core/            # Services (CartService, OrderService, etc.)
├── app/             # Next.js routes and API route handlers
├── infrastructure/  # SQLite repositories, server session/database helpers
├── ui/              # Pages, components, hooks, layouts
├── utils/           # Constants, helpers
└── index.css        # Tailwind theme
```

## License

MIT