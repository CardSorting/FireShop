'use client';

/**
 * [LAYER: UI]
 */
import { useCallback, useEffect, useState } from 'react';
import { useServices } from '../hooks/useServices';
import { useAuth } from '../hooks/useAuth';
import { useCart } from '../hooks/useCart';
import type { Product, ProductCategory } from '@domain/models';
import { Search, Filter, ShoppingBag, ChevronRight, PackageSearch, RefreshCcw, Heart, Check, X, LayoutGrid, Grid3X3, Grid2X2 } from 'lucide-react';
import { useWishlist } from '../hooks/useWishlist';
import Link from 'next/link';
import { useSearchParams, useRouter, useParams } from 'next/navigation';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { getProductUrl, getCollectionUrl, STORE_PATHS } from '@utils/navigation';
import { logger } from '@utils/logger';
import { ProductCard } from '../components/ProductCard';
import { ProductCardSkeleton } from '../components/ProductCard/ProductCardSkeleton';
import { QuickViewModal } from '../components/QuickViewModal';
import type { Collection } from '@domain/models';


export function ProductsPage({ resolvedType, resolvedSlug }: { resolvedType?: 'category' | 'collection'; resolvedSlug?: string } = {}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const params = useParams();
  // Fallback to params if no resolved props provided (for compatibility)
  const fallbackSlug = (params?.slug as string | undefined) || (params?.handle as string | undefined); 
  const collectionSlug = resolvedSlug || fallbackSlug;
  const { addItem } = useCart();

  const services = useServices();
  const [sortBy, setSortBy] = useState<string>('newest');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100000]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [gridCols, setGridCols] = useState(3);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [collectionInfo, setCollectionInfo] = useState<{ name: string; description: string; imageUrl?: string } | null>(null);

  const conditions = ['New', 'Like New', 'Gently Used', 'Vintage'];
  const availabilityOptions = [
    { label: 'In Stock', value: 'in_stock' },
    { label: 'Out of Stock', value: 'out_of_stock' }
  ];
  const [selectedAvailability, setSelectedAvailability] = useState<string[]>([]);

  // Initialize state from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const categoryParam = params.get('category');
    const conditionParam = params.get('condition');
    const minPrice = params.get('min_price');
    const maxPrice = params.get('max_price');
    const sort = params.get('sort_by');
    const q = params.get('q') || params.get('search');

    const availParam = params.get('availability');

    if (availParam) setSelectedAvailability(availParam.split(','));
    if (collectionSlug) {
      if (collectionSlug === 'all') {
        // Handle the 'all' special case by not filtering by category or collection
      } else if (resolvedType === 'category') {
        setSelectedCategories([collectionSlug]);
      } else if (resolvedType === 'collection') {
        // We'll handle this in the loadProducts call by passing the collectionSlug
      } else {
        // Legacy behavior if type is unknown
        setSelectedCategories([collectionSlug]);
      }
    } else if (categoryParam) {
      setSelectedCategories(categoryParam.split(','));
    }
    
    if (conditionParam) setSelectedConditions(conditionParam.split(','));
    if (minPrice && maxPrice) setPriceRange([parseInt(minPrice), parseInt(maxPrice)]);
    if (sort) setSortBy(sort);
    if (q) setSearch(q);
  }, []);

  // Sync state to URL
  useEffect(() => {
    const params = new URLSearchParams();
    
    // Standardize filters: mirror Shopify's readable pattern
    if (selectedCategories.length > 0) {
      params.set('category', selectedCategories.join(','));
    }
    
    if (selectedConditions.length > 0) {
      params.set('condition', selectedConditions.join(','));
    }
    
    if (selectedAvailability.length > 0) {
      params.set('availability', selectedAvailability.join(','));
    }
    
    if (priceRange[0] > 0) params.set('min_price', priceRange[0].toString());
    if (priceRange[1] < 100000) params.set('max_price', priceRange[1].toString());
    if (sortBy !== 'newest') params.set('sort_by', sortBy);
    if (search.trim()) params.set('q', search.trim());

    const queryString = params.toString();
    const currentPath = window.location.pathname;
    const newUrl = queryString ? `${currentPath}?${queryString}` : currentPath;
    
    // Industry standard: Use router.replace for non-invasive URL updates during filtering
    // and keep state synchronized with the URL as the source of truth.
    router.replace(newUrl, { scroll: false });
  }, [selectedCategories, selectedConditions, selectedAvailability, priceRange, sortBy, search, router]);


  useEffect(() => {
    const loadMetadata = async () => {
      if (!collectionSlug || collectionSlug === 'all') {
        setCollectionInfo(null);
        return;
      }
      try {
        if (resolvedType === 'category') {
          const cats = await services.taxonomyService.getCategories();
          const cat = cats.find((c: any) => c.slug === collectionSlug);
          if (cat) setCollectionInfo({ name: cat.name, description: cat.description || '' });
        } else if (resolvedType === 'collection') {
          const col = await services.collectionService.getCollectionByHandle(collectionSlug);
          if (col) setCollectionInfo({ name: col.name, description: col.description || '', imageUrl: col.imageUrl });
        }
      } catch (err) {
        // Silently handle 404s for metadata lookups to prevent UI crashes in dev/prod
        logger.warn(`Metadata lookup failed for ${resolvedType}:${collectionSlug}`, err);
      }
    };
    void loadMetadata();
  }, [collectionSlug, resolvedType, services]);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await services.taxonomyService.getCategories();
        setCategories(data);
      } catch (err) {
        console.error('Failed to load categories', err);
      }
    };
    void loadCategories();
  }, [services.taxonomyService]);

  const loadProducts = useCallback(async (cursor?: string) => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    try {
      const isCollectionType = resolvedType === 'collection';
      const result = await services.productService.getProducts({
        category: !isCollectionType && selectedCategories.length > 0 ? selectedCategories[0] : undefined,
        collection: isCollectionType && collectionSlug ? collectionSlug : undefined,
        limit: 20,
        cursor,
      });
      
      let filtered = result.products;
      
      // Client-side filtering simulation (Industrial Robustness)
      if (selectedConditions.length > 0) {
        filtered = filtered.filter(p => selectedConditions.includes(String(p.metafields?.condition || 'New')));
      }
      
      if (selectedAvailability.length > 0) {
        filtered = filtered.filter(p => {
          if (selectedAvailability.includes('in_stock') && p.stock > 0) return true;
          if (selectedAvailability.includes('out_of_stock') && p.stock === 0) return true;
          return false;
        });
      }
      
      filtered = filtered.filter(p => p.price >= priceRange[0] && p.price <= priceRange[1]);

      // Sorting
      if (sortBy === 'price_asc') filtered.sort((a, b) => a.price - b.price);
      if (sortBy === 'price_desc') filtered.sort((a, b) => b.price - a.price);
      if (sortBy === 'name') filtered.sort((a, b) => a.name.localeCompare(b.name));

      setProducts(prev => cursor ? [...prev, ...filtered] : filtered);
      setNextCursor(result.nextCursor ?? null);
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      setError(err instanceof Error ? err.message : 'Failed to load products');
    } finally {
      setLoading(false);
    }
    return () => controller.abort();
  }, [selectedCategories, selectedConditions, selectedAvailability, priceRange, sortBy, services.productService, resolvedType, collectionSlug]);

  const handleSearch = useCallback(async (value: string) => {
    setSearch(value);
    // URL sync handles the state update
  }, []);

  const clearAllFilters = () => {
    setSelectedCategories([]);
    setSelectedConditions([]);
    setSelectedAvailability([]);
    setPriceRange([0, 100000]);
    setSearch('');
    setSortBy('newest');
    router.push(STORE_PATHS.PRODUCTS);
  };

  useEffect(() => {
    // Initial load handled by URL state initialization
    void loadProducts();
  }, [loadProducts]);

  const handleQuickAdd = async (productId: string) => {
    try {
      await addItem(productId, 1);
      window.dispatchEvent(new CustomEvent('open-cart'));
    } catch (err) {
      console.error('Quick add failed', err);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {quickViewProduct && (
        <QuickViewModal 
          product={quickViewProduct}
          onClose={() => setQuickViewProduct(null)}
          onAddToCart={handleQuickAdd}
          isFavorited={useWishlist().isInWishlist(quickViewProduct.id)}
          onToggleFavorite={async (id) => {
            const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();
            if (isInWishlist(id)) await removeFromWishlist(id);
            else await addToWishlist(id);
          }}
        />
      )}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Breadcrumbs */}
        <Breadcrumbs items={[{ label: 'Catalog' }]} />

        {/* Header */}
        <div className="mb-16">
           <h1 className="text-6xl font-black text-gray-900 tracking-tighter mb-6">
             {collectionInfo?.name || 'The Catalog'}
           </h1>
           <div className="h-1.5 w-24 bg-primary-600 rounded-full mb-8" />
           <p className="text-xl text-gray-500 font-medium max-w-2xl leading-relaxed">
             {collectionInfo?.description || 'Browse our curated collection of artist trading cards, prints, and TCG accessories. Every item is handcrafted by independent creators.'}
           </p>
        </div>

        {/* Search & Sort Bar */}
        <div className="flex flex-col lg:flex-row items-center gap-6 mb-16">
           <div className="relative flex-1 group w-full">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-primary-600 transition-colors" />
              <input
                type="text"
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search catalog..."
                className="w-full pl-16 pr-8 py-6 bg-gray-50 border-none rounded-3xl text-xl font-bold focus:bg-white focus:ring-4 focus:ring-primary-500/5 transition-all outline-none"
              />
           </div>
           <div className="flex items-center gap-4 w-full lg:w-auto">
              <button 
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className="flex-1 lg:flex-none flex items-center justify-center gap-3 px-10 py-6 rounded-3xl bg-gray-900 text-white font-black text-xs uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-gray-200"
              >
                <Filter className="w-4 h-4" /> Filters
              </button>
              <div className="relative flex-1 lg:flex-none min-w-[240px]">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-10 py-6 bg-gray-50 border-none rounded-3xl font-black text-xs uppercase tracking-widest text-gray-900 appearance-none focus:bg-white focus:ring-4 focus:ring-primary-500/5 outline-none cursor-pointer"
                >
                  <option value="newest">Sort By: Newest</option>
                  <option value="price_asc">Sort By: Price Low-High</option>
                  <option value="price_desc">Sort By: Price High-Low</option>
                  <option value="name">Sort By: Alphabetical</option>
                </select>
                <ChevronRight className="absolute right-8 top-1/2 -translate-y-1/2 w-4 h-4 rotate-90 text-gray-400 pointer-events-none" />
              </div>

              {/* Grid Density Controls */}
              <div className="hidden lg:flex items-center gap-2 p-1 bg-gray-50 rounded-2xl ml-4">
                <button 
                  onClick={() => setGridCols(2)}
                  className={`p-3 rounded-xl transition-all ${gridCols === 2 ? 'bg-white text-gray-900 shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  <Grid2X2 className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => setGridCols(3)}
                  className={`p-3 rounded-xl transition-all ${gridCols === 3 ? 'bg-white text-gray-900 shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  <Grid3X3 className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => setGridCols(4)}
                  className={`p-3 rounded-xl transition-all ${gridCols === 4 ? 'bg-white text-gray-900 shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  <LayoutGrid className="w-5 h-5" />
                </button>
              </div>
           </div>
        </div>

        {/* Active Filters (Pills) */}
        {(selectedCategories.length > 0 || selectedConditions.length > 0 || selectedAvailability.length > 0 || search || priceRange[0] > 0 || priceRange[1] < 100000) && (
          <div className="flex flex-wrap items-center gap-3 mb-12 animate-in fade-in slide-in-from-top-4 duration-500">
             <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 mr-2 shrink-0">
                <Filter className="w-3 h-3" />
                Active Filters:
             </div>
             <div className="flex flex-wrap items-center gap-2">
                {search && (
                  <button 
                    onClick={() => setSearch('')}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-900 text-white text-[10px] font-black uppercase tracking-widest hover:bg-primary-600 transition-all border border-transparent shadow-lg shadow-gray-200"
                  >
                    "{search}" <X className="w-3 h-3" />
                  </button>
                )}
                {selectedCategories.map(slug => {
                  const cat = categories.find(c => c.slug === slug);
                  return (
                    <button 
                      key={slug}
                      onClick={() => setSelectedCategories(selectedCategories.filter(s => s !== slug))}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-50 text-primary-700 text-[10px] font-black uppercase tracking-widest hover:bg-primary-100 transition-all border border-primary-100"
                    >
                      {cat?.name || slug} <X className="w-3 h-3" />
                    </button>
                  );
                })}
                {selectedConditions.map(cond => (
                  <button 
                    key={cond}
                    onClick={() => setSelectedConditions(selectedConditions.filter(c => c !== cond))}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-50 text-amber-700 text-[10px] font-black uppercase tracking-widest hover:bg-amber-100 transition-all border border-amber-100"
                  >
                    {cond} <X className="w-3 h-3" />
                  </button>
                ))}
                {selectedAvailability.map(avail => (
                  <button 
                    key={avail}
                    onClick={() => setSelectedAvailability(selectedAvailability.filter(a => a !== avail))}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-50 text-green-700 text-[10px] font-black uppercase tracking-widest hover:bg-green-100 transition-all border border-green-100"
                  >
                    {avail === 'in_stock' ? 'In Stock' : 'Out of Stock'} <X className="w-3 h-3" />
                  </button>
                ))}
                {(priceRange[0] > 0 || priceRange[1] < 100000) && (
                  <button 
                    onClick={() => setPriceRange([0, 100000])}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-50 text-blue-700 text-[10px] font-black uppercase tracking-widest hover:bg-blue-100 transition-all border border-blue-100"
                  >
                    ${(priceRange[0] / 100).toFixed(0)} - ${(priceRange[1] / 100).toFixed(0)} <X className="w-3 h-3" />
                  </button>
                )}
                <button 
                  onClick={clearAllFilters}
                  className="text-[10px] font-black text-gray-400 hover:text-red-500 uppercase tracking-widest ml-2 underline underline-offset-4 decoration-2"
                >
                  Clear All
                </button>
             </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
          {/* Filter Sidebar */}
          <aside className={`lg:col-span-3 space-y-12 sticky top-32 ${isFilterOpen ? 'block' : 'hidden lg:block'}`}>
            <section>
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-6">Product Type</h3>
              <div className="space-y-3">
                {categories.map((cat) => (
                  <label key={cat.id} className="flex items-center gap-3 group cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(cat.slug)}
                      onChange={(e) => {
                        const next = e.target.checked 
                          ? [...selectedCategories, cat.slug]
                          : selectedCategories.filter(slug => slug !== cat.slug);
                        setSelectedCategories(next);
                      }}
                      className="h-5 w-5 rounded-lg border-gray-200 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm font-bold text-gray-600 group-hover:text-gray-900 transition-colors">{cat.name}</span>
                  </label>
                ))}
              </div>
            </section>

            <section>
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-6">Condition</h3>
              <div className="space-y-3">
                {conditions.map((cond) => (
                  <label key={cond} className="flex items-center gap-3 group cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedConditions.includes(cond)}
                      onChange={(e) => {
                        const next = e.target.checked 
                          ? [...selectedConditions, cond]
                          : selectedConditions.filter(c => c !== cond);
                        setSelectedConditions(next);
                      }}
                      className="h-5 w-5 rounded-lg border-gray-200 text-primary-600 focus:ring-primary-500 transition-all"
                    />
                    <span className="text-sm font-bold text-gray-600 group-hover:text-gray-900 transition-colors">{cond}</span>
                  </label>
                ))}
              </div>
            </section>

            <section>
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-6">Availability</h3>
              <div className="space-y-3">
                {availabilityOptions.map((opt) => (
                  <label key={opt.value} className="flex items-center gap-3 group cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedAvailability.includes(opt.value)}
                      onChange={(e) => {
                        const next = e.target.checked 
                          ? [...selectedAvailability, opt.value]
                          : selectedAvailability.filter(a => a !== opt.value);
                        setSelectedAvailability(next);
                      }}
                      className="h-5 w-5 rounded-lg border-gray-200 text-primary-600 focus:ring-primary-500 transition-all"
                    />
                    <span className="text-sm font-bold text-gray-600 group-hover:text-gray-900 transition-colors">{opt.label}</span>
                  </label>
                ))}
              </div>
            </section>

            <section>
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-6">Price Range</h3>
              <div className="space-y-6">
                 <div className="flex items-center gap-4">
                    <div className="flex-1">
                       <p className="text-[8px] font-black uppercase text-gray-400 mb-1">Min</p>
                       <input 
                         type="number" 
                         value={priceRange[0]} 
                         onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
                         className="w-full bg-gray-50 border-none rounded-xl px-3 py-2 text-xs font-bold"
                       />
                    </div>
                    <div className="flex-1">
                       <p className="text-[8px] font-black uppercase text-gray-400 mb-1">Max</p>
                       <input 
                         type="number" 
                         value={priceRange[1]} 
                         onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                         className="w-full bg-gray-50 border-none rounded-xl px-3 py-2 text-xs font-bold"
                       />
                    </div>
                 </div>
              </div>
            </section>
            
            <button 
              onClick={() => {
                setSelectedCategories([]);
                setSelectedConditions([]);
                setPriceRange([0, 100000]);
                setSortBy('newest');
              }}
              className="w-full py-4 border-2 border-gray-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-400 hover:bg-gray-50 hover:text-gray-900 transition-all"
            >
              Clear All Filters
            </button>
          </aside>

          {/* Results Grid */}
          <div className="lg:col-span-9">
            {loading && products.length === 0 ? (
              <div className={`grid grid-cols-1 sm:grid-cols-2 ${gridCols === 2 ? 'xl:grid-cols-2' : gridCols === 3 ? 'xl:grid-cols-3' : 'xl:grid-cols-4'} gap-8`}>
                {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                  <ProductCardSkeleton key={i} />
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="py-32 text-center rounded-[3rem] bg-gray-50 border border-gray-100 px-6">
                <div className="inline-flex h-24 w-24 items-center justify-center rounded-full bg-white shadow-xl mb-8">
                  <PackageSearch className="h-10 w-10 text-gray-200" />
                </div>
                <h3 className="text-3xl font-black text-gray-900 mb-4 tracking-tight">No results matched your filters</h3>
                <p className="text-gray-500 mb-10 max-w-sm mx-auto font-medium">Try broadening your search or adjusting your price range to discover more items.</p>
                <button 
                  onClick={() => { setSelectedCategories([]); setSelectedConditions([]); setPriceRange([0, 100000]); }}
                  className="px-8 py-4 bg-gray-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest"
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-8">
                   <p className="text-sm font-bold text-gray-400 tracking-tight">Showing <span className="text-gray-900">{products.length}</span> items</p>
                </div>
                <div className={`grid grid-cols-1 sm:grid-cols-2 ${gridCols === 2 ? 'xl:grid-cols-2' : gridCols === 3 ? 'xl:grid-cols-3' : 'xl:grid-cols-4'} gap-x-8 gap-y-16 animate-in fade-in duration-700`}>
                  {products.map((p, i) => (
                    <ProductCard 
                      key={p.id} 
                      product={p} 
                      onAddToCart={handleQuickAdd}
                      onQuickView={setQuickViewProduct}
                      priority={i < (gridCols * 2)}
                    />
                  ))}
                </div>

                {nextCursor && !search && (
                  <div className="mt-20 text-center">
                    <button
                      onClick={() => void loadProducts(nextCursor)}
                      className="inline-flex items-center gap-3 rounded-4xl bg-gray-900 px-12 py-5 font-black text-xs uppercase tracking-widest text-white shadow-2xl transition hover:bg-black hover:-translate-y-1 active:translate-y-0"
                    >
                      Load More Items <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

