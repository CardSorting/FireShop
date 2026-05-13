# Admin Panel & Merchant Operations

The DreamBeesArt Admin Panel is a high-fidelity, production-grade merchant interface designed for high-velocity store management. It follows patterns established by industry leaders like Shopify and Stripe to provide a premium experience for store operators.

## Core Features

### 1. Unified Dashboard
The command center for store operations.
- **KPI Cards**: Real-time tracking of total sales, orders, conversion rate, and average order value.
- **Fulfillment Pipeline**: Visual breakdown of orders across different stages (Pending, Confirmed, Shipped, Delivered).
- **Priority Attention**: Smart detection of orders requiring immediate operator action.
- **Low-Stock Watchlist**: Real-time inventory monitoring to prevent stockouts.

### 2. Order Management
Full lifecycle control over customer purchases.
- **Fulfillment Tracking**: Detailed timeline of order status transitions.
- **Search & Filtering**: Quick access to orders by ID, customer name, or fulfillment status.
- **Operator Controls**: Atomic status updates (Pending → Confirmed → Shipped → Delivered) with transition validation.

### 3. Product & Inventory Management
Advanced tools for catalog maintenance.
- **Inventory Health**: Automated classification of products (Healthy, Low Stock, Out of Stock).
- **Bulk Product Editor**: Spreadsheet-style interface for rapid price and stock adjustments across multiple items.
- **Product Forms**: Sectioned layouts with merchant-guided copy, customer preview cards, and product intake metadata fields for SKU, barcode, unit cost, compare-at price, manufacturer, wholesaler/supplier, and manufacturer SKU.
- **SKU & Supplier Search**: Product list/search flows now include SKU, supplier, manufacturer, manufacturer SKU, and barcode values for faster manufacturer/wholesaler intake handling.
- **Expanded Categories**: Catalog category tabs and Domain validation now include booster, single, deck, accessory, box, elite trainer box, sealed case, graded card, supplies, and other.

### 3.1 Purchase Orders & Receiving
Inbound stock work is presented as a dedicated Receiving workspace rather than a technical purchase-order table.
- **Saved Views**: Operators can switch between All, Draft, Incoming, Partial, Exceptions, Ready to close, and Closed views.
- **Guided Intake**: Purchase-order creation uses product search/selection by product name, SKU, and product metadata instead of raw product-id entry.
- **Dollar Cost Entry**: Unit costs are entered as familiar dollar values and converted to cents before crossing into Core/API contracts.
- **Receiving Count Flow**: Receiving lines show ordered, already received, remaining, receive-now quantity, condition, damaged quantity, disposition, exception reason, and session notes.
- **Exception Review**: Domain-derived line summaries and saved-view matching identify receiving exceptions for missing/partial/attention-required lines.
- **Workspace Endpoint**: `GET /api/admin/purchase-orders?workspace=true` returns saved-view counts, workflow steps, line summaries, and attention flags through Core `PurchaseOrderService.getPurchaseOrderWorkspace()`.

### 4. Customer Management (CRM)
Insights into customer behavior and lifetime value (LTV).
- **Segmentation**: Automated customer buckets (Big Spenders, New, Inactive, Active).
- **LTV Tracking**: Granular tracking of total spent and order frequency per customer.
- **Export Capabilities**: One-click CSV export for external marketing and accounting tools.

### 5. Analytics & Insights
Deep data visualization for informed decision-making.
- **Sales Performance**: Area charts showing net sales over configurable time ranges (7d, 30d, 90d).
- **Live View**: Real-time monitoring of active store sessions and current day performance.
- **Top Products**: Revenue-based ranking of products with growth/decline metrics.
- **Channel Analysis**: Breakdown of sales by acquisition source (Online Store, Direct, Social).

### 6. Discounts & Promotions
Powerful marketing tools to drive conversion.
- **Flexible Types**: Support for both manual discount codes (e.g., `SUMMER24`) and automatic store-wide discounts.
- **Usage Tracking**: Real-time metrics on promotion performance and total discounted value.
- **Scheduling**: Ability to set start and end dates for promotional campaigns.

### 6.1 Concierge Lifecycle Marketing
The admin Concierge workspace includes a **Recovery Funnels** tab backed by `/api/admin/concierge/marketing-strategy`.

Operators can:
- inspect lifecycle playbook coverage
- create missing lifecycle campaign drafts
- activate or pause individual playbooks
- activate or pause all lifecycle playbooks
- run the lifecycle automation pulse
- generate an optimization report
- review strategy guardrails and autonomous operating policies

The full architecture is documented in [Concierge Lifecycle Marketing & Campaign Automation](./lifecycle-marketing-concierge.md).

### 7. Navigation Taxonomy & Route Coverage
The admin shell centralizes merchant navigation in `src/ui/navigation/adminNavigation.ts` so the sidebar, command palette, utility settings link, and quick-create actions share the same labels, descriptions, aliases, and route targets. The operator-facing groups are intentionally familiar to Shopify/Stripe users: **Home**, **Sales**, **Catalog**, **Marketing**, **Insights**, **Settings**, and **Sales Channels**.

Visible admin navigation destinations are backed by App Router page wrappers. The `/admin/analytics` route renders `AdminAnalytics`, and `/admin/discounts` renders `AdminDiscounts`, eliminating dead-end navigation for those previously visible sections.

## Technical Implementation

### Authorization
Admin routes are protected by a session-based guard in `src/infrastructure/server/apiGuards.ts`.
```typescript
export async function requireAdminSession() {
  const user = await requireSessionUser();
  if (user.role !== 'admin') {
    throw new UnauthorizedError('Admin access required');
  }
  return user;
}
```

### UI Components
The admin panel uses a specialized set of components defined in `src/ui/components/admin/AdminComponents.tsx`:
- `AdminPageHeader`: Consistent branding and action placement.
- `AdminMetricCard`: High-fidelity data display with trend indicators.
- `AdminStatusBadge`: Color-coded status labels for orders and inventory.
- `CommandPalette`: Global `Cmd+K` interface for rapid navigation.

### State Management
The admin UI leverages `useServices` hook to interact with the backend through a hardened client API facade (`src/ui/apiClientServices.ts`), ensuring all administrative operations are properly authenticated and scoped.

## Design Principles
1. **High Information Density**: Display maximum relevant data without clutter.
2. **Action-Oriented**: Surface what needs attention (Low stock, Pending orders).
3. **Speed**: Spreadsheet-style editing and global search for high-frequency tasks.
4. **Visual Excellence**: Premium aesthetic using Tailwind CSS 4, subtle micro-animations, and a cohesive dark/light mode palette.
