/**
 * [LAYER: DOMAIN]
 */
import type { Address, CardRarity, CartItem, Product, ProductCategory, ProductDraft, ProductUpdate } from './models';
import { InsufficientStockError, InvalidAddressError, InvalidOrderError, InvalidProductError } from './errors';

export const MAX_CART_QUANTITY = 99;
export const MAX_ORDER_ITEMS = 99;
export const MAX_PRODUCT_NAME_LENGTH = 120;
export const MAX_PRODUCT_DESCRIPTION_LENGTH = 2_000;
export const MAX_PRODUCT_IMAGE_URL_LENGTH = 2_000;
export const MAX_PRODUCT_SET_LENGTH = 120;
export const MAX_PRICE_CENTS = 1_000_000;
export const MAX_STOCK_QUANTITY = 100_000;
export const MAX_ADDRESS_FIELD_LENGTH = 120;

const PRODUCT_CATEGORIES: ProductCategory[] = ['booster', 'single', 'deck', 'accessory', 'box'];
const CARD_RARITIES: CardRarity[] = ['common', 'uncommon', 'rare', 'holo', 'secret'];

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

function assertValidCategory(category: ProductCategory): void {
  if (!PRODUCT_CATEGORIES.includes(category)) {
    throw new InvalidProductError('Product category is invalid');
  }
}

function assertValidRarity(rarity: CardRarity | undefined): void {
  if (rarity && !CARD_RARITIES.includes(rarity)) {
    throw new InvalidProductError('Card rarity is invalid');
  }
}

export function assertValidProductDraft(product: ProductDraft): void {
  assertNonEmptyString(product.name, 'Name', MAX_PRODUCT_NAME_LENGTH);
  assertNonEmptyString(product.description, 'Description', MAX_PRODUCT_DESCRIPTION_LENGTH);
  assertNonEmptyString(product.imageUrl, 'Image URL', MAX_PRODUCT_IMAGE_URL_LENGTH);
  assertValidPrice(product.price);
  assertValidStock(product.stock);
  assertValidCategory(product.category);
  assertValidRarity(product.rarity);

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
  if (updates.stock !== undefined) assertValidStock(updates.stock);
  if (updates.category !== undefined) assertValidCategory(updates.category);
  if ('rarity' in updates) assertValidRarity(updates.rarity);
  if (updates.set && updates.set.trim().length > MAX_PRODUCT_SET_LENGTH) {
    throw new InvalidProductError(`Set must be ${MAX_PRODUCT_SET_LENGTH} characters or fewer`);
  }
}

export function calculateCartTotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.priceSnapshot * item.quantity, 0);
}

export function validateCartItem(
  product: Product,
  quantity: number,
  existingQuantity: number = 0
): boolean {
  if (quantity <= 0) return false;
  if (quantity > MAX_CART_QUANTITY) return false;
  if (product.stock < quantity + existingQuantity) return false;
  return true;
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

export function coalesceCartStockDeductions(items: CartItem[]): { id: string; delta: number }[] {
  const deltas = new Map<string, number>();
  for (const item of items) {
    deltas.set(item.productId, (deltas.get(item.productId) ?? 0) - item.quantity);
  }
  return Array.from(deltas.entries()).map(([id, delta]) => ({ id, delta }));
}

export function coalesceStockUpdates(updates: { id: string; delta: number }[]): { id: string; delta: number }[] {
  const deltas = new Map<string, number>();
  for (const update of updates) {
    deltas.set(update.id, (deltas.get(update.id) ?? 0) + update.delta);
  }
  return Array.from(deltas.entries())
    .filter(([, delta]) => delta !== 0)
    .map(([id, delta]) => ({ id, delta }));
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

export function addCartItem(
  items: CartItem[],
  product: Product,
  quantity: number
): CartItem[] {
  const existingIndex = items.findIndex((i) => i.productId === product.id);
  const existingQty =
    existingIndex >= 0 ? items[existingIndex].quantity : 0;

  if (!validateCartItem(product, quantity, existingQty)) {
    throw new InsufficientStockError(
      product.id,
      quantity + existingQty,
      product.stock
    );
  }

  const newItem: CartItem = {
    productId: product.id,
    name: product.name,
    priceSnapshot: product.price,
    quantity,
    imageUrl: product.imageUrl,
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

export function removeCartItem(items: CartItem[], productId: string): CartItem[] {
  return items.filter((i) => i.productId !== productId);
}

export function updateCartItemQuantity(
  items: CartItem[],
  productId: string,
  quantity: number,
  product: Product
): CartItem[] {
  if (quantity <= 0) {
    return removeCartItem(items, productId);
  }
  if (quantity > product.stock) {
    throw new InsufficientStockError(productId, quantity, product.stock);
  }
  return items.map((item) =>
    item.productId === productId ? { ...item, quantity } : item
  );
}

export function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}