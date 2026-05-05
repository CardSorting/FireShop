import { MetadataRoute } from 'next';

/**
 * [LAYER: APP]
 * Robots.txt configuration.
 * Standard e-commerce configuration for crawling and indexing.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/account/',
          '/checkout/',
          '/cart/',
          '/api/',
          '/*?q=', // Avoid indexing internal search results
          '/*?sort_by=', // Avoid indexing sorted pages
          '/*?min_price=', // Avoid indexing price-filtered pages
          '/*?max_price=', // Avoid indexing price-filtered pages
          '/*?condition=', // Avoid indexing condition-filtered pages
          '/*?availability=', // Avoid indexing availability-filtered pages
          '/*?category=', // Avoid indexing category-filtered pages (handled by collections routes)
        ],
      },
    ],
    sitemap: 'https://dreambeesart.com/sitemap.xml',
  };
}
