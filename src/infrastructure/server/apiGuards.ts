import { NextResponse } from 'next/server';
import type { Address, JsonValue, OrderStatus, ProductStatus, ProductDraft, ProductUpdate, User, ProductSalesChannel, ProductMedia } from '@domain/models';
import { AuthError, DomainError, OrderNotFoundError, ProductNotFoundError, UnauthorizedError } from '@domain/errors';
import { getSessionUser } from './session';
import { logger } from '@utils/logger';

const ORDER_STATUSES = new Set<OrderStatus>(['pending', 'confirmed', 'shipped', 'delivered', 'cancelled']);

const PRODUCT_STATUSES = new Set<ProductStatus>(['active', 'draft', 'archived']);
const PRODUCT_SALES_CHANNELS = new Set<ProductSalesChannel>(['online_store', 'pos', 'draft_order']);

const MAX_JSON_BODY_BYTES = 32 * 1024;
const IDEMPOTENCY_KEY_PATTERN = /^[a-zA-Z0-9:_-]{16,160}$/;
const MUTATION_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const RATE_LIMIT_MAX_BUCKETS = 10_000;

type RateLimitBucket = {
    count: number;
    resetAt: number;
};

class RateLimitError extends Error {
    constructor(public readonly retryAfterSeconds: number) {
        super('Too many requests. Please wait and try again.');
        this.name = 'RateLimitError';
    }
}

const rateLimitBuckets = new Map<string, RateLimitBucket>();

export async function requireSessionUser(): Promise<User> {
    const user = await getSessionUser();
    if (!user) throw new AuthError();
    return user;
}

export async function requireAdminSession(): Promise<User & { role: 'admin' }> {
    const user = await requireSessionUser();
    if (user.role !== 'admin') throw new UnauthorizedError();
    return user as User & { role: 'admin' };
}

export async function readJsonObject(request: Request): Promise<Record<string, unknown>> {
    assertTrustedMutationOrigin(request);
    const contentLength = Number(request.headers.get('content-length') ?? 0);
    if (Number.isFinite(contentLength) && contentLength > MAX_JSON_BODY_BYTES) {
        throw new DomainError('Request body is too large.');
    }

    const contentType = request.headers.get('content-type') ?? '';
    if (contentType && !contentType.toLowerCase().includes('application/json')) {
        throw new DomainError('Request body must be application/json.');
    }

    const rawBody = await request.text().catch(() => null);
    if (rawBody === null) throw new DomainError('Request body must be valid JSON.');
    if (new TextEncoder().encode(rawBody).byteLength > MAX_JSON_BODY_BYTES) {
        throw new DomainError('Request body is too large.');
    }

    let body: unknown;
    try {
        body = rawBody ? JSON.parse(rawBody) as unknown : null;
    } catch {
        throw new DomainError('Request body must be valid JSON.');
    }
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
        throw new DomainError('Request body must be a JSON object.');
    }
    return body as Record<string, unknown>;
}

