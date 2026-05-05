import { Suspense } from 'react';
import { ProductsPage } from '@ui/pages/ProductsPage';
import type { Metadata } from 'next';
import { getServerServices } from '@infrastructure/server/services';
import { notFound } from 'next/navigation';
import type { ProductCategory } from '@domain/models';
import { absoluteUrl, breadcrumbJsonLd, seoDescription } from '@utils/seo';



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

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const { slug } = await params;
  const filters = await searchParams;
  const resolved = await getCategoryOrCollection(slug);
  const hasFilters = Object.keys(filters).length > 0;
  
  if (!resolved) {
    const fallbackTitle = slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    return {
      title: `${fallbackTitle} | DreamBeesArt`,
      alternates: {
        canonical: `/collections/${slug}`,
      },
      robots: hasFilters ? { index: false, follow: true } : undefined,
    };
  }

  const description = seoDescription(
    resolved.data.description,
    `Shop ${resolved.data.name} at DreamBeesArt. Discover handcrafted artist trading cards, art prints, and collector accessories.`
  );
  const images = resolved.type === 'collection' && resolved.data.imageUrl ? [absoluteUrl(resolved.data.imageUrl)] : [];

  return {
    title: `${resolved.data.name} | DreamBeesArt`,
    description,
    alternates: {
      canonical: `/collections/${slug}`,
    },
    robots: hasFilters ? { index: false, follow: true } : undefined,
    openGraph: {
      title: resolved.data.name,
      description,
      type: 'website',
      url: absoluteUrl(`/collections/${slug}`),
      images,
    },
    twitter: {
      card: 'summary_large_image',
      title: resolved.data.name,
      description,
      images,
    },
  };
}

export default async function CollectionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const resolved = await getCategoryOrCollection(slug);
  
  if (!resolved && slug !== 'all') {
    notFound();
  }
  
  const jsonLd = breadcrumbJsonLd([
    { name: 'Home', path: '/' },
    { name: 'Catalog', path: '/products' },
    { name: resolved?.data.name || 'All Products', path: `/collections/${slug}` },
  ]);

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
