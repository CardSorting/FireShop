'use client';

import { useState, useEffect, useRef } from 'react';
import { useWishlist } from '../hooks/useWishlist';
import { Heart, Trash2, ShoppingBag, Plus, MoreVertical, Edit2, ChevronRight, PackageSearch } from 'lucide-react';
import Link from 'next/link';
import { useCart } from '../hooks/useCart';
import type { Product, Wishlist } from '@domain/models';
import { useServices } from '../hooks/useServices';
import { getProductUrl, STORE_PATHS } from '@utils/navigation';


export function WishlistPage() {
  const { wishlists, recentlyViewed, loading, removeFromWishlist, createCollection } = useWishlist();
  const services = useServices();
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [items, setItems] = useState<Product[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [shareSuccess, setShareSuccess] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);

  const selectedList = wishlists.find(w => w.id === selectedListId) || wishlists.find(w => w.isDefault);

  async function loadItems(id: string) {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    setLoadingItems(true);
    try {
      const detail = await services.wishlistService.getWishlist(id, controller.signal);
      if (!controller.signal.aborted) {
        setItems(detail.items);
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      console.error('Failed to load wishlist items', err);
    } finally {
      if (!controller.signal.aborted) {
        setLoadingItems(false);
      }
    }
  }

  useEffect(() => {
    if (selectedList) {
      setSelectedListId(selectedList.id);
      void loadItems(selectedList.id);
    }
    return () => controllerRef.current?.abort();
  }, [selectedList?.id]);

  async function handleCreateList() {
    if (!newListName.trim()) return;
    try {
      const newList = await createCollection(newListName.trim());
      setNewListName('');
      setIsCreating(false);
      setSelectedListId(newList.id);
    } catch (err) {
      console.error('Failed to create wishlist', err);
    }
  }

  async function handleRemoveItem(productId: string) {
    if (!selectedListId) return;
    await removeFromWishlist(productId, selectedListId);
    setItems(prev => prev.filter(p => p.id !== productId));
  }

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setShareSuccess(true);
    setTimeout(() => setShareSuccess(false), 2000);
  };

  if (loading && wishlists.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 animate-pulse">
        <div className="h-10 w-64 bg-gray-200 rounded-xl mb-12" />
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
          <div className="space-y-4">
            {[1, 2, 3].map(i => <div key={i} className="h-12 w-full bg-gray-100 rounded-xl" />)}
          </div>
          <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="aspect-square bg-gray-50 rounded-3xl" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="mb-20">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-12 border-b border-gray-100 pb-16">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="h-12 w-12 rounded-2xl bg-gray-900 flex items-center justify-center text-white shadow-2xl shadow-gray-200">
                  <Heart className="w-6 h-6 fill-primary-500 text-primary-500" />
                </div>
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Vault / Personal Collection</span>
              </div>
              <h1 className="text-6xl font-black text-gray-900 tracking-[-0.04em] mb-4">
                Your Collection
              </h1>
              <p className="text-gray-400 font-bold text-xl leading-relaxed max-w-2xl">
                Curate your favorite pieces, track your most-wanted art, and share your wishlist with the community.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <div className="bg-gray-50 rounded-3xl p-6 flex items-center gap-8 ring-1 ring-gray-100 shadow-sm">
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Items</p>
                  <p className="text-2xl font-black text-gray-900">{items.length}</p>
                </div>
                <div className="h-10 w-px bg-gray-200" />
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Collections</p>
                  <p className="text-2xl font-black text-gray-900">{wishlists.length}</p>
                </div>
              </div>
              
              <button 
                onClick={handleShare}
                className="h-16 px-8 rounded-3xl bg-gray-900 text-white font-black text-xs uppercase tracking-widest hover:bg-black hover:-translate-y-1 transition-all shadow-2xl shadow-gray-200 flex items-center gap-3"
              >
                <Plus className="w-4 h-4" />
                {shareSuccess ? 'Link Copied!' : 'Share Collection'}
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-16">
          {/* Sidebar: Collections */}
          <aside className="space-y-8">
            <div className="bg-gray-50/50 rounded-5xl p-8 ring-1 ring-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xs font-black text-gray-900 uppercase tracking-widest">Collections</h2>
                <button 
                  onClick={() => setIsCreating(!isCreating)}
                  className="p-2 rounded-xl bg-white shadow-md text-primary-600 hover:scale-110 active:scale-95 transition-all"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {isCreating && (
                <div className="mb-8 space-y-3 animate-in fade-in slide-in-from-top-4 duration-300">
                  <input
                    autoFocus
                    type="text"
                    placeholder="New list name..."
                    value={newListName}
                    onChange={(e) => setNewListName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateList()}
                    className="w-full bg-white border-2 border-primary-50 rounded-2xl px-5 py-3 text-sm font-bold focus:outline-none focus:border-primary-500 shadow-sm transition-all"
                  />
                  <div className="flex gap-3">
                    <button 
                      onClick={handleCreateList}
                      className="flex-2 bg-primary-600 text-white text-xs font-black py-3 rounded-xl shadow-lg shadow-primary-100"
                    >
                      Save
                    </button>
                    <button 
                      onClick={() => setIsCreating(false)}
                      className="flex-1 bg-white border border-gray-100 text-gray-400 text-xs font-black py-3 rounded-xl"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                {wishlists.map(list => (
                  <button
                    key={list.id}
                    onClick={() => setSelectedListId(list.id)}
                    className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl text-sm font-black transition-all group ${
                      selectedListId === list.id 
                        ? 'bg-white text-primary-600 shadow-xl shadow-black/5 ring-1 ring-gray-100' 
                        : 'text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    <span className="flex items-center gap-4">
                      <div className={`w-2 h-2 rounded-full ${selectedListId === list.id ? 'bg-primary-600' : 'bg-transparent'}`} />
                      {list.name}
                    </span>
                    {list.isDefault && <span className="text-[10px] opacity-40 uppercase tracking-tighter">Default</span>}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* Main Content: Items */}
          <main className="lg:col-span-3">
            {loadingItems ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="animate-pulse space-y-5">
                    <div className="aspect-4/5 bg-gray-50 rounded-5xl" />
                    <div className="h-5 w-2/3 bg-gray-50 rounded-xl" />
                    <div className="h-4 w-1/3 bg-gray-50 rounded-xl" />
                  </div>
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="py-24 text-center bg-gray-50/50 rounded-5xl border-2 border-dashed border-gray-100 flex flex-col items-center">
                <div className="h-24 w-24 rounded-full bg-white shadow-xl flex items-center justify-center mb-8">
                  <PackageSearch className="h-10 w-10 text-gray-200" />
                </div>
                <h3 className="text-3xl font-black text-gray-900 mb-4">Nothing saved yet</h3>
                <p className="text-gray-500 mb-10 max-w-xs mx-auto leading-relaxed">Browse our collection and hit the heart icon to save art you love.</p>
                <Link 
                  href={STORE_PATHS.PRODUCTS}
                  className="inline-flex items-center gap-3 rounded-2xl bg-gray-900 px-10 py-4 font-black text-white shadow-2xl shadow-gray-200 transition hover:bg-black hover:-translate-y-1 active:translate-y-0"
                >

                  Explore Catalog
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
                {items.map(product => (
                  <WishlistItemCard 
                    key={product.id} 
                    product={product} 
                    onRemove={() => handleRemoveItem(product.id)} 
                  />
                ))}
              </div>
            )}
          </main>
        </div>

        {/* Recently Viewed: Full Width Section */}
        {recentlyViewed.length > 0 && (
          <section className="mt-40 pt-20 border-t border-gray-100">
            <div className="flex items-end justify-between mb-12">
              <div>
                <h2 className="text-4xl font-black text-gray-900 tracking-tighter mb-2">History</h2>
                <p className="text-gray-400 font-bold italic">You recently explored these items</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8">
              {recentlyViewed.slice(0, 5).map(p => (
                <Link key={p.id} href={getProductUrl(p)} className="group block space-y-4">

                  <div className="aspect-4/5 rounded-3xl overflow-hidden bg-gray-50 border border-gray-100 shadow-sm transition-all duration-500 group-hover:shadow-2xl group-hover:-translate-y-2">
                    <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-gray-900 group-hover:text-primary-600 transition-colors line-clamp-1">{p.name}</h3>
                    <p className="text-xs font-bold text-gray-400 mt-1">${(p.price / 100).toFixed(2)}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function WishlistItemCard({ product, onRemove }: { product: Product, onRemove: () => void }) {
  const { addItem } = useCart();
  const [adding, setAdding] = useState(false);

  async function handleAddToCart() {
    setAdding(true);
    try {
      await addItem(product.id, 1);
    } finally {
      setAdding(false);
    }
  }

  async function handleMoveToCart() {
    setAdding(true);
    try {
      await addItem(product.id, 1);
      onRemove();
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="group bg-white rounded-5xl border border-gray-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 overflow-hidden">
      <div className="relative aspect-4/5 overflow-hidden bg-gray-50">
        <Link href={getProductUrl(product)} className="block h-full w-full">

          <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
        </Link>
        
        <div className="absolute top-5 right-5 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-4 group-hover:translate-x-0">
          <button 
            onClick={onRemove}
            className="p-3 rounded-2xl bg-white/90 backdrop-blur-md text-gray-400 hover:text-red-500 hover:bg-white shadow-xl transition-all"
            title="Remove from favorites"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>

        <div className="absolute inset-x-5 bottom-5">
           <button
            onClick={handleMoveToCart}
            disabled={adding || product.stock === 0}
            className="w-full h-14 flex items-center justify-center gap-3 bg-white/90 backdrop-blur-md text-gray-900 rounded-[1.25rem] font-black text-xs uppercase tracking-widest shadow-2xl hover:bg-primary-600 hover:text-white transition-all disabled:opacity-50"
          >
            <ShoppingBag className="w-4 h-4" />
            {adding ? 'Adding...' : 'Move to Cart'}
          </button>
        </div>
      </div>
      
      <div className="p-8">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary-600">{product.category}</p>
          <span className={`h-2 w-2 rounded-full ${product.stock > 0 ? 'bg-green-500' : 'bg-red-500'} shadow-sm shadow-black/10`} />
        </div>
        
        <h3 className="text-lg font-black text-gray-900 group-hover:text-primary-600 transition-colors line-clamp-1 mb-3">
          <Link href={getProductUrl(product)}>{product.name}</Link>
        </h3>

        
        <div className="flex items-center justify-between">
          <p className="text-2xl font-black text-gray-900 tracking-tight">${(product.price / 100).toFixed(2)}</p>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{product.stock > 0 ? 'Ready to Ship' : 'Waitlist'}</p>
        </div>
      </div>
    </div>
  );
}
