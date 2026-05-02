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
            <p className="text-sm font-bold text-gray-900 uppercase tracking-tight">Authentic</p>
            <p className="text-xs text-gray-500 mt-1">100% Genuine Cards</p>
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
              <Link href="/" className="flex items-center gap-3 text-primary-700 font-black text-3xl tracking-tighter hover:opacity-80 transition-opacity">
                <Package className="w-10 h-10" />
                PlayMoreTCG
              </Link>
              <p className="text-gray-500 text-base leading-relaxed">
                Founded by collectors, for collectors. We are building the world's most trusted platform for Trading Card Games, ensuring every player has access to the cards they love.
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              {[
                { icon: MessageCircle, label: 'Discord' },
                { icon: Camera, label: 'Instagram' },
                { icon: Users, label: 'Community' },
                { icon: Globe, label: 'Website' }
              ].map((social, i) => (
                <Link 
                  key={i} 
                  href="#" 
                  className="w-12 h-12 flex items-center justify-center rounded-xl bg-white border border-gray-100 text-gray-400 hover:text-primary-600 hover:border-primary-100 hover:shadow-lg hover:shadow-primary-600/5 transition-all duration-300"
                  aria-label={social.label}
                >
                  <social.icon className="w-5 h-5" />
                </Link>
              ))}
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

          {/* Navigation Groups */}
          <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-8">
            {/* Shop Navigation */}
            <div className="space-y-6">
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Shop</h3>
              <ul className="space-y-4">
                <li><Link href="/products" className="text-sm font-semibold text-gray-600 hover:text-primary-600 transition-colors">New Releases</Link></li>
                <li><Link href="/products?category=rare" className="text-sm font-semibold text-gray-600 hover:text-primary-600 transition-colors">Single Cards</Link></li>
                <li><Link href="/products?category=sealed" className="text-sm font-semibold text-gray-600 hover:text-primary-600 transition-colors">Sealed Boxes</Link></li>
                <li><Link href="/products?category=sale" className="text-sm font-semibold text-primary-600 flex items-center">Clearance <Zap className="w-3 h-3 ml-1 fill-current" /></Link></li>
              </ul>
            </div>

            {/* Services Navigation */}
            <div className="space-y-6">
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Services</h3>
              <ul className="space-y-4">
                <li><Link href="/grading" className="text-sm font-semibold text-gray-600 hover:text-primary-600 transition-colors">Professional Grading</Link></li>
                <li><Link href="/sell" className="text-sm font-semibold text-gray-600 hover:text-primary-600 transition-colors">Sell Your Cards</Link></li>
                <li><Link href="/trade" className="text-sm font-semibold text-gray-600 hover:text-primary-600 transition-colors">Trade-In Program</Link></li>
                <li><Link href="/protection" className="text-sm font-semibold text-gray-600 hover:text-primary-600 transition-colors">Card Protection</Link></li>
              </ul>
            </div>

            {/* Community Navigation */}
            <div className="space-y-6">
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Community</h3>
              <ul className="space-y-4">
                <li><Link href="/events" className="text-sm font-semibold text-gray-600 hover:text-primary-600 transition-colors">Live Events</Link></li>
                <li><Link href="/blog" className="text-sm font-semibold text-gray-600 hover:text-primary-600 transition-colors">Strategy Blog</Link></li>
                <li><Link href="/forums" className="text-sm font-semibold text-gray-600 hover:text-primary-600 transition-colors">Player Forums</Link></li>
                <li><Link href="/affiliate" className="text-sm font-semibold text-gray-600 hover:text-primary-600 transition-colors">Affiliate Program</Link></li>
              </ul>
            </div>

            {/* Support Navigation */}
            <div className="space-y-6">
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Support</h3>
              <ul className="space-y-4">
                <li><Link href="/help" className="text-sm font-semibold text-gray-600 hover:text-primary-600 transition-colors">Help Center</Link></li>
                <li><Link href="/track-order" className="text-sm font-black text-primary-600 flex items-center gap-2 hover:text-primary-700 transition-colors">Track Order <ArrowRight className="w-3 h-3" /></Link></li>
                <li><Link href="/rewards" className="text-sm font-black text-amber-600 flex items-center gap-2 hover:text-amber-700 transition-colors">Rewards <Sparkles className="w-3 h-3 fill-current" /></Link></li>
                <li><Link href="/returns" className="text-sm font-semibold text-gray-600 hover:text-primary-600 transition-colors">Returns</Link></li>
              </ul>
            </div>
          </div>
        </div>

        {/* Newsletter & Community Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-20">
           {/* Discord CTA */}
           <div className="bg-[#5865F2] rounded-[2.5rem] p-10 text-white relative overflow-hidden group border border-white/10">
              <div className="relative z-10">
                 <div className="flex items-center gap-4 mb-8">
                    <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center text-white">
                       <MessageCircle className="w-8 h-8" />
                    </div>
                    <div>
                       <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 mb-1">Community Hub</p>
                       <h2 className="text-2xl font-black tracking-tight">Join 12k+ Collectors</h2>
                    </div>
                 </div>
                 <p className="text-lg font-medium leading-relaxed mb-10 max-w-sm opacity-90">
                    Get early drop alerts, trade advice, and exclusive weekly giveaways.
                 </p>
                 <button className="px-8 py-4 bg-white text-[#5865F2] rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-100 transition-all flex items-center gap-3 shadow-xl">
                    Join Discord <ArrowRight className="w-4 h-4" />
                 </button>
              </div>
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-[80px] -mr-32 -mt-32" />
           </div>

           {/* Newsletter CTA */}
           <div className="bg-gray-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden border border-white/5 shadow-2xl">
              <div className="relative z-10">
                 <div className="flex items-center gap-4 mb-8">
                    <div className="w-14 h-14 rounded-2xl bg-primary-500/20 flex items-center justify-center text-primary-400">
                       <Mail className="w-8 h-8" />
                    </div>
                    <div>
                       <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-1">The Daily Pull</p>
                       <h2 className="text-2xl font-black tracking-tight">The Best TCG Newsletter</h2>
                    </div>
                 </div>
                 <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                    <input
                      type="email"
                      placeholder="you@example.com"
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all font-medium"
                    />
                    <button className="w-full bg-primary-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-primary-500 transition-all shadow-xl shadow-primary-600/20">
                       Subscribe Now
                    </button>
                 </form>
              </div>
           </div>
        </div>

        {/* Bottom Utility Bar */}
        <div className="pt-10 border-t border-gray-100 flex flex-col lg:flex-row justify-between items-center gap-10">
          <div className="flex flex-wrap justify-center lg:justify-start gap-x-10 gap-y-4">
            <Link href="/terms" className="text-xs font-bold text-gray-400 hover:text-gray-900 transition-colors uppercase tracking-widest">Terms</Link>
            <Link href="/privacy" className="text-xs font-bold text-gray-400 hover:text-gray-900 transition-colors uppercase tracking-widest">Privacy</Link>
            <Link href="/accessibility" className="text-xs font-bold text-gray-400 hover:text-gray-900 transition-colors uppercase tracking-widest">Accessibility</Link>
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
              © {currentYear} PlayMoreTCG. All Rights Reserved.
            </p>
            <p className="text-[10px] font-bold text-primary-500 mt-1 uppercase tracking-tighter">
              The World's Favorite TCG Marketplace
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
