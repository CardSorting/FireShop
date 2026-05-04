'use client';

import { useState } from 'react';
import { 
  Star, ThumbsUp, CheckCircle2, User, Filter, 
  ChevronDown, Camera, X, MessageSquare, 
  Sparkles, ShieldCheck, Image as ImageIcon,
  ArrowRight, Loader2, Heart, Search, HelpCircle,
  AlertCircle, ChevronRight, Maximize2
} from 'lucide-react';
import { useProductReviews } from '../hooks/useProductReviews';
import { formatDistanceToNow } from 'date-fns';
import { HiveCell } from './Logo';
import type { ReviewDraft } from '@domain/models';

export function ProductReviews({ productId }: { productId: string }) {
  const {
    reviews,
    allMedia,
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
    voteHelpful
  } = useProductReviews(productId);

  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="py-32 text-center animate-pulse">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
           <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
        </div>
        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Loading Perspectives...</p>
      </div>
    );
  }

  // Find a "Spotlight" review (e.g., most helpful 5-star)
  const spotlightReview = reviews.find(r => r.rating === 5 && r.helpfulCount > 20) || reviews[0];

  return (
    <div className="space-y-16 max-w-7xl mx-auto px-4">
      {/* 01. Overview Section - Flattened & Centered */}
      <section className="space-y-12 pb-12 border-b border-gray-100">
        <header className="text-center space-y-4 max-w-2xl mx-auto">
           <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-primary-50 border border-primary-100">
              <HiveCell className="w-3 h-3 text-primary-600" />
              <span className="text-[10px] font-bold text-primary-700 uppercase tracking-widest">The Hive Community</span>
           </div>
           <h2 className="text-4xl font-black text-gray-900 tracking-tight">The Buzz</h2>
           <p className="text-gray-600 font-medium">Real stories and feedback from the hive.</p>
        </header>

        <div className="flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-20 py-10 bg-gray-50/50 rounded-3xl px-10">
          <div className="flex items-center gap-6 shrink-0">
            <div className="text-7xl font-bold text-gray-900 leading-none">{stats.averageRating}</div>
            <div className="space-y-1.5">
              <div className="flex text-amber-400">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className={`w-4 h-4 ${i <= Math.floor(stats.averageRating) ? 'fill-current' : ''}`} />
                ))}
              </div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{stats.totalReviews} Reviews</p>
            </div>
          </div>

          <div className="flex-1 max-w-md w-full space-y-2.5">
            {[5, 4, 3, 2, 1].map((rating) => {
              const count = stats.ratingCounts[rating as keyof typeof stats.ratingCounts] || 0;
              const percentage = Math.round((count / stats.totalReviews) * 100);
              return (
                <div key={rating} className="flex items-center gap-4 group cursor-pointer" onClick={() => setFilter(rating.toString())}>
                  <span className="w-3 text-[10px] font-bold text-gray-400 group-hover:text-gray-900 transition-colors">{rating}</span>
                  <div className="flex-1 h-1 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-gray-900 transition-all duration-700" style={{ width: `${percentage}%` }} />
                  </div>
                  <span className="w-8 text-[9px] font-bold text-gray-400 text-right">{percentage}%</span>
                </div>
              );
            })}
          </div>

          <button 
            onClick={() => setIsFormOpen(true)}
            className="px-10 py-4 bg-gray-900 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-black transition-all shrink-0 shadow-lg shadow-gray-200"
          >
            Write a Review
          </button>
        </div>

        <div className="space-y-6">
           <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">Collector Photos</h3>
           <div className="flex flex-wrap justify-center gap-4">
              {allMedia.length > 0 ? (
                allMedia.slice(0, 8).map((img, i) => (
                  <div 
                    key={i} 
                    onClick={() => setSelectedImage(img)}
                    className="w-20 h-20 rounded-xl overflow-hidden border border-gray-100 bg-gray-50 group cursor-zoom-in relative"
                  >
                     <img src={img} alt="User photo" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                  </div>
                ))
              ) : (
                <div className="py-8 text-center opacity-40">
                   <p className="text-[10px] font-bold uppercase tracking-widest">No photos shared yet</p>
                </div>
              )}
           </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-x-16 gap-y-8 pt-4">
           {[
             { icon: ShieldCheck, label: 'Verified Integrity', sub: 'Confirmed purchases' },
             { icon: Sparkles, label: 'Quality Standards', sub: 'Vetted by community' },
             { icon: Heart, label: 'Direct Impact', sub: 'Supporting art' }
           ].map((item, i) => (
             <div key={i} className="flex items-center gap-4">
                <item.icon className="w-5 h-5 text-gray-400" />
                <div className="text-left">
                  <p className="text-[10px] font-bold text-gray-900 uppercase tracking-widest leading-none mb-1">{item.label}</p>
                  <p className="text-[10px] font-medium text-gray-400 uppercase tracking-tighter">{item.sub}</p>
                </div>
             </div>
           ))}
        </div>
      </section>

      {/* 02. Spotlight Review */}
      {spotlightReview && (
        <section className="relative overflow-hidden rounded-2xl border border-gray-100 p-8 lg:p-12 group">
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
             <div className="space-y-6">
                <div className="flex items-center gap-2">
                   <span className="text-[10px] font-bold uppercase tracking-widest text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full">Featured Review</span>
                </div>
                <h3 className="text-2xl lg:text-3xl font-bold tracking-tight leading-tight text-gray-900">
                  "{spotlightReview.title}"
                </h3>
                <p className="text-lg text-gray-600 font-medium leading-relaxed italic">
                  {spotlightReview.content.length > 200 ? `${spotlightReview.content.substring(0, 200)}...` : spotlightReview.content}
                </p>
                <div className="flex items-center gap-4">
                   <div className="w-10 h-10 rounded-full bg-gray-900 text-white flex items-center justify-center text-sm font-bold">
                      {spotlightReview.userName.charAt(0)}
                   </div>
                   <div>
                      <p className="text-sm font-bold text-gray-900 uppercase tracking-widest">{spotlightReview.userName}</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Verified Buyer</p>
                   </div>
                </div>
             </div>
             {spotlightReview.images?.[0] && (
               <div className="relative aspect-video rounded-xl overflow-hidden shadow-sm group-hover:shadow-md transition-all duration-500">
                  <img src={spotlightReview.images[0]} alt="Featured review photo" className="w-full h-full object-cover" />
                  <button 
                    onClick={() => setSelectedImage(spotlightReview.images?.[0] || null)}
                    className="absolute bottom-4 right-4 p-3 bg-white/20 backdrop-blur-md rounded-xl hover:bg-white/40 transition-all text-white"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>
               </div>
             )}
          </div>
        </section>
      )}

      {/* 03. Filters & Search */}
      <section className="space-y-8">
        <div className="flex flex-col xl:flex-row items-center justify-between gap-6 border-b border-gray-100 pb-8">
          <div className="w-full xl:w-auto space-y-4 flex-1 max-w-2xl">
             <div className="relative group">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  type="text"
                  placeholder="Search reviews..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-6 py-3.5 bg-gray-50 border border-transparent rounded-xl text-sm font-medium text-gray-900 focus:bg-white focus:border-gray-200 focus:ring-0 transition-all placeholder:text-gray-400"
                />
             </div>
             
             <div className="flex flex-wrap gap-2 items-center">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mr-1">Topics:</span>
                {popularTags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${
                      selectedTags.includes(tag) 
                      ? 'bg-gray-900 text-white' 
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
             </div>
          </div>

          <div className="flex items-center gap-4 w-full xl:w-auto">
             <div className="flex bg-gray-100 p-1 rounded-xl">
                {[
                  { value: 'all', label: 'All' },
                  { value: '5', label: '5★' },
                  { value: 'with_photos', label: 'Media' }
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setFilter(opt.value)}
                    className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${
                      filter === opt.value ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
             </div>

             <div className="relative">
                <select 
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className="pl-3 pr-8 py-3 bg-transparent border border-gray-100 rounded-xl text-[10px] font-bold text-gray-900 uppercase tracking-widest focus:ring-0 appearance-none cursor-pointer"
                >
                  <option value="newest">Newest</option>
                  <option value="helpful">Helpful</option>
                  <option value="highest">Top Rated</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
             </div>
          </div>
        </div>

        <div className="divide-y divide-gray-100">
          {reviews.length > 0 ? (
            reviews.map((review) => (
              <ReviewItem key={review.id} review={review} onVote={voteHelpful} onImageClick={setSelectedImage} />
            ))
          ) : (
            <div className="py-32 text-center space-y-6">
              <div className="w-20 h-20 bg-primary-50 rounded-2xl flex items-center justify-center mx-auto transition-transform hover:scale-110">
                <HiveCell className="w-8 h-8 text-primary-200" />
              </div>
              <div>
                <p className="text-xl font-black text-gray-900 mb-2 uppercase tracking-tight">The Hive is Quiet</p>
                <p className="text-gray-400 font-medium text-sm">No reviews found for this selection. Be the first to start the buzz!</p>
              </div>
              <button 
                onClick={() => { setFilter('all'); setSearchQuery(''); setSelectedTags([]); }} 
                className="px-8 py-4 bg-gray-900 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-black transition-all"
              >
                Reset Filters
              </button>
            </div>
          )}
        </div>

        {reviews.length > 0 && (
          <div className="pt-10 text-center">
            <button className="inline-flex items-center gap-2 px-8 py-4 border border-gray-200 rounded-xl font-bold text-[10px] uppercase tracking-widest text-gray-500 hover:text-gray-900 hover:border-gray-900 transition-all">
              <span>Show More</span>
              <ChevronDown className="w-3 h-3" />
            </button>
          </div>
        )}
      </section>

      {/* Modals */}
      {isFormOpen && (
        <ReviewForm 
          onClose={() => setIsFormOpen(false)} 
          onSubmit={submitReview}
          submitting={submitting}
        />
      )}

      {selectedImage && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 sm:p-12">
           <div className="absolute inset-0 bg-gray-900/95 backdrop-blur-xl animate-in fade-in duration-300" onClick={() => setSelectedImage(null)} />
           <div className="relative max-w-5xl w-full aspect-square sm:aspect-video rounded-4xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-500">
              <img src={selectedImage} alt="Fullscreen preview" className="w-full h-full object-contain bg-black" />
              <button 
                onClick={() => setSelectedImage(null)}
                className="absolute top-8 right-8 p-4 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-2xl text-white transition-all"
              >
                <X className="w-6 h-6" />
              </button>
           </div>
        </div>
      )}
    </div>
  );
}

// Helper components removed as they are now integrated into the main stack for better alignment




function ReviewItem({ review, onVote, onImageClick }: { review: any; onVote: (id: string) => void, onImageClick: (url: string) => void }) {
  const [voted, setVoted] = useState(false);

  const handleVote = () => {
    if (voted) return;
    setVoted(true);
    onVote(review.id);
  };

  return (
    <article className="py-10 group animate-in fade-in duration-500">
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="lg:w-1/4 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gray-100 text-gray-900 flex items-center justify-center text-sm font-bold">
              {review.userName.charAt(0)}
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900 tracking-tight">{review.userName}</p>
              {review.isVerified && (
                <div className="flex items-center gap-1 mt-0.5">
                  <ShieldCheck className="w-3 h-3 text-green-600" />
                  <span className="text-[9px] font-bold text-green-600 uppercase tracking-widest">Verified Buyer</span>
                </div>
              )}
            </div>
          </div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            {formatDistanceToNow(review.createdAt, { addSuffix: true })}
          </p>
        </div>

        <div className="flex-1 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex gap-0.5 text-amber-400">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star key={i} className={`w-3.5 h-3.5 ${i <= review.rating ? 'fill-current' : 'text-gray-100'}`} />
              ))}
            </div>
          </div>
          
          <div className="space-y-2">
            <h4 className="text-lg font-bold text-gray-900 tracking-tight">{review.title}</h4>
            <p className="text-gray-600 font-medium text-base leading-relaxed max-w-2xl">{review.content}</p>
          </div>

          {review.images && review.images.length > 0 && (
            <div className="flex gap-3 pt-2">
              {review.images.map((img: string, i: number) => (
                <div 
                  key={i} 
                  onClick={() => onImageClick(img)}
                  className="w-24 h-24 rounded-xl overflow-hidden border border-gray-100 shadow-sm hover:border-gray-300 transition-all cursor-zoom-in"
                >
                  <img src={img} alt="User photo" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center gap-8 pt-6 border-t border-gray-50">
            <button 
              onClick={handleVote}
              disabled={voted}
              className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest transition-all ${voted ? 'text-primary-600' : 'text-gray-400 hover:text-gray-900'}`}
            >
              <ThumbsUp className={`w-3.5 h-3.5 ${voted ? 'fill-current' : ''}`} /> 
              Helpful {review.helpfulCount > 0 && <span className="ml-1 opacity-60">({review.helpfulCount + (voted ? 1 : 0)})</span>}
            </button>
            
            <button className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-300 hover:text-gray-900 transition-colors">
               <MessageSquare className="w-3.5 h-3.5" />
               Reply
            </button>
          </div>

          {review.replies && review.replies.length > 0 && (
            <div className="mt-8 space-y-6">
              {review.replies.map((reply: any) => (
                <div key={reply.id} className="relative pl-8 border-l-2 border-primary-500/20 py-2">
                   <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center">
                         <ShieldCheck className="w-4 h-4 text-primary-600" />
                      </div>
                      <div className="flex items-center gap-2">
                         <span className="text-[10px] font-bold text-gray-900 uppercase tracking-widest">{reply.authorName}</span>
                         <span className="px-1.5 py-0.5 rounded-md bg-gray-900 text-[8px] font-bold text-white uppercase tracking-widest">Official</span>
                      </div>
                      <span className="text-[9px] font-bold text-gray-300 uppercase ml-auto">
                        {formatDistanceToNow(reply.createdAt, { addSuffix: true })}
                      </span>
                   </div>
                   <p className="text-sm font-medium text-gray-600 leading-relaxed bg-gray-50/50 p-4 rounded-2xl">
                     {reply.content}
                   </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

function ReviewForm({ onClose, onSubmit, submitting }: { 
  onClose: () => void; 
  onSubmit: (draft: ReviewDraft) => Promise<boolean>;
  submitting: boolean;
}) {
  const [rating, setRating] = useState(5);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    userName: '',
    email: '',
  });

  const handleRatingClick = (r: number) => setRating(r);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await onSubmit({
      productId: 'current',
      userId: 'guest',
      userName: formData.userName || 'Anonymous',
      rating,
      title: formData.title,
      content: formData.content,
      isVerified: false,
    });
    if (success) onClose();
  };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 sm:p-8">
      <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-2xl animate-in fade-in duration-500" onClick={onClose} />
      
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100">
           <div>
              <h2 className="text-xl font-bold text-gray-900 tracking-tight">Write a Review</h2>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Share your experience</p>
           </div>
           <button onClick={onClose} className="p-2 rounded-xl bg-gray-50 text-gray-400 hover:text-gray-900 transition-all">
              <X className="w-4 h-4" />
           </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8 max-h-[75vh] overflow-y-auto styled-scrollbar">
           {/* Star Selector */}
           <div className="flex flex-col items-center justify-center py-6 bg-gray-50 rounded-xl space-y-4">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Your Rating</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <button
                    key={i}
                    type="button"
                    onMouseEnter={() => setHoveredRating(i)}
                    onMouseLeave={() => setHoveredRating(0)}
                    onClick={() => handleRatingClick(i)}
                    className="p-1 transition-all hover:scale-110 active:scale-95"
                  >
                    <Star 
                      className={`w-10 h-10 transition-all ${
                        i <= (hoveredRating || rating) 
                        ? 'text-amber-400 fill-current' 
                        : 'text-gray-200'
                      }`} 
                    />
                  </button>
                ))}
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                 <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Name</label>
                 <input 
                   required
                   value={formData.userName}
                   onChange={e => setFormData({...formData, userName: e.target.value})}
                   placeholder="Your name"
                   className="w-full px-5 py-3.5 bg-gray-50 rounded-xl border-transparent border focus:bg-white focus:border-gray-200 focus:ring-0 font-medium text-sm transition-all"
                 />
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Email</label>
                 <input 
                   required
                   type="email"
                   value={formData.email}
                   onChange={e => setFormData({...formData, email: e.target.value})}
                   placeholder="For verification"
                   className="w-full px-5 py-3.5 bg-gray-50 rounded-xl border-transparent border focus:bg-white focus:border-gray-200 focus:ring-0 font-medium text-sm transition-all"
                 />
              </div>
           </div>

           <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Title</label>
              <input 
                required
                value={formData.title}
                onChange={e => setFormData({...formData, title: e.target.value})}
                placeholder="Review title"
                className="w-full px-5 py-3.5 bg-gray-50 rounded-xl border-transparent border focus:bg-white focus:border-gray-200 focus:ring-0 font-medium text-sm transition-all"
              />
           </div>

           <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Review</label>
              <textarea 
                required
                rows={4}
                value={formData.content}
                onChange={e => setFormData({...formData, content: e.target.value})}
                placeholder="Write your thoughts..."
                className="w-full px-5 py-3.5 bg-gray-50 rounded-xl border-transparent border focus:bg-white focus:border-gray-200 focus:ring-0 font-medium text-sm resize-none transition-all"
              />
           </div>

           <div className="p-8 border-2 border-dashed border-gray-100 rounded-xl flex flex-col items-center justify-center gap-3 bg-gray-50/20 group hover:bg-gray-50 transition-colors cursor-pointer">
              <ImageIcon className="w-6 h-6 text-gray-300 group-hover:text-gray-400 transition-colors" />
              <div className="text-center">
                <p className="text-[10px] font-bold text-gray-900 uppercase tracking-widest">Add Photos</p>
                <p className="text-[9px] font-medium text-gray-400 uppercase tracking-widest mt-0.5">JPG, PNG up to 10MB</p>
              </div>
           </div>
        </form>

        <div className="px-8 py-6 border-t border-gray-100 bg-gray-50 flex flex-col sm:flex-row items-center justify-between gap-6">
           <div className="flex items-center gap-3">
              <ShieldCheck className="w-4 h-4 text-gray-400" />
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest max-w-[200px] leading-relaxed">
                By posting, you agree to our <span className="text-gray-900 underline cursor-pointer">Community Standards</span>.
              </p>
           </div>
           <button 
             onClick={handleSubmit}
             disabled={submitting}
             className="w-full sm:w-auto px-10 py-4 bg-gray-900 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-black transition-all flex items-center justify-center gap-2"
           >
             {submitting ? (
               <>
                 <Loader2 className="w-4 h-4 animate-spin" />
                 <span>Posting...</span>
               </>
             ) : (
               <>
                 <span>Post Review</span>
               </>
             )}
           </button>
        </div>
      </div>
    </div>
  );
}
