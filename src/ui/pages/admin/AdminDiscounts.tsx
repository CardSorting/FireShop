'use client';

/**
 * [LAYER: UI]
 * Admin discounts — Marketing and promotion management.
 * Patterns modeled after Shopify Discounts and Stripe Promotions.
 */
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  Ticket,
  X,
  ArrowUpRight,
  ChevronRight,
  SearchCode,
  TrendingUp,
  RotateCcw
} from 'lucide-react';
import { 
  AdminPageHeader, 
  AdminMetricCard, 
  AdminEmptyState, 
  AdminStatusBadge, 
  AdminTab,
  useToast, 
  useAdminPageTitle,
  SkeletonRow 
} from '../../components/admin/AdminComponents';
import { formatCurrency, formatShortDate } from '@utils/formatters';
import type { Discount } from '@domain/models';

function getDiscountSummary(discount: Discount) {
  let text = '';
  if (discount.type === 'percentage') text = `${discount.value}% off`;
  else if (discount.type === 'fixed') text = `${formatCurrency(discount.value)} off`;
  else text = 'Free shipping';

  if (discount.selectionType === 'all_products') text += ' all products';
  else if (discount.selectionType === 'specific_products') text += ' specific products';
  else text += ' specific collections';

  if (discount.minimumRequirementType === 'minimum_amount') text += ` · Min. ${formatCurrency(discount.minimumAmount || 0)}`;
  else if (discount.minimumRequirementType === 'minimum_quantity') text += ` · Min. ${discount.minimumQuantity || 1} items`;

  return text;
}

