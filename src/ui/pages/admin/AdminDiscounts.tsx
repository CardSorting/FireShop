'use client';

/**
 * [LAYER: UI]
 * Admin discounts — Marketing and promotion management.
 * Patterns modeled after Shopify Discounts.
 */
import { useState } from 'react';
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

const MOCK_DISCOUNTS: Discount[] = [
  { 
    id: '1', 
    title: 'WELCOME10', 
    type: 'code', 
    value: '10% off', 
    usageCount: 142, 
    status: 'active', 
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) 
  },
  { 
    id: '2', 
    title: 'Summer Sale', 
    type: 'automatic', 
    value: '$5.00 off orders over $50', 
    usageCount: 89, 
    status: 'active', 
    startDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000)
  },
  { 
    id: '3', 
    title: 'BFSALE', 
    type: 'code', 
    value: '20% off', 
    usageCount: 512, 
    status: 'expired', 
    startDate: new Date(Date.now() - 150 * 24 * 60 * 60 * 1000),
    endDate: new Date(Date.now() - 140 * 24 * 60 * 60 * 1000)
  },
];

export function AdminDiscounts() {
  useAdminPageTitle('Discounts');
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('all');
  const [query, setQuery] = useState('');

  const filtered = MOCK_DISCOUNTS.filter(d => {
    if (activeTab !== 'all' && d.status !== activeTab) return false;
    if (query && !d.title.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-500">
      <AdminPageHeader 
        title="Discounts" 
        subtitle="Manage promotional codes and automatic discounts"
        actions={
          <button 
            onClick={() => toast('info', 'Create discount flow coming soon')}
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
          value={formatCurrency(1245000)} // $12,450.00
          icon={Tag} 
          color="success" 
          description="Total revenue reduced by discounts"
        />
        <AdminMetricCard 
          label="Conversion with Discounts" 
          value="4.2%" 
          icon={Zap} 
          color="primary" 
          description="Orders using a promotion"
        />
        <AdminMetricCard 
          label="Active Promotions" 
          value={MOCK_DISCOUNTS.filter(d => d.status === 'active').length} 
          icon={CheckCircle2} 
          color="info" 
          description="Live automatic and code-based offers"
        />
      </div>

      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        {/* ── Tabs ── */}
        <div className="flex items-center border-b px-2 overflow-x-auto scrollbar-hide">
          <AdminTab label="All" active={activeTab === 'all'} onClick={() => setActiveTab('all')} count={MOCK_DISCOUNTS.length} />
          <AdminTab label="Active" active={activeTab === 'active'} onClick={() => setActiveTab('active')} count={MOCK_DISCOUNTS.filter(d => d.status === 'active').length} />
          <AdminTab label="Scheduled" active={activeTab === 'scheduled'} onClick={() => setActiveTab('scheduled')} count={0} />
          <AdminTab label="Expired" active={activeTab === 'expired'} onClick={() => setActiveTab('expired')} count={MOCK_DISCOUNTS.filter(d => d.status === 'expired').length} />
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
                    <p className="font-bold text-gray-900 tracking-tight">{d.title}</p>
                    <p className="text-[10px] text-gray-500 font-medium">Started {formatShortDate(d.startDate)}</p>
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
    </div>
  );
}
