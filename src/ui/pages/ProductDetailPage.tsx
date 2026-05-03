'use client';

/**
 * [LAYER: UI]
 */
import { useCallback, useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useServices } from '../hooks/useServices';
import { useAuth } from '../hooks/useAuth';
import { useCart } from '../hooks/useCart';
import type { Product, ProductVariant } from '@domain/models';
import { 
  X, ShoppingBag, Trash2, ChevronRight, LockKeyhole, Truck, 
  ShieldCheck, ArrowRight, Minus, Plus, CreditCard, Shield,
  Heart, Star, Zap, ShoppingCart, RefreshCcw, Info, Users,
  PackageCheck, Timer, Check, LifeBuoy, Download, Layers,
  ChevronDown
} from 'lucide-react';
import { useWishlist } from '../hooks/useWishlist';

import { MAX_CART_QUANTITY } from '@domain/rules';
import { logger } from '@utils/logger';
import { ProductReviews } from '../components/ProductReviews';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { getProductUrl, getCollectionUrl, STORE_PATHS } from '@utils/navigation';

function toFriendlyError(err: unknown): string {
  if (err instanceof Error && err.message) {
    if (/insufficient stock/i.test(err.message)) {
      const available = err.message.match(/available\s+(\d+)/i)?.[1];
      return available
        ? `Only ${available} available right now. Please choose a lower quantity.`
        : 'This item has limited availability. Please choose a lower quantity.';
    }
    return err.message;
  }
  return 'Unable to add this item to your cart right now.';
}

