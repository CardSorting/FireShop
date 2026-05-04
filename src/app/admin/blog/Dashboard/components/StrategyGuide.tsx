import React from 'react';
import { Plus, Sparkles } from 'lucide-react';

export const StrategyGuide: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-modal flex items-center justify-center p-6 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-300">
       <div className="bg-white rounded-[3rem] w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-500">
          <div className="bg-primary-600 p-12 text-white relative">
             <button onClick={onClose} className="absolute top-8 right-8 h-10 w-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all">
                <Plus className="h-5 w-5 rotate-45" />
             </button>
             <Sparkles className="h-12 w-12 mb-6 opacity-50" />
             <h2 className="text-4xl font-black tracking-tight">Editorial Strategy Guide</h2>
             <p className="text-primary-100 mt-2 font-medium">How to write stories that captivate and convert.</p>
          </div>
          <div className="p-12 space-y-10">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                   <h4 className="text-[10px] font-black uppercase tracking-widest text-primary-600">The Golden Rule</h4>
                   <p className="text-sm text-gray-600 leading-relaxed font-medium">Aim for <span className="font-bold text-gray-900">1,200+ words</span>. Longer content establishes authority and provides more value to collectors.</p>
                </div>
                <div className="space-y-3">
                   <h4 className="text-[10px] font-black uppercase tracking-widest text-blue-600">Visual Impact</h4>
                   <p className="text-sm text-gray-600 leading-relaxed font-medium">Always include at least <span className="font-bold text-gray-900">3 high-quality images</span>. Visual breaks increase reading retention by 40%.</p>
                </div>
                <div className="space-y-3">
                   <h4 className="text-[10px] font-black uppercase tracking-widest text-amber-600">SEO Essentials</h4>
                   <p className="text-sm text-gray-600 leading-relaxed font-medium">Keep titles under <span className="font-bold text-gray-900">60 characters</span> and use the slug to target primary keywords.</p>
                </div>
                <div className="space-y-3">
                   <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-600">The Hook</h4>
                   <p className="text-sm text-gray-600 leading-relaxed font-medium">The first <span className="font-bold text-gray-900">200 words</span> are critical. Use a compelling excerpt to drive click-throughs.</p>
                </div>
             </div>
             <button 
               onClick={onClose}
               className="w-full py-5 bg-gray-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-800 transition-all"
             >
               Got it, Let's Write
             </button>
          </div>
       </div>
    </div>
  );
};
