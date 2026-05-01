# Product Management & Intake Metadata

This page documents the verified backend and admin UI product-management shape for manufacturer/wholesaler intake data.

## Verified product domain shape

`src/domain/models.ts` defines `Product` with these optional intake and pricing metadata fields in addition to the existing catalog fields:

- `compareAtPrice?: number` — cents.
- `cost?: number` — cents paid to manufacturer, wholesaler, or supplier.
- `sku?: string` — store stock keeping unit.
- `manufacturer?: string` — manufacturer or brand source.
- `supplier?: string` — wholesaler, distributor, or intake source.
- `manufacturerSku?: string` — vendor/manufacturer catalog identifier.
- `barcode?: string` — barcode or UPC-style scan code.

`ProductCategory` is still a controlled Domain union and now includes the original categories plus additional operational categories: `elite_trainer_box`, `sealed_case`, `graded_card`, `supplies`, and `other`.

## Verified domain validation

`src/domain/rules.ts` remains pure and validates product intake metadata without I/O:

- `SKU` and `manufacturerSku` are optional but cannot be blank when provided and are capped by `MAX_PRODUCT_SKU_LENGTH`.
- `barcode` is optional but cannot be blank when provided and is capped by `MAX_PRODUCT_BARCODE_LENGTH`.
- `manufacturer` and `supplier` are optional but cannot be blank when provided and are capped by `MAX_PRODUCT_PARTNER_FIELD_LENGTH`.
- `cost` and `compareAtPrice` are optional non-negative whole-number cent values and share the product price maximum.
- Product draft/update validation accepts the expanded category set.

## Verified SQLite persistence

`src/infrastructure/sqlite/schema.ts` adds nullable columns for `compareAtPrice`, `cost`, `sku`, `manufacturer`, `supplier`, `manufacturerSku`, and `barcode` to `ProductTable`.

`src/infrastructure/sqlite/database.ts` creates those columns for new databases and applies additive `ALTER TABLE products ADD COLUMN ...` migrations for existing SQLite catalogs. It also creates indexes for product management lookups:

- `idx_products_sku_unique` on `products.sku`, unique.
- `idx_products_supplier` on `products.supplier`.
- `idx_products_manufacturer` on `products.manufacturer`.

## Verified repository behavior

`src/infrastructure/repositories/sqlite/SQLiteProductRepository.ts` maps the new nullable columns into optional Domain `Product` fields, persists them on create, whitelists them on update, and includes `sku`, `manufacturer`, `supplier`, `manufacturerSku`, and `barcode` in product search for both SQL fallback and in-memory catalog index paths.

Duplicate SKU writes are translated into `InvalidProductError('SKU must be unique')` when SQLite reports the SKU unique constraint through either the index name or `products.sku` constraint message.

## Verified API boundary behavior

`src/infrastructure/server/apiGuards.ts` parses product create/update transport payloads for the intake fields before Core product orchestration. Optional integer cent fields are handled through `optionalInteger()` and optional text fields through `optionalString()`.

`src/app/api/products/route.ts` forwards the public/admin product-list `query` parameter into Core product retrieval, enabling backend SKU/supplier/manufacturer search through the existing product-service flow.

## Verified Core orchestration

`src/core/ProductService.ts` still validates product drafts/updates through Domain rules before repository writes. Product creation audit details now include `sku`, `manufacturer`, and `supplier` when present.

## Verified admin UI management

`src/ui/pages/admin/AdminProductForm.tsx` now binds and submits product intake metadata:

- SKU.
- Barcode / UPC.
- Unit cost.
- Compare-at price.
- Manufacturer.
- Wholesaler / supplier.
- Manufacturer SKU.

The form loads the same metadata when editing existing products and sends cent-based `cost` / `compareAtPrice` values through the existing product service client.

`src/ui/pages/admin/AdminProducts.tsx` now exposes expanded category tabs, forwards product search to the backend, searches visible products by SKU/supplier/manufacturer/manufacturer SKU/barcode, and displays SKU/supplier intake details in list/grid cards.

### 2026-05-01 admin product search/filter/navigation update

`src/domain/models.ts` now defines product-management query/read-model contracts used by the admin saved-view list:

