'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import type { Review, ReviewDraft } from '@domain/models';
import { logger } from '@utils/logger';

export function useProductReviews(productId: string) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const controllerRef = useRef<AbortController | null>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  const popularTags = ['Quality', 'Shipping', 'Colors', 'Paper', 'Artist'];

  // Load reviews from API
  const loadReviews = useCallback(async () => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/products/${productId}/reviews`, { signal: controller.signal });
      if (!res.ok) {
        if (res.status === 404) {
          if (!controller.signal.aborted) {
            setReviews([]);
          }
          return;
        }
        throw new Error(`Failed to load reviews: ${res.status}`);
      }
      const data = await res.json();
      const normalized = (data.reviews ?? data ?? []).map((r: any) => ({
        ...r,
        createdAt: new Date(r.createdAt),
        updatedAt: new Date(r.updatedAt),
        replies: r.replies?.map((reply: any) => ({
          ...reply,
          createdAt: new Date(reply.createdAt),
        })),
      }));
      
      if (!controller.signal.aborted) {
        setReviews(normalized);
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      logger.error('Failed to load reviews', err);
      if (!controller.signal.aborted) {
        setError('Unable to load reviews at this time.');
        setReviews([]);
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, [productId]);

  useEffect(() => {
    void loadReviews();
    return () => controllerRef.current?.abort();
  }, [loadReviews]);

  // Dynamic stats calculation from real data
  const stats = useMemo(() => {
    const total = reviews.length;
    if (total === 0) return { averageRating: 0, totalReviews: 0, ratingCounts: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } };

    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    const counts = reviews.reduce((acc, r) => {
      acc[r.rating as keyof typeof acc] = (acc[r.rating as keyof typeof acc] || 0) + 1;
      return acc;
    }, { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 });

    return {
      averageRating: parseFloat((sum / total).toFixed(1)),
      totalReviews: total,
      ratingCounts: counts
    };
  }, [reviews]);

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const submitReview = async (draft: ReviewDraft): Promise<boolean> => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/products/${productId}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft),
      });

      if (!res.ok) {
        if (res.status === 404) {
          const newReview: Review = {
            ...draft,
            id: crypto.randomUUID(),
            helpfulCount: 0,
            status: 'published',
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          if (isMounted.current) {
            setReviews(prev => [newReview, ...prev]);
            setIsFormOpen(false);
          }
          return true;
        }
        throw new Error('Failed to submit review');
      }

      const newReview = await res.json();
      if (isMounted.current) {
        newReview.createdAt = new Date(newReview.createdAt);
        newReview.updatedAt = new Date(newReview.updatedAt);
        setReviews(prev => [newReview, ...prev]);
        setIsFormOpen(false);
      }
      return true;
    } catch (err) {
      logger.error('Failed to submit review', err);
      return false;
    } finally {
      if (isMounted.current) {
        setSubmitting(false);
      }
    }
  };

  const voteHelpful = useCallback(async (reviewId: string) => {
    if (!isMounted.current) return;
    
    // Optimistic update
    setReviews(prev => prev.map(r => 
      r.id === reviewId ? { ...r, helpfulCount: r.helpfulCount + 1 } : r
    ));
    
    try {
      await fetch(`/api/products/${productId}/reviews`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewId, action: 'vote_helpful' }),
      });
    } catch (err) {
      if (isMounted.current) {
        // Revert on failure
        setReviews(prev => prev.map(r => 
          r.id === reviewId ? { ...r, helpfulCount: r.helpfulCount - 1 } : r
        ));
      }
      logger.error('Failed to vote helpful', err);
    }
  }, [productId]);

  const filteredReviews = useMemo(() => {
    return reviews
      .filter(r => {
        const matchesRating = filter === 'all' || r.rating === parseInt(filter);
        const matchesSearch = searchQuery === '' || 
          r.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
          r.content.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesPhotos = filter === 'with_photos' ? (r.images && r.images.length > 0) : true;
        const matchesTags = selectedTags.length === 0 || 
          selectedTags.every(tag => 
            r.content.toLowerCase().includes(tag.toLowerCase()) || 
            r.title.toLowerCase().includes(tag.toLowerCase())
          );
        
        return matchesRating && matchesSearch && matchesPhotos && matchesTags;
      })
      .sort((a, b) => {
        if (sort === 'newest') return b.createdAt.getTime() - a.createdAt.getTime();
        if (sort === 'helpful') return b.helpfulCount - a.helpfulCount;
        if (sort === 'highest') return b.rating - a.rating;
        return 0;
      });
  }, [reviews, filter, sort, searchQuery, selectedTags]);

  return {
    reviews: filteredReviews,
    allMedia: reviews.flatMap(r => r.images || []).filter(Boolean),
    loading,
    error,
    stats,
    isFormOpen,
    setIsFormOpen,
    submitting,
    filter,
    setFilter,
    sort,
    setSort,
    searchQuery,
    setSearchQuery,
    selectedTags,
    setSelectedTags,
    toggleTag,
    popularTags,
    submitReview,
    voteHelpful,
  };
}
