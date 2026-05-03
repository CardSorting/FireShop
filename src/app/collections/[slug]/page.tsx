import { Suspense } from 'react';
import { ProductsPage } from '@ui/pages/ProductsPage';
import type { Metadata } from 'next';
import { getServerServices } from '@infrastructure/server/services';
import { notFound } from 'next/navigation';
import type { ProductCategory } from '@domain/models';



async function getCategoryOrCollection(slug: string) {
  const services = await getServerServices();
  try {
    const categories = await services.taxonomyService.getAllCategories();
    const category = categories.find((c: ProductCategory) => c.slug === slug);
    if (category) return { type: 'category' as const, data: category };
    
    // Also check collections
    const collection = await services.collectionService.getByHandle(slug);
    if (collection) return { type: 'collection' as const, data: collection };
    
    return null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const resolved = await getCategoryOrCollection(slug);
  
  if (!resolved) {
    const fallbackTitle = slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    return {
      title: `${fallbackTitle} | DreamBeesArt`,
    };
  }

  return {
    title: `${resolved.data.name} | DreamBeesArt`,
    description: resolved.data.description || `Shop our curated collection of ${resolved.data.name}. Fast shipping and guaranteed authenticity.`,
    alternates: {
      canonical: `/collections/${slug}`,
    },
    openGraph: {
      title: resolved.data.name,
      description: resolved.data.description || '',
      type: 'website',
    },
  };
}

export default async function CollectionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const resolved = await getCategoryOrCollection(slug);
  
  if (!resolved && slug !== 'all') {
    // If it's not the special 'all' collection and not found, 404 could be triggered
    // notFound();
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
        name: resolved?.data.name || 'Catalog',
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
        <ProductsPage resolvedType={resolved?.type} resolvedSlug={slug} />
      </Suspense>
    </>
  );
}

