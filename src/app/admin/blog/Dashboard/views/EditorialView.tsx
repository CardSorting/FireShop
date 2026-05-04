'use client';
import React from 'react';
import { KanbanBoard } from '../components/KanbanBoard';
import { BlogTable } from '../components/BlogTable';
import { CalendarView } from '../components/CalendarView';
import type { DashboardState } from '../types';

export const EditorialView: React.FC<DashboardState> = (state) => {
  const { 
    viewMode, 
    loading, 
    posts, 
    selectedPosts, 
    toggleSelect, 
    toggleSelectAll, 
    handleIndividualDelete,
    searchQuery,
    setSearchQuery,
    setCurrentTab
  } = state;

  return (
    <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
      <div className="p-0">
        {viewMode === 'kanban' ? (
          <div className="p-8">
            <KanbanBoard posts={posts} />
          </div>
        ) : viewMode === 'calendar' ? (
          <CalendarView posts={posts} />
        ) : (
          <BlogTable 
            posts={posts}
            loading={loading}
            selectedPosts={selectedPosts}
            toggleSelect={toggleSelect}
            toggleSelectAll={toggleSelectAll}
            handleIndividualDelete={handleIndividualDelete}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            setCurrentTab={setCurrentTab}
          />
        )}
      </div>
    </div>
  );
};
