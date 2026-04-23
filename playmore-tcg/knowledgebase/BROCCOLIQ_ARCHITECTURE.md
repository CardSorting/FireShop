# PlayMoreTCG: Sovereign Architecture & Workspace Documentation

This document provides a comprehensive architectural overview of the `PlayMoreTCG` workspace. The application is built on a high-performance, deterministic Local-First paradigm, deeply hardened using `BroccoliQ` and `BroccoliDB` patterns. It guarantees 0ms latency on hot-paths, absolute concurrency control, and zero data loss on process failures.

---

## 🏛️ System Overview & Tech Stack

PlayMoreTCG is an e-commerce application engineered for extreme velocity and structural integrity.
- **Frontend / Build System:** React 19, Vite, Tailwind CSS.
- **Local-First Database:** `better-sqlite3` strictly typed via `kysely`.
- **Cloud Synchronization:** Firebase / Firestore (Provider toggleable).
- **Payment Processing:** Stripe Integration.

The system features a dual-provider database architecture. By setting `VITE_DB_PROVIDER=sqlite` or `firebase`, the underlying infrastructure seamlessly swaps out without affecting the core application layers.

---

## 🏗️ Domain-Driven Design (DDD) Layout

The workspace strictly enforces bounded contexts to prevent architectural decay and infrastructure leakage.

### 1. `src/domain/` (The Core Contract)
Contains zero implementation details. Pure TypeScript interfaces (`ICartRepository`), error definitions (`CartEmptyError`), business rules (`canPlaceOrder`), and core schemas.

### 2. `src/core/` (Business Logic & Orchestration)
Contains the raw business logic. Services (`OrderService`, `CartService`) orchestrate the domain models. 
* **Strict Lazy Initialization Container:** `container.ts` acts as the definitive service locator. It provides both `getInitialServices()` (Singleton) and `getServiceContainer()` (Factory) to completely prevent circular dependency deadlocks and lazy-load infrastructure providers.

### 3. `src/infrastructure/` (Concrete Reality)
The physical execution layer. This directory houses the `SQLite` and `Firestore` repository implementations, the Stripe payment processors, and the physical `dbProvider.ts` orchestrator.

---

## 🛡️ BroccoliQ Local-First Hardening (The 7 Pillars)

The SQLite local-first infrastructure is heavily fortified using the `BroccoliDB` substrate paradigms:

### Level 3: Dual-Buffering (0ms Write Latency)
**File:** `infrastructure/repositories/sqlite/SQLiteCartRepository.ts`
* **Concept:** Instead of writing directly to disk, cart mutations are captured instantly in a RAM `Map` (`activeBuffer`). 
* **Result:** 0ms IO latency for users modifying their shopping carts.

### Level 4: Atomic Flush Synchronization
**File:** `infrastructure/repositories/sqlite/SQLiteCartRepository.ts`
* **Concept:** A background event loop runs every 1,000ms, atomically swapping the `activeBuffer` into an `inFlightBuffer` (Protected Swap), then flushing it via a bulk Kysely transaction.
* **Safety:** If a disk lock (`SQLITE_BUSY`) occurs, the un-flushed ops intelligently merge back into the main buffer without overwriting newer state mutations.

### Level 5: Sovereign Locking (Re-entrant RAM Mutex)
**File:** `infrastructure/sqlite/SovereignLocker.ts`
* **Concept:** Mutual Exclusion (Mutex) to prevent race conditions during concurrent checkouts.
* **Hardening:** Uses `node:async_hooks` for a **Re-entrant Memory Mutex**. If multiple requests hit the same Node process, they queue sequentially in RAM (0ms overhead). Only the active request interacts with the physical `hive_claims` table, completely shielding the DB from lock-contention spam.

### Level 6: Builder's Punch (Coalesced Batching)
**File:** `core/OrderService.ts`, `SQLiteProductRepository.ts`
* **Concept:** Coalesces multiple product inventory deductions (from a cart) into a single, highly optimized `batchUpdateStock` atomic query.

### Level 7: Memory-First Auth-Index
**File:** `infrastructure/repositories/sqlite/SQLiteProductRepository.ts`
* **Concept:** The product catalog is mirrored directly into an `authIndex` `Map`. 
* **Result:** `O(1)` time complexity lookups in RAM. The index selectively invalidates upon admin mutation to guarantee eventual consistency.

### Level 9: Sovereign Boot & Final Flush (Lifecycle Integrity)
**Files:** `core/container.ts`, `infrastructure/dbProvider.ts`
* **Sovereign Warmup:** The Dependency Injection container explicitly fires `productRepo.warmup()` when the backend initializes, pre-loading the Level 7 Product Index into RAM before the first user connects.
* **Final Sovereign Flush:** A global Graceful Shutdown Registry intercepts Node `SIGTERM`/`SIGINT` and Browser `beforeunload` signals. It forcefully halts the `IntegrityWorker` and explicitly flushes pending memory buffers to disk *before* allowing the process to die.

### Level 11: Axiomatic Reliability (Sagas & Backpressure)
**Files:** `core/OrderService.ts`, `SQLiteCartRepository.ts`
* **Agent Shadow Rollbacks (Sagas):** `OrderService` treats checkout as a localized transaction. It eagerly deducts stock, processes the Stripe payment, and if the payment declines, immediately runs an inverted database write (Compensating Transaction) to fully restore the inventory, ensuring 0% inventory bleed.
* **Memory Backpressure:** Hard boundaries (`MAX_BUFFER_SIZE = 5000` carts, `MAX_INDEX_SIZE = 10000` products) prevent Out-Of-Memory (OOM) crashes by selectively throttling writes or dynamically falling back to disk reads if the node's physical resources are exhausted.

---

## 🔄 The Autonomous Data Flow (Checkout Example)

1. **Lock:** User initiates checkout. `SovereignLocker` allocates a Re-entrant RAM Mutex, then locks the physical `hive_claims` table.
2. **Read:** `OrderService` validates the cart against the `O(1)` memory-first Product Index.
3. **Shadow Write:** Stock is defensively deducted via Coalesced Batching.
4. **External Boundary:** Stripe API is called.
5. **Saga Evaluation:**
   - *Success:* The order is flushed to the DB, and the cart is wiped.
   - *Failure:* The Agent Shadow triggers a Compensating Transaction, rolling back the exact stock delta to prevent data corruption.
6. **Release:** Mutex queue is advanced, and the DB lock is dropped.
