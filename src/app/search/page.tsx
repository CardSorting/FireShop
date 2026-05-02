import { Suspense } from 'react';
import { ProductsPage } from '@ui/pages/ProductsPage';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Search Results | PlayMoreTCG',
  description: 'Search our extensive catalog of trading cards, sets, and supplies.',
};

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-7xl px-4 py-12 text-sm font-bold text-gray-500">Searching catalog...</div>}>
      <ProductsPage />
    </Suspense>
  );
}