export function assertTrustedMutationOrigin(request: Request): void {
    if (!MUTATION_METHODS.has(request.method)) return;
    const secFetchSite = request.headers.get('sec-fetch-site');
    if (secFetchSite && !['same-origin', 'same-site', 'none'].includes(secFetchSite)) {
        throw new UnauthorizedError('Cross-site request source is not allowed.');
    }

    const origin = request.headers.get('origin');
    if (!origin) {
        if (process.env.NODE_ENV === 'production') {
            throw new UnauthorizedError('Mutation requests must include an Origin header.');
        }
        return;
    }

    const host = request.headers.get('x-forwarded-host') || request.headers.get('host');
    const protocol = request.headers.get('x-forwarded-proto') || 'https';
    
    let originUrl: URL;
    try {
        originUrl = new URL(origin);
    } catch {
        throw new UnauthorizedError('Request origin is invalid.');
    }

    // Compare origin against the host header (which should be the external domain)
    if (host && (originUrl.host !== host)) {
        logger.warn('Origin mismatch detected', {
            origin: origin,
            originHost: originUrl.host,
            hostHeader: host,
            forwardedHost: request.headers.get('x-forwarded-host'),
            requestUrl: request.url,
            method: request.method
        });

        // In development, we might have port mismatches or proxy issues
        if (process.env.NODE_ENV === 'development') {
            return;
        }

        // Special case for Firebase Hosting: allow if both are from the same project
        const isFirebaseDomain = (h: string) => h.includes('firebaseapp.com') || h.includes('web.app') || h.includes('a.run.app');
        const projectMatch = (h: string) => h.includes('shopmore-1e34b');

        if (isFirebaseDomain(originUrl.host) && (isFirebaseDomain(host) || projectMatch(host))) {
             return;
        }

        // Final fallback: if we are in production on Firebase, trust the x-forwarded-host
        const forwardedHost = request.headers.get('x-forwarded-host');
        if (forwardedHost && originUrl.host === forwardedHost) {
            return;
        }

        throw new UnauthorizedError('Cross-site request origin is not allowed.');
    }
}

function clientFingerprint(request: Request): string {
    const forwardedFor = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
    const realIp = request.headers.get('x-real-ip')?.trim();
    const ip = forwardedFor || realIp || 'unknown-ip';
    const userAgent = request.headers.get('user-agent')?.slice(0, 120) || 'unknown-agent';
    return `${ip}:${userAgent}`;
}

function pruneRateLimitBuckets(now: number): void {
    if (rateLimitBuckets.size < RATE_LIMIT_MAX_BUCKETS) return;
    for (const [key, bucket] of rateLimitBuckets) {
        if (bucket.resetAt <= now) rateLimitBuckets.delete(key);
        if (rateLimitBuckets.size < RATE_LIMIT_MAX_BUCKETS) return;
    }
}

export function assertRateLimit(request: Request, scope: string, maxAttempts: number, windowMs: number): void {
    const now = Date.now();
    pruneRateLimitBuckets(now);

    const key = `${scope}:${clientFingerprint(request)}`;
    const existing = rateLimitBuckets.get(key);
    if (!existing || existing.resetAt <= now) {
        rateLimitBuckets.set(key, { count: 1, resetAt: now + windowMs });
        return;
    }

    existing.count += 1;
    if (existing.count > maxAttempts) {
        throw new RateLimitError(Math.max(1, Math.ceil((existing.resetAt - now) / 1000)));
    }
}

export function parseBoundedLimit(value: string | null, fallback = 20, max = 100): number {
    const parsed = Number(value ?? fallback);
    if (!Number.isFinite(parsed)) return fallback;
    return Math.min(Math.max(Math.trunc(parsed), 1), max);
}

export function parseOrderStatus(value: unknown): OrderStatus | undefined {
    if (value === null || value === undefined || value === '') return undefined;
    if (typeof value === 'string' && ORDER_STATUSES.has(value as OrderStatus)) return value as OrderStatus;
    throw new DomainError('Invalid order status.');
}

export function requireOrderStatus(value: unknown): OrderStatus {
    const status = parseOrderStatus(value);
    if (!status) throw new DomainError('Order status is required.');
    return status;
}

export function requireString(value: unknown, field: string): string {
    if (typeof value !== 'string' || !value.trim()) throw new DomainError(`${field} is required.`);
    return value.trim();
}

export function optionalString(value: unknown, field: string): string | undefined {
    if (value === undefined || value === null || value === '') return undefined;
    if (typeof value !== 'string') throw new DomainError(`${field} must be a string.`);
    return value.trim() || undefined;
}

export function requireInteger(value: unknown, field: string): number {
    if (typeof value !== 'number' || !Number.isInteger(value)) {
        throw new DomainError(`${field} must be a whole number.`);
    }
    return value;
}

