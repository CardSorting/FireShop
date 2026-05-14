
'use client';

/**
 * [LAYER: UI]
 * ProductInfo — Compressed Boutique Header
 */
import { Star, Share2, Truck, RefreshCcw, ShieldCheck } from 'lucide-react';
import { formatCurrency } from '@utils/formatters';
import { useEffect, useRef, useState } from 'react';

interface ProductInfoProps {
  name: string;
  vendor?: string;
  category: string;
  currentPrice: number;
  compareAtPrice: number | null;
  description: string;
  seoDescription?: string;
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

  // Clean title
  const simplifiedName = name.split('|')[0].split(' - ')[0].split(' – ')[0].trim();

  // Delivery calculation
  const deliveryDate = new Date();
  deliveryDate.setDate(deliveryDate.getDate() + 3);
  const deliveryEnd = new Date();
  deliveryEnd.setDate(deliveryEnd.getDate() + 5);
  const deliveryStr = `${deliveryDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${deliveryEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;

  return (
    <section className="space-y-4">
      {/* Category & Share Row */}
      <div className="flex items-center justify-between pb-1">
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-black uppercase tracking-widest text-primary-600 bg-primary-50/50 px-1.5 py-0.5 rounded">
            {category}
          </span>
          {vendor && (
            <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">
              {vendor}
            </span>
          )}
        </div>
        <button
          onClick={handleShare}
          className="text-[9px] font-black uppercase tracking-widest text-gray-300 hover:text-gray-900 transition-colors"
        >
          Share
        </button>
      </div>

      {/* Product Title */}
      <h1 className="text-2xl lg:text-4xl font-black text-gray-900 leading-tight tracking-tight">
        {simplifiedName}
      </h1>

      {/* Rating Row */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-0.5">
          <Star className="w-3 h-3 text-amber-400 fill-current" />
          <span className="ml-1 text-[11px] font-black text-gray-900">4.8</span>
        </div>
        <span className="text-[10px] text-gray-300 font-bold uppercase tracking-tighter">128 reviews</span>
      </div>

      {/* Trust Signals (Moved from Buy Box) */}
      <div className="mt-6 pt-6 border-t border-gray-50 space-y-4">
        <div className="flex items-start gap-3 text-sm">
          <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
            <Truck className="w-4 h-4 text-primary-600" />
          </div>
          <div>
            <p className="text-[11px] font-black text-gray-900 leading-none">Free shipping on orders over $50</p>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide mt-1">Delivery: {deliveryStr}</p>
          </div>
        </div>

        <div className="flex items-start gap-3 text-sm">
          <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
            <RefreshCcw className="w-4 h-4 text-primary-600" />
          </div>
          <div>
            <p className="text-[11px] font-black text-gray-900 leading-none">30-day returns — no questions asked</p>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide mt-1">Shop with 100% confidence</p>
          </div>
        </div>

        <div className="flex items-start gap-3 text-sm">
          <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-4 h-4 text-primary-600" />
          </div>
          <div>
            <p className="text-[11px] font-black text-gray-900 leading-none">Secure checkout — powered by Stripe</p>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide mt-1">Encrypted & PCI Compliant</p>
          </div>
        </div>
      </div>

      {/* Price (Mobile Only) */}
      <div className="lg:hidden flex items-baseline gap-3 pt-2">
        <span className="text-3xl font-black text-gray-900 tracking-tight">
          {formatCurrency(currentPrice)}
        </span>
        {compareAtPrice && (
          <span className="text-lg text-gray-300 line-through font-bold">
            {formatCurrency(compareAtPrice!)}
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
