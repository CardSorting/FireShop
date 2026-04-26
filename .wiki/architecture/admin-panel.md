# Admin Panel & Merchant Operations

The PlayMoreTCG Admin Panel is a high-fidelity, production-grade merchant interface designed for high-velocity store management. It follows patterns established by industry leaders like Shopify and Stripe to provide a premium experience for store operators.

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
- **Product Forms**: Sectioned layouts with merchant-guided copy and customer preview cards.

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
