'use client';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useServices } from '@ui/hooks/useServices';
import { useAuth } from '@ui/hooks/useAuth';
import { AuthorBox, CommentSection, RelatedProducts, NewsletterBox, BlogCard } from '@ui/components/BlogComponents';

import { 
  Loader2, ArrowLeft, Calendar, Clock, User, 
  Share2, Heart, MessageSquare, ChevronLeft, ChevronRight, Sparkles 
} from 'lucide-react';
import Link from 'next/link';
import type { KnowledgebaseArticle, Author, BlogComment, Product } from '@domain/models';

export default function PostContent({ post, initialComments, initialAuthor, initialRelatedProducts, latestPosts = [] }: { 
  post: KnowledgebaseArticle,
  initialComments: BlogComment[],
  initialAuthor: Author | null,
  initialRelatedProducts: Product[],
  latestPosts?: KnowledgebaseArticle[]
}) {
  const services = useServices();
  const { user } = useAuth();
  
  const [comments, setComments] = useState<BlogComment[]>(initialComments);
  const [author, setAuthor] = useState<Author | null>(initialAuthor);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>(initialRelatedProducts);
  const [scrollProgress, setScrollProgress] = useState(0);

  // Dynamic Table of Contents extraction
  const toc = useMemo(() => {
    if (!post.content) return [];
    // Simple regex to find Markdown style headings (## Heading)
    const headingRegex = /^##\s+(.+)$/gm;
    const matches = [];
    let match;
    while ((match = headingRegex.exec(post.content)) !== null) {
      matches.push({
        text: match[1],
        id: match[1].toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-')
      });
    }
    return matches;
  }, [post.content]);

  useEffect(() => {
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
      const currentProgress = (window.scrollY / totalScroll) * 100;
      setScrollProgress(currentProgress);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    // Track engagement once on mount
    void services.knowledgebaseService.trackEngagement(post.id, 'view', user?.id);
  }, [post.id, services.knowledgebaseService, user?.id]);

  const handleAddComment = async (content: string) => {
    if (!user) return;
    try {
      await services.knowledgebaseService.addComment(
        post.id, 
        content, 
        user.id, 
        user.displayName || 'Anonymous', 
        (user as any).avatarUrl
      );
      // Reload comments
      const updatedComments = await services.knowledgebaseService.getComments(post.id);
      setComments(updatedComments);
    } catch (err) {
      console.error('Failed to add comment', err);
    }
  };

  const handleCopyLink = () => {
    void navigator.clipboard.writeText(window.location.href);
    // Could add a toast here
  };

  const wordCount = post.content?.split(/\s+/).filter(x => x).length || 0;
  const readingTime = Math.ceil(wordCount / 225);

  return (
    <div className="pb-32 space-y-24 animate-in fade-in duration-1000">
      {/* Reading Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-1.5 z-100 bg-gray-100">
        <div 
          className="h-full bg-primary-600 transition-all duration-100" 
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* Cinematic Header */}
      <div className="relative min-h-[70vh] w-full flex items-end">
        {post.featuredImageUrl && (
          <div className="absolute inset-0">
             <img src={post.featuredImageUrl} alt={post.featuredImageAlt || post.title} className="w-full h-full object-cover" />
             <div className="absolute inset-0 bg-linear-to-t from-gray-950 via-gray-950/40 to-transparent" />
          </div>
        )}
        
        <div className="relative z-10 max-w-6xl mx-auto px-6 pb-20 w-full">
           <div className="space-y-8">
             {/* Breadcrumbs */}
             <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-white/40">
                <Link href="/" className="hover:text-white transition-colors">Home</Link>
                <ChevronRight className="h-3 w-3" />
                <Link href="/blog" className="hover:text-white transition-colors">Journal</Link>
                <ChevronRight className="h-3 w-3" />
                <span className="text-white/80">{post.categoryName}</span>
             </div>

             <div className="flex items-center gap-4">
               <Link href="/blog" className="h-12 w-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/20 transition-all">
                 <ChevronLeft className="h-6 w-6" />
               </Link>
               <span className="px-4 py-2 rounded-full bg-primary-600 text-[10px] font-black uppercase tracking-widest text-white shadow-xl shadow-primary-600/20">
                  {post.categoryName}
               </span>
             </div>
             
             <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-white tracking-tighter leading-[0.9] max-w-5xl">
               {post.title}
             </h1>
             
             <div className="flex flex-wrap items-center gap-8 text-white/60 pt-4">
                <div className="flex items-center gap-3">
                   <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-md">
                     <User className="h-5 w-5" />
                   </div>
                   <div>
                     <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Written By</p>
                     <p className="text-sm font-bold text-white">{post.authorName || 'Staff Writer'}</p>
                   </div>
                </div>
                <div className="h-10 w-px bg-white/10 hidden md:block" />
                <div className="flex items-center gap-3">
                   <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-md">
                     <Calendar className="h-5 w-5" />
                   </div>
                   <div>
                     <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Published</p>
                     <p className="text-sm font-bold text-white">{new Date(post.createdAt).toLocaleDateString()}</p>
                   </div>
                </div>
                <div className="h-10 w-px bg-white/10 hidden md:block" />
                <div className="flex items-center gap-3">
                   <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-md">
                     <Clock className="h-5 w-5" />
                   </div>
                   <div>
                     <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Duration</p>
                     <p className="text-sm font-bold text-white">{readingTime} Min Read</p>
                   </div>
                </div>
             </div>
           </div>
        </div>
      </div>

      {/* Article Content */}
      <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-12 gap-20">
        <div className="lg:col-span-8 space-y-20">
          <article className="prose prose-slate lg:prose-2xl max-w-none prose-headings:font-black prose-headings:tracking-tighter prose-p:font-medium prose-p:text-gray-600 prose-p:leading-relaxed prose-a:text-primary-600 prose-strong:text-gray-900 prose-img:rounded-[3rem] prose-img:shadow-2xl">
            {post.content}
          </article>
          
          <div className="pt-20 border-t border-gray-100">
            {author && <AuthorBox author={author} />}
          </div>
          
          <div className="pt-20 border-t border-gray-100">
            <CommentSection postId={post.id} comments={comments} onAddComment={handleAddComment} />
          </div>
        </div>
        
        {/* Sidebar */}
        <div className="lg:col-span-4 space-y-12">
          <div className="sticky top-32 space-y-12">
             {/* Table of Contents */}
             {toc.length > 0 && (
               <div className="bg-white rounded-[2.5rem] p-10 border border-gray-100 shadow-sm">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-8 flex items-center gap-2">
                    <Sparkles className="h-3 w-3 text-primary-600" /> In This Article
                  </h4>
                  <nav className="space-y-4">
                     {toc.map((item: { text: string; id: string }, i: number) => (
                       <button 
                         key={i}
                         onClick={() => {
                           const el = document.getElementById(item.id);
                           if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                         }}
                         className="text-sm font-bold text-gray-500 hover:text-primary-600 transition-colors text-left group flex items-center gap-3"
                       >
                         <span className="text-[10px] text-gray-300 group-hover:text-primary-600 transition-colors">0{i + 1}</span>
                         {item.text}
                       </button>
                     ))}
                  </nav>
               </div>
             )}

            <RelatedProducts products={relatedProducts} />
            
            <div className="bg-gray-50 rounded-[2.5rem] p-10 border border-gray-100">
               <h4 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-8">Share this insight</h4>
               <div className="grid grid-cols-2 gap-4">
                 <button 
                  onClick={() => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(window.location.href)}`, '_blank')}
                  className="flex items-center justify-center gap-3 h-14 rounded-2xl bg-white border border-gray-100 hover:border-primary-100 hover:text-primary-600 transition-all font-bold text-sm"
                 >
                   <Share2 className="h-4 w-4" />
                   Twitter
                 </button>
                 <button 
                  onClick={handleCopyLink}
                  className="flex items-center justify-center gap-3 h-14 rounded-2xl bg-white border border-gray-100 hover:border-primary-100 hover:text-primary-600 transition-all font-bold text-sm"
                 >
                   <Heart className="h-4 w-4" />
                   Copy Link
                 </button>
               </div>
            </div>
            
            <div className="bg-gray-900 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden group">
               <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-primary-600/20 blur-2xl group-hover:scale-150 transition-transform duration-1000" />
               <h4 className="text-2xl font-black mb-4 relative z-10">Collector's Circle</h4>
               <p className="text-white/80 font-medium mb-8 text-sm leading-relaxed relative z-10">
                 Get notified about the next drop and gain exclusive insights before anyone else.
               </p>
               <button onClick={() => document.getElementById('newsletter-section')?.scrollIntoView({ behavior: 'smooth' })} className="inline-flex w-full h-14 items-center justify-center rounded-xl bg-white text-gray-900 font-black text-xs uppercase tracking-widest hover:shadow-xl transition-all relative z-10">
                 Join Newsletter
               </button>
            </div>
          </div>
        </div>
      </div>

      {/* More Stories */}
      {latestPosts.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 space-y-12">
          <div className="flex items-center justify-between">
            <h3 className="text-3xl font-black text-gray-900 tracking-tight">More Stories From The Journal</h3>
            <Link href="/blog" className="text-xs font-black uppercase tracking-widest text-primary-600 hover:underline">View All Entries</Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {latestPosts.map(p => (
              <BlogCard key={p.id} post={p} />
            ))}
          </div>
        </div>
      )}
      
      {/* Footer CTA */}
      <div id="newsletter-section" className="max-w-7xl mx-auto px-4">
        <NewsletterBox />
      </div>
    </div>
  );
}
