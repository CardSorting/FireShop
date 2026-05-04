import { Product, Order, User, ProductManagementProduct } from '@domain/models';

/**
 * [LAYER: UTILS]
 * Production Data Sanitization Engine.
 * Ensures internal merchant data never leaks to public endpoints.
 */

export const Sanitizer = {
  /**
   * Removes sensitive internal fields from a product for public display.
   */
  product(product: Product): Product {
    const sanitized = { ...product } as any;
    delete sanitized.cost;
    // Hide digital assets in list view
    if (sanitized.digitalAssets) {
      delete sanitized.digitalAssets;
    }
    // Remove reorder info
    delete sanitized.reorderPoint;
    delete sanitized.reorderQuantity;
    return sanitized;
  },

  /**
   * Sanitizes an order for the customer view.
   * Prevents leakage of internal risk metrics and sensitive IDs.
   */
  order(order: Order): Order {
    const sanitized = { ...order } as any;
    delete sanitized.riskScore;
    delete sanitized.paymentTransactionId;
    delete sanitized.idempotencyKey;
    
    // Hide digital assets if not paid yet (confirmed or beyond)
    const isPaid = ['confirmed', 'shipped', 'delivered'].includes(order.status);
    sanitized.items = order.items.map(item => {
      const sanitizedItem = { ...item } as any;
      if (!isPaid) {
        delete sanitizedItem.digitalAssets;
      }
      return sanitizedItem;
    });

    return sanitized;
  },

  /**
   * Sanitizes a user object for public display.
   */
  user(user: User): Partial<User> {
    return {
      id: user.id,
      displayName: user.displayName,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt
    };
  }
};
