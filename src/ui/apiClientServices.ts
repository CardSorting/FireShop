'use client';

import type { Address, AdminDashboardSummary, Cart, InventoryOverview, Order, OrderStatus, Product, ProductDraft, ProductUpdate, User, OrderNote } from '@domain/models';

const sessionScoped = (userId: string) => void userId;

async function request<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(path, {
        ...init,
        cache: 'no-store',
        credentials: 'same-origin',
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
        logger: {
            log: (...args: any[]) => console.log('[UI]', ...args),
            error: (...args: any[]) => console.error('[UI]', ...args),
            warn: (...args: any[]) => console.warn('[UI]', ...args),
        },
        authService: {
            getCurrentUser: () => request<User | null>('/api/auth/me'),
            signIn: (email: string, password: string) => request<User>('/api/auth/sign-in', { method: 'POST', body: JSON.stringify({ email, password }) }),
            signUp: (email: string, password: string, displayName: string) => request<User>('/api/auth/sign-up', { method: 'POST', body: JSON.stringify({ email, password, displayName }) }),
            signOut: () => request<void>('/api/auth/sign-out', { method: 'POST' }),
            onAuthStateChanged(callback: (user: User | null) => void) {
                void request<User | null>('/api/auth/me').then(callback).catch(() => callback(null));
                return () => { };
            },
            getAllUsers: () => request<User[]>('/api/auth/users'),
            updateUser: (id: string, updates: Partial<User>) => request<User>(`/api/auth/users/${id}`, { method: 'PATCH', body: JSON.stringify(updates) }),
        },
        productService: {
            getProducts: (options?: { category?: string; limit?: number; cursor?: string; query?: string }) => {
                const qs = new URLSearchParams();
                if (options?.category) qs.set('category', options.category);
                if (options?.limit) qs.set('limit', String(options.limit));
                if (options?.cursor) qs.set('cursor', options.cursor);
                if (options?.query) qs.set('query', options.query);
                return request<{ products: Product[]; nextCursor?: string }>(`/api/products?${qs}`);
            },
            getProduct: (id: string) => request<Product>(`/api/products/${id}`),
            getInventoryOverview: () => request<InventoryOverview>('/api/admin/inventory'),
            createProduct: (data: ProductDraft, _actor: { id: string; email: string }) => request<Product>('/api/products', { method: 'POST', body: JSON.stringify(data) }),
            updateProduct: (id: string, data: ProductUpdate, _actor: { id: string; email: string }) => request<Product>(`/api/products/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
            deleteProduct: (id: string, _actor: { id: string; email: string }) => request<void>(`/api/products/${id}`, { method: 'DELETE' }),
            batchUpdateProducts: (updates: { id: string; updates: ProductUpdate }[], _actor: { id: string; email: string }) => request<Product[]>('/api/admin/products/batch', { method: 'POST', body: JSON.stringify({ updates }) }),
            batchDeleteProducts: (ids: string[], _actor: { id: string; email: string }) => request<void>('/api/admin/products/batch', { method: 'DELETE', body: JSON.stringify({ ids }) }),
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
            getAdminDashboardSummary: () => request<AdminDashboardSummary>('/api/admin/dashboard'),
            finalizeTrustedCheckout: (userId: string, shippingAddress: Address, paymentMethodId: string, idempotencyKey?: string) => (sessionScoped(userId), request<Order>('/api/orders', { method: 'POST', body: JSON.stringify({ shippingAddress, paymentMethodId, idempotencyKey }) })),
            placeOrder: (userId: string, shippingAddress: Address, paymentMethodId?: string, idempotencyKey?: string) => (sessionScoped(userId), request<Order>('/api/orders', { method: 'POST', body: JSON.stringify({ shippingAddress, paymentMethodId, idempotencyKey }) })),
            getOrders: (userId: string) => (sessionScoped(userId), request<Order[]>('/api/orders')),
            getOrder: (id: string) => request<Order>(`/api/admin/orders/${id}`),
            getAllOrders: (options?: { status?: OrderStatus; limit?: number; cursor?: string; query?: string }) => {
                const qs = new URLSearchParams();
                if (options?.status) qs.set('status', options.status);
                if (options?.limit) qs.set('limit', String(options.limit));
                if (options?.cursor) qs.set('cursor', options.cursor);
                if (options?.query) qs.set('query', options.query);
                return request<{ orders: Order[]; nextCursor?: string }>(`/api/admin/orders?${qs}`);
            },
            addOrderNote: (id: string, text: string, actor: any) => request<OrderNote>(`/api/admin/orders/${id}/notes`, { method: 'POST', body: JSON.stringify({ text }) }),
            updateOrderFulfillment: (id: string, data: any, actor: any) => request<void>(`/api/admin/orders/${id}/fulfillment`, { method: 'PATCH', body: JSON.stringify(data) }),
            updateOrderStatus: (id: string, status: OrderStatus, _actor: { id: string; email: string }) => request<void>(`/api/admin/orders/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) }),
            batchUpdateOrderStatus: (ids: string[], status: OrderStatus, _actor: { id: string; email: string }) => request<void>('/api/admin/orders/batch', { method: 'PATCH', body: JSON.stringify({ ids, status }) }),
            getCustomerSummaries: (users: User[]) => request<any[]>('/api/admin/customers', { method: 'POST', body: JSON.stringify({ users }) }),
        },
        discountService: {
            getAllDiscounts: () => request<any[]>('/api/admin/discounts'),
            createDiscount: (data: any, _actor: { id: string; email: string }) => request<any>('/api/admin/discounts', { method: 'POST', body: JSON.stringify(data) }),
            updateDiscount: (id: string, updates: any, _actor: { id: string; email: string }) => request<any>(`/api/admin/discounts/${id}`, { method: 'PATCH', body: JSON.stringify(updates) }),
            deleteDiscount: (id: string, _actor: { id: string; email: string }) => request<void>(`/api/admin/discounts/${id}`, { method: 'DELETE' }),
        },
        settingsService: {
            getSetupProgress: () => request<import('./pages/admin/AdminSettings').SetupGuideProgress>('/api/admin/setup-guide'),
            getSettings: () => request<Record<string, any>>('/api/admin/settings'),
            updateSetting: (key: string, value: any, _actor?: { id: string; email: string }) => request<void>('/api/admin/settings', { method: 'POST', body: JSON.stringify({ key, value }) }),
        },
        transferService: {
            getAllTransfers: () => request<import('@domain/models').Transfer[]>('/api/admin/inventory/transfers'),
            receiveTransfer: (id: string) => request<void>('/api/admin/inventory/transfers', { method: 'POST', body: JSON.stringify({ id, action: 'receive' }) }),
        },
        auditService: {
            getRecentLogs: (options?: { query?: string; action?: string; targetId?: string; userId?: string }) => {
                const qs = new URLSearchParams();
                if (options?.query) qs.set('query', options.query);
                if (options?.action) qs.set('action', options.action);
                if (options?.targetId) qs.set('targetId', options.targetId);
                if (options?.userId) qs.set('userId', options.userId);
                return request<any[]>(`/api/admin/audit?${qs}`);
            },
            verifyChain: () => request<{ valid: boolean; total: number; corruptedId?: string }>('/api/admin/audit/verify'),
        },
    };

}
