/**
 * [LAYER: PLUMBING]
 */
export function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100);
}

export function formatMoney(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100);
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatShortDate(date: Date | string | null | undefined): string {
  if (!date) return 'N/A';
  
  const d = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(d.getTime())) {
    return 'Invalid Date';
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(d);
}

export function estimateDelivery(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const start = new Date(d);
  start.setDate(start.getDate() + 3);
  const end = new Date(d);
  end.setDate(end.getDate() + 5);
  const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  return `${start.toLocaleDateString(undefined, options)}–${end.toLocaleDateString(undefined, options)}`;
}

export function humanizeOrderStatus(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export function formatOrderNumber(orderId: string): string {
  return `#${orderId.toUpperCase().slice(0, 12)}`;
}

export function orderStatusSubtitle(status: string): string {
  if (status === 'pending') return 'We received your order and are reviewing payment.';
  if (status === 'confirmed') return 'Payment confirmed. Your order is being packed.';
  if (status === 'shipped') return 'Your package is in transit with the carrier.';
  if (status === 'delivered') return 'Package delivered. Thanks for shopping with us!';
  return 'This order was cancelled. Refund timing depends on your bank.';
}

export function humanizeCategory(category: string): string {
  return category.charAt(0).toUpperCase() + category.slice(1);
}

export function normalizeSearch(value: string): string {
  return value.trim().toLowerCase();
}

export function formatRelativeTime(date: Date | string | null | undefined): string {
  if (!date) return 'N/A';
  const d = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(d.getTime())) {
    return 'Invalid Date';
  }

  const now = Date.now();
  const diffMs = now - d.getTime();
  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return formatShortDate(d);
}