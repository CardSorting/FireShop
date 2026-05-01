'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  ArrowLeft, 
  Save, 
  Trash2, 
  Tag, 
  Plus, 
  Calendar, 
  Users, 
  Zap, 
  CheckCircle2, 
  AlertCircle,
  Package,
  Layers,
  Percent,
  DollarSign,
  Truck,
  RotateCcw,
  Check,
  Search,
  X
} from 'lucide-react';
import { useServices } from '../../hooks/useServices';
import { 
  AdminPageHeader, 
  useToast, 
  AdminConfirmDialog,
  AdminStatusBadge 
} from '../../components/admin/AdminComponents';
import type { 
  Discount, 
  DiscountDraft, 
  DiscountType, 
  DiscountSelectionType,
  DiscountRequirementType,
  DiscountEligibilityType 
} from '@domain/models';
import { formatCurrency } from '@utils/formatters';

export function AdminDiscountForm() {
  const { id } = useParams() as { id?: string };
  const isEditing = !!id;
  const router = useRouter();
  const services = useServices();
  const { toast } = useToast();

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Form State
  const [code, setCode] = useState('');
  const [type, setType] = useState<DiscountType>('percentage');
  const [value, setValue] = useState<string>('10');
  const [isAutomatic, setIsAutomatic] = useState(false);
  const [selectionType, setSelectionType] = useState<DiscountSelectionType>('all_products');
  const [requirementType, setRequirementType] = useState<DiscountRequirementType>('none');
  const [minAmount, setMinAmount] = useState<string>('0');
  const [minQuantity, setMinQuantity] = useState<string>('1');
  const [eligibilityType, setEligibilityType] = useState<DiscountEligibilityType>('everyone');
  const [usageLimit, setUsageLimit] = useState<string | null>(null);
  const [oncePerCustomer, setOncePerCustomer] = useState(false);
  const [startsAt, setStartsAt] = useState<string>(new Date().toISOString().split('T')[0]);
  const [endsAt, setEndsAt] = useState<string | null>(null);
  const [hasEndDate, setHasEndDate] = useState(false);

  useEffect(() => {
    if (isEditing) {
      void loadDiscount();
    }
  }, [id]);

  async function loadDiscount() {
    try {
      const discount = await services.discountService.getAllDiscounts().then(list => list.find(d => d.id === id));
      if (!discount) {
        toast('error', 'Discount not found');
        router.push('/admin/discounts');
        return;
      }
      setCode(discount.code);
      setType(discount.type);
      setValue(discount.type === 'fixed' ? (discount.value / 100).toString() : discount.value.toString());
      setIsAutomatic(discount.isAutomatic);
      setSelectionType(discount.selectionType);
      setRequirementType(discount.minimumRequirementType);
      setMinAmount(discount.minimumAmount ? (discount.minimumAmount / 100).toString() : '0');
      setMinQuantity(discount.minimumQuantity?.toString() || '1');
      setEligibilityType(discount.eligibilityType);
      setUsageLimit(discount.usageLimit?.toString() || null);
      setOncePerCustomer(discount.oncePerCustomer);
      setStartsAt(new Date(discount.startsAt).toISOString().split('T')[0]);
      if (discount.endsAt) {
        setEndsAt(new Date(discount.endsAt).toISOString().split('T')[0]);
        setHasEndDate(true);
      }
    } catch (err) {
      toast('error', 'Failed to load discount');
    } finally {
      setLoading(false);
    }
  }

  const summary = useMemo(() => {
    let text = '';
    if (type === 'percentage') text = `${value || 0}% off`;
    else if (type === 'fixed') text = `${formatCurrency(parseFloat(value || '0') * 100)} off`;
    else text = 'Free shipping';

    if (selectionType === 'all_products') text += ' all products';
    else if (selectionType === 'specific_products') text += ' specific products';
    else text += ' specific collections';

    if (requirementType === 'minimum_amount') text += ` · Minimum purchase of ${formatCurrency(parseFloat(minAmount || '0') * 100)}`;
    else if (requirementType === 'minimum_quantity') text += ` · Minimum of ${minQuantity || 1} items`;

    if (eligibilityType === 'everyone') text += ' · Everyone';
    else text += ' · Targeted segment';

    return text;
  }, [type, value, selectionType, requirementType, minAmount, minQuantity, eligibilityType]);

  async function handleSave() {
    setSaving(true);
    try {
      const user = await services.authService.getCurrentUser();
      const actor = { id: user?.id || 'admin', email: user?.email || 'admin@playmore.tcg' };

      const payload: DiscountDraft = {
        code: code.toUpperCase(),
        type,
        value: type === 'fixed' ? Math.round(parseFloat(value) * 100) : parseFloat(value),
        status: 'active',
        isAutomatic,
        selectionType,
        selectedProductIds: [],
        selectedCollectionIds: [],
        minimumRequirementType: requirementType,
        minimumAmount: requirementType === 'minimum_amount' ? Math.round(parseFloat(minAmount) * 100) : null,
        minimumQuantity: requirementType === 'minimum_quantity' ? parseInt(minQuantity) : null,
        eligibilityType,
        eligibleCustomerIds: [],
        eligibleCustomerSegments: [],
        usageLimit: usageLimit ? parseInt(usageLimit) : null,
        oncePerCustomer,
        combinesWith: {
          orderDiscounts: false,
          productDiscounts: false,
          shippingDiscounts: false,
        },
        startsAt: new Date(startsAt),
        endsAt: hasEndDate && endsAt ? new Date(endsAt) : null,
      };

      if (isEditing) {
        await services.discountService.updateDiscount(id!, payload, actor);
        toast('success', 'Discount updated');
      } else {
        await services.discountService.createDiscount(payload, actor);
        toast('success', 'Discount created');
        router.push('/admin/discounts');
      }
    } catch (err) {
      toast('error', 'Failed to save discount');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setSaving(true);
    try {
      const user = await services.authService.getCurrentUser();
      await services.discountService.deleteDiscount(id!, { id: user?.id || 'admin', email: user?.email || 'admin@playmore.tcg' });
      toast('success', 'Discount deleted');
      router.push('/admin/discounts');
    } catch (err) {
      toast('error', 'Failed to delete discount');
      setSaving(false);
    }
  }

  function generateCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCode(result);
  }

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-24 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="rounded-xl border bg-white p-2.5 text-gray-400 transition hover:bg-gray-50 hover:text-gray-900 shadow-sm active:scale-95">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-xl font-black text-gray-900 tracking-tight">{isEditing ? `Edit ${code}` : 'Create Discount'}</h1>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{isEditing ? 'Update promotion details' : 'Configure a new promotional campaign'}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isEditing && (
            <button 
              onClick={() => setShowDeleteConfirm(true)}
              className="rounded-xl border border-red-100 bg-white px-4 py-2.5 text-xs font-bold text-red-600 shadow-sm transition hover:bg-red-50 active:scale-95"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
          <button 
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-gray-900 px-6 py-2.5 text-xs font-bold text-white shadow-lg transition hover:bg-gray-800 active:scale-95 disabled:opacity-50"
          >
            {saving ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <Save className="h-4 w-4" />}
            {isEditing ? 'Save changes' : 'Create discount'}
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section: General */}
          <section className="rounded-2xl border bg-white shadow-sm overflow-hidden">
            <div className="border-b bg-gray-50/50 px-6 py-4 flex items-center justify-between">
               <h2 className="text-xs font-black uppercase tracking-widest text-gray-900">Discount Method</h2>
               {isAutomatic ? <AdminStatusBadge status="active" type="order" /> : <AdminStatusBadge status="active" type="order" />}
            </div>
            <div className="p-6 space-y-6">
               <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => setIsAutomatic(false)}
                    className={`flex flex-col items-start gap-3 rounded-xl border p-4 text-left transition ${!isAutomatic ? 'bg-primary-50 border-primary-200 ring-1 ring-primary-500' : 'hover:bg-gray-50'}`}
                  >
                    <div className={`rounded-lg p-2 ${!isAutomatic ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
                      <Tag className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-gray-900 uppercase">Discount code</p>
                      <p className="text-[10px] font-medium text-gray-500">Customers enter code at checkout</p>
                    </div>
                  </button>
                  <button 
                    onClick={() => setIsAutomatic(true)}
                    className={`flex flex-col items-start gap-3 rounded-xl border p-4 text-left transition ${isAutomatic ? 'bg-primary-50 border-primary-200 ring-1 ring-primary-500' : 'hover:bg-gray-50'}`}
                  >
                    <div className={`rounded-lg p-2 ${isAutomatic ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
                      <Zap className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-gray-900 uppercase">Automatic discount</p>
                      <p className="text-[10px] font-medium text-gray-500">Applied automatically in cart</p>
                    </div>
                  </button>
               </div>

               {!isAutomatic && (
                 <div className="space-y-2">
                    <div className="flex items-center justify-between">
                       <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Discount Code</label>
                       <button onClick={generateCode} className="text-[10px] font-black uppercase tracking-widest text-primary-600 hover:underline">Generate code</button>
                    </div>
                    <input 
                      value={code} 
                      onChange={(e) => setCode(e.target.value.toUpperCase())}
                      placeholder="e.g. SUMMERPLAY20"
                      className="w-full rounded-xl border bg-gray-50 px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-primary-500 outline-none transition uppercase tracking-widest"
                    />
                    <p className="text-[10px] font-medium text-gray-500">Customers will enter this at checkout.</p>
                 </div>
               )}
            </div>
          </section>

          {/* Section: Value */}
          <section className="rounded-2xl border bg-white shadow-sm overflow-hidden">
             <div className="border-b bg-gray-50/50 px-6 py-4">
                <h2 className="text-xs font-black uppercase tracking-widest text-gray-900">Value</h2>
             </div>
             <div className="p-6 space-y-6">
                <div className="flex gap-4">
                   <button onClick={() => setType('percentage')} className={`flex-1 rounded-xl border py-3 text-xs font-bold transition ${type === 'percentage' ? 'bg-primary-50 border-primary-500 text-primary-700' : 'text-gray-500 hover:bg-gray-50'}`}>Percentage</button>
                   <button onClick={() => setType('fixed')} className={`flex-1 rounded-xl border py-3 text-xs font-bold transition ${type === 'fixed' ? 'bg-primary-50 border-primary-500 text-primary-700' : 'text-gray-500 hover:bg-gray-50'}`}>Fixed amount</button>
                   <button onClick={() => setType('free_shipping')} className={`flex-1 rounded-xl border py-3 text-xs font-bold transition ${type === 'free_shipping' ? 'bg-primary-50 border-primary-500 text-primary-700' : 'text-gray-500 hover:bg-gray-50'}`}>Free shipping</button>
                </div>

                {type !== 'free_shipping' && (
                  <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-top-2">
                     <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Discount Value</label>
                        <div className="relative">
                           <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                              {type === 'percentage' ? <Percent className="h-4 w-4" /> : <DollarSign className="h-4 w-4" />}
                           </div>
                           <input 
                              type="number"
                              value={value}
                              onChange={(e) => setValue(e.target.value)}
                              className="w-full rounded-xl border bg-gray-50 pl-10 pr-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-primary-500 outline-none"
                           />
                        </div>
                     </div>
                  </div>
                )}

                <div className="space-y-4 pt-4 border-t border-dashed">
                   <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Applies to</label>
                   <div className="space-y-3">
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <div className="relative flex items-center justify-center">
                           <input type="radio" checked={selectionType === 'all_products'} onChange={() => setSelectionType('all_products')} className="peer h-5 w-5 appearance-none rounded-full border-2 border-gray-300 checked:border-primary-600 transition" />
                           <div className="absolute h-2.5 w-2.5 rounded-full bg-primary-600 scale-0 peer-checked:scale-100 transition" />
                        </div>
                        <span className="text-xs font-bold text-gray-700">All products</span>
                      </label>
                      <label className="flex items-center gap-3 group opacity-50 cursor-not-allowed">
                        <div className="relative flex items-center justify-center">
                           <input disabled type="radio" checked={selectionType === 'specific_collections'} onChange={() => setSelectionType('specific_collections')} className="peer h-5 w-5 appearance-none rounded-full border-2 border-gray-300 checked:border-primary-600 transition" />
                           <div className="absolute h-2.5 w-2.5 rounded-full bg-primary-600 scale-0 peer-checked:scale-100 transition" />
                        </div>
                        <span className="text-xs font-bold text-gray-700">Specific collections (Pro feature)</span>
                      </label>
                      <label className="flex items-center gap-3 group opacity-50 cursor-not-allowed">
                        <div className="relative flex items-center justify-center">
                           <input disabled type="radio" checked={selectionType === 'specific_products'} onChange={() => setSelectionType('specific_products')} className="peer h-5 w-5 appearance-none rounded-full border-2 border-gray-300 checked:border-primary-600 transition" />
                           <div className="absolute h-2.5 w-2.5 rounded-full bg-primary-600 scale-0 peer-checked:scale-100 transition" />
                        </div>
                        <span className="text-xs font-bold text-gray-700">Specific products (Pro feature)</span>
                      </label>
                   </div>
                </div>
             </div>
          </section>

          {/* Section: Requirements */}
          <section className="rounded-2xl border bg-white shadow-sm overflow-hidden">
             <div className="border-b bg-gray-50/50 px-6 py-4">
                <h2 className="text-xs font-black uppercase tracking-widest text-gray-900">Minimum Requirements</h2>
             </div>
             <div className="p-6 space-y-4">
                <div className="space-y-3">
                   {[
                     { id: 'none', label: 'No minimum requirements' },
                     { id: 'minimum_amount', label: 'Minimum purchase amount ($)' },
                     { id: 'minimum_quantity', label: 'Minimum quantity of items' }
                   ].map((opt) => (
                     <label key={opt.id} className="flex items-center gap-3 cursor-pointer">
                        <div className="relative flex items-center justify-center">
                           <input 
                              type="radio" 
                              checked={requirementType === opt.id} 
                              onChange={() => setRequirementType(opt.id as any)} 
                              className="peer h-5 w-5 appearance-none rounded-full border-2 border-gray-300 checked:border-primary-600 transition" 
                           />
                           <div className="absolute h-2.5 w-2.5 rounded-full bg-primary-600 scale-0 peer-checked:scale-100 transition" />
                        </div>
                        <span className="text-xs font-bold text-gray-700">{opt.label}</span>
                     </label>
                   ))}
                </div>

                {requirementType === 'minimum_amount' && (
                  <div className="pt-2 animate-in slide-in-from-top-2">
                     <div className="relative max-w-[200px]">
                        <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                           <DollarSign className="h-4 w-4" />
                        </div>
                        <input 
                           type="number"
                           value={minAmount}
                           onChange={(e) => setMinAmount(e.target.value)}
                           className="w-full rounded-xl border bg-gray-50 pl-10 pr-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-primary-500 outline-none"
                        />
                     </div>
                  </div>
                )}

                {requirementType === 'minimum_quantity' && (
                  <div className="pt-2 animate-in slide-in-from-top-2">
                     <div className="relative max-w-[200px]">
                        <input 
                           type="number"
                           value={minQuantity}
                           onChange={(e) => setMinQuantity(e.target.value)}
                           className="w-full rounded-xl border bg-gray-50 px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-primary-500 outline-none"
                        />
                     </div>
                  </div>
                )}
             </div>
          </section>

          {/* Section: Customer Eligibility */}
          <section className="rounded-2xl border bg-white shadow-sm overflow-hidden">
             <div className="border-b bg-gray-50/50 px-6 py-4">
                <h2 className="text-xs font-black uppercase tracking-widest text-gray-900">Customer Eligibility</h2>
             </div>
             <div className="p-6 space-y-4">
                <div className="space-y-3">
                   <label className="flex items-center gap-3 cursor-pointer">
                      <div className="relative flex items-center justify-center">
                         <input type="radio" checked={eligibilityType === 'everyone'} onChange={() => setEligibilityType('everyone')} className="peer h-5 w-5 appearance-none rounded-full border-2 border-gray-300 checked:border-primary-600 transition" />
                         <div className="absolute h-2.5 w-2.5 rounded-full bg-primary-600 scale-0 peer-checked:scale-100 transition" />
                      </div>
                      <span className="text-xs font-bold text-gray-700">Everyone</span>
                   </label>
                   <label className="flex items-center gap-3 opacity-50 cursor-not-allowed">
                      <div className="relative flex items-center justify-center">
                         <input disabled type="radio" checked={eligibilityType === 'specific_customers'} onChange={() => setEligibilityType('specific_customers')} className="peer h-5 w-5 appearance-none rounded-full border-2 border-gray-300 checked:border-primary-600 transition" />
                         <div className="absolute h-2.5 w-2.5 rounded-full bg-primary-600 scale-0 peer-checked:scale-100 transition" />
                      </div>
                      <span className="text-xs font-bold text-gray-700">Specific customers</span>
                   </label>
                </div>
             </div>
          </section>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
           {/* Summary Card */}
           <div className="sticky top-6 space-y-6">
              <section className="rounded-2xl border border-gray-900 bg-gray-900 p-6 text-white shadow-xl">
                 <h2 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">Summary</h2>
                 <div className="space-y-4">
                    <div className="flex items-start gap-3">
                       <div className="rounded-lg bg-white/10 p-2"><Tag className="h-4 w-4" /></div>
                       <div>
                          <p className="text-sm font-black tracking-tight">{code || 'No code yet'}</p>
                          <p className="text-[10px] font-bold text-gray-400 uppercase">{isAutomatic ? 'Automatic' : 'Code'} Discount</p>
                       </div>
                    </div>
                    <div className="border-t border-white/10 pt-4">
                       <p className="text-xs font-medium text-gray-300 leading-relaxed italic">"{summary}"</p>
                    </div>
                    <div className="space-y-2 border-t border-white/10 pt-4">
                       <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-gray-400">
                          <span>Performance</span>
                          <span className="text-primary-400">Active</span>
                       </div>
                       <div className="flex items-center justify-between">
                          <span className="text-xs font-medium">Used</span>
                          <span className="text-xs font-black">0 times</span>
                       </div>
                    </div>
                 </div>
              </section>

              {/* Usage Limits */}
              <section className="rounded-2xl border bg-white shadow-sm overflow-hidden">
                 <div className="border-b bg-gray-50/50 px-6 py-4">
                    <h2 className="text-xs font-black uppercase tracking-widest text-gray-900">Usage Limits</h2>
                 </div>
                 <div className="p-6 space-y-4">
                    <label className="flex items-center gap-3 cursor-pointer">
                       <input 
                         type="checkbox" 
                         checked={!!usageLimit} 
                         onChange={(e) => setUsageLimit(e.target.checked ? '100' : null)}
                         className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500" 
                       />
                       <span className="text-xs font-bold text-gray-700">Limit number of times this discount can be used in total</span>
                    </label>
                    {usageLimit && (
                      <div className="pl-7 animate-in slide-in-from-left-2">
                        <input 
                          type="number" 
                          value={usageLimit} 
                          onChange={(e) => setUsageLimit(e.target.value)}
                          className="w-full rounded-xl border bg-gray-50 px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-primary-500 outline-none" 
                        />
                      </div>
                    )}
                    <label className="flex items-center gap-3 cursor-pointer">
                       <input 
                         type="checkbox" 
                         checked={oncePerCustomer}
                         onChange={(e) => setOncePerCustomer(e.target.checked)}
                         className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500" 
                       />
                       <span className="text-xs font-bold text-gray-700">Limit to one use per customer</span>
                    </label>
                 </div>
              </section>

              {/* Active Dates */}
              <section className="rounded-2xl border bg-white shadow-sm overflow-hidden">
                 <div className="border-b bg-gray-50/50 px-6 py-4">
                    <h2 className="text-xs font-black uppercase tracking-widest text-gray-900">Active Dates</h2>
                 </div>
                 <div className="p-6 space-y-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Start Date</label>
                       <div className="relative">
                          <Calendar className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <input 
                            type="date" 
                            value={startsAt}
                            onChange={(e) => setStartsAt(e.target.value)}
                            className="w-full rounded-xl border bg-gray-50 pl-10 pr-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-primary-500 outline-none" 
                          />
                       </div>
                    </div>
                    <div className="space-y-4">
                       <label className="flex items-center gap-3 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={hasEndDate} 
                            onChange={(e) => {
                              setHasEndDate(e.target.checked);
                              if (e.target.checked && !endsAt) setEndsAt(new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0]);
                            }}
                            className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500" 
                          />
                          <span className="text-xs font-bold text-gray-700">Set end date</span>
                       </label>
                       {hasEndDate && (
                         <div className="space-y-2 animate-in slide-in-from-top-2">
                            <div className="relative">
                               <Calendar className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                               <input 
                                 type="date" 
                                 value={endsAt || ''}
                                 onChange={(e) => setEndsAt(e.target.value)}
                                 className="w-full rounded-xl border bg-gray-50 pl-10 pr-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-primary-500 outline-none" 
                               />
                            </div>
                         </div>
                       )}
                    </div>
                 </div>
              </section>
           </div>
        </div>
      </div>

      <AdminConfirmDialog 
        open={showDeleteConfirm} 
        onClose={() => setShowDeleteConfirm(false)} 
        onConfirm={handleDelete} 
        title="Delete discount?" 
        description="This action cannot be undone. Any customers currently using this code will no longer be able to apply it." 
        confirmLabel="Delete" 
        variant="danger" 
        loading={saving}
      />
    </div>
  );
}
