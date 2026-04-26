/**
 * [LAYER: DOMAIN]
 */
export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DomainError';
  }
}

export class ProductNotFoundError extends DomainError {
  constructor(productId: string) {
    super(`Product not found: ${productId}`);
    this.name = 'ProductNotFoundError';
  }
}

export class InvalidProductError extends DomainError {
  constructor(message: string = 'Product data is incomplete or invalid') {
    super(message);
    this.name = 'InvalidProductError';
  }
}

export class InsufficientStockError extends DomainError {
  constructor(productId: string, requested: number, available: number) {
    super(
      `Insufficient stock for ${productId}: requested ${requested}, available ${available}`
    );
    this.name = 'InsufficientStockError';
  }
}

export class CartEmptyError extends DomainError {
  constructor() {
    super('Cart is empty');
    this.name = 'CartEmptyError';
  }
}

export class AuthError extends DomainError {
  constructor(message: string = 'Authentication required') {
    super(message);
    this.name = 'AuthError';
  }
}

export class UnauthorizedError extends DomainError {
  constructor(message: string = 'Admin access required') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export class CheckoutInProgressError extends DomainError {
  constructor() {
    super('Checkout is already in progress. Please wait and try again.');
    this.name = 'CheckoutInProgressError';
  }
}

export class PaymentFailedError extends DomainError {
  constructor(message: string = 'Payment processing failed. Your cart stock has been restored.') {
    super(message);
    this.name = 'PaymentFailedError';
  }
}

export class CheckoutReconciliationError extends DomainError {
  constructor(message: string = 'Payment succeeded, but checkout could not be fully finalized. Please contact support before retrying.') {
    super(message);
    this.name = 'CheckoutReconciliationError';
  }
}

export class InvalidAddressError extends DomainError {
  constructor(message: string = 'Shipping address is incomplete or invalid') {
    super(message);
    this.name = 'InvalidAddressError';
  }
}

export class InvalidOrderError extends DomainError {
  constructor(message: string = 'Order data is incomplete or invalid') {
    super(message);
    this.name = 'InvalidOrderError';
  }
}