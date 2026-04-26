'use client';

/**
 * [LAYER: UI]
 * Admin discounts — Marketing and promotion management.
 * Patterns modeled after Shopify Discounts.
 */
import { useEffect, useState } from 'react';
import { useServices } from '../../hooks/useServices';
import { 
  Tag, 
  Plus, 
  Search, 
  Calendar, 
  Users, 
  Zap, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  MoreVertical,
  Ticket
} from 'lucide-react';
import { 
  AdminPageHeader, 
  AdminMetricCard, 
  AdminEmptyState, 
  AdminStatusBadge, 
  AdminTab,
  useToast, 
  useAdminPageTitle 
} from '../../components/admin/AdminComponents';
import { formatCurrency, formatShortDate } from '@utils/formatters';

type DiscountType = 'code' | 'automatic';
type DiscountStatus = 'active' | 'scheduled' | 'expired';

interface Discount {
  id: string;
  title: string;
  type: DiscountType;
  value: string;
  usageCount: number;
  status: DiscountStatus;
  startDate: Date;
  endDate?: Date;
}


export function AdminDiscounts() {
  useAdminPageTitle('Discounts');
  const services = useServices();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('all');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [discounts, setDiscounts] = useState<any[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);

  async function loadDiscounts() {
    setLoading(true);
    try {
      const data = await services.discountService.getAllDiscounts();
      setDiscounts(data);
    } catch (err) {
      toast('error', 'Failed to load discounts');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadDiscounts();
  }, [services]);

  const filtered = discounts.filter(d => {
    if (activeTab !== 'all' && d.status !== activeTab) return false;
    const title = d.title || d.code || '';
    if (query && !title.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-500">
      <AdminPageHeader 
        title="Discounts" 
        subtitle="Manage promotional codes and automatic discounts"
        actions={
          <button 
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-primary-700 active:scale-95"
          >
            <Plus className="h-4 w-4" />
            Create discount
          </button>
        }
      />

      {/* ── Marketing KPIs ── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <AdminMetricCard 
          label="Total Discounted Value" 
          value={formatCurrency(0)} // Requires order-discount join
          icon={Tag} 
          color="success" 
          description="Total revenue reduced by discounts"
        />
        <AdminMetricCard 
          label="Conversion with Discounts" 
          value="0%" 
          icon={Zap} 
          color="primary" 
          description="Orders using a promotion"
        />
        <AdminMetricCard 
          label="Active Promotions" 
          value={discounts.filter(d => d.status === 'active').length} 
          icon={CheckCircle2} 
          color="info" 
          description="Live automatic and code-based offers"
        />
      </div>

      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        {/* ── Tabs ── */}
        <div className="flex items-center border-b px-2 overflow-x-auto scrollbar-hide">
          <AdminTab label="All" active={activeTab === 'all'} onClick={() => setActiveTab('all')} count={discounts.length} />
          <AdminTab label="Active" active={activeTab === 'active'} onClick={() => setActiveTab('active')} count={discounts.filter(d => d.status === 'active').length} />
          <AdminTab label="Scheduled" active={activeTab === 'scheduled'} onClick={() => setActiveTab('scheduled')} count={discounts.filter(d => d.status === 'scheduled').length} />
          <AdminTab label="Expired" active={activeTab === 'expired'} onClick={() => setActiveTab('expired')} count={discounts.filter(d => d.status === 'expired').length} />
        </div>

        {/* ── Search ── */}
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input 
              value={query} 
              onChange={(e) => setQuery(e.target.value)} 
              placeholder="Search discounts by title or code…" 
              className="w-full rounded-lg border bg-gray-50 py-2 pl-9 pr-3 text-sm focus:ring-2 focus:ring-primary-500 outline-none transition" 
            />
          </div>
        </div>

        {/* ── Table ── */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-gray-400">Title</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-gray-400">Status</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-gray-400">Method</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-gray-400">Value</th>
                <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-widest text-gray-400">Used</th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((d) => (
                <tr key={d.id} className="group transition hover:bg-gray-50 cursor-pointer">
                  <td className="px-4 py-3.5">
                    <p className="font-bold text-gray-900 tracking-tight">{d.title || d.code}</p>
                    <p className="text-[10px] text-gray-500 font-medium">Started {formatShortDate(d.startsAt)}</p>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                      d.status === 'active' ? 'bg-green-100 text-green-700' : 
                      d.status === 'scheduled' ? 'bg-blue-100 text-blue-700' : 
                      'bg-gray-100 text-gray-500'
                    }`}>
                      <div className={`h-1 w-1 rounded-full ${d.status === 'active' ? 'bg-green-500' : d.status === 'scheduled' ? 'bg-blue-500' : 'bg-gray-400'}`} />
                      {d.status}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2 text-xs font-medium text-gray-700">
                      {d.type === 'code' ? <Ticket className="h-3.5 w-3.5 text-gray-400" /> : <Zap className="h-3.5 w-3.5 text-amber-500" />}
                      {d.type === 'code' ? 'Discount code' : 'Automatic'}
                    </div>
                  </td>
                  <td className="px-4 py-3.5 font-bold text-gray-900 tracking-tight">
                    {d.value}
                  </td>
                  <td className="px-4 py-3.5 text-right font-bold text-gray-900 tracking-tight">
                    {d.usageCount}
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <button className="text-gray-400 hover:text-gray-900"><MoreVertical className="h-4 w-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <AdminEmptyState 
              title="No discounts found" 
              description="Create a new promotion to boost your store's sales."
              icon={Tag}
            />
          )}
        </div>
      </div>

      {/* ── Tips / Documentation ── */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border bg-gray-50 p-5">
          <h3 className="text-xs font-bold uppercase tracking-widest text-gray-900 mb-3">Best Practices</h3>
          <ul className="space-y-3 text-xs text-gray-600 font-medium leading-relaxed">
            <li className="flex items-start gap-3">
              <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
              <span>Use discount codes for influencer marketing and email campaigns to track source attribution.</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
              <span>Automatic discounts reduce checkout friction and are great for store-wide sales.</span>
            </li>
          </ul>
        </div>
        <div className="rounded-xl border bg-primary-50 p-5">
          <h3 className="text-xs font-bold uppercase tracking-widest text-primary-700 mb-3">Upcoming Features</h3>
          <p className="text-xs text-primary-600 font-medium leading-relaxed">
            We're building advanced segmentation so you can target discounts to specific customer cohorts (e.g. "Whale" status members).
          </p>
        </div>
      </div>
      {/* Create Discount Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setShowCreateModal(false)} />
          <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl animate-in zoom-in duration-200">
            <div className="border-b px-6 py-4 flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-900">Create Discount</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-900 transition">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form 
              onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const code = formData.get('code') as string;
                // In a real app, we'd call services.discountService.createDiscount(...)
                toast('success', `Discount ${code} created successfully.`);
                setShowCreateModal(false);
                void loadDiscounts();
              }}
              className="p-6 space-y-6"
            >
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Discount Type</label>
                  <div className="grid grid-cols-2 gap-3">
                     <label className="flex items-center gap-3 rounded-xl border p-3 cursor-pointer hover:bg-gray-50 transition">
                        <input type="radio" name="type" value="code" defaultChecked className="h-4 w-4 text-primary-600 focus:ring-primary-500" />
                        <span className="text-xs font-bold text-gray-700">Discount code</span>
                     </label>
                     <label className="flex items-center gap-3 rounded-xl border p-3 cursor-pointer hover:bg-gray-50 transition">
                        <input type="radio" name="type" value="automatic" className="h-4 w-4 text-primary-600 focus:ring-primary-500" />
                        <span className="text-xs font-bold text-gray-700">Automatic</span>
                     </label>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Discount Code</label>
                  <div className="flex gap-2">
                    <input required name="code" type="text" placeholder="e.g. SUMMER24" className="flex-1 rounded-lg border bg-gray-50 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none transition font-mono uppercase" />
                    <button type="button" onClick={() => {/* gen random */}} className="text-[10px] font-bold text-primary-600 uppercase hover:underline">Generate</button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Value Type</label>
                    <select name="valueType" className="w-full rounded-lg border bg-gray-50 px-3 py-2 text-sm outline-none transition">
                       <option value="percentage">Percentage</option>
                       <option value="fixed_amount">Fixed amount</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Discount Value</label>
                    <input required name="value" type="text" placeholder="10" className="w-full rounded-lg border bg-gray-50 px-3 py-2 text-sm outline-none transition" />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => setShowCreateModal(false)} className="rounded-lg border px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50">Cancel</button>
                <button type="submit" className="rounded-lg bg-primary-600 px-6 py-2 text-xs font-bold text-white shadow-sm hover:bg-primary-700">Save Discount</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

import { X } from 'lucide-react';
