/**
 * [LAYER: UI]
 */
'use client';
import React from 'react';
import { Hash, ChevronLeft, ChevronRight } from 'lucide-react';
import type { KnowledgebaseCategory } from '@domain/models';

interface CategoryNavigatorProps {
  categories: KnowledgebaseCategory[];
  selectedCategory: string;
  onSelect: (id: string) => void;
  sortBy: 'new' | 'popular';
  onSortChange: (sort: 'new' | 'popular') => void;
}

export function CategoryNavigator({ 
  categories, 
  selectedCategory, 
  onSelect,
  sortBy,
  onSortChange
}: CategoryNavigatorProps) {
  const scrollRef = React.useRef<HTMLDivElement>(null);

  return (
    <div className="bg-white/90 backdrop-blur-3xl rounded-3xl border border-gray-100 shadow-sm p-2 flex flex-col md:flex-row items-center justify-between gap-4 w-full">
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar w-full md:w-auto">
        <button
          onClick={() => onSelect('all')}
          className={`shrink-0 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${
            selectedCategory === 'all' 
            ? 'bg-gray-900 text-white shadow-xl' 
            : 'text-gray-500 hover:bg-gray-50'
          }`}
        >
          All Stories
        </button>
        {categories.map(category => (
          <button
            key={category.id}
            onClick={() => onSelect(category.id)}
            className={`shrink-0 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${
              selectedCategory === category.id 
              ? 'bg-primary-50 text-primary-600 shadow-sm border border-primary-100' 
              : 'text-gray-500 hover:bg-gray-50 border border-transparent'
            }`}
          >
            {category.name}
          </button>
        ))}
      </div>

      <div className="shrink-0 flex items-center bg-gray-50 p-1.5 rounded-2xl border border-gray-100 w-full md:w-auto">
         <button 
          onClick={() => onSortChange('new')}
          className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${sortBy === 'new' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
         >
           Latest
         </button>
         <button 
          onClick={() => onSortChange('popular')}
          className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${sortBy === 'popular' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
         >
           Trending
         </button>
      </div>
    </div>
  );
}

