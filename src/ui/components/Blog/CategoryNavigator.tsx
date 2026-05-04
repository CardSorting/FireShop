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

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollTo = direction === 'left' ? scrollLeft - clientWidth / 2 : scrollLeft + clientWidth / 2;
      scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  return (
    <div className="group/nav border-b border-gray-100 bg-white/80 backdrop-blur-xl sticky top-0 z-40 -mx-4 px-4 overflow-hidden">
      <div className="max-w-[1600px] mx-auto flex items-center gap-8 py-4">
        <div className="shrink-0 items-center gap-3 pr-8 border-r border-gray-100 hidden md:flex">
          <Hash className="h-4 w-4 text-primary-600" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 whitespace-nowrap">
            Topics
          </span>
        </div>

        <div className="relative flex-1 min-w-0">
          <div 
            ref={scrollRef}
            className="flex items-center gap-3 overflow-x-auto scrollbar-hide no-scrollbar py-2 px-2"
          >
            <button
              onClick={() => onSelect('all')}
              className={`shrink-0 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                selectedCategory === 'all' 
                ? 'bg-gray-900 text-white shadow-xl shadow-gray-900/20' 
                : 'bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              All Articles
            </button>
            {categories.map(category => (
              <button
                key={category.id}
                onClick={() => onSelect(category.id)}
                className={`shrink-0 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  selectedCategory === category.id 
                  ? 'bg-primary-600 text-white shadow-xl shadow-primary-600/20' 
                  : 'bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        <div className="shrink-0 pl-8 border-l border-gray-100 hidden sm:flex items-center gap-2">
           <button 
            onClick={() => onSortChange('new')}
            className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${sortBy === 'new' ? 'bg-gray-900 text-white' : 'text-gray-400 hover:text-gray-900'}`}
           >
             New
           </button>
           <button 
            onClick={() => onSortChange('popular')}
            className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${sortBy === 'popular' ? 'bg-gray-900 text-white' : 'text-gray-400 hover:text-gray-900'}`}
           >
             Top
           </button>
        </div>
      </div>
    </div>
  );
}

