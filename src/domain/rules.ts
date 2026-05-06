/**
 * [LAYER: DOMAIN]
 */
import type {
  Address,
  CartItem,
  FulfillmentBucket,
  InventoryHealth,
  Order,
  OrderFulfillmentEvent,
  OrderStatus,
  Product,
  ProductDraft,
  ProductSalesChannel,
  ProductSetupIssue,
  ProductUpdate,
  MarginHealth,
  PurchaseOrder,
  PurchaseOrderItem,
  PurchaseOrderLineReceivingSummary,
  PurchaseOrderSavedView,
  PurchaseOrderWorkflowStep,
  ReceivedItem,
  ReceivingDiscrepancyReason,
  ReceivingVarianceType,
  InventoryLevel,
  ProductOption,
  ProductVariant,
} from './models';
import { InsufficientStockError, InvalidAddressError, InvalidOrderError, InvalidProductError } from './errors';

export const MAX_CART_QUANTITY = 99;
export const MAX_ORDER_ITEMS = 99;
export const MAX_PRODUCT_NAME_LENGTH = 120;
export const MAX_PRODUCT_DESCRIPTION_LENGTH = 2_000;
export const MAX_PRODUCT_IMAGE_URL_LENGTH = 2_000;
export const MAX_PRODUCT_SET_LENGTH = 120;
export const MAX_PRODUCT_SKU_LENGTH = 80;
export const MAX_PRODUCT_BARCODE_LENGTH = 64;
export const MAX_PRODUCT_PARTNER_FIELD_LENGTH = 120;
export const MAX_PRODUCT_TYPE_LENGTH = 120;
export const MAX_PRODUCT_TAG_LENGTH = 60;
export const MAX_PRODUCT_TAGS = 25;
export const MAX_PRODUCT_COLLECTION_LENGTH = 80;
export const MAX_PRODUCT_COLLECTIONS = 20;
export const MAX_PRODUCT_HANDLE_LENGTH = 120;
export const MAX_PRODUCT_SEO_TITLE_LENGTH = 70;
export const MAX_PRODUCT_SEO_DESCRIPTION_LENGTH = 320;
export const MAX_PRICE_CENTS = 1_000_000;
export const MAX_STOCK_QUANTITY = 100_000;
export const MAX_REORDER_QUANTITY = 100_000;
export const MAX_WEIGHT_GRAMS = 100_000;
export const MAX_ADDRESS_FIELD_LENGTH = 120;


const PRODUCT_SALES_CHANNELS: ProductSalesChannel[] = ['online_store', 'pos', 'draft_order'];
const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
};

function assertNonEmptyString(value: string | undefined, field: string, maxLength: number): void {
  if (!value || value.trim().length === 0) {
    throw new InvalidProductError(`${field} is required`);
  }
  if (value.trim().length > maxLength) {
    throw new InvalidProductError(`${field} must be ${maxLength} characters or fewer`);
  }
}

function assertValidPrice(price: number): void {
  if (!Number.isInteger(price) || price < 0) {
    throw new InvalidProductError('Price must be a non-negative whole number of cents');
  }
  if (price > MAX_PRICE_CENTS) {
    throw new InvalidProductError('Price exceeds allowed maximum');
  }
}

function assertValidStock(stock: number): void {
  if (!Number.isInteger(stock) || stock < 0) {
    throw new InvalidProductError('Stock must be a non-negative whole number');
  }
  if (stock > MAX_STOCK_QUANTITY) {
    throw new InvalidProductError('Stock exceeds allowed maximum');
  }
}

function assertValidCategory(category: string | undefined): void {
  if (!category || category.trim().length === 0) {
    throw new InvalidProductError('Product category is required');
  }
}

function assertValidClassification(rarity: string | undefined): void {
  if (rarity && rarity.trim().length > 64) {
    throw new InvalidProductError('Classification is too long');
  }
}

function assertOptionalStringLength(value: string | undefined, field: string, maxLength: number): void {
  if (value === undefined) return;
  if (value.trim().length === 0) {
    throw new InvalidProductError(`${field} cannot be blank`);
  }
  if (value.trim().length > maxLength) {
    throw new InvalidProductError(`${field} must be ${maxLength} characters or fewer`);
  }
}

function assertOptionalMoneyCents(value: number | undefined, field: string): void {
  if (value === undefined) return;
  if (!Number.isInteger(value) || value < 0) {
    throw new InvalidProductError(`${field} must be a non-negative whole number of cents`);
  }
  if (value > MAX_PRICE_CENTS) {
    throw new InvalidProductError(`${field} exceeds allowed maximum`);
  }
}

