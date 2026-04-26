'use client';

/**
 * [LAYER: UI]
 * Admin settings section page — Full-width configuration for specific store areas.
 */
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useServices } from '../../hooks/useServices';
import { 
  Store, 
  CreditCard, 
  Truck, 
  Mail, 
  Shield, 
  CheckCircle2, 
  Globe,
  Palette,
  Bell,
  Lock,
  Smartphone,
  ShoppingBag,
  Settings,
  ArrowLeft,
  ChevronRight,
  UserCheck
} from 'lucide-react';
import { 
  AdminPageHeader, 
  useToast, 
  useAdminPageTitle,
  AdminAuditLogs
} from '../../components/admin/AdminComponents';
import type { User } from '@domain/models';

interface AdminSettingsSectionProps {
  sectionId: string;
}

export function AdminSettingsSection({ sectionId }: AdminSettingsSectionProps) {
  const services = useServices();
  const { toast } = useToast();
  const router = useRouter();
  
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [users, setUsers] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useAdminPageTitle(`${sectionId.charAt(0).toUpperCase() + sectionId.slice(1)} Settings`);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [data, staff, logs] = await Promise.all([
        services.settingsService.getSettings(),
        services.authService.getAllUsers(),
        services.auditService.getRecentLogs()
      ]);
      setSettings(data);
      setUsers(staff);
      setAuditLogs(logs);
    } catch (err) {
      console.error('Failed to load settings data', err);
    } finally {
      setLoading(false);
    }
  }, [services]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const saveSetting = async (key: string, value: any) => {
    try {
      await services.settingsService.updateSetting(key, value);
      setSettings(prev => ({ ...prev, [key]: value }));
      toast('success', 'Setting updated');
    } catch (err) {
      toast('error', 'Failed to save setting');
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => router.push('/admin/settings')}
          className="group flex h-10 w-10 items-center justify-center rounded-full border bg-white shadow-sm transition hover:bg-gray-50"
        >
          <ArrowLeft className="h-5 w-5 text-gray-500 transition-transform group-hover:-translate-x-0.5" />
        </button>
        <AdminPageHeader
          title={`${sectionId.charAt(0).toUpperCase() + sectionId.slice(1)} Settings`}
          subtitle={`Configure your store's ${sectionId} preferences.`}
        />
      </div>

      <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
        <div className="p-8 space-y-10">
           {sectionId === 'general' ? (
              <div className="space-y-8">
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest border-b pb-2">Store Identity</h3>
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-700">Store Name</label>
                      <input 
                        type="text" 
                        defaultValue={settings.store_name || 'PlayMore TCG'} 
                        onBlur={(e) => saveSetting('store_name', e.target.value)}
                        className="w-full rounded-xl border bg-gray-50 px-4 py-3 text-sm focus:bg-white focus:ring-2 focus:ring-primary-500 outline-none transition"
                        placeholder="e.g. PlayMore TCG"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-700">Merchant Name</label>
                      <input 
                        type="text" 
                        defaultValue={settings.merchant_name || 'PlayMore Retail Group'} 
                        onBlur={(e) => saveSetting('merchant_name', e.target.value)}
                        className="w-full rounded-xl border bg-gray-50 px-4 py-3 text-sm focus:bg-white focus:ring-2 focus:ring-primary-500 outline-none transition"
                        placeholder="Legal business name"
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest border-b pb-2">Store Contact</h3>
                  <div className="max-w-md space-y-2">
                    <label className="text-xs font-bold text-gray-700">Support Email</label>
                    <input 
                      type="email" 
                      defaultValue={settings.support_email || 'support@playmoretcg.com'} 
                      onBlur={(e) => saveSetting('support_email', e.target.value)}
                      className="w-full rounded-xl border bg-gray-50 px-4 py-3 text-sm focus:bg-white focus:ring-2 focus:ring-primary-500 outline-none transition"
                    />
                  </div>
                </div>
              </div>
            ) : sectionId === 'staff' ? (
              <div className="space-y-8">
                <div className="flex items-center justify-between">
                   <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest">Manage Staff Members</h3>
                   <button className="rounded-xl bg-gray-900 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-gray-800 transition active:scale-95">
                     Invite Member
                   </button>
                </div>
                <div className="divide-y rounded-2xl border bg-white overflow-hidden shadow-sm">
                  {users.map(user => (
                    <div key={user.id} className="flex items-center justify-between p-5 hover:bg-gray-50 transition">
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-50 text-xs font-bold text-primary-600 border border-primary-100">
                          {user.displayName?.slice(0, 2).toUpperCase() || '??'}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">{user.displayName}</p>
                          <p className="text-xs font-medium text-gray-500">{user.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${user.role === 'admin' ? 'bg-indigo-50 text-indigo-600' : 'bg-gray-100 text-gray-600'}`}>
                          {user.role}
                        </span>
                        <button className="text-gray-400 hover:text-gray-600 transition-colors">
                          <ChevronRight className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : sectionId === 'payments' ? (
              <div className="space-y-8">
                <div className="space-y-4">
                   <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest">Active Providers</h3>
                      <span className="flex items-center gap-2 text-[10px] font-bold text-green-600 uppercase tracking-widest">
                        <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                        Live Mode
                      </span>
                   </div>
                   <div className="rounded-2xl border bg-gray-50/50 p-6 flex items-center justify-between border-dashed">
                      <div className="flex items-center gap-5">
                         <div className="h-14 w-14 rounded-xl bg-[#635BFF] flex items-center justify-center text-white font-black text-xs shadow-lg">Stripe</div>
                         <div>
                            <p className="text-sm font-bold text-gray-900">Stripe Payments {settings.payment_configured && <CheckCircle2 className="inline h-4 w-4 text-green-500 ml-1" />}</p>
                            <p className="text-xs text-gray-500 font-medium mt-1">Accept credit cards, Apple Pay, and Google Pay.</p>
                         </div>
                      </div>
                      <button 
                        onClick={() => saveSetting('payment_configured', !settings.payment_configured)}
                        className={`rounded-xl px-5 py-2.5 text-xs font-bold transition active:scale-95 ${settings.payment_configured ? 'border bg-white text-gray-700' : 'bg-gray-900 text-white'}`}
                      >
                        {settings.payment_configured ? 'Disconnect' : 'Connect'}
                      </button>
                   </div>
                </div>

                <div className="space-y-4 pt-6">
                   <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest">Payment Capture</h3>
                   <div className="grid gap-4">
                      <label className="group relative flex cursor-pointer items-start gap-4 rounded-2xl border p-5 transition hover:bg-gray-50 has-checked:border-primary-500 has-checked:bg-primary-50/30">
                         <input type="radio" name="capture" defaultChecked className="mt-1 h-4 w-4 border-gray-300 text-primary-600 focus:ring-primary-500" />
                         <div>
                            <p className="text-sm font-bold text-gray-900">Automatically capture payment for orders</p>
                            <p className="text-xs text-gray-500 font-medium mt-1">Funds are captured immediately when an order is placed.</p>
                         </div>
                      </label>
                      <label className="group relative flex cursor-pointer items-start gap-4 rounded-2xl border p-5 transition hover:bg-gray-50 has-checked:border-primary-500 has-checked:bg-primary-50/30">
                         <input type="radio" name="capture" className="mt-1 h-4 w-4 border-gray-300 text-primary-600 focus:ring-primary-500" />
                         <div>
                            <p className="text-sm font-bold text-gray-900">Manually capture payment for orders</p>
                            <p className="text-xs text-gray-500 font-medium mt-1">Authorizes funds and allows manual capture within 7 days.</p>
                         </div>
                      </label>
                   </div>
                </div>

                <div className="rounded-2xl bg-amber-50 border border-amber-100 p-5">
                   <p className="text-xs text-amber-800 leading-relaxed font-medium">
                      <strong>Pro Tip:</strong> Manually capturing payments can reduce chargeback risk for high-ticket items, but adds friction to your fulfillment workflow.
                   </p>
                </div>
              </div>
             ) : sectionId === 'security' ? (
               <div className="space-y-8">
                  <div className="flex items-center justify-between">
                     <h3 className="text-sm font-bold uppercase tracking-widest text-gray-900">Security Audit Trail</h3>
                     <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{auditLogs.length} entries recorded</span>
                  </div>
                  <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
                     <AdminAuditLogs logs={auditLogs} />
                  </div>
                  <div className="rounded-2xl bg-gray-900 text-white p-6 shadow-xl">
                     <div className="flex gap-4">
                        <Shield className="h-6 w-6 text-primary-400 shrink-0" />
                        <div className="space-y-2">
                           <p className="text-sm font-bold uppercase tracking-widest">Forensic Integrity</p>
                           <p className="text-xs text-gray-400 leading-relaxed font-medium">
                             Audit logs are cryptographically sealed and immutable. They provide a definitive source of truth for administrative actions and cannot be modified or deleted.
                           </p>
                        </div>
                     </div>
                  </div>
               </div>
             ) : (
              <div className="text-center py-20 space-y-4">
                 <div className="mx-auto h-20 w-20 rounded-full bg-gray-50 flex items-center justify-center text-gray-300">
                    <Settings className="h-10 w-10" />
                 </div>
                 <div>
                    <p className="text-lg font-bold text-gray-900">Section Under Development</p>
                    <p className="text-sm text-gray-500 mt-1">We're working on bringing full control to the {sectionId} settings.</p>
                 </div>
                 <button 
                  onClick={() => router.push('/admin/settings')}
                  className="rounded-xl border bg-white px-6 py-2.5 text-xs font-bold text-gray-700 shadow-sm transition hover:bg-gray-50"
                 >
                  Back to Settings
                 </button>
              </div>
            )}
        </div>

        <div className="sticky bottom-0 bg-gray-50/95 backdrop-blur-sm border-t px-8 py-6 flex justify-end gap-4">
           <button 
            onClick={() => router.push('/admin/settings')} 
            className="rounded-xl border bg-white px-6 py-3 text-sm font-bold text-gray-700 shadow-sm transition hover:bg-gray-50 active:scale-95"
           >
             Back
           </button>
           <button 
              onClick={() => { 
                toast('success', 'All changes saved successfully');
                router.push('/admin/settings');
              }} 
              className="rounded-xl bg-primary-600 px-10 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-primary-700 active:scale-95"
            >
             Done
           </button>
        </div>
      </div>
    </div>
  );
}
