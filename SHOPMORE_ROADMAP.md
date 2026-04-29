# ShopMore: The Open Source Commerce Engine (Audit & Roadmap)

ShopMore is designed to be the definitive open-source alternative to Shopify—a neutral, high-performance, and deeply customizable platform for modern merchants. This document outlines the forensic audit and strategic roadmap for achieving industrial-grade commerce sovereignty.

## 1. The "Neutrality" Wedge (Design Philosophy)

To serve as a generic base for any industry (from TCG to Apparel to Digital Goods), ShopMore must embrace a **"Design-Less" Design System**.

*   **Aesthetic Neutrality**: Utilizing a refined, professional, and high-contrast UI that feels premium out-of-the-box but acts as a blank canvas for merchant branding.
*   **Standardized Taxonomy**: Adopting industry-standard terminology (Products, Orders, Customers) to ensure instant familiarity for users migrating from Shopify or BigCommerce.

## 2. The Customization Engine (Deep Audit)

The true power of ShopMore lies in its **Extensibility Substrate**.

### A. Metafields & Custom Attributes
*   **Current Gap**: The domain models are currently rigid.
*   **Wedge**: Implementing a "Dynamic Attribute" system where merchants can define custom fields (e.g., 'Size', 'Color', 'Material', or 'Grade') without modifying the database schema.

### B. Modular UI Components
*   **Current Gap**: UI components are centralized.
*   **Wedge**: Moving toward a "Slot-based" architecture where merchants can swap out product cards, checkout flows, and headers via a simple configuration layer.

### C. Developer Sovereignty (The "Source" Wedge)
*   **Headless-First**: Ensuring every action in the admin is backed by a clean, documented REST/GraphQL API.
*   **Plugin Architecture**: Designing the service layer to support "Hooks" where external scripts can intercept events (e.g., `onOrderCreated`) for custom integrations.

---

## 3. Implementation Roadmap

### Phase 1: Neutralization & Standardization (Immediate)
*   [ ] **Terminology Clean-up**: Refactoring all TCG-specific references (Cards, Rarity, Sets) to generic Product metadata.
*   [ ] **Navigation Re-Architecture**: Implementing the "Approachable Merchant Layout" (Home, Products, Orders, Customers, Analytics, Settings).
*   [ ] **Global Search Hardening**: Finalizing the `SearchCommandPalette` as a universal discovery tool for all product types.

### Phase 2: The Extensibility Framework
*   [ ] **Dynamic Schema**: Adding support for JSON-based `metafields` in the `Product` and `Order` models.
*   [ ] **Theme Tokens**: Moving CSS constants (colors, spacing, radii) into a centralized, user-editable configuration.
*   [ ] **Webhooks Infrastructure**: Implementing a basic event-emitter for critical business events.

### Phase 3: Merchant Onboarding
*   [ ] **Setup Guide 2.0**: A step-by-step interactive wizard for non-technical users to launch their first store.
*   [ ] **Bulk Operations**: Hardening the bulk editor for high-volume inventory management.

---

## 4. Competitive Comparison (Open Source vs. SaaS)

| Feature | Shopify (SaaS) | ShopMore (Open Source) |
| :--- | :--- | :--- |
| **Data Ownership** | Proprietary | **Sovereign (Your Database)** |
| **Customization** | Gated by Liquid/Apps | **Absolute (Full Source Access)** |
| **Cost** | Monthly + Transaction Fees | **Zero Licensing Fees** |
| **Speed** | Shared Infrastructure | **Self-Hosted / Optimized** |

---

> [!IMPORTANT]
> **Audit Note**: The current `ProductsPage.tsx` and `AdminNavigation.ts` still contain references to TCG concepts. These are being purged in the current pass to establish the "Neutral Base."
