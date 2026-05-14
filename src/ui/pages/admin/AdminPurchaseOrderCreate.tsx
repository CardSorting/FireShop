"use client";

/**
 * [LAYER: UI]
 * Dedicated full-width workspace for creating purchase orders.
 * Optimized for complex data entry and multi-line items.
 */
'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Plus, 
  Save, 
  Search, 
  Trash2, 
  Truck, 
  AlertTriangle,
  ClipboardList
} from 'lucide-react';
import { 
  useToast, 
  useAdminPageTitle,
  AdminStatusBadge
} from '../../components/admin/AdminComponents';
import Image from 'next/image';
import { sanitizeImageUrl } from '@utils/sanitizer';
import { useServices } from '../../hooks/useServices';
import { 
  centsToDecimalInput, 
  formatCurrency, 
  parseCurrencyToCents 
} from '@utils/formatters';
import type { Product } from '@domain/models';

export function AdminPurchaseOrderCreate() {
  useAdminPageTitle('Draft Purchase Order');
  const router = useRouter();
  const { toast } = useToast();
  const services = useServices();

  // PO Header State
  const [supplier, setSupplier] = useState('');
  const [reference, setReference] = useState('');
  const [carrier, setCarrier] = useState('');
  const [tracking, setTracking] = useState('');
  const [expectedAt, setExpectedAt] = useState('');
  const [notes, setNotes] = useState('');

  // Item Selection State
  const [productQuery, setProductQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [items, setItems] = useState<Array<{ product: Product; orderedQty: number; unitCostInput: string; notes?: string }>>([]);
  
  // UI State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const loadProducts = useCallback(async (query: string) => {
    setIsSearching(true);
    try {
      const result = await services.productService.getProducts({ query, limit: 12 });
      setProducts(result.products);
    } catch (err) {
      toast('error', 'Failed to search products');
    } finally {
      setIsSearching(false);
    }
  }, [services, toast]);

  useEffect(() => {
    void loadProducts('');
  }, [loadProducts]);

  const addProduct = (product: Product) => {
    if (items.some((item) => item.product.id === product.id)) {
      toast('info', 'Product already in order');
      return;
    }
    setItems([...items, { 
      product, 
      orderedQty: 1, 
      unitCostInput: centsToDecimalInput(product.cost ?? 0) 
    }]);
  };

  const updateItem = (index: number, updates: Partial<{ orderedQty: number; unitCostInput: string; notes: string }>) => {
    setItems(items.map((item, itemIndex) => itemIndex === index ? { ...item, ...updates } : item));
  };

  const totalCost = items.reduce((sum, item) => sum + item.orderedQty * parseCurrencyToCents(item.unitCostInput), 0);

  const handleSave = async (markOrdered = false) => {
    if (!supplier.trim()) { toast('error', 'Supplier is required'); return; }
    if (items.length === 0) { toast('error', 'Add items to this order'); return; }
    
    setIsSubmitting(true);
    try {
      const created = await services.purchaseOrderService.create({
        supplier,
        referenceNumber: reference || undefined,
        shippingCarrier: carrier || undefined,
        trackingNumber: tracking || undefined,
        expectedAt: expectedAt ? new Date(expectedAt) : undefined,
        notes: notes || undefined,
        items: items.map((item) => ({
          productId: item.product.id,
          orderedQty: item.orderedQty,
          unitCost: parseCurrencyToCents(item.unitCostInput),
          notes: item.notes || undefined,
        })),
      });
      if (markOrdered) {
        await services.purchaseOrderService.submit(created.id);
      }
      toast('success', markOrdered ? 'Stock order created and marked as ordered' : 'Purchase order draft created');
      router.push('/admin/purchase-orders');
      router.refresh();
    } catch (err) {
      toast('error', err instanceof Error ? err.message : 'Failed to create PO');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Sticky Header Strategy (Shopify Style) */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            type="button"
            onClick={() => router.back()}
            className="flex h-10 w-10 items-center justify-center rounded-xl border bg-white text-gray-400 shadow-sm transition hover:bg-gray-50 hover:text-gray-600 active:scale-95"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-primary-600">Inventory intake</p>
            <h1 className="text-2xl font-bold text-gray-900">Order stock</h1>
            <p className="mt-1 text-xs text-gray-500">Create a Shopify-style supplier order before receiving inventory.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-4 border-r pr-4 text-right sm:flex">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Total Value</p>
              <p className="text-sm font-black text-gray-900">{formatCurrency(totalCost)}</p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={() => router.back()}
            className="rounded-xl px-4 py-2 text-xs font-bold text-gray-500 hover:bg-gray-100 transition"
          >
            Discard
          </button>
          <button 
            onClick={() => handleSave(false)}
            disabled={isSubmitting}
            className="flex items-center gap-2 rounded-xl bg-primary-600 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-primary-500/20 transition hover:bg-primary-700 active:scale-95 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {isSubmitting ? 'Saving...' : 'Save Draft'}
          </button>
          <button 
            onClick={() => handleSave(true)}
            disabled={isSubmitting}
            className="hidden items-center gap-2 rounded-xl bg-gray-900 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-gray-900/10 transition hover:bg-black active:scale-95 disabled:opacity-50 sm:flex"
          >
            <Truck className="h-4 w-4" />
            Save & mark ordered
          </button>
        </div>
      </div>

      <div className="grid gap-3 rounded-2xl border bg-white p-4 shadow-sm sm:grid-cols-4">
        {[
          ['1', 'Supplier', supplier ? 'Selected' : 'Choose vendor'],
          ['2', 'Products', `${items.length} line${items.length === 1 ? '' : 's'}`],
          ['3', 'Costs', formatCurrency(totalCost)],
          ['4', 'Arrival', expectedAt || 'Optional'],
        ].map(([step, label, value]) => (
          <div key={step} className="flex items-center gap-3 rounded-xl bg-gray-50 p-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-[10px] font-black text-primary-600 shadow-sm ring-1 ring-gray-100">{step}</span>
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">{label}</p>
              <p className="text-xs font-bold text-gray-900">{value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        {/* Main Workspace */}
        <div className="space-y-6 lg:col-span-8">
          {/* Card: Supplier & Logic */}
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                <ClipboardList className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-gray-900">Order Information</h3>
            </div>
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Supplier</label>
                <input 
                  value={supplier}
                  onChange={(e) => setSupplier(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border bg-gray-50 px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-primary-500 focus:bg-white" 
                  placeholder="Select or enter supplier name..." 
                />
                <p className="mt-2 text-[10px] font-medium text-gray-400">Tip: use the same supplier names you manage under Suppliers so staff can recognize inbound shipments quickly.</p>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Reference #</label>
                <input 
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border bg-gray-50 px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-primary-500 focus:bg-white" 
                  placeholder="PO-XXXXX" 
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Expected Date</label>
                <input 
                  type="date"
                  value={expectedAt}
                  onChange={(e) => setExpectedAt(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border bg-gray-50 px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-primary-500 focus:bg-white" 
                />
              </div>
            </div>
          </div>

          {/* Card: Line Items */}
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <Plus className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-bold text-gray-900">Products & Quantities</h3>
              </div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{items.length} line items added</span>
            </div>

            <div className="space-y-4">
              {items.map((item, index) => (
                <div key={item.product.id} className="group relative rounded-2xl border bg-white p-5 transition-all hover:shadow-md hover:border-primary-200">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl border bg-gray-50 shadow-xs relative">
                        <Image 
                          src={sanitizeImageUrl(item.product.imageUrl)} 
                          alt="" 
                          fill 
                          className="object-cover" 
                          sizes="48px"
                        />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-gray-900">{item.product.name}</h4>
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mt-0.5">SKU: {item.product.sku}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setItems(items.filter((_, i) => i !== index))}
                      className="rounded-xl p-2 text-gray-300 transition hover:bg-red-50 hover:text-red-500 active:scale-95"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                  
                  <div className="mt-6 grid gap-4 sm:grid-cols-[120px_140px_1fr]">
                    <div>
                      <label className="text-[9px] font-black uppercase tracking-widest text-gray-400">Order Qty</label>
                      <input 
                        type="number"
                        min={1}
                        value={item.orderedQty}
                        onChange={(e) => updateItem(index, { orderedQty: parseInt(e.target.value) || 0 })}
                        className="mt-1 w-full rounded-xl border bg-gray-50 px-4 py-2.5 text-xs font-bold outline-none transition focus:ring-2 focus:ring-primary-500 focus:bg-white" 
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-black uppercase tracking-widest text-gray-400">Unit Cost ($)</label>
                      <input 
                        value={item.unitCostInput}
                        onChange={(e) => updateItem(index, { unitCostInput: e.target.value })}
                        className="mt-1 w-full rounded-xl border bg-gray-50 px-4 py-2.5 text-xs font-bold outline-none transition focus:ring-2 focus:ring-primary-500 focus:bg-white" 
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-black uppercase tracking-widest text-gray-400">Line Note</label>
                      <input 
                        value={item.notes || ''}
                        onChange={(e) => updateItem(index, { notes: e.target.value })}
                        className="mt-1 w-full rounded-xl border bg-gray-50 px-4 py-2.5 text-xs outline-none transition focus:ring-2 focus:ring-primary-500 focus:bg-white" 
                        placeholder="e.g. Promo pricing, special packaging..."
                      />
                    </div>
                  </div>
                </div>
              ))}

              {items.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-50 text-gray-300">
                    <Plus className="h-8 w-8" />
                  </div>
                  <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Add products from the sidebar</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar: Discovery & Logistics */}
        <div className="space-y-6 lg:col-span-4">
          {/* Card: Product Search */}
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Product Search</h3>
              {isSearching && <span className="h-3 w-3 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />}
            </div>
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input 
                value={productQuery}
                onChange={(e) => { setProductQuery(e.target.value); loadProducts(e.target.value); }}
                className="w-full rounded-xl border bg-gray-50 py-2.5 pl-9 pr-3 text-sm outline-none transition focus:ring-2 focus:ring-primary-500 focus:bg-white" 
                placeholder="Name or SKU..." 
              />
            </div>
            <div className="grid gap-2 max-h-[400px] overflow-y-auto pr-2 scrollbar-hide">
              {products.map(product => (
                <button 
                  key={product.id}
                  onClick={() => addProduct(product)}
                  className="flex items-center justify-between rounded-xl border bg-white p-3 text-left transition hover:border-primary-500 hover:shadow-sm active:scale-95"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg border bg-gray-50 relative">
                      <Image 
                        src={sanitizeImageUrl(product.imageUrl)} 
                        alt="" 
                        fill 
                        className="object-cover" 
                        sizes="40px"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold text-gray-900">{product.name}</p>
                      <p className="text-[8px] font-black uppercase tracking-widest text-gray-400">Stock: {product.stock}</p>
                    </div>
                  </div>
                  <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-gray-100 text-gray-400 group-hover:bg-primary-600 group-hover:text-white transition-colors">
                    <Plus className="h-3 w-3" />
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Card: Logistics */}
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">Logistics</h3>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-gray-600">Carrier</label>
                <input 
                  value={carrier}
                  onChange={(e) => setCarrier(e.target.value)}
                  className="mt-1 w-full rounded-xl border bg-gray-50 px-4 py-2 text-xs outline-none focus:ring-2 focus:ring-primary-500" 
                  placeholder="e.g. FedEx" 
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-600">Tracking #</label>
                <input 
                  value={tracking}
                  onChange={(e) => setTracking(e.target.value)}
                  className="mt-1 w-full rounded-xl border bg-gray-50 px-4 py-2 text-xs outline-none focus:ring-2 focus:ring-primary-500" 
                  placeholder="Enter tracking..." 
                />
              </div>
            </div>
          </div>

          {/* Card: Notes */}
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Internal Memo</h3>
            <textarea 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full rounded-xl border bg-gray-50 px-4 py-3 text-xs outline-none transition focus:ring-2 focus:ring-primary-500 focus:bg-white" 
              placeholder="Private notes for staff..." 
            />
          </div>
        </div>
      </div>
    </div>
  );
}
