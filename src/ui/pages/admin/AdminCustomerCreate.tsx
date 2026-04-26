'use client';

/**
 * [LAYER: UI]
 * Admin customer creation page — Full-width form for manual registration.
 */
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useServices } from '../../hooks/useServices';
import { 
  ArrowLeft,
  UserPlus,
  Mail,
  User,
  Info,
  CheckCircle2
} from 'lucide-react';
import { 
  AdminPageHeader, 
  useToast, 
  useAdminPageTitle
} from '../../components/admin/AdminComponents';

export function AdminCustomerCreate() {
  useAdminPageTitle('Add Customer');
  const services = useServices();
  const { toast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const name = formData.get('name') as string;

    try {
      // Simulation of customer creation
      await new Promise(resolve => setTimeout(resolve, 800));
      toast('success', `Invitation sent to ${email}`);
      router.push('/admin/customers');
    } catch (err) {
      toast('error', 'Failed to create customer');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => router.push('/admin/customers')}
          className="group flex h-10 w-10 items-center justify-center rounded-full border bg-white shadow-sm transition hover:bg-gray-50"
        >
          <ArrowLeft className="h-5 w-5 text-gray-500 transition-transform group-hover:-translate-x-0.5" />
        </button>
        <AdminPageHeader
          title="Add Customer"
          subtitle="Manually register a new customer or staff member"
        />
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="rounded-2xl border bg-white p-8 shadow-sm space-y-8">
              <div className="space-y-6">
                <h3 className="text-sm font-bold uppercase tracking-widest text-gray-900 border-b pb-4">Personal Information</h3>
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input 
                        required 
                        name="name" 
                        type="text" 
                        placeholder="John Doe"
                        className="w-full rounded-xl border bg-gray-50 py-3 pl-10 pr-4 text-sm focus:bg-white focus:ring-2 focus:ring-primary-500 outline-none transition" 
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input 
                        required 
                        name="email" 
                        type="email" 
                        placeholder="john@example.com"
                        className="w-full rounded-xl border bg-gray-50 py-3 pl-10 pr-4 text-sm focus:bg-white focus:ring-2 focus:ring-primary-500 outline-none transition" 
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="text-sm font-bold uppercase tracking-widest text-gray-900 border-b pb-4">Account Roles</h3>
                <div className="grid gap-4 sm:grid-cols-3">
                  <label className="relative flex cursor-pointer flex-col gap-2 rounded-xl border p-4 transition hover:bg-gray-50 has-checked:border-primary-500 has-checked:bg-primary-50/30">
                    <input type="radio" name="role" value="customer" defaultChecked className="sr-only" />
                    <span className="text-xs font-bold text-gray-900">Customer</span>
                    <span className="text-[10px] text-gray-500 leading-tight">Standard purchasing access and order history.</span>
                  </label>
                  <label className="relative flex cursor-pointer flex-col gap-2 rounded-xl border p-4 transition hover:bg-gray-50 has-checked:border-primary-500 has-checked:bg-primary-50/30">
                    <input type="radio" name="role" value="staff" className="sr-only" />
                    <span className="text-xs font-bold text-gray-900">Staff</span>
                    <span className="text-[10px] text-gray-500 leading-tight">Can manage orders and inventory but no settings.</span>
                  </label>
                  <label className="relative flex cursor-pointer flex-col gap-2 rounded-xl border p-4 transition hover:bg-gray-50 has-checked:border-primary-500 has-checked:bg-primary-50/30">
                    <input type="radio" name="role" value="admin" className="sr-only" />
                    <span className="text-xs font-bold text-gray-900">Admin</span>
                    <span className="text-[10px] text-gray-500 leading-tight">Full access to everything including sensitive settings.</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-4">
              <button 
                type="button" 
                onClick={() => router.push('/admin/customers')}
                className="rounded-xl border bg-white px-6 py-3 text-sm font-bold text-gray-700 shadow-sm transition hover:bg-gray-50 active:scale-95"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={loading}
                className="rounded-xl bg-primary-600 px-8 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-primary-700 active:scale-95 disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Send Invitation'}
              </button>
            </div>
          </form>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border bg-primary-50 p-6">
            <div className="flex gap-3 text-primary-700">
              <Info className="h-5 w-5 shrink-0" />
              <div className="space-y-2">
                <h4 className="text-sm font-bold uppercase tracking-widest">How it works</h4>
                <p className="text-xs leading-relaxed font-medium">
                  When you add a customer manually, we'll send them an invitation email. 
                  They'll need to follow the link to set their password and verify their account before they can log in.
                </p>
                <div className="pt-2 flex items-center gap-2 text-[10px] font-bold uppercase">
                  <CheckCircle2 className="h-3 w-3" /> Secure Enrollment
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border bg-gray-50 p-6 space-y-4">
            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Manual Registration</h4>
            <p className="text-xs text-gray-500 leading-relaxed font-medium">
              Use this form for B2B accounts, manual orders, or when migrating customers from another platform.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
