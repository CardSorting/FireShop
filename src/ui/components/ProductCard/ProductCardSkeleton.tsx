'use client';

import React from 'react';

export function ProductCardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Image Area */}
      <div className="aspect-4/5 rounded-4xl border border-primary-50/50 honey-shimmer" />
      
      {/* Meta Area */}
      <div className="space-y-3 px-1">
        <div className="flex justify-between items-center">
          <div className="h-2 w-16 rounded-full honey-shimmer" />
          <div className="h-2 w-8 rounded-full honey-shimmer" />
        </div>
        <div className="h-4 w-3/4 rounded-lg honey-shimmer" />
        <div className="h-6 w-1/4 rounded-lg honey-shimmer" />
      </div>
    </div>
  );
}
