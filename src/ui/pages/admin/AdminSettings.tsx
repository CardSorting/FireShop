'use client';

/**
 * [LAYER: UI]
 * Admin settings — Store configuration and setup checklist.
 * Patterns modeled after Stripe and Shopify Settings.
 */
import { useCallback, useEffect, useState } from 'react';
import { useServices } from '../../hooks/useServices';
import { 
  Store, 
  CreditCard, 
  Truck, 
  Mail, 
  Shield, 
  CheckCircle2, 
  Circle,
  ExternalLink,
  ChevronRight,
  Globe,
  Palette,
  Bell,
  UserCheck,
  Search,
  Lock,
  Smartphone,
  Eye,
  Languages,
  ShoppingBag,
  Settings,
  X
} from 'lucide-react';
import { 
  AdminPageHeader, 
  useToast, 
  useAdminPageTitle,
  AdminTab,
  AdminAuditLogs
} from '../../components/admin/AdminComponents';
import type { User } from '@domain/models';

export interface SetupGuideProgress {
  hasProducts: boolean;
  hasStoreName: boolean;
  hasPaymentConfigured: boolean;
  hasShippingRates: boolean;
  hasCustomDomain: boolean;
  completedCount: number;
  totalCount: number;
}

interface SettingsSection {
  id: string;
  label: string;
  description: string;
  icon: typeof Store;
  group: 'store' | 'sales' | 'advanced';
}

const SETTINGS_SECTIONS: SettingsSection[] = [
  // Store Group
  { id: 'general', label: 'General', description: 'Store name, address, and time zone', icon: Store, group: 'store' },
  { id: 'branding', label: 'Branding', description: 'Logos, colors, and design tokens', icon: Palette, group: 'store' },
  { id: 'notifications', label: 'Notifications', description: 'Staff and customer alert preferences', icon: Bell, group: 'store' },
  
  // Sales Group
  { id: 'payments', label: 'Payments', description: 'Payment providers and settlement', icon: CreditCard, group: 'sales' },
  { id: 'shipping', label: 'Shipping', description: 'Rates, zones, and fulfillment rules', icon: Truck, group: 'sales' },
  { id: 'checkout', label: 'Checkout', description: 'Abandoned cart and customer accounts', icon: ShoppingBag, group: 'sales' },

  // Advanced Group
  { id: 'domains', label: 'Domains', description: 'Custom domains and DNS settings', icon: Globe, group: 'advanced' },
  { id: 'staff', label: 'Staff', description: 'Permissions and access control', icon: Shield, group: 'advanced' },
  { id: 'security', label: 'Security', description: '2FA, audit logs, and API keys', icon: Lock, group: 'advanced' },
];

