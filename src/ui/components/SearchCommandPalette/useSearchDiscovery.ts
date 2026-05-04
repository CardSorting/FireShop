'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Truck, ShoppingCart, ShieldCheck, Heart, 
  Search, Sparkles, Archive, Layers3, Zap,
  NotebookPen
} from 'lucide-react';
import { useServices } from '../../hooks/useServices';
import { useCart } from '../../hooks/useCart';
import { useWishlist } from '../../hooks/useWishlist';
import { getProductUrl, getCollectionUrl, getSearchUrl } from '@utils/navigation';
import type { Product, ProductCategory, KnowledgebaseArticle } from '@domain/models';

export type QuickAction = { id: string, label: string, href: string, icon: any, isCart?: boolean };

export function useSearchDiscovery() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [blogResults, setBlogResults] = useState<KnowledgebaseArticle[]>([]);
  const [matchingCategories, setMatchingCategories] = useState<ProductCategory[]>([]);
  const [quickActions, setQuickActions] = useState<QuickAction[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  
  const router = useRouter();
  const services = useServices();
  const { addItem } = useCart();
  const { recentlyViewed } = useWishlist();
  const inputRef = useRef<HTMLInputElement>(null);

  // Toggle palette with ⌘+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      } else if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 10);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      setQuery('');
      setResults([]);
      setBlogResults([]);
    }
  }, [isOpen]);

  // Load recent searches and categories
  useEffect(() => {
    const saved = localStorage.getItem('search:recent');
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (e) {
        localStorage.removeItem('search:recent');
      }
    }

    const loadCategories = async () => {
      try {
        const data = await services.taxonomyService.getCategories();
        setCategories(data);
      } catch (err) {
        console.error('Failed to load categories', err);
      }
    };
    void loadCategories();
  }, [services.taxonomyService]);

  // Search Logic
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setBlogResults([]);
      setMatchingCategories([]);
      setQuickActions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const trimmedQuery = query.trim().toLowerCase();
        
        // 1. Quick Actions
        const actions: QuickAction[] = [];
        if ('orders'.includes(trimmedQuery)) actions.push({ id: 'action-orders', label: 'Track My Orders', href: '/account/orders', icon: Truck });
        if ('cart'.includes(trimmedQuery)) actions.push({ id: 'action-cart', label: 'View Shopping Cart', href: '#', icon: ShoppingCart, isCart: true });
        if ('support'.includes(trimmedQuery) || 'help'.includes(trimmedQuery)) actions.push({ id: 'action-support', label: 'Contact Support', href: '/support', icon: ShieldCheck });
        if ('wishlist'.includes(trimmedQuery)) actions.push({ id: 'action-wishlist', label: 'My Favorites', href: '/wishlist', icon: Heart });
        if ('journal'.includes(trimmedQuery) || 'blog'.includes(trimmedQuery)) actions.push({ id: 'action-blog', label: 'Browse Hive Journal', href: '/blog', icon: NotebookPen });
        setQuickActions(actions);

        // 2. Fetch Products & Articles
        const [productResult, articleResult] = await Promise.all([
          services.productService.getProducts({ 
            query: query.trim(),
            limit: 5 
          }),
          services.knowledgebaseService.getArticles({
            status: 'published',
            type: 'blog'
          })
        ]);

        setResults(productResult.products);
        
        // Manual filter for articles (assuming search is small for now or repository supports it)
        const matchedArticles = articleResult.filter(a => 
          a.title.toLowerCase().includes(trimmedQuery) || 
          a.excerpt.toLowerCase().includes(trimmedQuery)
        ).slice(0, 3);
        setBlogResults(matchedArticles);

        // 3. Filter Categories
        const matchedCats = categories.filter(c => 
          c.name.toLowerCase().includes(trimmedQuery) || 
          c.slug.toLowerCase().includes(trimmedQuery)
        ).slice(0, 3);
        setMatchingCategories(matchedCats);

        setSelectedIndex(0);
      } catch (err) {
        console.error('Search failed', err);
      } finally {
        setLoading(false);
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [query, categories, services.productService, services.knowledgebaseService]);

  const saveSearch = (term: string) => {
    const updated = [term, ...recentSearches.filter(t => t !== term)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('search:recent', JSON.stringify(updated));
  };

  const handleSelectProduct = useCallback((product: Product) => {
    saveSearch(product.name);
    setIsOpen(false);
    router.push(getProductUrl(product));
  }, [router, recentSearches]);

  const handleSelectArticle = useCallback((article: KnowledgebaseArticle) => {
    saveSearch(article.title);
    setIsOpen(false);
    router.push(`/blog/${article.slug}`);
  }, [router, recentSearches]);

  const clearRecent = () => {
    setRecentSearches([]);
    localStorage.removeItem('search:recent');
  };

  const totalResults = quickActions.length + matchingCategories.length + results.length + blogResults.length;

  return {
    isOpen,
    setIsOpen,
    query,
    setQuery,
    results,
    blogResults,
    matchingCategories,
    quickActions,
    loading,
    selectedIndex,
    setSelectedIndex,
    categories,
    recentSearches,
    inputRef,
    handleSelectProduct,
    handleSelectArticle,
    saveSearch,
    clearRecent,
    totalResults,
    addItem,
    router
  };
}
