"use client";

/**
 * [LAYER: UI]
 * Suppliers — focused wholesaler and distributor management workspace
 */
'use client';

import { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Mail, 
  Phone, 
  MapPin, 
  ChevronRight,
  MoreHorizontal,
  Building2,
  Truck,
} from 'lucide-react';
import { 
  AdminPageHeader, 
  AdminEmptyState, 
  SkeletonPage,
  useToast,
  useAdminPageTitle,
  AdminMetricCard,
} from '../../components/admin/AdminComponents';
import { CheckCircle2, Clock } from 'lucide-react';
import type { Supplier } from '@domain/models';
import { useServices } from '../../hooks/useServices';
import Link from 'next/link';

export function AdminSuppliers() {
  useAdminPageTitle('Partners');
  const { toast } = useToast();
  const services = useServices();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [poOverview, setPoOverview] = useState<any>(null);

  const fetchSuppliers = async () => {
    try {
      const data = await services.supplierService.list({ query: query || undefined });
      setSuppliers(data);
    } catch (error) {
      toast('error', 'Failed to load suppliers');
    } finally {
      setLoading(false);
    }
  };

  const fetchPoOverview = async () => {
    try {
      const data = await services.purchaseOrderService.getOverview();
      setPoOverview(data);
    } catch (error) {
      console.error('Failed to load PO overview', error);
    }
  };

  useEffect(() => {
    fetchSuppliers();
    fetchPoOverview();
  }, [query]);

  if (loading && suppliers.length === 0) return <SkeletonPage />;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <AdminPageHeader 
        title="Partners & Suppliers" 
        subtitle="Manage your wholesalers, distributors, and manufacturing partners in one place."
        actions={
          <div className="flex items-center gap-2">
             <button className="hidden rounded-lg border bg-white px-4 py-2 text-xs font-bold text-gray-700 shadow-sm transition hover:bg-gray-50 sm:inline-flex active:scale-95">
                Export
             </button>
             <Link 
              href="/admin/suppliers/new"
              className="flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-primary-500/20 transition hover:bg-primary-700 active:scale-95"
            >
              <Plus className="h-4 w-4" /> Add partner
            </Link>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AdminMetricCard label="Total Partners" value={suppliers.length} icon={Building2} color="info" />
        <AdminMetricCard label="Active Orders" value={poOverview?.needsReceivingCount || '0'} icon={Truck} color="primary" />
        <AdminMetricCard label="Avg. Lead Time" value="8.4d" icon={Clock} color="warning" />
        <AdminMetricCard label="Reliability" value="98.2%" icon={CheckCircle2} color="success" />
      </div>

      <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
        <div className="border-b p-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, contact, or email..."
              className="w-full rounded-xl border bg-gray-50 py-2.5 pl-9 pr-3 text-sm outline-none transition focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-[10px] font-bold uppercase tracking-widest text-gray-500 border-b">
              <tr>
                <th className="px-6 py-3 text-left">Partner</th>
                <th className="px-6 py-3 text-left">Contact Info</th>
                <th className="px-6 py-3 text-left">Activity</th>
                <th className="px-6 py-3 text-left">Terms</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {suppliers.map(supplier => (
                <SupplierRow key={supplier.id} supplier={supplier} />
              ))}
            </tbody>
          </table>
        </div>

        {!loading && suppliers.length === 0 && (
          <div className="py-20">
            <AdminEmptyState 
              title={query ? "No partners found" : "Onboard your first partner"} 
              description={query ? "We couldn't find any partners matching your search query. Try a different name or email." : "Manage your manufacturing partners, wholesale distributors, and suppliers in one centralized workspace."} 
              icon={Building2} 
              action={
                <Link 
                  href="/admin/suppliers/new"
                  className="flex items-center gap-2 rounded-xl bg-primary-600 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-primary-500/20 transition hover:bg-primary-700 active:scale-95"
                >
                  <Plus className="h-4 w-4" /> {query ? "Add this partner" : "Add your first partner"}
                </Link>
              }
              secondaryAction={query ? (
                <button onClick={() => setQuery('')} className="rounded-xl border bg-white px-6 py-2.5 text-xs font-bold text-gray-700 shadow-sm transition hover:bg-gray-50 active:scale-95">
                  Clear search
                </button>
              ) : undefined}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function SupplierRow({ supplier }: { supplier: Supplier }) {
  const services = useServices();
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const data = await services.purchaseOrderService.getSupplierMetrics(supplier.name);
        setMetrics(data);
      } catch (e) {
        console.error('Failed to load metrics for supplier', supplier.name, e);
      } finally {
        setLoading(false);
      }
    };
    fetchMetrics();
  }, [supplier.name, services.purchaseOrderService]);

  return (
    <tr className="group hover:bg-gray-50/80 transition-colors">
      <td className="px-6 py-4">
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-400 group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 group-hover:text-primary-600 transition-colors">{supplier.name}</h3>
            <p className="text-[10px] font-medium text-gray-400 uppercase tracking-widest">{supplier.id.slice(0, 8)}</p>
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <Mail className="h-3.5 w-3.5 text-gray-400" />
            {supplier.email || '—'}
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <Phone className="h-3.5 w-3.5 text-gray-400" />
            {supplier.phone || '—'}
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        {loading ? (
          <div className="h-4 w-20 animate-pulse rounded bg-gray-100" />
        ) : (
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold text-gray-900">
              {metrics?.activeOrders || 0} active orders
            </div>
            <div className="text-[10px] font-medium text-gray-400 uppercase tracking-widest">
              {metrics?.totalOrders || 0} total shipments
            </div>
          </div>
        )}
      </td>
      <td className="px-6 py-4">
        <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-gray-600">
          Net 30
        </span>
      </td>
      <td className="px-6 py-4 text-right">
        <div className="flex items-center justify-end gap-2">
          <Link href={`/admin/suppliers/${supplier.id}`} className="rounded-lg border bg-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-600 hover:bg-gray-50 shadow-sm transition">
            Manage
          </Link>
          <button className="rounded-lg p-2 text-gray-400 hover:text-gray-900 transition">
            <MoreHorizontal className="h-5 w-5" />
          </button>
        </div>
      </td>
    </tr>
  );
}