export function optionalInteger(value: unknown, field: string): number | undefined {
    if (value === undefined || value === null || value === '') return undefined;
    return requireInteger(value, field);
}

export function optionalBoolean(value: unknown, field: string): boolean | undefined {
    if (value === undefined || value === null || value === '') return undefined;
    if (typeof value !== 'boolean') throw new DomainError(`${field} must be true or false.`);
    return value;
}

export function optionalStringArray(value: unknown, field: string): string[] | undefined {
    if (value === undefined || value === null || value === '') return undefined;
    if (!Array.isArray(value) || !value.every((item) => typeof item === 'string')) {
        throw new DomainError(`${field} must be a list of strings.`);
    }
    return value.map((item) => item.trim()).filter(Boolean);
}

function isJsonValue(value: unknown): value is JsonValue {
    if (value === null) return true;
    const valueType = typeof value;
    if (valueType === 'string' || valueType === 'number' || valueType === 'boolean') return true;
    if (Array.isArray(value)) return value.every(isJsonValue);
    if (valueType === 'object') {
        return Object.values(value as Record<string, unknown>).every(isJsonValue);
    }
    return false;
}

export function requireJsonValue(value: unknown, field: string): JsonValue {
    if (!isJsonValue(value)) {
        throw new DomainError(`${field} must be a valid JSON value.`);
    }
    return value;
}

export function requireProductCategory(value: unknown): string {
    const str = optionalString(value, 'category');
    if (!str) throw new DomainError('Product category is required.');
    return str;
}

export function requireProductStatus(value: unknown): ProductStatus {
    if (typeof value === 'string' && PRODUCT_STATUSES.has(value as ProductStatus)) return value as ProductStatus;
    throw new DomainError('Product status is invalid.');
}

export function optionalClassification(value: unknown): string | undefined {
    return optionalString(value, 'classification');
}

export function optionalSalesChannels(value: unknown): ProductSalesChannel[] | undefined {
    if (value === undefined || value === null || value === '') return undefined;
    if (!Array.isArray(value)) throw new DomainError('salesChannels must be a list.');
    return value.map((item) => {
        if (typeof item === 'string' && PRODUCT_SALES_CHANNELS.has(item as ProductSalesChannel)) {
            return item as ProductSalesChannel;
        }
        throw new DomainError('Sales channel is invalid.');
    });
}

export function parseProductMedia(value: unknown): ProductMedia {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        throw new DomainError('Media item must be a JSON object.');
    }
    const body = value as Record<string, unknown>;
    return {
        id: requireString(body.id, 'media.id'),
        url: requireString(body.url, 'media.url'),
        altText: optionalString(body.altText, 'media.altText'),
        position: requireInteger(body.position, 'media.position'),
        width: optionalInteger(body.width, 'media.width'),
        height: optionalInteger(body.height, 'media.height'),
        size: optionalInteger(body.size, 'media.size'),
        createdAt: body.createdAt ? new Date(body.createdAt as string) : new Date(),
    };
}

export function parseProductMediaArray(value: unknown): ProductMedia[] {
    if (value === undefined || value === null || value === '') return [];
    if (!Array.isArray(value)) throw new DomainError('media must be a list.');
    return value.map((item) => parseProductMedia(item));
}

export function parseCartItemMutation(body: Record<string, unknown>): { productId: string; quantity: number; variantId?: string } {
    return {
        productId: requireString(body.productId, 'productId'),
        quantity: requireInteger(body.quantity, 'quantity'),
        variantId: optionalString(body.variantId, 'variantId'),
    };
}

export function parseProductIdMutation(body: Record<string, unknown>): { productId: string; variantId?: string } {
    return { 
        productId: requireString(body.productId, 'productId'),
        variantId: optionalString(body.variantId, 'variantId'),
    };
}

