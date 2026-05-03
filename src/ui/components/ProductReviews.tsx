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
        <p className="text-sm font-black text-gray-400 uppercase tracking-[0.3em]">Calibrating Feedback...</p>
      </div>
    );
  }

  // Find a "Spotlight" review (e.g., most helpful 5-star)
  const spotlightReview = reviews.find(r => r.rating === 5 && r.helpfulCount > 20) || reviews[0];

  return (
    <div className="space-y-24 max-w-7xl mx-auto">
      {/* 01. Overview & Media */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-16">
        <div className="lg:col-span-4 space-y-10">
          <header className="space-y-4">
             <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 border border-primary-100">
                <Sparkles className="w-3 h-3 text-primary-600" />
                <span className="text-[10px] font-black text-primary-600 uppercase tracking-widest">Community Verified</span>
             </div>
             <h2 className="text-5xl font-black text-gray-900 tracking-tight leading-[0.9]">Collector<br/>Perspectives</h2>
             <p className="text-gray-500 font-medium text-lg leading-relaxed">
               Honest feedback from the DreamBees community.
             </p>
          </header>

          <ReviewSummary stats={stats} onRatingClick={setFilter} />
          
          <button 
            onClick={() => setIsFormOpen(true)}
            className="group w-full py-6 bg-gray-900 text-white rounded-3xl font-black text-xs uppercase tracking-[0.2em] hover:bg-black transition-all shadow-2xl shadow-gray-200 flex items-center justify-center gap-3 overflow-hidden relative"
          >
            <div className="absolute inset-0 bg-linear-to-r from-primary-600/0 via-white/10 to-primary-600/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            <MessageSquare className="w-4 h-4" /> 
            <span>Share Your Story</span>
            <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
          </button>
        </div>

        <div className="lg:col-span-8 space-y-12">
          <ReviewGallery images={allMedia} onImageClick={setSelectedImage} />
          
          {/* Trust Indicators */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
             {[
               { icon: ShieldCheck, label: 'Verified Integrity', sub: 'Authentication at every step', color: 'green' },
               { icon: Sparkles, label: 'High Fidelity', sub: 'Archival quality standard', color: 'primary' },
               { icon: Heart, label: 'Direct Impact', sub: 'Supporting independent art', color: 'amber' }
             ].map((item, i) => (
               <div key={i} className={`flex flex-col gap-4 p-6 rounded-[2.5rem] bg-${item.color}-50/50 border border-${item.color}-100/50 hover:border-${item.color}-200 transition-colors`}>
                  <item.icon className={`w-6 h-6 text-${item.color}-600`} />
                  <div>
                    <p className="text-xs font-black text-gray-900 uppercase tracking-widest mb-1">{item.label}</p>
                    <p className="text-[10px] font-bold text-gray-500/80 leading-snug">{item.sub}</p>
                  </div>
               </div>
             ))}
          </div>
        </div>
      </section>

      {/* 02. Spotlight Review */}
      {spotlightReview && (
        <section className="relative overflow-hidden rounded-[3rem] bg-gray-900 text-white p-12 lg:p-20 group">
          <div className="absolute top-0 right-0 w-1/2 h-full opacity-10 pointer-events-none">
             <Sparkles className="w-full h-full scale-150 rotate-12" />
          </div>
          
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
             <div className="space-y-8">
                <div className="flex items-center gap-3">
                   <div className="h-px w-8 bg-primary-500" />
                   <span className="text-xs font-black uppercase tracking-[0.3em] text-primary-400">Review Spotlight</span>
                </div>
                <h3 className="text-3xl lg:text-5xl font-black tracking-tight leading-tight italic">
                  "{spotlightReview.title}"
                </h3>
                <p className="text-xl text-gray-400 font-medium leading-relaxed italic">
                  {spotlightReview.content.length > 200 ? `${spotlightReview.content.substring(0, 200)}...` : spotlightReview.content}
                </p>
                <div className="flex items-center gap-4">
                   <div className="w-14 h-14 rounded-full bg-primary-500 flex items-center justify-center text-xl font-black">
                      {spotlightReview.userName.charAt(0)}
                   </div>
                   <div>
                      <p className="font-black uppercase tracking-widest">{spotlightReview.userName}</p>
                      <p className="text-xs text-primary-400 font-bold">Verified Collector</p>
                   </div>
                </div>
             </div>
             {spotlightReview.images?.[0] && (
               <div className="relative aspect-4/3 rounded-3xl overflow-hidden shadow-2xl group-hover:scale-[1.02] transition-transform duration-700">
                  <img src={spotlightReview.images[0]} alt="Featured review photo" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent" />
                  <button 
                    onClick={() => setSelectedImage(spotlightReview.images?.[0] || null)}
                    className="absolute bottom-6 right-6 p-4 bg-white/10 backdrop-blur-md rounded-2xl hover:bg-white/20 transition-all"
                  >
                    <Maximize2 className="w-5 h-5" />
                  </button>
               </div>
             )}
          </div>
        </section>
      )}

      {/* 03. Advanced Filters & Search */}
      <section className="space-y-10">
        <div className="flex flex-col xl:flex-row items-end justify-between gap-8 border-b border-gray-100 pb-12">
          <div className="w-full xl:w-auto space-y-6 flex-1 max-w-3xl">
             <div className="relative group">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300 group-focus-within:text-primary-500 transition-colors" />
                <input 
                  type="text"
                  placeholder="Search keywords like 'quality', 'shipping', 'packaging'..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-16 pr-8 py-6 bg-gray-50 border-none rounded-4xl text-sm font-bold text-gray-900 focus:ring-4 focus:ring-primary-500/10 placeholder:text-gray-300 transition-all"
                />
             </div>
             
             <div className="flex flex-wrap gap-2 items-center">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mr-2">Popular:</span>
                {popularTags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                      selectedTags.includes(tag) 
                      ? 'bg-primary-600 text-white shadow-lg shadow-primary-200' 
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
                {selectedTags.length > 0 && (
                  <button 
                    onClick={() => setSearchQuery('')} 
                    className="ml-2 text-[10px] font-black text-primary-600 hover:underline"
                  >
                    Clear Filters
                  </button>
                )}
             </div>
          </div>

          <div className="flex items-center gap-4 w-full xl:w-auto justify-end">
             <div className="flex bg-gray-50 p-1.5 rounded-2xl">
                {[
                  { value: 'all', label: 'All' },
                  { value: '5', label: '5★' },
                  { value: 'with_photos', label: 'Media' }
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setFilter(opt.value)}
                    className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                      filter === opt.value ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
             </div>

             <div className="relative group">
                <select 
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className="pl-4 pr-10 py-4 bg-transparent border-none text-[10px] font-black text-gray-900 uppercase tracking-widest focus:ring-0 appearance-none cursor-pointer"
                >
                  <option value="newest">Sort: Newest</option>
                  <option value="helpful">Sort: Helpful</option>
                  <option value="highest">Sort: Top Rated</option>
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
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
              <div className="w-20 h-20 bg-gray-50 rounded-[2.5rem] flex items-center justify-center mx-auto">
                <AlertCircle className="w-8 h-8 text-gray-200" />
              </div>
              <div>
                <p className="text-xl font-black text-gray-900 mb-2">No matching perspectives found</p>
                <p className="text-gray-400 font-medium">Try broadening your search or clearing filters.</p>
              </div>
              <button 
                onClick={() => { setFilter('all'); setSearchQuery(''); setSelectedTags([]); }} 
                className="px-8 py-4 bg-gray-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all"
              >
                Reset Exploration
              </button>
            </div>
          )}
        </div>

        {reviews.length > 0 && (
          <div className="pt-12 text-center">
            <button className="inline-flex items-center gap-3 px-12 py-6 border-2 border-gray-100 rounded-4xl font-black text-[10px] uppercase tracking-[0.3em] text-gray-400 hover:text-gray-900 hover:border-gray-200 hover:bg-gray-50 transition-all group">
              <span>View More Reviews</span>
              <ChevronDown className="w-4 h-4 transition-transform group-hover:translate-y-1" />
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

function ReviewSummary({ stats, onRatingClick }: { stats: any, onRatingClick: (r: string) => void }) {
  return (
    <div className="bg-gray-50 rounded-[3rem] p-10 border border-gray-100 relative overflow-hidden">
      <div className="absolute -top-12 -right-12 p-4 opacity-[0.03]">
        <Star className="w-64 h-64 fill-current" />
      </div>
      
      <div className="flex items-center gap-8 mb-10">
        <div className="text-7xl font-black text-gray-900 tracking-tighter leading-none">{stats.averageRating}</div>
        <div>
          <div className="flex text-amber-400 mb-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star key={i} className={`w-5 h-5 ${i <= Math.floor(stats.averageRating) ? 'fill-current' : ''}`} />
            ))}
          </div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Global Collector Score</p>
        </div>
      </div>

      <div className="space-y-4">
        {[5, 4, 3, 2, 1].map((rating) => {
          const count = stats.ratingCounts[rating as keyof typeof stats.ratingCounts] || 0;
          const percentage = Math.round((count / stats.totalReviews) * 100);
          return (
            <div 
              key={rating} 
              className="flex items-center gap-5 group cursor-pointer" 
              onClick={() => onRatingClick(rating.toString())}
            >
              <span className="w-4 text-[10px] font-black text-gray-400 group-hover:text-gray-900 transition-colors">{rating}</span>
              <div className="flex-1 h-2 bg-white rounded-full overflow-hidden shadow-inner relative">
                <div 
                  className="h-full bg-gray-900 rounded-full transition-all duration-1000 ease-out group-hover:bg-primary-500"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <span className="w-10 text-[9px] font-black text-gray-400 text-right group-hover:text-gray-900 transition-colors">{percentage}%</span>
            </div>
          );
        })}
      </div>

      <div className="mt-10 pt-10 border-t border-gray-200/50 flex items-center justify-between">
         <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{stats.totalReviews} Total Reviews</p>
         <HelpCircle className="w-4 h-4 text-gray-300 hover:text-gray-400 cursor-help" />
      </div>
    </div>
  );
}

function ReviewGallery({ images, onImageClick }: { images: string[], onImageClick: (url: string) => void }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Collector Artifacts</h3>
        {images.length > 5 && (
          <button className="text-[10px] font-black text-primary-600 uppercase tracking-widest hover:underline flex items-center gap-1">
            Browse All <ChevronRight className="w-3 h-3" />
          </button>
        )}
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-5">
        {images.length > 0 ? (
          images.slice(0, 5).map((img, i) => (
            <div 
              key={i} 
              onClick={() => onImageClick(img)}
              className="aspect-square rounded-4xl overflow-hidden border border-gray-100 bg-gray-50 group cursor-zoom-in relative"
            >
               <img src={img} alt="Collector photo" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
               <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <Maximize2 className="w-6 h-6 text-white" />
               </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-16 flex flex-col items-center justify-center border-2 border-dashed border-gray-100 rounded-4xl bg-gray-50/50 group hover:bg-gray-50 transition-colors">
             <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 transition-transform">
               <Camera className="w-6 h-6 text-gray-300" />
             </div>
             <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Awaiting First Artifact</p>
          </div>
        )}
      </div>
    </div>
  );
}

function ReviewItem({ review, onVote, onImageClick }: { review: any; onVote: (id: string) => void, onImageClick: (url: string) => void }) {
  const [voted, setVoted] = useState(false);

  const handleVote = () => {
    if (voted) return;
    setVoted(true);
    onVote(review.id);
  };

  return (
    <article className="py-16 group animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="flex flex-col lg:flex-row gap-12">
        <div className="lg:w-1/4 space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-[1.25rem] bg-gray-900 text-white flex items-center justify-center text-lg font-black shadow-2xl shadow-gray-200">
              {review.userName.charAt(0)}
            </div>
            <div>
              <p className="font-black text-gray-900 tracking-tight">{review.userName}</p>
              {review.isVerified && (
                <div className="flex items-center gap-1.5 mt-1 px-2 py-0.5 rounded-full bg-green-50 w-fit">
                  <ShieldCheck className="w-3 h-3 text-green-600" />
                  <span className="text-[9px] font-black text-green-600 uppercase tracking-widest">Verified</span>
                </div>
              )}
            </div>
          </div>
          <div className="space-y-1">
             <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Acquired</p>
             <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
               {formatDistanceToNow(review.createdAt, { addSuffix: true })}
             </p>
          </div>
        </div>

        <div className="flex-1 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex gap-1 text-amber-400">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star key={i} className={`w-4 h-4 ${i <= review.rating ? 'fill-current' : 'text-gray-100'}`} />
              ))}
            </div>
            <button className="opacity-0 group-hover:opacity-100 transition-opacity p-2 text-gray-300 hover:text-gray-900">
               <AlertCircle className="w-4 h-4" />
            </button>
          </div>
          
          <div className="space-y-4">
            <h4 className="text-2xl font-black text-gray-900 tracking-tight leading-tight">{review.title}</h4>
            <p className="text-gray-600 font-medium text-lg leading-relaxed max-w-3xl">{review.content}</p>
          </div>

          {review.images && review.images.length > 0 && (
            <div className="flex gap-4 pt-4">
              {review.images.map((img: string, i: number) => (
                <div 
                  key={i} 
                  onClick={() => onImageClick(img)}
                  className="w-32 h-32 rounded-3xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-2xl transition-all cursor-zoom-in group/img"
                >
                  <img src={img} alt="User photo" className="w-full h-full object-cover transition-transform duration-700 group-hover/img:scale-110" />
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center gap-10 pt-8 border-t border-gray-50">
            <button 
              onClick={handleVote}
              disabled={voted}
              className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${voted ? 'text-primary-600' : 'text-gray-400 hover:text-gray-900'}`}
            >
              <ThumbsUp className={`w-4 h-4 transition-transform ${voted ? 'fill-current scale-110' : 'group-hover:scale-110'}`} /> 
              Helpful {review.helpfulCount > 0 && <span className="ml-1 opacity-60">({review.helpfulCount + (voted ? 1 : 0)})</span>}
            </button>
            
            <button className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-300 hover:text-gray-900 transition-colors">
               <MessageSquare className="w-4 h-4" />
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
                         <span className="text-[10px] font-black text-gray-900 uppercase tracking-widest">{reply.authorName}</span>
                         <span className="px-1.5 py-0.5 rounded-md bg-primary-900 text-[8px] font-black text-white uppercase tracking-widest">Official</span>
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
      
      <div className="relative w-full max-w-3xl bg-white rounded-4xl shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-10 duration-500">
        <div className="flex items-center justify-between px-10 py-8 border-b border-gray-100">
           <div>
              <h2 className="text-2xl font-black text-gray-900 tracking-tight">Post-Purchase Reflection</h2>
              <p className="text-xs font-bold text-gray-400 mt-1">Your voice shapes the DreamBees community.</p>
           </div>
           <button onClick={onClose} className="p-3 rounded-2xl bg-gray-50 text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-all">
              <X className="w-5 h-5" />
           </button>
        </div>

        <form onSubmit={handleSubmit} className="p-10 space-y-10 max-h-[75vh] overflow-y-auto custom-scrollbar">
           {/* Star Selector */}
           <div className="flex flex-col items-center justify-center py-6 bg-gray-50 rounded-4xl space-y-4">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Quality Rating</label>
              <div className="flex gap-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <button
                    key={i}
                    type="button"
                    onMouseEnter={() => setHoveredRating(i)}
                    onMouseLeave={() => setHoveredRating(0)}
                    onClick={() => handleRatingClick(i)}
                    className="p-1 transition-all hover:scale-125 active:scale-95"
                  >
                    <Star 
                      className={`w-12 h-12 transition-all ${
                        i <= (hoveredRating || rating) 
                        ? 'text-amber-400 fill-current drop-shadow-[0_0_8px_rgba(251,191,36,0.3)]' 
                        : 'text-gray-200'
                      }`} 
                    />
                  </button>
                ))}
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                 <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Alias</label>
                 <input 
                   required
                   value={formData.userName}
                   onChange={e => setFormData({...formData, userName: e.target.value})}
                   placeholder="How should we address you?"
                   className="w-full px-6 py-4 bg-gray-50 rounded-2xl border-none font-bold text-sm focus:ring-4 focus:ring-primary-500/10 transition-all"
                 />
              </div>
              <div className="space-y-3">
                 <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Contact Email</label>
                 <input 
                   required
                   type="email"
                   value={formData.email}
                   onChange={e => setFormData({...formData, email: e.target.value})}
                   placeholder="For verification only"
                   className="w-full px-6 py-4 bg-gray-50 rounded-2xl border-none font-bold text-sm focus:ring-4 focus:ring-primary-500/10 transition-all"
                 />
              </div>
           </div>

           <div className="space-y-3">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Summary Title</label>
              <input 
                required
                value={formData.title}
                onChange={e => setFormData({...formData, title: e.target.value})}
                placeholder="The essence of your experience..."
                className="w-full px-6 py-4 bg-gray-50 rounded-2xl border-none font-bold text-sm focus:ring-4 focus:ring-primary-500/10 transition-all"
              />
           </div>

           <div className="space-y-3">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">The Narrative</label>
              <textarea 
                required
                rows={5}
                value={formData.content}
                onChange={e => setFormData({...formData, content: e.target.value})}
                placeholder="Tell us about the details—texture, color accuracy, and overall vibe."
                className="w-full px-6 py-4 bg-gray-50 rounded-2xl border-none font-bold text-sm focus:ring-4 focus:ring-primary-500/10 resize-none transition-all"
              />
           </div>

           <div className="p-10 border-4 border-dashed border-gray-50 rounded-[2.5rem] flex flex-col items-center justify-center gap-4 bg-gray-50/20 group hover:bg-gray-50/50 transition-colors cursor-pointer">
              <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                <ImageIcon className="w-8 h-8 text-gray-300" />
              </div>
              <div className="text-center">
                <p className="text-[10px] font-black text-gray-900 uppercase tracking-widest mb-1">Upload Visual Proof</p>
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Supports JPG, PNG up to 10MB</p>
              </div>
              <button type="button" className="px-6 py-2 bg-gray-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-black transition-all">
                Select Media
              </button>
           </div>
        </form>

        <div className="px-10 py-8 border-t border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row items-center justify-between gap-6">
           <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary-100">
                <ShieldCheck className="w-4 h-4 text-primary-600" />
              </div>
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest max-w-[240px] leading-relaxed">
                Submissions are audited for authenticity. By posting, you adhere to our <span className="text-gray-900 underline cursor-pointer">Community Standards</span>.
              </p>
           </div>
           <button 
             onClick={handleSubmit}
             disabled={submitting}
             className="w-full sm:w-auto px-12 py-5 bg-gray-900 text-white rounded-3xl font-black text-xs uppercase tracking-[0.2em] hover:bg-black transition-all flex items-center justify-center gap-3 shadow-2xl shadow-gray-200"
           >
             {submitting ? (
               <>
                 <Loader2 className="w-4 h-4 animate-spin" />
                 <span>Transmitting...</span>
               </>
             ) : (
               <>
                 <Sparkles className="w-4 h-4" />
                 <span>Post Reflection</span>
               </>
             )}
           </button>
        </div>
      </div>
    </div>
  );
}
