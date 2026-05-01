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
import { 
  X, ShoppingBag, Trash2, ChevronRight, LockKeyhole, Truck, 
  ShieldCheck, ArrowRight, Minus, Plus, CreditCard, Shield,
  Heart, Star, Zap, ShoppingCart, RefreshCcw, Info, Users,
  PackageCheck, Timer, Check, LifeBuoy
} from 'lucide-react';
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

  const [mainImage, setMainImage] = useState<string | null>(null);

  const loadProduct = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const loaded = await services.productService.getProduct(id);
      setProduct(loaded);
      setMainImage(loaded.imageUrl);
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
    <div className="min-h-screen bg-white pb-24 lg:pb-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-10 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-400">
          <Link href="/" className="hover:text-primary-600 transition-colors">Home</Link>
          <ChevronRight className="h-3 w-3 opacity-30" />
          <Link href="/products" className="hover:text-primary-600 transition-colors">Products</Link>
          <ChevronRight className="h-3 w-3 opacity-30" />
          <span className="text-gray-900 truncate">{product.name}</span>
        </nav>

        {/* Sticky Sub-Nav (Industry Standard) */}
        <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 mb-12 hidden lg:block">
          <div className="max-w-7xl mx-auto flex items-center justify-between h-16">
            <div className="flex gap-8">
              {['Overview', 'Specifications', 'Reviews', 'Expert Take'].map((tab) => (
                <button 
                  key={tab}
                  className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-primary-600 border-b-2 border-transparent hover:border-primary-600 h-16 transition-all"
                >
                  {tab}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-6">
              <p className="text-sm font-black text-gray-900">${(product.price / 100).toFixed(2)}</p>
              <button 
                onClick={handleAddToCart}
                className="bg-gray-900 text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all"
              >
                Add to Bag
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
          {/* Left: Image Gallery (5 cols) */}
          <div className="lg:col-span-5 sticky top-32 space-y-6">
            <div className="aspect-4/5 rounded-5xl overflow-hidden bg-gray-50 border border-gray-100 shadow-2xl shadow-black/5 group relative">
              <img src={mainImage || product.imageUrl} alt={product.name} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
              <div className="absolute top-6 left-6 flex flex-col gap-2">
                <span className="bg-white/90 backdrop-blur-md border border-gray-100 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-primary-500 animate-pulse" />
                  Authentic Collector's Item
                </span>
              </div>
            </div>
            
            {/* Thumbnails */}
            <div className="grid grid-cols-4 gap-4">
              {[product.imageUrl, product.imageUrl, product.imageUrl, product.imageUrl].map((url, i) => (
                <button 
                  key={i}
                  onClick={() => setMainImage(url)}
                  className={`aspect-square rounded-2xl overflow-hidden border-2 transition-all ${mainImage === url && i === 0 ? 'border-primary-600 ring-4 ring-primary-50' : 'border-gray-100 hover:border-gray-300'}`}
                >
                  <img src={url} alt={`View ${i}`} className="w-full h-full object-cover opacity-80 hover:opacity-100 transition-opacity" />
                </button>
              ))}
            </div>
          </div>

          {/* Middle: Product Content (4 cols) */}
          <div className="lg:col-span-4 space-y-12">
            <section>
              <div className="flex flex-wrap items-center gap-y-4 mb-6">
                <div className="flex items-center gap-1 mr-4">
                  {[1, 2, 3, 4, 5].map(i => (
                    <Star key={i} className={`w-3.5 h-3.5 ${i <= 4 ? 'text-amber-400 fill-current' : 'text-gray-200'}`} />
                  ))}
                  <span className="ml-2 text-xs font-black text-gray-900 tracking-tighter">{rating}</span>
                </div>
                <span className="text-xs font-bold text-primary-600 hover:underline cursor-pointer tracking-tight mr-4">{reviewCount} Reviews</span>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 px-3 py-1 bg-amber-50 rounded-full">
                    <Zap className="w-3 h-3 text-amber-500 fill-current" />
                    <span className="text-[10px] font-black text-amber-700 uppercase tracking-widest">Trending: 12 views recently</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1 bg-green-50 rounded-full animate-pulse">
                    <Users className="w-3 h-3 text-green-600" />
                    <span className="text-[10px] font-black text-green-700 uppercase tracking-widest">34 people currently viewing</span>
                  </div>
                </div>
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

            {/* Technical Specs Grid (TCG Focus) */}
            <section className="bg-gray-50/50 rounded-4xl p-8 border border-gray-100">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-6">Technical Specifications</h3>
              <div className="grid grid-cols-2 gap-y-6 gap-x-8">
                {[
                  { label: 'Set Name', value: product.set || 'Core Collection' },
                  { label: 'Release Year', value: product.metafields?.release_year || '2024' },
                  { label: 'Rarity', value: product.rarity || 'Standard' },
                  { label: 'Category', value: product.category },
                  { label: 'SKU / ID', value: product.sku || product.id.slice(0, 8).toUpperCase() },
                  { label: 'Certification', value: product.metafields?.certification || 'Authentic Raw' }
                ].map(spec => (
                  <div key={spec.label}>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{spec.label}</p>
                    <p className="text-xs font-black text-gray-900">{spec.value}</p>
                  </div>
                ))}
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
                <div className="flex flex-col gap-1 mb-3">
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-black text-gray-900 tracking-tighter">
                      ${(product.price / 100).toFixed(2)}
                    </span>
                    {product.compareAtPrice && (
                      <span className="text-xl text-gray-300 line-through font-bold">
                        ${(product.compareAtPrice / 100).toFixed(2)}
                      </span>
                    )}
                  </div>
                  {product.compareAtPrice && product.compareAtPrice > product.price && (
                    <div className="flex items-center gap-2">
                      <span className="bg-red-50 text-red-600 px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest">
                        Save {Math.round((1 - product.price / product.compareAtPrice) * 100)}%
                      </span>
                      <p className="text-[10px] font-bold text-gray-400 italic">Limited time deal</p>
                    </div>
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
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-black text-gray-900 tracking-tight">Scarcity Alert</p>
                      <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest">
                        {product.stock <= 5 ? 'Critical' : 'Low Stock'}
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ${product.stock <= 5 ? 'bg-red-500' : 'bg-amber-500'}`} 
                        style={{ width: `${Math.min(100, (product.stock / 20) * 100)}%` }} 
                      />
                    </div>
                    <p className="text-[10px] text-gray-400 font-bold mt-2 uppercase tracking-widest leading-none">
                      {product.stock} items remaining at this price
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
                    {adding ? 'Processing...' : added ? 'Added to bag' : quantity > 1 ? `Add ${quantity} to bag • $${((product.price * quantity) / 100).toFixed(2)}` : 'Add to bag'}
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

                {/* Guaranteed Safe Checkout Badge Set */}
                <div className="mt-8 p-6 rounded-4xl bg-gray-50/50 border border-gray-100 space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Guaranteed Safe Checkout</p>
                    <LockKeyhole className="h-3 w-3 text-green-500" />
                  </div>
                  <div className="flex items-center justify-center gap-6 opacity-40 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-700 cursor-default">
                    <CreditCard className="h-6 w-6" />
                    <div className="h-4 w-px bg-gray-200" />
                    <div className="text-[9px] font-black tracking-tighter uppercase italic px-1.5 py-0.5 border border-gray-300 rounded leading-none">Visa</div>
                    <div className="text-[9px] font-black tracking-tighter uppercase px-1.5 py-0.5 border border-gray-300 rounded leading-none">Stripe</div>
                    <div className="text-[9px] font-black tracking-tighter uppercase px-1.5 py-0.5 border border-gray-300 rounded leading-none">PayPal</div>
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

            {/* Value Props Bar (Premium Strategy) */}
            <div className="mt-12 grid grid-cols-2 gap-4">
              <div className="p-5 rounded-3xl bg-gray-50 border border-gray-100 flex flex-col gap-3">
                <Truck className="w-5 h-5 text-gray-900" />
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-900">Free Shipping</p>
                  <p className="text-[10px] font-bold text-gray-400 mt-0.5">On all orders over $50</p>
                </div>
              </div>
              <div className="p-5 rounded-3xl bg-gray-50 border border-gray-100 flex flex-col gap-3">
                <LifeBuoy className="w-5 h-5 text-gray-900" />
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-900">24/7 Support</p>
                  <p className="text-[10px] font-bold text-gray-400 mt-0.5">Dedicated TCG experts</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Frequently Bought Together (Dynamic Bundle) */}
        {relatedProducts.length >= 2 && (
          <section className="mt-32 pt-20 border-t border-gray-100">
            <h2 className="text-3xl font-black text-gray-900 tracking-tighter mb-12">Frequently bought together</h2>
            <div className="flex flex-col lg:flex-row items-center gap-12 bg-gray-50/50 rounded-[3rem] p-10 ring-1 ring-gray-100">
              <div className="flex flex-wrap items-center justify-center gap-6">
                <div className="h-40 w-32 rounded-2xl bg-white shadow-xl overflow-hidden border border-gray-100 p-2">
                  <img src={product.imageUrl} alt={product.name} className="w-full h-full object-contain" />
                </div>
                <Plus className="w-6 h-6 text-gray-300" />
                <div className="h-40 w-32 rounded-2xl bg-white shadow-xl overflow-hidden border border-gray-100 p-2">
                  <img src={relatedProducts[0].imageUrl} alt={relatedProducts[0].name} className="w-full h-full object-contain" />
                </div>
                <Plus className="w-6 h-6 text-gray-300" />
                <div className="h-40 w-32 rounded-2xl bg-white shadow-xl overflow-hidden border border-gray-100 p-2">
                  <img src={relatedProducts[1].imageUrl} alt={relatedProducts[1].name} className="w-full h-full object-contain" />
                </div>
              </div>
              
              <div className="flex-1 space-y-4">
                <div className="flex items-start gap-3">
                  <input type="checkbox" defaultChecked className="mt-1 h-5 w-5 rounded-lg border-gray-200 text-primary-600 focus:ring-primary-500" />
                  <p className="text-sm font-bold text-gray-600"><span className="text-gray-900 font-black">This item:</span> {product.name} — <span className="text-gray-400">${(product.price / 100).toFixed(2)}</span></p>
                </div>
                <div className="flex items-start gap-3">
                  <input type="checkbox" defaultChecked className="mt-1 h-5 w-5 rounded-lg border-gray-200 text-primary-600 focus:ring-primary-500" />
                  <p className="text-sm font-bold text-gray-600"><span className="text-gray-900 font-black">{relatedProducts[0].name}:</span> — <span className="text-gray-400">${(relatedProducts[0].price / 100).toFixed(2)}</span></p>
                </div>
                <div className="flex items-start gap-3">
                  <input type="checkbox" defaultChecked className="mt-1 h-5 w-5 rounded-lg border-gray-200 text-primary-600 focus:ring-primary-500" />
                  <p className="text-sm font-bold text-gray-600"><span className="text-gray-900 font-black">{relatedProducts[1].name}:</span> — <span className="text-gray-400">${(relatedProducts[1].price / 100).toFixed(2)}</span></p>
                </div>
              </div>

              <div className="lg:w-72 space-y-6 pt-8 lg:pt-0 lg:pl-12 lg:border-l border-gray-200">
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Bundle Total</p>
                  <p className="text-4xl font-black text-gray-900 tracking-tighter">${((product.price + relatedProducts[0].price + relatedProducts[1].price) / 100).toFixed(2)}</p>
                </div>
                <button className="w-full h-14 bg-primary-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary-100 hover:bg-primary-700 transition-all flex items-center justify-center gap-3">
                  Add Bundle to Bag
                </button>
              </div>
            </div>
          </section>
        )}

        {/* Staff Editorial Review */}
        <section className="mt-32 p-12 bg-gray-900 rounded-[4rem] text-white overflow-hidden relative group">
          <div className="absolute top-0 right-0 w-1/2 h-full opacity-10 pointer-events-none group-hover:opacity-20 transition-opacity duration-1000">
             <div className="absolute inset-0 bg-linear-to-l from-primary-500 to-transparent" />
             <img src={product?.imageUrl} alt="" className="w-full h-full object-cover grayscale scale-125 rotate-12" />
          </div>
          
          <div className="relative z-10 max-w-2xl">
            <div className="flex items-center gap-4 mb-8">
              <div className="h-14 w-14 rounded-full border-2 border-primary-500 p-1">
                <img src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop" alt="Expert" className="w-full h-full rounded-full object-cover" />
              </div>
              <div>
                <p className="text-xs font-black text-primary-500 uppercase tracking-[0.3em]">Expert Take</p>
                <p className="text-sm font-bold text-gray-400">Marcus Thorne, Senior Collector</p>
              </div>
            </div>
            
            <h2 className="text-4xl font-black tracking-tight leading-tight mb-8">
              "The print quality on this release is unparalleled. A must-have for any serious vault."
            </h2>
            
            <p className="text-gray-400 text-lg leading-relaxed font-medium mb-10 italic">
              "When assessing this specific card, the first thing that strikes you is the texture. The holo pattern is deep and reactive. For players, the utility is obvious, but for investors, the low print run makes this a generational asset."
            </p>
            
            <div className="flex flex-wrap gap-8">
              <div>
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Grade Potential</p>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-16 bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full w-[95%] bg-primary-500" />
                  </div>
                  <span className="text-xs font-black">9.5/10</span>
                </div>
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Market Scarcity</p>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-16 bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full w-[80%] bg-amber-500" />
                  </div>
                  <span className="text-xs font-black">Very High</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Customer Questions & Answers (Amazon Style) */}
        <section className="mt-32 pt-20 border-t border-gray-100">
          <div className="flex items-center justify-between mb-12">
            <h2 className="text-3xl font-black text-gray-900 tracking-tighter">Customer questions & answers</h2>
            <button className="text-xs font-black text-primary-600 uppercase tracking-widest hover:underline">Ask a question</button>
          </div>
          <div className="space-y-8 max-w-4xl">
            {[
              { q: `Is this ${product.name} from a first edition print?`, a: `This specific listing is for the unlimited print run from the ${product.set || 'Core'} collection. We verify every card manually for print edition accuracy.` },
              { q: 'How is the card protected during shipping?', a: 'All cards are shipped in a pro-fit sleeve, inside a premium top-loader, which is then secured in a bubble-protected stay-flat mailer.' }
            ].map((qa, i) => (
              <div key={i} className="flex gap-6">
                <div className="shrink-0 flex flex-col items-center gap-2 pt-1">
                  <div className="h-8 w-8 rounded-lg bg-gray-100 flex items-center justify-center text-[10px] font-black text-gray-400">Q</div>
                  <div className="w-px h-full bg-gray-100" />
                  <div className="h-8 w-8 rounded-lg bg-primary-50 flex items-center justify-center text-[10px] font-black text-primary-600">A</div>
                </div>
                <div className="space-y-4 pb-8">
                  <p className="text-sm font-black text-gray-900">{qa.q}</p>
                  <p className="text-sm text-gray-500 font-medium leading-relaxed">{qa.a}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Recommendations Section */}
        {relatedProducts.length > 0 && (
          <section className="mt-32 pt-20 border-t border-gray-100" id="recommendations">
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
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 p-4 lg:hidden shadow-[0_-10px_40px_rgba(0,0,0,0.1)] pb-safe animate-in slide-in-from-bottom duration-500">
        <div className="max-w-md mx-auto flex items-center gap-4">
          <div className="h-12 w-12 rounded-lg bg-gray-100 border border-gray-200 overflow-hidden shrink-0">
            <img src={mainImage || product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-black text-gray-900 truncate">{product.name}</p>
            <p className="text-sm font-black text-primary-600">${(product.price / 100).toFixed(2)}</p>
          </div>
          <button
            onClick={handleAddToCart}
            disabled={adding || product.stock === 0}
            className="h-12 px-6 flex items-center justify-center gap-2 bg-gray-900 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg hover:bg-black active:scale-95 disabled:opacity-50 transition-all shrink-0"
          >
            {added ? <Check className="w-4 h-4" /> : <ShoppingCart className="w-4 h-4" />}
            {adding ? '...' : 'Add'}
          </button>
        </div>
      </div>
    </div>
  );
}
