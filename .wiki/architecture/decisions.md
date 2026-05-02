# Architecture Decision Records (ADR)

This document tracks the critical architectural decisions that define the ShopMore engine.

## ADR 1: SQLite as the Sovereign Substrate
- **Decision**: Use SQLite (`better-sqlite3`) as the primary transactional database.
- **Rationale**: Zero-config, massive performance for small-to-medium merchants, and extreme portability. It enables the "Sovereign" philosophy by keeping the entire store in a single file.
- **Constraint**: Must be accessed via Kysely for type-safe query building.

## ADR 2: Layered Joy-Zoning
- **Decision**: Enforce a 4-layer architecture (Domain, Core, Infrastructure, UI).
- **Rationale**: Prevents framework lock-in and ensures business rules (Domain) can be tested in isolation.
- **Constraint**: Dependency flow is strictly unidirectional (UI → Core → Domain).

## ADR 3: Handle-Based Routing (SEO)
- **Decision**: Retire ID-based URLs in favor of canonical handles.
- **Rationale**: Industry-standard SEO practice. Improves search engine indexing and user-readable sharing.
- **Implementation**: The `TaxonomyService` manages handle generation and collision detection.

## ADR 4: Atomic Fulfillment State Machine
- **Decision**: Order status transitions must follow a validated state machine.
- **Rationale**: Prevents impossible states (e.g., `Delivered` → `Confirmed`).
- **Implementation**: Enforced in `src/domain/rules.ts` and `src/core/OrderService.ts`.

## ADR 5: Heartbeat Agent Collision
- **Decision**: Use a client-side heartbeat to lock tickets in the Admin CRM.
- **Rationale**: Prevents multiple agents from responding to the same customer simultaneously.
- **Implementation**: 30-second TTL locks stored in the `SovereignLocker`.
