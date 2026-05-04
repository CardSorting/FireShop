'use client';

/**
 * [LAYER: UI]
 * Discovery Engine: Modular Search Command Palette.
 * Accessible via ⌘+K (Mac) or Ctrl+K (Windows).
 */
import React from 'react';
import { Search } from 'lucide-react';
import { useSearchDiscovery } from './useSearchDiscovery';
import { SearchHeader } from './SearchHeader';
import { SearchEmptyState } from './SearchEmptyState';
import { SearchResults } from './SearchResults';
import { SearchFooter } from './SearchFooter';
import { getCollectionUrl, getSearchUrl } from '@utils/navigation';

export function SearchCommandPalette() {
  const {
    isOpen, setIsOpen, query, setQuery, results,
    matchingCategories, quickActions, loading,
    selectedIndex, setSelectedIndex, categories,
    recentSearches, inputRef, handleSelectProduct,
    clearRecent, totalResults, addItem, router
  } = useSearchDiscovery();

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % (totalResults || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + totalResults) % (totalResults || 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      
      let currentIdx = 0;
      
      // 1. Actions
      if (selectedIndex < quickActions.length) {
        const action = quickActions[selectedIndex];
        if (action.isCart) {
          setIsOpen(false);
          window.dispatchEvent(new CustomEvent('open-cart'));
        } else {
          router.push(action.href);
          setIsOpen(false);
        }
        return;
      }
      currentIdx += quickActions.length;

      // 2. Categories
      if (selectedIndex < currentIdx + matchingCategories.length) {
        const cat = matchingCategories[selectedIndex - currentIdx];
        router.push(getCollectionUrl(cat.slug));
        setIsOpen(false);
        return;
      }
      currentIdx += matchingCategories.length;

      // 3. Products
      if (selectedIndex < currentIdx + results.length) {
        handleSelectProduct(results[selectedIndex - currentIdx]);
      } else if (query.trim()) {
        setIsOpen(false);
        router.push(getSearchUrl(query.trim()));
      }
    }
  };

  if (!isOpen) return null;

  const hasResults = quickActions.length > 0 || matchingCategories.length > 0 || results.length > 0;

  return (
    <div className="fixed inset-0 z-modal flex items-start justify-center sm:pt-[12vh] sm:px-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-300" 
        onClick={() => setIsOpen(false)} 
      />
      
      {/* Container */}
      <div className="relative w-full max-w-2xl h-screen sm:h-auto sm:max-h-[80vh] bg-white sm:rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-top-4 duration-300 ring-1 ring-black/5 flex flex-col">
        <SearchHeader 
          inputRef={inputRef}
          query={query}
          setQuery={setQuery}
          onKeyDown={handleKeyDown}
          onClose={() => setIsOpen(false)}
        />

        <main className="flex-1 overflow-y-auto custom-scrollbar">
          {query.length === 0 ? (
            <SearchEmptyState 
              setQuery={setQuery}
              recentSearches={recentSearches}
              clearRecent={clearRecent}
              categories={categories}
              onClose={() => setIsOpen(false)}
            />
          ) : hasResults ? (
            <SearchResults 
              query={query}
              quickActions={quickActions}
              matchingCategories={matchingCategories}
              results={results}
              selectedIndex={selectedIndex}
              setSelectedIndex={setSelectedIndex}
              onSelectProduct={handleSelectProduct}
              onClose={() => setIsOpen(false)}
              addItem={addItem}
              router={router}
            />
          ) : !loading && query.length > 1 ? (
            <div className="p-20 text-center">
              <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-gray-50 mb-6">
                <Search className="h-8 w-8 text-gray-200" />
              </div>
              <p className="text-base font-black text-gray-900">No results found for "{query}"</p>
              <p className="text-xs text-gray-500 mt-2 max-w-[240px] mx-auto leading-relaxed italic">Try searching for broader terms like "art", "print", or "canvas".</p>
            </div>
          ) : (
            <div className="p-20 text-center">
               <div className="flex justify-center gap-1.5">
                 <div className="h-1.5 w-1.5 rounded-full bg-primary-500 animate-bounce [animation-delay:-0.3s]" />
                 <div className="h-1.5 w-1.5 rounded-full bg-primary-500 animate-bounce [animation-delay:-0.15s]" />
                 <div className="h-1.5 w-1.5 rounded-full bg-primary-500 animate-bounce" />
               </div>
            </div>
          )}
        </main>

        <SearchFooter />
      </div>
    </div>
  );
}