- `ProductSavedView` includes `needs_attention` in addition to `all`, `active`, `drafts`, `low_stock`, `missing_sku`, `missing_cost`, `needs_photos`, and `archived`.
- `ProductManagementSortKey` defines the supported admin product sorts: recently updated, newest created, title A–Z/Z–A, inventory low/high, price low/high, and margin low/high.
- `ProductManagementFilters` defines optional admin list filters for status, category, vendor, product type, inventory health, setup status/issue, margin health, tag, SKU presence, image presence, cost presence, sort, limit, and cursor.
- `ProductManagementFacets`, `ProductManagementFacetOption`, and `ProductManagementActiveFilter` define the saved-view facet and active-filter metadata returned to the UI.
- `ProductSavedViewResult` now includes `filteredCount`, `facets`, `activeFilters`, `sort`, and optional `nextCursor` in addition to `view`, `totalCount`, and `products`.

`src/core/ProductService.ts` now treats product management saved views as a Core orchestration concern:

- Validates product saved-view values including the new `needs_attention` view.
- Validates product-management sort keys through `isProductManagementSort()`.
- Enriches products for management, applies saved-view matching, applies explicit product-management filters, builds facets, builds active-filter metadata, sorts the result, and applies cursor/limit slicing in `getProductSavedView()`.
- Exposes `getProductManagementList()` as a convenience delegator to the saved-view path.

`src/app/api/admin/products/views/[view]/route.ts` now parses product-management query parameters for the protected admin saved-view endpoint:

- `query`, `limit`, `cursor`, `status`, `category`, `vendor`, `productType`, `inventoryHealth`, `setupStatus`, `setupIssue`, `marginHealth`, `tag`, `hasSku`, `hasImage`, `hasCost`, and `sort`.
- Boolean URL values are accepted only as `true` or `false`; sort values are passed only when accepted by `isProductManagementSort()`.

`src/ui/apiClientServices.ts` now sends the same product-management filter and sort options to `/api/admin/products/views/{view}` through `productService.getProductSavedView(view, options)`.

`src/ui/pages/admin/AdminProducts.tsx` now mirrors more familiar Shopify/Stripe admin list patterns:

- Adds a `Needs attention` saved-view tab and metric-card shortcut.
- Adds a status filter, explicit sort dropdown, product-type filter, margin-health filter, SKU/photo/cost presence filters, and a collapsible `More filters` panel.
- Adds active filter chips with individual remove actions and a `Clear all` action.
- Adds merchant-friendly search guidance text and a result summary showing filtered count, saved-view count, and current sort label.
- Emphasizes product identification in list/grid presentation with SKU, barcode, manufacturer SKU fallback, vendor/supplier, setup warnings, stock, margin, and updated-date context.

`src/utils/formatters.ts::humanizeCategory()` now humanizes underscore-delimited category ids, so values such as `elite_trainer_box` render as `Elite Trainer Box`.

## Verification evidence

The product-intake implementation was verified with:

```bash
CI=1 npm run lint && CI=1 npm run build
```

The command completed successfully after the final product-management changes. The production build compiled successfully, completed TypeScript validation, generated static pages, and listed `/api/products`, `/api/products/[id]`, `/admin/products`, `/admin/products/new`, and `/admin/products/[id]/edit` routes.

The 2026-05-01 admin product search/filter/navigation update was additionally checked with:

```bash
npx eslint src/domain/models.ts src/core/ProductService.ts 'src/app/api/admin/products/views/[view]/route.ts' src/ui/apiClientServices.ts src/ui/pages/admin/AdminProducts.tsx
```

The targeted ESLint command returned with no diagnostics for the files changed in the 2026-05-01 update. Full-project `npm run lint` was also run and reported pre-existing unrelated lint failures in `src/core/container.ts`, `src/ui/pages/WishlistPage.tsx`, and `src/ui/pages/admin/AdminPOS.tsx`. `npm run build` was run and failed on a pre-existing Server/Client Component boundary issue in `src/ui/pages/admin/product-form/hooks/useProductForm.ts`, outside the files changed in the 2026-05-01 product list update.
