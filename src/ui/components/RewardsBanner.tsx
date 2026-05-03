'use client';

import { Star, Gift, Zap, ArrowRight, Sparkles } from 'lucide-react';
import Link from 'next/link';

export function RewardsBanner() {
  return (
    <div className="relative overflow-hidden rounded-[3rem] bg-gray-900 text-white group">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 right-0 w-1/2 h-full opacity-20 pointer-events-none group-hover:opacity-30 transition-opacity duration-1000">
         <div className="absolute inset-0 bg-linear-to-l from-primary-500 via-purple-500 to-transparent" />
         <Sparkles className="absolute top-10 right-10 w-20 h-20 text-white animate-pulse" />
      </div>

      <div className="relative z-10 p-10 md:p-16 flex flex-col md:flex-row items-center justify-between gap-12">
        <div className="max-w-xl text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-primary-400 text-xs font-black uppercase tracking-widest mb-8">
            <Star className="w-3.5 h-3.5 fill-current" /> Exclusive Rewards Program
          </div>
          <h2 className="text-4xl md:text-6xl font-black tracking-tighter leading-none mb-6">
            Join the <br /><span className="text-primary-400">Creator Collective</span>
          </h2>
          <p className="text-gray-400 text-lg font-medium leading-relaxed mb-10 max-w-md">
            Earn points on every purchase, get early access to artist drops, and unlock exclusive collector discounts.
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-4">
             <Link 
               href="/register" 
               className="w-full sm:w-auto px-8 py-5 bg-white text-gray-900 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-primary-500 hover:text-white transition-all shadow-xl shadow-white/5"
             >
               Join the Collective
             </Link>
             <Link 
               href="/rewards" 
               className="w-full sm:w-auto px-8 py-5 bg-gray-800 text-white border border-gray-700 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-700 transition-all"
             >
               How It Works
             </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 w-full md:w-auto">
           <div className="p-8 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 flex flex-col items-center text-center group/card hover:bg-white/10 transition-colors">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 flex items-center justify-center text-amber-500 mb-4 group-hover/card:scale-110 transition-transform">
                 <Zap className="w-6 h-6 fill-current" />
              </div>
              <p className="text-lg font-black tracking-tight mb-1">5 pts</p>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Per $1 Spent</p>
           </div>
           <div className="p-8 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 flex flex-col items-center text-center group/card hover:bg-white/10 transition-colors">
              <div className="w-12 h-12 rounded-2xl bg-primary-500/20 flex items-center justify-center text-primary-500 mb-4 group-hover/card:scale-110 transition-transform">
                 <Gift className="w-6 h-6 fill-current" />
              </div>
              <p className="text-lg font-black tracking-tight mb-1">$10</p>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Birthday Credit</p>
           </div>
           <div className="p-8 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 flex flex-col items-center text-center group/card hover:bg-white/10 transition-colors">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/20 flex items-center justify-center text-purple-500 mb-4 group-hover/card:scale-110 transition-transform">
                 <Star className="w-6 h-6 fill-current" />
              </div>
              <p className="text-lg font-black tracking-tight mb-1">Early</p>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Artist Drops</p>
           </div>
           <div className="p-8 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 flex flex-col items-center text-center group/card hover:bg-white/10 transition-colors">
              <div className="w-12 h-12 rounded-2xl bg-green-500/20 flex items-center justify-center text-green-500 mb-4 group-hover/card:scale-110 transition-transform">
                 <ArrowRight className="w-6 h-6" />
              </div>
              <p className="text-lg font-black tracking-tight mb-1">VIP</p>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Collector Tier</p>
           </div>
        </div>
      </div>
    </div>
  );
}
