import { MetadataRoute } from 'next';
import { getServerServices } from '@infrastructure/server/services';
import { SITE_URL, productPath } from '@utils/seo';

export const dynamic = 'force-dynamic';

/**
 * [LAYER: APP]
 * Dynamic Sitemap Generator.
 * Ensuring search engines can crawl all handle-based products and collections.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const services = await getServerServices();

  // 1. Static canonical routes. Account, cart, checkout, login, and search are intentionally excluded.
  const staticRoutes = [
    '',
    '/products',
    '/collections/all',
    '/blog',
    '/support',
  ].map((route) => ({
    url: `${SITE_URL}${route}`,
    lastModified: new Date(),
    changeFrequency: (route === '' || route === '/products' || route === '/blog') ? 'daily' as const : 'weekly' as const,
    priority: route === '' ? 1 : route === '/products' ? 0.9 : route === '/blog' ? 0.9 : 0.8,
  }));

  // 2. Fetch all products
  const productData = await services.productService.getProducts({ limit: 1000 });
  const productRoutes = productData.products.filter((product) => product.status === 'active').map((product) => ({
    url: `${SITE_URL}${productPath(product)}`,
    lastModified: product.updatedAt,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  // 3. Fetch all categories
  const categories = await services.taxonomyService.getAllCategories();
  const collectionRoutes = categories.map((category) => ({
    url: `${SITE_URL}/collections/${category.slug}`,
    lastModified: category.updatedAt,
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }));

  const merchCollections = await services.collectionService.list({ status: 'active', limit: 1000 });
  const merchCollectionRoutes = merchCollections.map((collection) => ({
    url: `${SITE_URL}/collections/${collection.handle}`,
    lastModified: collection.updatedAt,
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }));

  // 4. Fetch all blog posts
  const blogData = await services.knowledgebaseRepository.getArticles({ type: 'blog', status: 'published' });
  const blogRoutes = blogData.articles.map((post) => ({
    url: `${SITE_URL}/blog/${post.slug}`,
    lastModified: post.updatedAt || post.publishedAt || new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.5,
  }));

  return [...staticRoutes, ...productRoutes, ...collectionRoutes, ...merchCollectionRoutes, ...blogRoutes];
}
