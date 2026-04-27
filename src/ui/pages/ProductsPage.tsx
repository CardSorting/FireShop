'use client';

/**
 * [LAYER: UI]
 */
import { useCallback, useEffect, useState } from 'react';
import { useServices } from '../hooks/useServices';
import type { Product } from '@domain/models';
import { Search, Filter } from 'lucide-react';
import Link from 'next/link';

export function ProductsPage() {
  const services = useServices();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>('all');
  const [nextCursor, setNextCursor] = useState<string | undefined>();

  const categories = [
    { id: 'all', name: 'All Products' },
    { id: 'pokemon', name: 'Pokemon' },
    { id: 'mtg', name: 'Magic: The Gathering' },
    { id: 'yugioh', name: 'Yu-Gi-Oh!' },
    { id: 'booster-boxes', name: 'Booster Boxes' },
  ];

  const loadProducts = useCallback(async (cursor?: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await services.productService.getProducts({
        category: category === 'all' ? undefined : category,
        limit: 20,
        cursor,
      });
      setProducts(result.products);
      setNextCursor(result.nextCursor);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [category, services.productService]);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  const handleSearch = async (value: string) => {
    setSearch(value);
    if (value.trim()) {
      setLoading(true);
      try {
        const result = await services.productService.getProducts({
          limit: 20,
        });
        const filtered = result.products.filter((p: Product) =>
          p.name.toLowerCase().includes(value.toLowerCase())
        );
        setProducts(filtered);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to search products');
      } finally {
        setLoading(false);
      }
    } else {
      setProducts([]);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Hero */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Shop TCG Cards
          </h1>
          <p className="text-gray-500">Find your favorite cards</p>
        </div>

        <div className="flex flex-col md:flex-row gap-6 mb-8">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search products..."
                className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          {/* Category Filter */}
          <div className="w-full md:w-auto">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  setSearch('');
                }}
                className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 appearance-none"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Results */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-lg">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading...</div>
        ) : products.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No products found
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((p) => (
                <article
                  key={p.id}
                  className="bg-white rounded-lg shadow-sm border overflow-hidden hover:shadow-md transition"
                >
                  <Link href={`/products/${p.id}`} className="block aspect-square overflow-hidden">
                    <img
                      src={p.imageUrl}
                      alt={p.name}
                      className="w-full h-full object-cover"
                    />
                  </Link>
                  <div className="p-4">
                    <p className="text-xs text-primary-600 font-medium uppercase mb-1">
                      {p.category}
                    </p>
                    <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 mb-2">
                      <Link href={`/products/${p.id}`} className="hover:text-primary-600">
                        {p.name}
                      </Link>
                    </h3>
                    <div className="flex items-center justify-between">
                      <p className="text-lg font-bold text-gray-900">
                        ${(p.price / 100).toFixed(2)}
                      </p>
                      <span className="text-sm text-gray-500">
                        Stock: {p.stock > 0 ? `${p.stock} in stock` : 'Out of stock'}
                      </span>
                    </div>
                    <div className="mt-3">
                      <Link
                        href={`/products/${p.id}`}
                        className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                      >
                        View details
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {nextCursor && !search && (
              <div className="mt-8 text-center">
                <button
                  onClick={() => void loadProducts(nextCursor)}
                  className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
                >
                  Load More
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}