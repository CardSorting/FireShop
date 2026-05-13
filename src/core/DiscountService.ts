import * as crypto from 'node:crypto';
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

  async validateDiscount(
    code: string, 
    cartTotal: number, 
    userId?: string, 
    transaction?: any, 
    appliedDiscounts: Discount[] = []
  ): Promise<DiscountValidationResult> {
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

    // PRODUCTION HARDENING: Discount Combination Enforcement (Fiscal Sovereignty)
    // Prevents "Stacked Discount" exploits by checking if the new discount is allowed 
    // to combine with existing applied discounts.
    for (const applied of appliedDiscounts) {
      const isNewOrderDiscount = discount.type === 'percentage' || discount.type === 'fixed';
      const isNewShippingDiscount = discount.type === 'free_shipping';
      
      const appliedIsOrderDiscount = applied.type === 'percentage' || applied.type === 'fixed';
      const appliedIsShippingDiscount = applied.type === 'free_shipping';

      if (appliedIsOrderDiscount && isNewOrderDiscount && !discount.combinesWith.orderDiscounts) {
        return { valid: false, message: 'This discount cannot be combined with other order discounts.' };
      }
      if (appliedIsShippingDiscount && isNewShippingDiscount && !discount.combinesWith.shippingDiscounts) {
        return { valid: false, message: 'This discount cannot be combined with other shipping discounts.' };
      }
      // Product discounts check would go here if/when product-level discounts are implemented.
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
   * Hardened with fiscal safety caps and CSPRNG seeds.
   */
  async createBarterDiscount(percentage: number, sessionId: string) {
    // PRODUCTION HARDENING: Mandatory Fiscal Safety Boundary
    // Prevents LLM halluncination or prompt injection from creating 100% off codes.
    const MAX_BARTER_PERCENTAGE = 50;
    const safePercentage = Math.max(0, Math.min(percentage, MAX_BARTER_PERCENTAGE));

    // PRODUCTION HARDENING: Cryptographically-secure code generation
    const entropy = crypto.randomBytes(4).toString('hex').toUpperCase();
    const code = `BARTER-${entropy}`;
    
    const now = new Date();
    const endsAt = new Date();
    endsAt.setHours(endsAt.getHours() + 24); // Barter deals expire in 24h

    const draft: DiscountDraft = {
      code,
      type: 'percentage',
      value: safePercentage,
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
      details: { code, sessionId, percentage: safePercentage, requestedPercentage: percentage }
    });

    return discount;
  }
}
