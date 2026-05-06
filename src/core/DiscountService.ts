/**
 * [LAYER: CORE]
 */
import type { IDiscountRepository } from '@domain/repositories';
import type { Discount, DiscountDraft, DiscountUpdate } from '@domain/models';
import { AuditService } from './AuditService';
import { formatCurrency } from '@utils/formatters';

export interface DiscountValidationResult {
  valid: boolean;
  message?: string;
  discount?: Discount;
  discountAmount?: number;
  isFreeShipping?: boolean;
}

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

  async validateDiscount(code: string, cartTotal: number, userId?: string): Promise<DiscountValidationResult> {
    const discount = await this.discountRepo.getByCode(code);
    if (!discount) return { valid: false, message: 'Invalid discount code' };
    
    if (discount.status !== 'active') return { valid: false, message: 'This discount is not active' };
    
    const now = new Date();
    if (now < discount.startsAt) return { valid: false, message: 'This discount has not started yet' };
    if (discount.endsAt && now > discount.endsAt) return { valid: false, message: 'This discount has expired' };

    if (discount.usageLimit !== null && discount.usageCount >= discount.usageLimit) {
      return { valid: false, message: 'This discount has reached its global usage limit' };
    }

    // Production Hardening: Check for per-customer usage limits
    if (discount.oncePerCustomer && userId) {
      // Note: This would typically require a search in the OrderRepository for existing orders with this code
      // For now we check the status in the repo if we had a usage map, but we'll assume the repo can handle a check
      // For this pass, we'll mark a placeholder for the repo check but keep the logic in the service
    }

    if (discount.minimumRequirementType === 'minimum_amount' && discount.minimumAmount !== null) {
      if (cartTotal < discount.minimumAmount) {
        return { 
          valid: false, 
          message: `This discount requires a minimum purchase of ${formatCurrency(discount.minimumAmount)}` 
        };
      }
    }

    let discountAmount = 0;
    let isFreeShipping = false;

    if (discount.type === 'percentage') {
      discountAmount = Math.round(cartTotal * (discount.value / 100));
    } else if (discount.type === 'fixed') {
      discountAmount = discount.value;
    } else if (discount.type === 'free_shipping') {
      isFreeShipping = true;
      discountAmount = 0; // Calculated by OrderService based on actual shipping cost
    }

    return {
      valid: true,
      discount,
      discountAmount: Math.min(discountAmount, cartTotal),
      isFreeShipping
    };
  }
}
