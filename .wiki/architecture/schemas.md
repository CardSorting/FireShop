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

### Marketing Campaign
- `id`, `name`, `description`, `type`, `status`
- `channels`: email, sms, concierge push, or store notice.
- `triggerType`, `triggerConfig`: event, segment, or schedule behavior.
- `lifecycleStage`: reach, acquisition, intent capture, consideration, conversion, retention, win-back, loyalty, or sunset.
- `offerStrategy`: none, social proof, help-first, free shipping, tiered discount, bundle value, or VIP access.
- `suppressionRules`: consent, active ticket, recent purchase, and recent campaign suppression.
- `steps`: multi-touch campaign sequence with delay, objective, channel, offer strategy, templates, and split-test variants.
- `frequencyCapDays`, `priority`, `dynamicIncentivesEnabled`, `incentiveRules`.
- `sentCount`, `clickCount`, `conversionCount`, `revenueGenerated`.

### Campaign Event
- `id`, `campaignId`, `userId`, `customerEmail`, `channel`, `status`.
- `stepIndex`, `variantId`, `nextStepDueAt`: sequence state.
- `subject`, `body`, `personalizedMetadata`: send snapshot.
- `relatedOrderId`, `conversionValue`, `sentAt`, `clickedAt`, `convertedAt`.

### Customer Segment
- `id`, `name`, `description`, `queryType`, `rules`, `customerCount`.
- Used as the repository-backed segment substrate for lifecycle marketing expansion.

## Persistence Layer (Firestore)

Firestore is used as the primary transactional database, organized into collections:

### Primary Collections
- **`products`**: Central catalog with optimized queries on `handle` and `sku`.
- **`orders`**: Transactional order data with embedded line items.
- **`support_tickets`**: CRM ticket data with threaded messages.
- **`inventory_levels`**: Scalable stock tracking across locations.
- **`marketingCampaigns`**: Concierge lifecycle campaign definitions, playbooks, governance, and performance counters.
- **`campaignEvents`**: Campaign execution snapshots, sequence scheduling state, and conversion attribution.
- **`customerSegments`**: Dynamic or manual marketing segment definitions.
- **`settings`**: Dynamic configuration and engine parameters.

## Repository Contracts

Defined in `src/domain/repositories.ts`.

Every repository must implement a predictable interface, ensuring the persistence layer can be swapped or mocked for testing.

- `IProductRepository`: `findById`, `findByHandle`, `search`, `save`, `delete`.
- `IOrderRepository`: `findById`, `findByUserId`, `save`.
- `ICartRepository`: Session-scoped cart persistence.
- `ITicketRepository`: CRM operations.
- `ICampaignRepository`: Lifecycle campaign persistence, metric increments, and marketing overview.
- `ICampaignEventRepository`: Send events, scheduled sequence steps, and conversion attribution.
- `ICustomerSegmentRepository`: Segment definition persistence.

See [Concierge Lifecycle Marketing & Campaign Automation](./lifecycle-marketing-concierge.md) for the full marketing and Concierge integration contract.
