'use client';
import React, { useState, useEffect } from 'react';
import { 
  User, UserPlus, Mail, Globe, 
  Trash2, Edit2, Loader2, Search,
  Twitter, Instagram, Github
} from 'lucide-react';
import Image from 'next/image';
import { sanitizeImageUrl } from '@utils/sanitizer';
import type { Author } from '@domain/models';

export default function AuthorManagementPage() {
  const [authors, setAuthors] = useState<Author[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function loadAuthors() {
      try {
        const response = await fetch('/api/blog/authors');
        const data = await response.json();
        setAuthors(data);
      } catch (err) {
        console.error('Failed to load authors', err);
      } finally {
        setLoading(false);
      }
    }
    void loadAuthors();
  }, []);

  const filteredAuthors = authors.filter(a => 
    a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-8 space-y-10 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight flex items-center gap-4">
            <User className="h-10 w-10 text-primary-600" />
            Editorial Team
          </h1>
          <p className="text-gray-500 font-medium mt-2">Manage the voices behind the DreamBees Art Journal.</p>
        </div>
        <button className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-primary-600 text-white font-black text-xs uppercase tracking-widest hover:bg-primary-700 transition-all shadow-xl shadow-primary-600/20">
          <UserPlus className="h-4 w-4" />
          Add Author
        </button>
      </div>

      {/* List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {loading ? (
          [...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-4xl p-10 border border-gray-100 shadow-sm animate-pulse h-64" />
          ))
        ) : filteredAuthors.map(author => (
          <div key={author.id} className="bg-white rounded-4xl p-10 border border-gray-100 shadow-sm hover:shadow-2xl transition-all group relative overflow-hidden">
             <div className="absolute top-0 right-0 p-8 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="h-10 w-10 rounded-xl bg-gray-50 text-gray-400 hover:bg-primary-50 hover:text-primary-600 flex items-center justify-center">
                  <Edit2 className="h-4 w-4" />
                </button>
                <button className="h-10 w-10 rounded-xl bg-gray-50 text-gray-400 hover:bg-red-50 hover:text-red-500 flex items-center justify-center">
                  <Trash2 className="h-4 w-4" />
                </button>
             </div>
             
             <div className="space-y-6">
                <div className="h-20 w-20 rounded-4xl bg-gray-100 overflow-hidden shadow-xl relative">
                   {author.avatarUrl ? (
                     <Image 
                       src={sanitizeImageUrl(author.avatarUrl)} 
                       alt="" 
                       fill 
                       className="object-cover" 
                       sizes="80px"
                     />
                   ) : (
                     <div className="w-full h-full flex items-center justify-center text-gray-300">
                       <User className="h-10 w-10" />
                     </div>
                   )}
                </div>

                
                <div>
                  <h3 className="text-xl font-black text-gray-900">{author.name}</h3>
                  <p className="text-xs font-black uppercase tracking-widest text-primary-600 mt-1">{author.role}</p>
                </div>
                
                <p className="text-sm font-medium text-gray-500 leading-relaxed line-clamp-3">
                  {author.bio || 'No bio provided for this author.'}
                </p>
                
                <div className="flex items-center gap-4 pt-4 border-t border-gray-50">
                   {author.socialLinks?.twitter && <Twitter className="h-4 w-4 text-gray-300 hover:text-blue-400 cursor-pointer transition-colors" />}
                   {author.socialLinks?.instagram && <Instagram className="h-4 w-4 text-gray-300 hover:text-pink-400 cursor-pointer transition-colors" />}
                   {author.socialLinks?.website && <Globe className="h-4 w-4 text-gray-300 hover:text-primary-600 cursor-pointer transition-colors" />}
                </div>
             </div>
          </div>
        ))}
      </div>
      
      {!loading && filteredAuthors.length === 0 && (
        <div className="py-40 text-center space-y-6 bg-gray-50 rounded-[4rem] border border-dashed border-gray-200">
           <User className="h-16 w-16 text-gray-200 mx-auto" />
           <h3 className="text-xl font-black text-gray-900">No authors found</h3>
           <p className="text-gray-500 font-medium">Add your team members to start attributing posts.</p>
        </div>
      )}
    </div>
  );
}