export function ProductDetailPage() {
  const { handle } = useParams<{ handle: string }>();

  const { addItem } = useCart();
  const services = useServices();
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingRelated, setLoadingRelated] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showWishlistDropdown, setShowWishlistDropdown] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [creatingCollection, setCreatingCollection] = useState(false);

  const { wishlists, isInWishlist, addToWishlist, createCollection, trackView } = useWishlist();
  const isFavorite = product?.id ? isInWishlist(product.id) : false;

  // --- VARIANT STATE ---
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [activeAccordion, setActiveAccordion] = useState<string | null>('about');

  const loadProduct = useCallback(async () => {
    if (!handle) return;
    setLoading(true);
    try {
      let loaded;
      try {
        loaded = await services.productService.getProductByHandle(handle);
      } catch {
        loaded = await services.productService.getProduct(handle);
      }
      setProduct(loaded);
      trackView(loaded);
      
      // Initialize default options
      if (loaded.hasVariants && loaded.options) {
        const initial: Record<string, string> = {};
        loaded.options.forEach(opt => {
          if (opt.values.length > 0) initial[opt.name] = opt.values[0];
        });
        setSelectedOptions(initial);
      }

      setLoadingRelated(true);
      try {
        const related = await services.productService.getProducts({ category: loaded.category, limit: 5 });
        setRelatedProducts(related.products.filter(p => p.id !== loaded.id).slice(0, 4));
      } catch (err) {
        logger.error('Failed to load related products', err);
      } finally {
        setLoadingRelated(false);
      }
    } catch (err) {
      logger.error('Failed to load product', err);
      setError('Product not found.');
    } finally {
      setLoading(false);
    }
  }, [handle, services.productService, trackView]);

  useEffect(() => {
    void loadProduct();
  }, [loadProduct]);

  // Handle "Recently Viewed"
  useEffect(() => {
    if (!product) return;
    const saved = localStorage.getItem('products:recently-viewed');
    const recent = saved ? JSON.parse(saved) : [];
    const updated = [product, ...recent.filter((p: Product) => p.id !== product.id)].slice(0, 10);
    localStorage.setItem('products:recently-viewed', JSON.stringify(updated));
  }, [product]);

  const [recentlyViewed, setRecentlyViewed] = useState<Product[]>([]);
  useEffect(() => {
    const saved = localStorage.getItem('products:recently-viewed');
    if (saved) setRecentlyViewed(JSON.parse(saved));
  }, [product]);

  // --- VARIANT MATCHING ---
  const selectedVariant = useMemo(() => {
    if (!product?.hasVariants || !product.variants) return null;
    
    return product.variants.find(v => {
      const match1 = v.option1 === selectedOptions[product.options![0]?.name];
      const match2 = !product.options![1] || v.option2 === selectedOptions[product.options![1].name];
      const match3 = !product.options![2] || v.option3 === selectedOptions[product.options![2].name];
      return match1 && match2 && match3;
    }) || null;
  }, [product, selectedOptions]);

  const currentPrice = selectedVariant ? selectedVariant.price : (product?.price ?? 0);
  const currentCompareAtPrice = selectedVariant ? selectedVariant.compareAtPrice : (product?.compareAtPrice ?? null);
  const currentStock = selectedVariant ? selectedVariant.stock : (product?.stock ?? 0);
  const currentImage = (selectedVariant?.imageUrl) || (product?.imageUrl);
  const currentSku = selectedVariant ? selectedVariant.sku : product?.sku;

  const maxSelectableQuantity = Math.max(1, Math.min(currentStock, MAX_CART_QUANTITY));

  async function handleAddToCart() {
    if (!product) return;
    setAdding(true);
    setError(null);
    try {
      await addItem(product.id, Math.min(quantity, maxSelectableQuantity), selectedVariant?.id);
      setAdded(true);
      setTimeout(() => setAdded(false), 2500);
    } catch (err) {
      setError(toFriendlyError(err));
    } finally {
      setAdding(false);
    }
  }

  async function handleAddToCollection(wishlistId: string) {
    if (!product?.id) return;
    await addToWishlist(product.id, wishlistId);
    setShowWishlistDropdown(false);
  }

  async function handleCreateAndAdd() {
    if (!newCollectionName.trim()) return;
    setCreatingCollection(true);
    try {
      const newList = await createCollection(newCollectionName.trim());
      if (product?.id) await addToWishlist(product.id, newList.id);
      setNewCollectionName('');
      setShowWishlistDropdown(false);
    } finally {
      setCreatingCollection(false);
    }
  }

  if (loading || !product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 animate-pulse">
        <div className="h-4 w-32 bg-gray-200 rounded mb-8" />
        <div className="grid grid-cols-12 gap-8">
          <div className="col-span-12 lg:col-span-5 aspect-square bg-gray-100 rounded-5xl" />
          <div className="col-span-12 lg:col-span-4 space-y-6">
            <div className="h-8 w-3/4 bg-gray-200 rounded-xl" />
            <div className="h-4 w-1/4 bg-gray-100 rounded-lg" />
            <div className="h-32 w-full bg-gray-50 rounded-2xl" />
          </div>
          <div className="col-span-12 lg:col-span-3 h-96 bg-gray-50 rounded-5xl border border-gray-100" />
        </div>
      </div>
    );
  }

  const installmentPrice = (currentPrice / 400).toFixed(2);
  const deliveryDate = new Date();
  deliveryDate.setDate(deliveryDate.getDate() + 2);
  const deliveryStr = deliveryDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div className="min-h-screen bg-white pb-24 lg:pb-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Breadcrumbs 
          items={[
            { label: 'Catalog', href: STORE_PATHS.PRODUCTS },
            { label: product.category, href: getCollectionUrl(product.category) },
            { label: product.name }
          ]} 
        />

        {/* Sticky Sub-Nav */}
        <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-gray-100 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 mb-12 hidden lg:block">
          <div className="max-w-7xl mx-auto flex items-center justify-between h-16">
            <div className="flex gap-8">
              {['Overview', 'Specifications', 'Reviews'].map((tab) => (
                <button 
                  key={tab}
                  className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-primary-600 border-b-2 border-transparent hover:border-primary-600 h-16 transition-all"
                >
                  {tab}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-6">
              <div className="text-right">
                <p className="text-sm font-black text-gray-900">${(currentPrice / 100).toFixed(2)}</p>
                {selectedVariant && <p className="text-[8px] font-bold text-gray-400 uppercase tracking-tighter">{selectedVariant.title}</p>}
              </div>
              <button 
                onClick={handleAddToCart}
                disabled={adding || currentStock === 0}
                className="bg-gray-900 text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all disabled:opacity-50"
              >
                {currentStock === 0 ? 'Out of Stock' : 'Add to Bag'}
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
          {/* Left: Image Gallery */}
          <div className="lg:col-span-5 sticky top-32 space-y-6">
            <div className="aspect-4/5 rounded-5xl overflow-hidden bg-gray-50 border border-gray-100 shadow-2xl shadow-black/5 group relative">
              <img src={currentImage} alt={product.name} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
              <div className="absolute top-6 left-6">
                <span className="bg-white/90 backdrop-blur-md border border-gray-100 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-primary-500 animate-pulse" />
                  Artist Original
                </span>
              </div>
            </div>
            
            {/* Thumbnails (Logic for variants could be added here) */}
            <div className="grid grid-cols-4 gap-4">
               {/* Media mapping... */}
            </div>
          </div>

          {/* Middle: Product Content */}
          <div className="lg:col-span-4 space-y-12">
            <section>
              <div className="flex flex-wrap items-center gap-y-4 mb-6">
                <div className="flex items-center gap-1 mr-4">
                  {[1, 2, 3, 4, 5].map(i => (
                    <Star key={i} className={`w-3.5 h-3.5 ${i <= 4 ? 'text-amber-400 fill-current' : 'text-gray-200'}`} />
                  ))}
                  <span className="ml-2 text-xs font-black text-gray-900 tracking-tighter">4.8</span>
                </div>
                <div className="flex items-center gap-3 px-3 py-1 bg-amber-50 rounded-full">
                  <Zap className="w-3 h-3 text-amber-500 fill-current" />
                  <span className="text-[10px] font-black text-amber-700 uppercase tracking-widest">Trending Choice</span>
                </div>
              </div>
              
              <h1 className="text-4xl lg:text-6xl font-black text-gray-900 leading-[1.1] tracking-[-0.04em] mb-4">
                {product.name}
              </h1>
              
              <div className="flex items-center gap-3">
                <p className="text-sm font-bold text-gray-400 italic">
                  Artist: <span className="text-primary-600 font-black">{product.vendor || 'DreamBees'}</span>
                </p>
                <div className="h-4 w-px bg-gray-200" />
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">SKU: {currentSku || 'N/A'}</p>
              </div>
            </section>

            {/* Variant Selectors (Production Grade) */}
            {product.hasVariants && product.options && (
              <section className="space-y-8 animate-in fade-in duration-500">
                {product.options.map((opt) => (
                  <div key={opt.id}>
                    <div className="flex items-center justify-between mb-4 px-1">
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{opt.name}</p>
                      <p className="text-[10px] font-bold text-gray-900 uppercase">{selectedOptions[opt.name]}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {opt.values.map(val => (
                        <button 
                          key={val}
                          onClick={() => setSelectedOptions(prev => ({ ...prev, [opt.name]: val }))}
                          className={`
                            px-6 py-3 rounded-2xl text-xs font-black transition-all border-2
                            ${selectedOptions[opt.name] === val 
                              ? 'bg-gray-900 border-gray-900 text-white shadow-xl shadow-gray-200 scale-105' 
                              : 'bg-white border-gray-100 text-gray-500 hover:border-gray-300'
                            }
                          `}
                        >
                          {val}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </section>
            )}

            {/* Technical Specs */}
            <section className="bg-gray-50/50 rounded-4xl p-8 border border-gray-100">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-6">Specifications</h3>
              <div className="grid grid-cols-2 gap-y-6">
                {[
                  { label: 'Category', value: product.category },
                  { label: 'Type', value: product.productType || 'Standard' },
                  { label: 'Set', value: product.set || 'Core' },
                  { label: 'Weight', value: product.weightGrams ? `${product.weightGrams}g` : 'N/A' }
                ].map(spec => (
                  <div key={spec.label}>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{spec.label}</p>
                    <p className="text-xs font-black text-gray-900">{spec.value}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Description */}
            <section className="space-y-4">
               <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">About this product</h3>
               <p className="text-sm text-gray-500 font-medium leading-relaxed">
                 {product.description}
               </p>
            </section>
          </div>

          {/* Right: Buy Box */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-5xl border border-gray-100 shadow-2xl shadow-black/5 p-10 sticky top-32 ring-1 ring-black/5">
              <div className="mb-10">
                <div className="flex flex-col gap-1 mb-6">
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-black text-gray-900 tracking-tighter">
                      ${(currentPrice / 100).toFixed(2)}
                    </span>
                    {currentCompareAtPrice && (
                      <span className="text-xl text-gray-300 line-through font-bold">
                        ${(currentCompareAtPrice / 100).toFixed(2)}
                      </span>
                    )}
                  </div>
                  {currentCompareAtPrice && currentCompareAtPrice > currentPrice && (
                    <span className="bg-red-50 text-red-600 px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest w-fit">
                      Save {Math.round((1 - currentPrice / currentCompareAtPrice) * 100)}%
                    </span>
                  )}
                </div>
                
                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-gray-900 flex items-center justify-center text-[10px] font-black text-white shrink-0 shadow-sm">P4</div>
                  <p className="text-[10px] font-bold text-gray-600 leading-tight">
                    Pay 4 installments of <span className="text-gray-900 font-black">${installmentPrice}</span>
                  </p>
                </div>
              </div>

              <div className="space-y-6 mb-10 text-sm">
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                    <Truck className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-black text-gray-900 tracking-tight">Express Delivery</p>
                    <p className="text-[11px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">Arrives {deliveryStr}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                    <PackageCheck className="w-5 h-5 text-amber-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-black text-gray-900 tracking-tight">Availability</p>
                      <span className={`text-[10px] font-black uppercase tracking-widest ${currentStock <= 5 ? 'text-red-600 animate-pulse' : 'text-green-600'}`}>
                        {currentStock === 0 ? 'Sold Out' : currentStock <= 5 ? 'Low Stock' : 'In Stock'}
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{currentStock} units available</p>
                  </div>
                </div>
              </div>

              <div className="mb-10 space-y-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4 ml-1">Quantity</p>
                  <div className="flex items-center justify-between bg-gray-50 rounded-2xl p-2 h-14 ring-1 ring-gray-100">
                    <button 
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="h-10 w-10 flex items-center justify-center rounded-xl bg-white shadow-sm text-gray-500 hover:text-primary-600 transition-all"
                    >
                      −
                    </button>
                    <span className="font-black text-gray-900 text-lg">{quantity}</span>
                    <button 
                      onClick={() => setQuantity(Math.min(maxSelectableQuantity, quantity + 1))}
                      className="h-10 w-10 flex items-center justify-center rounded-xl bg-white shadow-sm text-gray-500 hover:text-primary-600 transition-all"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 pt-4">
                  <button
                    onClick={handleAddToCart}
                    disabled={adding || currentStock === 0}
                    className="w-full h-16 flex items-center justify-center gap-3 bg-gray-900 text-white rounded-3xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-gray-200 hover:bg-black hover:-translate-y-1 active:translate-y-0 transition-all disabled:opacity-50"
                  >
                    {added ? <Check className="w-5 h-5" /> : <ShoppingCart className="w-5 h-5" />}
                    {adding ? 'Processing...' : added ? 'Added' : currentStock === 0 ? 'Out of Stock' : 'Add to Bag'}
                  </button>

                  <div className="relative group">
                    <button
                      onClick={() => setShowWishlistDropdown(!showWishlistDropdown)}
                      className={`w-full h-16 flex items-center justify-center gap-3 rounded-3xl border-2 font-black text-xs uppercase tracking-[0.2em] transition-all ${
                        isFavorite ? 'bg-red-50 border-red-100 text-red-500' : 'bg-white border-gray-100 text-gray-400 hover:bg-gray-50'
                      }`}
                    >
                      <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
                      {isFavorite ? 'Saved' : 'Save'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div id="reviews" className="mt-24">
          {product && <ProductReviews productId={product.id} />}
        </div>
      </div>
    </div>
  );
}
