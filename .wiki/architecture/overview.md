# Architectural Overview

ShopMore is engineered with a strict emphasis on **Joy-Zoning**—a structural philosophy that ensures every line of code has a clear, deterministic home. This isolation of concerns prevents "spiral debt" and ensures the engine remains maintainable as it scales.

## The Joy-Zoning Layers

| Layer | Responsibility | Constraints |
| :--- | :--- | :--- |
| **Domain** | Business models, pure rules, and repository contracts. | **No I/O.** No Next.js, no DB, no Fetch, no Cookies. |
| **Core** | Service orchestration and business workflow coordination. | **No low-level mechanics.** Delegates to injected adapters. |
| **Infrastructure** | Concrete adapters for DB, Auth, Payments, and HTTP routes. | **Implementation details.** Translates between HTTP/DB and Core. |
| **UI** | Presentation, client-side state, and user interaction. | **No direct Infra access.** Communicates via Core services or API. |

## Request Lifecycle

The request lifecycle is designed to be deterministic and forensic-ready.

1. **Transport**: A request hits a Next.js App Router route (`src/app/api/...`).
2. **Guards**: The route immediately applies security guards (session, role, rate-limiting) from `src/infrastructure/server/apiGuards.ts`.
3. **Parsing**: Request bodies are parsed and validated against Domain-aligned contracts.
4. **Orchestration**: The route delegates to a Core service retrieved from the `getInitialServices()` container.
5. **Persistence**: The service coordinates Domain rules and persists changes via an Infrastructure repository.
6. **Response**: Results are returned as JSON, with errors mapped to appropriate HTTP status codes via `jsonError()`.

## Core Philosophy: Operational Sovereignty

- **Data Ownership**: All transactional and customer data is stored in a sovereign Firestore database, ensuring full privacy and cloud-native scalability.
- **Aesthetic Neutrality**: The UI is designed to be a high-performance blank canvas, allowing merchants to project their branding without engine-level interference.
- **Headless-First**: Every action in the Admin Panel is backed by a clean, documented API route, enabling future headless integrations.
