"use client";

/**
 * [LAYER: UI]
 * Locations — Inventory nodes and fulfillment centers
 */
'use client';

import { useState, useEffect } from 'react';
import { 
  MapPin, 
  Plus, 
  Search, 
  MoreHorizontal,
  Warehouse,
  Store,
  ChevronRight,
  ShieldCheck,
  Package
} from 'lucide-react';
import { 
  AdminPageHeader, 
  AdminEmptyState, 
  SkeletonPage,
  useToast,
  useAdminPageTitle,
  AdminMetricCard,
} from '../../components/admin/AdminComponents';
import type { InventoryLocation } from '@domain/models';
import { useServices } from '../../hooks/useServices';
import Link from 'next/link';

export function AdminLocations() {
  useAdminPageTitle('Locations');
  const { toast } = useToast();
  const services = useServices();
  const [locations, setLocations] = useState<InventoryLocation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLocations = async () => {
    try {
      const data = await services.locationService.getLocations();
      setLocations(data);
    } catch (error) {
      toast('error', 'Failed to load locations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  if (loading && locations.length === 0) return <SkeletonPage />;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <AdminPageHeader 
        title="Locations" 
        subtitle="Manage your stores, warehouses, and fulfillment centers."
        actions={
          <Link 
            href="/admin/locations/new"
            className="flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-primary-500/20 transition hover:bg-primary-700 active:scale-95"
          >
            <Plus className="h-4 w-4" /> Add location
          </Link>
        }
      />

      {/* Infrastructure Health */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AdminMetricCard 
          label="Total Nodes" 
          value={locations.length} 
          icon={MapPin} 
          description="Active inventory points"
        />
        <AdminMetricCard 
          label="Warehouses" 
          value={locations.filter(l => l.type === 'warehouse').length} 
          icon={Warehouse} 
          color="info"
        />
        <AdminMetricCard 
          label="Retail Stores" 
          value={locations.filter(l => l.type === 'retail').length} 
          icon={Store} 
          color="success"
        />
        <AdminMetricCard 
          label="Sync Status" 
          value="Healthy" 
          icon={ShieldCheck} 
          color="primary"
          description="Real-time propagation"
        />
      </div>

      <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
        <div className="border-b p-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input 
              placeholder="Filter by name or code..."
              className="w-full rounded-xl border bg-gray-50 py-2.5 pl-9 pr-3 text-sm outline-none transition focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        <div className="divide-y divide-gray-100">
          {locations.map(location => (
            <div key={location.id} className="group flex items-center justify-between p-4 transition hover:bg-gray-50">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 text-gray-400 group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors">
                  {location.type === 'warehouse' ? <Warehouse className="h-6 w-6" /> : <Store className="h-6 w-6" />}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900 group-hover:text-primary-600 transition-colors">{location.name}</h3>
                  <div className="mt-0.5 flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                    <span className="flex items-center gap-1"><Package className="h-3 w-3" /> {location.code || location.id.slice(0, 4).toUpperCase()}</span>
                    <span>{location.type}</span>
                    {location.isPickupLocation && <span className="text-emerald-600">● Pickup Enabled</span>}
                    {location.deliveryRadiusMiles && <span className="text-blue-600">● Delivery Zone ({location.deliveryRadiusMiles}mi)</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="rounded-lg border bg-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-600 hover:bg-gray-50 shadow-sm transition">Manage Stock</button>
                <button className="rounded-lg p-2 text-gray-400 hover:text-gray-900 transition"><MoreHorizontal className="h-5 w-5" /></button>
              </div>
            </div>
          ))}

          {locations.length === 0 && !loading && (
            <AdminEmptyState 
              title="No locations configured" 
              description="Register your first warehouse or retail store to start receiving inventory." 
              icon={MapPin} 
              action={
                <Link 
                  href="/admin/locations/new"
                  className="flex items-center gap-2 rounded-xl bg-primary-600 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-primary-500/20 transition hover:bg-primary-700 active:scale-95"
                >
                  <Plus className="h-4 w-4" /> Add your first location
                </Link>
              }
            />
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 p-8 text-center">
        <h3 className="text-sm font-bold text-gray-900">Need to move stock?</h3>
        <p className="mt-1 text-xs text-gray-500">Create an internal transfer to move inventory between your active locations.</p>
        <button className="mt-4 rounded-xl border bg-white px-6 py-2 text-xs font-bold text-gray-700 shadow-sm transition hover:bg-gray-50 active:scale-95">Start Transfer</button>
      </div>
    </div>
  );
}
