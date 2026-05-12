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

    /**
     * [SECURITY: IDENTITY ASSUMPTION]
     * Identity currently means: Unique User ID (Authenticated).
     * 
     * Fraud/Abuse Considerations:
     * - Guest Checkout: Not currently supported for once-per-customer (fails closed).
     * - Duplicate Accounts: High-risk (Mitigated by email verification requirement).
     * - Future Identity Pins: email, shipping_address, payment_fingerprint.
     */
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

  /**
   * Generates a unique, single-use barter discount code.
   */
  async createBarterDiscount(percentage: number, sessionId: string) {
    const code = `BARTER-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const now = new Date();
    const endsAt = new Date();
    endsAt.setHours(endsAt.getHours() + 24); // Barter deals expire in 24h

    const draft: DiscountDraft = {
      code,
      type: 'percentage',
      value: percentage,
      status: 'active',
      isAutomatic: false,
      selectionType: 'all_products',
      selectedProductIds: [],
      selectedCollectionIds: [],
      minimumRequirementType: 'none',
      minimumAmount: null,
      minimumQuantity: null,
      eligibilityType: 'everyone',
      eligibleCustomerIds: [],
      eligibleCustomerSegments: [],
      usageLimit: 1,
      oncePerCustomer: true,
      combinesWith: {
        orderDiscounts: false,
        productDiscounts: false,
        shippingDiscounts: false
      },
      startsAt: now,
      endsAt: endsAt
    };

    const discount = await this.discountRepo.create(draft);
    await this.audit.record({
      userId: 'system',
      userEmail: 'concierge@dreambees.art',
      action: 'barter_discount_created',
      targetId: discount.id,
      details: { code, sessionId, percentage }
    });

    return discount;
  }
}
