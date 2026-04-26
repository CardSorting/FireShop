'use client';

/**
 * [LAYER: UI]
 * Admin settings — Store configuration and setup checklist.
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
  UserCheck
} from 'lucide-react';
import { AdminPageHeader, useToast, useAdminPageTitle } from '../../components/admin/AdminComponents';

interface SetupStep {
  id: string;
  label: string;
  description: string;
  icon: typeof Store;
  completed: boolean;
  href?: string;
}

const SETUP_STEPS: SetupStep[] = [
  { id: 'products', label: 'Add your first product', description: 'List at least one item in your catalog.', icon: Store, completed: true, href: '/admin/products/new' },
  { id: 'shipping', label: 'Configure shipping', description: 'Set up shipping zones, rates, and carriers.', icon: Truck, completed: false },
  { id: 'payments', label: 'Set up payments', description: 'Connect a payment processor to accept orders.', icon: CreditCard, completed: false },
  { id: 'domain', label: 'Add a custom domain', description: 'Connect your own domain for a professional storefront.', icon: Globe, completed: false },
  { id: 'branding', label: 'Customize your store', description: 'Upload a logo and set your brand colors.', icon: Palette, completed: false },
];

interface SettingsSection {
  id: string;
  label: string;
  description: string;
  icon: typeof Store;
}

const SETTINGS_SECTIONS: SettingsSection[] = [
  { id: 'general', label: 'General', description: 'Store name, address, and contact info', icon: Store },
  { id: 'payments', label: 'Payments', description: 'Payment providers and checkout settings', icon: CreditCard },
  { id: 'shipping', label: 'Shipping & delivery', description: 'Rates, zones, and fulfillment preferences', icon: Truck },
  { id: 'notifications', label: 'Notifications', description: 'Email templates and alert preferences', icon: Bell },
  { id: 'permissions', label: 'Permissions', description: 'Staff accounts and access control', icon: Shield },
  { id: 'email', label: 'Customer emails', description: 'Order confirmation and marketing templates', icon: Mail },
];

export function AdminSettings() {
  useAdminPageTitle('Settings');
  const { toast } = useToast();
  const completedCount = SETUP_STEPS.filter(s => s.completed).length;
  const progressPct = Math.round((completedCount / SETUP_STEPS.length) * 100);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <AdminPageHeader 
        title="Settings" 
        subtitle="Manage your store configuration and preferences."
      />

      {/* ── Setup Checklist ── */}
      <section className="rounded-2xl border bg-white shadow-sm overflow-hidden">
        <div className="border-b bg-gradient-to-r from-primary-50 to-purple-50 px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-gray-900">Setup guide</h2>
              <p className="mt-0.5 text-xs text-gray-500">
                {completedCount} of {SETUP_STEPS.length} tasks completed
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-primary-700">{progressPct}%</span>
              <div className="h-2 w-32 overflow-hidden rounded-full bg-primary-100">
                <div 
                  className="h-full rounded-full bg-gradient-to-r from-primary-500 to-primary-600 transition-all duration-500" 
                  style={{ width: `${progressPct}%` }} 
                />
              </div>
            </div>
          </div>
        </div>
        <div className="divide-y divide-gray-50">
          {SETUP_STEPS.map((step) => {
            const Icon = step.icon;
            return (
              <div key={step.id} className="flex items-center gap-4 px-6 py-4 transition hover:bg-gray-50">
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                  step.completed ? 'bg-green-100' : 'bg-gray-100'
                }`}>
                  {step.completed 
                    ? <CheckCircle2 className="h-4 w-4 text-green-600" /> 
                    : <Circle className="h-4 w-4 text-gray-300" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${step.completed ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                    {step.label}
                  </p>
                  <p className="text-xs text-gray-500">{step.description}</p>
                </div>
                {!step.completed && (
                  <button 
                    onClick={() => toast('info', `${step.label} — coming soon`)}
                    className="shrink-0 rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-200"
                  >
                    Set up
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Settings Grid ── */}
      <section>
        <h2 className="mb-4 text-sm font-semibold text-gray-900">Store settings</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {SETTINGS_SECTIONS.map((section) => {
            const Icon = section.icon;
            return (
              <button
                key={section.id}
                onClick={() => toast('info', `${section.label} settings — coming soon`)}
                className="group flex items-start gap-4 rounded-2xl border bg-white p-5 text-left shadow-sm transition hover:shadow-md hover:border-gray-200 active:scale-[0.98]"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-500 transition group-hover:bg-primary-50 group-hover:text-primary-600">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-900 group-hover:text-primary-700">{section.label}</p>
                  <p className="mt-0.5 text-xs text-gray-500 leading-relaxed">{section.description}</p>
                </div>
                <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-gray-300 transition group-hover:text-gray-500" />
              </button>
            );
          })}
        </div>
      </section>

      {/* ── Store info card ── */}
      <section className="rounded-2xl border bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-gray-900">Store information</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-medium text-gray-500">Store name</label>
            <p className="mt-1 text-sm font-medium text-gray-900">PlayMoreTCG</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500">Store URL</label>
            <div className="mt-1 flex items-center gap-1.5">
              <p className="text-sm font-medium text-primary-600">playmoretcg.com</p>
              <ExternalLink className="h-3 w-3 text-gray-400" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500">Contact email</label>
            <p className="mt-1 text-sm text-gray-600">admin@playmoretcg.com</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500">Plan</label>
            <div className="mt-1 flex items-center gap-2">
              <p className="text-sm font-medium text-gray-900">Pro</p>
              <span className="rounded-full bg-primary-50 px-2 py-0.5 text-[10px] font-semibold text-primary-700">Active</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Team Management (Shopify Style) ── */}
      <section className="rounded-2xl border bg-white shadow-sm">
        <div className="border-b px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Staff & permissions</h2>
            <p className="text-xs text-gray-500">Manage who can access and edit your store.</p>
          </div>
          <button 
            onClick={() => toast('info', 'Add staff flow coming soon')}
            className="rounded-xl border border-gray-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
          >
            Add staff member
          </button>
        </div>
        <div className="divide-y divide-gray-50">
          {[
            { name: 'Admin User', email: 'admin@playmoretcg.com', role: 'Owner', lastActive: 'Now' },
            { name: 'Sarah Miller', email: 'sarah@example.com', role: 'Staff (Fulfillment)', lastActive: '2h ago' },
            { name: 'Mike Chen', email: 'mike@example.com', role: 'Staff (Catalog)', lastActive: 'Yesterday' },
          ].map((member) => (
            <div key={member.email} className="flex items-center justify-between px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gray-100 text-gray-500">
                  <UserCheck className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{member.name}</p>
                  <p className="text-xs text-gray-500">{member.email}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs font-medium text-gray-900">{member.role}</p>
                <p className="text-[10px] text-gray-400">Active {member.lastActive}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
