/**
 * [LAYER: CORE]
 * 
 * Taxonomy Service - Manages Product Categories and Types
 */
import type { ProductCategory, ProductType } from '@domain/models';
import type { ITaxonomyRepository } from '@domain/repositories';
import type { AuditService } from './AuditService';

export class TaxonomyService {
  constructor(
    private repository: ITaxonomyRepository,
    private auditService: AuditService
  ) {}

  // ─────────────────────────────────────────────
  // Categories
  // ─────────────────────────────────────────────

  async getAllCategories(): Promise<ProductCategory[]> {
    return this.repository.getAllCategories();
  }

  async getCategoryById(id: string): Promise<ProductCategory | null> {
    return this.repository.getCategoryById(id);
  }

  async getCategoryBySlug(slug: string): Promise<ProductCategory | null> {
    return this.repository.getCategoryBySlug(slug);
  }

  async saveCategory(category: Partial<ProductCategory>, actor: { id: string; email: string }): Promise<ProductCategory> {
    const isNew = !category.id;
    const id = category.id || crypto.randomUUID();
    
    const data: ProductCategory = {
      id,
      name: category.name || '',
      slug: category.slug || (category.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      description: category.description ?? null,
      createdAt: category.createdAt || new Date(),
      updatedAt: new Date(),
    };

    const saved = await this.repository.saveCategory(data);

    await this.auditService.record({
      userId: actor.id,
      userEmail: actor.email,
      action: isNew ? 'category_created' : 'category_updated',
      targetId: saved.id,
      details: { name: saved.name, slug: saved.slug },
    });

    return saved;
  }

  async deleteCategory(id: string, actor: { id: string; email: string }): Promise<void> {
    const category = await this.repository.getCategoryById(id);
    if (!category) return;

    await this.repository.deleteCategory(id);

    await this.auditService.record({
      userId: actor.id,
      userEmail: actor.email,
      action: 'category_deleted',
      targetId: id,
      details: { name: category.name },
    });
  }

  // ─────────────────────────────────────────────
  // Types
  // ─────────────────────────────────────────────

  async getAllTypes(): Promise<ProductType[]> {
    return this.repository.getAllTypes();
  }

  async getTypeById(id: string): Promise<ProductType | null> {
    return this.repository.getTypeById(id);
  }

  async saveType(type: Partial<ProductType>, actor: { id: string; email: string }): Promise<ProductType> {
    const isNew = !type.id;
    const id = type.id || crypto.randomUUID();

    const data: ProductType = {
      id,
      name: type.name || '',
      createdAt: type.createdAt || new Date(),
      updatedAt: new Date(),
    };

    const saved = await this.repository.saveType(data);

    await this.auditService.record({
      userId: actor.id,
      userEmail: actor.email,
      action: isNew ? 'product_type_created' : 'product_type_updated',
      targetId: saved.id,
      details: { name: saved.name },
    });

    return saved;
  }

  async deleteType(id: string, actor: { id: string; email: string }): Promise<void> {
    const type = await this.repository.getTypeById(id);
    if (!type) return;

    await this.repository.deleteType(id);

    await this.auditService.record({
      userId: actor.id,
      userEmail: actor.email,
      action: 'product_type_deleted',
      targetId: id,
      details: { name: type.name },
    });
  }
}
