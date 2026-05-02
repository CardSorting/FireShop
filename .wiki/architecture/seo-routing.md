# SEO & Navigation Architecture

ShopMore prioritizes search engine authority and seamless navigation discovery through a robust, handle-based routing architecture.

## Canonical Routing Strategy

### 1. Handle-Based URLs
The platform has transitioned from legacy ID-based routes to clean, search-engine-friendly handles:
- **Products**: `/products/[handle]` (e.g., `/products/charizard-base-set-1`)
- **Collections**: `/collections/[slug]` (e.g., `/collections/rare-holos`)
- **Pages**: `/pages/[slug]`

### 2. Taxonomy Synchronization
The `TaxonomyService` ensures that category and collection handles are consistent across the storefront, admin panel, and search results. This prevents "route leakage" and ensures that crawlers see a unified structure.

## Crawler Optimization

### 1. Automated Sitemap & Robots
- **Dynamic Sitemap**: The system automatically generates a `sitemap.xml` including all active products, collections, and static pages.
- **Robots.txt**: Managed configuration to guide search engine bots effectively.

### 2. JSON-LD Structured Data
Every product and collection page injects standard JSON-LD metadata, including:
- **Product Schema**: Name, Image, SKU, Price, Availability, and Reviews.
- **Breadcrumb Schema**: Clear hierarchical path for search engine rich snippets.

## Discovery Patterns

### 1. Contextual Navigation
Navigation patterns are designed to preserve browsing journeys. The "Shop All" and "Collection" filters are URL-driven, making them bookmarkable and indexable.

### 2. Command Palette Integration
The global `Cmd+K` interface uses the same taxonomy aliases, ensuring that both users and internal search logic share a common vocabulary.
