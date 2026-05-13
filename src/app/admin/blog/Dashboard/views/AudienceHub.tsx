'use client';
import React, { useState, useEffect } from 'react';
import { Mail, Calendar, Search, Filter, Download, UserPlus } from 'lucide-react';
import { useServices } from '@ui/hooks/useServices';
import type { Subscriber } from '@domain/models';

export function AudienceHub() {
  const services = useServices();
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const data = await services.knowledgebaseService.getSubscribers();
        setSubscribers(data);
      } catch (err) {
        console.error('Failed to load subscribers', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [services.knowledgebaseService]);

  const filtered = subscribers.filter(s => 
    s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.source?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="bg-white rounded-[2.5rem] border border-gray-100 p-20 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary-600 border-t-transparent"></div>
        <p className="text-gray-400 font-black uppercase tracking-widest text-[10px] mt-4">Syncing Audience Substrate...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="h-10 w-10 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center">
              <Mail className="h-5 w-5" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Total Subscribers</span>
          </div>
          <div className="text-4xl font-black text-gray-900">{subscribers.length}</div>
        </div>
        
        <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="h-10 w-10 rounded-2xl bg-green-50 text-green-600 flex items-center justify-center">
              <UserPlus className="h-5 w-5" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">New This Week</span>
          </div>
          <div className="text-4xl font-black text-gray-900">
            {subscribers.filter(s => s.subscribedAt && (Date.now() - s.subscribedAt.getTime() < 7 * 24 * 3600 * 1000)).length}
          </div>
        </div>

        <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="h-10 w-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Filter className="h-5 w-5" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Conversion Rate</span>
          </div>
          <div className="text-4xl font-black text-gray-900">4.2%</div>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-gray-100 flex items-center justify-between gap-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input 
              type="text"
              placeholder="Search subscribers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-2xl bg-gray-50 border-none outline-none text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-primary-500/20 transition-all"
            />
          </div>
          <button className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-gray-50 text-gray-900 font-black text-xs uppercase tracking-widest hover:bg-gray-100 transition-all">
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Email Address</th>
                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Source</th>
                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Joined Date</th>
                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-8 py-6">
                    <span className="text-sm font-bold text-gray-900">{s.email}</span>
                  </td>
                  <td className="px-8 py-6">
                    <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-[10px] font-black uppercase tracking-widest">
                      {s.source || 'Direct'}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2 text-gray-500 text-xs font-medium">
                      <Calendar className="h-3 w-3" />
                      {s.subscribedAt ? s.subscribedAt.toLocaleDateString() : 'Unknown'}
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <span className="px-3 py-1 rounded-full bg-green-50 text-green-600 text-[10px] font-black uppercase tracking-widest">
                      Active
                    </span>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-8 py-20 text-center">
                    <p className="text-gray-400 font-black uppercase tracking-widest text-[10px]">No matching collectors found.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
