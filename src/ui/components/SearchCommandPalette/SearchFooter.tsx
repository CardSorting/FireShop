'use client';

import React from 'react';

export function SearchFooter() {
  return (
    <footer className="px-6 py-4 bg-gray-50 border-t flex items-center justify-between shrink-0 max-sm:hidden">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 text-[10px] font-black text-gray-300 uppercase tracking-widest">
          <kbd className="flex h-5 min-w-[20px] items-center justify-center rounded-md border bg-white px-1 shadow-sm font-sans font-bold text-gray-400">↑↓</kbd>
          Navigate
        </div>
        <div className="flex items-center gap-2 text-[10px] font-black text-gray-300 uppercase tracking-widest">
          <kbd className="flex h-5 min-w-[20px] items-center justify-center rounded-md border bg-white px-1 shadow-sm font-sans font-bold text-gray-400">Enter</kbd>
          Select
        </div>
      </div>
      <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">DreamBees AI Discovery v2.0</p>
    </footer>
  );
}