export function parseShippingAddress(value: unknown): Address {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        throw new DomainError('shippingAddress must be a JSON object.');
    }
    const body = value as Record<string, unknown>;
    return {
        street: requireString(body.street, 'shippingAddress.street'),
        city: requireString(body.city, 'shippingAddress.city'),
        state: requireString(body.state, 'shippingAddress.state'),
        zip: requireString(body.zip, 'shippingAddress.zip'),
        country: requireString(body.country, 'shippingAddress.country').toUpperCase(),
    };
}

export function parseProductDraft(body: Record<string, unknown>): ProductDraft {
    return {
        name: requireString(body.name, 'name'),
        description: requireString(body.description, 'description'),
        price: requireInteger(body.price, 'price'),
        compareAtPrice: optionalInteger(body.compareAtPrice, 'compareAtPrice'),
        cost: optionalInteger(body.cost, 'cost'),
        category: requireProductCategory(body.category),
        productType: optionalString(body.productType, 'productType'),
        vendor: optionalString(body.vendor, 'vendor'),
        tags: optionalStringArray(body.tags, 'tags'),
        collections: optionalStringArray(body.collections, 'collections'),
        handle: optionalString(body.handle, 'handle'),
        seoTitle: optionalString(body.seoTitle, 'seoTitle'),
        seoDescription: optionalString(body.seoDescription, 'seoDescription'),
        salesChannels: optionalSalesChannels(body.salesChannels),
        stock: requireInteger(body.stock, 'stock'),
        trackQuantity: optionalBoolean(body.trackQuantity, 'trackQuantity'),
        continueSellingWhenOutOfStock: optionalBoolean(body.continueSellingWhenOutOfStock, 'continueSellingWhenOutOfStock'),
        reorderPoint: optionalInteger(body.reorderPoint, 'reorderPoint'),
        reorderQuantity: optionalInteger(body.reorderQuantity, 'reorderQuantity'),
        physicalItem: optionalBoolean(body.physicalItem, 'physicalItem'),
        weightGrams: optionalInteger(body.weightGrams, 'weightGrams'),
        sku: optionalString(body.sku, 'sku'),
        manufacturer: optionalString(body.manufacturer, 'manufacturer'),
        supplier: optionalString(body.supplier, 'supplier'),
        manufacturerSku: optionalString(body.manufacturerSku, 'manufacturerSku'),
        barcode: optionalString(body.barcode, 'barcode'),
        imageUrl: requireString(body.imageUrl, 'imageUrl'),
        status: requireProductStatus(body.status ?? 'active'),
        set: optionalString(body.set, 'set'),
        rarity: optionalClassification(body.rarity),
        media: parseProductMediaArray(body.media),
    };
}

