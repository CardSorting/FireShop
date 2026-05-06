"use client";

'use client';

/**
 * [LAYER: UI]
 * Admin customer management — CRM-style list with segments and LTV.
 * Patterns modeled after Shopify Customers for high-velocity management.
 */
import { useEffect, useMemo, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useServices } from '../../hooks/useServices';
import { 
  Search, 
  User, 
  Mail, 
  Calendar, 
  ShoppingBag, 
  DollarSign, 
  MoreHorizontal,
  Filter,
  Download,
  ExternalLink,
  Users,
  Star,
  Clock,
  ChevronRight,
  UserPlus,
  Plus
} from 'lucide-react';
import { formatCurrency, formatShortDate, normalizeSearch } from '@utils/formatters';
import { 
  AdminPageHeader, 
  AdminEmptyState, 
  SkeletonPage, 
  useToast, 
  useAdminPageTitle,
  AdminTab,
  AdminMetricCard,
  exportToCSV
} from '../../components/admin/AdminComponents';


const SEGMENT_TABS = [
  { label: 'All', value: 'all', icon: Users },
  { label: 'Big Spenders', value: 'big_spender', icon: Star },
  { label: 'New', value: 'new', icon: UserPlus },
  { label: 'Inactive', value: 'inactive', icon: Clock },
];

