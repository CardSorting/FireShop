/**
 * [LAYER: CORE]
 * Business logic for Wishlists
 */
import type { IWishlistRepository, IProductRepository } from '@domain/repositories';
import type { Wishlist, Product } from '@domain/models';
import type { AuditService } from './AuditService';

export class WishlistService {
  constructor(
    private wishlistRepo: IWishlistRepository,
    private productRepo: IProductRepository,
    private auditService: AuditService
  ) {}

  async getWishlists(userId: string): Promise<Wishlist[]> {
    const wishlists = await this.wishlistRepo.getByUserId(userId);
    
    // Ensure at least one default wishlist exists
    if (wishlists.length === 0) {
      const defaultWishlist = await this.wishlistRepo.create({
        userId,
        name: 'My Favorites',
        isDefault: true,
        itemIds: [],
      });
      return [defaultWishlist];
    }
    
    return wishlists;
  }

  async getWishlist(id: string): Promise<Wishlist | null> {
    return this.wishlistRepo.getById(id);
  }

  async createWishlist(userId: string, name: string): Promise<Wishlist> {
    const wishlist = await this.wishlistRepo.create({
      userId,
      name,
      isDefault: false,
      itemIds: [],
    });

    await this.auditService.record({
      userId,
      userEmail: 'system', // Should be passed in
      action: 'wishlist_created',
      targetId: wishlist.id,
      details: { name },
    });

    return wishlist;
  }

  async updateWishlist(userId: string, id: string, name: string): Promise<Wishlist> {
    const wishlist = await this.wishlistRepo.update(id, name);
    
    await this.auditService.record({
      userId,
      userEmail: 'system',
      action: 'wishlist_updated',
      targetId: id,
      details: { name },
    });

    return wishlist;
  }

  async deleteWishlist(userId: string, id: string): Promise<void> {
    const wishlist = await this.wishlistRepo.getById(id);
    if (!wishlist || wishlist.isDefault) {
      throw new Error('Cannot delete default wishlist or non-existent wishlist');
    }

    await this.wishlistRepo.delete(id);

    await this.auditService.record({
      userId,
      userEmail: 'system',
      action: 'wishlist_deleted',
      targetId: id,
      details: { name: wishlist.name },
    });
  }

  async addItem(userId: string, wishlistId: string, productId: string): Promise<void> {
    const wishlist = await this.wishlistRepo.getById(wishlistId);
    if (!wishlist || wishlist.userId !== userId) {
      throw new Error('Unauthorized');
    }

    const product = await this.productRepo.getById(productId);
    if (!product) throw new Error('Product not found');

    await this.wishlistRepo.addItem(wishlistId, productId);
  }

  async removeItem(userId: string, wishlistId: string, productId: string): Promise<void> {
    const wishlist = await this.wishlistRepo.getById(wishlistId);
    if (!wishlist || wishlist.userId !== userId) {
      throw new Error('Unauthorized');
    }

    await this.wishlistRepo.removeItem(wishlistId, productId);
  }

  async getItems(wishlistId: string): Promise<Product[]> {
    return this.wishlistRepo.getItems(wishlistId);
  }

  async isProductInWishlist(userId: string, productId: string): Promise<boolean> {
    return this.wishlistRepo.isProductInWishlist(userId, productId);
  }
}
