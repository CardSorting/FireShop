/**
 * [LAYER: CORE]
 */
import type { IDiscountRepository, IOrderRepository } from '@domain/repositories';
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
    private audit: AuditService,
    private orderRepo?: IOrderRepository
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

  async validateDiscount(code: string, cartTotal: number, userId?: string, transaction?: any): Promise<DiscountValidationResult> {
    // Production Hardening: Accept an optional transaction parameter so that when
    // called from within a Firestore transaction (e.g., initiateCheckout), the discount
    // lookup participates in the same transaction and prevents TOCTOU races on usage limits.
    const discount = await this.discountRepo.getByCode(code, transaction);
    if (!discount) return { valid: false, message: 'Invalid discount code' };
    
    if (discount.status !== 'active') return { valid: false, message: 'This discount is not active' };
    
    const now = new Date();
    if (now < discount.startsAt) return { valid: false, message: 'This discount has not started yet' };
    if (discount.endsAt && now > discount.endsAt) return { valid: false, message: 'This discount has expired' };

    if (discount.usageLimit !== null && discount.usageCount >= discount.usageLimit) {
      return { valid: false, message: 'This discount has reached its global usage limit' };
    }

    // Production Hardening: Check for per-customer usage limits
    if (discount.oncePerCustomer && userId && this.orderRepo) {
      const hasUsed = transaction 
        ? await this.orderRepo.checkUserDiscountUsage(userId, discount.code, transaction)
        : await this.orderRepo.hasUsedDiscount(userId, discount.code);
        
      if (hasUsed) {
        return { valid: false, message: 'You have already used this discount code.' };
      }
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
