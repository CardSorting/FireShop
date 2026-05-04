'use client';
import React, { useState, useEffect } from 'react';
import { 
  Save, X, ChevronLeft, Image as ImageIcon, 
  Sparkles, Eye, Layout, Type, AlignLeft,
  Tags, User, CheckCircle2, AlertCircle, Loader2,
  Globe, Search, Share2, Calendar, Hash, Clock
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { KnowledgebaseArticle, Author, KnowledgebaseCategory } from '@domain/models';
import { useServices } from '../hooks/useServices';

interface AdminBlogFormProps {
  initialData?: Partial<KnowledgebaseArticle>;
}

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
  const [activeTab, setActiveTab] = useState<'publish' | 'seo' | 'social'>('publish');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadLibrary() {
      try {
        const posts = await services.knowledgebaseService.getArticles({ type: 'blog', status: 'all' });
        const images = Array.from(new Set(posts.map(p => p.featuredImageUrl).filter(Boolean))) as string[];
        setLibraryImages(images.slice(0, 8));
      } catch (err) {
        console.error('Failed to load media library', err);
      }
    }
    void loadLibrary();
  }, [services.knowledgebaseService]);

  // Auto-generate slug from title
  useEffect(() => {
    if (!initialData?.slug && formData.title && !formData.slug) {
      const generatedSlug = formData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
      setFormData(prev => ({ ...prev, slug: generatedSlug }));
    }
  }, [formData.title, initialData?.slug]);

  const [categories, setCategories] = useState<KnowledgebaseCategory[]>([]);
  const [authors, setAuthors] = useState<Author[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState(false);

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
      // Basic validation
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
        authorId: formData.authorId,
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

      // In a real app, this would be an API call to the backend
      // But we can use the repository directly if we are in a context where it's okay, 
      // or we can use a dedicated admin API.
      // For now, let's assume we have a saveArticle API.
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

  // Calculate reading time
  const wordCount = formData.content?.split(/\s+/).filter(x => x).length || 0;
  const readingTime = Math.ceil(wordCount / 225);

  return (
    <div className="max-w-[1600px] mx-auto pb-32">
      {/* Top Bar */}
      <div className="flex items-center justify-between sticky top-0 z-50 bg-white/90 backdrop-blur-xl py-6 border-b border-gray-100 px-8 mb-12">
        <div className="flex items-center gap-8">
          <button 
            onClick={() => router.back()}
            className="h-10 w-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-all border border-gray-100"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="flex flex-col">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-black text-gray-900 tracking-tight">
                {formData.id ? 'Edit Journal Entry' : 'New Journal Entry'}
              </h1>
              <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest ${
                formData.status === 'published' ? 'bg-green-100 text-green-700' : 
                formData.status === 'scheduled' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
              }`}>
                {formData.status}
              </span>
            </div>
            <div className="flex items-center gap-4 mt-1 text-[10px] font-bold text-gray-400">
              <span className="flex items-center gap-1.5"><Clock className="h-3 w-3" /> {readingTime} min read</span>
              <span className="flex items-center gap-1.5"><Hash className="h-3 w-3" /> {wordCount} words</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
           <button 
             onClick={() => setPreviewMode(!previewMode)}
             className={`px-6 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center gap-3 ${
               previewMode ? 'bg-gray-900 text-white shadow-xl' : 'bg-white text-gray-900 border border-gray-200 hover:bg-gray-50'
             }`}
           >
             <Eye className="h-4 w-4" />
             {previewMode ? 'Edit Content' : 'Live Preview'}
           </button>
           <button 
             onClick={handleSave}
             disabled={isSubmitting}
             className="px-10 py-3.5 rounded-2xl bg-primary-600 text-white font-black text-xs uppercase tracking-widest hover:bg-primary-700 transition-all shadow-xl shadow-primary-600/20 flex items-center gap-3 disabled:opacity-50"
           >
             {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
             {formData.id ? 'Update Entry' : 'Publish Entry'}
           </button>
        </div>
      </div>

      <div className="px-8">
        {error && (
          <div className="mb-12 bg-red-50 border border-red-100 rounded-3xl p-6 flex items-center gap-6 text-red-600 animate-in slide-in-from-top-4">
             <div className="h-12 w-12 rounded-2xl bg-red-100 flex items-center justify-center shrink-0">
               <AlertCircle className="h-6 w-6" />
             </div>
             <p className="font-bold">{error}</p>
          </div>
        )}

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
            {/* Editor Core */}
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
                         <button className="text-[10px] font-black text-primary-600 uppercase tracking-widest hover:underline">Write</button>
                         <button className="text-[10px] font-black text-gray-300 uppercase tracking-widest hover:text-gray-400">Preview</button>
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

               {/* Excerpt Section */}
               <div className="bg-gray-50/50 rounded-[3rem] p-12 border border-gray-100/50 space-y-6">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                    <AlignLeft className="h-3 w-3" /> Post Summary
                  </label>
                  <textarea 
                    value={formData.excerpt}
                    onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                    placeholder="Provide a compelling summary for social media and search results..."
                    rows={4}
                    className="w-full p-8 rounded-3xl bg-white border border-gray-100 focus:border-primary-100 outline-none font-medium text-gray-600 transition-all resize-none shadow-sm"
                  />
               </div>
            </div>

            {/* Strategy Sidebar */}
            <div className="lg:col-span-4 space-y-8">
               {/* Tabbed Configuration */}
               <div className="bg-white rounded-[3rem] border border-gray-100 shadow-xl overflow-hidden sticky top-32">
                  <div className="flex border-b border-gray-50">
                    {[
                      { id: 'publish', icon: Sparkles, label: 'Publish' },
                      { id: 'seo', icon: Search, label: 'SEO' },
                      { id: 'social', icon: Share2, label: 'Social' }
                    ].map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex-1 py-6 flex flex-col items-center gap-2 transition-all ${
                          activeTab === tab.id ? 'bg-gray-900 text-white' : 'text-gray-400 hover:bg-gray-50'
                        }`}
                      >
                        <tab.icon className="h-4 w-4" />
                        <span className="text-[8px] font-black uppercase tracking-widest">{tab.label}</span>
                      </button>
                    ))}
                  </div>

                  <div className="p-10">
                    {activeTab === 'publish' && (
                      <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {/* Status */}
                        <div className="space-y-4">
                          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Post Status</label>
                          <div className="grid grid-cols-2 gap-2">
                            {['draft', 'published', 'scheduled'].map((s) => (
                              <button 
                                key={s}
                                type="button"
                                onClick={() => setFormData({ ...formData, status: s as any })}
                                className={`h-12 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all border ${
                                  formData.status === s 
                                    ? 'bg-primary-600 text-white border-primary-600' 
                                    : 'bg-white text-gray-400 border-gray-100 hover:bg-gray-50'
                                }`}
                              >
                                {s}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Scheduling */}
                        {formData.status === 'scheduled' && (
                          <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                              <Calendar className="h-3 w-3" /> Publication Date
                            </label>
                            <input 
                              type="datetime-local"
                              value={formData.scheduledAt ? new Date(formData.scheduledAt).toISOString().slice(0, 16) : ''}
                              onChange={(e) => setFormData({ ...formData, scheduledAt: new Date(e.target.value) })}
                              className="w-full h-14 px-6 rounded-2xl bg-gray-50 border border-transparent focus:bg-white focus:border-primary-100 outline-none font-bold text-xs"
                            />
                          </div>
                        )}

                        {/* Metadata */}
                        <div className="space-y-6 pt-6 border-t border-gray-50">
                          <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Category</label>
                            <select 
                              value={formData.categoryId}
                              onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                              className="w-full h-14 px-6 rounded-2xl bg-gray-50 font-bold text-xs outline-none"
                            >
                              <option value="">Uncategorized</option>
                              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                          </div>

                          <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Author</label>
                            <select 
                              value={formData.authorId}
                              onChange={(e) => setFormData({ ...formData, authorId: e.target.value })}
                              className="w-full h-14 px-6 rounded-2xl bg-gray-50 font-bold text-xs outline-none"
                            >
                              <option value="">Select Author</option>
                              {authors.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                            </select>
                          </div>

                          <div className="flex items-center justify-between p-5 rounded-2xl bg-gray-50 border border-gray-100">
                             <div className="flex items-center gap-3">
                               <Sparkles className={`h-4 w-4 ${formData.isFeatured ? 'text-primary-600' : 'text-gray-300'}`} />
                               <span className="text-[10px] font-black uppercase tracking-widest text-gray-700">Featured</span>
                             </div>
                             <button 
                               type="button"
                               onClick={() => setFormData({ ...formData, isFeatured: !formData.isFeatured })}
                               className={`h-6 w-11 rounded-full p-1 transition-all ${formData.isFeatured ? 'bg-primary-600' : 'bg-gray-200'}`}
                             >
                                <div className={`h-4 w-4 rounded-full bg-white transition-all ${formData.isFeatured ? 'translate-x-5' : 'translate-x-0'}`} />
                             </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTab === 'seo' && (
                      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="space-y-4">
                           <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Search Result Preview</label>
                           <div className="p-6 bg-white border border-gray-100 rounded-2xl shadow-sm space-y-1">
                              <p className="text-[10px] text-gray-500 truncate">dreambeesart.com › journal › {formData.slug || '...'}</p>
                              <h4 className="text-lg text-[#1a0dab] hover:underline font-medium cursor-pointer truncate">
                                {formData.metaTitle || formData.title || 'Post Title'}
                              </h4>
                              <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                                {formData.metaDescription || formData.excerpt || 'Enter a description to see how this post will appear in Google search results...'}
                              </p>
                           </div>
                        </div>

                        <div className="space-y-6 pt-6 border-t border-gray-50">
                           <div className="space-y-3">
                             <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">SEO Title</label>
                             <input 
                               type="text"
                               value={formData.metaTitle}
                               onChange={(e) => setFormData({ ...formData, metaTitle: e.target.value })}
                               placeholder={formData.title}
                               className="w-full h-12 px-5 rounded-xl bg-gray-50 text-xs font-bold outline-none border border-transparent focus:border-primary-100"
                             />
                           </div>

                           <div className="space-y-3">
                             <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">SEO Description</label>
                             <textarea 
                               value={formData.metaDescription}
                               onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
                               rows={3}
                               className="w-full p-5 rounded-xl bg-gray-50 text-xs font-medium outline-none border border-transparent focus:border-primary-100 resize-none"
                             />
                           </div>

                           <div className="space-y-3">
                             <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">URL Handle (Slug)</label>
                             <div className="relative">
                               <input 
                                 type="text"
                                 value={formData.slug}
                                 onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                 className="w-full h-12 px-5 rounded-xl bg-gray-50 text-xs font-bold outline-none border border-transparent focus:border-primary-100"
                               />
                               <Globe className="absolute right-4 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-300" />
                             </div>
                           </div>
                        </div>
                      </div>
                    )}

                    {activeTab === 'social' && (
                      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                         <div className="space-y-4">
                           <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Featured Image</label>
                           {formData.featuredImageUrl ? (
                             <div className="relative aspect-video rounded-2xl overflow-hidden group border border-gray-100">
                               <img src={formData.featuredImageUrl} alt="" className="w-full h-full object-cover" />
                               <button 
                                onClick={() => setFormData({ ...formData, featuredImageUrl: '' })}
                                className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center text-white font-black text-[9px] uppercase tracking-widest gap-2"
                               >
                                 <X className="h-3 w-3" /> Remove Image
                               </button>
                             </div>
                           ) : (
                             <div className="aspect-video rounded-2xl bg-gray-50 border-2 border-dashed border-gray-100 flex flex-col items-center justify-center gap-3 text-gray-300">
                               <ImageIcon className="h-8 w-8" />
                               <span className="text-[8px] font-black uppercase tracking-widest">No Media Selected</span>
                             </div>
                           )}
                           <div className="grid grid-cols-2 gap-3">
                             <input 
                               type="text"
                               value={formData.featuredImageUrl}
                               onChange={(e) => setFormData({ ...formData, featuredImageUrl: e.target.value })}
                               placeholder="Image URL..."
                               className="w-full h-12 px-5 rounded-xl bg-gray-50 text-[10px] font-bold outline-none border border-transparent focus:border-primary-100"
                             />
                             <input 
                               type="text"
                               value={formData.featuredImageAlt}
                               onChange={(e) => setFormData({ ...formData, featuredImageAlt: e.target.value })}
                               placeholder="Alt Text (SEO)..."
                               className="w-full h-12 px-5 rounded-xl bg-gray-50 text-[10px] font-bold outline-none border border-transparent focus:border-primary-100"
                             />
                           </div>

                           {/* Mock Media Library */}
                           <div className="space-y-4 pt-4">
                             <div className="flex items-center justify-between">
                               <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Recent Media</label>
                               <button type="button" className="text-[9px] font-black uppercase tracking-widest text-primary-600 hover:underline">Upload New</button>
                             </div>
                             <div className="grid grid-cols-4 gap-2">
                               {libraryImages.length > 0 ? libraryImages.map((url, i) => (
                                 <button 
                                   key={i}
                                   type="button"
                                   onClick={() => setFormData({ ...formData, featuredImageUrl: url })}
                                   className="aspect-square rounded-lg overflow-hidden border border-gray-100 hover:border-primary-600 transition-all"
                                 >
                                   <img src={url} alt="" className="w-full h-full object-cover" />
                                 </button>
                               )) : (
                                 <div className="col-span-full py-4 text-center text-[8px] text-gray-300 font-black uppercase tracking-widest">
                                   No items in library
                                 </div>
                               )}
                             </div>
                           </div>
                         </div>

                         <div className="space-y-6 pt-6 border-t border-gray-50">
                            <p className="text-[10px] font-medium text-gray-400 leading-relaxed">
                              Social platforms like Facebook and Twitter will use your SEO settings by default. Override them here if needed.
                            </p>
                            <div className="space-y-3">
                               <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">OG Title Override</label>
                               <input 
                                 type="text"
                                 value={formData.ogTitle}
                                 onChange={(e) => setFormData({ ...formData, ogTitle: e.target.value })}
                                 placeholder="Enter title for social cards..."
                                 className="w-full h-12 px-5 rounded-xl bg-gray-50 text-xs font-bold outline-none"
                               />
                            </div>

                            <div className="space-y-3">
                               <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">OG Description Override</label>
                               <textarea 
                                 value={formData.ogDescription}
                                 onChange={(e) => setFormData({ ...formData, ogDescription: e.target.value })}
                                 rows={3}
                                 placeholder="Enter description for social cards..."
                                 className="w-full p-5 rounded-xl bg-gray-50 text-xs font-medium outline-none resize-none"
                               />
                            </div>
                         </div>
                      </div>
                    )}
                  </div>
               </div>

               {/* Publishing Checklist */}
               <div className="bg-white rounded-[2.5rem] border border-gray-100 p-10 space-y-8 shadow-sm">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary-600" /> Pre-Flight Checklist
                  </h4>
                  <div className="space-y-4">
                    {[
                      { label: 'Compelling Title', met: !!formData.title },
                      { label: 'Minimum 300 words', met: wordCount >= 300 },
                      { label: 'Featured Image Set', met: !!formData.featuredImageUrl },
                      { label: 'SEO Description', met: !!formData.metaDescription || !!formData.excerpt },
                      { label: 'Category Assigned', met: !!formData.categoryId },
                      { label: 'Author Selected', met: !!formData.authorId }
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className={`h-5 w-5 rounded-full flex items-center justify-center border-2 transition-all ${
                          item.met ? 'bg-green-500 border-green-500 text-white' : 'border-gray-100 text-transparent'
                        }`}>
                          <CheckCircle2 className="h-3 w-3" />
                        </div>
                        <span className={`text-[10px] font-bold tracking-tight transition-all ${item.met ? 'text-gray-900' : 'text-gray-300'}`}>
                          {item.label}
                        </span>
                      </div>
                    ))}
                  </div>
               </div>

               {/* Help Section */}
               <div className="bg-primary-50 rounded-[2.5rem] p-10 space-y-4">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-primary-600">Blogging Strategy</h4>
                  <p className="text-xs font-medium text-primary-900 leading-relaxed">
                    Research shows that articles with at least <span className="font-bold underline">1,200 words</span> and a <span className="font-bold underline">compelling featured image</span> perform 40% better in search rankings.
                  </p>
                  <button className="text-[9px] font-black uppercase tracking-widest text-primary-600 flex items-center gap-2 hover:gap-3 transition-all">
                    View Strategy Guide <ChevronLeft className="h-3 w-3 rotate-180" />
                  </button>
               </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

