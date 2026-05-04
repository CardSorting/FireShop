'use client';
import React, { useState, useEffect } from 'react';
import { 
  Users, Mail, Calendar, MapPin, 
  Search, Download, Trash2, Filter,
  CheckCircle2, Loader2, UserPlus
} from 'lucide-react';
import type { Subscriber } from '@domain/models';

export default function SubscriberManagementPage() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function loadSubscribers() {
      try {
        const response = await fetch('/api/admin/blog/subscribers');
        const data = await response.json();
        setSubscribers(data);
      } catch (err) {
        console.error('Failed to load subscribers', err);
      } finally {
        setLoading(false);
      }
    }
    void loadSubscribers();
  }, []);

  const filteredSubscribers = subscribers.filter(s => 
    s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.source.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-8 space-y-10 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight flex items-center gap-4">
            <Users className="h-10 w-10 text-primary-600" />
            Collector's Circle
          </h1>
          <p className="text-gray-500 font-medium mt-2">Manage your email list and lead generation sources.</p>
        </div>
        <button className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-gray-900 text-white font-black text-xs uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-black/10">
          <Download className="h-4 w-4" />
          Export CSV
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         {[
           { label: 'Total Subscribers', value: subscribers.length, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
           { label: 'New This Week', value: subscribers.filter(s => new Date(s.subscribedAt).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000).length, icon: UserPlus, color: 'text-green-600', bg: 'bg-green-50' },
           { label: 'Top Source', value: 'Blog Footer', icon: MapPin, color: 'text-primary-600', bg: 'bg-primary-50' },
         ].map((stat, i) => (
           <div key={i} className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-6">
              <div className={`h-14 w-14 rounded-2xl ${stat.bg} flex items-center justify-center ${stat.color}`}>
                <stat.icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{stat.label}</p>
                <p className="text-2xl font-black text-gray-900">{stat.value}</p>
              </div>
           </div>
         ))}
      </div>

      {/* List */}
      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-50 flex flex-col md:flex-row gap-4">
           <div className="relative flex-1">
             <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
             <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search subscribers..."
              className="w-full h-14 pl-16 pr-8 rounded-2xl bg-gray-50 border-none outline-none font-bold text-gray-900"
             />
           </div>
           <button className="h-14 px-8 rounded-2xl bg-white border border-gray-100 text-gray-400 font-black text-[10px] uppercase tracking-widest flex items-center gap-2">
             <Filter className="h-4 w-4" /> Filter
           </button>
        </div>

        <table className="w-full text-left border-collapse">
           <thead>
             <tr className="border-b border-gray-50">
               <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Subscriber</th>
               <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Source</th>
               <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Joined Date</th>
               <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Actions</th>
             </tr>
           </thead>
           <tbody className="divide-y divide-gray-50">
             {loading ? (
               [...Array(5)].map((_, i) => (
                 <tr key={i} className="animate-pulse">
                   <td colSpan={4} className="px-8 py-8"><div className="h-10 bg-gray-50 rounded-xl" /></td>
                 </tr>
               ))
             ) : filteredSubscribers.map(sub => (
               <tr key={sub.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                       <div className="h-12 w-12 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center">
                         <Mail className="h-5 w-5" />
                       </div>
                       <div>
                         <p className="text-sm font-black text-gray-900">{sub.email}</p>
                         <p className="text-[10px] font-bold text-green-600 uppercase tracking-widest flex items-center gap-1.5 mt-1">
                           <CheckCircle2 className="h-3 w-3" /> Verified
                         </p>
                       </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className="px-4 py-2 rounded-xl bg-gray-50 text-[10px] font-black uppercase tracking-widest text-gray-400">
                      {sub.source}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-sm font-bold text-gray-600">
                    {new Date(sub.subscribedAt).toLocaleDateString()}
                  </td>
                  <td className="px-8 py-6 text-right">
                    <button className="h-10 w-10 rounded-xl bg-gray-50 text-gray-300 flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-all">
                       <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
               </tr>
             ))}
           </tbody>
        </table>

        {!loading && filteredSubscribers.length === 0 && (
           <div className="py-40 text-center space-y-6">
             <Users className="h-16 w-16 text-gray-100 mx-auto" />
             <h3 className="text-xl font-black text-gray-900">No subscribers yet</h3>
             <p className="text-gray-500 font-medium">When users join your newsletter, they will appear here.</p>
           </div>
        )}
      </div>
    </div>
  );
}
