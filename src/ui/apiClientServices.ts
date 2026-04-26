'use client';

import type { Address, Cart, Order, OrderStatus, Product, ProductDraft, ProductUpdate, User } from '@domain/models';

const sessionScoped = (userId: string) => void userId;

async function request<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(path, {
        ...init,
        headers: {
            'Content-Type': 'application/json',
            ...(init?.headers ?? {}),
        },
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) throw new Error(data?.error ?? 'Request failed');
    return reviveDates(data) as T;
}

function reviveDates(value: unknown): unknown {
    if (Array.isArray(value)) return value.map(reviveDates);
    if (value && typeof value === 'object') {
        const out: Record<string, unknown> = {};
        for (const [key, val] of Object.entries(value)) {
            out[key] = ['createdAt', 'updatedAt'].includes(key) && typeof val === 'string' ? new Date(val) : reviveDates(val);
        }
        return out;
    }
    return value;
}

export function createApiClientServices() {
    return {
        authService: {
            getCurrentUser: () => request<User | null>('/api/auth/me'),
            signIn: (email: string, password: string) => request<User>('/api/auth/sign-in', { method: 'POST', body: JSON.stringify({ email, password }) }),
            signUp: (email: string, password: string, displayName: string) => request<User>('/api/auth/sign-up', { method: 'POST', body: JSON.stringify({ email, password, displayName }) }),
            signOut: () => request<void>('/api/auth/sign-out', { method: 'POST' }),
            onAuthStateChanged(callback: (user: User | null) => void) {
                void request<User | null>('/api/auth/me').then(callback).catch(() => callback(null));
                return () => { };
            },
        },
        productService: {
            getProducts: (options?: { category?: string; limit?: number; cursor?: string }) => {
                const qs = new URLSearchParams();
                if (options?.category) qs.set('category', options.category);
                if (options?.limit) qs.set('limit', String(options.limit));
                if (options?.cursor) qs.set('cursor', options.cursor);
                return request<{ products: Product[]; nextCursor?: string }>(`/api/products?${qs}`);
            },
            getProduct: (id: string) => request<Product>(`/api/products/${id}`),
            createProduct: (data: ProductDraft) => request<Product>('/api/products', { method: 'POST', body: JSON.stringify(data) }),
            updateProduct: (id: string, data: ProductUpdate) => request<Product>(`/api/products/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
            deleteProduct: (id: string) => request<void>(`/api/products/${id}`, { method: 'DELETE' }),
        },
        cartService: {
            getCart: (userId: string) => (sessionScoped(userId), request<Cart | null>('/api/cart')),
            addToCart: (userId: string, productId: string, quantity: number) => (sessionScoped(userId), request<Cart>('/api/cart/items', { method: 'POST', body: JSON.stringify({ productId, quantity }) })),
            removeFromCart: (userId: string, productId: string) => (sessionScoped(userId), request<Cart>('/api/cart/items', { method: 'DELETE', body: JSON.stringify({ productId }) })),
            updateQuantity: (userId: string, productId: string, quantity: number) => (sessionScoped(userId), request<Cart>('/api/cart/items', { method: 'PATCH', body: JSON.stringify({ productId, quantity }) })),
            clearCart: (userId: string) => (sessionScoped(userId), request<void>('/api/cart', { method: 'DELETE' })),
            getCartTotal: (items: { priceSnapshot: number; quantity: number }[]) => items.reduce((sum, item) => sum + item.priceSnapshot * item.quantity, 0),
        },
        orderService: {
            finalizeTrustedCheckout: (userId: string, shippingAddress: Address, paymentMethodId: string, idempotencyKey?: string) => (sessionScoped(userId), request<Order>('/api/orders', { method: 'POST', body: JSON.stringify({ shippingAddress, paymentMethodId, idempotencyKey }) })),
            placeOrder: (userId: string, shippingAddress: Address, paymentMethodId?: string, idempotencyKey?: string) => (sessionScoped(userId), request<Order>('/api/orders', { method: 'POST', body: JSON.stringify({ shippingAddress, paymentMethodId, idempotencyKey }) })),
            getOrders: (userId: string) => (sessionScoped(userId), request<Order[]>('/api/orders')),
            getAllOrders: (options?: { status?: OrderStatus; limit?: number; cursor?: string }) => {
                const qs = new URLSearchParams();
                if (options?.status) qs.set('status', options.status);
                if (options?.limit) qs.set('limit', String(options.limit));
                if (options?.cursor) qs.set('cursor', options.cursor);
                return request<{ orders: Order[]; nextCursor?: string }>(`/api/admin/orders?${qs}`);
            },
            updateOrderStatus: (id: string, status: OrderStatus) => request<void>(`/api/admin/orders/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) }),
        },
    };
}
