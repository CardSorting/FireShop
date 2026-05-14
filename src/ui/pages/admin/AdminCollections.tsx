"use client";

/**
 * [LAYER: UI]
 * Collections — Catalog organization and merchandising
 */
'use client';

import { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  MoreHorizontal,
  LayoutGrid,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { 
  AdminPageHeader, 
  AdminEmptyState, 
  SkeletonPage,
  useToast,
  useAdminPageTitle,
  AdminStatusBadge
} from '../../components/admin/AdminComponents';
import type { Collection } from '@domain/models';
import { useServices } from '../../hooks/useServices';
import Link from 'next/link';
import Image from 'next/image';
import { sanitizeImageUrl } from '@utils/sanitizer';

export function AdminCollections() {
  useAdminPageTitle('Collections');
  const { toast } = useToast();
  const services = useServices();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'draft'>('all');

  const fetchCollections = async () => {
    try {
      const data = await services.collectionService.list();
      setCollections(data);
    } catch (error) {
      toast('error', 'Failed to load collections');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCollections();
  }, []);

  const filteredCollections = collections.filter(c => 
    statusFilter === 'all' ? true : c.status === statusFilter
  );

  if (loading && collections.length === 0) return <SkeletonPage />;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <AdminPageHeader 
        title="Collections" 
        subtitle="Group products into sets, series, or promotional categories."
        actions={
          <Link 
            href="/admin/collections/new"
            className="flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-primary-500/20 transition hover:bg-primary-700 active:scale-95"
          >
            <Plus className="h-4 w-4" /> Create collection
          </Link>
        }
      />

      {/* Stats/Quick Links */}
      <div className="grid gap-4 sm:grid-cols-3">
        <button 
          onClick={() => setStatusFilter('all')}
          className={`rounded-2xl border p-4 text-left transition ${statusFilter === 'all' ? 'border-primary-500 bg-primary-50/50 ring-1 ring-primary-500' : 'bg-white hover:border-gray-300'}`}
        >
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Total Collections</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{collections.length}</p>
        </button>
        <button 
          onClick={() => setStatusFilter('active')}
          className={`rounded-2xl border p-4 text-left transition ${statusFilter === 'active' ? 'border-green-500 bg-green-50/50 ring-1 ring-green-500' : 'bg-white hover:border-gray-300'}`}
        >
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Active</p>
          <p className="mt-1 text-2xl font-bold text-green-600">{collections.filter(c => c.status === 'active').length}</p>
        </button>
        <button 
          onClick={() => setStatusFilter('draft')}
          className={`rounded-2xl border p-4 text-left transition ${statusFilter === 'draft' ? 'border-amber-500 bg-amber-50/50 ring-1 ring-amber-500' : 'bg-white hover:border-gray-300'}`}
        >
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Drafts</p>
          <p className="mt-1 text-2xl font-bold text-amber-600">{collections.filter(c => c.status === 'draft').length}</p>
        </button>
      </div>

      <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between border-b p-4">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input 
              placeholder="Filter collections..."
              className="w-full rounded-xl border bg-gray-50 py-2.5 pl-9 pr-3 text-sm outline-none transition focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 rounded-xl border bg-white px-3 py-2 text-xs font-bold text-gray-600 hover:bg-gray-50 transition">
              <Filter className="h-4 w-4" /> Filter
            </button>
          </div>
        </div>

        <div className="divide-y divide-gray-100">
          {filteredCollections.map(collection => (
            <div key={collection.id} className="group flex items-center justify-between p-4 transition hover:bg-gray-50">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 overflow-hidden rounded-xl border bg-gray-50 relative">
                  {collection.imageUrl ? (
                    <Image 
                      src={sanitizeImageUrl(collection.imageUrl)} 
                      alt="" 
                      fill 
                      className="object-cover" 
                      sizes="56px"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-gray-300">
                      <LayoutGrid className="h-6 w-6" />
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900 group-hover:text-primary-600 transition-colors">{collection.name}</h3>
                  <div className="mt-1 flex items-center gap-3">
                    <span className="text-[10px] font-mono font-medium text-gray-400">/{collection.handle}</span>
                    <AdminStatusBadge status={collection.status} type="generic" />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="rounded-lg border bg-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-600 hover:bg-gray-50 shadow-sm transition">Manage Items</button>
                <button className="rounded-lg p-2 text-gray-400 hover:text-gray-900 transition"><MoreHorizontal className="h-5 w-5" /></button>
              </div>
            </div>
          ))}

          {filteredCollections.length === 0 && !loading && (
            <AdminEmptyState 
              title="No collections found" 
              description="Create sets or series to help customers find products more easily." 
              icon={LayoutGrid} 
              action={
                <Link 
                  href="/admin/collections/new"
                  className="flex items-center gap-2 rounded-xl bg-primary-600 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-primary-500/20 transition hover:bg-primary-700 active:scale-95"
                >
                  <Plus className="h-4 w-4" /> Create your first collection
                </Link>
              }
            />
          )}
        </div>
      </div>
    </div>
  );
}
