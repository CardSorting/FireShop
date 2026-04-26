import { NextResponse } from 'next/server';
import type { Address, CardRarity, OrderStatus, ProductCategory, ProductDraft, ProductUpdate, User } from '@domain/models';
import { AuthError, DomainError, ProductNotFoundError, UnauthorizedError } from '@domain/errors';
import { getSessionUser } from './session';
import { logger } from '@utils/logger';

const ORDER_STATUSES = new Set<OrderStatus>(['pending', 'confirmed', 'shipped', 'delivered', 'cancelled']);
const PRODUCT_CATEGORIES = new Set<ProductCategory>(['booster', 'single', 'deck', 'accessory', 'box']);
const CARD_RARITIES = new Set<CardRarity>(['common', 'uncommon', 'rare', 'holo', 'secret']);

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
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
        throw new DomainError('Request body must be a JSON object.');
    }
    return body as Record<string, unknown>;
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

export function requireProductCategory(value: unknown): ProductCategory {
    if (typeof value === 'string' && PRODUCT_CATEGORIES.has(value as ProductCategory)) return value as ProductCategory;
    throw new DomainError('Product category is invalid.');
}

export function optionalCardRarity(value: unknown): CardRarity | undefined {
    if (value === undefined || value === null || value === '') return undefined;
    if (typeof value === 'string' && CARD_RARITIES.has(value as CardRarity)) return value as CardRarity;
    throw new DomainError('Card rarity is invalid.');
}

export function parseCartItemMutation(body: Record<string, unknown>): { productId: string; quantity: number } {
    return {
        productId: requireString(body.productId, 'productId'),
        quantity: requireInteger(body.quantity, 'quantity'),
    };
}

export function parseProductIdMutation(body: Record<string, unknown>): { productId: string } {
    return { productId: requireString(body.productId, 'productId') };
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
        category: requireProductCategory(body.category),
        stock: requireInteger(body.stock, 'stock'),
        imageUrl: requireString(body.imageUrl, 'imageUrl'),
        set: optionalString(body.set, 'set'),
        rarity: optionalCardRarity(body.rarity),
    };
}

export function parseProductUpdate(body: Record<string, unknown>): ProductUpdate {
    const update: ProductUpdate = {};
    if ('name' in body) update.name = requireString(body.name, 'name');
    if ('description' in body) update.description = requireString(body.description, 'description');
    if ('price' in body) update.price = requireInteger(body.price, 'price');
    if ('category' in body) update.category = requireProductCategory(body.category);
    if ('stock' in body) update.stock = requireInteger(body.stock, 'stock');
    if ('imageUrl' in body) update.imageUrl = requireString(body.imageUrl, 'imageUrl');
    if ('set' in body) update.set = optionalString(body.set, 'set');
    if ('rarity' in body) update.rarity = optionalCardRarity(body.rarity);
    return update;
}

export function parseCheckoutRequest(body: Record<string, unknown>): { shippingAddress: Address; paymentMethodId: string } {
    return {
        shippingAddress: parseShippingAddress(body.shippingAddress),
        paymentMethodId: requireString(body.paymentMethodId, 'paymentMethodId'),
    };
}

export function jsonError(error: unknown, fallback = 'Request failed'): NextResponse {
    const isExpected = error instanceof AuthError
        || error instanceof UnauthorizedError
        || error instanceof ProductNotFoundError
        || error instanceof DomainError;
    if (!isExpected) {
        logger.error(fallback, error);
    }
    const message = isExpected || process.env.NODE_ENV !== 'production'
        ? error instanceof Error ? error.message : fallback
        : fallback;
    const status = error instanceof AuthError
        ? 401
        : error instanceof UnauthorizedError
            ? 403
            : error instanceof ProductNotFoundError
                ? 404
                : error instanceof DomainError
                    ? 400
                    : 500;
    return NextResponse.json({ error: message }, { status });
}
