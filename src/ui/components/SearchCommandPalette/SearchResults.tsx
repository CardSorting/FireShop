'use client';

import React from 'react';
import { Archive, ArrowRight, ShoppingCart, NotebookPen } from 'lucide-react';
import { formatCurrency } from '@utils/formatters';
import { getCollectionUrl } from '@utils/navigation';
import type { Product, ProductCategory, KnowledgebaseArticle } from '@domain/models';
import type { QuickAction } from './useSearchDiscovery';

interface SearchResultsProps {
  query: string;
  quickActions: QuickAction[];
  matchingCategories: ProductCategory[];
  results: Product[];
  blogResults: KnowledgebaseArticle[];
  selectedIndex: number;
  setSelectedIndex: (index: number) => void;
  onSelectProduct: (product: Product) => void;
  onSelectArticle: (article: KnowledgebaseArticle) => void;
  onClose: () => void;
  addItem: (id: string, qty: number) => Promise<void>;
  router: any;
}

const HighlightMatch = ({ text, match }: { text: string; match: string }) => {
  if (!match.trim()) return <>{text}</>;
  const parts = text.split(new RegExp(`(${match})`, 'gi'));
  return (
    <>
      {parts.map((part, i) => (
        part.toLowerCase() === match.toLowerCase() ? (
          <span key={i} className="text-primary-600 underline decoration-primary-200 decoration-2 underline-offset-2">{part}</span>
        ) : (
          <span key={i}>{part}</span>
        )
      ))}
    </>
  );
};