function assertOptionalNonNegativeInteger(value: number | undefined, field: string, max: number): void {
  if (value === undefined) return;
  if (!Number.isInteger(value) || value < 0) {
    throw new InvalidProductError(`${field} must be a non-negative whole number`);
  }
  if (value > max) {
    throw new InvalidProductError(`${field} exceeds allowed maximum`);
  }
}

function assertValidStringList(value: string[] | undefined, field: string, maxItems: number, maxLength: number): void {
  if (value === undefined) return;
  if (!Array.isArray(value)) {
    throw new InvalidProductError(`${field} must be a list`);
  }
  if (value.length > maxItems) {
    throw new InvalidProductError(`${field} cannot contain more than ${maxItems} items`);
  }
  const seen = new Set<string>();
  for (const item of value) {
    if (typeof item !== 'string' || item.trim().length === 0) {
      throw new InvalidProductError(`${field} cannot contain blank items`);
    }
    if (item.trim().length > maxLength) {
      throw new InvalidProductError(`${field} items must be ${maxLength} characters or fewer`);
    }
    const normalized = item.trim().toLowerCase();
    if (seen.has(normalized)) {
      throw new InvalidProductError(`${field} cannot contain duplicate items`);
    }
    seen.add(normalized);
  }
}

function assertValidHandle(value: string | undefined): void {
  if (value === undefined) return;
  assertOptionalStringLength(value, 'Handle', MAX_PRODUCT_HANDLE_LENGTH);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value.trim())) {
    throw new InvalidProductError('Handle must contain lowercase letters, numbers, and single hyphens only');
  }
}

function assertValidSalesChannels(value: ProductSalesChannel[] | undefined): void {
  if (value === undefined) return;
  if (!Array.isArray(value)) {
    throw new InvalidProductError('Sales channels must be a list');
  }
  const seen = new Set<ProductSalesChannel>();
  for (const channel of value) {
    if (!PRODUCT_SALES_CHANNELS.includes(channel)) {
      throw new InvalidProductError('Sales channel is invalid');
    }
    if (seen.has(channel)) {
      throw new InvalidProductError('Sales channels cannot contain duplicates');
    }
    seen.add(channel);
  }
}

function assertValidProductIntakeFields(product: ProductDraft | ProductUpdate): void {
  assertOptionalStringLength(product.sku, 'SKU', MAX_PRODUCT_SKU_LENGTH);
  assertOptionalStringLength(product.manufacturer, 'Manufacturer', MAX_PRODUCT_PARTNER_FIELD_LENGTH);
  assertOptionalStringLength(product.supplier, 'Supplier', MAX_PRODUCT_PARTNER_FIELD_LENGTH);
  assertOptionalStringLength(product.manufacturerSku, 'Manufacturer SKU', MAX_PRODUCT_SKU_LENGTH);
  assertOptionalStringLength(product.barcode, 'Barcode', MAX_PRODUCT_BARCODE_LENGTH);
  assertOptionalMoneyCents(product.cost, 'Cost');
  assertOptionalMoneyCents(product.compareAtPrice, 'Compare at price');
}

function assertValidProductOperationsFields(product: ProductDraft | ProductUpdate): void {
  assertOptionalStringLength(product.productType, 'Product type', MAX_PRODUCT_TYPE_LENGTH);
  assertOptionalStringLength(product.vendor, 'Vendor', MAX_PRODUCT_PARTNER_FIELD_LENGTH);
  assertValidStringList(product.tags, 'Tags', MAX_PRODUCT_TAGS, MAX_PRODUCT_TAG_LENGTH);
  assertValidStringList(product.collections, 'Collections', MAX_PRODUCT_COLLECTIONS, MAX_PRODUCT_COLLECTION_LENGTH);
  assertValidHandle(product.handle);
  assertOptionalStringLength(product.seoTitle, 'SEO title', MAX_PRODUCT_SEO_TITLE_LENGTH);
  assertOptionalStringLength(product.seoDescription, 'SEO description', MAX_PRODUCT_SEO_DESCRIPTION_LENGTH);
  assertValidSalesChannels(product.salesChannels);
  assertOptionalNonNegativeInteger(product.reorderPoint, 'Reorder point', MAX_STOCK_QUANTITY);
  assertOptionalNonNegativeInteger(product.reorderQuantity, 'Reorder quantity', MAX_REORDER_QUANTITY);
  assertOptionalNonNegativeInteger(product.weightGrams, 'Weight', MAX_WEIGHT_GRAMS);
}