export function AdminSettings() {
  useAdminPageTitle('Settings');
  const services = useServices();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('all');
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [progress, setProgress] = useState<SetupGuideProgress | null>(null);
  const [loading, setLoading] = useState(true);

  const [settings, setSettings] = useState<Record<string, any>>({});
  const [users, setUsers] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  const loadProgress = useCallback(async () => {
    try {
      const data = await services.settingsService.getSetupProgress();
      setProgress(data);
    } catch (err) {
      console.error('Failed to load setup progress', err);
    } finally {
      setLoading(false);
    }
  }, [services.settingsService]);

  const loadSettings = useCallback(async () => {
    try {
      const [data, staff] = await Promise.all([
        services.settingsService.getSettings(),
        services.authService.getAllUsers()
      ]);
      setSettings(data);
      setUsers(staff);
    } catch (err) {
      console.error('Failed to load settings', err);
    }
  }, [services]);

  const loadAuditLogs = useCallback(async () => {
    try {
      const logs = await services.auditService.getRecentLogs();
      setAuditLogs(logs);
    } catch (err) {
      console.error('Failed to load audit logs', err);
    }
  }, [services.auditService]);

  const loadUsers = useCallback(async () => {
    try {
      const allUsers = await services.authService.getAllUsers();
      setUsers(allUsers);
    } catch (err) {
      console.error('Failed to load users', err);
    }
  }, [services.authService]);

  useEffect(() => {
    void loadProgress();
    void loadSettings();
    void loadUsers();
    void loadAuditLogs();
  }, [loadProgress, loadSettings, loadUsers, loadAuditLogs]);

  const saveSetting = async (key: string, value: any) => {
    try {
      await services.settingsService.updateSetting(key, value);
      setSettings(prev => ({ ...prev, [key]: value }));
      toast('success', 'Setting updated');
      void loadProgress(); // Update setup guide
    } catch (err) {
      toast('error', 'Failed to save setting');
    }
  };

  const tasks = progress ? [
    { label: 'Add your first product', completed: progress.hasProducts },
    { label: 'Configure store name', completed: progress.hasStoreName },
    { label: 'Connect a payment provider', completed: progress.hasPaymentConfigured },
    { label: 'Set up shipping rates', completed: progress.hasShippingRates },
    { label: 'Choose a custom domain', completed: progress.hasCustomDomain },
  ] : [];

  const completionPercentage = progress ? Math.round((progress.completedCount / progress.totalCount) * 100) : 0;

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-20">
      <AdminPageHeader 
        title="Settings" 
        subtitle="Manage your store configuration and platform preferences"
      />

      <div className="flex items-center border-b px-2 overflow-x-auto scrollbar-hide">
        <AdminTab label="All Settings" active={activeTab === 'all'} onClick={() => setActiveTab('all')} />
        <AdminTab label="Store" active={activeTab === 'store'} onClick={() => setActiveTab('store')} />
        <AdminTab label="Sales" active={activeTab === 'sales'} onClick={() => setActiveTab('sales')} />
        <AdminTab label="Advanced" active={activeTab === 'advanced'} onClick={() => setActiveTab('advanced')} />
      </div>

      {/* ── Setup Checklist ── */}
      <section className="rounded-2xl border border-primary-100 bg-linear-to-br from-primary-50/50 to-white p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-widest">Setup Guide</h2>
            <p className="mt-1 text-xs text-gray-500 font-medium">Complete these steps to launch your store successfully.</p>
          </div>
          {!loading && progress && (
            <div className="text-right">
              <p className="text-xs font-bold text-primary-600 uppercase">{progress.completedCount} of {progress.totalCount} completed</p>
              <div className="mt-1.5 h-1.5 w-32 rounded-full bg-primary-100 overflow-hidden">
                <div className="h-full bg-primary-600 transition-all duration-1000" style={{ width: `${completionPercentage}%` }} />
              </div>
            </div>
          )}
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {loading && [1, 2, 3].map(i => (
             <div key={i} className="h-10 rounded-lg bg-gray-100 animate-pulse" />
          ))}
          {!loading && tasks.map((task, i) => (
            <div key={i} className="flex items-center gap-3 rounded-lg border bg-white p-3 transition hover:shadow-sm">
              {task.completed ? (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              ) : (
                <Circle className="h-4 w-4 text-gray-300" />
              )}
              <span className={`text-xs font-bold ${task.completed ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                {task.label}
              </span>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-12">
        {/* ── Store Group ── */}
        {(activeTab === 'all' || activeTab === 'store') && (
          <section>
            <div className="mb-6">
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-widest">Store Profile</h2>
              <p className="mt-1 text-xs text-gray-500 font-medium">Control the fundamental aspects of your storefront.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {SETTINGS_SECTIONS.filter(s => s.group === 'store').map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className="group flex items-start gap-4 rounded-xl border bg-white p-5 text-left shadow-sm transition hover:shadow-md hover:border-primary-200 active:scale-[0.98]"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-50 text-gray-400 group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors">
                    <section.icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-gray-900 group-hover:text-primary-700">{section.label}</p>
                    <p className="mt-1 text-xs text-gray-500 leading-relaxed font-medium">{section.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* ── Sales Group ── */}
        {(activeTab === 'all' || activeTab === 'sales') && (
          <section>
            <div className="mb-6">
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-widest">Sales & Logistics</h2>
              <p className="mt-1 text-xs text-gray-500 font-medium">Configure how you accept payments and deliver goods.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {SETTINGS_SECTIONS.filter(s => s.group === 'sales').map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className="group flex items-start gap-4 rounded-xl border bg-white p-5 text-left shadow-sm transition hover:shadow-md hover:border-primary-200 active:scale-[0.98]"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-50 text-gray-400 group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors">
                    <section.icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-gray-900 group-hover:text-primary-700">{section.label}</p>
                    <p className="mt-1 text-xs text-gray-500 leading-relaxed font-medium">{section.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* ── Advanced Group ── */}
        {(activeTab === 'all' || activeTab === 'advanced') && (
          <section>
            <div className="mb-6">
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-widest">Platform & Security</h2>
              <p className="mt-1 text-xs text-gray-500 font-medium">Manage infrastructure, domains, and access control.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {SETTINGS_SECTIONS.filter(s => s.group === 'advanced').map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className="group flex items-start gap-4 rounded-xl border bg-white p-5 text-left shadow-sm transition hover:shadow-md hover:border-primary-200 active:scale-[0.98]"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-50 text-gray-400 group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors">
                    <section.icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-gray-900 group-hover:text-primary-700">{section.label}</p>
                    <p className="mt-1 text-xs text-gray-500 leading-relaxed font-medium">{section.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* ── Help Footer ── */}
      <div className="rounded-xl border bg-gray-50 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm border text-primary-600">
            <Globe className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900">Need help configuring your store?</p>
            <p className="text-xs text-gray-500 font-medium">Check our documentation or contact our merchant support team.</p>
          </div>
        </div>
        <button className="rounded-lg bg-white border px-4 py-2 text-xs font-bold text-gray-700 shadow-sm hover:bg-gray-50 transition">
          View Guide
        </button>
      </div>

      {/* ── Settings Detail Slide-over ── */}
      {activeSection && (
        <>
          <div className="fixed inset-0 z-60 bg-gray-900/40 backdrop-blur-sm" onClick={() => setActiveSection(null)} />
          <div className="fixed inset-y-0 right-0 z-70 w-full max-w-2xl overflow-y-auto bg-white shadow-2xl animate-in slide-in-from-right duration-300 border-l">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-6 py-4">
              <div className="flex items-center gap-3">
                 <div className="h-8 w-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-500">
                   {activeSection === 'payments' ? <CreditCard className="h-4 w-4" /> : <Settings className="h-4 w-4" />}
                 </div>
                 <h2 className="text-lg font-bold text-gray-900 capitalize">{activeSection} Settings</h2>
              </div>
              <button 
                onClick={() => setActiveSection(null)}
                className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-900"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-8 space-y-10">
               {activeSection === 'general' ? (
                  <div className="space-y-8">
                    <div className="space-y-4">
                      <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest">Store Identity</h3>
                      <div className="grid gap-6">
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-700">Store Name</label>
                          <input 
                            type="text" 
                            defaultValue={settings.store_name || 'PlayMore TCG'} 
                            onChange={(e) => setSettings(prev => ({ ...prev, store_name: e.target.value }))}
                            className="w-full rounded-lg border bg-white px-4 py-2.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                            placeholder="e.g. PlayMore TCG"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-700">Merchant Name</label>
                          <input 
                            type="text" 
                            defaultValue={settings.merchant_name || 'PlayMore Retail Group'} 
                            onChange={(e) => setSettings(prev => ({ ...prev, merchant_name: e.target.value }))}
                            className="w-full rounded-lg border bg-white px-4 py-2.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                            placeholder="Legal business name"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest">Store Contact</h3>
                      <div className="grid gap-6">
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-700">Support Email</label>
                          <input 
                            type="email" 
                            defaultValue={settings.support_email || 'support@playmoretcg.com'} 
                            onChange={(e) => setSettings(prev => ({ ...prev, support_email: e.target.value }))}
                            className="w-full rounded-lg border bg-white px-4 py-2.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ) : activeSection === 'staff' ? (
                  <div className="space-y-8">
                    <div className="flex items-center justify-between">
                       <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest">Manage Staff</h3>
                       <button className="rounded-lg bg-gray-900 px-3 py-1.5 text-[10px] font-bold text-white shadow-sm hover:bg-gray-800 transition">
                         Invite Member
                       </button>
                    </div>
                    <div className="divide-y rounded-xl border bg-white overflow-hidden shadow-sm">
                      {users.map(user => (
                        <div key={user.id} className="flex items-center justify-between p-4 hover:bg-gray-50 transition">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-50 text-xs font-bold text-primary-600">
                              {user.displayName?.slice(0, 2).toUpperCase() || '??'}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-gray-900">{user.displayName}</p>
                              <p className="text-[10px] font-medium text-gray-500">{user.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${user.role === 'admin' ? 'bg-indigo-50 text-indigo-600' : 'bg-gray-100 text-gray-600'}`}>
                              {user.role}
                            </span>
                            <button className="text-gray-400 hover:text-gray-600">
                              <ChevronRight className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : activeSection === 'payments' ? (
                  <>
                    <div className="space-y-4">
                       <div className="flex items-center justify-between">
                          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest">Active Providers</h3>
                          <span className="flex items-center gap-2 text-[10px] font-bold text-green-600 uppercase">
                            <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                            Live Mode
                          </span>
                       </div>
                       <div className="rounded-xl border bg-gray-50/50 p-6 flex items-center justify-between">
                          <div className="flex items-center gap-4">
                             <div className="h-12 w-12 rounded-lg bg-[#635BFF] flex items-center justify-center text-white font-bold">Stripe</div>
                             <div>
                                <p className="text-sm font-bold text-gray-900">Stripe Payments {settings.payment_configured && <CheckCircle2 className="inline h-3 w-3 text-green-500 ml-1" />}</p>
                                <p className="text-xs text-gray-500 font-medium">Accept credit cards, Apple Pay, and Google Pay.</p>
                             </div>
                          </div>
                          <button 
                            onClick={() => saveSetting('payment_configured', !settings.payment_configured)}
                            className="text-[10px] font-bold text-primary-600 uppercase hover:underline"
                          >
                            {settings.payment_configured ? 'Disconnect' : 'Connect'}
                          </button>
                       </div>
                    </div>

                    <div className="space-y-4">
                       <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest">Payment Capture</h3>
                       <div className="space-y-3">
                          <label className="flex items-start gap-4 cursor-pointer">
                             <input type="radio" name="capture" defaultChecked className="mt-1 h-4 w-4 border-gray-300 text-primary-600 focus:ring-primary-500" />
                             <div>
                                <p className="text-sm font-bold text-gray-900">Automatically capture payment for orders</p>
                                <p className="text-xs text-gray-500 font-medium">Capture funds immediately when an order is placed.</p>
                             </div>
                          </label>
                          <label className="flex items-start gap-4 cursor-pointer">
                             <input type="radio" name="capture" className="mt-1 h-4 w-4 border-gray-300 text-primary-600 focus:ring-primary-500" />
                             <div>
                                <p className="text-sm font-bold text-gray-900">Manually capture payment for orders</p>
                                <p className="text-xs text-gray-500 font-medium">Authorizes funds and allows manual capture within 7 days.</p>
                             </div>
                          </label>
                       </div>
                    </div>

                    <div className="rounded-xl bg-amber-50 border border-amber-100 p-4">
                       <p className="text-xs text-amber-800 leading-relaxed font-medium">
                          <strong>Pro Tip:</strong> Manually capturing payments can reduce chargeback risk for high-ticket items, but adds friction to your fulfillment workflow.
                       </p>
                    </div>
                  </>
                 ) : activeSection === 'security' ? (
                   <div className="space-y-6">
                      <div className="flex items-center justify-between">
                         <h3 className="text-xs font-bold uppercase tracking-widest text-gray-900">Security Audit Trail</h3>
                         <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{auditLogs.length} entries recorded</span>
                      </div>
                      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
                         <AdminAuditLogs logs={auditLogs} />
                      </div>
                      <div className="rounded-xl bg-gray-50 border p-4">
                         <div className="flex gap-3">
                            <Shield className="h-4 w-4 text-primary-600 shrink-0 mt-0.5" />
                            <div className="space-y-1">
                               <p className="text-[10px] font-bold text-gray-900 uppercase tracking-widest">Forensic Integrity</p>
                               <p className="text-xs text-gray-500 leading-relaxed font-medium">
                                 Audit logs are cryptographically sealed and immutable. They provide a definitive source of truth for administrative actions.
                               </p>
                            </div>
                         </div>
                      </div>
                   </div>
                 ) : (
                  <div className="text-center py-20">
                     <div className="mx-auto h-16 w-16 rounded-full bg-gray-50 flex items-center justify-center text-gray-300 mb-4">
                        <Settings className="h-8 w-8" />
                     </div>
                     <p className="text-sm font-bold text-gray-900 italic">This section is currently under development.</p>
                     <p className="text-xs text-gray-500 mt-1">Check back soon for advanced configuration options.</p>
                  </div>
                )}
            </div>

            <div className="sticky bottom-0 bg-gray-50 border-t px-6 py-4 flex justify-end gap-3">
               <button onClick={() => setActiveSection(null)} className="rounded-lg border bg-white px-4 py-2 text-xs font-bold text-gray-700 shadow-sm transition hover:bg-gray-100">
                 Cancel
               </button>
               <button 
                  onClick={async () => { 
                    if (activeSection === 'general') {
                      await saveSetting('store_name', settings.store_name);
                      await saveSetting('merchant_name', settings.merchant_name);
                      await saveSetting('support_email', settings.support_email);
                    }
                    setActiveSection(null); 
                  }} 
                  className="rounded-lg bg-primary-600 px-6 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-primary-700"
                >
                 Save Changes
               </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
