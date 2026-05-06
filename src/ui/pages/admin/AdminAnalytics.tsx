"use client";

'use client';

/**
 * [LAYER: UI]
 * Admin analytics — High-fidelity store insights.
 * Patterns modeled after Stripe and Shopify Analytics.
 */
import { useState, useEffect, useCallback, useRef } from 'react';
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
  Zap,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { 
  AdminPageHeader, 
  AdminMetricCard, 
  AdminAreaChart, 
  useAdminPageTitle,
  useToast,
  SkeletonPage
} from '../../components/admin/AdminComponents';
import { formatCurrency } from '@utils/formatters';

export function AdminAnalytics() {
  useAdminPageTitle('Analytics');
  const { toast } = useToast();
  const [range, setRange] = useState('7d');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  const loadAnalytics = useCallback(async () => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/analytics', { signal: controller.signal });
      if (!response.ok) throw new Error('Failed to fetch analytics');
      const result = await response.json();
      if (!controller.signal.aborted) {
        setData(result);
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void loadAnalytics();
    return () => controllerRef.current?.abort();
  }, [loadAnalytics]);

  if (loading) return <SkeletonPage />;

  if (error) return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <div className="h-12 w-12 rounded-full bg-red-50 flex items-center justify-center">
        <AlertTriangle className="h-6 w-6 text-red-500" />
      </div>
      <p className="text-sm font-medium text-gray-900">{error}</p>
      <button 
        onClick={loadAnalytics}
        className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg text-xs font-bold hover:bg-gray-800 transition"
      >
        <RefreshCw className="h-3.5 w-3.5" />
        Retry
      </button>
    </div>
  );

  const salesData = (data?.dailyRevenue || []).map((val: number, i: number) => ({
    label: `Day ${i + 1}`,
    value: val
  }));

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
              <p className="text-xl font-bold text-white">{formatCurrency(data?.dailyRevenue?.[6] || 0)}</p>
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
          value={formatCurrency(data?.totalRevenue || 0)} 
          icon={TrendingUp} 
          color="success"
          trend={{ value: '14.2%', positive: true }}
          description="Total gross revenue"
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
          value={formatCurrency(data?.totalRevenue / 10 || 0)} 
          icon={Layers} 
          color="info"
          trend={{ value: '2.4%', positive: false }}
          description="Estimated AOV"
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
            <p className="text-[10px] text-gray-500 font-medium mt-0.5">Last 7 Days of Trading Activity</p>
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
          <AdminAreaChart data={salesData} color="primary" height={240} />
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
            {data?.topProducts?.map((p: any, i: number) => (
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
            {(!data?.topProducts || data.topProducts.length === 0) && (
              <div className="p-8 text-center text-xs text-gray-400 italic">No sales data available yet.</div>
            )}
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