function assertValidOptionsAndVariants(hasVariants: boolean | undefined, options: ProductOption[] | undefined, variants: ProductVariant[] | undefined): void {
  if (!hasVariants) return;

  if (!options || options.length === 0) {
    throw new InvalidProductError('Product with variations must have at least one option');
  }

  if (!variants || variants.length === 0) {
    throw new InvalidProductError('Product with variations must have at least one variant');
  }

  for (const option of options) {
    if (!option.name || option.name.trim().length === 0) {
      throw new InvalidProductError('Option name is required');
    }
    if (!option.values || option.values.length === 0) {
      throw new InvalidProductError(`Option "${option.name}" must have at least one value`);
    }
  }

  const skus = new Set<string>();
  for (const variant of variants) {
    if (!variant.title || variant.title.trim().length === 0) {
      throw new InvalidProductError('Variant title is required');
    }
    assertValidPrice(variant.price);
    assertValidStock(variant.stock);
    if (variant.sku) {
      if (skus.has(variant.sku)) {
        throw new InvalidProductError(`Duplicate SKU detected: ${variant.sku}`);
      }
      skus.add(variant.sku);
    }
  }
}

export function assertValidProductDraft(product: ProductDraft): void {
  assertNonEmptyString(product.name, 'Name', MAX_PRODUCT_NAME_LENGTH);
  assertNonEmptyString(product.description, 'Description', MAX_PRODUCT_DESCRIPTION_LENGTH);
  assertNonEmptyString(product.imageUrl, 'Image URL', MAX_PRODUCT_IMAGE_URL_LENGTH);
  assertValidPrice(product.price);
  assertOptionalMoneyCents(product.compareAtPrice, 'Compare at price');
  assertOptionalMoneyCents(product.cost, 'Cost');
  assertValidStock(product.stock);
  assertValidCategory(product.category);
  assertValidClassification(product.rarity);
  assertValidProductIntakeFields(product);
  assertValidProductOperationsFields(product);
  assertValidOptionsAndVariants(product.hasVariants, product.options, product.variants);

  if (product.set && product.set.trim().length > MAX_PRODUCT_SET_LENGTH) {
    throw new InvalidProductError(`Set must be ${MAX_PRODUCT_SET_LENGTH} characters or fewer`);
  }
}

export function assertValidProductUpdate(updates: ProductUpdate): void {
  if (Object.keys(updates).length === 0) {
    throw new InvalidProductError('At least one product field must be provided');
  }
  if ('name' in updates) assertNonEmptyString(updates.name, 'Name', MAX_PRODUCT_NAME_LENGTH);
  if ('description' in updates) assertNonEmptyString(updates.description, 'Description', MAX_PRODUCT_DESCRIPTION_LENGTH);
  if ('imageUrl' in updates) assertNonEmptyString(updates.imageUrl, 'Image URL', MAX_PRODUCT_IMAGE_URL_LENGTH);
  if (updates.price !== undefined) assertValidPrice(updates.price);
  if (updates.compareAtPrice !== undefined) assertOptionalMoneyCents(updates.compareAtPrice, 'Compare at price');
  if (updates.cost !== undefined) assertOptionalMoneyCents(updates.cost, 'Cost');
  if (updates.stock !== undefined) assertValidStock(updates.stock);
  if (updates.category !== undefined) assertValidCategory(updates.category);
  if ('rarity' in updates) assertValidClassification(updates.rarity);
  assertValidProductIntakeFields(updates);
  assertValidProductOperationsFields(updates);
  if ('hasVariants' in updates || 'options' in updates || 'variants' in updates) {
    assertValidOptionsAndVariants(updates.hasVariants, updates.options, updates.variants);
  }
  if (updates.set && updates.set.trim().length > MAX_PRODUCT_SET_LENGTH) {
    throw new InvalidProductError(`Set must be ${MAX_PRODUCT_SET_LENGTH} characters or fewer`);
  }
}

export function calculateGrossMarginPercent(product: Product): number | null {
  if (product.cost === undefined || product.cost <= 0 || product.price <= 0) return null;
  return Math.round(((product.price - product.cost) / product.price) * 1000) / 10;
}

export function classifyMarginHealth(product: Product): MarginHealth {
  const margin = calculateGrossMarginPercent(product);
  if (margin === null) return 'unknown';
  if (margin < 15) return 'at_risk';
  if (margin < 40) return 'healthy';
  return 'premium';
}

export function getProductSetupIssues(product: Product): ProductSetupIssue[] {
  const issues: ProductSetupIssue[] = [];
  if (!product.imageUrl.trim()) issues.push('missing_image');
  if (!product.sku?.trim()) issues.push('missing_sku');
  if (product.price <= 0) issues.push('missing_price');
  if (product.cost === undefined) issues.push('missing_cost');
  if ((product.trackQuantity ?? true) && product.stock <= 0) issues.push('missing_stock');
  if (!product.category) issues.push('missing_category');
  if (product.status !== 'active' || !(product.salesChannels ?? ['online_store']).includes('online_store')) {
    issues.push('not_published');
  }
  return issues;
}