export function parseProductUpdate(body: Record<string, unknown>): ProductUpdate {
    const update: ProductUpdate = {};
    if ('name' in body) update.name = requireString(body.name, 'name');
    if ('description' in body) update.description = requireString(body.description, 'description');
    if ('price' in body) update.price = requireInteger(body.price, 'price');
    if ('compareAtPrice' in body) update.compareAtPrice = optionalInteger(body.compareAtPrice, 'compareAtPrice');
    if ('cost' in body) update.cost = optionalInteger(body.cost, 'cost');
    if ('category' in body) update.category = requireProductCategory(body.category);
    if ('productType' in body) update.productType = optionalString(body.productType, 'productType');
    if ('vendor' in body) update.vendor = optionalString(body.vendor, 'vendor');
    if ('tags' in body) update.tags = optionalStringArray(body.tags, 'tags');
    if ('collections' in body) update.collections = optionalStringArray(body.collections, 'collections');
    if ('handle' in body) update.handle = optionalString(body.handle, 'handle');
    if ('seoTitle' in body) update.seoTitle = optionalString(body.seoTitle, 'seoTitle');
    if ('seoDescription' in body) update.seoDescription = optionalString(body.seoDescription, 'seoDescription');
    if ('salesChannels' in body) update.salesChannels = optionalSalesChannels(body.salesChannels);
    if ('stock' in body) update.stock = requireInteger(body.stock, 'stock');
    if ('trackQuantity' in body) update.trackQuantity = optionalBoolean(body.trackQuantity, 'trackQuantity');
    if ('continueSellingWhenOutOfStock' in body) update.continueSellingWhenOutOfStock = optionalBoolean(body.continueSellingWhenOutOfStock, 'continueSellingWhenOutOfStock');
    if ('reorderPoint' in body) update.reorderPoint = optionalInteger(body.reorderPoint, 'reorderPoint');
    if ('reorderQuantity' in body) update.reorderQuantity = optionalInteger(body.reorderQuantity, 'reorderQuantity');
    if ('physicalItem' in body) update.physicalItem = optionalBoolean(body.physicalItem, 'physicalItem');
    if ('weightGrams' in body) update.weightGrams = optionalInteger(body.weightGrams, 'weightGrams');
    if ('sku' in body) update.sku = optionalString(body.sku, 'sku');
    if ('manufacturer' in body) update.manufacturer = optionalString(body.manufacturer, 'manufacturer');
    if ('supplier' in body) update.supplier = optionalString(body.supplier, 'supplier');
    if ('manufacturerSku' in body) update.manufacturerSku = optionalString(body.manufacturerSku, 'manufacturerSku');
    if ('barcode' in body) update.barcode = optionalString(body.barcode, 'barcode');
    if ('imageUrl' in body) update.imageUrl = requireString(body.imageUrl, 'imageUrl');
    if ('status' in body) update.status = requireProductStatus(body.status);
    if ('set' in body) update.set = optionalString(body.set, 'set');
    if ('rarity' in body) update.rarity = optionalClassification(body.rarity);
    if ('media' in body) update.media = parseProductMediaArray(body.media);
    return update;
}

export function parseIdempotencyKey(value: unknown): string | undefined {
    if (value === undefined || value === null || value === '') return undefined;
    if (typeof value !== 'string') throw new DomainError('idempotencyKey must be a string.');
    const trimmed = value.trim();
    if (!IDEMPOTENCY_KEY_PATTERN.test(trimmed)) {
        throw new DomainError('idempotencyKey is invalid.');
    }
    return trimmed;
}

export function parseCheckoutRequest(body: Record<string, unknown>): { 
    shippingAddress: Address; 
    paymentMethodId: string; 
    idempotencyKey?: string;
    discountCode?: string;
} {
    return {
        shippingAddress: parseShippingAddress(body.shippingAddress),
        paymentMethodId: requireString(body.paymentMethodId, 'paymentMethodId'),
        idempotencyKey: parseIdempotencyKey(body.idempotencyKey),
        discountCode: optionalString(body.discountCode, 'discountCode'),
    };
}

export function jsonError(error: unknown, fallback = 'Request failed'): NextResponse {
    const isExpected = error instanceof AuthError
        || error instanceof UnauthorizedError
        || error instanceof OrderNotFoundError
        || error instanceof ProductNotFoundError
        || error instanceof RateLimitError
        || error instanceof DomainError;
    if (!isExpected) {
        logger.error(fallback, error);
    }
    const message = isExpected || process.env.NODE_ENV !== 'production'
        ? error instanceof Error ? error.message : fallback
        : fallback;
    const status = error instanceof AuthError
        ? 401
        : error instanceof RateLimitError
            ? 429
            : error instanceof UnauthorizedError
            ? 403
            : error instanceof ProductNotFoundError || error instanceof OrderNotFoundError
                ? 404
                : error instanceof DomainError
                    ? 400
                    : 500;
    const headers = error instanceof RateLimitError
        ? { 'Retry-After': String(error.retryAfterSeconds) }
        : undefined;
    return NextResponse.json({ error: message }, { status, headers });
}
