import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OrderService } from './OrderService';
import { CartEmptyError, OrderNotFoundError } from '@domain/errors';

// Mock the bridge
vi.mock('@infrastructure/firebase/bridge', () => ({
  runTransaction: vi.fn((db, fn) => fn({
    get: vi.fn(),
    set: vi.fn(),
    update: vi.fn(),
    delete: vi.fn()
  })),
  getUnifiedDb: vi.fn(() => ({})),
}));

describe('OrderService', () => {
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
      create: vi.fn(),
      save: vi.fn(),
      getById: vi.fn(),
      getByPaymentTransactionId: vi.fn(),
      updateStatus: vi.fn(),
      updateRiskScore: vi.fn(),
    };
    mockProductRepo = {
      batchUpdateStock: vi.fn(),
    };
    mockCartRepo = {
      getByUserId: vi.fn(),
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
    mockLocker = {
      acquireLock: vi.fn().mockResolvedValue(true),
      releaseLock: vi.fn(),
    };

    orderService = new OrderService(
      mockOrderRepo,
      mockProductRepo,
      mockCartRepo,
      mockDiscountRepo,
      mockPayment,
      mockAudit,
      mockLocker
    );
  });

  describe('initiateCheckout', () => {
    const address = { street: '123 St', city: 'City', state: 'ST', zip: '12345', country: 'US' };

    it('should create an order from a cart', async () => {
      mockCartRepo.getByUserId.mockResolvedValue({
        userId: 'u1',
        items: [{ productId: 'p1', quantity: 1, priceSnapshot: 1000, name: 'P1' }]
      });

      mockOrderRepo.create.mockResolvedValue({
        id: 'o1',
        userId: 'u1',
        total: 1000,
        status: 'pending'
      });

      const order = await orderService.initiateCheckout('u1', address as any);

      expect(order.userId).toBe('u1');
      expect(order.total).toBeGreaterThan(0);
      expect(mockOrderRepo.create).toHaveBeenCalled();
      expect(mockCartRepo.clear).toHaveBeenCalledWith('u1');
    });

    it('should throw if cart is empty', async () => {
      mockCartRepo.getByUserId.mockResolvedValue(null);
      await expect(orderService.initiateCheckout('u1', address as any)).rejects.toThrow(CartEmptyError);
    });
  });

  describe('finalizeOrderPayment', () => {
    it('should update status and deduct stock', async () => {
      const mockOrder = {
        id: 'o1',
        userId: 'u1',
        status: 'pending',
        fulfillmentMethod: 'shipping',
        items: [{ productId: 'p1', quantity: 2 }]
      };
      mockOrderRepo.getByPaymentTransactionId.mockResolvedValue(mockOrder);

      const result = await orderService.finalizeOrderPayment('pi_123', { charges: { data: [{ outcome: { risk_score: 10 } }] } });

      expect(result.status).toBe('processing');
      expect(mockProductRepo.batchUpdateStock).toHaveBeenCalled();
      expect(mockOrderRepo.updateStatus).toHaveBeenCalledWith('o1', 'processing', expect.anything());
    });

    it('should return existing order if already finalized', async () => {
      const mockOrder = { id: 'o1', status: 'confirmed' };
      mockOrderRepo.getByPaymentTransactionId.mockResolvedValue(mockOrder);

      const result = await orderService.finalizeOrderPayment('pi_123');
      expect(result.status).toBe('confirmed');
      expect(mockOrderRepo.updateStatus).not.toHaveBeenCalled();
    });
  });

  describe('autoAssignShippingMethod', () => {
    it('should assign USPS for light packages', async () => {
      mockOrderRepo.getById.mockResolvedValue({
        items: [{ quantity: 1 }], // 0.5 lbs
        total: 1000
      });

      const result = await orderService.autoAssignShippingMethod('o1');
      expect(result.carrier).toBe('USPS');
    });

    it('should assign UPS for heavy packages', async () => {
      mockOrderRepo.getById.mockResolvedValue({
        items: [{ quantity: 30 }], // 15 lbs
        total: 1000
      });

      const result = await orderService.autoAssignShippingMethod('o1');
      expect(result.carrier).toBe('UPS');
    });
  });
});
