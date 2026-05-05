import { Suspense } from 'react';
import { ProductsPage } from '@ui/pages/ProductsPage';
import type { Metadata } from 'next';
import { breadcrumbJsonLd, cleanSeoText } from '@utils/seo';

type SearchProps = {
  searchParams: Promise<{ q?: string }>;
};

export async function generateMetadata({ searchParams }: SearchProps): Promise<Metadata> {
  const { q = '' } = await searchParams;
  const query = cleanSeoText(q);
  return {
    title: query ? `Search: ${query} | DreamBeesArt` : 'Search Catalog | DreamBeesArt',
    description: `Search our extensive catalog of trading cards, sets, and supplies. Results for ${query || 'all products'}.`,
    robots: {
      index: false,
      follow: true,
    },
    alternates: {
      canonical: '/search',
    },
  };
}


export default async function SearchPage({ searchParams }: SearchProps) {
  const { q = '' } = await searchParams;
  const query = cleanSeoText(q);
  
  const jsonLd = breadcrumbJsonLd([
    { name: 'Home', path: '/' },
    { name: 'Search Results', path: '/search' },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Suspense fallback={<div className="mx-auto max-w-7xl px-4 py-12 text-sm font-bold text-gray-500">Searching catalog...</div>}>
        <ProductsPage />
      </Suspense>
    </>
  );
}