export function SearchResults({ 
  query, quickActions, matchingCategories, results, blogResults = [],
  selectedIndex, setSelectedIndex, onSelectProduct, onSelectArticle,
  onClose, addItem, router 
}: SearchResultsProps) {
  
  return (
    <div className="p-2 divide-y divide-gray-50">
      {/* Shortcuts */}
      {quickActions.length > 0 && (
        <div className="py-2">
          <h3 className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-gray-400">Shortcuts</h3>
          {quickActions.map((action, index) => {
            const isSelected = selectedIndex === index;
            return (
              <button
                key={action.id}
                onClick={() => {
                  if (action.isCart) {
                    onClose();
                    window.dispatchEvent(new CustomEvent('open-cart'));
                  } else {
                    router.push(action.href);
                    onClose();
                  }
                }}
                onMouseEnter={() => setSelectedIndex(index)}
                className={`w-full flex items-center gap-4 p-3.5 rounded-xl transition-all group ${
                  isSelected ? 'bg-primary-50 ring-1 ring-primary-100' : 'hover:bg-gray-50'
                }`}
              >
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center transition-all ${
                  isSelected ? 'bg-white shadow-sm text-primary-600' : 'bg-gray-50 text-gray-400'
                }`}>
                  <action.icon className="h-5 w-5" />
                </div>
                <span className={`text-sm font-black transition-colors ${
                  isSelected ? 'text-primary-900' : 'text-gray-900'
                }`}>
                  <HighlightMatch text={action.label} match={query} />
                </span>
                <ArrowRight className={`ml-auto h-4 w-4 transition-all ${
                  isSelected ? 'text-primary-600 translate-x-0 opacity-100' : 'opacity-0 -translate-x-2'
                }`} />
              </button>
            );
          })}
        </div>
      )}

      {/* Collections */}
      {matchingCategories.length > 0 && (
        <div className="py-2">
          <h3 className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-gray-400">Collections</h3>
          {matchingCategories.map((cat, index) => {
            const globalIdx = quickActions.length + index;
            const isSelected = selectedIndex === globalIdx;
            return (
              <button
                key={cat.id}
                onClick={() => { router.push(getCollectionUrl(cat.slug)); onClose(); }}
                onMouseEnter={() => setSelectedIndex(globalIdx)}
                className={`w-full flex items-center gap-4 p-3.5 rounded-xl transition-all group ${
                  isSelected ? 'bg-primary-50 ring-1 ring-primary-100' : 'hover:bg-gray-50'
                }`}
              >
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center transition-all ${
                  isSelected ? 'bg-white shadow-sm text-primary-600' : 'bg-gray-50 text-gray-400'
                }`}>
                  <Archive className="h-5 w-5" />
                </div>
                <span className={`text-sm font-black transition-colors ${
                  isSelected ? 'text-primary-900' : 'text-gray-900'
                }`}>
                  <HighlightMatch text={cat.name} match={query} />
                </span>
                <ArrowRight className={`ml-auto h-4 w-4 transition-all ${
                  isSelected ? 'text-primary-600 translate-x-0 opacity-100' : 'opacity-0 -translate-x-2'
                }`} />
              </button>
            );
          })}
        </div>
      )}

      {/* Journal / Articles */}
      {blogResults.length > 0 && (
        <div className="py-2">
          <h3 className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-gray-400">Journal Articles</h3>
          {blogResults.map((article, index) => {
            const globalIdx = quickActions.length + matchingCategories.length + index;
            const isSelected = selectedIndex === globalIdx;
            return (
              <button
                key={article.id}
                onClick={() => onSelectArticle(article)}
                onMouseEnter={() => setSelectedIndex(globalIdx)}
                className={`w-full flex items-center gap-4 p-3.5 rounded-xl transition-all group ${
                  isSelected ? 'bg-primary-50 ring-1 ring-primary-100' : 'hover:bg-gray-50'
                }`}
              >
                <div className="h-14 w-14 rounded-xl bg-gray-50 border overflow-hidden shrink-0 ring-1 ring-gray-100 group-hover:ring-primary-200 transition-all">
                  {article.featuredImageUrl ? (
                    <img src={article.featuredImageUrl} alt="" className="h-full w-full object-cover group-hover:scale-110 transition duration-500" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-gray-200">
                      <NotebookPen className="h-6 w-6" />
                    </div>
                  )}
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className={`text-sm font-black truncate transition-colors ${
                    isSelected ? 'text-primary-900' : 'text-gray-900'
                  }`}>
                    <HighlightMatch text={article.title} match={query} />
                  </p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5 line-clamp-1">{article.excerpt}</p>
                </div>
                <ArrowRight className={`ml-auto h-4 w-4 transition-all ${
                  isSelected ? 'text-primary-600 translate-x-0 opacity-100' : 'opacity-0 -translate-x-2'
                }`} />
              </button>
            );
          })}
        </div>
      )}

      {/* Products */}
      {results.length > 0 && (
        <div className="py-2">
          <h3 className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-gray-400">Products</h3>
          {results.map((product, index) => {
            const globalIdx = quickActions.length + matchingCategories.length + blogResults.length + index;
            const isSelected = selectedIndex === globalIdx;
            return (
              <button
                key={product.id}
                onClick={() => onSelectProduct(product)}
                onMouseEnter={() => setSelectedIndex(globalIdx)}
                className={`w-full flex items-center gap-4 p-3.5 rounded-xl transition-all group ${
                  isSelected ? 'bg-primary-50 ring-1 ring-primary-100' : 'hover:bg-gray-50'
                }`}
              >
                <div className="h-14 w-14 rounded-xl bg-gray-50 border overflow-hidden shrink-0 ring-1 ring-gray-100 group-hover:ring-primary-200 transition-all">
                  <img src={product.imageUrl} alt="" className="h-full w-full object-cover group-hover:scale-110 transition duration-500" />
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className={`text-sm font-black truncate transition-colors ${
                    isSelected ? 'text-primary-900' : 'text-gray-900'
                  }`}>
                    <HighlightMatch text={product.name} match={query} />
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{product.category}</span>
                    <span className="text-gray-200">•</span>
                    <span className="text-xs font-black text-primary-600 tracking-tight">{formatCurrency(product.price)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                   <button 
                     onClick={(e) => {
                       e.stopPropagation();
                       void addItem(product.id, 1);
                       window.dispatchEvent(new CustomEvent('open-cart'));
                     }}
                     className={`h-9 w-9 rounded-xl border flex items-center justify-center transition-all ${
                       isSelected ? 'bg-primary-600 text-white border-primary-600 shadow-lg' : 'bg-white text-gray-400 border-gray-100 hover:text-primary-600 hover:border-primary-500'
                     }`}
                   >
                     <ShoppingCart className="h-4 w-4" />
                   </button>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
