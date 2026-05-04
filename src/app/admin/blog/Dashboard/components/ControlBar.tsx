'use client';
import React from 'react';
import { Search, Calendar, Sparkles, LayoutList, LayoutGrid, CalendarDays } from 'lucide-react';
import type { DashboardState } from '../types';

export const ControlBar: React.FC<Pick<DashboardState, 
  'currentTab' | 'setCurrentTab' | 'searchQuery' | 'setSearchQuery' | 
  'viewMode' | 'setViewMode' | 'handleSyncScheduling' | 'showAudit' | 'setShowAudit'
>> = ({ 
  currentTab, setCurrentTab, searchQuery, setSearchQuery, 
  viewMode, setViewMode, handleSyncScheduling, showAudit, setShowAudit 
}) => {
  return (
    <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between border-b border-gray-50 bg-white px-4">
      {/* Tabs / Status Filter */}
      <div className="flex overflow-x-auto no-scrollbar py-2">
        {(['all', 'published', 'scheduled', 'draft'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setCurrentTab(tab)}
            className={`px-8 py-4 text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap relative group ${
              currentTab === tab ? 'text-primary-600' : 'text-gray-400 hover:text-gray-900'
            }`}
          >
            <span className="relative z-10">{tab}</span>
            {currentTab === tab && (
              <div className="absolute bottom-0 left-6 right-6 h-1 bg-primary-600 rounded-t-full animate-in fade-in slide-in-from-bottom-1 duration-300" />
            )}
            <div className={`absolute inset-0 bg-primary-50/0 group-hover:bg-primary-50/50 rounded-xl transition-colors m-1 ${currentTab === tab ? 'hidden' : ''}`} />
          </button>
        ))}
      </div>
      
      <div className="flex flex-col sm:flex-row items-center gap-4 py-4 border-t lg:border-t-0 border-gray-50 lg:pl-4">
         {/* View Switcher */}
         <div className="flex bg-gray-100/80 p-1.5 rounded-2xl border border-gray-100 shadow-inner">
            {[
              { id: 'table', icon: LayoutList, label: 'List' },
              { id: 'kanban', icon: LayoutGrid, label: 'Board' },
              { id: 'calendar', icon: CalendarDays, label: 'Calendar' }
            ].map((mode) => (
              <button 
                key={mode.id}
                type="button"
                onClick={() => setViewMode(mode.id as any)}
                className={`flex items-center gap-2 h-9 px-4 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                  viewMode === mode.id 
                    ? 'bg-white text-primary-600 shadow-sm ring-1 ring-black/5' 
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <mode.icon className="h-3.5 w-3.5" />
                <span className={viewMode === mode.id ? 'inline' : 'hidden md:inline'}>{mode.label}</span>
              </button>
            ))}
         </div>

         {/* Search */}
         <div className="relative group w-full sm:w-auto">
           <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 group-focus-within:text-primary-600 transition-colors" />
           <input 
             type="text" 
             value={searchQuery}
             onChange={(e) => setSearchQuery(e.target.value)}
             placeholder="Search entries..."
             className="h-12 pl-11 pr-5 rounded-2xl bg-gray-50/50 border border-transparent outline-none font-bold text-xs text-gray-900 focus:bg-white focus:border-primary-200 focus:ring-4 focus:ring-primary-50/50 w-full sm:w-64 transition-all"
           />
         </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button 
              onClick={handleSyncScheduling}
              className="flex-1 sm:flex-none h-12 px-6 rounded-2xl bg-white border border-gray-100 text-gray-900 font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-gray-50 hover:border-gray-200 active:scale-95 transition-all"
            >
              <Calendar className="h-4 w-4 text-primary-500" />
              Sync
            </button>
            <button 
              onClick={() => setShowAudit(!showAudit)}
              className={`flex-1 sm:flex-none h-12 px-6 rounded-2xl border font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 transition-all active:scale-95 ${
                showAudit 
                  ? 'bg-primary-600 text-white border-primary-600 shadow-lg shadow-primary-600/20' 
                  : 'bg-white text-gray-900 border-gray-100 hover:bg-gray-50'
              }`}
            >
              <Sparkles className={`h-4 w-4 ${showAudit ? 'text-white' : 'text-primary-600'}`} />
              Health
            </button>
          </div>
      </div>
    </div>
  );
};
