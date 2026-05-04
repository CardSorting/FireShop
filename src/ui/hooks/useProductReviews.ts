'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
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

  const popularTags = ['Quality', 'Shipping', 'Colors', 'Paper', 'Artist'];

  // Load reviews from API
  const loadReviews = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/products/${productId}/reviews`);
      if (!res.ok) {
        // If the endpoint doesn't exist yet, gracefully fall back to empty state
        if (res.status === 404) {
          setReviews([]);
          return;
        }
        throw new Error(`Failed to load reviews: ${res.status}`);
      }
      const data = await res.json();
      // Normalize date strings back to Date objects
      const normalized = (data.reviews ?? data ?? []).map((r: any) => ({
        ...r,
        createdAt: new Date(r.createdAt),
        updatedAt: new Date(r.updatedAt),
        replies: r.replies?.map((reply: any) => ({
          ...reply,
          createdAt: new Date(reply.createdAt),
        })),
      }));
      setReviews(normalized);
    } catch (err) {
      logger.error('Failed to load reviews', err);
      setError('Unable to load reviews at this time.');
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    void loadReviews();
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
        // Fallback: optimistically add to local state if API not available
        if (res.status === 404) {
          const newReview: Review = {
            ...draft,
            id: crypto.randomUUID(),
            helpfulCount: 0,
            status: 'published',
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          setReviews(prev => [newReview, ...prev]);
          setIsFormOpen(false);
          return true;
        }
        throw new Error('Failed to submit review');
      }

      const newReview = await res.json();
      newReview.createdAt = new Date(newReview.createdAt);
      newReview.updatedAt = new Date(newReview.updatedAt);
      setReviews(prev => [newReview, ...prev]);
      setIsFormOpen(false);
      return true;
    } catch (err) {
      logger.error('Failed to submit review', err);
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  const voteHelpful = useCallback(async (reviewId: string) => {
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
      // Revert on failure
      setReviews(prev => prev.map(r => 
        r.id === reviewId ? { ...r, helpfulCount: r.helpfulCount - 1 } : r
      ));
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
