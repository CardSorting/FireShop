'use client';

/**
 * [LAYER: UI]
 * Admin settings — Store configuration and setup checklist.
 * Patterns modeled after Stripe and Shopify Settings.
 */
import { useState } from 'react';
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
  ShoppingBag
} from 'lucide-react';
import { 
  AdminPageHeader, 
  useToast, 
  useAdminPageTitle,
  AdminTab 
} from '../../components/admin/AdminComponents';

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
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('all');

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
          <div className="text-right">
            <p className="text-xs font-bold text-primary-600 uppercase">2 of 5 completed</p>
            <div className="mt-1.5 h-1.5 w-32 rounded-full bg-primary-100 overflow-hidden">
              <div className="h-full bg-primary-600 transition-all duration-1000" style={{ width: '40%' }} />
            </div>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { label: 'Add your first product', completed: true },
            { label: 'Configure store name', completed: true },
            { label: 'Connect a payment provider', completed: false },
            { label: 'Set up shipping rates', completed: false },
            { label: 'Choose a custom domain', completed: false },
          ].map((task, i) => (
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
                  onClick={() => toast('info', `${section.label} — coming soon`)}
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
                  onClick={() => toast('info', `${section.label} — coming soon`)}
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
                  onClick={() => toast('info', `${section.label} — coming soon`)}
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
    </div>
  );
}
