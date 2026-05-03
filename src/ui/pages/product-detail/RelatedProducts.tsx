'use client';

/**
 * Related Products grid & Recently Viewed carousel.
 * Pattern: Amazon/Shopify — "You may also like" + "Recently viewed"
 */
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { Product } from '@domain/models';
import { formatCurrency } from '@utils/formatters';
import { getProductUrl, STORE_PATHS } from '@utils/navigation';

interface RelatedProductsProps {
  products: Product[];
  loading: boolean;
  title?: string;
}

export function RelatedProducts({ products, loading, title = 'You May Also Like' }: RelatedProductsProps) {
  if (loading) {
    return (
      <section className="mt-24 pt-16 border-t border-gray-100">
        <h2 className="text-2xl font-black text-gray-900 tracking-tight mb-10">{title}</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="animate-pulse space-y-4">
              <div className="aspect-4/5 bg-gray-100 rounded-3xl" />
              <div className="h-4 w-3/4 bg-gray-100 rounded-lg" />
              <div className="h-4 w-1/3 bg-gray-100 rounded-lg" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (products.length === 0) return null;

  return (
    <section className="mt-24 pt-16 border-t border-gray-100">
      <div className="flex items-center justify-between mb-10">
        <h2 className="text-2xl font-black text-gray-900 tracking-tight">{title}</h2>
        <Link
          href={STORE_PATHS.PRODUCTS}
          className="flex items-center gap-1.5 text-xs font-bold text-gray-400 hover:text-primary-600 transition-colors"
        >
          View all <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {products.map(product => (
          <Link
            key={product.id}
            href={getProductUrl(product)}
            className="group block space-y-4"
          >
            <div className="aspect-4/5 rounded-3xl overflow-hidden bg-gray-50 border border-gray-100 transition-all duration-500 group-hover:shadow-2xl group-hover:-translate-y-1">
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">{product.category}</p>
              <h3 className="text-sm font-bold text-gray-900 group-hover:text-primary-600 transition-colors line-clamp-2 mb-1">{product.name}</h3>
              <p className="text-sm font-black text-gray-900">{formatCurrency(product.price)}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

interface RecentlyViewedProps {
  products: Product[];
  currentProductId?: string;
}

export function RecentlyViewed({ products, currentProductId }: RecentlyViewedProps) {
  const filtered = products.filter(p => p.id !== currentProductId).slice(0, 6);
  if (filtered.length === 0) return null;

  return (
    <section className="mt-20 pt-16 border-t border-gray-100">
      <h2 className="text-xl font-black text-gray-900 tracking-tight mb-8">Recently Viewed</h2>
      <div className="flex gap-5 overflow-x-auto scrollbar-hide pb-4">
        {filtered.map(product => (
          <Link
            key={product.id}
            href={getProductUrl(product)}
            className="group shrink-0 w-40 space-y-3"
          >
            <div className="aspect-4/5 rounded-2xl overflow-hidden bg-gray-50 border border-gray-100 transition-all duration-300 group-hover:shadow-lg group-hover:-translate-y-0.5">
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>
            <div>
              <h3 className="text-xs font-bold text-gray-900 group-hover:text-primary-600 transition-colors line-clamp-1">{product.name}</h3>
              <p className="text-xs font-bold text-gray-500 mt-0.5">{formatCurrency(product.price)}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
