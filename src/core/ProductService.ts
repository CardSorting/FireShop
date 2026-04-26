/**
 * [LAYER: CORE]
 */
import type { IProductRepository } from '@domain/repositories';
import type { InventoryOverview, Product, ProductDraft, ProductUpdate } from '@domain/models';
import { ProductNotFoundError } from '@domain/errors';
import { assertValidProductDraft, assertValidProductUpdate, classifyInventoryHealth } from '@domain/rules';

export class ProductService {
  constructor(private repo: IProductRepository) {}

  async getProducts(options?: {
    category?: string;
    limit?: number;
    cursor?: string;
  }): Promise<{ products: Product[]; nextCursor?: string }> {
    return this.repo.getAll(options);
  }

  async getInventoryOverview(): Promise<InventoryOverview> {
    const { products } = await this.repo.getAll({ limit: 100 });
    const healthCounts: InventoryOverview['healthCounts'] = {
      out_of_stock: 0,
      low_stock: 0,
      healthy: 0,
    };
    const enrichedProducts = products.map((product) => {
      const inventoryHealth = classifyInventoryHealth(product.stock);
      healthCounts[inventoryHealth] += 1;
      return { ...product, inventoryHealth };
    });

    return {
      totalProducts: products.length,
      totalUnits: products.reduce((sum, product) => sum + product.stock, 0),
      inventoryValue: products.reduce((sum, product) => sum + product.stock * product.price, 0),
      healthCounts,
      products: enrichedProducts.sort((a, b) => {
        const rank = { out_of_stock: 0, low_stock: 1, healthy: 2 } as const;
        return rank[a.inventoryHealth] - rank[b.inventoryHealth] || a.stock - b.stock || a.name.localeCompare(b.name);
      }),
    };
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

  async batchUpdateProducts(updates: { id: string; updates: ProductUpdate }[]): Promise<Product[]> {
    updates.forEach(({ updates: u }) => assertValidProductUpdate(u));
    if (this.repo.batchUpdate) {
      return this.repo.batchUpdate(updates);
    }
    return Promise.all(updates.map(({ id, updates: u }) => this.repo.update(id, u)));
  }

  async batchDeleteProducts(ids: string[]): Promise<void> {
    if (this.repo.batchDelete) {
      return this.repo.batchDelete(ids);
    }
    await Promise.all(ids.map((id) => this.repo.delete(id)));
  }
}
