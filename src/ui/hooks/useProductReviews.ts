'use client';

import { useState, useEffect, useMemo } from 'react';
import type { Review, ReviewDraft } from '@domain/models';
import { logger } from '@utils/logger';

// Expanded Mock Review Data for better demonstration
const generateMockReviews = (productId: string): Review[] => [
  {
    id: '1',
    productId,
    userId: 'u1',
    userName: 'Alex Rivers',
    rating: 5,
    title: 'Breathtaking clarity!',
    content: 'The colors on this print are even more vibrant in person. I was worried about the shipping, but it was packaged like a tank. Absolutely flawless addition to my studio. The quality is simply unmatched.',
    helpfulCount: 42,
    isVerified: true,
    status: 'published',
    images: ['https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=600&h=600&fit=crop'],
    replies: [
      {
        id: 'r1',
        authorName: 'DreamBees Team',
        authorRole: 'merchant',
        content: 'Thank you so much Alex! We take great pride in our "tank-like" packaging to ensure your artifacts arrive in pristine condition. Enjoy the studio addition!',
        createdAt: new Date('2024-03-16'),
      }
    ],
    createdAt: new Date('2024-03-15'),
    updatedAt: new Date('2024-03-15'),
  },
  {
    id: '2',
    productId,
    userId: 'u2',
    userName: 'Sarah Jenkins',
    rating: 4,
    title: 'Great quality, slightly slow shipping',
    content: 'The art itself is 5/5. The paper stock is heavy and premium. Docking one star only because it took a few extra days to arrive, but the customer support was very responsive. The packaging was very secure though.',
    helpfulCount: 15,
    isVerified: true,
    status: 'published',
    replies: [
      {
        id: 'r2',
        authorName: 'Support Maven',
        authorRole: 'merchant',
        content: 'Apologies for the slight delay, Sarah. We are working on streamlining our fulfillment during peak drops. Glad you love the paper quality!',
        createdAt: new Date('2024-03-12'),
      }
    ],
    createdAt: new Date('2024-03-10'),
    updatedAt: new Date('2024-03-10'),
  },
  {
    id: '3',
    productId,
    userId: 'u3',
    userName: 'Marcus Thorne',
    rating: 5,
    title: 'Etsy quality, Amazon speed',
    content: 'Rare to find such unique indie art with this level of professional fulfillment. I will be ordering the rest of the set soon. The texture of the paper is really nice.',
    helpfulCount: 89,
    isVerified: true,
    status: 'published',
    images: ['https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=600&h=600&fit=crop'],
    createdAt: new Date('2024-02-28'),
    updatedAt: new Date('2024-02-28'),
  },
  {
    id: '4',
    productId,
    userId: 'u4',
    userName: 'Elena Rodriguez',
    rating: 5,
    title: 'Perfect for my collection',
    content: 'I have been following this artist for a while and finally decided to pull the trigger. The print quality is exceptional. No pixels or blurriness even at large sizes.',
    helpfulCount: 23,
    isVerified: true,
    status: 'published',
    createdAt: new Date('2024-02-15'),
    updatedAt: new Date('2024-02-15'),
  },
  {
    id: '5',
    productId,
    userId: 'u5',
    userName: 'David Chen',
    rating: 3,
    title: 'Good, but colors were slightly off',
    content: 'The print is nice, but I felt the colors were slightly cooler than what I saw on my screen. Still a great piece, but just be aware of screen calibration differences.',
    helpfulCount: 8,
    isVerified: false,
    status: 'published',
    createdAt: new Date('2024-02-10'),
    updatedAt: new Date('2024-02-10'),
  }
];

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

  // Load reviews
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        // Mocking API delay
        await new Promise(r => setTimeout(r, 800));
        setReviews(generateMockReviews(productId));
      } catch (err) {
        logger.error('Failed to load reviews', err);
        setError('Unable to load reviews at this time.');
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [productId]);

  // Dynamic stats calculation
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

  const submitReview = async (draft: ReviewDraft) => {
    setSubmitting(true);
    try {
      await new Promise(r => setTimeout(r, 1500));
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
    } catch (err) {
      logger.error('Failed to submit review', err);
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  const voteHelpful = (reviewId: string) => {
    setReviews(prev => prev.map(r => 
      r.id === reviewId ? { ...r, helpfulCount: r.helpfulCount + 1 } : r
    ));
  };

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