export function AdminDiscounts() {
  useAdminPageTitle('Discounts');
  const services = useServices();
  const { toast } = useToast();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'scheduled' | 'expired'>('all');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [discounts, setDiscounts] = useState<Discount[]>([]);

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

  const filtered = useMemo(() => {
    return discounts.filter(d => {
      if (activeTab !== 'all' && d.status !== activeTab) return false;
      const term = query.toLowerCase();
      if (query && !(d.code.toLowerCase().includes(term) || getDiscountSummary(d).toLowerCase().includes(term))) return false;
      return true;
    });
  }, [discounts, activeTab, query]);

  const stats = useMemo(() => {
    return {
      totalRedemptions: discounts.reduce((sum, d) => sum + d.usageCount, 0),
      activeCount: discounts.filter(d => d.status === 'active').length,
      scheduledCount: discounts.filter(d => d.status === 'scheduled').length,
      expiredCount: discounts.filter(d => d.status === 'expired').length,
    };
  }, [discounts]);

  return (
    <div className="space-y-6 pb-24 animate-in fade-in duration-500">
      <AdminPageHeader 
        title="Discounts" 
        subtitle="Drive sales with targeted promotions, automatic discounts, and coupon codes."
        actions={
          <Link 
            href="/admin/discounts/new"
            className="flex items-center gap-2 rounded-xl bg-gray-900 px-6 py-2.5 text-xs font-bold text-white shadow-lg transition hover:bg-gray-800 active:scale-95"
          >
            <Plus className="h-4 w-4" />
            Create discount
          </Link>
        }
      />

      {/* ── Dashboard KPIs ── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AdminMetricCard label="Total Redemptions" value={stats.totalRedemptions} icon={TrendingUp} color="success" />
        <AdminMetricCard label="Active" value={stats.activeCount} icon={CheckCircle2} color="info" />
        <AdminMetricCard label="Scheduled" value={stats.scheduledCount} icon={Clock} color="warning" />
        <AdminMetricCard label="Expired" value={stats.expiredCount} icon={RotateCcw} />
      </div>

      <div className="rounded-2xl border bg-white shadow-sm overflow-hidden flex flex-col">
        {/* Tabs */}
        <div className="border-b px-4 bg-gray-50/30">
          <div className="flex items-center overflow-x-auto scrollbar-hide">
            <AdminTab label="All" active={activeTab === 'all'} onClick={() => setActiveTab('all')} count={discounts.length} />
            <AdminTab label="Active" active={activeTab === 'active'} onClick={() => setActiveTab('active')} count={stats.activeCount} />
            <AdminTab label="Scheduled" active={activeTab === 'scheduled'} onClick={() => setActiveTab('scheduled')} count={stats.scheduledCount} />
            <AdminTab label="Expired" active={activeTab === 'expired'} onClick={() => setActiveTab('expired')} count={stats.expiredCount} />
          </div>
        </div>

        {/* Search */}
        <div className="p-4 border-b bg-white">
          <div className="relative group">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-600 transition-colors" />
            <input 
              value={query} 
              onChange={(e) => setQuery(e.target.value)} 
              placeholder="Search by code or promotion summary…" 
              className="w-full rounded-xl border bg-gray-50 py-2.5 pl-10 pr-3 text-sm focus:ring-2 focus:ring-primary-500 focus:bg-white outline-none transition-all shadow-sm" 
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-[10px] font-black uppercase tracking-widest">Promotion Code</th>
                <th className="px-6 py-3 text-left text-[10px] font-black uppercase tracking-widest">Status</th>
                <th className="px-6 py-3 text-left text-[10px] font-black uppercase tracking-widest">Summary</th>
                <th className="px-6 py-3 text-left text-[10px] font-black uppercase tracking-widest">Type</th>
                <th className="px-6 py-3 text-right text-[10px] font-black uppercase tracking-widest">Usage</th>
                <th className="w-12 px-6"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading && [1, 2, 3].map(i => <SkeletonRow key={i} columns={6} />)}
              {!loading && filtered.map((d) => (
                <tr 
                  key={d.id} 
                  onClick={() => router.push(`/admin/discounts/${d.id}`)}
                  className="group cursor-pointer transition hover:bg-gray-50/80"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                       <div className={`rounded-lg p-2 ${d.status === 'active' ? 'bg-primary-50 text-primary-600' : 'bg-gray-100 text-gray-400'}`}>
                          <Tag className="h-4 w-4" />
                       </div>
                       <div>
                          <p className="font-black text-gray-900 tracking-tight group-hover:text-primary-600 transition-colors uppercase">{d.code}</p>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{d.isAutomatic ? 'Automatic' : 'Code'}</p>
                       </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <AdminStatusBadge 
                      status={d.status === 'active' ? 'active' : d.status === 'scheduled' ? 'pending' : 'cancelled'} 
                      type="order" 
                    />
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-xs font-bold text-gray-700 leading-relaxed italic truncate max-w-xs group-hover:text-gray-900 transition-colors">
                      "{getDiscountSummary(d)}"
                    </p>
                    <p className="text-[10px] text-gray-400 font-medium">Starts {formatShortDate(d.startsAt)}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                       {d.type === 'percentage' ? (
                         <div className="rounded bg-indigo-50 px-2 py-0.5 text-[10px] font-black text-indigo-700 uppercase tracking-widest ring-1 ring-indigo-200">Percentage</div>
                       ) : d.type === 'fixed' ? (
                         <div className="rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-black text-emerald-700 uppercase tracking-widest ring-1 ring-emerald-200">Fixed</div>
                       ) : (
                         <div className="rounded bg-amber-50 px-2 py-0.5 text-[10px] font-black text-amber-700 uppercase tracking-widest ring-1 ring-amber-200">Shipping</div>
                       )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex flex-col items-end gap-1.5">
                       <span className="text-sm font-black text-gray-900">{d.usageCount} used</span>
                       {d.usageLimit && (
                         <div className="w-24 h-1 rounded-full bg-gray-100 overflow-hidden">
                            <div 
                              className="h-full bg-primary-600 transition-all duration-1000" 
                              style={{ width: `${Math.min(100, (d.usageCount / d.usageLimit) * 100)}%` }} 
                            />
                         </div>
                       )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-gray-600 group-hover:translate-x-1 transition-all" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {!loading && filtered.length === 0 && (
            <AdminEmptyState 
              title="No discounts found" 
              description={query ? "We couldn't find anything matching your search." : "Ready to launch your first sale? Create a discount code or automatic promotion to get started."} 
              icon={SearchCode}
              action={!query && (
                <Link href="/admin/discounts/new" className="rounded-xl bg-gray-900 px-6 py-2.5 text-xs font-bold text-white shadow-lg transition hover:bg-gray-800">
                   Create your first discount
                </Link>
              )}
            />
          )}
        </div>

        {/* Footer info */}
        <div className="bg-gray-50 border-t px-6 py-3 flex items-center justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest">
           <div>Showing {filtered.length} promotions</div>
           <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-green-500" /> {stats.activeCount} Active</span>
              <span className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-amber-500" /> {stats.scheduledCount} Scheduled</span>
           </div>
        </div>
      </div>

      {/* ── Pro Tips ── */}
      <div className="grid gap-6 lg:grid-cols-2 animate-in slide-in-from-bottom-4 duration-700">
        <div className="rounded-2xl border bg-gray-50 p-6 flex items-start gap-4 shadow-xs">
          <div className="rounded-xl bg-white p-3 text-primary-600 shadow-sm"><TrendingUp className="h-5 w-5" /></div>
          <div className="space-y-1">
             <h3 className="text-xs font-black uppercase tracking-widest text-gray-900">Optimization Tip</h3>
             <p className="text-xs text-gray-500 font-medium leading-relaxed">Discounts with a minimum purchase amount have a 25% higher average order value. Try setting a "Spend $50, Get 10% Off" rule.</p>
          </div>
        </div>
        <div className="rounded-2xl border bg-gray-50 p-6 flex items-start gap-4 shadow-xs">
          <div className="rounded-xl bg-white p-3 text-amber-600 shadow-sm"><Users className="h-5 w-5" /></div>
          <div className="space-y-1">
             <h3 className="text-xs font-black uppercase tracking-widest text-gray-900">Targeting Strategy</h3>
             <p className="text-xs text-gray-500 font-medium leading-relaxed">Use automatic discounts for store-wide clearance events to reduce friction during checkout and increase conversion rates.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

