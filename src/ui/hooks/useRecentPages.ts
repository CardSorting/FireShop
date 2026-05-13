'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

export interface RecentPage {
  id: string;
  href: string;
  label: string;
  timestamp: number;
}

const STORAGE_KEY = 'admin-recent-pages';
const MAX_RECENT = 5;

/**
 * [LAYER: UI]
 * Hook to track and retrieve recently visited administrative pages.
 */
export function useRecentPages() {
  const pathname = usePathname();
  const [recent, setRecent] = useState<RecentPage[]>([]);

  // Initial load
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setRecent(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse recent pages', e);
      }
    }
  }, []);

  // Track changes
  useEffect(() => {
    if (!pathname || !pathname.startsWith('/admin')) return;
    
    // Ignore the dashboard home itself as a 'recent' item unless it's the only way
    if (pathname === '/admin') return;

    setRecent(prev => {
      const label = deriveLabel(pathname);
      const newItem: RecentPage = {
        id: pathname,
        href: pathname,
        label,
        timestamp: Date.now()
      };

      const filtered = prev.filter(p => p.href !== pathname);
      const updated = [newItem, ...filtered].slice(0, MAX_RECENT);
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, [pathname]);

  return recent;
}

/**
 * Simple heuristic to get a readable label from a path if not explicitly provided
 */
function deriveLabel(path: string): string {
  const parts = path.split('/').filter(Boolean);
  const last = parts[parts.length - 1];
  
  // Handle common ID-like patterns
  if (last.length > 20 || (last.includes('-') && /\d/.test(last))) {
    const context = parts[parts.length - 2] || 'Page';
    return `${context.charAt(0).toUpperCase() + context.slice(1)} #${last.slice(0, 8)}`;
  }

  return last.charAt(0).toUpperCase() + last.slice(1).replace(/-/g, ' ');
}
