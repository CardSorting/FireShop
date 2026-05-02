import { Suspense } from 'react';
import { ProductsPage } from '@ui/pages/ProductsPage';
import type { Metadata } from 'next';

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const category = params.slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  return {
    title: `${category} | PlayMoreTCG`,
    description: `Shop our curated collection of ${category}. Fast shipping and guaranteed authenticity.`,
  };
}

export default function CollectionPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-7xl px-4 py-12 text-sm font-bold text-gray-500">Loading collection...</div>}>
      <ProductsPage />
    </Suspense>
  );
}
