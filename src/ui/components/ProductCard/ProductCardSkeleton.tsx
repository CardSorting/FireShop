'use client';

import React from 'react';

export function ProductCardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Image Area */}
      <div className="aspect-4/5 bg-gray-100 rounded-4xl border border-gray-100" />
      
      {/* Meta Area */}
      <div className="space-y-3 px-1">
        <div className="flex justify-between items-center">
          <div className="h-2 w-16 bg-gray-50 rounded-full" />
          <div className="h-2 w-8 bg-gray-50 rounded-full" />
        </div>
        <div className="h-4 w-3/4 bg-gray-100 rounded-lg" />
        <div className="h-6 w-1/4 bg-gray-50 rounded-lg" />
      </div>
    </div>
  );
}
