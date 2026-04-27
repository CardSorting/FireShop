/**
 * [LAYER: CORE]
 */
import type { IProductRepository } from '@domain/repositories';
import type { InventoryOverview, Product, ProductDraft, ProductUpdate } from '@domain/models';
import { AuditService } from './AuditService';
import { ProductNotFoundError } from '@domain/errors';
import { assertValidProductDraft, assertValidProductUpdate, classifyInventoryHealth } from '@domain/rules';

export class ProductService {
  constructor(
    private repo: IProductRepository,
    private audit: AuditService
  ) {}

  async getProducts(options?: {
    category?: string;
    query?: string;
    limit?: number;
    cursor?: string;
  }): Promise<{ products: Product[]; nextCursor?: string }> {
    return this.repo.getAll(options);
  }

  async getInventoryOverview(): Promise<InventoryOverview> {
    const stats = await this.repo.getStats();
    
    // For the list of products in the overview, we still limit to 100 for performance
    const { products } = await this.repo.getAll({ limit: 100 });
    
    const enrichedProducts = products.map((product) => {
      const inventoryHealth = classifyInventoryHealth(product.stock);
      return { ...product, inventoryHealth };
    });

    return {
      totalProducts: stats.totalProducts,
      totalUnits: stats.totalUnits,
      inventoryValue: stats.inventoryValue,
      healthCounts: stats.healthCounts,
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

  async createProduct(data: ProductDraft, actor: { id: string, email: string }): Promise<Product> {
    assertValidProductDraft(data);
    const product = await this.repo.create(data);
    await this.audit.record({
      userId: actor.id,
      userEmail: actor.email,
      action: 'product_created',
      targetId: product.id,
      details: { name: product.name }
    });
    return product;
  }

  async updateProduct(id: string, updates: ProductUpdate, actor: { id: string, email: string }): Promise<Product> {
    assertValidProductUpdate(updates);
    const product = await this.repo.update(id, updates);
    await this.audit.record({
      userId: actor.id,
      userEmail: actor.email,
      action: 'product_updated',
      targetId: id,
      details: updates
    });
    return product;
  }

  async deleteProduct(id: string, actor: { id: string, email: string }): Promise<void> {
    await this.repo.delete(id);
    await this.audit.record({
      userId: actor.id,
      userEmail: actor.email,
      action: 'product_deleted',
      targetId: id
    });
  }

  async batchUpdateProducts(updates: { id: string; updates: ProductUpdate }[], actor: { id: string, email: string }): Promise<Product[]> {
    updates.forEach(({ updates: u }) => assertValidProductUpdate(u));
    
    let products: Product[];
    if (this.repo.batchUpdate) {
      products = await this.repo.batchUpdate(updates);
    } else {
      products = await Promise.all(updates.map(({ id, updates: u }) => this.repo.update(id, u)));
    }

    await this.audit.record({
      userId: actor.id,
      userEmail: actor.email,
      action: 'product_batch_updated',
      targetId: 'multiple',
      details: { count: updates.length, ids: updates.map(u => u.id) }
    });

    return products;
  }

  async batchDeleteProducts(ids: string[], actor: { id: string, email: string }): Promise<void> {
    if (this.repo.batchDelete) {
      await this.repo.batchDelete(ids);
    } else {
      await Promise.all(ids.map((id) => this.repo.delete(id)));
    }

    await this.audit.record({
      userId: actor.id,
      userEmail: actor.email,
      action: 'product_batch_deleted',
      targetId: 'multiple',
      details: { count: ids.length, ids }
    });
  }
}
