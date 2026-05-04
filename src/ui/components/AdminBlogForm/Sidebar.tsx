import React from 'react';
import { 
  Sparkles, Search, Share2, Calendar, 
  CheckCircle2, ChevronLeft, Image as ImageIcon, X, Clock 
} from 'lucide-react';
import type { EditorState } from './types';
import { SocialPreview } from './SocialPreview';

export const Sidebar: React.FC<EditorState & { libraryImages: string[] }> = ({ 
  formData, setFormData, activeTab, setActiveTab, categories, authors, wordCount, libraryImages 
}) => {
  return (
    <div className="lg:col-span-4 space-y-8">
       {/* Tabbed Configuration */}
       <div className="bg-white rounded-[3rem] border border-gray-100 shadow-xl overflow-hidden sticky top-32">
          <div className="flex border-b border-gray-50">
            {[
              { id: 'publish', icon: Sparkles, label: 'Publish' },
              { id: 'seo', icon: Search, label: 'SEO' },
              { id: 'social', icon: Share2, label: 'Social' },
              { id: 'history', icon: Clock, label: 'History' }
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
                </div>
              </div>
            )}

            {activeTab === 'social' && (
              <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <SocialPreview formData={formData} />

                <div className="space-y-4 pt-6 border-t border-gray-50">
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

                   {/* Media Library */}
                   <div className="space-y-4 pt-4">
                     <div className="flex items-center justify-between">
                       <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Recent Media</label>
                       <button type="button" className="text-[9px] font-black uppercase tracking-widest text-primary-600 hover:underline">Upload New</button>
                     </div>
                     <div className="grid grid-cols-4 gap-2">
                       {libraryImages.map((url, i) => (
                         <button 
                           key={i}
                           type="button"
                           onClick={() => setFormData({ ...formData, featuredImageUrl: url })}
                           className="aspect-square rounded-lg overflow-hidden border border-gray-100 hover:border-primary-600 transition-all"
                         >
                           <img src={url} alt="" className="w-full h-full object-cover" />
                         </button>
                       ))}
                     </div>
                   </div>
                </div>
              </div>
            )}

            {activeTab === 'history' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="space-y-6">
                  {[
                    { action: 'Status changed to Published', user: 'Admin User', time: '2 hours ago', icon: CheckCircle2, color: 'text-green-500' },
                    { action: 'Article content updated', user: 'Editorial Team', time: '5 hours ago', icon: Sparkles, color: 'text-blue-500' },
                    { action: 'Featured image modified', user: 'Admin User', time: '1 day ago', icon: ImageIcon, color: 'text-amber-500' },
                    { action: 'Draft created', user: 'System', time: '2 days ago', icon: Calendar, color: 'text-gray-400' }
                  ].map((log, i) => (
                    <div key={i} className="flex gap-4">
                       <div className={`h-8 w-8 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0 ${log.color}`}>
                         <log.icon className="h-4 w-4" />
                       </div>
                       <div className="flex-1 border-b border-gray-50 pb-4">
                          <p className="text-[10px] font-black text-gray-900 uppercase tracking-tight">{log.action}</p>
                          <div className="flex items-center gap-2 mt-1">
                             <span className="text-[9px] text-gray-400 font-bold">{log.user}</span>
                             <span className="text-[9px] text-gray-300">•</span>
                             <span className="text-[9px] text-gray-400">{log.time}</span>
                          </div>
                       </div>
                    </div>
                  ))}
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
  );
};
