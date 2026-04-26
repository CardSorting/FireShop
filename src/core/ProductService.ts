/**
 * [LAYER: CORE]
 */
import type { IProductRepository } from '@domain/repositories';
import type { Product, ProductDraft, ProductUpdate } from '@domain/models';
import { ProductNotFoundError } from '@domain/errors';
import { assertValidProductDraft, assertValidProductUpdate } from '@domain/rules';

export class ProductService {
  constructor(private repo: IProductRepository) {}

  async getProducts(options?: {
    category?: string;
    limit?: number;
    cursor?: string;
  }): Promise<{ products: Product[]; nextCursor?: string }> {
    return this.repo.getAll(options);
  }

  async getProduct(id: string): Promise<Product> {
    const product = await this.repo.getById(id);
    if (!product) throw new ProductNotFoundError(id);
    return product;
  }

  async createProduct(data: ProductDraft): Promise<Product> {
    assertValidProductDraft(data);
    return this.repo.create(data);
  }

  async updateProduct(id: string, updates: ProductUpdate): Promise<Product> {
    assertValidProductUpdate(updates);
    return this.repo.update(id, updates);
  }

  async deleteProduct(id: string): Promise<void> {
    return this.repo.delete(id);
  }
}