/**
 * [LAYER: CORE]
 */
import type { IDiscountRepository } from '@domain/repositories';
import type { DiscountDraft, DiscountUpdate } from '@domain/models';
import { AuditService } from './AuditService';

export class DiscountService {
  constructor(
    private discountRepo: IDiscountRepository,
    private audit: AuditService
  ) {}

  async getAllDiscounts() {
    return this.discountRepo.getAll();
  }

  async createDiscount(data: DiscountDraft, actor: { id: string, email: string }) {
    const discount = await this.discountRepo.create(data);
    await this.audit.record({
      userId: actor.id,
      userEmail: actor.email,
      action: 'discount_created',
      targetId: discount.id,
      details: { code: data.code }
    });
    return discount;
  }

  async deleteDiscount(id: string, actor: { id: string, email: string }) {
    await this.discountRepo.delete(id);
    await this.audit.record({
      userId: actor.id,
      userEmail: actor.email,
      action: 'discount_deleted',
      targetId: id
    });
  }

  async updateDiscount(id: string, updates: DiscountUpdate, actor: { id: string, email: string }) {
    const discount = await this.discountRepo.update(id, updates);
    await this.audit.record({
      userId: actor.id,
      userEmail: actor.email,
      action: 'discount_updated',
      targetId: id,
      details: updates
    });
    return discount;
  }

  async validateDiscount(code: string, cartTotal: number) {
    const discount = await this.discountRepo.getByCode(code);
    if (!discount) return { valid: false, message: 'Invalid discount code' };
    
    if (discount.status !== 'active') return { valid: false, message: 'This discount is not active' };
    
    const now = new Date();
    if (now < discount.startsAt) return { valid: false, message: 'This discount has not started yet' };
    if (discount.endsAt && now > discount.endsAt) return { valid: false, message: 'This discount has expired' };

    let discountAmount = 0;
    if (discount.type === 'percentage') {
      discountAmount = Math.round(cartTotal * (discount.value / 100));
    } else {
      discountAmount = discount.value;
    }

    return {
      valid: true,
      discount,
      discountAmount: Math.min(discountAmount, cartTotal)
    };
  }
}
