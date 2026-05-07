/**
 * [LAYER: CORE]
 */
import type { ICartRepository, IProductRepository } from '@domain/repositories';
import type { Cart, CartItem } from '@domain/models';
import {
  addCartItem,
  removeCartItem,
  updateCartItemQuantity,
  calculateCartTotal,
} from '@domain/rules';
import { ProductNotFoundError } from '@domain/errors';
import { runTransaction, getUnifiedDb } from '@infrastructure/firebase/bridge';

export class CartService {
  constructor(
    private cartRepo: ICartRepository,
    private productRepo: IProductRepository
  ) {}

  async getCart(userId: string): Promise<Cart | null> {
    return this.cartRepo.getByUserId(userId);
  }

  async addToCart(
    userId: string,
    productId: string,
    quantity: number,
    variantId?: string
  ): Promise<Cart> {
    const product = await this.productRepo.getById(productId);
    if (!product) throw new ProductNotFoundError(productId);

    return await runTransaction(getUnifiedDb(), async (transaction: any) => {
      const cart = await this.cartRepo.getByUserId(userId, transaction);
      const items = cart?.items ?? [];

      const updatedItems = addCartItem(items, product, quantity, variantId);

      const updatedCart: Cart = {
        id: userId,
        userId,
        items: updatedItems,
        updatedAt: new Date(),
      };

      await this.cartRepo.save(updatedCart, transaction);
      return updatedCart;
    });
  }

  async removeFromCart(userId: string, productId: string, variantId?: string): Promise<Cart> {
    return await runTransaction(getUnifiedDb(), async (transaction: any) => {
      const cart = await this.cartRepo.getByUserId(userId, transaction);
      const items = cart?.items ?? [];
      const updatedItems = removeCartItem(items, productId, variantId);

      const updatedCart: Cart = {
        id: userId,
        userId,
        items: updatedItems,
        updatedAt: new Date(),
      };

      await this.cartRepo.save(updatedCart, transaction);
      return updatedCart;
    });
  }

  async updateQuantity(
    userId: string,
    productId: string,
    quantity: number,
    variantId?: string
  ): Promise<Cart> {
    const product = await this.productRepo.getById(productId);
    if (!product) throw new ProductNotFoundError(productId);

    return await runTransaction(getUnifiedDb(), async (transaction: any) => {
      const cart = await this.cartRepo.getByUserId(userId, transaction);
      const items = cart?.items ?? [];

      const updatedItems = updateCartItemQuantity(items, productId, quantity, product, variantId);

      const updatedCart: Cart = {
        id: userId,
        userId,
        items: updatedItems,
        updatedAt: new Date(),
      };

      await this.cartRepo.save(updatedCart, transaction);
      return updatedCart;
    });
  }

  async clearCart(userId: string): Promise<void> {
    await this.cartRepo.clear(userId);
  }

  getCartTotal(items: CartItem[]): number {
    return calculateCartTotal(items);
  }
}