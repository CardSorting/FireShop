/**
 * [LAYER: PLUMBING]
 */
import type { Address } from '@domain/models';

export interface ValidationResult {
  valid: boolean;
  message?: string;
}

export function validateEmail(email: string): ValidationResult {
  const trimmed = email.trim();
  if (!trimmed) return { valid: false, message: 'Email is required' };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return { valid: false, message: 'Enter a valid email address' };
  }
  return { valid: true };
}

export function validatePassword(password: string): ValidationResult {
  if (password.length < 8) return { valid: false, message: 'Password must be at least 8 characters' };
  if (!/[A-Z]/.test(password)) return { valid: false, message: 'Password must include an uppercase letter' };
  if (!/[a-z]/.test(password)) return { valid: false, message: 'Password must include a lowercase letter' };
  if (!/\d/.test(password)) return { valid: false, message: 'Password must include a number' };
  return { valid: true };
}

export function validateDisplayName(displayName: string): ValidationResult {
  const trimmed = displayName.trim();
  if (trimmed.length < 2) return { valid: false, message: 'Display name must be at least 2 characters' };
  if (trimmed.length > 50) return { valid: false, message: 'Display name must be 50 characters or fewer' };
  return { valid: true };
}

export function validateAddress(address: Address): ValidationResult {
  for (const field of ['street', 'city', 'state', 'zip', 'country'] as const) {
    if (!address[field]?.trim()) return { valid: false, message: `${field} is required` };
  }
  if (address.country.trim().length !== 2) return { valid: false, message: 'Country must be a two-letter code' };
  return { valid: true };
}

export function validatePriceCents(price: number): ValidationResult {
  if (!Number.isInteger(price) || price < 0) return { valid: false, message: 'Price must be a non-negative whole number of cents' };
  if (price > 1_000_000) return { valid: false, message: 'Price exceeds allowed maximum' };
  return { valid: true };
}

export function validateStock(stock: number): ValidationResult {
  if (!Number.isInteger(stock) || stock < 0) return { valid: false, message: 'Stock must be a non-negative whole number' };
  if (stock > 100_000) return { valid: false, message: 'Stock exceeds allowed maximum' };
  return { valid: true };
}