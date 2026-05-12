# DreamBeesArt: The Sovereign Commerce Engine

DreamBeesArt is a neutral, high-performance, and deeply industrialized e-commerce engine designed for merchants who prioritize data ownership and operational sovereignty. Built on a hardened TypeScript substrate, DreamBeesArt provides an industry-leading alternative to SaaS platforms, offering absolute control over the entire commerce lifecycle.

---

## 🏗 Architecture (Joy-Zoning)

DreamBeesArt adheres to a strict layered architecture (Clean Architecture / DDD) to ensure business logic remains pure, testable, and decoupled from infrastructure.

| Layer | Path | Responsibility |
| :--- | :--- | :--- |
| **Domain** | `src/domain/` | Pure business logic: models, rules, and repository contracts. **Zero dependencies.** |
| **Core** | `src/core/` | Application orchestration: services coordinate domain logic and infrastructure adapters. |
| **Infrastructure** | `src/infrastructure/` | Adapters for Firestore, Stripe, and server-side utilities. |
| **UI** | `src/ui/` | React 18 components, Next.js pages, and high-fidelity layouts. |
| **Plumbing** | `src/utils/` | Stateless helpers, formatters, and global constants. |

---

## ✨ Industrial Features

### 🛒 Customer Experience
- **Hardened Transaction Pipeline**: Atomic checkout and refund logic with strict inventory guards.
- **Idempotency Guards**: Distributed order creation protected by atomic payment-intent tracking.
- **Handle-Based Routing**: Canonical, SEO-optimized URLs for products and collections.
- **Digital Locker**: Secure, authenticated access to purchased digital assets via signed URLs.

### 🛡 Merchant Administration
- **Support CRM**: Full-stack interaction management with agent collision detection and "Quick Reply" macros.
- **Inventory Intelligence**: Automated stock health tracking, restock recommendations, and supplier management.
- **Audit Logging**: Full traceability for all administrative status changes and high-risk operations.
- **Bulk Operations**: High-speed spreadsheet-style editor for mass inventory and metadata updates.
- **Sovereign Analytics**: Real-time sales, conversion, AOV, and customer LTV insights.

---

## 🚀 Quick Start

### 1. Prerequisites
- **Node.js**: 22.x (LTS)
- **Firebase Project**: Firestore and Authentication enabled.
- **Stripe Account**: For payment processing.

### 2. Initialization
```bash
npm install
# Configure your .env (see .env.example)
npm run setup
```

### 3. Launch
```bash
npm run dev
```

---

## 🛠 Tech Stack

- **Framework**: Next.js 15 (App Router) + React 18
- **Logic**: TypeScript 6 (Strict Mode)
- **Persistence**: Google Cloud Firestore (Distributed NoSQL)
- **Styling**: Tailwind CSS 4
- **Security**: Signed HTTP-only session cookies & Rate-limiting guards
- **Testing**: Playwright (E2E) & Vitest (Unit/Integration)

---

## 📖 Knowledge Base

For deep technical dives and operational guides, refer to the internal **[Knowledge Ledger](.wiki/index.md)**:

- [Architecture Overview](.wiki/architecture/overview.md)
- [Support CRM Design](.wiki/architecture/support-crm.md)
- [Digital Fulfillment Strategy](.wiki/architecture/digital-fulfillment.md)
- [Hardened SEO & Routing](.wiki/architecture/seo-routing.md)

---

> [!NOTE]
> **Industrial Neutrality**: DreamBeesArt is designed to be industry-agnostic. While the current workspace includes TCG-focused mock data, the underlying models and services are ready for any vertical (Apparel, Digital Goods, etc.).

---

## 📄 License

MIT © [DreamBeesArt Contributors](LICENSE)