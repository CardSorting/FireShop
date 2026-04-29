/**
 * [LAYER: UI]
 * Shared merchant-console navigation taxonomy.
 *
 * Keeps Shopify/Stripe-style labels, aliases, and primary actions in one place so
 * the sidebar, command palette, and route coverage stay aligned for non-technical users.
 */
import {
  BarChart3,
  Boxes,
  ClipboardList,
  ExternalLink,
  LayoutDashboard,
  Megaphone,
  Package,
  Plus,
  Settings,
  Shield,
  User,
  type LucideIcon,
} from 'lucide-react';

export interface AdminNavItem {
  id: string;
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
  aliases: string[];
  badge?: 'orders';
}

export interface AdminNavGroup {
  id: string;
  label?: string;
  items: AdminNavItem[];
}

export interface AdminQuickAction {
  id: string;
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
  aliases: string[];
  group: 'Create' | 'Storefront';
}

export const ADMIN_NAV_GROUPS: AdminNavGroup[] = [
  {
    id: 'home',
    items: [
      {
        id: 'home',
        href: '/admin',
        label: 'Home',
        description: 'Today’s priorities, sales, and setup progress',
        icon: LayoutDashboard,
        aliases: ['dashboard', 'overview', 'start', 'today'],
      },
    ],
  },
  {
    id: 'sales',
    label: 'Sales',
    items: [
      {
        id: 'orders',
        href: '/admin/orders',
        label: 'Orders',
        description: 'Review, fulfill, ship, and refund orders',
        icon: ClipboardList,
        aliases: ['sales', 'fulfillment', 'shipping', 'purchases', 'transactions'],
        badge: 'orders',
      },
      {
        id: 'customers',
        href: '/admin/customers',
        label: 'Customers',
        description: 'Customer profiles, purchase history, and support context',
        icon: User,
        aliases: ['buyers', 'accounts', 'people', 'users', 'support'],
      },
    ],
  },
  {
    id: 'catalog',
    label: 'Catalog',
    items: [
      {
        id: 'products',
        href: '/admin/products',
        label: 'Products',
        description: 'Listings, prices, photos, categories, and variants',
        icon: Package,
        aliases: ['catalog', 'items', 'listings', 'cards', 'merchandise'],
      },
      {
        id: 'inventory',
        href: '/admin/inventory',
        label: 'Inventory',
        description: 'Stock levels, restocks, and transfer readiness',
        icon: Boxes,
        aliases: ['stock', 'quantity', 'warehouse', 'restock', 'availability'],
      },
    ],
  },
  {
    id: 'marketing',
    label: 'Marketing',
    items: [
      {
        id: 'discounts',
        href: '/admin/discounts',
        label: 'Discounts',
        description: 'Coupons, promotions, and campaign offers',
        icon: Megaphone,
        aliases: ['coupons', 'promo codes', 'promotions', 'offers', 'campaigns'],
      },
    ],
  },
  {
    id: 'insights',
    label: 'Insights',
    items: [
      {
        id: 'analytics',
        href: '/admin/analytics',
        label: 'Analytics',
        description: 'Revenue trends, conversion signals, and product performance',
        icon: BarChart3,
        aliases: ['reports', 'metrics', 'revenue', 'performance', 'stripe dashboard'],
      },
      {
        id: 'audit',
        href: '/admin/audit',
        label: 'Audit logs',
        description: 'Security-sensitive activity and admin change history',
        icon: Shield,
        aliases: ['security', 'activity', 'history', 'logs', 'compliance'],
      },
    ],
  },
];

export const ADMIN_UTILITY_NAV: AdminNavItem[] = [
  {
    id: 'settings',
    href: '/admin/settings',
    label: 'Settings',
    description: 'Payments, checkout, store profile, tax, and operations',
    icon: Settings,
    aliases: ['configuration', 'payments', 'stripe', 'checkout', 'store settings'],
  },
];

export const ADMIN_QUICK_ACTIONS: AdminQuickAction[] = [
  {
    id: 'new-product',
    href: '/admin/products/new',
    label: 'Add product',
    description: 'Create a new product listing',
    icon: Package,
    aliases: ['create listing', 'new card', 'new item', 'add listing'],
    group: 'Create',
  },
  {
    id: 'draft-order',
    href: '/admin/orders',
    label: 'Create draft order',
    description: 'Start a manual order workflow',
    icon: Plus,
    aliases: ['manual order', 'invoice', 'create order'],
    group: 'Create',
  },
  {
    id: 'new-discount',
    href: '/admin/discounts',
    label: 'Create discount',
    description: 'Set up a coupon or promotion',
    icon: Megaphone,
    aliases: ['coupon', 'promo code', 'offer', 'promotion'],
    group: 'Create',
  },
  {
    id: 'storefront',
    href: '/',
    label: 'View online store',
    description: 'Open the customer-facing storefront',
    icon: ExternalLink,
    aliases: ['view store', 'online store', 'website', 'sales channel'],
    group: 'Storefront',
  },
];

export const ADMIN_PRIMARY_NAV_ITEMS = ADMIN_NAV_GROUPS.flatMap((group) => group.items);
export const ADMIN_ALL_NAV_ITEMS = [...ADMIN_PRIMARY_NAV_ITEMS, ...ADMIN_UTILITY_NAV];
