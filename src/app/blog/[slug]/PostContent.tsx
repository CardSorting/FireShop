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
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSlug from 'rehype-slug';
import rehypeRaw from 'rehype-raw';
import DOMPurify from 'dompurify';
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
  const [toc, setToc] = useState<{ text: string, id: string }[]>([]);
  const [activeId, setActiveId] = useState<string>('');

  useEffect(() => {
    if (!post.content) return;
    const headingRegex = /^##\s+(.+)$/gm;
    const matches: { text: string; id: string }[] = [];
    let match;
    while ((match = headingRegex.exec(post.content)) !== null) {
      matches.push({
        text: match[1],
        id: match[1].toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-')
      });
    }
    setToc(matches);

    // Observer for active headings
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: '-20% 0% -35% 0%', threshold: 1 }
    );

    // Wait for content to render then observe
    const observeTimer = window.setTimeout(() => {
      matches.forEach(m => {
        const el = document.getElementById(m.id);
        if (el) observer.observe(el);
      });
    }, 100);

    return () => {
      window.clearTimeout(observeTimer);
      observer.disconnect();
    };
  }, [post.content]);

  useEffect(() => {
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
      const currentProgress = totalScroll > 0 ? (window.scrollY / totalScroll) * 100 : 0;
      setScrollProgress(currentProgress);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
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
    <>
      {/* Reading Progress Capsule */}
      <div className="fixed bottom-10 right-10 z-100 animate-in slide-in-from-right-10 duration-500">
         <div className="bg-gray-900 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 border border-white/10 backdrop-blur-md">
            <div className="h-2 w-2 rounded-full bg-primary-500 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest">
              {Math.max(1, Math.ceil(readingTime * (1 - scrollProgress / 100)))} min left
            </span>
            <div className="h-4 w-px bg-white/20 mx-1" />
            <span className="text-[10px] font-black uppercase tracking-widest text-primary-400">
              {Math.round(scrollProgress)}%
            </span>
         </div>
      </div>

      <div className="pb-32 space-y-24 animate-in fade-in duration-1000 pt-8">

      {/* Reading Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-1.5 z-100 bg-gray-100">
        <div 
          className="h-full bg-primary-600 transition-all duration-100" 
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* Cinematic Header */}
      <div className="relative min-h-[85vh] w-full flex flex-col justify-between py-20">
        {post.featuredImageUrl && (
          <motion.div 
            style={{ y: (scrollProgress / 100) * 150 }}
            className="absolute inset-0 z-0"
          >
             <img src={post.featuredImageUrl} alt={post.featuredImageAlt || post.title} className="w-full h-full object-cover scale-110" />
             <div className="absolute inset-0 bg-linear-to-t from-gray-950 via-gray-950/60 to-transparent" />
             <div className="absolute inset-0 backdrop-blur-[2px] opacity-20" />
          </motion.div>
        )}
        
        {/* Top: Breadcrumbs & Back */}
        <div className="relative z-10 max-w-6xl mx-auto px-6 w-full">
           <div className="flex flex-col gap-8">
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
           </div>
        </div>

        {/* Bottom: Title & Meta */}
        <div className="relative z-10 max-w-6xl mx-auto px-6 w-full">
           <div className="space-y-8">
             <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-white tracking-tighter leading-[0.9] max-w-5xl">
               {post.title}
             </h1>
             
             <div className="flex flex-wrap items-center gap-8 text-white/60 pt-4">
                <div className="flex items-center gap-3">
                   <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-md overflow-hidden border border-white/20">
                     <img 
                       src={author?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(post.authorName || 'DreamBees Editorial')}&background=random&color=fff`} 
                       alt={post.authorName || 'DreamBees Editorial'} 
                       className="h-full w-full object-cover opacity-80"
                       onError={(e) => {
                         (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=DE&background=000&color=fff`;
                       }}
                     />
                   </div>
                   <div>
                     <p className="text-[10px] font-black uppercase tracking-widest text-white/40">
                       {author ? author.role : 'Editorial Team'}
                     </p>
                     <p className="text-sm font-bold text-white">{post.authorName || 'DreamBees Editorial'}</p>
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
      <div className="relative max-w-4xl mx-auto px-4">
        {/* Paper Texture Overlay */}
        <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none mix-blend-multiply bg-[url('/textures/asfalt-light.png')]" />
        
        {/* Main Content */}
        <div className="space-y-20 relative">
          {/* Sticky Social Share (Desktop) */}
          <div className="hidden 2xl:block absolute -left-32 top-0 h-full">
            <div className="sticky top-40 flex flex-col gap-4">
              {[
                { icon: Share2, label: 'Share', color: 'hover:bg-blue-50 hover:text-blue-600' },
                { icon: Heart, label: 'Like', color: 'hover:bg-red-50 hover:text-red-600' },
                { icon: MessageSquare, label: 'Discuss', color: 'hover:bg-primary-50 hover:text-primary-600' }
              ].map((item, i) => (
                <button 
                  key={i}
                  className={`h-12 w-12 rounded-2xl bg-white border border-gray-100 flex items-center justify-center transition-all shadow-sm ${item.color}`}
                  title={item.label}
                >
                  <item.icon className="h-5 w-5" />
                </button>
              ))}
            </div>
          </div>

          <article className="prose prose-slate prose-serif lg:prose-2xl max-w-none prose-headings:font-black prose-headings:tracking-tighter prose-p:font-medium prose-p:text-gray-600 prose-p:leading-relaxed prose-a:text-primary-600 prose-strong:text-gray-900 prose-img:rounded-[3rem] prose-img:shadow-2xl prose-pre:bg-gray-900 prose-pre:rounded-4xl prose-pre:p-8">
            <ReactMarkdown 
              remarkPlugins={[remarkGfm]} 
              rehypePlugins={[rehypeSlug, rehypeRaw]}
              components={{
                p: ({node, children, ...props}) => {
                  // Apply drop-cap only to the first paragraph
                  const isFirst = node?.position?.start.line === 1 || (node as any).index === 0;
                  return <p {...props} className={isFirst ? 'drop-cap' : ''}>{children}</p>;
                },
                h2: ({node, children, ...props}) => (
                  <h2 {...props} className="editorial-h2 mt-20 mb-10">{children}</h2>
                ),
                blockquote: ({node, children, ...props}) => {
                  const { onAnimationStart, onDragStart, onDragEnd, onDrag, ...safeProps } = props as any;
                  return (
                    <motion.blockquote 
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      className="editorial-blockquote"
                      {...safeProps}
                    >
                      {children}
                    </motion.blockquote>
                  );
                },
                hr: () => (
                  <div className="editorial-hr-hive">
                    <div className="h-px flex-1 bg-gray-100" />
                    <Sparkles className="h-4 w-4 text-primary-500/40" />
                    <div className="h-px flex-1 bg-gray-100" />
                  </div>
                ),
                img: ({node, ...props}) => {
                  const { onAnimationStart, onDragStart, onDragEnd, onDrag, ...safeProps } = props as any;
                  return (
                    <motion.div 
                      initial={{ opacity: 0, y: 40, scale: 0.98 }}
                      whileInView={{ opacity: 1, y: 0, scale: 1 }}
                      viewport={{ once: true, margin: "-100px" }}
                      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                      className="my-24 space-y-6"
                    >
                      <div className="relative group overflow-hidden rounded-[3rem] shadow-2xl border border-gray-100">
                        <img {...safeProps} className="w-full transition-transform duration-700 group-hover:scale-105" />
                        <div className="absolute inset-0 ring-1 ring-inset ring-black/5 rounded-[3rem]" />
                      </div>
                      {props.alt && (
                        <p className="text-center text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{props.alt}</p>
                      )}
                    </motion.div>
                  );
                }
              }}
            >
              {typeof window !== 'undefined' ? DOMPurify.sanitize(post.content) : post.content}
            </ReactMarkdown>
          </article>

          {/* Post Navigation */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-20 border-t border-gray-100">
            {latestPosts && latestPosts.length > 0 ? (
              <Link 
                href={`/blog/${latestPosts[0].slug}`}
                className="p-8 rounded-[2.5rem] bg-gray-50 border border-gray-100 flex flex-col items-start gap-4 group cursor-pointer hover:bg-white hover:shadow-xl transition-all"
              >
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                  <ChevronLeft className="h-3 w-3" /> Previous Story
                </span>
                <h4 className="font-black text-gray-900 group-hover:text-primary-600 transition-colors line-clamp-1">
                  {latestPosts[0].title}
                </h4>
              </Link>
            ) : (
              <div className="p-8 rounded-[2.5rem] bg-gray-50 border border-gray-100 flex flex-col items-start gap-4 opacity-50">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">No Previous Story</span>
              </div>
            )}

            {latestPosts && latestPosts.length > 1 ? (
              <Link 
                href={`/blog/${latestPosts[1].slug}`}
                className="p-8 rounded-[2.5rem] bg-gray-50 border border-gray-100 flex flex-col items-end text-right gap-4 group cursor-pointer hover:bg-white hover:shadow-xl transition-all"
              >
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                  Next Story <ChevronRight className="h-3 w-3" />
                </span>
                <h4 className="font-black text-gray-900 group-hover:text-primary-600 transition-colors line-clamp-1">
                  {latestPosts[1].title}
                </h4>
              </Link>
            ) : (
              <div className="p-8 rounded-[2.5rem] bg-gray-50 border border-gray-100 flex flex-col items-end text-right gap-4 opacity-50">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">No Next Story</span>
              </div>
            )}
          </div>

          <div className="pt-20 border-t border-gray-100">
            {author && <AuthorBox author={author} />}
          </div>
          
          <div className="pt-20 border-t border-gray-100">
            <CommentSection postId={post.id} comments={comments} onAddComment={handleAddComment} />
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
    </>
  );
}
