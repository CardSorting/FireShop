'use client';

/**
 * [LAYER: UI]
 */
import Link from 'next/link';
import { 
  Package, 
  MessageCircle, 
  Camera, 
  Users, 
  Globe, 
  Mail, 
  ArrowUp, 
  CreditCard, 
  ShieldCheck, 
  ChevronDown,
  Star,
  Zap,
  Lock,
  ArrowRight,
  ShieldAlert,
  Headset,
  Sparkles
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { getProductUrl, getCollectionUrl, STORE_PATHS } from '@utils/navigation';


export function Footer() {
  const currentYear = new Date().getFullYear();
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-white pt-24 pb-8 relative overflow-hidden">
      {/* Decorative Gradient Top Border */}
      <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-primary-500/30 to-transparent"></div>

      {/* Back to Top Button - Redesigned */}
      <button
        onClick={scrollToTop}
        className={`fixed bottom-10 right-10 z-50 p-4 bg-primary-600 text-white rounded-2xl shadow-2xl hover:bg-primary-700 transition-all duration-500 transform hover:scale-110 active:scale-95 group ${
          showScrollTop ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0 pointer-events-none'
        }`}
        aria-label="Back to top"
      >
        <ArrowUp className="w-5 h-5 group-hover:-translate-y-1 transition-transform" />
      </button>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Trust Bar - Social Proof & Security */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-20">
          <div className="flex flex-col items-center p-6 bg-gray-50/50 rounded-2xl border border-gray-100 hover:border-primary-100 transition-colors group">
            <div className="flex text-yellow-400 mb-2">
              {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-current" />)}
            </div>
            <p className="text-sm font-bold text-gray-900 uppercase tracking-tight">4.9/5 Rating</p>
            <p className="text-xs text-gray-500 mt-1">From 10,000+ Players</p>
          </div>
          <div className="flex flex-col items-center p-6 bg-gray-50/50 rounded-2xl border border-gray-100 hover:border-primary-100 transition-colors">
            <Zap className="w-6 h-6 text-primary-600 mb-2" />
            <p className="text-sm font-bold text-gray-900 uppercase tracking-tight">Fast Shipping</p>
            <p className="text-xs text-gray-500 mt-1">24h Order Processing</p>
          </div>
          <div className="flex flex-col items-center p-6 bg-gray-50/50 rounded-2xl border border-gray-100 hover:border-primary-100 transition-colors">
            <ShieldCheck className="w-6 h-6 text-green-600 mb-2" />
            <p className="text-sm font-bold text-gray-900 uppercase tracking-tight">Artist Direct</p>
            <p className="text-xs text-gray-500 mt-1">100% Support Creators</p>
          </div>
          <div className="flex flex-col items-center p-6 bg-gray-50/50 rounded-2xl border border-gray-100 hover:border-primary-100 transition-colors">
            <Lock className="w-6 h-6 text-gray-900 mb-2" />
            <p className="text-sm font-bold text-gray-900 uppercase tracking-tight">Secure Pay</p>
            <p className="text-xs text-gray-500 mt-1">SSL Encrypted Checkout</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 mb-20">
          {/* Brand and Description */}
          <div className="lg:col-span-4 space-y-8">
            <div className="space-y-4">
              <Link href={STORE_PATHS.HOME} className="flex items-center gap-3 text-primary-700 font-black text-3xl tracking-tighter hover:opacity-80 transition-opacity">

                <Package className="w-10 h-10" />
                DreamBeesArt
              </Link>
              <p className="text-gray-500 text-base leading-relaxed">
                Founded by artists, for art lovers. We are building the world's most trusted platform for independent artists and fan merch, ensuring every creator can share their art.
              </p>
            </div>
            


            <div className="flex items-center gap-3 p-4 bg-primary-600 rounded-2xl text-white shadow-xl shadow-primary-600/20 group cursor-pointer hover:bg-primary-700 transition-colors">
              <Headset className="w-6 h-6" />
              <div>
                <p className="text-xs font-bold uppercase tracking-wider opacity-80">Need help?</p>
                <p className="text-sm font-black">24/7 Expert Support</p>
              </div>
              <ArrowRight className="w-4 h-4 ml-auto group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Navigation Groups - Minimalist */}
          <div className="lg:col-span-8 flex flex-wrap justify-start lg:justify-end gap-16">
            <div className="space-y-4">
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Shop</h3>
              <ul className="space-y-3">
                <li><Link href={STORE_PATHS.PRODUCTS} className="text-sm font-semibold text-gray-600 hover:text-primary-600 transition-colors">All Products</Link></li>
                <li><Link href="/collections/artist-cards" className="text-sm font-semibold text-gray-600 hover:text-primary-600 transition-colors">Artist Cards</Link></li>
                <li><Link href="/collections/prints" className="text-sm font-semibold text-gray-600 hover:text-primary-600 transition-colors">Art Prints</Link></li>
              </ul>
            </div>

            <div className="space-y-4">
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Account</h3>
              <ul className="space-y-3">
                <li><Link href="/login" className="text-sm font-semibold text-gray-600 hover:text-primary-600 transition-colors">Sign In</Link></li>
                <li><Link href="/orders" className="text-sm font-semibold text-gray-600 hover:text-primary-600 transition-colors">Order History</Link></li>
                <li><Link href="/support" className="text-sm font-semibold text-gray-600 hover:text-primary-600 transition-colors">Support Center</Link></li>
              </ul>
            </div>
          </div>
        </div>



        {/* Bottom Utility Bar */}
        <div className="pt-10 border-t border-gray-100 flex flex-col lg:flex-row justify-between items-center gap-10">
          <div className="flex flex-wrap justify-center lg:justify-start gap-x-10 gap-y-4">

            <div className="flex items-center gap-2 text-xs font-bold text-gray-900 px-3 py-1 bg-gray-50 rounded-full border border-gray-100">
              <Globe className="w-3 h-3" />
              <span>US / USD</span>
              <ChevronDown className="w-3 h-3 text-gray-400" />
            </div>
          </div>
          
          <div className="flex items-center gap-8 grayscale opacity-30 hover:grayscale-0 hover:opacity-100 transition-all duration-700">
            <CreditCard className="w-8 h-8" />
            <div className="text-[10px] font-black tracking-tighter uppercase italic border border-gray-200 px-2 py-1 rounded">Mastercard</div>
            <div className="text-[10px] font-black tracking-tighter uppercase border border-gray-200 px-2 py-1 rounded">PayPal</div>
            <div className="text-[10px] font-black tracking-tighter uppercase border border-gray-200 px-2 py-1 rounded">Stripe</div>
            <Lock className="w-4 h-4 text-green-600" />
          </div>

          <div className="text-right">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              © {currentYear} DreamBeesArt. All Rights Reserved.
            </p>
            <p className="text-[10px] font-bold text-primary-500 mt-1 uppercase tracking-tighter">
              The World's Favorite Fan Art Marketplace
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
