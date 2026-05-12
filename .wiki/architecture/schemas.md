# Data Schemas & Contracts

DreamBeesArt utilizes a unified data model that flows from the Firestore substrate up to the React UI.

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

## Persistence Layer (Firestore)

Firestore is used as the primary transactional database, organized into collections:

### Primary Collections
- **`products`**: Central catalog with optimized queries on `handle` and `sku`.
- **`orders`**: Transactional order data with embedded line items.
- **`support_tickets`**: CRM ticket data with threaded messages.
- **`inventory_levels`**: Scalable stock tracking across locations.
- **`settings`**: Dynamic configuration and engine parameters.

## Repository Contracts

Defined in `src/domain/repositories.ts`.

Every repository must implement a predictable interface, ensuring the persistence layer can be swapped or mocked for testing.

- `IProductRepository`: `findById`, `findByHandle`, `search`, `save`, `delete`.
- `IOrderRepository`: `findById`, `findByUserId`, `save`.
- `ICartRepository`: Session-scoped cart persistence.
- `ITicketRepository`: CRM operations.
