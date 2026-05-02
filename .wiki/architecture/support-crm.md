# Support CRM Architecture

The ShopMore Support CRM is an enterprise-grade ticketing and interaction management system designed to handle high-volume customer inquiries with professional efficiency.

## Core Components

### 1. Ticketing Engine
- **Atomic Threads**: All communication is organized into atomic `SupportTicket` entities with chronological message threads.
- **Status Lifecycle**: Tickets follow a standard lifecycle: `open` → `pending` → `solved` → `closed`.
- **Priority Scoring**: Automated (or manual) priority assignment to ensure SLA compliance.

### 2. Agent Interaction Suite
- **Real-Time Collision Detection**: Prevents multiple agents from responding to the same ticket simultaneously via a "heartbeat" lock mechanism.
- **Quick Reply Macros**: Merchant-defined templates for common responses, supporting dynamic variable injection.
- **Internal Notes**: Private agent-only comments for collaboration without customer visibility.

### 3. Knowledgebase Integration
- **Contextual Routing**: Tickets can be linked to Knowledgebase articles for rapid resolution.
- **Article Management**: Fully integrated editor for creating SEO-friendly support documentation.

## Data Flow

1. **Submission**: Customer submits a ticket via the `/support` portal or order dashboard.
2. **Ingestion**: Core `TicketService` validates the payload and persists the ticket to the `support_tickets` table.
3. **Assignment**: Tickets are queued for admin review or auto-assigned based on load.
4. **Resolution**: Agents interact via the Admin CRM, using macros and real-time collision guards.
5. **Feedback Loop**: Once solved, customers can provide satisfaction ratings, which are tracked in the CRM metrics.

## Security & Sovereignty
- **Role-Based Access**: Only users with `admin` or `support_agent` roles can access the CRM.
- **Data Locality**: All ticket data, attachments, and logs are stored in the sovereign SQLite database, ensuring full privacy and ownership.