export function classifyProductSetupStatus(product: Product): 'ready' | 'needs_attention' {
  return getProductSetupIssues(product).length === 0 ? 'ready' : 'needs_attention';
}

export function calculateCartTotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.priceSnapshot * item.quantity, 0);
}

export function validateCartItem(
  product: Product,
  quantity: number,
  existingQuantity: number = 0,
  variantId?: string
): boolean {
  if (quantity <= 0) return false;
  if (quantity > MAX_CART_QUANTITY) return false;
  
  if (variantId && product.variants) {
    const variant = product.variants.find(v => v.id === variantId);
    if (!variant) return false;
    return variant.stock >= quantity + existingQuantity;
  }
  
  return product.stock >= quantity + existingQuantity;
}

export function canPlaceOrder(
  items: CartItem[],
  stockMap: Map<string, number>
): boolean {
  if (items.length === 0) return false;
  for (const item of items) {
    const available = stockMap.get(item.productId) ?? 0;
    if (available < item.quantity) return false;
  }
  return true;
}

export function coalesceCartStockDeductions(items: CartItem[]): { id: string; variantId?: string; delta: number }[] {
  const deltas = new Map<string, number>();
  for (const item of items) {
    const key = item.variantId ? `${item.productId}:${item.variantId}` : item.productId;
    deltas.set(key, (deltas.get(key) ?? 0) - item.quantity);
  }
  return Array.from(deltas.entries()).map(([key, delta]) => {
    if (key.includes(':')) {
      const [id, variantId] = key.split(':');
      return { id, variantId, delta };
    }
    return { id: key, delta };
  });
}

export function coalesceStockUpdates(updates: { id: string; variantId?: string; delta: number }[]): { id: string; variantId?: string; delta: number }[] {
  const deltas = new Map<string, number>();
  for (const update of updates) {
    const key = update.variantId ? `${update.id}:${update.variantId}` : update.id;
    deltas.set(key, (deltas.get(key) ?? 0) + update.delta);
  }
  return Array.from(deltas.entries())
    .filter(([, delta]) => delta !== 0)
    .map(([key, delta]) => {
      if (key.includes(':')) {
        const [id, variantId] = key.split(':');
        return { id, variantId, delta };
      }
      return { id: key, delta };
    });
}

export function assertValidShippingAddress(address: Address): void {
  const required: Array<keyof Address> = ['street', 'city', 'state', 'zip', 'country'];
  for (const field of required) {
    const value = address[field]?.trim();
    if (!value) {
      throw new InvalidAddressError(`Shipping address field is required: ${field}`);
    }
    if (value.length > MAX_ADDRESS_FIELD_LENGTH) {
      throw new InvalidAddressError(`Shipping address field is too long: ${field}`);
    }
  }

  if (address.country.trim().length !== 2) {
    throw new InvalidAddressError('Country must be a two-letter ISO country code');
  }
}

export function assertValidOrderItems(items: CartItem[]): void {
  if (items.length === 0) {
throw new InvalidOrderError('Order must contain at least one item');
  }
  if (items.length > MAX_ORDER_ITEMS) {
    throw new InvalidOrderError(`Order cannot contain more than ${MAX_ORDER_ITEMS} items`);
  }
  for (const item of items) {
    if (!item.productId.trim() || !item.name.trim() || !item.imageUrl.trim()) {
      throw new InvalidOrderError('Order item data is incomplete');
    }
    if (!Number.isInteger(item.priceSnapshot) || item.priceSnapshot < 0 || item.priceSnapshot > MAX_PRICE_CENTS) {
      throw new InvalidOrderError('Order item price is invalid');
    }
    if (!Number.isInteger(item.quantity) || item.quantity <= 0 || item.quantity > MAX_CART_QUANTITY) {
      throw new InvalidOrderError('Order item quantity is invalid');
    }
  }
}

export function canTransitionOrderStatus(current: OrderStatus, next: OrderStatus): boolean {
  if (current === next) return true;
  return ORDER_STATUS_TRANSITIONS[current].includes(next);
}

export function assertValidOrderStatusTransition(current: OrderStatus, next: OrderStatus): void {
  if (!canTransitionOrderStatus(current, next)) {
    throw new InvalidOrderError(`Order status cannot transition from ${current} to ${next}`);
  }
}

