"use client";

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
  UserCheck,
  Search,
  RefreshCw
} from 'lucide-react';
import { 
  AdminPageHeader, 
  useToast, 
  useAdminPageTitle,
  AdminAuditLogs
} from '../../components/admin/AdminComponents';
import type { User } from '@domain/models';

interface SecuritySectionProps {
  auditLogs: any[];
  setAuditLogs: (logs: any[]) => void;
  services: ReturnType<typeof useServices>;
  toast: (type: 'success' | 'error' | 'info', message: string) => void;
}

function SecuritySection({ auditLogs, setAuditLogs, services, toast }: SecuritySectionProps) {
  const [query, setQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [chainStatus, setChainStatus] = useState<{ valid: boolean; total: number; corruptedId?: string } | null>(null);

  const filteredLogs = auditLogs.filter(log => {
    const matchesQuery = !query || 
      log.userEmail?.toLowerCase().includes(query.toLowerCase()) ||
      log.action?.toLowerCase().includes(query.toLowerCase()) ||
      log.targetId?.toLowerCase().includes(query.toLowerCase()) ||
      JSON.stringify(log.details || '').toLowerCase().includes(query.toLowerCase());
    const matchesAction = !actionFilter || log.action === actionFilter;
    return matchesQuery && matchesAction;
  });

  const uniqueActions = [...new Set(auditLogs.map(l => l.action))].sort();

  async function handleVerifyChain() {
    setVerifying(true);
    setChainStatus(null);
    try {
      const result = await services.auditService.verifyChain();
      setChainStatus(result);
      toast(result.valid ? 'success' : 'error', 
        result.valid 
          ? `Chain intact — ${result.total} entries verified` 
          : `Corruption detected at entry ${result.corruptedId?.slice(0, 8)}`
      );
    } catch {
      toast('error', 'Failed to run chain verification');
    } finally {
      setVerifying(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search actor, action, target…"
              className="w-full rounded-xl border bg-gray-50 pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-500 transition"
            />
          </div>
          <select
            value={actionFilter}
            onChange={e => setActionFilter(e.target.value)}
            className="rounded-xl border bg-gray-50 px-3 py-2.5 text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-primary-500 transition"
          >
            <option value="">All Actions</option>
            {uniqueActions.map(a => (
              <option key={a} value={a}>{a.replace(/_/g, ' ')}</option>
            ))}
          </select>
        </div>
        <button
          onClick={handleVerifyChain}
          disabled={verifying}
          className="flex items-center gap-2 rounded-xl border bg-white px-4 py-2.5 text-xs font-bold text-gray-700 shadow-sm transition hover:bg-gray-50 active:scale-95 disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${verifying ? 'animate-spin' : ''}`} />
          {verifying ? 'Verifying…' : 'Verify Chain'}
        </button>
      </div>

      {/* Chain Status Banner */}
      {chainStatus && (
        <div className={`flex items-center gap-3 rounded-xl p-4 text-sm font-bold animate-in fade-in duration-300 ${
          chainStatus.valid ? 'bg-green-50 text-green-800 border border-green-100' : 'bg-red-50 text-red-800 border border-red-100'
        }`}>
          <Shield className="h-5 w-5 shrink-0" />
          {chainStatus.valid
            ? `Forensic chain verified — ${chainStatus.total} entries intact. No tampering detected.`
            : `CHAIN BREACH: Corruption at entry ${chainStatus.corruptedId}. Immediate review required.`
          }
        </div>
      )}

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase tracking-widest text-gray-900">Security Audit Trail</h3>
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
          {filteredLogs.length} of {auditLogs.length} entries
        </span>
      </div>

      {/* Logs Table */}
      <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
        <AdminAuditLogs logs={filteredLogs} />
      </div>

      {/* Forensic Integrity Banner */}
      <div className="rounded-2xl bg-gray-900 text-white p-6 shadow-xl">
        <div className="flex gap-4">
          <Shield className="h-6 w-6 text-primary-400 shrink-0" />
          <div className="space-y-2">
            <p className="text-sm font-bold uppercase tracking-widest">BroccoliQ Level 9 — Forensic Integrity</p>
            <p className="text-xs text-gray-400 leading-relaxed font-medium">
              Every audit entry is cryptographically sealed via SHA-256 chain hashing. Each record signs its predecessor, making the entire log tamper-evident. Run "Verify Chain" to confirm the complete log history has not been modified.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Shipping Manager
// ─────────────────────────────────────────────

import { Plus, Trash2, Edit3, Map as MapIcon, Layers, DollarSign } from 'lucide-react';
import type { ShippingClass, ShippingZone, ShippingRate } from '@domain/models';
import { formatCurrency } from '@utils/formatters';

interface ShippingManagerProps {
  services: ReturnType<typeof useServices>;
  toast: (type: 'success' | 'error' | 'info', message: string) => void;
}

function ShippingManager({ services, toast }: ShippingManagerProps) {
  const [classes, setClasses] = useState<ShippingClass[]>([]);
  const [zones, setZones] = useState<ShippingZone[]>([]);
  const [rates, setRates] = useState<ShippingRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'zones' | 'classes'>('zones');

  const loadShippingData = useCallback(async () => {
    setLoading(true);
    try {
      const [c, z, r] = await Promise.all([
        services.shippingService.getAllClasses(),
        services.shippingService.getAllZones(),
        services.shippingService.getAllRates(),
      ]);
      setClasses(c);
      setZones(z);
      setRates(r);
    } catch (err) {
      services.logger.error('Failed to load shipping data', err);
    } finally {
      setLoading(false);
    }
  }, [services]);

  useEffect(() => {
    void loadShippingData();
  }, [loadShippingData]);

  const handleAddZone = async () => {
    try {
      const user = await services.authService.getCurrentUser();
      const actor = { id: user?.id || 'unknown', email: user?.email || 'system' };
      await services.shippingService.saveZone({
        name: 'New Zone',
        countries: ['US'],
      }, actor);
      toast('success', 'Shipping zone added');
      void loadShippingData();
    } catch (err) {
      toast('error', 'Failed to add zone');
    }
  };

  const handleAddClass = async () => {
    try {
      const user = await services.authService.getCurrentUser();
      const actor = { id: user?.id || 'unknown', email: user?.email || 'system' };
      await services.shippingService.saveClass({
        name: 'New Shipping Class',
        isDefault: false,
      }, actor);
      toast('success', 'Shipping class added');
      void loadShippingData();
    } catch (err) {
      toast('error', 'Failed to add class');
    }
  };

  const handleDeleteZone = async (id: string) => {
    if (!confirm('Are you sure you want to delete this zone?')) return;
    try {
      const user = await services.authService.getCurrentUser();
      const actor = { id: user?.id || 'unknown', email: user?.email || 'system' };
      await services.shippingService.deleteZone(id, actor);
      toast('success', 'Zone deleted');
      void loadShippingData();
    } catch (err) {
      toast('error', 'Failed to delete zone');
    }
  };

  const handleDeleteClass = async (id: string) => {
    if (!confirm('Are you sure you want to delete this shipping class?')) return;
    try {
      const user = await services.authService.getCurrentUser();
      const actor = { id: user?.id || 'unknown', email: user?.email || 'system' };
      await services.shippingService.deleteClass(id, actor);
      toast('success', 'Shipping class deleted');
      void loadShippingData();
    } catch (err) {
      toast('error', 'Failed to delete class');
    }
  };

  const handleAddRate = async (zoneId: string, classId: string) => {
    try {
      const user = await services.authService.getCurrentUser();
      const actor = { id: user?.id || 'unknown', email: user?.email || 'system' };
      await services.shippingService.saveRate({
        shippingZoneId: zoneId,
        shippingClassId: classId,
        name: 'Standard Rate',
        type: 'flat',
        amount: 599,
      }, actor);
      toast('success', 'Shipping rate added');
      void loadShippingData();
    } catch (err) {
      toast('error', 'Failed to add rate');
    }
  };

  if (loading) return <div className="h-48 flex items-center justify-center animate-pulse text-gray-400">Syncing logistics engine...</div>;

  return (
    <div className="space-y-8">
      {/* Sub-tabs */}
      <div className="flex items-center gap-6 border-b">
        <button 
          onClick={() => setActiveTab('zones')}
          className={`pb-4 text-xs font-black uppercase tracking-widest transition ${activeTab === 'zones' ? 'text-primary-600 border-b-2 border-primary-600' : 'text-gray-400 hover:text-gray-600'}`}
        >
          Shipping Zones & Rates
        </button>
        <button 
          onClick={() => setActiveTab('classes')}
          className={`pb-4 text-xs font-black uppercase tracking-widest transition ${activeTab === 'classes' ? 'text-primary-600 border-b-2 border-primary-600' : 'text-gray-400 hover:text-gray-600'}`}
        >
          Shipping Classes
        </button>
      </div>

      {activeTab === 'zones' ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Zones & Rates</h3>
              <p className="text-xs text-gray-500 mt-1">Configure rates based on where the order is being shipped.</p>
            </div>
            <button 
              onClick={handleAddZone}
              className="flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-gray-800 transition active:scale-95"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Zone
            </button>
          </div>

          <div className="space-y-4">
            {zones.map(zone => (
              <div key={zone.id} className="rounded-2xl border bg-white overflow-hidden shadow-sm">
                <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-b">
                  <div className="flex items-center gap-3">
                    <MapIcon className="h-4 w-4 text-primary-500" />
                    <div>
                      <p className="text-sm font-bold text-gray-900">{zone.name}</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{zone.countries.join(', ')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="p-2 text-gray-400 hover:text-primary-600 transition">
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => handleDeleteZone(zone.id)}
                      className="p-2 text-gray-400 hover:text-red-600 transition"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  <div className="grid gap-4">
                    {classes.map(shippingClass => {
                      const classRates = rates.filter(r => r.shippingZoneId === zone.id && r.shippingClassId === shippingClass.id);
                      return (
                        <div key={shippingClass.id} className="space-y-3">
                          <div className="flex items-center justify-between border-b pb-2">
                            <span className="text-xs font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                              <Layers className="h-3 w-3" />
                              {shippingClass.name}
                            </span>
                            <button 
                              onClick={() => handleAddRate(zone.id, shippingClass.id)}
                              className="text-[10px] font-black uppercase tracking-widest text-primary-600 hover:underline"
                            >
                              Add Rate
                            </button>
                          </div>
                          <div className="grid gap-2">
                            {classRates.length > 0 ? classRates.map(rate => (
                              <div key={rate.id} className="flex items-center justify-between p-3 rounded-xl border bg-gray-50/50 hover:bg-white transition group">
                                <div className="flex items-center gap-3">
                                  <div className="h-8 w-8 rounded-lg bg-white border flex items-center justify-center text-primary-600">
                                    <DollarSign className="h-4 w-4" />
                                  </div>
                                  <div>
                                    <p className="text-sm font-bold text-gray-900">{rate.name}</p>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                                      {rate.type.replace('_', ' ')} {rate.minLimit ? `(over ${formatCurrency(rate.minLimit)})` : ''}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-4">
                                  <span className="text-sm font-black text-gray-900">{formatCurrency(rate.amount)}</span>
                                  <button className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-600 transition">
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </div>
                            )) : (
                              <p className="text-xs text-gray-400 italic">No rates defined for this class in this zone.</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Shipping Classes</h3>
              <p className="text-xs text-gray-500 mt-1">Group products that have similar shipping requirements (e.g. Heavy, Fragile).</p>
            </div>
            <button 
              onClick={handleAddClass}
              className="flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-gray-800 transition active:scale-95"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Class
            </button>
          </div>

          <div className="grid gap-4">
            {classes.map(shippingClass => (
              <div key={shippingClass.id} className="flex items-center justify-between p-5 rounded-2xl border bg-white shadow-sm hover:shadow-md transition">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center border border-primary-100">
                    <Layers className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-gray-900">{shippingClass.name}</p>
                      {shippingClass.isDefault && (
                        <span className="rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-black uppercase text-green-600 border border-green-100">Default</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1 font-medium">{shippingClass.description || 'No description provided.'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="p-2 text-gray-400 hover:text-primary-600 transition">
                    <Edit3 className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={() => handleDeleteClass(shippingClass.id)}
                    className="p-2 text-gray-400 hover:text-red-600 transition"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


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
      services.logger.error('Failed to load settings data', err);
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
                        defaultValue={settings.store_name || 'My Store'} 
                        onBlur={(e) => saveSetting('store_name', e.target.value)}
                        className="w-full rounded-xl border bg-gray-50 px-4 py-3 text-sm focus:bg-white focus:ring-2 focus:ring-primary-500 outline-none transition"
                        placeholder="e.g. Acme Corp"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-700">Merchant Name</label>
                      <input 
                        type="text" 
                        defaultValue={settings.merchant_name || ''} 
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
                      defaultValue={settings.support_email || ''} 
                      onBlur={(e) => saveSetting('support_email', e.target.value)}
                      className="w-full rounded-xl border bg-gray-50 px-4 py-3 text-sm focus:bg-white focus:ring-2 focus:ring-primary-500 outline-none transition"
                      placeholder="support@example.com"
                    />
                  </div>
                </div>
              </div>
            ) : sectionId === 'branding' ? (
               <div className="space-y-8">
                  <div className="space-y-4">
                     <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest border-b pb-2">Visual Identity</h3>
                     <div className="grid gap-6 sm:grid-cols-2">
                        <div className="space-y-2">
                           <label className="text-xs font-bold text-gray-700">Primary Brand Color</label>
                           <div className="flex gap-3">
                              <input 
                                type="color" 
                                defaultValue={settings.primary_color || '#2563eb'} 
                                onBlur={(e) => saveSetting('primary_color', e.target.value)}
                                className="h-10 w-10 cursor-pointer rounded-lg border-0 bg-transparent p-0"
                              />
                              <input 
                                type="text" 
                                defaultValue={settings.primary_color || '#2563eb'} 
                                onBlur={(e) => saveSetting('primary_color', e.target.value)}
                                className="flex-1 rounded-xl border bg-gray-50 px-4 py-2.5 text-sm font-mono focus:bg-white focus:ring-2 focus:ring-primary-500 outline-none transition"
                              />
                           </div>
                        </div>
                        <div className="space-y-2">
                           <label className="text-xs font-bold text-gray-700">Store Logo URL</label>
                           <input 
                             type="text" 
                             defaultValue={settings.logo_url || ''} 
                             onBlur={(e) => saveSetting('logo_url', e.target.value)}
                             placeholder="https://..."
                             className="w-full rounded-xl border bg-gray-50 px-4 py-2.5 text-sm focus:bg-white focus:ring-2 focus:ring-primary-500 outline-none transition"
                           />
                        </div>
                     </div>
                  </div>
                  <div className="rounded-2xl bg-gray-50 p-6 flex gap-4">
                     <Palette className="h-5 w-5 text-gray-400 shrink-0" />
                     <p className="text-xs text-gray-500 leading-relaxed font-medium">
                        Branding settings update your storefront and transaction emails in real-time. Use high-contrast colors for better accessibility.
                     </p>
                  </div>
               </div>
            ) : sectionId === 'notifications' ? (
               <div className="space-y-8">
                  <div className="space-y-4">
                     <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest border-b pb-2">Staff Notifications</h3>
                     <div className="space-y-3">
                        {[
                          { key: 'notify_new_order', label: 'New Order Alerts', desc: 'Receive an email for every successful purchase.' },
                          { key: 'notify_low_stock', label: 'Low Stock Warnings', desc: 'Get notified when products drop below 5 units.' },
                          { key: 'notify_risk_alert', label: 'High Risk Orders', desc: 'Alert staff when risk scores exceed 70.' }
                        ].map(item => (
                          <label key={item.key} className="flex items-center justify-between p-4 rounded-xl border bg-white hover:bg-gray-50 transition cursor-pointer">
                             <div>
                                <p className="text-sm font-bold text-gray-900">{item.label}</p>
                                <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                             </div>
                             <input 
                               type="checkbox" 
                               defaultChecked={settings[item.key] !== false}
                               onChange={(e) => saveSetting(item.key, e.target.checked)}
                               className="h-5 w-5 rounded-md border-gray-300 text-primary-600 focus:ring-primary-500"
                             />
                          </label>
                        ))}
                     </div>
                  </div>
               </div>
            ) : sectionId === 'staff' ? (

              <div className="space-y-8">
                <div className="flex items-center justify-between">
                   <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest">Manage Staff Members</h3>
                   <button 
                      onClick={() => router.push('/admin/customers/new')}
                      className="rounded-xl bg-gray-900 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-gray-800 transition active:scale-95"
                    >
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
                         <input 
                            type="radio" 
                            name="capture" 
                            checked={settings.payment_capture_mode !== 'manual'} 
                            onChange={() => saveSetting('payment_capture_mode', 'automatic')}
                            className="mt-1 h-4 w-4 border-gray-300 text-primary-600 focus:ring-primary-500" 
                          />
                         <div>
                            <p className="text-sm font-bold text-gray-900">Automatically capture payment for orders</p>
                            <p className="text-xs text-gray-500 font-medium mt-1">Funds are captured immediately when an order is placed.</p>
                         </div>
                      </label>
                      <label className="group relative flex cursor-pointer items-start gap-4 rounded-2xl border p-5 transition hover:bg-gray-50 has-checked:border-primary-500 has-checked:bg-primary-50/30">
                         <input 
                            type="radio" 
                            name="capture" 
                            checked={settings.payment_capture_mode === 'manual'}
                            onChange={() => saveSetting('payment_capture_mode', 'manual')}
                            className="mt-1 h-4 w-4 border-gray-300 text-primary-600 focus:ring-primary-500" 
                          />
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
             ) : sectionId === 'shipping' ? (
               <ShippingManager services={services} toast={toast} />

             ) : sectionId === 'security' ? (
               <SecuritySection
                 auditLogs={auditLogs}
                 setAuditLogs={setAuditLogs}
                 services={services}
                 toast={toast}
               />

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
