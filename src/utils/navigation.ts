/**
 * [LAYER: UTILS]
 * Centralized URL schema management for the storefront.
 * Mirroring industry standards (Shopify, Stripe).
 */

import type { Product, ProductCategory } from '@domain/models';

/**
 * Normalizes a string into a URL-friendly handle/slug.
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Navigation paths for the storefront.
 */
export const STORE_PATHS = {
  HOME: '/',
  PRODUCTS: '/products',
  SEARCH: '/search',
  CART: '/cart',
  CHECKOUT: '/checkout',
  WISHLIST: '/wishlist',
  LOGIN: '/login',
  REGISTER: '/register',
  ACCOUNT: '/account',
} as const;

/**
 * Returns the URL for a product detail page.
 * Uses the handle if available, otherwise falls back to ID.
 */
export function getProductUrl(product: Pick<Product, 'handle' | 'id'>): string {
  const identifier = product.handle || product.id;
  return `${STORE_PATHS.PRODUCTS}/${identifier}`;
}

/**
 * Returns the URL for a collection/category page.
 */
export function getCollectionUrl(slugOrCategory: string | Pick<ProductCategory, 'slug'>): string {
  const slug = typeof slugOrCategory === 'string' ? slugify(slugOrCategory) : slugOrCategory.slug;
  return `/collections/${slug}`;
}

/**
 * Returns the URL for a search query.
 */
export function getSearchUrl(query: string): string {
  const params = new URLSearchParams();
  if (query.trim()) params.set('q', query.trim());
  return `${STORE_PATHS.SEARCH}${params.toString() ? `?${params.toString()}` : ''}`;
}

/**
 * Admin navigation paths.
 */
export const ADMIN_PATHS = {
  DASHBOARD: '/admin',
  PRODUCTS: '/admin/products',
  COLLECTIONS: '/admin/collections',
  ORDERS: '/admin/orders',
  CUSTOMERS: '/admin/customers',
  DISCOUNTS: '/admin/discounts',
  INVENTORY: '/admin/inventory',
  PURCHASE_ORDERS: '/admin/purchase-orders',
  SETTINGS: '/admin/settings',
} as const;

/**
 * Returns the URL for an admin product edit page.
 */
export function getAdminProductEditUrl(id: string): string {
  return `${ADMIN_PATHS.PRODUCTS}/${id}/edit`;
}

/**
 * Returns the URL for an admin product creation page.
 */
export function getAdminProductNewUrl(): string {
  return `${ADMIN_PATHS.PRODUCTS}/new`;
}