export function classifyInventoryHealth(stock: number): InventoryHealth {
  if (stock <= 0) return 'out_of_stock';
  if (stock < 5) return 'low_stock';
  return 'healthy';
}

export function classifyFulfillmentBucket(status: OrderStatus): FulfillmentBucket {
  if (status === 'pending') return 'to_review';
  if (status === 'confirmed') return 'ready_to_ship';
  if (status === 'shipped') return 'in_transit';
  if (status === 'delivered') return 'completed';
  return 'cancelled';
}

export function nextOrderActionLabel(status: OrderStatus): string {
  if (status === 'pending') return 'Confirm order';
  if (status === 'confirmed') return 'Mark as shipped';
  if (status === 'shipped') return 'Mark as delivered';
  if (status === 'delivered') return 'Completed';
  return 'Cancelled';
}

export function customerOrderStatusLabel(status: OrderStatus): string {
  if (status === 'pending') return 'Order placed';
  if (status === 'confirmed') return 'Processing';
  if (status === 'shipped') return 'On the way';
  if (status === 'delivered') return 'Delivered';
  return 'Cancelled';
}

export function customerOrderStatusDescription(status: OrderStatus): string {
  if (status === 'pending') return 'We received your order and it is waiting for payment review.';
  if (status === 'confirmed') return 'Payment is confirmed and your order is being packed.';
  if (status === 'shipped') return 'Your package is in transit with the carrier.';
  if (status === 'delivered') return 'Your order was delivered to the shipping address.';
  return 'This order was cancelled. Refund timing depends on your payment method.';
}

export function deriveEstimatedDeliveryDate(order: Order): Date | null {
  if (order.status === 'cancelled') return null;
  const base = new Date(order.createdAt);
  base.setDate(base.getDate() + (order.status === 'delivered' ? 3 : 5));
  return base;
}

export function deriveTrackingUrl(order: Order): string | null {
  if (!order.trackingNumber) return null;
  const encoded = encodeURIComponent(order.trackingNumber);
  return `https://www.google.com/search?q=${encoded}`;
}

export function deriveOrderFulfillmentEvents(order: Order): OrderFulfillmentEvent[] {
  const placedAt = new Date(order.createdAt);
  const updatedAt = new Date(order.updatedAt);
  const events: OrderFulfillmentEvent[] = [
    {
      id: `${order.id}-placed`,
      type: 'order_placed',
      label: 'Order placed',
      description: 'We received your order request.',
      at: placedAt,
    },
  ];

  if (order.status !== 'pending' && order.status !== 'cancelled') {
    events.push({
      id: `${order.id}-payment-confirmed`,
      type: 'payment_confirmed',
      label: 'Payment confirmed',
      description: 'Your payment was authorized and captured.',
      at: new Date(Math.max(placedAt.getTime(), updatedAt.getTime() - 3 * 60 * 60 * 1000)),
    });
    events.push({
      id: `${order.id}-processing`,
      type: 'processing',
      label: 'Preparing shipment',
      description: 'Items are being picked and packed.',
      at: new Date(Math.max(placedAt.getTime(), updatedAt.getTime() - 2 * 60 * 60 * 1000)),
    });
  }

  if (order.status === 'shipped' || order.status === 'delivered') {
    events.push({
      id: `${order.id}-in-transit`,
      type: 'in_transit',
      label: 'In transit',
      description: order.trackingNumber
        ? `Tracking number ${order.trackingNumber} is active.`
        : 'Your package was handed to the carrier.',
      at: new Date(Math.max(placedAt.getTime(), updatedAt.getTime() - 60 * 60 * 1000)),
    });
  }

  if (order.status === 'delivered') {
    events.push({
      id: `${order.id}-delivered`,
      type: 'delivered',
      label: 'Delivered',
      description: 'The carrier marked your package as delivered.',
      at: updatedAt,
    });
  }

  if (order.status === 'cancelled') {
    events.push({
      id: `${order.id}-cancelled`,
      type: 'cancelled',
      label: 'Cancelled',
      description: 'This order was cancelled before shipment.',
      at: updatedAt,
    });
  }

  return events.sort((a, b) => b.at.getTime() - a.at.getTime());
}

