'use client';

/**
 * [LAYER: UI]
 * Standardized admin building blocks for the merchant-operations console.
 * Patterns modeled after Shopify Admin and Stripe Dashboard conventions.
 */
import React, { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
   METRIC CARD — KPI display with optional trend
   ═══════════════════════════════════════════════════════ */

interface AdminMetricCardProps {
  label: string;
  value: string | number;
  description?: string;
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
      className={`rounded-2xl border bg-white p-5 shadow-sm text-left transition ${onClick ? 'cursor-pointer hover:shadow-md hover:border-gray-200 active:scale-[0.98]' : ''}`}
    >
      <div className="flex items-start justify-between">
        <div className={`rounded-xl p-2.5 ${COLOR_MAP[color]}`}>
          <Icon className="h-5 w-5" />
        </div>
        {trend && (
          <div className={`flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold ${trend.positive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {trend.positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {trend.value}
          </div>
        )}
      </div>
      <div className="mt-4">
        <p className="text-sm font-medium text-gray-500">{label}</p>
        <h3 className="mt-0.5 text-2xl font-bold text-gray-900">{value}</h3>
        {description && <p className="mt-1 text-xs text-gray-400">{description}</p>}
      </div>
    </Wrapper>
  );
}

/* ═══════════════════════════════════════════════════════
   STATUS BADGE — Universal status indicator
   ═══════════════════════════════════════════════════════ */

interface AdminStatusBadgeProps {
  status: string;
  type: 'order' | 'inventory' | 'category' | 'generic';
}

export function AdminStatusBadge({ status, type }: AdminStatusBadgeProps) {
  let colorClass = 'bg-gray-100 text-gray-700';
  let Icon = Clock;

  if (type === 'order') {
    switch (status) {
      case 'pending':
        colorClass = 'bg-amber-50 text-amber-700 ring-1 ring-amber-200';
        Icon = Clock;
        break;
      case 'confirmed':
        colorClass = 'bg-blue-50 text-blue-700 ring-1 ring-blue-200';
        Icon = CheckCircle2;
        break;
      case 'shipped':
        colorClass = 'bg-purple-50 text-purple-700 ring-1 ring-purple-200';
        Icon = Truck;
        break;
      case 'delivered':
        colorClass = 'bg-green-50 text-green-700 ring-1 ring-green-200';
        Icon = CheckCircle2;
        break;
      case 'cancelled':
        colorClass = 'bg-red-50 text-red-700 ring-1 ring-red-200';
        Icon = XCircle;
        break;
    }
  } else if (type === 'inventory') {
    switch (status) {
      case 'healthy':
        colorClass = 'bg-green-50 text-green-700 ring-1 ring-green-200';
        Icon = CheckCircle2;
        break;
      case 'low_stock':
        colorClass = 'bg-amber-50 text-amber-700 ring-1 ring-amber-200';
        Icon = AlertTriangle;
        break;
      case 'out_of_stock':
        colorClass = 'bg-red-50 text-red-700 ring-1 ring-red-200';
        Icon = XCircle;
        break;
    }
  } else if (type === 'category') {
    const CATEGORY_COLORS: Record<string, string> = {
      booster: 'bg-violet-50 text-violet-700 ring-1 ring-violet-200',
      single: 'bg-sky-50 text-sky-700 ring-1 ring-sky-200',
      deck: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
      accessory: 'bg-orange-50 text-orange-700 ring-1 ring-orange-200',
      box: 'bg-pink-50 text-pink-700 ring-1 ring-pink-200',
    };
    colorClass = CATEGORY_COLORS[status] || colorClass;
    Icon = CheckCircle2;
  }

  const displayText = status.replace(/_/g, ' ');

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ${colorClass}`}>
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
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map(i => <SkeletonRow key={i} />)}
        </div>
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
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
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
      <div className="fixed right-4 top-4 z-[70] flex flex-col gap-2">
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
            <p className="text-xs font-semibold text-gray-900">Store Admin</p>
            <p className="text-[10px] text-gray-500">PlayMoreTCG</p>
          </div>
          <div className="h-8 w-8 overflow-hidden rounded-full bg-gradient-to-br from-primary-400 to-primary-600 shadow-sm">
            <div className="flex h-full w-full items-center justify-center text-xs font-bold text-white">PM</div>
          </div>
        </div>
      </div>
    </header>
  );
}
