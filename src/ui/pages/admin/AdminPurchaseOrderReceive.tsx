"use client";

/**
 * [LAYER: UI]
 * Focused logistics workspace for inventory intake sessions.
 * Designed for high-accuracy receiving with barcode scanner support.
 */
'use client';

import { useCallback, useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  ArrowLeft, 
  CheckCircle2, 
  Package, 
  Plus, 
  Search, 
  Save, 
  XCircle,
  AlertTriangle,
  Barcode,
  ClipboardList,
  Truck,
  Building2
} from 'lucide-react';
import { 
  useToast, 
  useAdminPageTitle,
  SkeletonPage,
  AdminStatusBadge
} from '../../components/admin/AdminComponents';
import { useServices } from '../../hooks/useServices';
import type { 
  PurchaseOrder, 
  PurchaseOrderReceivingSummary,
  ReceivingLineDisposition,
  ReceivingDiscrepancyReason
} from '@domain/models';

type ReceiveCondition = 'new' | 'damaged' | 'defective';

interface ReceivingLineState {
  purchaseOrderItemId: string;
  productId: string;
  productName: string;
  sku: string;
  orderedQty: number;
  alreadyReceived: number;
  toReceive: number;
  condition: ReceiveCondition;
  damagedQty: number;
  discrepancyReason?: ReceivingDiscrepancyReason;
  disposition: ReceivingLineDisposition;
  notes: string;
}

