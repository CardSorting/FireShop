/**
 * [LAYER: UI]
 */
'use client';
import React, { useState } from 'react';
import { 
  Calendar, Clock, User, ChevronRight, MessageSquare, 
  Share2, Heart, Send, Sparkles, Mail, ShoppingBag
} from 'lucide-react';
import type { KnowledgebaseArticle, Author, BlogComment, Product } from '@domain/models';
import Link from 'next/link';
import { useAuth } from '../hooks/useAuth';
import { useServices } from '../hooks/useServices';
import { Bookmark, ExternalLink, Play, CheckCircle2, BarChart3, BookOpen } from 'lucide-react';
import Image from 'next/image';
import type { BlogSeries } from '@domain/models';


export function BlogCard({ post, variant = 'standard' }: { 
  post: KnowledgebaseArticle, 
  variant?: 'standard' | 'wide' | 'compact' 
}) {
  const readingTime = Math.ceil((post.content?.split(' ').length || 0) / 200);
  
  if (variant === 'compact') {
    return (
    <Link 
        href={`/blog/${post.slug}`}
        className="group flex items-center gap-6 p-4 md:p-6 rounded-4xl hover:bg-gray-50 transition-all duration-500 border border-transparent hover:border-gray-100"
        itemProp="blogPost" itemScope itemType="https://schema.org/BlogPosting"
      >
        <meta itemProp="headline" content={post.title} />
        <div className="shrink-0 h-20 w-20 md:h-24 md:w-24 rounded-2xl overflow-hidden bg-gray-100 shadow-sm relative">
          {post.featuredImageUrl ? (
            <Image 
              src={post.featuredImageUrl} 
              alt={post.title} 
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-110" 
              itemProp="image"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Sparkles className="h-8 w-8 text-gray-200" />
            </div>
          )}
        </div>
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-3">
            <span className="text-[9px] font-black uppercase tracking-widest text-primary-600" itemProp="articleSection">{post.categoryName}</span>
            <span className="h-1 w-1 rounded-full bg-gray-200" />
            <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">{readingTime}m Read</span>
          </div>
          <h4 className="text-base md:text-lg font-black text-gray-900 line-clamp-2 leading-tight group-hover:text-primary-600 transition-colors tracking-tight">
            {post.title}
          </h4>
        </div>
      </Link>
    );
  }

  const isWide = variant === 'wide';

  return (
    <Link 
      href={`/blog/${post.slug}`}
      className={`group flex flex-col ${isWide ? 'lg:flex-row lg:col-span-2' : ''} h-full bg-gray-50/30 rounded-3xl overflow-hidden border border-gray-100 transition-all duration-500 hover:bg-white hover:border-primary-200`}
      itemProp="blogPost" itemScope itemType="https://schema.org/BlogPosting"
    >
      <div className={`relative ${isWide ? 'lg:w-[40%] h-64 md:h-80 lg:h-auto' : 'h-52 md:h-60'} overflow-hidden shrink-0`}>
        {post.featuredImageUrl ? (
          <Image 
            src={post.featuredImageUrl} 
            alt={post.title} 
            fill
            className="object-cover transition-transform duration-1000 group-hover:scale-105"
            itemProp="image"
          />
        ) : (
          <div className="w-full h-full bg-gray-100 flex items-center justify-center">
            <Sparkles className="h-8 w-8 text-gray-300" />
          </div>
        )}
      </div>
      
      <div className={`p-6 md:p-8 flex-1 flex flex-col ${isWide ? 'lg:justify-center lg:px-10' : ''}`}>
        <div className="space-y-3 flex-1">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-black uppercase tracking-widest text-primary-600">
              {post.categoryName}
            </span>
            <div className="flex items-center gap-1.5 text-[9px] font-bold text-gray-400">
              <Clock className="h-3 w-3" />
              {readingTime}m
            </div>
          </div>
          
          <h3 className={`${isWide ? 'text-2xl md:text-3xl' : 'text-lg md:text-xl'} font-black text-gray-900 leading-tight group-hover:text-primary-600 transition-colors tracking-tight`}>
            {post.title}
          </h3>
          
          <p className="text-gray-500 font-medium line-clamp-2 text-xs md:text-sm leading-relaxed">
            {post.excerpt}
          </p>
        </div>

        <div className="mt-6 flex items-center justify-between pt-4 border-t border-gray-100/50">
          <div className="flex items-center gap-2">
             <div className="h-6 w-6 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden grayscale group-hover:grayscale-0 transition-all">
               <img 
                 src={`https://ui-avatars.com/api/?name=${encodeURIComponent(post.authorName || 'DreamBees Editorial')}&background=random&color=fff`} 
                 alt="Author" 
                 className="h-full w-full object-cover"
                 onError={(e) => {
                   (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=DE&background=000&color=fff`;
                 }}
               />
             </div>
             <span className="text-[9px] font-black text-gray-400 group-hover:text-gray-900 uppercase tracking-widest transition-colors">{post.authorName || 'DreamBees Editorial'}</span>
          </div>
          
          <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-primary-600 group-hover:translate-x-1 transition-all" />
        </div>
      </div>
    </Link>
  );
}

export function TrendingPostItem({ post, index }: { post: KnowledgebaseArticle, index: number }) {
  const readingTime = Math.ceil((post.content?.split(' ').length || 0) / 200);
  
  return (
    <Link 
      href={`/blog/${post.slug}`}
      className="group flex items-start gap-6 p-4 rounded-2xl hover:bg-white hover:shadow-xl transition-all duration-500 border border-transparent hover:border-gray-100"
    >
      <span className="text-3xl font-black text-gray-100 group-hover:text-primary-500 transition-colors tabular-nums pt-1">
        {String(index + 1).padStart(2, '0')}
      </span>
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 rounded-lg overflow-hidden border border-gray-100">
            <img 
              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${post.authorName || 'Staff'}`} 
              alt="Author" 
              className="h-full w-full object-cover"
            />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-gray-900">{post.authorName}</span>
        </div>
        <h4 className="text-sm font-black text-gray-900 leading-snug group-hover:text-primary-600 transition-colors line-clamp-2 tracking-tight">
          {post.title}
        </h4>
        <div className="flex items-center gap-3 text-[9px] font-bold text-gray-400 uppercase tracking-widest">
          <span>{new Date(post.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
          <span className="h-1 w-1 rounded-full bg-gray-200" />
          <span>{readingTime} Min Read</span>
        </div>
      </div>
    </Link>
  );
}

import * as LucideIcons from 'lucide-react';

export function TopicPill({ 
  name, 
  isActive, 
  onClick, 
  icon, 
  count 
}: { 
  name: string, 
  isActive?: boolean, 
  onClick?: () => void, 
  icon?: string,
  count?: number
}) {
  const Icon = icon ? (LucideIcons as any)[icon] || LucideIcons.Sparkles : null;

  return (
    <button
      onClick={onClick}
      className={`group relative flex items-center gap-3 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 whitespace-nowrap ${
        isActive 
          ? 'bg-gray-900 text-white shadow-2xl shadow-gray-200 -translate-y-1' 
          : 'bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-900 border border-gray-100 shadow-sm'
      }`}
    >
      {Icon && (
        <Icon className={`h-4 w-4 transition-transform duration-500 ${isActive ? 'text-primary-400' : 'text-gray-300 group-hover:text-primary-600 group-hover:scale-110'}`} />
      )}
      <span>{name}</span>
      {count !== undefined && (
        <span className={`px-2 py-0.5 rounded-lg text-[8px] font-bold ${isActive ? 'bg-white/10 text-white/40' : 'bg-gray-100 text-gray-400 group-hover:bg-primary-50 group-hover:text-primary-600'}`}>
          {count}
        </span>
      )}
      
      {isActive && (
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-1 bg-primary-500 rounded-full blur-[2px]" />
      )}
    </button>
  );
}

export function SeriesCard({ series }: { series: BlogSeries }) {
  return (
    <Link 
      href={`/blog/series/${series.slug}`}
      className="group relative flex flex-col w-[320px] md:w-[400px] shrink-0 bg-white rounded-3xl overflow-hidden border border-gray-100 transition-all duration-500 hover:border-primary-200"
    >
      <div className="relative h-48 overflow-hidden">
        {series.featuredImageUrl ? (
          <img src={series.featuredImageUrl} alt={series.title} className="w-full h-full object-cover transition-transform duration-[10s] group-hover:scale-110" />
        ) : (
          <div className="w-full h-full bg-gray-100" />
        )}
        <div className="absolute inset-0 bg-linear-to-t from-white via-white/20 to-transparent" />
      </div>

      <div className="relative p-8 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-[9px] font-black uppercase tracking-widest text-primary-600">
            Learning Path
          </span>
          <span className="text-[9px] font-black uppercase tracking-widest text-gray-300">
            {series.difficulty}
          </span>
        </div>

        <div className="space-y-2">
          <h3 className="text-xl font-black text-gray-900 tracking-tight leading-tight group-hover:text-primary-600 transition-colors">
            {series.title}
          </h3>
          <p className="text-gray-500 text-xs font-medium line-clamp-2 leading-relaxed">
            {series.description}
          </p>
        </div>

        <div className="pt-4 flex items-center justify-between border-t border-gray-50">
          <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest">{series.articleCount} Articles</span>
          <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-primary-600 group-hover:translate-x-1 transition-all" />
        </div>
      </div>
    </Link>
  );
}



export function AuthorBox({ author }: { author: Author }) {
  return (
    <div className="bg-gray-900 rounded-4xl p-10 md:p-12 text-white relative overflow-hidden group shadow-2xl" itemProp="author" itemScope itemType="https://schema.org/Person">
      <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-primary-600/20 blur-3xl group-hover:scale-150 transition-transform duration-1000" />
      
      <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
        <div className="shrink-0 relative h-32 w-32">
          {author.avatarUrl ? (
            <Image 
              src={author.avatarUrl} 
              alt={author.name} 
              fill
              className="rounded-4xl object-cover ring-4 ring-white/10 shadow-2xl" 
              itemProp="image"
            />
          ) : (
            <div className="h-full w-full rounded-4xl bg-white/5 flex items-center justify-center ring-4 ring-white/10">
              <User className="h-12 w-12 text-white/20" />
            </div>
          )}
        </div>

        
        <div className="flex-1 text-center md:text-left space-y-4">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-primary-400">{author.role}</span>
            <h3 className="text-3xl font-black tracking-tight mt-1">{author.name}</h3>
          </div>
          <p className="text-white/60 font-medium leading-relaxed max-w-2xl">
            {author.bio}
          </p>
          <div className="flex items-center justify-center md:justify-start gap-4 pt-2">
             {author.socialLinks?.twitter && (
               <a href={author.socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 hover:scale-110 transition-all border border-white/5">
                 <Share2 className="h-4 w-4" />
               </a>
             )}
             {author.socialLinks?.instagram && (
               <a href={author.socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 hover:scale-110 transition-all border border-white/5">
                 <Share2 className="h-4 w-4" />
               </a>
             )}
             {author.socialLinks?.website && (
               <a href={author.socialLinks.website} target="_blank" rel="noopener noreferrer" className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 hover:scale-110 transition-all border border-white/5">
                 <Share2 className="h-4 w-4" />
               </a>
             )}
          </div>

        </div>
      </div>
    </div>
  );
}

export function CommentSection({ postId, comments, onAddComment }: { 
  postId: string, 
  comments: BlogComment[],
  onAddComment: (content: string) => Promise<void>
}) {
  const { user } = useAuth();
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user || isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      await onAddComment(newComment);
      setNewComment('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-12">
      <div className="flex items-center justify-between">
        <h3 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-4">
          <MessageSquare className="h-8 w-8 text-primary-600" />
          Comments <span className="text-gray-300 font-medium">({comments.length})</span>
        </h3>
      </div>
      
      {user ? (
        <form onSubmit={handleSubmit} className="relative bg-white rounded-4xl p-2 border border-gray-100 shadow-xl focus-within:ring-8 focus-within:ring-primary-500/5 transition-all">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Share your thoughts with the community..."
            rows={4}
            className="w-full resize-none rounded-3xl border-none bg-gray-50/50 p-6 text-sm font-medium focus:ring-0 outline-none transition-colors"
          />
          <div className="flex items-center justify-between p-4 bg-white rounded-3xl">
            <div className="flex items-center gap-3 ml-2">
               <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                 <User className="h-4 w-4 text-primary-600" />
               </div>
               <span className="text-xs font-bold text-gray-900">{user.displayName}</span>
            </div>
            <button
              type="submit"
              disabled={!newComment.trim() || isSubmitting}
              className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-gray-900 text-white font-black text-xs uppercase tracking-widest hover:bg-black transition-all shadow-lg shadow-black/10 disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Post Comment
            </button>
          </div>
        </form>
      ) : (
        <div className="bg-gray-50 rounded-4xl p-12 text-center border border-gray-100">
           <User className="h-12 w-12 text-gray-200 mx-auto mb-6" />
           <h4 className="text-xl font-black text-gray-900 mb-2">Join the conversation</h4>
           <p className="text-gray-500 font-medium mb-8">Please sign in to leave a comment and engage with other collectors.</p>
           <Link href="/login" className="inline-flex px-8 py-4 rounded-2xl bg-gray-900 text-white font-black text-xs uppercase tracking-widest hover:bg-black transition-all">
             Sign In to Comment
           </Link>
        </div>
      )}

      
      <div className="space-y-8">
        {comments.map(comment => (
          <div key={comment.id} className="flex gap-6 group animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="shrink-0 pt-2">
              {comment.userAvatar ? (
                <img src={comment.userAvatar} alt={comment.userName} className="h-12 w-12 rounded-2xl object-cover shadow-sm" />
              ) : (
                <div className="h-12 w-12 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-400 group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors">
                  <User className="h-6 w-6" />
                </div>
              )}
            </div>
            <div className="flex-1 space-y-3">
               <div className="flex items-center gap-3">
                 <span className="text-sm font-black text-gray-900">{comment.userName}</span>
                 <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">{new Date(comment.createdAt).toLocaleDateString()}</span>
               </div>
               <div className="bg-white rounded-3xl p-6 border border-gray-50 shadow-sm relative group-hover:border-primary-100 transition-colors">
                 <p className="text-gray-600 font-medium leading-relaxed">{comment.content}</p>
                 <div className="mt-4 flex items-center gap-4">
                    <button className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-red-500 transition-colors">
                      <Heart className="h-3 w-3" />
                      <span>{comment.likes || 0}</span>
                    </button>
                    <button className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-primary-600 transition-colors">
                      Reply
                    </button>
                 </div>
               </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function NewsletterBox() {
  const services = useServices();
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      await services.knowledgebaseService.subscribe(email, 'blog_footer');
      setSubscribed(true);
    } catch (err) {
      console.error('Subscription failed', err);
    } finally {
      setIsSubmitting(false);
    }
  };


  if (subscribed) {
    return (
      <div className="bg-primary-600 rounded-4xl p-12 text-center text-white shadow-2xl animate-in zoom-in duration-500">
         <div className="h-20 w-20 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-8">
           <Mail className="h-10 w-10" />
         </div>
         <h3 className="text-3xl font-black tracking-tight mb-4">You're on the list!</h3>
         <p className="text-white/80 font-medium max-w-sm mx-auto">Welcome to the inner circle. We'll send you early access and collector exclusives soon.</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-4xl p-10 md:p-16 text-white relative overflow-hidden group shadow-2xl">

      <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-primary-600/20 blur-3xl group-hover:scale-150 transition-transform duration-1000" />
      <div className="absolute -left-20 -bottom-20 h-80 w-80 rounded-full bg-amber-600/10 blur-3xl group-hover:scale-150 transition-transform duration-1000" />
      
      <div className="relative z-10 flex flex-col lg:flex-row items-center gap-12 lg:gap-24">
        <div className="flex-1 text-center lg:text-left space-y-6">
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white/10 border border-white/5">
            <Sparkles className="h-4 w-4 text-primary-400" />
            <span className="text-[10px] font-black uppercase tracking-widest text-white/80">Collector Exclusive</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-black tracking-tight leading-tight">
            Stay ahead of the <span className="text-primary-400 italic">Drop.</span>
          </h2>
          <p className="text-lg font-medium text-white/60">
            Join 5,000+ collectors getting weekly insights, early access to new prints, and members-only discounts.
          </p>
        </div>
        
        <div className="w-full lg:w-[400px]">
          <form onSubmit={handleSubscribe} className="space-y-4">
            <div className="relative group">
              <Mail className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-white/20 group-focus-within:text-primary-400 transition-colors" />
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="collector@example.com"
                required
                className="w-full h-20 rounded-3xl bg-white/5 border-2 border-white/10 pl-16 pr-8 text-white font-bold placeholder:text-white/20 outline-none focus:border-primary-500 focus:bg-white/10 transition-all shadow-xl"
              />
            </div>
            <button 
              type="submit"
              className="w-full h-20 rounded-3xl bg-primary-600 text-white font-black text-sm uppercase tracking-widest hover:bg-primary-500 hover:shadow-2xl hover:shadow-primary-500/40 transition-all"
            >
              Get Early Access
            </button>
            <p className="text-center text-[10px] font-medium text-white/30">
              No spam. Unsubscribe at any time. We value your privacy.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

export function RelatedProducts({ products }: { products: Product[] }) {
  if (!products.length) return null;

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <h3 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-4">
          <ShoppingBag className="h-8 w-8 text-primary-600" />
          Featured In This Post
        </h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {products.map(product => (
          <Link 
            key={product.id}
            href={`/products/${product.id}`}
            className="group bg-white rounded-4xl p-6 border border-gray-100 shadow-sm hover:shadow-2xl transition-all duration-500"
          >
            <div className="relative h-48 overflow-hidden rounded-3xl mb-6 bg-gray-50">
              <img src={product.imageUrl} alt={product.name} className="w-full h-full object-contain p-4 group-hover:scale-110 transition-transform duration-500" />
              <div className="absolute top-4 right-4">
                 <span className="px-4 py-2 rounded-2xl bg-gray-900 text-white text-[10px] font-black uppercase tracking-widest shadow-xl">
                   ${(product.price / 100).toFixed(2)}
                 </span>
              </div>
            </div>
            <h4 className="text-lg font-black text-gray-900 mb-2 group-hover:text-primary-600 transition-colors line-clamp-1">{product.name}</h4>
            <p className="text-xs font-medium text-gray-400 line-clamp-2 leading-relaxed">{product.description}</p>
            <div className="mt-6 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary-600 group-hover:gap-4 transition-all">
               <span>View Product</span>
               <ChevronRight className="h-3 w-3" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
