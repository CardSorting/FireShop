/**
 * [LAYER: UI]
 */
'use client';

import type { 
    Address, Cart, CartItem, Collection, Discount, InventoryLevel, InventoryLocation, 
    Product, ProductMedia, PurchaseOrder, SupportTicket, TicketMessage, User, 
    KnowledgebaseCategory, KnowledgebaseArticle, SupportMacro, AdminDashboardSummary, 
    OrderStatus, ProductDraft, ProductManagementFilters, ProductManagementOverview, 
    ProductSavedView, ProductSavedViewResult, ProductUpdate, Order, OrderNote, Supplier,
    InventoryOverview, ProductCategory, ProductType
} from '@domain/models';

const sessionScoped = (userId: string) => void userId;
const DATE_FIELD_KEYS = new Set(['createdAt', 'updatedAt', 'joined', 'lastOrder', 'startsAt', 'endsAt', 'expectedAt', 'estimatedDeliveryDate', 'at']);

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
    const contentType = response.headers.get('content-type') ?? '';
    const data = contentType.includes('application/json')
        ? await response.json().catch(() => null)
        : null;
    if (!response.ok) {
        const serverMessage = data && typeof data === 'object' && 'error' in data && typeof data.error === 'string'
            ? data.error
            : null;
        throw new Error(serverMessage ?? `${init?.method ?? 'GET'} ${path} failed (${response.status})`);
    }
    return reviveDates(data) as T;
}