export function AdminPurchaseOrderReceive() {
  const { id } = useParams() as { id: string };
  useAdminPageTitle(`Receive PO ${id?.slice(0, 8)}`);
  const router = useRouter();
  const { toast } = useToast();
  const services = useServices();

  const [order, setOrder] = useState<PurchaseOrder | null>(null);
  const [summary, setSummary] = useState<PurchaseOrderReceivingSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Receiving Session State
  const [items, setItems] = useState<ReceivingLineState[]>([]);
  const [sessionNotes, setSessionNotes] = useState('');
  const [scannerMode, setScannerMode] = useState(false);
  const [scanInput, setScanInput] = useState('');
  const [scanFlash, setScanFlash] = useState<'success' | 'error' | null>(null);
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const controllerRef = useRef<AbortController | null>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  const receivingNow = items.reduce((sum, item) => sum + item.toReceive, 0);
  const exceptionLines = items.filter((item) => item.toReceive > 0 && (item.condition !== 'new' || item.damagedQty > 0 || item.disposition !== 'add_to_stock'));
  const stockableNow = items.reduce((sum, item) => {
    if (item.disposition !== 'add_to_stock') return sum;
    return sum + Math.max(0, item.toReceive - item.damagedQty);
  }, 0);

  const loadOrder = useCallback(async () => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    if (isMounted.current) setLoading(true);
    try {
      const detail = await services.purchaseOrderService.getGuided(id);
      if (!controller.signal.aborted && isMounted.current) {
        setOrder(detail.order);
        setSummary(detail.summary);
        
        // Initialize receiving lines
        const initialItems = detail.order.items.map((item: any) => ({
          purchaseOrderItemId: item.id,
          productId: item.productId,
          productName: item.productName,
          sku: item.sku || '',
          orderedQty: item.orderedQty,
          alreadyReceived: item.receivedQty,
          toReceive: 0,
          condition: 'new' as ReceiveCondition,
          damagedQty: 0,
          disposition: 'add_to_stock' as ReceivingLineDisposition,
          notes: ''
        }));
        setItems(initialItems);
      }
    } catch (err) {
      if (!controller.signal.aborted && isMounted.current) {
        toast('error', 'Failed to load purchase order');
      }
    } finally {
      if (!controller.signal.aborted && isMounted.current) {
        setLoading(false);
      }
    }
  }, [id, services, toast]);

  useEffect(() => {
    if (id) void loadOrder();
    return () => controllerRef.current?.abort();
  }, [id, loadOrder]);

  const handleScan = (e: React.FormEvent) => {
    e.preventDefault();
    const needle = scanInput.trim().toUpperCase();
    if (!needle) return;

    const index = items.findIndex(i => i.sku.toUpperCase() === needle || i.productId === scanInput);
    if (index !== -1) {
      const next = [...items];
      next[index].toReceive += 1;
      setItems(next);
      setScanFlash('success');
      setLastScanned(items[index].productName);
      setScanInput('');
    } else {
      setScanFlash('error');
      toast('error', `SKU ${needle} not found on this PO`);
      setScanInput('');
    }
    setTimeout(() => {
      if (isMounted.current) setScanFlash(null);
    }, 1000);
  };

  const handleReceive = async () => {
    const totalToReceive = items.reduce((sum, i) => sum + i.toReceive, 0);
    if (totalToReceive === 0) {
      toast('error', 'No items selected for receiving');
      return;
    }

    setIsSubmitting(true);
    try {
      await services.purchaseOrderService.receive(id, {
        idempotencyKey: crypto.randomUUID(),
        notes: sessionNotes || undefined,
        items: items.filter(i => i.toReceive > 0).map(i => ({
          purchaseOrderItemId: i.purchaseOrderItemId,
          receivedQty: i.toReceive,
          damagedQty: i.condition === 'new' ? i.damagedQty : Math.max(i.damagedQty, i.toReceive),
          condition: i.condition,
          discrepancyReason: (i.condition !== 'new' || i.damagedQty > 0) ? i.discrepancyReason : undefined,
          disposition: i.disposition,
          notes: i.notes || undefined
        }))
      });
      if (isMounted.current) {
        toast('success', `Successfully received ${totalToReceive} units`);
        router.push('/admin/purchase-orders');
        router.refresh();
      }
    } catch (err) {
      if (isMounted.current) {
        toast('error', err instanceof Error ? err.message : 'Receiving session failed');
      }
    } finally {
      if (isMounted.current) {
        setIsSubmitting(false);
      }
    }
  };

  if (loading || !order) return <SkeletonPage />;

  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-20 animate-in fade-in duration-500">
      {/* Header Strategy */}
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
            <div className="flex items-center gap-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Inventory Intake Session</p>
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[8px] font-bold uppercase tracking-widest text-emerald-700 ring-1 ring-emerald-100">Live Workspace</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Receive shipment #{id.slice(0, 8).toUpperCase()}</h1>
            <p className="mt-1 text-xs text-gray-500">Count what arrived, flag exceptions, then review the stock update before completing.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setScannerMode(!scannerMode)}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all shadow-sm ${scannerMode ? 'bg-gray-900 text-white ring-2 ring-gray-900 ring-offset-2' : 'bg-white border text-gray-700 hover:bg-gray-50'}`}
          >
            <Barcode className="h-4 w-4" />
            {scannerMode ? 'Scanner Active' : 'Enable Scanner'}
          </button>
          <button 
            onClick={handleReceive}
            disabled={isSubmitting}
            className="flex items-center gap-2 rounded-xl bg-primary-600 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-primary-500/20 transition hover:bg-primary-700 active:scale-95 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {isSubmitting ? 'Processing...' : 'Complete Session'}
          </button>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        <div className="lg:col-span-8 space-y-6">
          {scannerMode ? (
            <div className="flex flex-col items-center justify-center py-20 text-center rounded-3xl border-2 border-dashed border-primary-100 bg-primary-50/20 animate-in zoom-in-95 duration-300">
              <div className={`mb-8 flex h-24 w-24 items-center justify-center rounded-3xl transition-all duration-300 ${scanFlash === 'success' ? 'bg-green-100 text-green-600 scale-110 shadow-lg' : scanFlash === 'error' ? 'bg-red-100 text-red-600' : 'bg-white shadow-sm text-primary-600'}`}>
                <Barcode className="h-10 w-10" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 uppercase tracking-tight">Ready to Scan</h3>
              <p className="mt-2 max-w-sm text-sm text-gray-500 leading-relaxed">Place your cursor in the field below and scan a product barcode. We'll automatically identify the item and increment the count.</p>
              
              <form onSubmit={handleScan} className="mt-8 w-full max-w-md">
                <input
                  autoFocus
                  value={scanInput}
                  onChange={(e) => setScanInput(e.target.value)}
                  placeholder="Scan SKU or Product ID..."
                  className="w-full rounded-2xl border-2 border-gray-100 bg-white px-6 py-5 text-center text-2xl font-bold tracking-widest outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10"
                />
              </form>

              {lastScanned && (
                <div className="mt-8 animate-in fade-in slide-in-from-bottom-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Last Identified Item</p>
                  <p className="mt-1 text-xl font-bold text-gray-900">{lastScanned}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border bg-white p-5 shadow-sm">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Total Expected</p>
                  <p className="mt-1 text-2xl font-bold text-gray-900">{summary?.orderedQty || 0}</p>
                </div>
                <div className="rounded-2xl border bg-white p-5 shadow-sm">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Open Units</p>
                  <p className="mt-1 text-2xl font-bold text-primary-600">{summary?.openQty || 0}</p>
                </div>
                <div className="rounded-2xl border bg-white p-5 shadow-sm">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Receiving Now</p>
                  <p className="mt-1 text-2xl font-bold text-emerald-600">{receivingNow}</p>
                </div>
              </div>

              <div className="rounded-2xl border bg-white p-5 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                    <ClipboardList className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-primary-600">Session review</p>
                    <h2 className="mt-1 text-sm font-bold text-gray-900">{receivingNow} units counted · {stockableNow} will be added to stock</h2>
                    <p className="mt-1 text-xs text-gray-500">{exceptionLines.length > 0 ? `${exceptionLines.length} line${exceptionLines.length === 1 ? '' : 's'} need exception reasons before completion.` : 'No exceptions flagged. This shipment can be completed when counts look right.'}</p>
                  </div>
                </div>
              </div>

              <div className="divide-y rounded-2xl border bg-white shadow-sm overflow-hidden">
                {items.map((item, index) => {
                  const remaining = Math.max(0, item.orderedQty - item.alreadyReceived);
                  const needsReason = item.toReceive > 0 && (item.condition !== 'new' || item.damagedQty > 0);
                  
                  return (
                    <div key={item.purchaseOrderItemId} className={`p-6 transition-all ${item.toReceive > 0 ? 'bg-emerald-50/30' : ''}`}>
                      <div className="flex items-start justify-between gap-4 mb-6">
                        <div className="flex items-center gap-4">
                          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 text-gray-400">
                            <Package className="h-6 w-6" />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-gray-900">{item.productName}</h4>
                            <div className="mt-1 flex items-center gap-3">
                              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">SKU {item.sku}</span>
                              <span className="text-[10px] font-bold text-primary-600 uppercase tracking-widest">{remaining} Open Units</span>
                            </div>
                          </div>
                        </div>
                        {remaining === 0 && (
                          <span className="rounded-full bg-gray-100 px-3 py-1 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Received</span>
                        )}
                      </div>

                      <div className="grid gap-4 md:grid-cols-4">
                        <div>
                          <label className="text-[9px] font-black uppercase tracking-widest text-gray-400">Qty to Receive</label>
                          <input 
                            type="number"
                            min={0}
                            value={item.toReceive}
                            onChange={(e) => {
                              const next = [...items];
                              next[index].toReceive = parseInt(e.target.value) || 0;
                              setItems(next);
                            }}
                            className="mt-1.5 w-full rounded-xl border bg-gray-50 px-4 py-2.5 text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all" 
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-black uppercase tracking-widest text-gray-400">Condition</label>
                          <select 
                            value={item.condition}
                            onChange={(e) => {
                              const next = [...items];
                              next[index].condition = e.target.value as ReceiveCondition;
                              setItems(next);
                            }}
                            className="mt-1.5 w-full rounded-xl border bg-gray-50 px-4 py-2.5 text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                          >
                            <option value="new">Brand New</option>
                            <option value="damaged">Damaged</option>
                            <option value="defective">Defective</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[9px] font-black uppercase tracking-widest text-gray-400">Damaged Qty</label>
                          <input 
                            type="number"
                            min={0}
                            value={item.damagedQty}
                            onChange={(e) => {
                              const next = [...items];
                              next[index].damagedQty = parseInt(e.target.value) || 0;
                              setItems(next);
                            }}
                            className="mt-1.5 w-full rounded-xl border bg-gray-50 px-4 py-2.5 text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white" 
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-black uppercase tracking-widest text-gray-400">Disposition</label>
                          <select 
                            value={item.disposition}
                            onChange={(e) => {
                              const next = [...items];
                              next[index].disposition = e.target.value as ReceivingLineDisposition;
                              setItems(next);
                            }}
                            className="mt-1.5 w-full rounded-xl border bg-gray-50 px-4 py-2.5 text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                          >
                            <option value="add_to_stock">Add to Stock</option>
                            <option value="quarantine">Quarantine</option>
                            <option value="return_to_supplier">Return to Supplier</option>
                          </select>
                        </div>
                      </div>

                      {needsReason && (
                        <div className="mt-4 animate-in fade-in slide-in-from-top-2">
                          <label className="text-[9px] font-black uppercase tracking-widest text-amber-600">Exception Reason Required</label>
                          <select 
                            value={item.discrepancyReason}
                            onChange={(e) => {
                              const next = [...items];
                              next[index].discrepancyReason = e.target.value as ReceivingDiscrepancyReason;
                              setItems(next);
                            }}
                            className="mt-1.5 w-full rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs font-bold outline-none focus:ring-2 focus:ring-amber-500"
                          >
                            <option value="damaged_items">Damaged items</option>
                            <option value="missing_items">Missing items</option>
                            <option value="wrong_item">Wrong item</option>
                            <option value="supplier_substitution">Supplier substitution</option>
                            <option value="duplicate_shipment">Duplicate shipment</option>
                            <option value="overage">Extra quantity</option>
                            <option value="cost_mismatch">Cost mismatch</option>
                            <option value="other">Other</option>
                          </select>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Workspace Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">Partner Logistics</h3>
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-50 text-gray-400">
                <Building2 className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">{order.supplier}</p>
                <p className="text-[10px] font-medium text-gray-500 uppercase tracking-widest">Ref: {order.referenceNumber || 'N/A'}</p>
              </div>
            </div>
            {order.shippingCarrier && (
              <div className="mt-6 space-y-2 border-t pt-6">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-gray-500">Carrier</span>
                  <span className="text-gray-900">{order.shippingCarrier}</span>
                </div>
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-gray-500">Tracking</span>
                  <span className="text-gray-900 font-mono">{order.trackingNumber || 'N/A'}</span>
                </div>
              </div>
            )}
          </div>

          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Session Notes</h3>
            <textarea 
              value={sessionNotes}
              onChange={(e) => setSessionNotes(e.target.value)}
              rows={4}
              className="w-full rounded-xl border bg-gray-50 px-4 py-3 text-xs outline-none transition focus:ring-2 focus:ring-emerald-500 focus:bg-white" 
              placeholder="Record any discrepancies or shipment conditions here..." 
            />
          </div>

          <div className="rounded-2xl border bg-gray-900 p-6 text-white shadow-xl">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
              <Truck className="h-5 w-5 text-emerald-400" />
            </div>
            <h3 className="text-sm font-bold">Fulfillment Direct</h3>
            <p className="mt-2 text-[10px] leading-relaxed text-gray-400">
              Completing this session will immediately propagate stock updates to all active retail nodes and online storefronts.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
