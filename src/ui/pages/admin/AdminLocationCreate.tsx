"use client";

/**
 * [LAYER: UI]
 * Dedicated workspace for configuring inventory nodes.
 * Supports multi-location logistics setup with industrial focus.
 */
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  MapPin, 
  Save, 
  ShieldCheck, 
  Store, 
  Warehouse,
  Truck
} from 'lucide-react';
import { 
  useToast, 
  useAdminPageTitle,
} from '../../components/admin/AdminComponents';
import { useServices } from '../../hooks/useServices';

export function AdminLocationCreate() {
  useAdminPageTitle('Add Location');
  const router = useRouter();
  const { toast } = useToast();
  const services = useServices();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [locationType, setLocationType] = useState<'warehouse' | 'retail'>('warehouse');
  const [lat, setLat] = useState<string>('');
  const [lng, setLng] = useState<string>('');
  const [isGeocoding, setIsGeocoding] = useState(false);

  const handleGeocode = async () => {
    const address = (document.getElementsByName('address')[0] as HTMLTextAreaElement)?.value;
    if (!address) {
      toast('error', 'Please enter an address first');
      return;
    }
    setIsGeocoding(true);
    try {
      const coords = await services.locationService.geocodeAddress(address);
      if (coords) {
        setLat(coords.lat.toString());
        setLng(coords.lng.toString());
        toast('success', 'Address resolved to coordinates');
      }
    } catch (err) {
      toast('error', 'Geocoding failed');
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const rawData = Object.fromEntries(formData.entries());

    const lat = parseFloat(rawData.lat as string);
    const lng = parseFloat(rawData.lng as string);

    const data = {
      ...rawData,
      isPickupLocation: rawData.isPickupLocation === 'on',
      deliveryRadiusMiles: rawData.deliveryRadiusMiles ? parseInt(rawData.deliveryRadiusMiles as string) : undefined,
      deliveryFee: rawData.deliveryFee ? parseInt(rawData.deliveryFee as string) : undefined,
      coordinates: (!isNaN(lat) && !isNaN(lng)) ? { lat, lng } : undefined
    };

    try {
      await services.locationService.createLocation(data);
      toast('success', 'Location added to network');
      router.push('/admin/locations');
      router.refresh();
    } catch (error) {
      toast('error', error instanceof Error ? error.message : 'Failed to add location');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-4xl space-y-8 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            type="button"
            onClick={() => router.back()}
            className="flex h-10 w-10 items-center justify-center rounded-xl border bg-white text-gray-400 shadow-sm transition hover:bg-gray-50 hover:text-gray-600 active:scale-95"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-primary-600">Logistics Network</p>
            <h1 className="text-2xl font-bold text-gray-900">Add Location</h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            type="button" 
            onClick={() => router.back()}
            className="rounded-xl px-4 py-2 text-xs font-bold text-gray-500 hover:bg-gray-100 transition"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="flex items-center gap-2 rounded-xl bg-primary-600 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-primary-500/20 transition hover:bg-primary-700 active:scale-95 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {isSubmitting ? 'Saving...' : 'Save Location'}
          </button>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Card: Type Selection */}
          <div className="grid gap-4 sm:grid-cols-2">
            <button 
              type="button"
              onClick={() => setLocationType('warehouse')}
              className={`flex items-start gap-4 rounded-2xl border p-6 text-left transition ${locationType === 'warehouse' ? 'border-primary-500 bg-primary-50/50 ring-1 ring-primary-500' : 'bg-white hover:border-gray-300'}`}
            >
              <div className={`rounded-xl p-3 ${locationType === 'warehouse' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
                <Warehouse className="h-6 w-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-900">Warehouse</h4>
                <p className="mt-1 text-xs text-gray-500">Distribution center, getStorage(), or primary hub.</p>
              </div>
            </button>
            <button 
              type="button"
              onClick={() => setLocationType('retail')}
              className={`flex items-start gap-4 rounded-2xl border p-6 text-left transition ${locationType === 'retail' ? 'border-primary-500 bg-primary-50/50 ring-1 ring-primary-500' : 'bg-white hover:border-gray-300'}`}
            >
              <div className={`rounded-xl p-3 ${locationType === 'retail' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
                <Store className="h-6 w-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-900">Retail Store</h4>
                <p className="mt-1 text-xs text-gray-500">Physical storefront or showroom.</p>
              </div>
            </button>
            <input type="hidden" name="type" value={locationType} />
          </div>

          {/* Card: General Info */}
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                <MapPin className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-gray-900">Location Profile</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Location Name</label>
                <input 
                  name="name" 
                  required 
                  className="mt-1.5 w-full rounded-xl border bg-gray-50 px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-primary-500 focus:bg-white" 
                  placeholder="e.g. Downtown Warehouse A" 
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Code / SKU Prefix</label>
                  <input 
                    name="code" 
                    className="mt-1.5 w-full rounded-xl border bg-gray-50 px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-primary-500 focus:bg-white" 
                    placeholder="e.g. WH-A" 
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Timezone</label>
                  <select className="mt-1.5 w-full rounded-xl border bg-gray-50 px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-primary-500 focus:bg-white">
                    <option value="EST">EST - Eastern Standard</option>
                    <option value="CST">CST - Central Standard</option>
                    <option value="PST">PST - Pacific Standard</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Card: Address */}
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Truck className="h-5 w-5" />
              </div>
              <div className="flex flex-1 items-center justify-between">
                <h3 className="text-sm font-bold text-gray-900">Fulfillment Address</h3>
                <button 
                  type="button"
                  onClick={handleGeocode}
                  disabled={isGeocoding}
                  className="text-[10px] font-black uppercase tracking-widest text-primary-600 hover:text-primary-700 disabled:opacity-50"
                >
                  {isGeocoding ? 'Resolving...' : 'Geocode Address'}
                </button>
              </div>
            </div>
            <textarea 
              name="address" 
              rows={3} 
              className="mt-1.5 w-full rounded-xl border bg-gray-50 px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-primary-500 focus:bg-white" 
              placeholder="Full mailing address for shipment routing..." 
            />
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">Operations</h3>
            <div className="space-y-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" name="isPickupLocation" className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                <span className="text-xs font-medium text-gray-700">Available for Local Pickup</span>
              </label>
              <div className="pl-7">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Pickup Instructions</label>
                <textarea 
                  name="pickupInstructions" 
                  rows={2} 
                  className="mt-1 w-full rounded-lg border bg-gray-50 px-3 py-2 text-[10px] outline-none transition focus:ring-2 focus:ring-primary-500 focus:bg-white" 
                  placeholder="e.g. Ring the bell at the side entrance..." 
                />
              </div>
              
              <div className="h-px bg-gray-100 my-2" />

              <div className="space-y-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-900">Local Delivery Strategy</p>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Radius (Miles)</label>
                  <input 
                    type="number" 
                    name="deliveryRadiusMiles" 
                    className="mt-1 w-full rounded-lg border bg-gray-50 px-3 py-2 text-xs outline-none transition focus:ring-2 focus:ring-primary-500 focus:bg-white" 
                    placeholder="e.g. 25" 
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Delivery Fee (Cents)</label>
                  <input 
                    type="number" 
                    name="deliveryFee" 
                    className="mt-1 w-full rounded-lg border bg-gray-50 px-3 py-2 text-xs outline-none transition focus:ring-2 focus:ring-primary-500 focus:bg-white" 
                    placeholder="e.g. 500 for $5.00" 
                  />
                </div>
              </div>

              <div className="h-px bg-gray-100 my-2" />

              <div className="space-y-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-900">Geospatial Coordinates</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Latitude</label>
                    <input 
                      type="number" 
                      step="any"
                      name="lat" 
                      value={lat}
                      onChange={(e) => setLat(e.target.value)}
                      className="mt-1 w-full rounded-lg border bg-gray-50 px-3 py-2 text-xs outline-none transition focus:ring-2 focus:ring-primary-500 focus:bg-white" 
                      placeholder="e.g. 34.0522" 
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Longitude</label>
                    <input 
                      type="number" 
                      step="any"
                      name="lng" 
                      value={lng}
                      onChange={(e) => setLng(e.target.value)}
                      className="mt-1 w-full rounded-lg border bg-gray-50 px-3 py-2 text-xs outline-none transition focus:ring-2 focus:ring-primary-500 focus:bg-white" 
                      placeholder="e.g. -118.2437" 
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border bg-linear-to-br from-emerald-600 to-teal-800 p-6 text-white shadow-xl">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
              <ShieldCheck className="h-5 w-5 text-emerald-200" />
            </div>
            <h3 className="text-sm font-bold">Node Security</h3>
            <p className="mt-2 text-[10px] leading-relaxed text-emerald-100">
              New locations are automatically enrolled in the global inventory synchronization layer. 
              Stock transfers between nodes are cryptographically signed.
            </p>
          </div>
        </div>
      </div>
    </form>
  );
}