function reviveDates(value: unknown): unknown {
    if (Array.isArray(value)) return value.map(reviveDates);
    if (value && typeof value === 'object') {
        const out: Record<string, unknown> = {};
        for (const [key, val] of Object.entries(value)) {
            out[key] = DATE_FIELD_KEYS.has(key) && typeof val === 'string' ? new Date(val) : reviveDates(val);
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
            getProducts: (options?: { category?: string; collection?: string; limit?: number; cursor?: string; query?: string }) => {
                const qs = new URLSearchParams();
                if (options?.category) qs.set('category', options.category);
                if (options?.collection) qs.set('collection', options.collection);
                if (options?.limit) qs.set('limit', String(options.limit));
                if (options?.cursor) qs.set('cursor', options.cursor);
                if (options?.query) qs.set('query', options.query);
                return request<{ products: Product[]; nextCursor?: string }>(`/api/products?${qs}`);
            },
            getProduct: (id: string) => request<Product>(`/api/products/${id}`),
            getProductByHandle: (handle: string) => request<Product>(`/api/products/handle/${handle}`),
            getInventoryOverview: () => request<InventoryOverview>('/api/admin/inventory'),
            getProductManagementOverview: () => request<ProductManagementOverview>('/api/admin/products/overview'),
            getProductSavedView: (view: ProductSavedView, options?: ProductManagementFilters) => {
                const qs = new URLSearchParams();
                if (options?.query) qs.set('query', options.query);
                if (options?.limit) qs.set('limit', String(options.limit));
                if (options?.cursor) qs.set('cursor', options.cursor);
                if (options?.status && options.status !== 'all') qs.set('status', options.status);
                if (options?.category && options.category !== 'all') qs.set('category', options.category);
                if (options?.vendor && options.vendor !== 'all') qs.set('vendor', options.vendor);
                if (options?.productType && options.productType !== 'all') qs.set('productType', options.productType);
                if (options?.inventoryHealth && options.inventoryHealth !== 'all') qs.set('inventoryHealth', options.inventoryHealth);
                if (options?.setupStatus && options.setupStatus !== 'all') qs.set('setupStatus', options.setupStatus);
                if (options?.setupIssue && options.setupIssue !== 'all') qs.set('setupIssue', options.setupIssue);
                if (options?.marginHealth && options.marginHealth !== 'all') qs.set('marginHealth', options.marginHealth);
                if (options?.tag) qs.set('tag', options.tag);
                if (options?.hasSku !== undefined) qs.set('hasSku', String(options.hasSku));
                if (options?.hasImage !== undefined) qs.set('hasImage', String(options.hasImage));
                if (options?.hasCost !== undefined) qs.set('hasCost', String(options.hasCost));
                if (options?.sort) qs.set('sort', options.sort);
                return request<ProductSavedViewResult>(`/api/admin/products/views/${view}?${qs}`);
            },
            createProduct: (data: ProductDraft, _actor: { id: string; email: string }) => request<Product>('/api/products', { method: 'POST', body: JSON.stringify(data) }),
            updateProduct: (id: string, data: ProductUpdate, _actor: { id: string; email: string }) => request<Product>(`/api/products/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
            deleteProduct: (id: string, _actor: { id: string; email: string }) => request<void>(`/api/products/${id}`, { method: 'DELETE' }),
            batchUpdateProducts: (updates: { id: string; updates: ProductUpdate }[], _actor: { id: string; email: string }) => request<Product[]>('/api/admin/products/batch', { method: 'POST', body: JSON.stringify({ updates }) }),
            batchUpdateInventory: (updates: { id: string; variantId?: string; stock: number }[], _actor: { id: string; email: string }) => request<void>('/api/admin/inventory/batch', { method: 'POST', body: JSON.stringify({ updates }) }),
            batchDeleteProducts: (ids: string[], _actor: { id: string; email: string }) => request<void>('/api/admin/products/batch', { method: 'DELETE', body: JSON.stringify({ ids }) }),
        },
        cartService: {
            getCart: (userId: string) => (sessionScoped(userId), request<Cart | null>('/api/cart')),
            addToCart: (userId: string, productId: string, quantity: number, variantId?: string) => (sessionScoped(userId), request<Cart>('/api/cart/items', { method: 'POST', body: JSON.stringify({ productId, quantity, variantId }) })),
            removeFromCart: (userId: string, productId: string, variantId?: string) => (sessionScoped(userId), request<Cart>('/api/cart/items', { method: 'DELETE', body: JSON.stringify({ productId, variantId }) })),
            updateQuantity: (userId: string, productId: string, quantity: number, variantId?: string) => (sessionScoped(userId), request<Cart>('/api/cart/items', { method: 'PATCH', body: JSON.stringify({ productId, quantity, variantId }) })),
            clearCart: (userId: string) => (sessionScoped(userId), request<void>('/api/cart', { method: 'DELETE' })),
            getCartTotal: (items: { priceSnapshot: number; quantity: number }[]) => items.reduce((sum, item) => sum + item.priceSnapshot * item.quantity, 0),
        },
        orderService: {
            getAdminDashboardSummary: () => request<AdminDashboardSummary>('/api/admin/dashboard'),
            finalizeTrustedCheckout: (userId: string, shippingAddress: Address, paymentMethodId: string, idempotencyKey?: string, discountCode?: string) => (sessionScoped(userId), request<Order>('/api/orders', { method: 'POST', body: JSON.stringify({ shippingAddress, paymentMethodId, idempotencyKey, discountCode }) })),
            placeOrder: (userId: string, shippingAddress: Address, paymentMethodId?: string, idempotencyKey?: string, discountCode?: string) => (sessionScoped(userId), request<Order>('/api/orders', { method: 'POST', body: JSON.stringify({ shippingAddress, paymentMethodId, idempotencyKey, discountCode }) })),
            getOrders: (userId: string, options?: {
                status?: OrderStatus | 'all';
                query?: string;
                from?: string;
                to?: string;
                sort?: 'newest' | 'oldest' | 'total_desc' | 'total_asc' | 'status';
            }) => {
                sessionScoped(userId);
                const qs = new URLSearchParams();
                if (options?.status) qs.set('status', options.status);
                if (options?.query) qs.set('query', options.query);
                if (options?.from) qs.set('from', options.from);
                if (options?.to) qs.set('to', options.to);
                if (options?.sort) qs.set('sort', options.sort);
                return request<Order[]>(`/api/orders?${qs}`);
            },
            getOrder: (id: string) => request<Order>(`/api/orders/${id}`),
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
            getAdminOrder: (id: string) => request<Order>(`/api/admin/orders/${id}`),
            updateOrderStatus: (id: string, status: OrderStatus, _actor: { id: string; email: string }) => request<void>(`/api/admin/orders/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) }),
            batchUpdateOrderStatus: (ids: string[], status: OrderStatus, _actor: { id: string; email: string }) => request<void>('/api/admin/orders/batch', { method: 'PATCH', body: JSON.stringify({ ids, status }) }),
            getCustomerSummaries: (users: User[]) => request<any[]>('/api/admin/customers', { method: 'POST', body: JSON.stringify({ users }) }),
            getDigitalAssets: (userId: string) => (sessionScoped(userId), request<any[]>(`/api/account/vault?userId=${userId}`)),
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
        purchaseOrderService: {
            getOverview: () => request<any>('/api/admin/purchase-orders?overview=true'),
            getWorkspace: () => request<any>('/api/admin/purchase-orders?workspace=true'),
            list: (options?: { status?: string; supplier?: string; limit?: number; offset?: number }) => {
                const qs = new URLSearchParams();
                if (options?.status) qs.set('status', options.status);
                if (options?.supplier) qs.set('supplier', options.supplier);
                if (options?.limit) qs.set('limit', String(options.limit));
                if (options?.offset) qs.set('offset', String(options.offset));
                return request<PurchaseOrder[]>(`/api/admin/purchase-orders?${qs}`);
            },
            getById: (id: string) => request<PurchaseOrder>(`/api/admin/purchase-orders/${id}`),
            getGuided: (id: string) => request<any>(`/api/admin/purchase-orders/${id}?guided=true`),
            create: (data: any) => request<PurchaseOrder>('/api/admin/purchase-orders', { method: 'POST', body: JSON.stringify(data) }),
            submit: (id: string) => request<PurchaseOrder>(`/api/admin/purchase-orders/${id}`, { method: 'POST', body: JSON.stringify({ action: 'submit' }) }),
            cancel: (id: string) => request<PurchaseOrder>(`/api/admin/purchase-orders/${id}`, { method: 'POST', body: JSON.stringify({ action: 'cancel' }) }),
            close: (id: string, data: any) => request<PurchaseOrder>(`/api/admin/purchase-orders/${id}`, { method: 'POST', body: JSON.stringify({ action: 'close', ...data }) }),
            receive: (id: string, data: any) => request<any>(`/api/admin/purchase-orders/${id}`, { method: 'POST', body: JSON.stringify({ action: 'receive', ...data }) }),
        },
        inventoryService: {
            getLocations: () => request<InventoryLocation[]>('/api/admin/locations'),
            createLocation: (data: any) => request<InventoryLocation>('/api/admin/locations', { method: 'POST', body: JSON.stringify(data) }),
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
        supplierService: {
            list: (options?: { query?: string; limit?: number }) => {
                const qs = new URLSearchParams();
                if (options?.query) qs.set('query', options.query);
                if (options?.limit) qs.set('limit', String(options.limit));
                return request<Supplier[]>(`/api/admin/suppliers?${qs}`);
            },
            get: (id: string) => request<Supplier>(`/api/admin/suppliers/${id}`),
            create: (data: Partial<Supplier>) => request<Supplier>('/api/admin/suppliers', { method: 'POST', body: JSON.stringify(data) }),
            update: (id: string, updates: Partial<Supplier>) => request<Supplier>(`/api/admin/suppliers/${id}`, { method: 'PATCH', body: JSON.stringify(updates) }),
            delete: (id: string) => request<void>(`/api/admin/suppliers/${id}`, { method: 'DELETE' }),
        },
        collectionService: {
            list: (options?: { status?: string; limit?: number }) => {
                const qs = new URLSearchParams();
                if (options?.status) qs.set('status', options.status);
                if (options?.limit) qs.set('limit', String(options.limit));
                return request<Collection[]>(`/api/admin/collections?${qs}`);
            },
            get: (id: string) => request<Collection>(`/api/admin/collections/${id}`),
            getCollectionByHandle: (handle: string) => request<Collection>(`/api/collections/${handle}`),
            create: (data: Partial<Collection>) => request<Collection>('/api/admin/collections', { method: 'POST', body: JSON.stringify(data) }),
            update: (id: string, updates: Partial<Collection>) => request<Collection>(`/api/admin/collections/${id}`, { method: 'PATCH', body: JSON.stringify(updates) }),
            delete: (id: string) => request<void>(`/api/admin/collections/${id}`, { method: 'DELETE' }),
        },
        locationService: {
            getLocations: () => request<InventoryLocation[]>('/api/admin/locations'),
            createLocation: (data: any) => request<InventoryLocation>('/api/admin/locations', { method: 'POST', body: JSON.stringify(data) }),
            updateLocation: (id: string, updates: any) => request<InventoryLocation>(`/api/admin/locations/${id}`, { method: 'PATCH', body: JSON.stringify(updates) }),
        },
        taxonomyService: {
            getCategories: () => request<ProductCategory[]>('/api/taxonomy/categories'),
            saveCategory: (category: Partial<ProductCategory>, _actor: { id: string; email: string }) => request<ProductCategory>('/api/admin/taxonomy/categories', { method: 'POST', body: JSON.stringify(category) }),
            deleteCategory: (id: string, _actor: { id: string; email: string }) => request<void>(`/api/admin/taxonomy/categories/${id}`, { method: 'DELETE' }),
            getTypes: () => request<ProductType[]>('/api/taxonomy/types'),
            saveType: (type: Partial<ProductType>, _actor: { id: string; email: string }) => request<ProductType>('/api/admin/taxonomy/types', { method: 'POST', body: JSON.stringify(type) }),
            deleteType: (id: string, _actor: { id: string; email: string }) => request<void>(`/api/admin/taxonomy/types/${id}`, { method: 'DELETE' }),
        },
        wishlistService: {
            getWishlists: () => request<import('@domain/models').Wishlist[]>('/api/wishlists'),
            getWishlist: (id: string) => request<import('@domain/models').Wishlist & { items: Product[] }>(`/api/wishlists/${id}`),
            createWishlist: (name: string) => request<import('@domain/models').Wishlist>('/api/wishlists', { method: 'POST', body: JSON.stringify({ name }) }),
            updateWishlist: (id: string, name: string) => request<import('@domain/models').Wishlist>(`/api/wishlists/${id}`, { method: 'PATCH', body: JSON.stringify({ name }) }),
            deleteWishlist: (id: string) => request<void>(`/api/wishlists/${id}`, { method: 'DELETE' }),
            addItem: (wishlistId: string, productId: string) => request<void>(`/api/wishlists/${wishlistId}/items`, { method: 'POST', body: JSON.stringify({ productId }) }),
            removeItem: (wishlistId: string, productId: string) => request<void>(`/api/wishlists/${wishlistId}/items?productId=${productId}`, { method: 'DELETE' }),
            checkStatus: (productId: string) => request<{ isInWishlist: boolean }>(`/api/wishlists/status?productId=${productId}`),
        },
        ticketService: {
            listTickets: (options?: { status?: string; query?: string; limit?: number }) => {
                const qs = new URLSearchParams();
                if (options?.status) qs.set('status', options.status);
                if (options?.query) qs.set('query', options.query);
                if (options?.limit) qs.set('limit', String(options.limit));
                return request<SupportTicket[]>(`/api/admin/tickets?${qs}`);
            },
            getTicket: (id: string) => request<SupportTicket>(`/api/admin/tickets/${id}`),
            getUserTickets: (userId: string) => request<SupportTicket[]>(`/api/tickets?userId=${userId}`),
            getUserTicket: (id: string, userId: string) => request<SupportTicket>(`/api/tickets/${id}?userId=${userId}`),
            createTicket: (data: Partial<SupportTicket>) => request<SupportTicket>('/api/tickets', { method: 'POST', body: JSON.stringify(data) }),
            updateTicketStatus: (id: string, status: string) => request<SupportTicket>(`/api/admin/tickets/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
            updateTicketPriority: (id: string, priority: string) => request<SupportTicket>(`/api/admin/tickets/${id}/priority`, { method: 'PATCH', body: JSON.stringify({ priority }) }),
            updateTicketProperties: (id: string, properties: Partial<SupportTicket>) => request<SupportTicket>(`/api/admin/tickets/${id}/properties`, { method: 'PATCH', body: JSON.stringify(properties) }),
            batchUpdateTickets: (ids: string[], updates: Partial<SupportTicket>) => request<void>('/api/admin/tickets/batch', { method: 'PATCH', body: JSON.stringify({ ids, updates }) }),
            addMessage: (id: string, content: string, senderId?: string, senderType?: string, visibility: 'public' | 'internal' = 'public') => request<TicketMessage>(`/api/tickets/${id}/messages`, { method: 'POST', body: JSON.stringify({ content, senderId, senderType, visibility }) }),
            getMacros: () => request<SupportMacro[]>('/api/support/macros'),
            saveMacro: (data: Partial<SupportMacro>) => request<void>('/api/support/macros', { method: 'POST', body: JSON.stringify(data) }),
            updateMacro: (id: string, data: Partial<SupportMacro>) => request<void>(`/api/support/macros/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
            deleteMacro: (id: string) => request<void>(`/api/support/macros/${id}`, { method: 'DELETE' }),
            getHealthMetrics: () => request<{ slaCompliance: number; unassignedRate: number; totalActive: number }>('/api/admin/support/health'),
            getCustomerSummary: (userId: string) => request<{ totalTickets: number; resolvedCount: number; totalSpend: number; recentOrders: any[] }>(`/api/admin/support/customers/${userId}/summary`),
            sendHeartbeat: (ticketId: string, userId: string, userName: string) => request<{ viewers: { id: string; name: string }[] }>(`/api/admin/support/tickets/${ticketId}/heartbeat`, { method: 'POST', body: JSON.stringify({ userId, userName }) }),
        },
        knowledgebaseService: {
            getCategories: () => request<KnowledgebaseCategory[]>('/api/support/categories'),
            getArticles: (options?: { categoryId?: string; query?: string }) => {
                const qs = new URLSearchParams();
                if (options?.categoryId) qs.set('categoryId', options.categoryId);
                if (options?.query) qs.set('query', options.query);
                return request<KnowledgebaseArticle[]>(`/api/support/articles?${qs}`);
            },
            getArticle: (slug: string) => request<KnowledgebaseArticle>(`/api/support/articles/${slug}`),
            submitFeedback: (articleId: string, isHelpful: boolean, userId?: string) => request<void>('/api/support/feedback', { method: 'POST', body: JSON.stringify({ articleId, isHelpful, userId }) }),
        },
    };
}
