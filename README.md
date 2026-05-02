# ShopMore: The Sovereign Commerce Engine

ShopMore is a neutral, high-performance, and deeply customizable e-commerce engine designed for merchants who prioritize data ownership and operational sovereignty. Built on a hardened TypeScript substrate, ShopMore provides an industry-leading alternative to SaaS platforms, offering absolute control over the entire commerce lifecycle.

---

## 🏗 Architecture (Joy-Zoning)

ShopMore adheres to a strict layered architecture (Clean Architecture / DDD) to ensure business logic remains pure, testable, and decoupled from infrastructure.

| Layer | Path | Responsibility |
| :--- | :--- | :--- |
| **Domain** | `src/domain/` | Pure business logic: models, rules, and repository contracts. **Zero dependencies.** |
| **Core** | `src/core/` | Application orchestration: services coordinate domain logic and infrastructure adapters. |
| **Infrastructure** | `src/infrastructure/` | Adapters for SQLite, API-backed services, and payment processors. |
| **UI** | `src/ui/` | React 19 components, Next.js pages, and high-fidelity layouts. |
| **Plumbing** | `src/utils/` | Stateless helpers, formatters, and global constants. |

---

## ✨ Industrial Features

### 🛒 Customer Experience
- **Handle-Based Routing**: Canonical, SEO-optimized URLs for products and collections.
- **Digital Locker**: Secure, authenticated access to purchased digital assets via ephemeral signed URLs.
- **Support Center**: Integrated ticketing and knowledgebase for frictionless customer lifecycle management.
- **Trusted Checkout**: Hardened payment orchestration with real Stripe integration and idempotency guards.

### 🛡 Merchant Administration
- **Support CRM**: Full-stack interaction management with agent collision detection and "Quick Reply" macros.
- **Digital Vault**: Memory-efficient, streaming-first ingestion for massive digital asset management.
- **Inventory Intelligence**: Automated stock health tracking, restock recommendations, and supplier management.
- **Bulk Operations**: High-speed spreadsheet-style editor for mass inventory, price, and metadata updates.
- **Sovereign Analytics**: Real-time sales, conversion, AOV, and customer LTV insights.

---

## 🚀 Quick Start

Follow these steps to initialize your sovereign commerce workspace.

### 1. Prerequisites
- **Node.js**: 20.x or higher
- **npm**: 10.x or higher

### 2. Quick Initialization
```bash
# Install dependencies, initialize .env, and seed the database
npm run setup
```
> [!TIP]
> The setup script automatically copies `.env.example` to `.env` and generates a fresh `SESSION_SECRET` for you.

### 3. Launch Engine
```bash
# Start development server
npm run dev
```

---

## 🛠 Tech Stack

- **Framework**: Next.js 15 (App Router) + React 19
- **Logic**: TypeScript 5+ (Strict Mode)
- **Persistence**: SQLite via Kysely & better-sqlite3
- **Styling**: Tailwind CSS 4
- **Security**: Signed HTTP-only session cookies & Rate-limiting guards
- **Monitoring**: PRODUCTION_READY_METRICS.md

---

## 📖 Knowledge Base

For deep technical dives and operational guides, refer to the internal **[Knowledge Ledger](.wiki/index.md)**:

> [!TIP]
> Use the [Architecture Overview](.wiki/architecture/overview.md) to understand the request lifecycle and [Day 2 Operations](.wiki/onboarding/day-2.md) for a guide on extending the engine.

- [Support CRM Architecture](.wiki/architecture/support-crm.md)
- [Digital Fulfillment Strategy](.wiki/architecture/digital-fulfillment.md)
- [SEO & Navigation Hardening](.wiki/architecture/seo-routing.md)
- [Admin Access Guide](.wiki/admin-access.md)

---

> [!NOTE]
> **Industrial Neutrality**: ShopMore is designed to be industry-agnostic. While the current workspace includes TCG-focused mock data, the underlying models and services are ready for any vertical (Apparel, Digital Goods, etc.).

---

## 📄 License

MIT © [ShopMore Contributors](LICENSE)