export function addCartItem(
  items: CartItem[],
  product: Product,
  quantity: number,
  variantId?: string
): CartItem[] {
  const existingIndex = items.findIndex((i) => i.productId === product.id && i.variantId === variantId);
  const existingQty = existingIndex >= 0 ? items[existingIndex].quantity : 0;

  if (!validateCartItem(product, quantity, existingQty, variantId)) {
    const stock = variantId 
      ? (product.variants?.find(v => v.id === variantId)?.stock ?? 0)
      : product.stock;
    throw new InsufficientStockError(
      variantId || product.id,
      quantity + existingQty,
      stock
    );
  }

  let price = product.price;
  let variantTitle = undefined;
  let imageUrl = product.imageUrl;

  if (variantId && product.variants) {
    const variant = product.variants.find(v => v.id === variantId);
    if (variant) {
      price = variant.price;
      variantTitle = variant.title;
      if (variant.imageUrl) imageUrl = variant.imageUrl;
    }
  }

  const newItem: CartItem = {
    productId: product.id,
    variantId,
    variantTitle,
    productHandle: product.handle,
    name: product.name,
    priceSnapshot: price,
    quantity,
    imageUrl,
    isDigital: product.isDigital,
    shippingClassId: product.shippingClassId,
  };

  if (existingIndex >= 0) {
    const updated = [...items];
    updated[existingIndex] = {
      ...updated[existingIndex],
      quantity: updated[existingIndex].quantity + quantity,
    };
    return updated;
  }

  return [...items, newItem];
}


export function removeCartItem(items: CartItem[], productId: string, variantId?: string): CartItem[] {
  return items.filter((i) => !(i.productId === productId && i.variantId === variantId));
}

// ─────────────────────────────────────────────
// Shipping Rules
// ─────────────────────────────────────────────

import type { ShippingRate, ShippingZone } from './models';

export function calculateShipping(
  cartItems: (Pick<CartItem, 'productId' | 'quantity' | 'priceSnapshot' | 'shippingClassId'>)[],
  address: Address,
  allRates: ShippingRate[],
  allZones: ShippingZone[]
): { amount: number; rateName: string; shippingClassId?: string } {
  const subtotal = cartItems.reduce((sum, item) => sum + item.priceSnapshot * item.quantity, 0);
  
  // 1. Find matching zone
  const zone = allZones.find(z => z.countries.includes(address.country)) || allZones.find(z => z.name.toLowerCase() === 'rest of world');
  if (!zone) return { amount: subtotal >= 10000 ? 0 : 599, rateName: 'Standard Shipping' }; // Fallback to legacy logic

  // 2. Identify the predominant shipping class in the cart
  // For simplicity, we use the most restrictive (highest rate) or just the most common.
  // Here we'll group by class and pick the one with highest "priority" or highest rate.
  const classesInCart = new Set(cartItems.map(item => item.shippingClassId).filter(Boolean));
  
  // Find rates for the zone
  const zoneRates = allRates.filter(r => r.shippingZoneId === zone.id);
  
  // Filter rates that match the classes in cart (if none, look for default/null class)
  let applicableRates = zoneRates.filter(r => classesInCart.has(r.shippingClassId));
  if (applicableRates.length === 0) {
    applicableRates = zoneRates.filter(r => !r.shippingClassId || r.shippingClassId === 'default');
  }

  // 3. Match rate based on type (price or weight)
  // For now we only implement price_based for subtotal
  const matchedRate = applicableRates
    .filter(r => {
      if (r.type === 'price_based') {
        const min = r.minLimit ?? 0;
        const max = r.maxLimit ?? Infinity;
        return subtotal >= min && subtotal <= max;
      }
      return r.type === 'flat';
    })
    .sort((a, b) => b.amount - a.amount)[0]; // Pick the highest matching rate for safety

  if (matchedRate) {
    return { 
      amount: matchedRate.amount, 
      rateName: matchedRate.name, 
      shippingClassId: matchedRate.shippingClassId 
    };
  }

  // Final fallback
  return { amount: subtotal >= 10000 ? 0 : 599, rateName: 'Standard Shipping' };
}


// ─────────────────────────────────────────────
// Purchase Order Rules
// ─────────────────────────────────────────────

const RECEIVING_DISCREPANCY_REASONS: ReceivingDiscrepancyReason[] = [
  'missing_items',
  'damaged_items',
  'wrong_item',
  'duplicate_shipment',
  'supplier_substitution',
  'overage',
  'cost_mismatch',
  'other',
];

function calculateDueState(
  order: PurchaseOrder
): 'not_scheduled' | 'on_track' | 'arriving_soon' | 'overdue' | 'complete' {
  if (['received', 'closed', 'cancelled'].includes(order.status)) return 'complete';
  if (!order.expectedAt) return 'not_scheduled';
  const now = Date.now();
  const dueAt = new Date(order.expectedAt).getTime();
  if (Number.isNaN(dueAt)) return 'not_scheduled';
  if (dueAt < now) return 'overdue';
  const daysUntilDue = Math.ceil((dueAt - now) / (24 * 60 * 60 * 1000));
  return daysUntilDue <= 3 ? 'arriving_soon' : 'on_track';
}

