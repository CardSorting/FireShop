import { Suspense } from 'react';
import { ProductsPage } from '@ui/pages/ProductsPage';
import type { Metadata } from 'next';
import { getServerServices } from '@infrastructure/server/services';
import { notFound } from 'next/navigation';
import type { ProductCategory } from '@domain/models';



async function getCategory(slug: string) {
  const services = await getServerServices();
  try {
    const categories = await services.taxonomyService.getAllCategories();
    return categories.find((c: ProductCategory) => c.slug === slug) || null;
  } catch {

    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategory(slug);
  
  if (!category) {
    const fallbackTitle = slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    return {
      title: `${fallbackTitle} | DreamBeesArt`,
    };
  }

  return {
    title: `${category.name} | DreamBeesArt`,
    description: category.description || `Shop our curated collection of ${category.name}. Fast shipping and guaranteed authenticity.`,
    alternates: {
      canonical: `/collections/${category.slug}`,
    },
    openGraph: {
      title: category.name,
      description: category.description || '',
      type: 'website',
    },
  };
}

export default async function CollectionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const category = await getCategory(slug);
  
  if (!category && slug !== 'all') {
    // If it's not the special 'all' collection and not found, 404
    // Wait, let's check if 'all' is handled. 
    // Actually, if it's not found in taxonomy, it should probably 404 or show a generic page.
  }
  
  // Industry Standard: Breadcrumb structured data for categories
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://dreambeesart.com',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: category?.name || 'Catalog',
        item: `https://dreambeesart.com/collections/${slug}`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Suspense fallback={<div className="mx-auto max-w-7xl px-4 py-12 text-sm font-bold text-gray-500">Loading collection...</div>}>
        <ProductsPage />
      </Suspense>
    </>
  );
}

