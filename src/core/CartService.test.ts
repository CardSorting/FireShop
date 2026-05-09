import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CartService } from './CartService';
import { ProductNotFoundError } from '@domain/errors';

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

describe('CartService', () => {
  let cartService: CartService;
  let mockCartRepo: any;
  let mockProductRepo: any;

  beforeEach(() => {
    mockCartRepo = {
      getByUserId: vi.fn(),
      save: vi.fn(),
      clear: vi.fn(),
    };
    mockProductRepo = {
      getById: vi.fn(),
    };
    cartService = new CartService(mockCartRepo, mockProductRepo);
  });

  describe('addToCart', () => {
    it('should add an item to an empty cart', async () => {
      const mockProduct = { id: 'p1', name: 'Product 1', price: 1000, stock: 10 };
      mockProductRepo.getById.mockResolvedValue(mockProduct);
      mockCartRepo.getByUserId.mockResolvedValue(null); // Empty cart

      const cart = await cartService.addToCart('u1', 'p1', 2);

      expect(cart.items).toHaveLength(1);
      expect(cart.items[0].productId).toBe('p1');
      expect(cart.items[0].quantity).toBe(2);
      expect(mockCartRepo.save).toHaveBeenCalled();
    });

    it('should increment quantity if item already in cart', async () => {
      const mockProduct = { id: 'p1', name: 'Product 1', price: 1000, stock: 10 };
      mockProductRepo.getById.mockResolvedValue(mockProduct);
      mockCartRepo.getByUserId.mockResolvedValue({
        userId: 'u1',
        items: [{ productId: 'p1', quantity: 1, name: 'Product 1', priceSnapshot: 1000, imageUrl: '' }]
      });

      const cart = await cartService.addToCart('u1', 'p1', 2);

      expect(cart.items).toHaveLength(1);
      expect(cart.items[0].quantity).toBe(3);
    });

    it('should throw error if product not found', async () => {
      mockProductRepo.getById.mockResolvedValue(null);
      await expect(cartService.addToCart('u1', 'p1', 1)).rejects.toThrow(ProductNotFoundError);
    });
  });

  describe('removeFromCart', () => {
    it('should remove an item from the cart', async () => {
      mockCartRepo.getByUserId.mockResolvedValue({
        userId: 'u1',
        items: [{ productId: 'p1', quantity: 1, name: 'Product 1', priceSnapshot: 1000, imageUrl: '' }]
      });

      const cart = await cartService.removeFromCart('u1', 'p1');

      expect(cart.items).toHaveLength(0);
      expect(mockCartRepo.save).toHaveBeenCalled();
    });
  });

  describe('clearCart', () => {
    it('should call clear on repo', async () => {
      await cartService.clearCart('u1');
      expect(mockCartRepo.clear).toHaveBeenCalledWith('u1');
    });
  });
});
