'use client';
import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, Type, AlignLeft, Layout, User, Sparkles
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { KnowledgebaseArticle, Author, KnowledgebaseCategory } from '@domain/models';
import { useServices } from '../../hooks/useServices';
import { Pipeline } from './Pipeline';
import { Sidebar } from './Sidebar';
import type { AdminBlogFormProps, EditorTab } from './types';

export default function AdminBlogForm({ initialData }: AdminBlogFormProps) {
  const router = useRouter();
  const services = useServices();
  
  const [formData, setFormData] = useState<Partial<KnowledgebaseArticle>>({
    title: '',
    slug: '',
    content: '',
    excerpt: '',
    categoryId: '',
    status: 'draft',
    type: 'blog',
    tags: [],
    authorId: '',
    metaTitle: '',
    metaDescription: '',
    canonicalUrl: '',
    isFeatured: false,
    ...initialData
  });

  const [libraryImages, setLibraryImages] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<EditorTab>('publish');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState<KnowledgebaseCategory[]>([]);
  const [authors, setAuthors] = useState<Author[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState(false);

  useEffect(() => {
    async function loadLibrary() {
      try {
        const data = await services.knowledgebaseService.getArticles({ type: 'blog', status: 'all' });
        const images = Array.from(new Set(data.articles.map(p => p.featuredImageUrl).filter(Boolean))) as string[];
        setLibraryImages(images.slice(0, 8));
      } catch (err) {
        console.error('Failed to load media library', err);
      }
    }
    void loadLibrary();
  }, [services.knowledgebaseService]);

  useEffect(() => {
    if (!initialData?.slug && formData.title && !formData.slug) {
      const generatedSlug = formData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
      setFormData(prev => ({ ...prev, slug: generatedSlug }));
    }
  }, [formData.title, initialData?.slug]);

  useEffect(() => {
    async function loadResources() {
      try {
        const [cats, auths] = await Promise.all([
          services.knowledgebaseService.getCategories(),
          services.knowledgebaseService.getAuthors()
        ]);
        setCategories(cats);
        setAuthors(auths);
      } catch (err) {
        console.error('Failed to load form resources', err);
      }
    }
    void loadResources();
  }, [services.knowledgebaseService]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    setError(null);
    try {
      if (!formData.title || !formData.slug || !formData.content) {
        throw new Error('Please fill in all required fields (Title, Slug, Content)');
      }
      const postData: KnowledgebaseArticle = {
        id: formData.id || crypto.randomUUID(),
        title: formData.title,
        slug: formData.slug,
        content: formData.content,
        excerpt: formData.excerpt || '',
        categoryId: formData.categoryId || '',
        authorId: formData.authorId || '',
        authorName: authors.find(a => a.id === formData.authorId)?.name || '',
        status: formData.status as any || 'draft',
        type: formData.type as any || 'blog',
        viewCount: formData.viewCount || 0,
        helpfulCount: formData.helpfulCount || 0,
        notHelpfulCount: formData.notHelpfulCount || 0,
        tags: formData.tags || [],
        featuredImageUrl: formData.featuredImageUrl,
        featuredImageAlt: formData.featuredImageAlt,
        isFeatured: formData.isFeatured || false,
        metaTitle: formData.metaTitle,
        metaDescription: formData.metaDescription,
        canonicalUrl: formData.canonicalUrl,
        ogImage: formData.ogImage,
        ogTitle: formData.ogTitle,
        ogDescription: formData.ogDescription,
        scheduledAt: formData.scheduledAt,
        createdAt: formData.createdAt || new Date(),
        updatedAt: new Date(),
        publishedAt: formData.status === 'published' ? (formData.publishedAt || new Date()) : undefined
      };
      await fetch('/api/admin/blog/save', {
        method: 'POST',
        body: JSON.stringify(postData)
      });
      router.push('/admin/blog');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const wordCount = formData.content?.split(/\s+/).filter(x => x).length || 0;
  const readingTime = Math.ceil(wordCount / 225);

  const sharedState = {
    formData, setFormData, activeTab, setActiveTab, 
    isSubmitting, authors, categories, wordCount, readingTime
  };

  const CONTENT_TEMPLATES = {
    interview: `## The Background\n[Introduce the subject and the context of the interview]\n\n## The Conversation\n**Q: What inspired your latest collection?**\nA: [Subject's response...]\n\n**Q: How do you approach the blank canvas?**\nA: [Subject's response...]\n\n## The Legacy\n[Concluding thoughts and where to find their work]`,
    tutorial: `## Prerequisites\n- [Tool 1]\n- [Tool 2]\n\n## Step 1: Preparation\n[Explain the first step...]\n\n## Step 2: Implementation\n[Explain the second step...]\n\n## Final Result\n[Summary of the outcome and tips for success]`,
    spotlight: `## The Concept\n[Explain the "why" behind this product/collection]\n\n## Key Features\n- **Feature 1**: [Benefit]\n- **Feature 2**: [Benefit]\n\n## Why it Matters\n[The impact on collectors and the art world]`
  };

  const applyTemplate = (type: keyof typeof CONTENT_TEMPLATES) => {
    if (formData.content && !window.confirm('This will append the template to your current content. Continue?')) return;
    setFormData(prev => ({ ...prev, content: (prev.content || '') + '\n\n' + CONTENT_TEMPLATES[type] }));
  };

  return (
    <form onSubmit={handleSave} className="max-w-[1600px] mx-auto pb-32">
      <Pipeline {...sharedState} onSave={handleSave} />

      <div className="p-8 grid grid-cols-1 lg:grid-cols-12 gap-12 max-w-[1600px] mx-auto">
        <div className="lg:col-span-8 space-y-12">
          <div className="flex items-center justify-between">
            <button 
              type="button"
              onClick={() => router.back()}
              className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-900 flex items-center gap-2 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              Back to Dashboard
            </button>
            <button 
               type="button"
               onClick={() => setPreviewMode(!previewMode)}
               className="text-[10px] font-black uppercase tracking-widest text-primary-600 hover:underline"
            >
               {previewMode ? 'Return to Editor' : 'Enter Preview Mode'}
            </button>
          </div>

          {previewMode ? (
            <div className="bg-white rounded-[3rem] p-16 border border-gray-100 shadow-sm animate-in fade-in duration-500 max-w-5xl mx-auto">
               <div className="space-y-16">
                 {formData.featuredImageUrl && (
                   <img src={formData.featuredImageUrl} alt="" className="w-full h-[500px] object-cover rounded-[2.5rem] shadow-2xl" />
                 )}
                 <div className="space-y-6 text-center max-w-3xl mx-auto">
                    <span className="px-4 py-2 rounded-full bg-primary-50 text-primary-600 text-[10px] font-black uppercase tracking-widest">
                      {categories.find(c => c.id === formData.categoryId)?.name || 'General'}
                    </span>
                    <h1 className="text-7xl font-black text-gray-900 tracking-tighter leading-tight">{formData.title || 'Untitled Post'}</h1>
                    <p className="text-xl text-gray-400 font-medium leading-relaxed italic">
                      {formData.excerpt || 'No summary provided.'}
                    </p>
                 </div>
                 <div className="prose prose-slate lg:prose-2xl max-w-none prose-headings:font-black prose-headings:tracking-tighter">
                    {formData.content || 'Start writing your story...'}
                 </div>
               </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
              <div className="lg:col-span-8 space-y-12">
                 <div className="bg-white rounded-[4rem] p-12 md:p-20 border border-gray-100 shadow-sm space-y-16">
                    <div className="space-y-4">
                      <input 
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="Post Title..."
                        className="w-full text-6xl font-black text-gray-900 placeholder:text-gray-100 border-none bg-transparent outline-none p-0 tracking-tighter"
                      />
                    </div>

                    <div className="space-y-6">
                      <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                         <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                           <Type className="h-3 w-3" /> Storytelling
                         </label>
                         <div className="flex gap-4">
                           <button type="button" className="text-[10px] font-black text-primary-600 uppercase tracking-widest hover:underline">Write</button>
                           <button type="button" className="text-[10px] font-black text-gray-300 uppercase tracking-widest hover:text-gray-400">Preview</button>
                         </div>
                      </div>
                      <textarea 
                        value={formData.content}
                        onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                        placeholder="Once upon a time..."
                        rows={25}
                        className="w-full p-0 border-none bg-transparent outline-none font-medium text-gray-700 text-xl leading-relaxed resize-none placeholder:text-gray-200"
                      />
                    </div>
                 </div>

                 <div className="bg-gray-50/50 rounded-[3rem] p-12 border border-gray-100/50 space-y-6">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                      <AlignLeft className="h-3 w-3" /> Post Summary
                    </label>
                    <textarea 
                      value={formData.excerpt}
                      onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                      placeholder="Provide a compelling summary..."
                      rows={4}
                      className="w-full p-8 rounded-3xl bg-white border border-gray-100 outline-none font-medium text-gray-600 transition-all resize-none shadow-sm"
                    />
                 </div>
              </div>

              <div className="lg:col-span-4 space-y-8">
                 <div className="bg-white rounded-4xl border border-gray-100 p-8 space-y-6 shadow-sm">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Content Templates</h4>
                    <div className="grid grid-cols-1 gap-3">
                       {[
                         { id: 'interview', label: 'Artist Interview', icon: User },
                         { id: 'tutorial', label: 'Technical Tutorial', icon: Layout },
                         { id: 'spotlight', label: 'Product Spotlight', icon: Sparkles }
                       ].map((t) => (
                         <button
                           key={t.id}
                           type="button"
                           onClick={() => applyTemplate(t.id as any)}
                           className="flex items-center gap-3 p-4 rounded-2xl bg-gray-50 border border-gray-100 text-left hover:border-primary-100 hover:bg-white transition-all group"
                         >
                           <div className="h-8 w-8 rounded-xl bg-white flex items-center justify-center text-gray-400 group-hover:text-primary-600 shadow-sm">
                             <t.icon className="h-4 w-4" />
                           </div>
                           <span className="text-[10px] font-black uppercase tracking-widest text-gray-900">{t.label}</span>
                         </button>
                       ))}
                    </div>
                 </div>
                 <Sidebar {...sharedState} libraryImages={libraryImages} />
              </div>
            </div>
          )}
        </div>
      </div>
    </form>
  );
}
