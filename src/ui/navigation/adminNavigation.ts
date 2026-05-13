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
  Building2,
  BrainCircuit,
  ClipboardCheck,
  ClipboardList,
  ExternalLink,
  Image as ImageIcon,
  LayoutDashboard,
  ListTree,
  MapPin,
  Megaphone,

  Package,
  Plus,
  RefreshCw,
  Search,
  Settings,
  Shield,
  Tag,
  Truck,
  User,
  Zap,
  MessageSquare,
  NotebookPen,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';


export interface AdminNavItem {
  id: string;
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
  aliases: string[];
  badge?: 'orders' | 'tickets' | 'stock' | 'none';
  contextualActions?: { label: string; href: string; icon: LucideIcon }[];
  shortcut?: string;
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
        shortcut: 'G H',
      },
      {
        id: 'ops',
        href: '/admin/ops',
        label: 'Planning',
        description: 'Turn store signals into suggested next actions',
        icon: BrainCircuit,
        aliases: ['operations', 'ops', 'planning', 'suggested actions', 'next steps', 'command center'],
        shortcut: 'G O',
      },
    ],
  },

  {
    id: 'orders',
    items: [
      {
        id: 'orders',
        href: '/admin/orders',
        label: 'Orders',
        description: 'Review, fulfill, and manage all transactions',
        icon: ClipboardList,
        aliases: ['sales', 'fulfillment', 'shipping', 'purchases', 'transactions', 'billing'],
        badge: 'orders',
        shortcut: 'G R',
      },
    ],
  },
  {
    id: 'products',
    items: [
      {
        id: 'products',
        href: '/admin/products',
        label: 'Products',
        description: 'Manage inventory listings and pricing',
        icon: Package,
        aliases: ['catalog', 'items', 'listings', 'inventory', 'merchandise'],
        shortcut: 'G P',
        contextualActions: [
          { label: 'Add product', href: '/admin/products/new', icon: Plus },
          { label: 'Import CSV', href: '/admin/products', icon: RefreshCw },
          { label: 'Bulk edit', href: '/admin/products/bulk-edit', icon: Tag }
        ]
      },
      {
        id: 'collections',
        href: '/admin/collections',
        label: 'Collections',
        description: 'Group products for organization',
        icon: Tag,
        aliases: ['tags', 'product groups', 'merchandising', 'featured products', 'categories'],
      },
      {
        id: 'inventory',
        href: '/admin/inventory',
        label: 'Inventory',
        description: 'Track quantity across all locations',
        icon: Boxes,
        aliases: ['stock', 'quantity', 'warehouse', 'restock', 'availability'],
      },
      {
        id: 'taxonomy',
        href: '/admin/taxonomy',
        label: 'Taxonomy & Organization',
        description: 'Manage categories and product types',
        icon: ListTree,
        aliases: ['taxonomy', 'categories', 'types', 'structure', 'classification', 'organization', 'hierarchy'],
      },
    ],
  },
  {
    id: 'customers',
    items: [
      {
        id: 'customers',
        href: '/admin/customers',
        label: 'Customers',
        description: 'Customer profiles and purchase history',
        icon: User,
        aliases: ['buyers', 'accounts', 'people', 'users', 'support'],
      },
      {
        id: 'tickets',
        href: '/admin/tickets',
        label: 'Support Tickets',
        description: 'Manage customer inquiries and returns',
        icon: MessageSquare,
        aliases: ['support', 'help', 'tickets', 'issues', 'returns'],
      },
      {
        id: 'support-macros',
        href: '/admin/support/macros',
        label: 'Support Macros',
        description: 'Manage saved replies for efficiency',
        icon: Tag,
        aliases: ['macros', 'saved replies', 'templates', 'responses'],
      },
    ],
  },
  {
    id: 'procurement',
    label: 'Purchasing & Sourcing',
    items: [
      {
        id: 'purchase-orders',
        href: '/admin/purchase-orders',
        label: 'Receiving',
        description: 'Order stock, receive shipments, and resolve exceptions',
        icon: Truck,
        aliases: ['purchase orders', 'po', 'incoming stock', 'receiving', 'vendor orders', 'procurement', 'order stock', 'receive shipment'],
      },
      {
        id: 'suppliers',
        href: '/admin/suppliers',
        label: 'Partners',
        description: 'Manage wholesale vendors and manufacturing partners',
        icon: Building2,
        aliases: ['partners', 'vendors', 'wholesalers', 'manufacturers', 'suppliers'],
        contextualActions: [
          { label: 'Add partner', href: '/admin/suppliers/new', icon: Plus },
          { label: 'Browse directory', href: '/admin/suppliers', icon: Search }
        ]
      },
    ],
  },
  {
    id: 'content',
    label: 'Content & Media',
    items: [
      {
        id: 'pages',
        href: '/admin/settings',
        label: 'Pages',
        description: 'Manage custom content pages',
        icon: ClipboardCheck,
        aliases: ['content', 'about', 'contact', 'legal', 'policy', 'tos', 'privacy'],
      },
      {
        id: 'blog',
        href: '/admin/blog',
        label: 'Blog',
        description: 'Manage articles and store updates',
        icon: NotebookPen,
        aliases: ['blog', 'posts', 'authors', 'articles', 'news', 'journal', 'writing'],
      },
      {
        id: 'files',
        href: '/admin/files',
        label: 'Files',
        description: 'Upload and manage media assets',
        icon: ImageIcon,
        aliases: ['images', 'media', 'uploads', 'assets', 'documents', 'pictures', 'videos', 'storage'],
      },
    ],
  },
  {
    id: 'marketing',
    label: 'Marketing & Growth',
    items: [
      {
        id: 'discounts',
        href: '/admin/discounts',
        label: 'Discounts',
        description: 'Coupons and promotions',
        icon: Tag,
        aliases: ['coupons', 'promo codes', 'promotions', 'offers', 'campaigns', 'sales', 'marketing'],
      },
    ],
  },
  {
    id: 'insights',
    label: 'Intelligence',
    items: [
      {
        id: 'concierge-insights',
        href: '/admin/concierge',
        label: 'Concierge AI',
        description: 'Customer struggles and support intelligence',
        icon: Sparkles,
        aliases: ['concierge', 'intelligence', 'suggestions', 'struggles', 'chat insights'],
      },
      {
        id: 'analytics',
        href: '/admin/analytics',
        label: 'Analytics',
        description: 'Revenue trends and performance metrics',
        icon: BarChart3,
        aliases: ['reports', 'metrics', 'revenue', 'performance', 'stripe dashboard'],
      },
      {
        id: 'audit',
        href: '/admin/audit',
        label: 'Security Logs',
        description: 'Activity history and compliance logs',
        icon: Shield,
        aliases: ['security', 'activity', 'history', 'logs', 'compliance'],
      },
    ],
  },
  {
    id: 'extensions',
    items: [
      {
        id: 'apps',
        href: '/admin/settings',
        label: 'Apps',
        description: 'Extend functionality with plugins',
        icon: Zap,
        aliases: ['plugins', 'extensions', 'addons', 'integrations', 'marketplace'],
      },
    ],
  },
];

