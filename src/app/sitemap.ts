import { MetadataRoute } from 'next';
import { getServerServices } from '@infrastructure/server/services';

export const dynamic = 'force-dynamic';

/**
 * [LAYER: APP]
 * Dynamic Sitemap Generator.
 * Ensuring search engines can crawl all handle-based products and collections.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const services = await getServerServices();
  const baseUrl = 'https://dreambeesart.com';

  // 1. Static Routes
  const staticRoutes = [
    '',
    '/products',
    '/collections',
    '/wishlist',
    '/cart',
    '/login',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1 : 0.8,
  }));

  // 2. Fetch all products
  const productData = await services.productService.getProducts({ limit: 1000 });
  const productRoutes = productData.products.map((product) => ({
    url: `${baseUrl}/products/${product.handle || product.id}`,
    lastModified: product.updatedAt,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  // 3. Fetch all categories
  const categories = await services.taxonomyService.getAllCategories();
  const collectionRoutes = categories.map((category) => ({
    url: `${baseUrl}/collections/${category.slug}`,
    lastModified: category.updatedAt,
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }));

  return [...staticRoutes, ...productRoutes, ...collectionRoutes];
}
