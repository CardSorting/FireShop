'use client';

/**
 * Product Info: title, artist, rating, and social proof.
 * Pattern: Etsy — artist-first attribution, star ratings, share button.
 */
import { Star, Share2 } from 'lucide-react';
import { formatCurrency } from '@utils/formatters';
import { useEffect, useRef, useState } from 'react';

interface ProductInfoProps {
  name: string;
  vendor?: string;
  category: string;
  currentPrice: number;
  compareAtPrice: number | null;
}

export function ProductInfo({ name, vendor, category, currentPrice, compareAtPrice }: ProductInfoProps) {
  const [copied, setCopied] = useState(false);
  const copiedTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (copiedTimerRef.current !== null) {
        window.clearTimeout(copiedTimerRef.current);
      }
    };
  }, []);

  function handleShare() {
    if (navigator.share) {
      navigator.share({ title: name, url: window.location.href }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      if (copiedTimerRef.current !== null) {
        window.clearTimeout(copiedTimerRef.current);
      }
      copiedTimerRef.current = window.setTimeout(() => {
        setCopied(false);
        copiedTimerRef.current = null;
      }, 2000);
    }
  }

  const discountPercent = compareAtPrice && compareAtPrice > currentPrice
    ? Math.round((1 - currentPrice / compareAtPrice) * 100)
    : null;

  return (
    <section className="space-y-5">
      {/* Category & Share Row */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary-600">
          {category}
        </span>
        <button
          onClick={handleShare}
          className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-900 transition-colors"
          aria-label="Share this product"
        >
          <Share2 className="w-3.5 h-3.5" />
          {copied ? 'Copied!' : 'Share'}
        </button>
      </div>

      {/* Product Title */}
      <h1 className="text-3xl lg:text-5xl font-black text-gray-900 leading-[1.1] tracking-[-0.03em]">
        {name}
      </h1>

      {/* Artist Attribution */}
      {vendor && (
        <p className="text-sm text-gray-500 font-medium">
          by <span className="text-primary-600 font-bold">{vendor}</span>
        </p>
      )}

      {/* Rating Row */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map(i => (
            <Star key={i} className={`w-4 h-4 ${i <= 4 ? 'text-amber-400 fill-current' : 'text-gray-200'}`} />
          ))}
          <span className="ml-1.5 text-sm font-bold text-gray-900">4.8</span>
        </div>
        <span className="text-xs text-gray-400 font-medium">128 reviews</span>
      </div>

      {/* Price (visible on mobile, hidden on desktop where buy box shows it) */}
      <div className="lg:hidden flex items-baseline gap-3 pt-2">
        <span className="text-3xl font-black text-gray-900 tracking-tight">
          {formatCurrency(currentPrice)}
        </span>
        {compareAtPrice && (
          <span className="text-lg text-gray-300 line-through font-bold">
            {formatCurrency(compareAtPrice)}
          </span>
        )}
        {discountPercent && (
          <span className="bg-red-50 text-red-600 px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest">
            Save {discountPercent}%
          </span>
        )}
      </div>
    </section>
  );
}
