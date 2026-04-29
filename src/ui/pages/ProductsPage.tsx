'use client';

/**
 * [LAYER: UI]
 */
import { useCallback, useEffect, useState } from 'react';
import { useServices } from '../hooks/useServices';
import { useAuth } from '../hooks/useAuth';
import { useCart } from '../hooks/useCart';
import type { Product, ProductCategory } from '@domain/models';
import { Search, Filter, ShoppingBag, ChevronRight, PackageSearch, RefreshCcw } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

export function ProductsPage() {
  const searchParams = useSearchParams();
  const services = useServices();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>('all');
  const [nextCursor, setNextCursor] = useState<string | undefined>();
  const [recommendations, setRecommendations] = useState<Product[]>([]);
  const [loadingRecs, setLoadingRecs] = useState(false);

  const categories: Array<{ id: ProductCategory | 'all'; name: string }> = [
    { id: 'all', name: 'All Products' },
    { id: 'single', name: 'Singles' },
    { id: 'booster', name: 'Sealed Boosters' },
    { id: 'box', name: 'Booster Boxes' },
    { id: 'deck', name: 'Decks' },
    { id: 'accessory', name: 'Accessories' },
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

  const handleSearch = useCallback(async (value: string) => {
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
  }, [services.productService]);

  // Sync search from URL
  useEffect(() => {
    const query = searchParams.get('search');
    const categoryParam = searchParams.get('category');
    const validCategory = categories.some((cat) => cat.id === categoryParam);

    if (validCategory && categoryParam) {
      setCategory(categoryParam);
    }

    if (query) {
      setSearch(query);
      handleSearch(query);
    } else {
      void loadProducts();
    }
  }, [searchParams, loadProducts, handleSearch]);

  // Load recommendations for empty states
  const loadRecommendations = useCallback(async () => {
    setLoadingRecs(true);
    try {
      const result = await services.productService.getProducts({ limit: 4 });
      setRecommendations(result.products);
    } catch (err) {
      console.error('Failed to load recommendations', err);
    } finally {
      setLoadingRecs(false);
    }
  }, [services.productService]);

  useEffect(() => {
    void loadRecommendations();
  }, [loadRecommendations]);


  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero / Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-2">
              Explore the Catalog
            </h1>
            <p className="text-gray-500 font-medium">Discover rare cards and complete your sets.</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Category Filter */}
            <div className="relative min-w-[200px]">
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  setSearch('');
                  // Update URL would be better, but let's keep it simple for now
                }}
                className="w-full pl-10 pr-10 py-3 bg-gray-50 border-none rounded-2xl font-bold text-gray-700 focus:ring-2 focus:ring-primary-500 appearance-none transition-all cursor-pointer hover:bg-gray-100"
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

        {/* Search Bar (Secondary on this page since it's in Navbar too) */}
        <div className="mb-12">
          <div className="relative group max-w-2xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-primary-600 transition-colors" />
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search by name, set, or rarity..."
              className="w-full pl-12 pr-4 py-4 bg-white border-2 border-gray-100 rounded-2xl text-lg font-medium focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/5 transition-all shadow-sm"
            />
          </div>
        </div>

        {/* Results Container */}
        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-100 text-red-700 rounded-2xl flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            <span className="font-bold">{error}</span>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <div key={i} className="animate-pulse space-y-4">
                <div className="aspect-square bg-gray-100 rounded-3xl" />
                <div className="space-y-2">
                  <div className="h-3 w-1/4 bg-gray-100 rounded" />
                  <div className="h-5 w-3/4 bg-gray-100 rounded" />
                  <div className="h-4 w-1/2 bg-gray-50 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="py-20 text-center">
            <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-gray-50 mb-6">
              <PackageSearch className="h-10 w-10 text-gray-300" />
            </div>
            <h3 className="text-2xl font-black text-gray-900 mb-2">No results found</h3>
            <p className="text-gray-500 mb-8 max-w-xs mx-auto">We couldn't find any products matching "{search}". Try a different term or browse our favorites below.</p>
            
            {/* Recommendations in Empty State */}
            {recommendations.length > 0 && (
              <div className="mt-12 pt-12 border-t">
                <h4 className="text-lg font-black text-gray-900 mb-8 uppercase tracking-widest">Recommended for you</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                  {recommendations.map(p => (
                    <ProductCard key={p.id} product={p} />
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-12">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>

            {nextCursor && !search && (
              <div className="mt-16 text-center">
                <button
                  onClick={() => void loadProducts(nextCursor)}
                  className="inline-flex items-center gap-2 rounded-2xl bg-gray-900 px-10 py-4 font-black text-white shadow-xl transition hover:bg-black hover:-translate-y-0.5 active:translate-y-0 active:scale-95"
                >
                  Load More Items
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const [adding, setAdding] = useState(false);

  const handleQuickAdd = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setAdding(true);
    try {
      await addItem(product.id, 1);
    } finally {
      setAdding(false);
    }
  };

  return (
    <article className="group relative">
      <div className="aspect-square overflow-hidden rounded-3xl bg-gray-50 border shadow-sm transition-all duration-500 group-hover:shadow-2xl group-hover:-translate-y-2">
        <Link href={`/products/${product.id}`} className="block h-full w-full">
          <img
            src={product.imageUrl}
            alt={product.name}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
          />
        </Link>
        
        {/* Quick Add Overlay */}
        <div className="absolute inset-x-4 bottom-4 translate-y-8 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          <button
            onClick={handleQuickAdd}
            disabled={adding || product.stock === 0}
            className="w-full rounded-2xl bg-white/95 backdrop-blur-md p-4 shadow-xl flex items-center justify-center gap-2 font-black text-xs text-gray-900 uppercase hover:bg-primary-600 hover:text-white transition-all disabled:opacity-50"
          >
            {adding ? (
              <RefreshCcw className="h-4 w-4 animate-spin" />
            ) : product.stock === 0 ? (
              'Sold Out'
            ) : (
              <>
                <ShoppingBag className="h-4 w-4" /> Quick Add
              </>
            )}
          </button>
        </div>
      </div>
      
      <div className="mt-6">
        <div className="flex items-center justify-between mb-1">
          <p className="text-[10px] font-black uppercase tracking-widest text-primary-600">
            {product.category}
          </p>
          {product.stock < 5 && product.stock > 0 && (
            <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
              Low Stock
            </span>
          )}
        </div>
        
        <h3 className="text-base font-black text-gray-900 group-hover:text-primary-600 transition-colors line-clamp-1 mb-2">
          <Link href={`/products/${product.id}`}>{product.name}</Link>
        </h3>
        
        <div className="flex items-baseline gap-2">
          <p className="text-xl font-black text-gray-900">
            ${(product.price / 100).toFixed(2)}
          </p>
          {product.stock === 0 && (
            <span className="text-xs font-bold text-gray-400">Sold Out</span>
          )}
        </div>
      </div>
    </article>
  );
}
