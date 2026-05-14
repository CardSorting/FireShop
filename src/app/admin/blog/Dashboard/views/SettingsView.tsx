'use client';
import React, { useState, useEffect } from 'react';
import { User, Tag, Plus, Trash2, Edit2, Shield, Globe, Bell } from 'lucide-react';
import Image from 'next/image';
import { useServices } from '@ui/hooks/useServices';
import { sanitizeImageUrl } from '@utils/sanitizer';
import type { Author, KnowledgebaseCategory } from '@domain/models';

export function SettingsView() {
  const services = useServices();
  const [authors, setAuthors] = useState<Author[]>([]);
  const [categories, setCategories] = useState<KnowledgebaseCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [auths, cats] = await Promise.all([
          services.knowledgebaseService.getAuthors(),
          services.knowledgebaseService.getCategories()
        ]);
        setAuthors(auths);
        setCategories(cats);
      } catch (err) {
        console.error('Failed to load settings data', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [services.knowledgebaseService]);

  if (loading) return null;

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      {/* Global Configuration */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-8 space-y-8">
          <section className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center">
                  <User className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-black text-gray-900 tracking-tight">Author Collective</h3>
              </div>
              <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-600 text-white font-black text-[10px] uppercase tracking-widest hover:bg-primary-700 transition-all">
                <Plus className="h-3 w-3" /> Add Author
              </button>
            </div>
            <div className="divide-y divide-gray-100">
              {authors.map(author => (
                <div key={author.id} className="p-6 flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 overflow-hidden border border-gray-200 relative">
                      {author.avatarUrl ? (
                        <Image 
                          src={sanitizeImageUrl(author.avatarUrl)} 
                          alt="" 
                          fill 
                          className="object-cover" 
                          sizes="48px"
                        />
                      ) : (
                        <User className="h-6 w-6" />
                      )}
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-gray-900">{author.name}</h4>
                      <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">{author.role || 'Contributor'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="p-2 text-gray-400 hover:text-primary-600 transition-colors"><Edit2 className="h-4 w-4" /></button>
                    <button className="p-2 text-gray-400 hover:text-red-600 transition-colors"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Tag className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-black text-gray-900 tracking-tight">Categories & Taxonomy</h3>
              </div>
              <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white font-black text-[10px] uppercase tracking-widest hover:bg-indigo-700 transition-all">
                <Plus className="h-3 w-3" /> Add Category
              </button>
            </div>
            <div className="p-8 grid grid-cols-2 gap-4">
              {categories.map(category => (
                <div key={category.id} className="p-4 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-indigo-400" />
                    <span className="text-xs font-black uppercase text-gray-900 tracking-widest">{category.name}</span>
                  </div>
                  <button className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-600"><Trash2 className="h-3 w-3" /></button>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="lg:col-span-4 space-y-8">
           <div className="bg-white rounded-4xl border border-gray-100 p-8 space-y-8 shadow-sm">
             <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Engine Controls</h4>
             
             {[
               { icon: Globe, label: 'Public Substrate', desc: 'Enable guest comments', active: true },
               { icon: Shield, label: 'Mod Guard', desc: 'Auto-filter spam', active: true },
               { icon: Bell, label: 'Sync Alerts', desc: 'Notify on publication', active: false },
             ].map((control, i) => (
               <div key={i} className="flex items-start justify-between">
                 <div className="flex gap-4">
                   <div className="h-8 w-8 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400">
                     <control.icon className="h-4 w-4" />
                   </div>
                   <div>
                     <h5 className="text-xs font-black text-gray-900 uppercase tracking-widest">{control.label}</h5>
                     <p className="text-[10px] text-gray-400 font-medium">{control.desc}</p>
                   </div>
                 </div>
                 <div className={`h-5 w-10 rounded-full p-1 transition-colors ${control.active ? 'bg-primary-600' : 'bg-gray-200'}`}>
                   <div className={`h-3 w-3 rounded-full bg-white transition-transform ${control.active ? 'translate-x-5' : 'translate-x-0'}`} />
                 </div>
               </div>
             ))}
           </div>

           <div className="bg-primary-600 rounded-4xl p-8 text-white space-y-4 shadow-xl shadow-primary-600/20">
             <h4 className="text-[10px] font-black uppercase tracking-widest text-primary-200">System Integrity</h4>
             <p className="text-xs font-medium leading-relaxed">Ensure your editorial substrate is optimized for maximum collector reach.</p>
             <button className="w-full py-3 rounded-2xl bg-white text-primary-600 font-black text-[10px] uppercase tracking-widest hover:bg-primary-50 transition-all">
               Run SEO Audit
             </button>
           </div>
        </div>
      </div>
    </div>
  );
}
