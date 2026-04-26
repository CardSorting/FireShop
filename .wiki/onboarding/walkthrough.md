# Codebase Walkthrough

## 1. Domain layer: `src/domain/`

The Domain layer is pure TypeScript business structure.

- `src/domain/models.ts` defines products, users, carts, orders, order statuses, and addresses.
- `src/domain/repositories.ts` defines interfaces for product/cart/order repositories, auth provider, payment processor, checkout gateway, and lock provider.
- `src/domain/rules.ts` implements deterministic validation and calculations: product constraints, cart quantity/stock validation, order item validation, shipping address validation, stock-delta coalescing, and cent formatting.

Constraint: keep this layer free of Next.js, cookies, crypto, database clients, fetch, filesystem, and environment-variable reads.

## 2. Core layer: `src/core/`

Core owns orchestration.

- `src/core/container.ts` wires repositories/adapters into services through a factory path (`getServiceContainer`) and a lazy singleton path (`getInitialServices`).
- `AuthService`, `CartService`, `OrderService`, and `ProductService` coordinate Domain contracts and delegate persistence/payment to injected dependencies.

Constraint: Core may wire Infrastructure but should not implement low-level DB/cookie/http mechanics directly.

## 3. Infrastructure layer: `src/infrastructure/` and `src/app/api/`

Infrastructure adapts the outside world.

- SQLite persistence lives under `src/infrastructure/sqlite/` and `src/infrastructure/repositories/sqlite/`.
- External/service adapters live under `src/infrastructure/services/`.
- Server composition bridge lives at `src/infrastructure/server/services.ts` and initializes SQLite once before returning Core services.
- Session cookie integrity lives at `src/infrastructure/server/session.ts`.
- Shared API guard behavior lives at `src/infrastructure/server/apiGuards.ts`.
- Next API routes under `src/app/api/` translate HTTP requests into Core service calls.

Session-owned customer routes:
- `src/app/api/cart/route.ts`
- `src/app/api/cart/items/route.ts`
- `src/app/api/orders/route.ts`

Admin-protected routes:
- `src/app/api/admin/orders/route.ts`
- `src/app/api/admin/orders/[id]/route.ts`
- `src/app/api/products/route.ts` for product creation
- `src/app/api/products/[id]/route.ts` for product update/delete

## 4. UI layer: `src/ui/`

UI presents state and dispatches intentions.

- `src/ui/apiClientServices.ts` is the browser API facade. It preserves Domain service-like method signatures but must not be trusted for authorization.
- Page components under `src/ui/pages/` render flows for browsing products, cart, checkout, orders, auth, and admin views.
- Hooks under `src/ui/hooks/` expose services/auth state to components.

Constraint: UI must not import Infrastructure directly. It should communicate with server APIs over HTTP or consume Domain types.

## 5. Plumbing layer: `src/utils/`

Shared stateless helpers live here. They should remain context-free and should not import Domain/Core/Infrastructure/UI.

## Request flow diagram

```mermaid
sequenceDiagram
  participant Browser as UI browser client
  participant ApiClient as src/ui/apiClientServices.ts
  participant Route as src/app/api route
  participant Guards as src/infrastructure/server/apiGuards.ts
  participant Session as src/infrastructure/server/session.ts
  participant Services as Core services
  participant DB as SQLite repositories

  Browser->>ApiClient: call cart/order/product/admin method
  ApiClient->>Route: fetch JSON; session cookie sent by browser
  Route->>Guards: requireSessionUser or requireAdminSession
  Guards->>Session: getSessionUser
  Session-->>Guards: verified User or null
  Guards-->>Route: User / throws Domain/Auth error
  Route->>Services: invoke service with trusted identity/data
  Services->>DB: repository operation
  DB-->>Services: Domain model data
  Services-->>Route: result
  Route-->>ApiClient: JSON response
```
