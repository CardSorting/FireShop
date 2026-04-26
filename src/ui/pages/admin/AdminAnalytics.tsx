'use client';

/**
 * [LAYER: UI]
 * Admin analytics — High-fidelity store insights.
 * Patterns modeled after Stripe and Shopify Analytics.
 */
import { useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Download, 
  BarChart3, 
  Layers, 
  Target, 
  MousePointer2,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Zap
} from 'lucide-react';
import { 
  AdminPageHeader, 
  AdminMetricCard, 
  AdminAreaChart, 
  useAdminPageTitle,
  useToast
} from '../../components/admin/AdminComponents';
import { formatCurrency } from '@utils/formatters';

const SALES_DATA = [
  { label: 'Apr 20', value: 124000 },
  { label: 'Apr 21', value: 145000 },
  { label: 'Apr 22', value: 132000 },
  { label: 'Apr 23', value: 168000 },
  { label: 'Apr 24', value: 185000 },
  { label: 'Apr 25', value: 210000 },
  { label: 'Apr 26', value: 195000 },
];

const TOP_PRODUCTS = [
  { name: 'Base Set 1st Edition Booster Box', revenue: 1450000, growth: 12, sales: 5 },
  { name: 'Charizard Base Set PSA 10', revenue: 890000, growth: -5, sales: 2 },
  { name: 'Lugia Neo Genesis Holo', revenue: 420000, growth: 25, sales: 12 },
  { name: 'Pikachu Illustrator Promo', revenue: 350000, growth: 0, sales: 1 },
];

export function AdminAnalytics() {
  useAdminPageTitle('Analytics');
  const { toast } = useToast();
  const [range, setRange] = useState('7d');

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-500">
      <AdminPageHeader 
        title="Analytics" 
        subtitle="Deep insights into your store's performance"
        actions={
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border bg-white p-1 shadow-sm">
              {['7d', '30d', '90d', 'all'].map((r) => (
                <button 
                  key={r}
                  onClick={() => setRange(r)}
                  className={`rounded-md px-3 py-1 text-[10px] font-bold uppercase tracking-widest transition ${
                    range === r ? 'bg-gray-900 text-white shadow-sm' : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
            <button 
              onClick={() => toast('info', 'Generating report...')}
              className="flex items-center gap-2 rounded-lg border bg-white px-4 py-2 text-xs font-bold text-gray-700 shadow-sm transition hover:bg-gray-50"
            >
              <Download className="h-3.5 w-3.5 text-gray-400" />
              Download
            </button>
          </div>
        }
      />

      {/* ── Real-time & Live View ── */}
      <div className="rounded-2xl bg-gray-900 p-6 text-white shadow-xl overflow-hidden relative group">
        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
           <Zap className="h-48 w-48 text-primary-500" />
        </div>
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 animate-pulse rounded-full bg-green-500 shadow-[0_0_12px_rgba(34,197,94,0.8)]" />
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-primary-400">Live Store View</h3>
            </div>
            <p className="text-3xl font-bold tracking-tight">12 <span className="text-sm font-medium text-gray-400">visitors right now</span></p>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Active sessions in the last 5 minutes</p>
          </div>

          <div className="flex gap-8 border-l border-gray-800 pl-8">
            <div>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Total Sales today</p>
              <p className="text-xl font-bold text-white">{formatCurrency(42000)}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Total Orders today</p>
              <p className="text-xl font-bold text-white">8</p>
            </div>
          </div>

          <button className="rounded-lg bg-white/10 px-4 py-2 text-xs font-bold text-white backdrop-blur-md transition hover:bg-white/20 active:scale-95">
            Open Full Live View
          </button>
        </div>
      </div>

      {/* ── Top Level KPIs ── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AdminMetricCard 
          label="Total Sales" 
          value={formatCurrency(1245000)} 
          icon={TrendingUp} 
          color="success"
          trend={{ value: '14.2%', positive: true }}
          description="vs last 7 days"
        />
        <AdminMetricCard 
          label="Conversion Rate" 
          value="3.42%" 
          icon={Target} 
          color="primary"
          trend={{ value: '0.8%', positive: true }}
          description="vs last 7 days"
        />
        <AdminMetricCard 
          label="Average Order Value" 
          value={formatCurrency(42000)} 
          icon={Layers} 
          color="info"
          trend={{ value: '2.4%', positive: false }}
          description="vs last 7 days"
        />
        <AdminMetricCard 
          label="Sessions" 
          value="45,210" 
          icon={MousePointer2} 
          color="primary"
          trend={{ value: '8.5%', positive: true }}
          description="vs last 7 days"
        />
      </div>

      {/* ── Main Chart ── */}
      <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between border-b bg-gray-50/50 px-6 py-4">
          <div>
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest">Net Sales over time</h3>
            <p className="text-[10px] text-gray-500 font-medium mt-0.5">Apr 20, 2026 – Apr 26, 2026</p>
          </div>
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-1.5">
               <div className="h-2 w-2 rounded-full bg-primary-500" />
               <span className="text-[10px] font-bold text-gray-400 uppercase">Current</span>
             </div>
             <div className="flex items-center gap-1.5">
               <div className="h-2 w-2 rounded-full bg-gray-200" />
               <span className="text-[10px] font-bold text-gray-400 uppercase">Previous</span>
             </div>
          </div>
        </div>
        <div className="p-6">
          <AdminAreaChart data={SALES_DATA} color="primary" height={240} />
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* ── Top Products ── */}
        <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between border-b bg-gray-50/50 px-6 py-4">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest">Top Products by Revenue</h3>
            <BarChart3 className="h-4 w-4 text-gray-400" />
          </div>
          <div className="divide-y divide-gray-100">
            {TOP_PRODUCTS.map((p, i) => (
              <div key={i} className="flex items-center justify-between px-6 py-4 transition hover:bg-gray-50">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-gray-900 truncate tracking-tight">{p.name}</p>
                  <p className="text-[10px] text-gray-500 font-medium">{p.sales} sales</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900">{formatCurrency(p.revenue)}</p>
                  <div className={`flex items-center justify-end gap-1 text-[10px] font-bold ${p.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {p.growth >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                    {Math.abs(p.growth)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full bg-gray-50 border-t py-3 text-[10px] font-bold uppercase tracking-widest text-gray-500 transition hover:text-gray-900">
            View full report
          </button>
        </div>

        {/* ── Sales by Channel ── */}
        <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between border-b bg-gray-50/50 px-6 py-4">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest">Sales by Channel</h3>
            <Filter className="h-4 w-4 text-gray-400" />
          </div>
          <div className="p-6 space-y-6">
            {[
              { label: 'Online Store', value: 85, color: 'bg-primary-500' },
              { label: 'Direct Link', value: 12, color: 'bg-blue-400' },
              { label: 'Social Media', value: 3, color: 'bg-indigo-300' },
            ].map((c, i) => (
              <div key={i} className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest">
                   <span className="text-gray-500">{c.label}</span>
                   <span className="text-gray-900">{c.value}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-1000 ${c.color}`} style={{ width: `${c.value}%` }} />
                </div>
              </div>
            ))}
            <div className="pt-4 border-t">
               <p className="text-[10px] text-gray-400 font-medium leading-relaxed">
                 Organic search continues to be your strongest acquisition channel. Consider boosting social media spend.
               </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
