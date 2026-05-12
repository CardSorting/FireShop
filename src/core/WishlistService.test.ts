import { beforeEach, describe, expect, it, vi } from 'vitest';
import { WishlistService } from './WishlistService';

describe('WishlistService authorization', () => {
  let wishlistRepo: any;
  let service: WishlistService;

  beforeEach(() => {
    wishlistRepo = {
      getById: vi.fn(),
      delete: vi.fn(),
    };
    service = new WishlistService(
      wishlistRepo,
      { getById: vi.fn() } as any,
      { record: vi.fn() } as any
    );
  });

  it('does not delete another user’s wishlist', async () => {
    wishlistRepo.getById.mockResolvedValue({
      id: 'w1',
      userId: 'owner-user',
      name: 'Owner list',
      isDefault: false,
      itemIds: [],
    });

    await expect(service.deleteWishlist('attacker-user', 'attacker@example.com', 'w1')).rejects.toThrow();
    expect(wishlistRepo.delete).not.toHaveBeenCalled();
  });
});
