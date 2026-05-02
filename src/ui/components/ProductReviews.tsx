'use client';

import { useState } from 'react';
import { Star, ThumbsUp, CheckCircle2, User, Filter, ChevronDown, Camera } from 'lucide-react';

interface Review {
  id: string;
  user: string;
  rating: number;
  date: string;
  title: string;
  content: string;
  verified: boolean;
  helpful: number;
  images?: string[];
}

const MOCK_REVIEWS: Review[] = [
  {
    id: '1',
    user: 'Alex M.',
    rating: 5,
    date: '2024-03-15',
    title: 'Absolute Gem!',
    content: 'The centering on this card is perfect. It arrived in a top-loader and was double-sleeved. Best experience buying singles online so far.',
    verified: true,
    helpful: 24,
    images: ['https://images.unsplash.com/photo-1613771404721-1f92d799e49f?w=200&h=200&fit=crop']
  },
  {
    id: '2',
    user: 'Sarah K.',
    rating: 4,
    date: '2024-03-10',
    title: 'Fast shipping, great condition',
    content: 'Card is in great shape. Minimal whitening on the edges, definitely NM as advertised. Shipping was lightning fast.',
    verified: true,
    helpful: 12
  },
  {
    id: '3',
    user: 'David R.',
    rating: 5,
    date: '2024-02-28',
    title: 'Professional packaging',
    content: 'I was worried about a high-value single getting damaged in the mail, but PlayMoreTCG knows what they are doing. Bulletproof packaging.',
    verified: true,
    helpful: 45
  }
];

export function ProductReviews({ productId }: { productId: string }) {
  const [reviews, setReviews] = useState<Review[]>(MOCK_REVIEWS);
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('newest');

  const averageRating = 4.8;
  const totalReviews = 128;

  return (
    <div className="space-y-12">
      <div className="flex flex-col lg:flex-row gap-12 lg:items-center">
        {/* Rating Overview */}
        <div className="lg:w-1/3">
          <h2 className="text-3xl font-black text-gray-900 mb-6">Customer Reviews</h2>
          <div className="flex items-center gap-4 mb-4">
            <span className="text-6xl font-black text-gray-900">{averageRating}</span>
            <div>
              <div className="flex text-amber-400 mb-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className={`w-5 h-5 ${i <= 4 ? 'fill-current' : ''}`} />
                ))}
              </div>
              <p className="text-sm font-bold text-gray-400">Based on {totalReviews} reviews</p>
            </div>
          </div>
          <button className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all">
            Write a Review
          </button>
        </div>

        {/* Rating Bars */}
        <div className="flex-1 space-y-3">
          {[5, 4, 3, 2, 1].map((rating) => (
            <div key={rating} className="flex items-center gap-4 group cursor-pointer">
              <span className="w-3 text-xs font-black text-gray-400">{rating}</span>
              <Star className="w-3 h-3 text-gray-300 group-hover:text-amber-400 transition-colors" />
              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary-500 rounded-full transition-all duration-1000"
                  style={{ width: `${rating === 5 ? 85 : rating === 4 ? 10 : 2}%` }}
                />
              </div>
              <span className="w-10 text-xs font-bold text-gray-400">{rating === 5 ? '85%' : rating === 4 ? '10%' : '2%'}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Review Filters & Sort */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-y py-6">
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
             <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
             <select 
               value={filter} 
               onChange={(e) => setFilter(e.target.value)}
               className="w-full sm:w-auto pl-10 pr-8 py-2 bg-gray-50 border-none rounded-xl text-xs font-bold text-gray-700 appearance-none"
             >
                <option value="all">All Ratings</option>
                <option value="5">5 Stars</option>
                <option value="4">4 Stars</option>
             </select>
             <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-primary-50 rounded-xl text-primary-700 text-xs font-bold">
             <Camera className="w-4 h-4" />
             <span>With Photos</span>
          </div>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
           <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Sort by:</span>
           <select 
             value={sort} 
             onChange={(e) => setSort(e.target.value)}
             className="bg-transparent border-none text-xs font-black text-gray-900 focus:ring-0 cursor-pointer"
           >
              <option value="newest">Newest</option>
              <option value="helpful">Most Helpful</option>
              <option value="highest">Highest Rating</option>
           </select>
        </div>
      </div>

      {/* Reviews List */}
      <div className="divide-y divide-gray-100">
        {reviews.map((review) => (
          <div key={review.id} className="py-10 first:pt-0">
            <div className="flex flex-col md:flex-row gap-8">
              <div className="md:w-1/4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-gray-900">{review.user}</p>
                    {review.verified && (
                      <div className="flex items-center gap-1 text-[10px] font-black text-green-600 uppercase tracking-widest">
                        <CheckCircle2 className="w-3 h-3" /> Verified Buyer
                      </div>
                    )}
                  </div>
                </div>
                <p className="text-xs font-bold text-gray-400">{new Date(review.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
              </div>

              <div className="flex-1">
                <div className="flex text-amber-400 mb-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className={`w-4 h-4 ${i <= review.rating ? 'fill-current' : ''}`} />
                  ))}
                </div>
                <h4 className="text-lg font-black text-gray-900 mb-2">{review.title}</h4>
                <p className="text-gray-600 leading-relaxed mb-6 font-medium">{review.content}</p>
                
                {review.images && (
                  <div className="flex gap-4 mb-6">
                    {review.images.map((img, i) => (
                      <img key={i} src={img} alt="User upload" className="w-20 h-20 rounded-xl object-cover border border-gray-100" />
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-6">
                  <button className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-primary-600 transition-colors">
                    <ThumbsUp className="w-3.5 h-3.5" /> Helpful ({review.helpful})
                  </button>
                  <button className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-900 transition-colors">
                    Report
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <button className="w-full py-4 border-2 border-gray-100 rounded-2xl font-black text-xs uppercase tracking-widest text-gray-900 hover:bg-gray-50 transition-all">
        Load More Reviews
      </button>
    </div>
  );
}
