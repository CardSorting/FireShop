'use client';

/**
 * [LAYER: UI]
 * Standardized admin building blocks for the merchant-operations console.
 * Patterns modeled after Shopify Admin and Stripe Dashboard conventions.
 */
import React, { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../../hooks/useAuth';
import { useServices } from '../../hooks/useServices';
import { formatCurrency, formatShortDate, formatRelativeTime } from '../../../utils/formatters';
import type { AdminDashboardSummary, Order, Product } from '@domain/models';
import { 
  TrendingUp, 
  TrendingDown, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Truck, 
  XCircle,
  ChevronRight,
  X,
  Check,
  Info,
  AlertCircle,
  Bell,
  ShoppingBag,
  DollarSign,
  Shield,
  type LucideIcon
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════
   PAGE HEADER — Consistent top section for every page
   ═══════════════════════════════════════════════════════ */

interface AdminPageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  category?: string;
}

export function AdminPageHeader({ title, subtitle, actions, category }: AdminPageHeaderProps) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {category && (
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-primary-600">
            {category}
          </p>
        )}
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-3">{actions}</div>}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   BREADCRUMB — Automatic route-based breadcrumbs
   ═══════════════════════════════════════════════════════ */

const BREADCRUMB_LABELS: Record<string, string> = {
  admin: 'Home',
  orders: 'Orders',
  products: 'Products',
  inventory: 'Inventory',
  settings: 'Settings',
  new: 'New',
  edit: 'Edit',
};

export function AdminBreadcrumb() {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);
  
  if (segments.length <= 1) return null;
  
  const crumbs = segments.map((segment, i) => {
    const href = '/' + segments.slice(0, i + 1).join('/');
    const label = BREADCRUMB_LABELS[segment] || (segment.length > 12 ? segment.slice(0, 8) + '…' : segment.charAt(0).toUpperCase() + segment.slice(1));
    const isLast = i === segments.length - 1;
    return { label, href, isLast };
  });

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm">
      {crumbs.map((crumb, i) => (
        <React.Fragment key={crumb.href}>
          {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-gray-300" />}
          {crumb.isLast ? (
            <span className="font-medium text-gray-900">{crumb.label}</span>
          ) : (
            <Link href={crumb.href} className="text-gray-500 transition hover:text-gray-700">
              {crumb.label}
            </Link>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}

/* ═══════════════════════════════════════════════════════
   PAGE TITLE — Dynamic document.title for admin pages
   ═══════════════════════════════════════════════════════ */

export function useAdminPageTitle(title: string) {
  useEffect(() => {
    document.title = `${title} · PlayMoreTCG Admin`;
    return () => { document.title = 'PlayMoreTCG'; };
  }, [title]);
}

/* ═══════════════════════════════════════════════════════
   METRIC CARD — KPI display with optional trend
   ═══════════════════════════════════════════════════════ */

interface AdminMetricCardProps {
  label: ReactNode;
  value: string | number;
  description?: ReactNode;
  icon: LucideIcon;
  trend?: {
    value: string;
    positive: boolean;
  };
  color?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
  onClick?: () => void;
}

const COLOR_MAP = {
  primary: 'text-primary-600 bg-primary-50',
  success: 'text-green-600 bg-green-50',
  warning: 'text-amber-600 bg-amber-50',
  danger: 'text-red-600 bg-red-50',
  info: 'text-blue-600 bg-blue-50',
};

export function AdminMetricCard({ label, value, description, icon: Icon, trend, color = 'primary', onClick }: AdminMetricCardProps) {
  const Wrapper = onClick ? 'button' : 'div';
  return (
    <Wrapper 
      onClick={onClick}
      className={`group relative overflow-hidden rounded-xl border bg-white p-5 shadow-sm text-left transition-all hover:shadow-md hover:border-gray-300 ${onClick ? 'cursor-pointer active:scale-[0.98]' : ''}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1">{label}</p>
          <h3 className="text-2xl font-bold text-gray-900 tracking-tight">{value}</h3>
        </div>
        <div className={`rounded-lg p-2 ${COLOR_MAP[color]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      
      {description && (
        <div className="mt-4 border-t border-gray-50 pt-3">
          {typeof description === 'string' ? (
            <p className="text-xs font-medium text-gray-500">{description}</p>
          ) : (
            description
          )}
        </div>
      )}

      {trend && (
        <div className={`absolute bottom-0 left-0 right-0 h-1 ${trend.positive ? 'bg-green-500' : 'bg-red-500'} opacity-0 transition-opacity group-hover:opacity-100`} />
      )}
    </Wrapper>
  );
}

/* ═══════════════════════════════════════════════════════
   STATUS BADGE — Universal status indicator
   ═══════════════════════════════════════════════════════ */

interface AdminStatusBadgeProps {
  status: string;
  type: 'order' | 'inventory' | 'category' | 'generic' | 'transfer';
}

export function AdminStatusBadge({ status, type }: AdminStatusBadgeProps) {
  let colorClass = 'bg-gray-100 text-gray-700';
  let Icon = Clock;

  if (type === 'order') {
    switch (status) {
      case 'pending':
        colorClass = 'bg-amber-100 text-amber-800 ring-1 ring-amber-200';
        Icon = Clock;
        break;
      case 'confirmed':
        colorClass = 'bg-blue-100 text-blue-800 ring-1 ring-blue-200';
        Icon = CheckCircle2;
        break;
      case 'shipped':
        colorClass = 'bg-purple-100 text-purple-800 ring-1 ring-purple-200';
        Icon = Truck;
        break;
      case 'delivered':
        colorClass = 'bg-green-100 text-green-800 ring-1 ring-green-200';
        Icon = CheckCircle2;
        break;
      case 'cancelled':
        colorClass = 'bg-red-100 text-red-800 ring-1 ring-red-200';
        Icon = XCircle;
        break;
    }
  } else if (type === 'inventory') {
    switch (status) {
      case 'healthy':
        colorClass = 'bg-green-100 text-green-800 ring-1 ring-green-200';
        Icon = CheckCircle2;
        break;
      case 'low_stock':
        colorClass = 'bg-amber-100 text-amber-800 ring-1 ring-amber-200';
        Icon = AlertTriangle;
        break;
      case 'out_of_stock':
        colorClass = 'bg-red-100 text-red-800 ring-1 ring-red-200';
        Icon = XCircle;
        break;
    }
  } else if (type === 'transfer') {
    switch (status) {
      case 'pending':
        colorClass = 'bg-gray-100 text-gray-700 ring-1 ring-gray-200';
        Icon = Clock;
        break;
      case 'in_transit':
        colorClass = 'bg-blue-100 text-blue-800 ring-1 ring-blue-200';
        Icon = Truck;
        break;
      case 'received':
        colorClass = 'bg-green-100 text-green-800 ring-1 ring-green-200';
        Icon = CheckCircle2;
        break;
      case 'cancelled':
        colorClass = 'bg-red-100 text-red-800 ring-1 ring-red-200';
        Icon = XCircle;
        break;
    }
  }

  const displayText = status.replace(/_/g, ' ');

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-widest ${colorClass}`}>
      <Icon className="h-3 w-3" />
      {displayText}
    </span>
  );
}

/* ═══════════════════════════════════════════════════════
   EMPTY STATE — Friendly zero-data displays
   ═══════════════════════════════════════════════════════ */

interface AdminEmptyStateProps {
  title: string;
  description: string;
  icon: LucideIcon;
  action?: ReactNode;
}

export function AdminEmptyState({ title, description, icon: Icon, action }: AdminEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/50 p-16 text-center">
      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <Icon className="h-8 w-8 text-gray-400" />
      </div>
      <h3 className="mt-4 text-base font-semibold text-gray-900">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-gray-500">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   TABS — Shopify-style view switching
   ═══════════════════════════════════════════════════════ */

interface AdminTabProps {
  label: string;
  count?: number;
  active: boolean;
  onClick: () => void;
  icon?: LucideIcon;
}

export function AdminTab({ label, count, active, onClick, icon: Icon }: AdminTabProps) {
  return (
    <button
      onClick={onClick}
      className={`
        relative flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-bold transition-all
        ${active 
          ? 'border-primary-600 text-gray-900' 
          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-200'
        }
      `}
    >
      {Icon && <Icon className={`h-4 w-4 ${active ? 'text-primary-600' : 'text-gray-400'}`} />}
      <span>{label}</span>
      {count !== undefined && (
        <span className={`ml-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
          active ? 'bg-primary-50 text-primary-700' : 'bg-gray-100 text-gray-500'
        }`}>
          {count}
        </span>
      )}
    </button>
  );
}

/* ═══════════════════════════════════════════════════════
   ACTION PANEL — Inline call-to-action cards
   ═══════════════════════════════════════════════════════ */

interface AdminActionPanelProps {
  title: string;
  description: string;
  buttonLabel: string;
  onClick?: () => void;
  href?: string;
  variant?: 'primary' | 'secondary' | 'outline';
}

export function AdminActionPanel({ title, description, buttonLabel, onClick, href, variant = 'primary' }: AdminActionPanelProps) {
  const content = (
    <div className="flex flex-col gap-4 rounded-xl border bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between transition hover:shadow-md">
      <div>
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        <p className="text-xs text-gray-500">{description}</p>
      </div>
      <button 
        onClick={onClick}
        className={`shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition ${
          variant === 'primary' ? 'bg-primary-600 text-white hover:bg-primary-700 shadow-sm' : 
          variant === 'secondary' ? 'bg-gray-100 text-gray-900 hover:bg-gray-200' :
          'border border-gray-300 text-gray-700 hover:bg-gray-50'
        }`}
      >
        {buttonLabel}
      </button>
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}

/* ═══════════════════════════════════════════════════════
   BULK ACTION BAR — Fixed bottom toolbar for selections
   ═══════════════════════════════════════════════════════ */

export function BulkActionBar({ selectedCount, actions, onClear }: { selectedCount: number; actions: ReactNode; onClear: () => void }) {
  if (selectedCount === 0) return null;
  return (
    <div className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-5 rounded-2xl bg-gray-900 px-6 py-3.5 text-white shadow-2xl shadow-black/20 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-center gap-3 border-r border-white/10 pr-5">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-500 text-[10px] font-bold">{selectedCount}</span>
        <span className="text-sm font-medium">selected</span>
        <button onClick={onClear} className="text-xs text-gray-400 underline underline-offset-4 transition hover:text-white">Clear</button>
      </div>
      <div className="flex items-center gap-2">
        {actions}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   SKELETON LOADERS — Loading state placeholders
   ═══════════════════════════════════════════════════════ */

export function SkeletonRow({ columns = 5 }: { columns?: number }) {
  return (
    <tr>
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="px-6 py-4">
          <div className="skeleton h-4 w-full max-w-[120px] rounded" style={{ maxWidth: i === 0 ? 200 : 100 }} />
        </td>
      ))}
    </tr>
  );
}

export function SkeletonCard() {
  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">
      <div className="skeleton mb-4 h-10 w-10 rounded-xl" />
      <div className="skeleton mb-2 h-3 w-20 rounded" />
      <div className="skeleton h-6 w-16 rounded" />
    </div>
  );
}

export function SkeletonPage() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="space-y-2">
        <div className="skeleton h-4 w-24 rounded" />
        <div className="skeleton h-8 w-64 rounded" />
        <div className="skeleton h-4 w-48 rounded" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
      </div>
      <div className="rounded-2xl border bg-white p-6 shadow-sm overflow-hidden">
        <table className="w-full">
          <tbody className="divide-y divide-gray-100">
            {[1, 2, 3, 4, 5].map(i => <SkeletonRow key={i} />)}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   CONFIRM DIALOG — Reusable confirmation modal
   ═══════════════════════════════════════════════════════ */

interface AdminConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  variant?: 'danger' | 'primary';
}

export function AdminConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  loading = false,
  variant = 'danger',
}: AdminConfirmDialogProps) {
  if (!open) return null;

  const confirmClass = variant === 'danger'
    ? 'bg-red-600 text-white hover:bg-red-700 shadow-sm'
    : 'bg-primary-600 text-white hover:bg-primary-700 shadow-sm';

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm backdrop-enter" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl animate-in zoom-in-95 fade-in duration-200">
        <div className={`mb-6 flex h-12 w-12 items-center justify-center rounded-2xl ${variant === 'danger' ? 'bg-red-100' : 'bg-primary-100'}`}>
          {variant === 'danger' ? <AlertTriangle className="h-6 w-6 text-red-600" /> : <Info className="h-6 w-6 text-primary-600" />}
        </div>
        <h3 className="text-lg font-bold text-gray-900">{title}</h3>
        <p className="mt-2 text-sm text-gray-500 leading-relaxed">{description}</p>
        <div className="mt-8 flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 rounded-xl border bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:opacity-50 ${confirmClass}`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Processing…
              </span>
            ) : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   TOAST SYSTEM — Global notification context
   ═══════════════════════════════════════════════════════ */

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  toast: (type: ToastType, message: string) => void;
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timersRef = useRef<Map<string, number>>(new Map());

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
    const timer = timersRef.current.get(id);
    if (timer) { clearTimeout(timer); timersRef.current.delete(id); }
  }, []);

  const toast = useCallback((type: ToastType, message: string) => {
    const id = crypto.randomUUID();
    setToasts(prev => [...prev.slice(-4), { id, type, message }]);
    const timer = window.setTimeout(() => dismiss(id), 4000);
    timersRef.current.set(id, timer);
  }, [dismiss]);

  const TOAST_STYLES: Record<ToastType, { bg: string; icon: typeof Check }> = {
    success: { bg: 'bg-green-600', icon: Check },
    error: { bg: 'bg-red-600', icon: AlertCircle },
    info: { bg: 'bg-gray-800', icon: Info },
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed right-4 top-4 z-70 flex flex-col gap-2">
        {toasts.map(t => {
          const style = TOAST_STYLES[t.type];
          const Icon = style.icon;
          return (
            <div key={t.id} className={`toast-enter flex items-center gap-3 rounded-xl ${style.bg} px-4 py-3 text-sm font-medium text-white shadow-lg min-w-[280px] max-w-[400px]`}>
              <Icon className="h-4 w-4 shrink-0" />
              <span className="flex-1">{t.message}</span>
              <button onClick={() => dismiss(t.id)} className="shrink-0 rounded-lg p-0.5 transition hover:bg-white/20">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

/* ═══════════════════════════════════════════════════════
   TOP BAR — Minimal header for admin shell
   ═══════════════════════════════════════════════════════ */

export function AdminTopBar({ onToggleSidebar }: { onToggleSidebar?: () => void }) {
  const { user } = useAuth();
  const initials = user?.displayName?.split(' ').map(n => n[0]).join('').toUpperCase() || 'AD';
  const role = 'Store Admin'; // Could be dynamic if roles exist

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b bg-white/80 px-4 backdrop-blur-md lg:px-6">
      <div className="flex items-center gap-3">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="rounded-lg p-1.5 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700 lg:hidden"
            aria-label="Toggle sidebar"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
        )}
        <AdminBreadcrumb />
      </div>
      <div className="flex items-center gap-4">
        <div className="hidden items-center gap-3 md:flex">
          <div className="text-right">
            <p className="text-xs font-semibold text-gray-900">{user?.displayName || 'Store Admin'}</p>
            <p className="text-[10px] text-gray-500">PlayMoreTCG</p>
          </div>
          <div className="h-8 w-8 overflow-hidden rounded-full bg-linear-to-br from-primary-400 to-primary-600 shadow-sm">
            <div className="flex h-full w-full items-center justify-center text-xs font-bold text-white">{initials}</div>
          </div>
        </div>
      </div>
    </header>
  );
}

/* ═══════════════════════════════════════════════════════
   SHORTCUTS HELP — Keyboard shortcuts overview
   ═══════════════════════════════════════════════════════ */

export function ShortcutsHelp({ onClose }: { onClose: () => void }) {
  const sections = [
    {
      title: 'Global',
      shortcuts: [
        { keys: ['⌘', 'K'], label: 'Open command palette' },
        { keys: ['?'], label: 'Show this help' },
        { keys: ['ESC'], label: 'Close modals/drawers' },
      ],
    },
    {
      title: 'Navigation',
      shortcuts: [
        { keys: ['G', 'H'], label: 'Go to Home' },
        { keys: ['G', 'O'], label: 'Go to Orders' },
        { keys: ['G', 'P'], label: 'Go to Products' },
        { keys: ['G', 'I'], label: 'Go to Inventory' },
      ],
    },
  ];

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm backdrop-enter" onClick={onClose} />
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl animate-in zoom-in-95 fade-in duration-200">
        <div className="border-b bg-gray-50 px-6 py-4">
          <h3 className="text-sm font-bold text-gray-900">Keyboard shortcuts</h3>
        </div>
        <div className="p-6 space-y-8">
          {sections.map((section) => (
            <div key={section.title}>
              <h4 className="mb-3 text-[10px] font-bold uppercase tracking-wider text-gray-400">{section.title}</h4>
              <div className="space-y-3">
                {section.shortcuts.map((s) => (
                  <div key={s.label} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{s.label}</span>
                    <div className="flex gap-1">
                      {s.keys.map((key) => (
                        <kbd key={key} className="flex h-6 min-w-[24px] items-center justify-center rounded border bg-gray-50 px-1.5 font-mono text-[10px] font-bold text-gray-500 shadow-xs">
                          {key}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="border-t bg-gray-50 px-6 py-3 text-center">
          <p className="text-[10px] text-gray-400">Press <kbd className="font-bold">ESC</kbd> to close</p>
        </div>
      </div>
    </div>
  );
}

export function HelpTooltip({ text }: { text: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative inline-block ml-1">
      <button 
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onClick={() => setShow(!show)}
        className="text-gray-300 transition hover:text-gray-500 outline-none"
      >
        <Info className="h-3.5 w-3.5" />
      </button>
      {show && (
        <div className="absolute bottom-full left-1/2 z-50 mb-2 w-48 -translate-x-1/2 rounded-lg bg-gray-900 px-3 py-2 text-[10px] leading-relaxed text-white shadow-xl animate-in fade-in zoom-in-95 duration-150 pointer-events-none">
          {text}
          <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
        </div>
      )}
    </div>
  );
}

export function AdminSparkline({ data, color = 'primary' }: { data: number[], color?: 'primary' | 'success' | 'danger' | 'info' }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min;
  const height = 32;
  const width = 100;
  
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / (range || 1)) * height;
    return `${x},${y}`;
  }).join(' ');

  const colors = {
    primary: 'stroke-primary-500 fill-primary-500',
    success: 'stroke-green-500 fill-green-500',
    danger: 'stroke-red-500 fill-red-500',
    info: 'stroke-blue-500 fill-blue-500',
  };

  return (
    <svg width={width} height={height} className="overflow-visible">
      <path 
        d={`M 0,${height} L ${points} L ${width},${height} Z`} 
        className={`${colors[color]} fill-opacity-5`} 
      />
      <polyline 
        fill="none" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        points={points} 
        className={colors[color]} 
      />
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════
   NOTIFICATION BELL — Real-time activity popover
   ═══════════════════════════════════════════════════════ */

export function AdminNotificationBell() {
  const [open, setOpen] = useState(false);
  const services = useServices();
  const [notifications, setNotifications] = useState<any[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  async function loadNotifications() {
    try {
      const summary: AdminDashboardSummary = await services.orderService.getAdminDashboardSummary();
      const items = [
        ...summary.lowStockProducts.map((p: Product) => ({
          id: `stock-${p.id}`,
          title: `Low stock: ${p.name}`,
          time: 'Now',
          icon: AlertTriangle,
          color: 'text-amber-600 bg-amber-50'
        })),
        ...summary.recentOrders.slice(0, 5).map((o: Order) => ({
          id: `order-${o.id}`,
          title: `New order #${o.id.slice(0, 8).toUpperCase()}`,
          time: formatShortDate(o.createdAt),
          icon: ShoppingBag,
          color: 'text-primary-600 bg-primary-50'
        }))
      ];
      setNotifications(items);
    } catch {
      // Fail silently for notifications
    }
  }

  useEffect(() => {
    void loadNotifications();
  }, [services]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setOpen(!open)}
        className={`relative rounded-lg p-2 transition hover:bg-gray-100 ${open ? 'bg-gray-100 text-gray-900' : 'text-gray-500'}`}
      >
        <Bell className="h-5 w-5" />
        <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary-500 ring-2 ring-white" />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 overflow-hidden rounded-2xl border bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-200 z-50">
          <div className="border-b bg-gray-50/80 px-4 py-3">
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-900">Recent Activity</h3>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.map((n) => {
              const Icon = n.icon;
              return (
                <div key={n.id} className="flex items-start gap-3 border-b border-gray-50 p-4 transition hover:bg-gray-50 cursor-pointer">
                  <div className={`rounded-lg p-2 ${n.color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-gray-900 leading-tight">{n.title}</p>
                    <p className="mt-1 text-[10px] text-gray-400 font-medium">{n.time}</p>
                  </div>
                </div>
              );
            })}
          </div>
          <button className="w-full bg-white py-3 text-[10px] font-bold uppercase tracking-widest text-primary-600 transition hover:bg-gray-50">
            View all activity
          </button>
        </div>
      )}
    </div>
  );
}


/* ═══════════════════════════════════════════════════════
   AREA CHART — High-fidelity data visualization
   ═══════════════════════════════════════════════════════ */

export function AdminAreaChart({ data, height = 200, color = 'primary' }: { data: { label: string; value: number }[], height?: number, color?: 'primary' | 'success' | 'info' }) {
  const max = Math.max(...data.map(d => d.value));
  const min = Math.min(...data.map(d => d.value));
  const range = max - min;
  const width = 1000;
  
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((d.value - min) / (range || 1)) * height;
    return `${x},${y}`;
  }).join(' ');

  const colors = {
    primary: 'stroke-primary-500 fill-primary-500 text-primary-500/20',
    success: 'stroke-green-500 fill-green-500 text-green-500/20',
    info: 'stroke-blue-500 fill-blue-500 text-blue-500/20',
  };

  return (
    <div className="relative w-full overflow-hidden" style={{ height }}>
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="h-full w-full overflow-visible">
        <defs>
          <linearGradient id={`gradient-${color}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="currentColor" className={color === 'primary' ? 'text-primary-500/20' : color === 'success' ? 'text-green-500/20' : 'text-blue-500/20'} />
            <stop offset="100%" stopColor="currentColor" className={color === 'primary' ? 'text-primary-500/0' : color === 'success' ? 'text-green-500/0' : 'text-blue-500/0'} />
          </linearGradient>
        </defs>
        <path 
          d={`M 0,${height} L ${points} L ${width},${height} Z`} 
          fill={`url(#gradient-${color})`}
          className={colors[color]}
        />
        <polyline 
          fill="none" 
          strokeWidth="3" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          points={points} 
          className={colors[color].split(' ')[0]} 
        />
      </svg>
      <div className="absolute inset-0 flex">
        {data.map((d, i) => (
          <div key={i} className="group relative flex-1 h-full cursor-crosshair">
            <div className="absolute inset-y-0 left-1/2 w-px bg-gray-200 opacity-0 group-hover:opacity-100" />
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10 whitespace-nowrap rounded-lg bg-gray-900 px-3 py-1.5 text-[10px] font-bold text-white shadow-xl">
              <p className="text-[8px] text-gray-400 font-medium uppercase tracking-widest mb-0.5">${d.label}</p>
              <p>{formatCurrency(d.value)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * PRODUCTION UTILITY: Export data to CSV
 * Generates and triggers a browser download for a CSV file.
 */
export function exportToCSV(filename: string, data: any[]) {
  if (data.length === 0) return;
  
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(fieldName => {
        const value = row[fieldName];
        // Handle strings with commas by wrapping in quotes
        if (typeof value === 'string' && value.includes(',')) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        // Handle dates
        if (value instanceof Date) {
          return value.toISOString();
        }
        return value;
      }).join(',')
    )
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().slice(0, 10)}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * PRODUCTION COMPONENT: Packing Slip (Print Ready)
 */
export function AdminPackingSlip({ order }: { order: Order }) {
  return (
    <div className="bg-white p-12 text-gray-900 font-sans max-w-[800px] mx-auto print:p-0 print:m-0 print:max-w-none">
      <div className="flex justify-between items-start border-b-2 border-gray-900 pb-8 mb-8">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tighter mb-2">Packing Slip</h1>
          <p className="text-sm font-bold text-gray-500">Order #{order.id.slice(0, 8).toUpperCase()}</p>
        </div>
        <div className="text-right">
          <p className="text-xl font-black uppercase">PlayMore TCG</p>
          <p className="text-xs font-medium text-gray-500">123 Pallet Town Road, Kanto</p>
          <p className="text-xs font-medium text-gray-500">support@playmoretcg.com</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-12 mb-12">
        <div>
          <h2 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Ship To</h2>
          <p className="text-sm font-bold">{order.customerName}</p>
          <p className="text-sm font-medium text-gray-600">{order.shippingAddress.street}</p>
          <p className="text-sm font-medium text-gray-600">{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zip}</p>
          <p className="text-sm font-medium text-gray-600 uppercase">{order.shippingAddress.country}</p>
        </div>
        <div>
          <h2 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Order Info</h2>
          <div className="space-y-1">
             <div className="flex justify-between text-sm">
               <span className="text-gray-500 font-medium">Date:</span>
               <span className="font-bold">{order.createdAt.toLocaleDateString()}</span>
             </div>
             <div className="flex justify-between text-sm">
               <span className="text-gray-500 font-medium">Payment:</span>
               <span className="font-bold uppercase">{order.paymentTransactionId ? 'Paid' : 'Pending'}</span>
             </div>
          </div>
        </div>
      </div>

      <table className="w-full mb-12">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="py-3 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Description</th>
            <th className="py-3 text-center text-[10px] font-black uppercase tracking-widest text-gray-400">Qty</th>
            <th className="py-3 text-right text-[10px] font-black uppercase tracking-widest text-gray-400">SKU</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {order.items.map((item, i) => (
            <tr key={i}>
              <td className="py-4">
                <p className="text-sm font-bold">{item.name}</p>
              </td>
              <td className="py-4 text-center">
                <p className="text-sm font-bold">{item.quantity}</p>
              </td>
              <td className="py-4 text-right">
                <p className="text-[10px] font-mono text-gray-400">PM-{item.productId.slice(0, 4).toUpperCase()}</p>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="border-t pt-8 text-center">
        <p className="text-xs font-bold text-gray-400 italic">Thank you for shopping with PlayMore TCG!</p>
      </div>
    </div>
  );
}

/**
 * PRODUCTION COMPONENT: Audit Log Table
 */
export function AdminAuditLogs({ logs }: { logs: any[] }) {
  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Shield className="h-12 w-12 text-gray-100 mb-4" />
        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">No audit logs found</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b">
          <tr>
            <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-gray-400">Timestamp</th>
            <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-gray-400">Actor</th>
            <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-gray-400">Action</th>
            <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-gray-400">Target</th>
            <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-gray-400">Details</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {logs.map((log) => (
            <tr key={log.id} className="hover:bg-gray-50 transition">
              <td className="px-4 py-3.5 whitespace-nowrap text-gray-500 font-medium tabular-nums">
                {formatRelativeTime(log.createdAt)}
              </td>
              <td className="px-4 py-3.5">
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-gray-900">{log.userEmail.split('@')[0]}</span>
                  <span className="text-[10px] text-gray-400 uppercase font-medium">{log.userEmail}</span>
                </div>
              </td>
              <td className="px-4 py-3.5">
                <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-widest ${
                  log.action.includes('delete') ? 'bg-red-50 text-red-600' :
                  log.action.includes('create') ? 'bg-green-50 text-green-600' :
                  'bg-blue-50 text-blue-600'
                }`}>
                  {log.action.replace(/_/g, ' ')}
                </span>
              </td>
              <td className="px-4 py-3.5 font-mono text-[10px] text-gray-400">
                {log.targetId.slice(0, 8)}...
              </td>
              <td className="px-4 py-3.5">
                <p className="text-[10px] font-medium text-gray-500 max-w-xs truncate">
                  {log.details}
                </p>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
