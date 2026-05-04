import React from 'react';
import { Search, Calendar, Sparkles } from 'lucide-react';
import type { DashboardState } from '../types';

export const ControlBar: React.FC<Pick<DashboardState, 
  'currentTab' | 'setCurrentTab' | 'searchQuery' | 'setSearchQuery' | 
  'viewMode' | 'setViewMode' | 'handleSyncScheduling' | 'showAudit' | 'setShowAudit'
>> = ({ 
  currentTab, setCurrentTab, searchQuery, setSearchQuery, 
  viewMode, setViewMode, handleSyncScheduling, showAudit, setShowAudit 
}) => {
  return (
    <div className="flex flex-col lg:flex-row border-b border-gray-50">
      {/* Tabs */}
      <div className="flex-1 flex overflow-x-auto no-scrollbar">
        {(['all', 'published', 'scheduled', 'draft'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setCurrentTab(tab)}
            className={`px-10 py-6 text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap relative ${
              currentTab === tab ? 'text-primary-600' : 'text-gray-400 hover:text-gray-900'
            }`}
          >
            {tab}
            {currentTab === tab && (
              <div className="absolute bottom-0 left-8 right-8 h-1 bg-primary-600 rounded-t-full" />
            )}
          </button>
        ))}
      </div>
      
      <div className="p-4 flex items-center gap-4 bg-gray-50/50 lg:bg-transparent">
         <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-100">
            <button 
              type="button"
              onClick={() => setViewMode('table')}
              className={`h-10 px-4 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${viewMode === 'table' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-400'}`}
            >
              List
            </button>
            <button 
              type="button"
              onClick={() => setViewMode('kanban')}
              className={`h-10 px-4 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${viewMode === 'kanban' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-400'}`}
            >
              Board
            </button>
         </div>
         <div className="relative">
           <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
           <input 
             type="text" 
             value={searchQuery}
             onChange={(e) => setSearchQuery(e.target.value)}
             placeholder="Search entries..."
             className="h-12 pl-12 pr-6 rounded-xl bg-white border border-gray-100 outline-none font-bold text-xs text-gray-900 focus:border-primary-100 w-64 transition-all"
           />
         </div>
          <button 
            onClick={handleSyncScheduling}
            className="h-12 px-6 rounded-xl bg-white border border-gray-100 text-gray-900 font-black text-[10px] uppercase tracking-widest flex items-center gap-3 hover:bg-gray-50 transition-all"
          >
            <Calendar className="h-4 w-4" />
            Sync
          </button>
          <button 
            onClick={() => setShowAudit(!showAudit)}
            className={`h-12 px-6 rounded-xl border font-black text-[10px] uppercase tracking-widest flex items-center gap-3 transition-all ${
              showAudit ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-900 border-gray-100 hover:bg-gray-50'
            }`}
          >
            <Sparkles className="h-4 w-4" />
            Audit
          </button>
      </div>
    </div>
  );
};
