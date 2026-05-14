'use client';

/**
 * Buy Box: price, quantity, add-to-cart, wishlist, trust signals.
 * Pattern: Amazon/Shopify — sticky buy box, urgency for low stock only,
 * clear CTA hierarchy, branded installment messaging.
 */
import {
  ShoppingCart, Heart, Check, Truck, RefreshCcw, ShieldCheck, ChevronDown
} from 'lucide-react';
import { formatCurrency } from '@utils/formatters';
import type { Wishlist } from '@domain/models';
import { useEffect, useRef } from 'react';

interface ProductBuyBoxProps {
  currentPrice: number;
  compareAtPrice: number | null;
  currentStock: number;
  quantity: number;
  maxSelectableQuantity: number;
  adding: boolean;
  added: boolean;
  cartError: string | null;
  isFavorite: boolean;
  // Wishlist
  wishlists: Wishlist[];
  showWishlistDropdown: boolean;
  setShowWishlistDropdown: (v: boolean) => void;
  newCollectionName: string;
  setNewCollectionName: (v: string) => void;
  creatingCollection: boolean;
  // Actions
  onAddToCart: () => void;
  onIncrement: () => void;
  onDecrement: () => void;
  onAddToCollection: (wishlistId: string) => void;
  onCreateAndAdd: () => void;
  onOpenCart: () => void;
}

export function ProductBuyBox({
  currentPrice, compareAtPrice, currentStock,
  quantity, maxSelectableQuantity,
  adding, added, cartError, isFavorite,
  wishlists, showWishlistDropdown, setShowWishlistDropdown,
  newCollectionName, setNewCollectionName, creatingCollection,
  onAddToCart, onIncrement, onDecrement,
  onAddToCollection, onCreateAndAdd, onOpenCart,
}: ProductBuyBoxProps) {
  // Click-outside handler for wishlist dropdown
  const dropdownRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!showWishlistDropdown) return;
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowWishlistDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showWishlistDropdown, setShowWishlistDropdown]);

  const discountPercent = compareAtPrice && compareAtPrice > currentPrice
    ? Math.round((1 - currentPrice / compareAtPrice) * 100)
    : null;

  const deliveryDate = new Date();
  deliveryDate.setDate(deliveryDate.getDate() + 3);
  const deliveryEnd = new Date();
  deliveryEnd.setDate(deliveryEnd.getDate() + 5);
  const deliveryStr = `${deliveryDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${deliveryEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;

  return (
    <div className="bg-white rounded-4xl border border-gray-100 shadow-xl shadow-black/5 p-8 space-y-8">
      {/* Price */}
      <div>
        <div className="flex items-baseline gap-3 mb-2">
          <span className="text-4xl font-black text-gray-900 tracking-tighter">
            {formatCurrency(currentPrice)}
          </span>
          {compareAtPrice && (
            <span className="text-lg text-gray-300 line-through font-bold">
              {formatCurrency(compareAtPrice)}
            </span>
          )}
          {discountPercent && (
            <span className="bg-red-50 text-red-600 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">
              -{discountPercent}%
            </span>
          )}
        </div>
        <p className="text-xs text-gray-400 font-medium">
          or 4 interest-free payments of {formatCurrency(Math.ceil(currentPrice / 4))} with <span className="font-bold text-gray-600">Shop Pay</span>
        </p>
      </div>

      {/* Availability & Urgency */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Check className="w-5 h-5 text-green-500" />
          <span className="text-sm font-black text-green-600">
            {currentStock === 0 ? 'Sold Out' : 'Ready to Ship'}
          </span>
        </div>

        {/* Social Proof Metric */}
        <p className="text-[13px] font-bold text-gray-500 leading-tight">
          <span className="text-primary-600">12 people</span> have this in their cart right now.
        </p>
      </div>

      {/* Quantity */}
      <div>
        <label className="text-xs font-bold text-gray-600 mb-2 block">Quantity</label>
        <div className="flex items-center gap-1 bg-gray-50 rounded-xl p-1 w-fit border border-gray-100">
          <button
            onClick={onDecrement}
            disabled={quantity <= 1}
            className="h-10 w-10 flex items-center justify-center rounded-lg bg-white shadow-sm text-gray-500 hover:text-gray-900 transition-all disabled:opacity-30 focus-visible:ring-2 focus-visible:ring-primary-500 outline-none"
            aria-label="Decrease quantity"
          >
            −
          </button>
          <span className="w-12 text-center font-black text-gray-900">{quantity}</span>
          <button
            onClick={onIncrement}
            disabled={quantity >= maxSelectableQuantity}
            className="h-10 w-10 flex items-center justify-center rounded-lg bg-white shadow-sm text-gray-500 hover:text-gray-900 transition-all disabled:opacity-30 focus-visible:ring-2 focus-visible:ring-primary-500 outline-none"
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>
      </div>

      {/* CTA Buttons */}
      <div className="space-y-3">
        <button
          onClick={added ? onOpenCart : onAddToCart}
          disabled={adding || currentStock === 0}
          className={`w-full h-14 flex items-center justify-center gap-3 rounded-2xl font-bold text-sm uppercase tracking-wider transition-all disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 outline-none ${
            added
              ? 'bg-green-600 text-white'
              : 'bg-gray-900 text-white hover:bg-black shadow-xl shadow-gray-200 hover:-translate-y-0.5 active:translate-y-0'
          }`}
        >
          {added ? <Check className="w-5 h-5" /> : <ShoppingCart className="w-5 h-5" />}
          {adding ? 'Adding...' : added ? 'View Cart' : currentStock === 0 ? 'Sold Out' : 'Add to Cart'}
        </button>

        {/* Wishlist */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowWishlistDropdown(!showWishlistDropdown)}
            className={`w-full h-12 flex items-center justify-center gap-2 rounded-2xl border text-sm font-bold transition-all focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 outline-none ${
              isFavorite
                ? 'bg-red-50 border-red-100 text-red-500'
                : 'bg-white border-gray-200 text-gray-500 hover:border-gray-400'
            }`}
          >
            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
            {isFavorite ? 'Saved to Wishlist' : 'Add to Wishlist'}
          </button>

          {showWishlistDropdown && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-2xl shadow-2xl z-20 p-3 space-y-1 animate-in fade-in slide-in-from-top-2 duration-200">
              {wishlists.map(list => (
                <button
                  key={list.id}
                  onClick={() => onAddToCollection(list.id)}
                  className="w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  {list.name}
                </button>
              ))}
              <div className="border-t border-gray-100 pt-2 mt-2">
                <input
                  type="text"
                  placeholder="New collection name..."
                  value={newCollectionName}
                  onChange={e => setNewCollectionName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && onCreateAndAdd()}
                  className="w-full px-4 py-2 text-sm rounded-xl border border-gray-100 focus:border-primary-500 outline-none"
                />
                {newCollectionName.trim() && (
                  <button
                    onClick={onCreateAndAdd}
                    disabled={creatingCollection}
                    className="w-full mt-2 py-2 rounded-xl bg-primary-600 text-white text-xs font-bold disabled:opacity-50"
                  >
                    {creatingCollection ? 'Creating...' : 'Create & Add'}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Error message */}
      {cartError && (
        <p className="text-sm text-red-600 font-medium bg-red-50 rounded-xl px-4 py-3">{cartError}</p>
      )}

    </div>
  );
}
