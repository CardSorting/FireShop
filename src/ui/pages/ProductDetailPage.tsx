'use client';

/**
 * [LAYER: UI]
 */
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useServices } from '../hooks/useServices';
import { useAuth } from '../hooks/useAuth';
import { useCart } from '../hooks/useCart';
import type { Product } from '@domain/models';
import { ShoppingCart, ArrowLeft, Check, ShieldCheck, Truck, LifeBuoy, PackageCheck, ChevronRight, AlertCircle, Heart, Plus, Star, Info, Timer, Zap, MapPin } from 'lucide-react';
import { useWishlist } from '../hooks/useWishlist';

import { MAX_CART_QUANTITY } from '@domain/rules';
import { logger } from '@utils/logger';

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
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
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

  const { wishlists, isInWishlist, addToWishlist, removeFromWishlist, createCollection, trackView } = useWishlist();
  const isFavorite = id ? isInWishlist(id) : false;

  // Simulated ratings and delivery
  const rating = 4.8;
  const reviewCount = 124;
  const deliveryDate = new Date();
  deliveryDate.setDate(deliveryDate.getDate() + 2);
  const deliveryStr = deliveryDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  // Simulated state for accordions and variants
  const [activeAccordion, setActiveAccordion] = useState<string | null>('about');
  const [selectedCondition, setSelectedCondition] = useState('Near Mint');
  const [selectedLanguage, setSelectedLanguage] = useState('English');


  async function handleAddToCollection(wishlistId: string) {
    await addToWishlist(id!, wishlistId);
    setShowWishlistDropdown(false);
  }

  async function handleCreateAndAdd() {
    if (!newCollectionName.trim()) return;
    setCreatingCollection(true);
    try {
      const newList = await createCollection(newCollectionName.trim());
      await addToWishlist(id!, newList.id);
      setNewCollectionName('');
      setShowWishlistDropdown(false);
    } finally {
      setCreatingCollection(false);
    }
  }

  const loadProduct = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const loaded = await services.productService.getProduct(id);
      setProduct(loaded);
      trackView(loaded);
      
      setLoadingRelated(true);
      try {
        const related = await services.productService.getProducts({ category: loaded.category, limit: 5 });
        setRelatedProducts(related.products.filter(p => p.id !== id).slice(0, 4));
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
  }, [id, services.productService]);

  useEffect(() => {
    void loadProduct();
  }, [loadProduct]);

  const maxSelectableQuantity = product ? Math.max(1, Math.min(product.stock, MAX_CART_QUANTITY)) : 1;

  async function handleAddToCart() {
    if (!product) return;
    setAdding(true);
    setError(null);
    try {
      await addItem(product.id, Math.min(quantity, maxSelectableQuantity));
      setAdded(true);
      setTimeout(() => setAdded(false), 2500);
    } catch (err) {
      setError(toFriendlyError(err));
    } finally {
      setAdding(false);
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

  const installmentPrice = (product.price / 400).toFixed(2);

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-10 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-400">
          <Link href="/" className="hover:text-primary-600 transition-colors">Home</Link>
          <ChevronRight className="h-3 w-3 opacity-30" />
          <Link href="/products" className="hover:text-primary-600 transition-colors">Products</Link>
          <ChevronRight className="h-3 w-3 opacity-30" />
          <span className="text-gray-900 truncate">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
          {/* Left: Image Gallery (5 cols) */}
          <div className="lg:col-span-5 sticky top-32">
            <div className="aspect-4/5 rounded-5xl overflow-hidden bg-gray-50 border border-gray-100 shadow-2xl shadow-black/5 group">
              <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
              <div className="absolute top-6 left-6 flex flex-col gap-2">
                <span className="bg-white/90 backdrop-blur-md border border-gray-100 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-primary-500 animate-pulse" />
                  Authentic Collector's Item
                </span>
                <span className="bg-gray-900 text-white px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl w-fit">
                  {product.category}
                </span>
              </div>
            </div>
          </div>

          {/* Middle: Product Content (4 cols) */}
          <div className="lg:col-span-4 space-y-12">
            <section>
              <div className="flex items-center gap-1 mb-6">
                {[1, 2, 3, 4, 5].map(i => (
                  <Star key={i} className={`w-3.5 h-3.5 ${i <= 4 ? 'text-amber-400 fill-current' : 'text-gray-200'}`} />
                ))}
                <span className="ml-2 text-xs font-black text-gray-900 tracking-tighter">{rating} Rating</span>
                <span className="mx-3 text-gray-200">|</span>
                <span className="text-xs font-bold text-primary-600 hover:underline cursor-pointer tracking-tight">{reviewCount} Verified Reviews</span>
              </div>
              
              <h1 className="text-4xl lg:text-6xl font-black text-gray-900 leading-[1.1] tracking-[-0.04em] mb-6">
                {product.name}
              </h1>
              
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                  <PackageCheck className="w-4 h-4 text-gray-400" />
                </div>
                <p className="text-sm font-bold text-gray-400 italic">
                  Curated by <span className="text-primary-600 hover:underline cursor-pointer">{product.vendor || 'ShopMore Experts'}</span>
                </p>
              </div>
            </section>

            {/* Variant Selectors (TCG Standards) */}
            <section className="space-y-8 pt-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4 ml-1">Card Condition</p>
                <div className="flex flex-wrap gap-2">
                  {['Near Mint', 'Lightly Played'].map(c => (
                    <button 
                      key={c}
                      onClick={() => setSelectedCondition(c)}
                      className={`px-6 py-3 rounded-2xl text-xs font-black transition-all border-2 ${
                        selectedCondition === c 
                          ? 'bg-gray-900 border-gray-900 text-white shadow-xl shadow-gray-200 scale-105' 
                          : 'bg-white border-gray-100 text-gray-500 hover:border-gray-300'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4 ml-1">Language</p>
                <div className="flex flex-wrap gap-2">
                  {['English', 'Japanese'].map(l => (
                    <button 
                      key={l}
                      onClick={() => setSelectedLanguage(l)}
                      className={`px-6 py-3 rounded-2xl text-xs font-black transition-all border-2 ${
                        selectedLanguage === l 
                          ? 'bg-primary-600 border-primary-600 text-white shadow-xl shadow-primary-100 scale-105' 
                          : 'bg-white border-gray-100 text-gray-500 hover:border-gray-300'
                      }`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>
            </section>

            {/* Accordions (Stripe style) */}
            <section className="border-t border-gray-100 pt-8">
              <div className="space-y-2">
                {[
                  { id: 'about', label: 'Product Narrative', icon: Info, content: product.description },
                  { id: 'shipping', label: 'Shipping & Returns', icon: Truck, content: 'Free express shipping on orders over $50. 30-day money-back guarantee for mint condition items.' },
                  { id: 'authenticity', label: 'Our Authenticity Promise', icon: ShieldCheck, content: 'Every card is manually inspected by our TCG experts to ensure original print and stated condition.' }
                ].map(item => (
                  <div key={item.id} className="border-b border-gray-50 last:border-none">
                    <button 
                      onClick={() => setActiveAccordion(activeAccordion === item.id ? null : item.id)}
                      className="w-full flex items-center justify-between py-6 text-left group"
                    >
                      <div className="flex items-center gap-4">
                        <item.icon className={`w-5 h-5 transition-colors ${activeAccordion === item.id ? 'text-primary-600' : 'text-gray-400 group-hover:text-gray-900'}`} />
                        <span className={`text-sm font-black tracking-tight transition-colors ${activeAccordion === item.id ? 'text-gray-900' : 'text-gray-500 group-hover:text-gray-900'}`}>{item.label}</span>
                      </div>
                      <ChevronRight className={`w-4 h-4 text-gray-300 transition-transform duration-300 ${activeAccordion === item.id ? 'rotate-90 text-primary-600' : ''}`} />
                    </button>
                    <div className={`overflow-hidden transition-all duration-300 ${activeAccordion === item.id ? 'max-h-96 pb-6' : 'max-h-0'}`}>
                      <p className="text-sm text-gray-500 font-medium leading-relaxed pl-9">
                        {item.content}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Right: Buy Box (3 cols) */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-5xl border border-gray-100 shadow-2xl shadow-black/5 p-10 sticky top-32 ring-1 ring-black/5">
              <div className="mb-10">
                <div className="flex items-baseline gap-2 mb-3">
                  <span className="text-5xl font-black text-gray-900 tracking-tighter">
                    ${(product.price / 100).toFixed(2)}
                  </span>
                  {product.compareAtPrice && (
                    <span className="text-xl text-gray-300 line-through font-bold">
                      ${(product.compareAtPrice / 100).toFixed(2)}
                    </span>
                  )}
                </div>
                
                {/* Payment Simulation */}
                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 flex items-center gap-3 group cursor-pointer hover:bg-white hover:shadow-lg transition-all duration-300">
                  <div className="h-8 w-8 rounded-lg bg-gray-900 flex items-center justify-center text-[10px] font-black text-white shrink-0 shadow-sm">P4</div>
                  <p className="text-[10px] font-bold text-gray-600 leading-tight">
                    Pay in 4 interest-free installments of <span className="text-gray-900 font-black">${installmentPrice}</span> with <span className="text-primary-600 font-black">ShopMore Installments</span>
                  </p>
                </div>
              </div>

              <div className="space-y-6 mb-10 text-sm">
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                    <Truck className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-black text-gray-900 tracking-tight">Rapid Track Delivery</p>
                    <p className="text-[11px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">Arrives by {deliveryStr}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                    <Timer className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="font-black text-gray-900 tracking-tight">Scarcity Alert</p>
                    <p className="text-[11px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">
                      {product.stock > 10 ? 'High Stock Levels' : `${product.stock} items remaining`}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mb-10 space-y-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4 ml-1">Order Quantity</p>
                  <div className="flex items-center justify-between bg-gray-50 rounded-2xl p-2 h-14 ring-1 ring-gray-100">
                    <button 
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="h-10 w-10 flex items-center justify-center rounded-xl bg-white shadow-sm text-gray-500 hover:text-primary-600 active:scale-95 transition-all"
                    >
                      −
                    </button>
                    <span className="font-black text-gray-900 text-lg">{quantity}</span>
                    <button 
                      onClick={() => setQuantity(Math.min(maxSelectableQuantity, quantity + 1))}
                      className="h-10 w-10 flex items-center justify-center rounded-xl bg-white shadow-sm text-gray-500 hover:text-primary-600 active:scale-95 transition-all"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 pt-4">
                  <button
                    onClick={handleAddToCart}
                    disabled={adding || product.stock === 0}
                    className="w-full h-16 flex items-center justify-center gap-3 bg-gray-900 text-white rounded-3xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-gray-200 hover:bg-black hover:-translate-y-1 active:translate-y-0 transition-all disabled:opacity-50"
                  >
                    {added ? <Check className="w-5 h-5" /> : <ShoppingCart className="w-5 h-5" />}
                    {adding ? 'Processing...' : added ? 'Added to bag' : 'Add to bag'}
                  </button>

                  <div className="relative group">
                    <button
                      onClick={() => setShowWishlistDropdown(!showWishlistDropdown)}
                      className={`w-full h-16 flex items-center justify-center gap-3 rounded-3xl border-2 font-black text-xs uppercase tracking-[0.2em] transition-all ${
                        isFavorite 
                          ? 'bg-red-50 border-red-100 text-red-500' 
                          : 'bg-white border-gray-100 text-gray-400 hover:bg-gray-50 hover:text-red-500 hover:border-red-200'
                      }`}
                    >
                      <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
                      {isFavorite ? 'Saved' : 'Save for later'}
                    </button>

                    {showWishlistDropdown && (
                      <div className="absolute right-0 bottom-full mb-6 w-full bg-white rounded-4xl shadow-2xl border border-gray-100 p-6 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300 ring-1 ring-black/5">
                        <div className="flex items-center justify-between mb-6">
                          <h4 className="text-[10px] font-black text-gray-900 uppercase tracking-widest">Collections</h4>
                          <button onClick={() => setShowWishlistDropdown(false)} className="text-gray-400">
                            <Plus className="w-4 h-4 rotate-45" />
                          </button>
                        </div>
                        <div className="space-y-2 mb-6 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                          {wishlists.map(list => (
                            <button
                              key={list.id}
                              onClick={() => handleAddToCollection(list.id)}
                              className="w-full text-left px-4 py-4 rounded-2xl text-xs font-black text-gray-600 hover:bg-primary-50 hover:text-primary-600 transition-all flex items-center justify-between"
                            >
                              {list.name}
                              {isInWishlist(product.id) && <Check className="w-3 h-3" />}
                            </button>
                          ))}
                        </div>
                        <div className="pt-6 border-t border-gray-50">
                          <input 
                            type="text" 
                            placeholder="New list..."
                            value={newCollectionName}
                            onChange={(e) => setNewCollectionName(e.target.value)}
                            className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-xs font-bold focus:ring-2 focus:ring-primary-500 mb-3"
                          />
                          <button onClick={handleCreateAndAdd} className="w-full bg-primary-600 text-white text-xs font-black py-3 rounded-xl">Create & Add</button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-8 border-t border-gray-50 space-y-4">
                <div className="flex items-center gap-3 text-xs font-bold text-gray-500">
                  <ShieldCheck className="w-4 h-4 text-green-500" />
                  Secure Transaction
                </div>
                <div className="flex items-center gap-3 text-xs font-bold text-gray-500">
                  <Truck className="w-4 h-4 text-blue-500" />
                  Ships from ShopMore
                </div>
                <div className="flex items-center gap-3 text-xs font-bold text-gray-500">
                  <PackageCheck className="w-4 h-4 text-amber-500" />
                  Sold by {product.vendor || 'ShopMore'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recommendations Section */}
        {relatedProducts.length > 0 && (
          <section className="mt-32 pt-20 border-t border-gray-100">
            <div className="flex items-end justify-between mb-12">
              <div>
                <h2 className="text-3xl font-black text-gray-900 tracking-tighter mb-2">Customers also viewed</h2>
                <p className="text-gray-400 font-bold italic">Based on your recent interests</p>
              </div>
              <Link href="/products" className="text-xs font-black text-primary-600 uppercase tracking-widest hover:underline flex items-center gap-2">
                Explore Full Catalog <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
              {relatedProducts.map(p => (
                <Link key={p.id} href={`/products/${p.id}`} className="group block space-y-6">
                  <div className="aspect-4/5 rounded-4xl overflow-hidden bg-gray-50 border border-gray-100 shadow-sm transition-all duration-500 group-hover:shadow-2xl group-hover:-translate-y-2">
                    <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-primary-600 uppercase tracking-widest mb-1">{p.category}</p>
                    <h3 className="text-lg font-black text-gray-900 group-hover:text-primary-600 transition-colors line-clamp-1 mb-2">{p.name}</h3>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center">
                         <Star className="w-3 h-3 text-amber-400 fill-current" />
                         <span className="ml-1 text-[10px] font-black">4.8</span>
                      </div>
                      <p className="text-xl font-black text-gray-900">${(p.price / 100).toFixed(2)}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Mobile Sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-xl border-t border-gray-100 p-6 lg:hidden shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 truncate">{product.name}</p>
            <p className="text-lg font-black text-gray-900">${(product.price / 100).toFixed(2)}</p>
          </div>
          <button
            onClick={handleAddToCart}
            disabled={adding || product.stock === 0}
            className="flex-2 h-14 flex items-center justify-center gap-3 bg-gray-900 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl disabled:opacity-50"
          >
            {added ? <Check className="w-5 h-5" /> : <ShoppingCart className="w-5 h-5" />}
            {adding ? '...' : 'Add'}
          </button>
        </div>
      </div>
    </div>
  );
}
