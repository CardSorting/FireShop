'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { X, ShoppingBag, Heart, Star, ShieldCheck, Truck, RotateCcw } from 'lucide-react';
import { formatCurrency } from '@utils/formatters';
import type { Product } from '@domain/models';
import { sanitizeImageUrl } from '@utils/imageSanitizer';

interface QuickViewModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (id: string) => void;
  isFavorited: boolean;
  onToggleFavorite: (id: string) => void;
}

export function QuickViewModal({ 
  product, 
  onClose, 
  onAddToCart, 
  isFavorited, 
  onToggleFavorite 
}: QuickViewModalProps) {
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const isMounted = useRef(true);
  const addedTimerRef = useRef<number | null>(null);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      if (addedTimerRef.current !== null) {
        window.clearTimeout(addedTimerRef.current);
      }
    };
  }, []);

  if (!product) return null;

  const handleAddToCart = async () => {
    setAdding(true);
    try {
      await onAddToCart(product.id);
      if (isMounted.current) {
        setAdded(true);
        if (addedTimerRef.current !== null) {
          window.clearTimeout(addedTimerRef.current);
        }
        addedTimerRef.current = window.setTimeout(() => {
          if (isMounted.current) setAdded(false);
          addedTimerRef.current = null;
        }, 2000);
      }
    } finally {
      if (isMounted.current) setAdding(false);
    }
  };

  return (
    <div className="fixed inset-0 z-popover flex items-center justify-center p-4 sm:p-6 lg:p-8">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-gray-900/60 backdrop-blur-md animate-in fade-in duration-300" 
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-5xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500 flex flex-col lg:flex-row max-h-[90vh]">
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 z-50 p-2 bg-white/80 backdrop-blur-md rounded-full text-gray-400 hover:text-gray-900 transition-colors shadow-lg"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Gallery Area */}
        <div className="lg:w-1/2 relative bg-gray-50 h-64 lg:h-auto">
          <Image 
            src={sanitizeImageUrl(product.imageUrl)} 
            alt={product.name}
            fill
            className="object-cover"
          />
          <button 
            onClick={() => onToggleFavorite(product.id)}
            className={`absolute top-6 left-6 p-4 rounded-2xl backdrop-blur-md shadow-xl transition-all ${
              isFavorited ? 'bg-red-500 text-white' : 'bg-white/80 text-gray-400 hover:text-red-500'
            }`}
          >
            <Heart className={`w-5 h-5 ${isFavorited ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Info Area */}
        <div className="lg:w-1/2 p-8 lg:p-12 overflow-y-auto custom-scrollbar flex flex-col">
          <div className="flex items-center gap-3 mb-6">
            <span className="px-3 py-1 bg-primary-50 text-primary-600 rounded-lg text-[10px] font-black uppercase tracking-widest">
              {product.category}
            </span>
            {(product as any).averageRating && (
              <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 rounded-lg text-[10px] font-black text-amber-700">
                <Star className="w-3 h-3 fill-current" /> {((product as any).averageRating as number).toFixed(1)} Rating
              </div>
            )}
          </div>

          <h2 className="text-4xl font-black text-gray-900 tracking-tight mb-4">{product.name}</h2>
          <p className="text-2xl font-black text-gray-900 mb-8">{formatCurrency(product.price)}</p>

          <p className="text-gray-500 leading-relaxed mb-10 font-medium">
            {product.description || 'Discover the intricate details and masterful craftsmanship of this curated piece. Perfect for collectors and art enthusiasts alike.'}
          </p>

          {/* Trust Signals */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-green-50 text-green-600">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-900 uppercase tracking-widest">Authenticated</p>
                <p className="text-[10px] text-gray-400 font-bold">100% Original</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-900 uppercase tracking-widest">Fast Shipping</p>
                <p className="text-[10px] text-gray-400 font-bold">Secure Packaging</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-auto pt-8 border-t border-gray-100 flex flex-col sm:flex-row gap-4">
            <button 
              onClick={handleAddToCart}
              disabled={adding || added || product.stock === 0}
              className={`flex-2 flex items-center justify-center gap-3 py-5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${
                added 
                  ? 'bg-green-500 text-white' 
                  : product.stock === 0 
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-900 text-white hover:bg-black shadow-xl'
              }`}
            >
              {added ? 'Added to Cart' : adding ? 'Adding...' : product.stock === 0 ? 'Sold Out' : (
                <>
                  <ShoppingBag className="w-4 h-4" /> Add to Shopping Bag
                </>
              )}
            </button>
            <Link 
              href={`/products/${product.handle || product.id}`}
              className="flex-1 flex items-center justify-center py-5 rounded-2xl border-2 border-gray-100 font-black text-xs uppercase tracking-widest text-gray-900 hover:bg-gray-50 transition-all"
            >
              View Full Details
            </Link>
          </div>
          
          <div className="mt-6 flex items-center justify-center gap-8">
             <div className="flex items-center gap-2 text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                <RotateCcw className="w-3 h-3" /> 30-Day Returns
             </div>
             <div className="flex items-center gap-2 text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                <ShieldCheck className="w-3 h-3" /> Secure Payment
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