function orderedQty(items: PurchaseOrderItem[]): number {
  return items.reduce((sum, item) => sum + item.orderedQty, 0);
}

function receivedQty(items: PurchaseOrderItem[]): number {
  return items.reduce((sum, item) => sum + item.receivedQty, 0);
}

function receivingVarianceForLine(item: PurchaseOrderItem): ReceivingVarianceType {
  if (item.receivedQty > item.orderedQty) return 'over';
  if (item.receivedQty > 0 && item.receivedQty < item.orderedQty) return 'short';
  return 'none';
}

function lineReceivingSummary(item: PurchaseOrderItem): PurchaseOrderLineReceivingSummary {
  const openQty = Math.max(0, item.orderedQty - item.receivedQty);
  const progressPercent = item.orderedQty === 0 ? 0 : Math.min(100, Math.round((item.receivedQty / item.orderedQty) * 100));
  const varianceType = receivingVarianceForLine(item);
  return {
    purchaseOrderItemId: item.id,
    productId: item.productId,
    productName: item.productName,
    sku: item.sku,
    orderedQty: item.orderedQty,
    receivedQty: item.receivedQty,
    openQty,
    progressPercent,
    varianceType,
    attentionRequired: varianceType !== 'none',
    nextActionLabel: openQty > 0 ? `Receive ${openQty} remaining` : 'Line complete',
  };
}

