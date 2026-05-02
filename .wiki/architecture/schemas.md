# Data Schemas & Contracts

ShopMore utilizes a unified data model that flows from the SQLite substrate up to the React UI.

## Core Domain Models

Defined in `src/domain/models.ts`.

### Product
- `id`, `name`, `handle`, `description`
- `price`, `stock`, `imageUrl`
- `category` (Union: `booster`, `single`, etc.)
- **Intake Metadata**: `sku`, `barcode`, `cost`, `compareAtPrice`, `manufacturer`.

### Order
- `id`, `userId`, `total`, `status`
- `items`: Snapshot of product data at time of purchase.
- `shippingAddress`: `street`, `city`, `state`, `zip`.
- `fulfillmentEvents`: Chronological timeline of status changes.

### Support Ticket
- `id`, `subject`, `status`, `priority`
- `messages`: Thread of agent and customer interactions.
- `assigneeId`, `assigneeName`.

## Persistence Layer (SQLite)

Defined in `src/infrastructure/sqlite/schema.ts` and managed via Kysely.

### Primary Tables
- **`products`**: Central catalog with indexes on `handle` and `sku`.
- **`orders`**: Header-level order data.
- **`order_items`**: Line-item details with price snapshots.
- **`support_tickets`**: CRM ticket data.
- **`support_messages`**: Threaded message storage.
- **`inventory_levels`**: Location-based stock tracking.

## Repository Contracts

Defined in `src/domain/repositories.ts`.

Every repository must implement a predictable interface, ensuring the persistence layer can be swapped or mocked for testing.

- `IProductRepository`: `findById`, `findByHandle`, `search`, `save`, `delete`.
- `IOrderRepository`: `findById`, `findByUserId`, `save`.
- `ICartRepository`: Session-scoped cart persistence.
- `ITicketRepository`: CRM operations.
