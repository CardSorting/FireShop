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
    quantity: number
  ): Promise<Cart> {
    const product = await this.productRepo.getById(productId);
    if (!product) throw new ProductNotFoundError(productId);

    const cart = await this.cartRepo.getByUserId(userId);
    const items = cart?.items ?? [];

    const updatedItems = addCartItem(items, product, quantity);

    const updatedCart: Cart = {
      id: userId,
      userId,
      items: updatedItems,
      updatedAt: new Date(),
    };

    await this.cartRepo.save(updatedCart);
    return updatedCart;
  }

  async removeFromCart(userId: string, productId: string): Promise<Cart> {
    const cart = await this.cartRepo.getByUserId(userId);
    const items = cart?.items ?? [];
    const updatedItems = removeCartItem(items, productId);

    const updatedCart: Cart = {
      id: userId,
      userId,
      items: updatedItems,
      updatedAt: new Date(),
    };

    await this.cartRepo.save(updatedCart);
    return updatedCart;
  }

  async updateQuantity(
    userId: string,
    productId: string,
    quantity: number
  ): Promise<Cart> {
    const product = await this.productRepo.getById(productId);
    if (!product) throw new ProductNotFoundError(productId);

    const cart = await this.cartRepo.getByUserId(userId);
    const items = cart?.items ?? [];

    const updatedItems = updateCartItemQuantity(items, productId, quantity, product);

    const updatedCart: Cart = {
      id: userId,
      userId,
      items: updatedItems,
      updatedAt: new Date(),
    };

    await this.cartRepo.save(updatedCart);
    return updatedCart;
  }

  async clearCart(userId: string): Promise<void> {
    await this.cartRepo.clear(userId);
  }

  getCartTotal(items: CartItem[]): number {
    return calculateCartTotal(items);
  }
}