export const purchaseOrderRules = {
  canReceive: (order: PurchaseOrder): boolean =>
    ['ordered', 'partially_received'].includes(order.status),

  canClose: (order: PurchaseOrder): boolean =>
    ['received', 'partially_received'].includes(order.status),

  canCancel: (order: PurchaseOrder): boolean =>
    ['draft', 'ordered'].includes(order.status),

  canSubmit: (order: PurchaseOrder): boolean =>
    order.status === 'draft' && order.items.length > 0,

  calculateReceivedStatus: (items: PurchaseOrderItem[]): PurchaseOrder['status'] => {
    if (items.length === 0) return 'ordered';
    const allReceived = items.every((i) => i.receivedQty >= i.orderedQty);
    const anyReceived = items.some((i) => i.receivedQty > 0);
    if (allReceived) return 'received';
    if (anyReceived) return 'partially_received';
    return 'ordered';
  },

  validateReceiveQty: (ordered: number, alreadyReceived: number, newReceived: number): boolean =>
    Number.isInteger(newReceived) && alreadyReceived + newReceived <= ordered && newReceived >= 0,

  calculateLineReceivingSummary: lineReceivingSummary,

  calculateLineReceivingSummaries: (order: PurchaseOrder): PurchaseOrderLineReceivingSummary[] =>
    order.items.map(lineReceivingSummary),

  hasReceivingExceptions: (order: PurchaseOrder): boolean =>
    order.items.some((item) => receivingVarianceForLine(item) !== 'none'),

  calculateDueState,

  matchesSavedView: (order: PurchaseOrder, view: PurchaseOrderSavedView): boolean => {
    if (view === 'all') return true;
    if (view === 'drafts') return order.status === 'draft';
    if (view === 'incoming') return order.status === 'ordered';
    if (view === 'partially_received') return order.status === 'partially_received';
    if (view === 'ready_to_close') return order.status === 'received';
    if (view === 'exceptions') return purchaseOrderRules.hasReceivingExceptions(order);
    if (view === 'closed') return order.status === 'closed';
    return false;
  },

  isValidDiscrepancyReason: (reason: string | undefined): reason is ReceivingDiscrepancyReason =>
    reason !== undefined && RECEIVING_DISCREPANCY_REASONS.includes(reason as ReceivingDiscrepancyReason),

  requiresDiscrepancyReason: (item: Pick<ReceivedItem, 'receivedQty' | 'expectedQty' | 'damagedQty' | 'condition'>): boolean =>
    item.receivedQty !== item.expectedQty || (item.damagedQty ?? 0) > 0 || item.condition !== 'new',

  calculateReceivingSummary: (order: PurchaseOrder) => {
    const totalOrdered = orderedQty(order.items);
    const totalReceived = receivedQty(order.items);
    const openQty = Math.max(0, totalOrdered - totalReceived);
    const progressPercent = totalOrdered === 0 ? 0 : Math.round((totalReceived / totalOrdered) * 100);
    const dueState = calculateDueState(order);
    let nextActionLabel = 'Create purchase order';
    let nextActionDescription = 'Add supplier details and products before sending this purchase order.';

    if (order.status === 'draft') {
      nextActionLabel = 'Send purchase order';
      nextActionDescription = 'Review costs and quantities, then mark this order as sent to the supplier.';
    } else if (order.status === 'ordered') {
      nextActionLabel = 'Receive inventory';
      nextActionDescription = 'Record what arrived, flag damaged or missing items, and update stock.';
    } else if (order.status === 'partially_received') {
      nextActionLabel = 'Continue receiving';
      nextActionDescription = 'Receive the remaining items or close with a discrepancy note.';
    } else if (order.status === 'received') {
      nextActionLabel = 'Close purchase order';
      nextActionDescription = 'Everything expected has been received. Close this PO to lock the workflow.';
    } else if (order.status === 'closed') {
      nextActionLabel = 'Closed';
      nextActionDescription = 'This purchase order is complete and no longer accepts receiving changes.';
    } else if (order.status === 'cancelled') {
      nextActionLabel = 'Cancelled';
      nextActionDescription = 'This purchase order was cancelled before completion.';
    }

    return {
      orderedQty: totalOrdered,
      receivedQty: totalReceived,
      openQty,
      damagedQty: 0,
      discrepancyCount: 0,
      stockableQty: totalReceived,
      progressPercent,
      dueState,
      nextActionLabel,
      nextActionDescription,
    };
  },

  buildWorkflowSteps: (order: PurchaseOrder): PurchaseOrderWorkflowStep[] => {
    const status = order.status;
    const summary = purchaseOrderRules.calculateReceivingSummary(order);
    const stepStatus = (id: PurchaseOrderWorkflowStep['id']): PurchaseOrderWorkflowStep['status'] => {
      if (status === 'cancelled') return id === 'create' ? 'complete' : 'blocked';
      if (id === 'create') return 'complete';
      if (id === 'order') return ['ordered', 'partially_received', 'received', 'closed'].includes(status) ? 'complete' : 'current';
      if (id === 'receive') {
        if (['received', 'closed'].includes(status)) return 'complete';
        if (status === 'partially_received') return 'current';
        return status === 'ordered' ? 'current' : 'upcoming';
      }
      if (id === 'reconcile') {
        if (status === 'closed') return 'complete';
        if (summary.openQty > 0 && status === 'partially_received') return 'current';
        return status === 'received' ? 'complete' : 'upcoming';
      }
      if (id === 'close') return status === 'closed' ? 'complete' : status === 'received' ? 'current' : 'upcoming';
      return 'upcoming';
    };

    return [
      { id: 'create', label: 'Create', description: 'Supplier and products added', status: stepStatus('create') },
      { id: 'order', label: 'Send', description: 'Mark as ordered from supplier', status: stepStatus('order') },
      { id: 'receive', label: 'Receive', description: 'Count arriving stock', status: stepStatus('receive') },
      { id: 'reconcile', label: 'Reconcile', description: 'Review missing, damaged, or extra items', status: stepStatus('reconcile') },
      { id: 'close', label: 'Close', description: 'Lock completed receiving work', status: stepStatus('close') },
    ];
  },

  calculateTotalCost: (items: PurchaseOrderItem[]): number =>
    items.reduce((sum, item) => sum + item.orderedQty * item.unitCost, 0),
};

// ─────────────────────────────────────────────
// Inventory Rules
// ─────────────────────────────────────────────

export const inventoryRules = {
  isLowStock: (level: InventoryLevel): boolean =>
    level.availableQty <= level.reorderPoint && level.reorderPoint > 0,

  isOutOfStock: (level: InventoryLevel): boolean =>
    level.availableQty <= 0,

  canAdjust: (available: number, reserved: number, delta: number): boolean =>
    available + reserved + delta >= 0,

  totalOnHand: (level: InventoryLevel): number =>
    level.availableQty + level.reservedQty,

  projectedAvailable: (level: InventoryLevel): number =>
    level.availableQty + level.incomingQty,
};

export function updateCartItemQuantity(
  items: CartItem[],
  productId: string,
  quantity: number,
  product: Product,
  variantId?: string
): CartItem[] {
  const existingIndex = items.findIndex((i) => i.productId === productId && i.variantId === variantId);
  if (existingIndex < 0) return items;

  if (!validateCartItem(product, quantity, 0, variantId)) {
    const stock = variantId 
      ? (product.variants?.find(v => v.id === variantId)?.stock ?? 0)
      : product.stock;
    throw new InsufficientStockError(
      variantId || productId,
      quantity,
      stock
    );
  }

  const updated = [...items];
  updated[existingIndex] = {
    ...updated[existingIndex],
    quantity,
  };
  return updated;
}

export function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}