export function AdminCustomers() {
  useAdminPageTitle('Customers');
  const services = useServices();
  const { toast } = useToast();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [segment, setSegment] = useState('all');
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<any[]>([]);
  const controllerRef = useRef<AbortController | null>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  async function loadCustomers() {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    setLoading(true);
    try {
      const users = await services.authService.getAllUsers(controller.signal);
      const summaries = await services.orderService.getCustomerSummaries(users);
      if (isMounted.current && !controller.signal.aborted) {
        setCustomers(summaries);
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      if (isMounted.current) {
        toast('error', 'Failed to load customers');
      }
    } finally {
      if (isMounted.current && !controller.signal.aborted) {
        setLoading(false);
      }
    }
  }

  function handleExport() {
    if (customers.length === 0) {
      toast('info', 'No customers to export');
      return;
    }
    const data = customers.map(c => ({
      Name: c.name,
      Email: c.email,
      Orders: c.orders,
      Spent: (c.spent / 100).toFixed(2),
      Joined: c.joined.toISOString(),
      Segment: c.segment
    }));
    exportToCSV('customers_export', data);
    toast('success', `Exported ${customers.length} customers to CSV`);
  }

  useEffect(() => {
    void loadCustomers();
    return () => controllerRef.current?.abort();
  }, [services]);

  const filtered = useMemo(() => {
    const needle = normalizeSearch(query);
    return customers.filter(c => {
      const matchesSearch = !needle || c.name.toLowerCase().includes(needle) || c.email.toLowerCase().includes(needle);
      const matchesSegment = segment === 'all' || c.segment === segment;
      return matchesSearch && matchesSegment;
    }).sort((a, b) => b.spent - a.spent);
  }, [query, segment, customers]);

  const counts = useMemo(() => {
    const map: Record<string, number> = { all: customers.length };
    customers.forEach(c => {
      map[c.segment] = (map[c.segment] || 0) + 1;
    });
    return map;
  }, [customers]);

  if (loading) return <SkeletonPage />;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <AdminPageHeader 
        title="Customers" 
        subtitle="Manage your customer base and track lifetime value"
        actions={
          <div className="flex items-center gap-2">
            <button 
              onClick={handleExport}
              className="flex items-center gap-2 rounded-lg border bg-white px-4 py-2 text-xs font-bold text-gray-700 shadow-sm transition hover:bg-gray-50 active:scale-95"
            >
              <Download className="h-3.5 w-3.5 text-gray-400" />
              Export
            </button>
            <button 
              onClick={() => router.push('/admin/customers/new')}
              className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-primary-700 active:scale-95"
            >
              <UserPlus className="h-3.5 w-3.5" />
              Add Customer
            </button>
          </div>
        }
      />

      {/* ── KPI Row ── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <AdminMetricCard label="Total customers" value={customers.length} icon={Users} color="info" />
        <AdminMetricCard 
          label="Avg. LTV" 
          value={formatCurrency(customers.length > 0 ? customers.reduce((a, b) => a + b.spent, 0) / customers.length : 0)} 
          icon={DollarSign} 
          color="success" 
        />
        <AdminMetricCard 
          label="New this week" 
          value={customers.filter(c => (Date.now() - c.joined.getTime()) < 7 * 24 * 60 * 60 * 1000).length} 
          icon={UserPlus} 
          color="primary" 
        />
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* ── Segments Sidebar (Shopify Style) ── */}
        <aside className="w-full lg:w-64 shrink-0 space-y-1">
          <p className="px-3 mb-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Segments</p>
          {SEGMENT_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setSegment(tab.value)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold transition-colors ${segment === tab.value ? 'bg-primary-50 text-primary-700' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}
            >
              <div className="flex items-center gap-2">
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </div>
              <span className="text-[10px] opacity-60">{counts[tab.value] || 0}</span>
            </button>
          ))}
          <div className="pt-4 px-3">
             <button className="flex items-center gap-2 text-[10px] font-bold text-primary-600 uppercase hover:underline">
               <Plus className="h-3 w-3" />
               Create Segment
             </button>
          </div>
        </aside>

        <div className="flex-1 space-y-4">
          <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
            {/* ── Search Bar ── */}
            <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center border-b">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input 
                  value={query} 
                  onChange={(e) => setQuery(e.target.value)} 
                  placeholder="Search customers by name, email, or tag…" 
                  className="w-full rounded-lg border bg-gray-50 py-2 pl-9 pr-3 text-sm focus:ring-2 focus:ring-primary-500 outline-none transition" 
                />
              </div>
              <button className="flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-xs font-bold text-gray-700 shadow-sm transition hover:bg-gray-50">
                <Filter className="h-3.5 w-3.5 text-gray-400" />
                Filters
              </button>
            </div>

            {/* ── Table ── */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="w-12 px-4 py-3">
                      <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                    </th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-gray-400">Customer</th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-gray-400">Status</th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-gray-400">Orders</th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-gray-400">Total Spent</th>
                    <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-widest text-gray-400">Last Active</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map((customer) => (
                    <tr 
                      key={customer.id} 
                      onClick={() => router.push(`/admin/customers/${customer.id}`)}
                      className="group cursor-pointer transition hover:bg-gray-50"
                    >
                      <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                        <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-700 font-bold text-[10px] uppercase shadow-sm border border-primary-200">
                            {customer.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold text-gray-900">{customer.name}</p>
                            <p className="truncate text-[10px] font-medium text-gray-500 uppercase tracking-widest">{customer.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          customer.segment === 'big_spender' ? 'bg-purple-100 text-purple-700' :
                          customer.segment === 'active' ? 'bg-green-100 text-green-700' :
                          customer.segment === 'new' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          <div className={`h-1 w-1 rounded-full ${
                            customer.segment === 'big_spender' ? 'bg-purple-500' :
                            customer.segment === 'active' ? 'bg-green-500' :
                            customer.segment === 'new' ? 'bg-blue-500' : 'bg-gray-400'
                          }`} />
                          {customer.segment.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 font-bold text-gray-900">
                        {customer.orders}
                      </td>
                      <td className="px-4 py-3.5 font-bold text-gray-900 tracking-tight">
                        {formatCurrency(customer.spent)}
                      </td>
                      <td className="px-4 py-3.5 text-right font-medium text-gray-500">
                        <div className="flex items-center justify-end gap-2">
                          <span>{customer.lastOrder ? formatShortDate(customer.lastOrder) : 'Never'}</span>
                          <ChevronRight className="h-4 w-4 text-gray-300 transition-transform group-hover:translate-x-0.5" />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filtered.length === 0 && (
                <AdminEmptyState title="No customers found" description="Try a different search or segment." icon={User} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