export const ADMIN_UTILITY_NAV: AdminNavItem[] = [
  {
    id: 'settings',
    href: '/admin/settings',
    label: 'Settings',
    description: 'Hardware, payments, and store configuration',
    icon: Settings,
    aliases: ['configuration', 'payments', 'stripe', 'checkout', 'store settings', 'hardware'],
  },
];

export const ADMIN_QUICK_ACTIONS: AdminQuickAction[] = [

  {
    id: 'new-product',
    href: '/admin/products/new',
    label: 'Add product',
    description: 'Create a new product listing',
    icon: Package,
    aliases: ['create listing', 'new item', 'add listing', 'upload product'],
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
    id: 'bulk-edit-products',
    href: '/admin/products/bulk-edit',
    label: 'Bulk edit products',
    description: 'Update product status, pricing, and inventory',
    icon: Tag,
    aliases: ['bulk editor', 'spreadsheet', 'mass update', 'edit many products'],
    group: 'Create',
  },
  {
    id: 'import-products',
    href: '/admin/products',
    label: 'Import products',
    description: 'Bulk upload products from CSV',
    icon: Plus,
    aliases: ['csv import', 'bulk upload', 'seed products'],
    group: 'Create',
  },
  {
    id: 'create-purchase-order',
    href: '/admin/purchase-orders/new',
    label: 'Order stock',
    description: 'Create a supplier purchase order',
    icon: Truck,
    aliases: ['create purchase order', 'new transfer', 'inbound shipment', 'supplier order', 'po', 'order stock'],
    group: 'Create',
  },
  {
    id: 'receive-inventory',
    href: '/admin/purchase-orders',
    label: 'Receive inventory',
    description: 'Count and receive inbound stock',
    icon: Boxes,
    aliases: ['receiving', 'restock', 'receive transfer', 'stock intake', 'count shipment'],
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
