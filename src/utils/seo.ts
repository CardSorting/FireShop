import type { Product, ProductOption, ProductVariant } from '@domain/models';
import { sanitizeImageUrl } from './imageSanitizer';

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://dreambeesart.com';
export const SITE_NAME = 'DreamBeesArt';
export const DEFAULT_OG_IMAGE = '/og-image.png';

type JsonLd = Record<string, unknown>;

const OPTION_SCHEMA_MAP: Record<string, string> = {
  color: 'https://schema.org/color',
  colour: 'https://schema.org/color',
  size: 'https://schema.org/size',
  age: 'https://schema.org/suggestedAge',
  gender: 'https://schema.org/suggestedGender',
  material: 'https://schema.org/material',
  pattern: 'https://schema.org/pattern',
};

export function absoluteUrl(pathOrUrl: string): string {
  try {
    return new URL(pathOrUrl, SITE_URL).toString();
  } catch {
    return SITE_URL;
  }
}

export function canonicalPath(path: string): string {
  if (!path || path === '/') return '/';
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return cleanPath.replace(/\/+$/, '');
}

export function productPath(product: Product): string {
  return `/products/${product.handle || product.id}`;
}

export function cleanSeoText(value?: string | null): string {
  return (value || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function seoDescription(value?: string | null, fallback = '', maxLength = 160): string {
  const text = cleanSeoText(value) || cleanSeoText(fallback);
  if (text.length <= maxLength) return text;

  const clipped = text.slice(0, maxLength + 1);
  const lastSpace = clipped.lastIndexOf(' ');
  return `${clipped.slice(0, lastSpace > 80 ? lastSpace : maxLength).trim()}...`;
}

export function productSeoTitle(product: Product): string {
  return product.seoTitle || `${product.name} | ${SITE_NAME}`;
}

export function productSeoDescription(product: Product): string {
  return seoDescription(
    product.seoDescription,
    `${product.description} ${product.category ? `Shop ${product.category} from ${SITE_NAME}.` : ''}`
  );
}

export function productImages(product: Product): string[] {
  const urls = [
    product.imageUrl,
    ...(product.media || []).map((media) => media.url),
    ...(product.variants || []).map((variant) => variant.imageUrl),
  ].filter((url): url is string => Boolean(url));

  return Array.from(new Set(urls))
    .map(url => sanitizeImageUrl(url))
    .map(absoluteUrl);
}

function priceFromCents(cents: number): string {
  return (cents / 100).toFixed(2);
}

function optionQueryName(option: ProductOption, index: number): string {
  const normalized = option.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return normalized || `option-${index + 1}`;
}

function variantOptionValue(variant: ProductVariant, index: number): string | undefined {
  if (index === 0) return variant.option1;
  if (index === 1) return variant.option2;
  if (index === 2) return variant.option3;
  return undefined;
}

function variantUrl(product: Product, variant: ProductVariant): string {
  const url = new URL(productPath(product), SITE_URL);
  product.options?.forEach((option, index) => {
    const value = variantOptionValue(variant, index);
    if (value) url.searchParams.set(optionQueryName(option, index), value);
  });
  return url.toString();
}

function itemCondition(product: Product): string {
  const condition = String(product.metafields?.condition || '').toLowerCase();
  if (condition.includes('used') || condition.includes('vintage')) return 'https://schema.org/UsedCondition';
  if (condition.includes('refurb')) return 'https://schema.org/RefurbishedCondition';
  if (condition.includes('damaged')) return 'https://schema.org/DamagedCondition';
  return 'https://schema.org/NewCondition';
}

function maybeAggregateRating(product: Product): JsonLd | undefined {
  const ratingValue = Number((product as Product & { averageRating?: number }).averageRating);
  const reviewCount = Number((product as Product & { reviewCount?: number }).reviewCount);

  if (!Number.isFinite(ratingValue) || !Number.isFinite(reviewCount) || reviewCount <= 0) {
    return undefined;
  }

  return {
    '@type': 'AggregateRating',
    ratingValue: Math.min(5, Math.max(1, ratingValue)),
    reviewCount,
  };
}

function maybePriceValidUntil(product: Product): string | undefined {
  const value = product.metafields?.priceValidUntil;
  if (typeof value !== 'string') return undefined;
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : undefined;
}

function offer(product: Product, price: number, stock: number, url: string): JsonLd {
  return {
    '@type': 'Offer',
    url,
    price: priceFromCents(price),
    priceCurrency: 'USD',
    availability: stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    itemCondition: itemCondition(product),
    priceValidUntil: maybePriceValidUntil(product),
    seller: {
      '@type': 'Organization',
      name: SITE_NAME,
    },
  };
}

function compactJsonLd<T extends JsonLd>(value: T): T {
  return Object.fromEntries(
    Object.entries(value).filter(([, entry]) => {
      if (entry === undefined || entry === null || entry === '') return false;
      if (Array.isArray(entry) && entry.length === 0) return false;
      return true;
    })
  ) as T;
}

function variantProductJsonLd(product: Product, variant: ProductVariant): JsonLd {
  const image = absoluteUrl(variant.imageUrl || product.imageUrl);

  return compactJsonLd({
    '@type': 'Product',
    name: variant.title ? `${product.name} - ${variant.title}` : product.name,
    sku: variant.sku || variant.id,
    image,
    description: productSeoDescription(product),
    inProductGroupWithID: product.sku || product.id,
    offers: offer(product, variant.price, variant.stock, variantUrl(product, variant)),
  });
}

export function productJsonLd(product: Product): JsonLd {
  const images = productImages(product);
  const canonical = absoluteUrl(productPath(product));
  const aggregateRating = maybeAggregateRating(product);

  if (product.hasVariants && product.variants?.length) {
    const variesBy = (product.options || [])
      .map((option) => OPTION_SCHEMA_MAP[option.name.toLowerCase()])
      .filter((value): value is string => Boolean(value));

    return compactJsonLd({
      '@context': 'https://schema.org',
      '@type': 'ProductGroup',
      '@id': `${canonical}#product`,
      name: product.name,
      description: productSeoDescription(product),
      url: canonical,
      image: images,
      brand: { '@type': 'Brand', name: product.vendor || SITE_NAME },
      productGroupID: product.sku || product.id,
      variesBy,
      aggregateRating,
      hasVariant: product.variants.map((variant) => variantProductJsonLd(product, variant)),
    });
  }

  return compactJsonLd({
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `${canonical}#product`,
    name: product.name,
    image: images,
    description: productSeoDescription(product),
    sku: product.sku || product.id,
    mpn: product.manufacturerSku,
    category: product.category,
    brand: {
      '@type': 'Brand',
      name: product.vendor || SITE_NAME,
    },
    aggregateRating,
    offers: offer(product, product.price, product.stock, canonical),
  });
}

export function breadcrumbJsonLd(items: Array<{ name: string; path: string }>): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function organizationJsonLd(): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${SITE_URL}#organization`,
    name: SITE_NAME,
    url: SITE_URL,
    logo: absoluteUrl('/logo.png'),
    image: absoluteUrl(DEFAULT_OG_IMAGE),
    description: 'Online art shop specializing in artist trading cards, art prints, and TCG accessories.',
    email: 'support@dreambeesart.com',
    sameAs: [
      'https://twitter.com/dreambeesart',
      'https://instagram.com/dreambeesart',
      'https://facebook.com/dreambeesart',
    ],
  };
}
