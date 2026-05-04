'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Star, ShoppingCart, Eye, Sparkles, TrendingUp, Heart, Check } from 'lucide-react';
import { HiveCell } from '../Logo';
import { formatCurrency } from '@utils/formatters';
import { useWishlist } from '../../hooks/useWishlist';
import type { Product } from '@domain/models';

interface ProductCardProps {
  product: Product;
  onAddToCart?: (id: string) => void;
  onQuickView?: (product: Product) => void;
  priority?: boolean;
}

export function ProductCard({ product, onAddToCart, onQuickView, priority = false }: ProductCardProps) {
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();
  const [isAdding, setIsAdding] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  const favorited = isInWishlist(product.id);
  const isNew = product.tags?.includes('new') || (product.createdAt instanceof Date && product.createdAt > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
  const isTrending = product.tags?.includes('trending') || product.tags?.includes('popular') || product.tags?.includes('bestseller');
  const displayRating = (product as any).averageRating ?? (product.tags?.includes('featured') ? 5.0 : null);

  const handleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      if (favorited) {
        await removeFromWishlist(product.id);
      } else {
        await addToWishlist(product.id);
      }
    } catch (err) {
      console.error('Wishlist action failed', err);
    }
  };

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (isAdding || showSuccess) return;
    
    setIsAdding(true);
    try {
      await onAddToCart?.(product.id);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    } catch (err) {
      console.error('Add to cart failed', err);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="group relative flex flex-col h-full">
      {/* Visual Container */}
      <div className="relative aspect-4/5 rounded-4xl overflow-hidden bg-gray-50 border border-gray-100 shadow-sm transition-all duration-700 group-hover:-translate-y-2 group-hover:shadow-2xl group-hover:shadow-primary-100/50">
        <Link href={`/products/${product.handle || product.id}`} className="absolute inset-0 z-10" aria-label={`View ${product.name}`}>
          <img
            src={product.imageUrl}
            alt={product.name}
            loading={priority ? 'eager' : 'lazy'}
            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
          />
        </Link>

        {/* Floating Badges */}
        <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
          {isNew && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/90 backdrop-blur-md shadow-lg border border-white/50 text-gray-900 text-[9px] font-black uppercase tracking-widest animate-in fade-in slide-in-from-left-4 duration-500">
              <Sparkles className="w-3 h-3 text-amber-500" /> New Drop
            </div>
          )}
          {isTrending && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary-600/90 backdrop-blur-md shadow-lg border border-primary-500/50 text-white text-[9px] font-black uppercase tracking-widest animate-in fade-in slide-in-from-left-4 duration-500 delay-100">
              <TrendingUp className="w-3 h-3" /> Trending
            </div>
          )}
        </div>

        {/* Wishlist Toggle */}
        <button
          onClick={handleWishlist}
          aria-label={favorited ? "Remove from wishlist" : "Add to wishlist"}
          className={`absolute top-4 right-4 z-20 h-10 w-10 flex items-center justify-center rounded-xl backdrop-blur-md transition-all duration-300 ${
            favorited 
              ? 'bg-red-500 text-white shadow-red-200 shadow-lg scale-110' 
              : 'bg-white/80 text-gray-400 hover:text-red-500 hover:scale-110 shadow-lg'
          }`}
        >
          <Heart className={`h-4 w-4 ${favorited ? 'fill-current' : ''}`} />
        </button>

        {/* Action Overlay */}
        <div className="absolute inset-x-4 bottom-4 z-20 flex gap-2 translate-y-12 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
          <button 
            onClick={handleAddToCart}
            disabled={isAdding || showSuccess}
            aria-label={showSuccess ? "Item added to cart" : `Add ${product.name} to cart`}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl ${
              showSuccess 
                ? 'bg-green-500 text-white ring-4 ring-green-100' 
                : 'bg-gray-900 text-white hover:bg-black'
            }`}
          >
            {showSuccess ? (
              <>
                <Check className="w-3.5 h-3.5" /> Added!
              </>
            ) : isAdding ? (
              <div className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <ShoppingCart className="w-3.5 h-3.5" /> Quick Add
              </>
            )}
          </button>
          <button 
            onClick={(e) => {
              e.preventDefault();
              onQuickView?.(product);
            }}
            aria-label="Quick View"
            className="w-12 h-12 flex items-center justify-center bg-white/90 backdrop-blur-md rounded-2xl text-gray-900 hover:bg-white transition-colors shadow-xl"
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="mt-6 px-1 flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-primary-600 uppercase tracking-widest">
              {product.category}
            </span>
            <div className="h-1 w-1 rounded-full bg-gray-200" />
            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
               Handcrafted
            </span>
          </div>
          {displayRating && (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-primary-50">
              <HiveCell className="w-3 h-3 text-primary-600" />
              <span className="text-[10px] font-black text-primary-700">{displayRating.toFixed(1)}</span>
            </div>
          )}
        </div>

        <h3 className="font-bold text-gray-900 text-lg leading-tight mb-2 group-hover:text-primary-600 transition-colors">
          <Link href={`/products/${product.handle || product.id}`}>{product.name}</Link>
        </h3>
        
        <div className="mt-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <p className="text-xl font-black text-gray-900 tracking-tight">
              {formatCurrency(product.price)}
            </p>
            <HiveCell className="w-3 h-3 text-primary-200" />
          </div>
          <div className="flex flex-col items-end">
            {product.stock <= 5 && product.stock > 0 && (
              <p className="text-[9px] font-bold text-red-500 uppercase tracking-tight animate-pulse">
                Only {product.stock} left in stock
              </p>
            )}
            {product.stock === 0 && (
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tight">
                Sold Out
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
