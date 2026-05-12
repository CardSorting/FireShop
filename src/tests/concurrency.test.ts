import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OrderService } from '../core/OrderService';
import { CheckoutInProgressError, InsufficientStockError } from '@domain/errors';

// Mock the bridge
vi.mock('@infrastructure/firebase/bridge', () => ({
  runTransaction: vi.fn(async (db, fn) => {
    // Simulate a slow transaction to increase chance of overlap in tests
    const transaction = {
      get: vi.fn(),
      set: vi.fn(),
      update: vi.fn(),
      delete: vi.fn()
    };
    await new Promise(resolve => setTimeout(resolve, 50));
    return fn(transaction);
  }),
  getUnifiedDb: vi.fn(() => ({})),
}));

describe('OrderService Concurrency', () => {
  let orderService: OrderService;
  let mockOrderRepo: any;
  let mockProductRepo: any;
  let mockCartRepo: any;
  let mockDiscountRepo: any;
  let mockPayment: any;
  let mockAudit: any;
  let mockLocker: any;

  beforeEach(() => {
    mockOrderRepo = {
      create: vi.fn().mockImplementation(async (o) => ({ ...o, id: 'o1', createdAt: new Date(), updatedAt: new Date() })),
      save: vi.fn(),
      getById: vi.fn(),
      getByPaymentTransactionId: vi.fn(),
      getByPaymentTransactionIdTransactional: vi.fn(),
      getByIdempotencyKey: vi.fn().mockResolvedValue(null),
    };
    mockProductRepo = {
      getById: vi.fn().mockResolvedValue({ id: 'p1', price: 1000, stock: 1 }),
      batchUpdateStock: vi.fn(),
    };
    mockCartRepo = {
      getByUserId: vi.fn().mockResolvedValue({
        userId: 'u1',
        items: [{ productId: 'p1', quantity: 1, priceSnapshot: 1000, name: 'P1', imageUrl: '/p1.png' }]
      }),
      clear: vi.fn(),
    };
    mockDiscountRepo = {
      getByCode: vi.fn(),
      incrementUsage: vi.fn(),
    };
    mockPayment = {
      processPayment: vi.fn(),
    };
    mockAudit = {
      record: vi.fn(),
      recordWithTransaction: vi.fn(),
    };
    
    // Real-ish locker behavior (simple in-memory)
    const locks = new Set<string>();
    mockLocker = {
      acquireLock: vi.fn().mockImplementation(async (id: string) => {
        if (locks.has(id)) return false;
        locks.add(id);
        return true;
      }),
      releaseLock: vi.fn().mockImplementation(async (id: string) => {
        locks.delete(id);
      }),
    };

    orderService = new OrderService(
      mockOrderRepo,
      mockProductRepo,
      mockCartRepo,
      mockDiscountRepo,
      mockPayment,
      mockAudit,
      mockLocker,
      undefined,
      undefined
    );
  });

  it('should prevent concurrent checkouts for the same user via distributed lock', async () => {
    const address = { street: '123 St', city: 'City', state: 'ST', zip: '12345', country: 'US' };

    // Start two checkouts simultaneously
    const p1 = orderService.initiateCheckout('u1', address as any);
    const p2 = orderService.initiateCheckout('u1', address as any);

    const results = await Promise.allSettled([p1, p2]);

    const succeeded = results.filter(r => r.status === 'fulfilled');
    const failed = results.filter(r => r.status === 'rejected') as any[];

    expect(succeeded.length).toBe(1);
    expect(failed.length).toBe(1);
    expect(failed[0].reason).toBeInstanceOf(CheckoutInProgressError);
  });

  it('should handle idempotency correctly when distributed lock is released but request is retried', async () => {
    const address = { street: '123 St', city: 'City', state: 'ST', zip: '12345', country: 'US' };
    const idempotencyKey = 'unique-key-123';

    // First checkout succeeds
    await orderService.initiateCheckout('u1', address as any, 'user@example.com', 'User', undefined, idempotencyKey);
    
    // Mock repo to return the existing order for the same idempotency key
    mockOrderRepo.getByIdempotencyKey.mockResolvedValueOnce({ id: 'o1', status: 'pending' });

    // Release lock manually for the test
    await mockLocker.releaseLock(`checkout_lock:u1`);

    // Second checkout with same idempotency key
    const order2 = await orderService.initiateCheckout('u1', address as any, 'user@example.com', 'User', undefined, idempotencyKey);
    
    expect(order2.id).toBe('o1'); // Should be the same order
    expect(mockOrderRepo.create).toHaveBeenCalledTimes(1); // Should not have called create again if it was truly idempotent at the repo level
    // Note: The mock above is a bit simplified; real hardening is in FirestoreOrderRepository.
  });

  it('allows only one buyer to reserve the last physical item', async () => {
    const address = { street: '123 St', city: 'City', state: 'ST', zip: '12345', country: 'US' };
    let stock = 1;
    mockCartRepo.getByUserId.mockImplementation(async (userId: string) => ({
      userId,
      items: [{ productId: 'p1', quantity: 1, priceSnapshot: 1000, name: 'P1', imageUrl: '/p1.png' }]
    }));
    mockProductRepo.batchUpdateStock.mockImplementation(async (updates: Array<{ delta: number }>) => {
      const nextStock = stock + updates.reduce((sum, update) => sum + update.delta, 0);
      if (nextStock < 0) throw new InsufficientStockError('p1', 1, stock);
      stock = nextStock;
    });

    const results = await Promise.allSettled([
      orderService.initiateCheckout('buyer-1', address as any),
      orderService.initiateCheckout('buyer-2', address as any),
    ]);

    expect(results.filter(result => result.status === 'fulfilled')).toHaveLength(1);
    expect(results.filter(result => result.status === 'rejected')).toHaveLength(1);
    expect(stock).toBe(0);
  });
});
