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
    <div className="bg-white/80 backdrop-blur-xl border-b border-gray-100">
      <div className="max-w-[1600px] mx-auto px-4 flex items-center justify-between gap-8 h-16">
        <div 
          ref={scrollRef}
          className="flex items-center gap-6 overflow-x-auto no-scrollbar py-2"
        >
          <button
            onClick={() => onSelect('all')}
            className={`shrink-0 text-[10px] font-black uppercase tracking-[0.2em] transition-all relative py-2 ${
              selectedCategory === 'all' 
              ? 'text-gray-900 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-gray-900' 
              : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            All Stories
          </button>
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => onSelect(category.id)}
              className={`shrink-0 text-[10px] font-black uppercase tracking-[0.2em] transition-all relative py-2 ${
                selectedCategory === category.id 
                ? 'text-primary-600 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary-600' 
                : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>

        <div className="shrink-0 flex items-center bg-gray-100/50 p-1 rounded-xl">
           <button 
            onClick={() => onSortChange('new')}
            className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${sortBy === 'new' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
           >
             Latest
           </button>
           <button 
            onClick={() => onSortChange('popular')}
            className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${sortBy === 'popular' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
           >
             Trending
           </button>
        </div>
      </div>
    </div>
  );
}

