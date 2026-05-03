'use client';

import React from 'react';
import { Sparkles, RefreshCcw, Search, Layers3, Archive, Zap } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getCollectionUrl } from '@utils/navigation';
import type { ProductCategory } from '@domain/models';

interface SearchEmptyStateProps {
  setQuery: (query: string) => void;
  recentSearches: string[];
  clearRecent: () => void;
  categories: ProductCategory[];
  onClose: () => void;
}

export function SearchEmptyState({ setQuery, recentSearches, clearRecent, categories, onClose }: SearchEmptyStateProps) {
  const router = useRouter();

  return (
    <div className="p-6 sm:p-10 space-y-12">
      <section>
        <div className="flex items-center gap-2 mb-6">
          <Sparkles className="h-3 w-3 text-amber-500" />
          <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Suggested For You</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {['Paintings', 'Digital Art', 'Sculptures', 'Posters', 'Limited Edition'].map((term) => (
            <button
              key={term}
              onClick={() => setQuery(term)}
              className="px-4 py-2.5 rounded-xl bg-gray-50 text-[11px] font-black text-gray-600 hover:bg-primary-50 hover:text-primary-600 transition-all border border-transparent hover:border-primary-100 uppercase tracking-widest"
            >
              {term}
            </button>
          ))}
        </div>
      </section>

      {recentSearches.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <RefreshCcw className="h-3 w-3 text-blue-500" />
              <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Recent Activity</h3>
            </div>
            <button 
              onClick={clearRecent}
              className="text-[9px] font-black uppercase text-gray-300 hover:text-red-500 transition-colors"
            >
              Clear All
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {recentSearches.map((term) => (
              <button
                key={term}
                onClick={() => setQuery(term)}
                className="flex items-center gap-3 p-4 rounded-xl hover:bg-gray-50 text-xs font-bold text-gray-700 group transition-all"
              >
                <Search className="w-3.5 h-3.5 text-gray-200 group-hover:text-primary-500" />
                {term}
              </button>
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="flex items-center gap-2 mb-6">
          <Layers3 className="h-3 w-3 text-primary-500" />
          <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Quick Collections</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {categories.slice(0, 4).map((cat, i) => {
            const icons = [Sparkles, Archive, Layers3, Zap];
            const Icon = icons[i % icons.length];
            return (
              <button
                key={cat.id}
                onClick={() => { onClose(); router.push(getCollectionUrl(cat.slug)); }}
                className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-gray-50/50 hover:bg-white transition-all border border-transparent hover:border-gray-100 hover:shadow-xl group"
              >
                <div className="p-3 rounded-xl bg-white shadow-sm text-gray-400 group-hover:text-primary-600 transition-colors">
                  <Icon className="h-6 w-6" />
                </div>
                <span className="text-[10px] font-black text-gray-900 uppercase tracking-widest truncate w-full text-center">{cat.name}</span>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
