'use client';

import React from 'react';
import { Search, Command, X } from 'lucide-react';

interface SearchHeaderProps {
  inputRef: React.RefObject<HTMLInputElement | null>;
  query: string;
  setQuery: (query: string) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onClose: () => void;
}

export function SearchHeader({ inputRef, query, setQuery, onKeyDown, onClose }: SearchHeaderProps) {
  return (
    <header className="flex items-center px-4 sm:px-6 border-b shrink-0 h-16 sm:h-20">
      <Search className="h-5 w-5 text-primary-500 shrink-0" />
      <input
        ref={inputRef}
        type="text"
        className="flex-1 border-none focus:ring-0 text-base sm:text-lg font-black placeholder:text-gray-300 text-gray-900 px-3 sm:px-4"
        placeholder="Search catalog..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={onKeyDown}
      />
      <div className="flex items-center gap-3">
        <kbd className="hidden md:flex h-6 items-center gap-1 rounded-md border bg-gray-50 px-2 font-mono text-[10px] font-bold text-gray-400">
          <Command className="h-2.5 w-2.5" /> K
        </kbd>
        <button 
          onClick={onClose}
          className="p-2 hover:bg-gray-50 rounded-xl transition-all text-gray-400 hover:text-gray-900"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}
