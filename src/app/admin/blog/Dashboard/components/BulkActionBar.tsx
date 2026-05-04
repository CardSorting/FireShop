import React from 'react';
import { Plus } from 'lucide-react';
import type { DashboardState } from '../types';

export const BulkActionBar: React.FC<Pick<DashboardState, 'selectedPosts' | 'setSelectedPosts' | 'handleBulkAction'>> = ({ 
  selectedPosts, setSelectedPosts, handleBulkAction 
}) => {
  if (selectedPosts.length === 0) return null;

  return (
    <div className="fixed bottom-12 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-8 py-5 rounded-4xl shadow-2xl flex items-center gap-8 animate-in slide-in-from-bottom-10 duration-500 z-50">
       <div className="flex items-center gap-3 pr-8 border-r border-white/10">
         <span className="h-8 w-8 rounded-full bg-primary-600 flex items-center justify-center text-xs font-black">{selectedPosts.length}</span>
         <span className="text-xs font-bold uppercase tracking-widest">Entries Selected</span>
       </div>
        <div className="flex items-center gap-6">
           <button 
             onClick={() => handleBulkAction('publish')}
             className="text-[10px] font-black uppercase tracking-widest hover:text-primary-400 transition-colors"
           >
             Publish All
           </button>
           <button 
             onClick={() => handleBulkAction('archived')}
             className="text-[10px] font-black uppercase tracking-widest hover:text-primary-400 transition-colors"
           >
             Archive
           </button>
           <button 
             onClick={() => handleBulkAction('delete')}
             className="text-[10px] font-black uppercase tracking-widest text-red-400 hover:text-red-300 transition-colors"
           >
             Delete Forever
           </button>
        </div>
       <button 
        onClick={() => setSelectedPosts([])}
        className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
       >
         <Plus className="h-5 w-5 rotate-45" />
       </button>
    </div>
  );
};
