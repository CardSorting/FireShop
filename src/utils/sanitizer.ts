import { JSDOM } from 'jsdom';
import DOMPurify from 'dompurify';
import type { Order, Product, User } from '@domain/models';

const window = new JSDOM('').window;
const purify = DOMPurify(window as any);

/**
 * Sanitizes HTML to prevent XSS attacks.
 * Allows common formatting tags but strips scripts and event handlers.
 */
export function sanitizeHtml(html: string): string {
  return purify.sanitize(html, {
    ALLOWED_TAGS: [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'p', 'a', 'ul', 'ol',
      'nl', 'li', 'b', 'i', 'strong', 'em', 'strike', 'code', 'hr', 'br', 'div',
      'table', 'thead', 'caption', 'tbody', 'tr', 'th', 'td', 'pre', 'img', 'span'
    ],
    ALLOWED_ATTR: [
      'href', 'name', 'target', 'src', 'alt', 'title', 'class', 'id', 'style'
    ],
    ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel|data):|[^&#/\\?:]*(?:[?/#]|$))/i,
    ADD_TAGS: ['iframe'], // Allow iframes for video embeds if needed, but be careful
    ADD_ATTR: ['allow', 'allowfullscreen', 'frameborder', 'scrolling']
  });
}

export class Sanitizer {
  static product(product: Product): Product {
    const sanitized = { ...product } as any;
    delete sanitized.cost;
    delete sanitized.digitalAssets;
    delete sanitized.reorderPoint;
    delete sanitized.reorderQuantity;
    return sanitized;
  }

  static order(order: Order): Order {
    const sanitized = { ...order } as any;
    delete sanitized.riskScore;
    delete sanitized.paymentTransactionId;
    delete sanitized.idempotencyKey;

    const isPaid = ['confirmed', 'processing', 'shipped', 'delivered', 'ready_for_pickup', 'delivery_started', 'partially_refunded'].includes(order.status);
    sanitized.items = order.items.map((item) => {
      const sanitizedItem = { ...item } as any;
      if (!isPaid) {
        delete sanitizedItem.digitalAssets;
      }
      return sanitizedItem;
    });

    return sanitized;
  }

  static user(user: User): Partial<User> {
    return {
      id: user.id,
      displayName: user.displayName,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt
    };
  }
}
