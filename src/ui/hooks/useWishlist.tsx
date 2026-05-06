'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './useAuth';
import { useServices } from './useServices';
import type { Wishlist, Product } from '@domain/models';

interface WishlistContextType {
  wishlists: Wishlist[];
  recentlyViewed: Product[];
  loading: boolean;
  error: string | null;
  refreshWishlists: () => Promise<void>;
  addToWishlist: (productId: string, wishlistId?: string) => Promise<void>;
  removeFromWishlist: (productId: string, wishlistId?: string) => Promise<void>;
  isInWishlist: (productId: string) => boolean;
  createCollection: (name: string) => Promise<Wishlist>;
  trackView: (product: Product) => void;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

const RECENTLY_VIEWED_KEY = 'DreamBees_recently_viewed';
const MAX_RECENTLY_VIEWED = 10;

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const services = useServices();
  const [wishlists, setWishlists] = useState<Wishlist[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<Product[]>([]);
  const [itemMap, setItemMap] = useState<Record<string, Set<string>>>({}); // wishlistId -> Set<productId>
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  // Load recently viewed from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(RECENTLY_VIEWED_KEY);
    if (saved) {
      try {
        setRecentlyViewed(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse recently viewed', e);
      }
    }
  }, []);

  const trackView = useCallback((product: Product) => {
    setRecentlyViewed(prev => {
      const next = [product, ...prev.filter(p => p.id !== product.id)].slice(0, MAX_RECENTLY_VIEWED);
      localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const refreshWishlists = useCallback(async () => {
    if (!user) {
      setWishlists([]);
      setItemMap({});
      return;
    }

    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    setLoading(true);
    try {
      const lists = await services.wishlistService.getWishlists(controller.signal);
      if (controller.signal.aborted) return;
      
      setWishlists(lists);
      
      const map: Record<string, Set<string>> = {};
      for (const list of lists) {
        const detail = await services.wishlistService.getWishlist(list.id, controller.signal);
        if (controller.signal.aborted) return;
        map[list.id] = new Set(detail.items.map(p => p.id));
      }
      
      if (!controller.signal.aborted) {
        setItemMap(map);
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      console.error('Failed to load wishlists', err);
      setError('Failed to load wishlists');
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, [user, services.wishlistService]);

  useEffect(() => {
    void refreshWishlists();
    return () => controllerRef.current?.abort();
  }, [refreshWishlists]);

  const addToWishlist = async (productId: string, wishlistId?: string) => {
    if (!user) throw new Error('Must be logged in');
    
    const targetId = wishlistId || wishlists.find(w => w.isDefault)?.id;
    if (!targetId) throw new Error('No wishlist found');

    await services.wishlistService.addItem(targetId, productId);
    
    setItemMap(prev => ({
      ...prev,
      [targetId]: new Set([...(prev[targetId] || []), productId])
    }));
  };

  const removeFromWishlist = async (productId: string, wishlistId?: string) => {
    if (!user) throw new Error('Must be logged in');

    if (!wishlistId) {
      const listsWithItem = Object.entries(itemMap)
        .filter(([_, items]) => items.has(productId))
        .map(([id]) => id);
      
      for (const id of listsWithItem) {
        await services.wishlistService.removeItem(id, productId);
      }
      
      setItemMap(prev => {
        const next = { ...prev };
        for (const id of listsWithItem) {
          const newSet = new Set(next[id]);
          newSet.delete(productId);
          next[id] = newSet;
        }
        return next;
      });
    } else {
      await services.wishlistService.removeItem(wishlistId, productId);
      setItemMap(prev => {
        const newSet = new Set(prev[wishlistId]);
        newSet.delete(productId);
        return { ...prev, [wishlistId]: newSet };
      });
    }
  };

  const isInWishlist = (productId: string) => {
    return Object.values(itemMap).some(items => items.has(productId));
  };

  const createCollection = async (name: string) => {
    if (!user) throw new Error('Must be logged in');
    const newList = await services.wishlistService.createWishlist(name);
    setWishlists(prev => [...prev, newList]);
    setItemMap(prev => ({ ...prev, [newList.id]: new Set() }));
    return newList;
  };

  return (
    <WishlistContext.Provider value={{ 
      wishlists, 
      recentlyViewed,
      loading, 
      error, 
      refreshWishlists, 
      addToWishlist, 
      removeFromWishlist, 
      isInWishlist,
      createCollection,
      trackView
    }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}
