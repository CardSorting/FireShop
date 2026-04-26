'use client';

/**
 * [LAYER: UI]
 * Admin customer detail page — CRM-style profile with order history and LTV.
 */
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useServices } from '../../hooks/useServices';
import { 
  ArrowLeft,
  Mail, 
  Calendar, 
  ShoppingBag, 
  DollarSign, 
  Check,
  ChevronRight,
  Shield,
  Star,
  Clock,
  User,
  ExternalLink
} from 'lucide-react';
import { formatCurrency, formatShortDate } from '@utils/formatters';
import { 
  AdminPageHeader, 
  useToast, 
  useAdminPageTitle,
  AdminMetricCard
} from '../../components/admin/AdminComponents';

interface AdminCustomerDetailProps {
  id: string;
}

export function AdminCustomerDetail({ id }: AdminCustomerDetailProps) {
  useAdminPageTitle('Customer Profile');
  const services = useServices();
  const { toast } = useToast();
  const router = useRouter();
  const [customer, setCustomer] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const loadCustomer = useCallback(async () => {
    setLoading(true);
    try {
      const users = await services.authService.getAllUsers();
      const summaries = await services.orderService.getCustomerSummaries(users);
      const found = summaries.find(c => c.id === id);
      if (found) {
        setCustomer(found);
      } else {
        toast('error', 'Customer not found');
        router.push('/admin/customers');
      }
    } catch (err) {
      toast('error', 'Failed to load customer details');
    } finally {
      setLoading(false);
    }
  }, [id, services, router, toast]);

  useEffect(() => {
    void loadCustomer();
  }, [loadCustomer]);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  if (!customer) return null;

  return (
    <div className="space-y-8 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => router.push('/admin/customers')}
          className="group flex h-10 w-10 items-center justify-center rounded-full border bg-white shadow-sm transition hover:bg-gray-50"
        >
          <ArrowLeft className="h-5 w-5 text-gray-500 transition-transform group-hover:-translate-x-0.5" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{customer.name}</h1>
          <p className="text-sm font-medium text-gray-500 uppercase tracking-widest">{customer.email}</p>
        </div>
        <div className="flex gap-3">
          <button className="rounded-xl border bg-white px-4 py-2.5 text-sm font-bold text-gray-700 shadow-sm transition hover:bg-gray-50 active:scale-95">
            Edit Profile
          </button>
          <button className="rounded-xl bg-gray-900 px-6 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-gray-800 active:scale-95">
            Send Email
          </button>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <AdminMetricCard label="Total Spent" value={formatCurrency(customer.spent)} icon={DollarSign} color="success" />
        <AdminMetricCard label="Total Orders" value={customer.orders} icon={ShoppingBag} color="info" />
        <AdminMetricCard label="Member Since" value={formatShortDate(customer.joined)} icon={Calendar} color="primary" />
        <AdminMetricCard label="Segment" value={customer.segment.replace('_', ' ')} icon={Star} color="warning" />
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-8">
          {/* Order History */}
          <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
            <div className="border-b px-6 py-4 bg-gray-50/50">
              <h3 className="text-sm font-bold uppercase tracking-widest text-gray-900">Order History</h3>
            </div>
            {customer.orders > 0 ? (
              <div className="divide-y divide-gray-100">
                {/* Simulated Order List */}
                <div className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition cursor-pointer" onClick={() => router.push(`/admin/orders/latest`)}>
                   <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400">
                        <ShoppingBag className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">Order #1042</p>
                        <p className="text-xs text-gray-500">{formatShortDate(customer.lastOrder || new Date())}</p>
                      </div>
                   </div>
                   <div className="text-right">
                      <p className="text-sm font-bold text-gray-900">{formatCurrency(customer.spent / customer.orders)}</p>
                      <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-bold text-green-700 uppercase">Delivered</span>
                   </div>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center">
                <ShoppingBag className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                <p className="text-sm font-bold text-gray-900">No orders yet</p>
                <p className="text-xs text-gray-500 mt-1">This customer hasn't placed any orders.</p>
              </div>
            )}
          </div>

          {/* Activity Feed */}
          <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
            <div className="border-b px-6 py-4 bg-gray-50/50">
              <h3 className="text-sm font-bold uppercase tracking-widest text-gray-900">Customer Activity</h3>
            </div>
            <div className="p-8">
              <div className="relative space-y-8 pl-8">
                <div className="absolute left-[1.05rem] top-2 bottom-2 w-px bg-gray-100" />
                
                {customer.lastOrder && (
                  <div className="relative">
                    <div className="absolute left-[-2.15rem] mt-1.5 h-4 w-4 rounded-full border-2 border-white bg-primary-500 shadow-sm" />
                    <p className="text-sm font-bold text-gray-900">Placed order #1042</p>
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mt-1">{formatShortDate(customer.lastOrder)}</p>
                  </div>
                )}

                <div className="relative">
                  <div className="absolute left-[-2.15rem] mt-1.5 h-4 w-4 rounded-full border-2 border-white bg-gray-300 shadow-sm" />
                  <p className="text-sm font-bold text-gray-900">Customer account created</p>
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mt-1">{formatShortDate(customer.joined)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Customer Details Card */}
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <h3 className="mb-6 text-xs font-bold uppercase tracking-widest text-gray-400">About Customer</h3>
            <div className="space-y-5">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Customer ID</p>
                <p className="text-sm font-mono text-gray-900 break-all">{customer.id}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Marketing Preference</p>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-1 text-xs font-bold text-green-700">
                  <Check className="h-3.5 w-3.5" /> Subscribed
                </span>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Risk Status</p>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">
                  <Shield className="h-3.5 w-3.5" /> Verified Account
                </span>
              </div>
            </div>
          </div>

          {/* Notes Card */}
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400">Admin Notes</h3>
              <button className="text-[10px] font-bold text-primary-600 uppercase hover:underline">Edit</button>
            </div>
            <div className="rounded-xl bg-amber-50/50 border border-amber-100 p-4">
              <p className="text-xs text-amber-800 leading-relaxed italic">
                "Prefer standard shipping over express. Collecting vintage base set booster boxes."
              </p>
            </div>
            <p className="text-[10px] text-gray-400 mt-4 text-center">Last updated 2 days ago</p>
          </div>
        </div>
      </div>
    </div>
  );
}
