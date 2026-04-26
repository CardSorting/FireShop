'use client';

/**
 * [LAYER: UI]
 * Command Palette (⌘K / Ctrl+K) — Shopify-style global search overlay.
 * Provides quick access to admin pages, actions, and search.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  LayoutDashboard,
  ClipboardList,
  Package,
  Boxes,
  Plus,
  Settings,
  ExternalLink,
  ArrowRight,
  Command,
  type LucideIcon,
} from 'lucide-react';

interface PaletteItem {
  id: string;
  label: string;
  description?: string;
  icon: LucideIcon;
  href?: string;
  action?: () => void;
  group: string;
}

const STATIC_ITEMS: PaletteItem[] = [
  { id: 'home', label: 'Home', description: 'Dashboard overview', icon: LayoutDashboard, href: '/admin', group: 'Navigate' },
  { id: 'orders', label: 'Orders', description: 'View & manage orders', icon: ClipboardList, href: '/admin/orders', group: 'Navigate' },
  { id: 'products', label: 'Products', description: 'Manage catalog', icon: Package, href: '/admin/products', group: 'Navigate' },
  { id: 'inventory', label: 'Inventory', description: 'Stock levels', icon: Boxes, href: '/admin/inventory', group: 'Navigate' },
  { id: 'settings', label: 'Settings', description: 'Store configuration', icon: Settings, href: '/admin/settings', group: 'Navigate' },
  { id: 'new-product', label: 'Add product', description: 'Create a new product listing', icon: Plus, href: '/admin/products/new', group: 'Actions' },
  { id: 'storefront', label: 'View storefront', description: 'Open customer-facing store', icon: ExternalLink, href: '/', group: 'Actions' },
];

const RECENT_KEY = 'admin-palette-recent';

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const [recentIds, setRecentIds] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // ⌘K / Ctrl+K to toggle
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setOpen(false);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Load recent
  useEffect(() => {
    if (open) {
      const stored = localStorage.getItem(RECENT_KEY);
      if (stored) setRecentIds(JSON.parse(stored));
      setQuery('');
      setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const needle = query.trim().toLowerCase();
  
  const recentItems = recentIds
    .map(id => STATIC_ITEMS.find(item => item.id === id))
    .filter((item): item is PaletteItem => !!item);

  const filtered = STATIC_ITEMS.filter(
    (item) =>
      !needle ||
      item.label.toLowerCase().includes(needle) ||
      item.description?.toLowerCase().includes(needle)
  );

  const grouped: Record<string, PaletteItem[]> = {};
  
  if (!needle && recentItems.length > 0) {
    grouped['Recent'] = recentItems.slice(0, 3);
  }

  filtered.forEach(item => {
    (grouped[item.group] ??= []).push(item);
  });

  const flatList = Object.values(grouped).flat();

  const executeItem = useCallback(
    (item: PaletteItem) => {
      setOpen(false);
      
      // Update recent
      const nextRecent = [item.id, ...recentIds.filter(id => id !== item.id)].slice(0, 5);
      localStorage.setItem(RECENT_KEY, JSON.stringify(nextRecent));
      
      if (item.href) router.push(item.href);
      if (item.action) item.action();
    },
    [router, recentIds]
  );

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % flatList.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => (i - 1 + flatList.length) % flatList.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (flatList[activeIndex]) executeItem(flatList[activeIndex]);
    }
  }

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[80] bg-black/40 backdrop-blur-sm backdrop-enter"
        onClick={() => setOpen(false)}
      />
      {/* Palette */}
      <div className="fixed left-1/2 top-[20%] z-[90] w-full max-w-lg -translate-x-1/2 animate-in zoom-in-95 fade-in duration-150">
        <div className="overflow-hidden rounded-2xl border bg-white shadow-2xl">
          {/* Search input */}
          <div className="flex items-center gap-3 border-b px-4 py-3">
            <Search className="h-5 w-5 shrink-0 text-gray-400" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => { setQuery(e.target.value); setActiveIndex(0); }}
              onKeyDown={handleKeyDown}
              placeholder="Search or jump to…"
              className="flex-1 bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400"
            />
            <kbd className="hidden sm:flex items-center gap-0.5 rounded-md border bg-gray-50 px-1.5 py-0.5 text-[10px] font-medium text-gray-400">
              ESC
            </kbd>
          </div>

          {/* Results */}
          <div className="max-h-[320px] overflow-y-auto styled-scrollbar py-2">
            {flatList.length === 0 && (
              <div className="px-4 py-8 text-center text-sm text-gray-400">
                No results for &ldquo;{query}&rdquo;
              </div>
            )}
            {Object.entries(grouped).map(([group, items]) => (
              <div key={group}>
                <p className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                  {group}
                </p>
                {items.map((item) => {
                  const globalIndex = flatList.indexOf(item);
                  const isActive = globalIndex === activeIndex;
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onMouseEnter={() => setActiveIndex(globalIndex)}
                      onClick={() => executeItem(item)}
                      className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition ${
                        isActive ? 'bg-primary-50 text-primary-700' : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-primary-600' : 'text-gray-400'}`} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{item.label}</p>
                        {item.description && (
                          <p className="truncate text-xs text-gray-400">{item.description}</p>
                        )}
                      </div>
                      {isActive && <ArrowRight className="h-3.5 w-3.5 shrink-0 text-primary-400" />}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="flex items-center gap-4 border-t bg-gray-50 px-4 py-2.5">
            <div className="flex items-center gap-1 text-[10px] text-gray-400">
              <kbd className="rounded border bg-white px-1 py-0.5 font-mono">↑</kbd>
              <kbd className="rounded border bg-white px-1 py-0.5 font-mono">↓</kbd>
              to navigate
            </div>
            <div className="flex items-center gap-1 text-[10px] text-gray-400">
              <kbd className="rounded border bg-white px-1 py-0.5 font-mono">↵</kbd>
              to select
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
