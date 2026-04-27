'use client';

/**
 * [LAYER: UI]
 * Admin order detail page — Full-width fulfillment console.
 */
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useServices } from '../../hooks/useServices';
import type { Order, OrderStatus, OrderNote, OrderItem, Address } from '@domain/models';
import {
  ChevronDown,
  Printer,
  X,
  Shield,
  AlertTriangle,
  CheckCircle2,
  ShoppingBag,
  ArrowLeft,
  Calendar,
  User,
  CreditCard,
  MapPin,
  Clock,
  Truck
} from 'lucide-react';
import { formatCurrency, formatShortDate, humanizeOrderStatus, formatRelativeTime } from '@utils/formatters';
import { nextOrderActionLabel } from '@domain/rules';
import {
  AdminPageHeader,
  AdminStatusBadge,
  useToast,
  useAdminPageTitle
} from '../../components/admin/AdminComponents';

const NEXT_STATUSES: Record<OrderStatus, OrderStatus[]> = {
  pending: ['pending', 'confirmed', 'cancelled'],
  confirmed: ['confirmed', 'shipped', 'cancelled'],
  shipped: ['shipped', 'delivered'],
  delivered: ['delivered'],
  cancelled: ['cancelled'],
};

interface AdminOrderDetailProps {
  id: string;
}

export function AdminOrderDetail({ id }: AdminOrderDetailProps) {
  useAdminPageTitle(`Order #${id.slice(0, 8).toUpperCase()}`);
  const services = useServices();
  const { toast } = useToast();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [noteInput, setNoteInput] = useState('');

  const loadOrder = useCallback(async () => {
    setLoading(true);
    try {
      const found = await services.orderService.getAdminOrder(id);
      if (found) {
        setOrder(found);
      } else {
        toast('error', 'Order not found');
        router.push('/admin/orders');
      }
    } catch (err) {
      toast('error', 'Failed to load order details');
    } finally {
      setLoading(false);
    }
  }, [id, services.orderService, router, toast]);


  useEffect(() => {
    void loadOrder();
  }, [loadOrder]);

  async function handleStatusChange(status: OrderStatus) {
    if (!order) return;
    setUpdating(true);
    try {
      const user = await services.authService.getCurrentUser();
      const actor = { id: user?.id || 'unknown', email: user?.email || 'system' };
      await services.orderService.updateOrderStatus(order.id, status, actor);
      toast('success', `Order updated to ${humanizeOrderStatus(status)}`);
      setOrder(prev => prev ? { ...prev, status } : null);
    } catch (err) {
      toast('error', err instanceof Error ? err.message : 'Failed to update order status');
    } finally {
      setUpdating(false);
    }
  }

  async function handlePostNote() {
    if (!noteInput.trim() || !order) return;
    try {
      const user = await services.authService.getCurrentUser();
      const actor = { id: user?.id || 'unknown', email: user?.email || 'system' };
      const newNote = await services.orderService.addOrderNote(order.id, noteInput, actor);
      setOrder(prev => prev ? { ...prev, notes: [...prev.notes, newNote] } : null);
      setNoteInput('');
      toast('success', 'Note added to timeline');
    } catch (err) {
      toast('error', 'Failed to save note');
    }
  }

  async function handleUpdateFulfillment(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!order) return;
    const formData = new FormData(e.currentTarget);
    const data = {
      trackingNumber: formData.get('trackingNumber') as string,
      shippingCarrier: formData.get('shippingCarrier') as string,
    };
    try {
      const user = await services.authService.getCurrentUser();
      const actor = { id: user?.id || 'unknown', email: user?.email || 'system' };
      await services.orderService.updateOrderFulfillment(order.id, data, actor);
      setOrder(prev => prev ? { ...prev, ...data } : null);
      toast('success', 'Fulfillment updated');
    } catch (err) {
      toast('error', 'Failed to update fulfillment');
    }
  }

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  if (!order) return null;

  return (
    <div className="space-y-8 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => router.push('/admin/orders')}
          className="group flex h-10 w-10 items-center justify-center rounded-full border bg-white shadow-sm transition hover:bg-gray-50"
        >
          <ArrowLeft className="h-5 w-5 text-gray-500 transition-transform group-hover:-translate-x-0.5" />
        </button>
        <AdminPageHeader
          title={`Order #${order.id.slice(0, 8).toUpperCase()}`}
          subtitle={`Placed on ${formatShortDate(order.createdAt)}`}
          actions={
            <button 
              onClick={() => toast('info', 'Generating packing slip...')}
              className="flex items-center gap-2 rounded-lg border bg-white px-4 py-2 text-xs font-bold text-gray-700 shadow-sm transition hover:bg-gray-50 active:scale-95"
            >
              <Printer className="h-4 w-4" />
              Print Packing Slip
            </button>
          }
        />
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Items Card */}
          <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
            <div className="border-b px-6 py-4 bg-gray-50/50 flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-widest text-gray-900">Order Items</h3>
              <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-bold text-gray-600">
                {order.items.length} items
              </span>
            </div>
            <div className="divide-y divide-gray-100">
              {order.items.map((item) => (
                <div key={item.productId} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50/50 transition">
                  <div className="h-12 w-12 rounded-lg border bg-gray-50 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">{item.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{formatCurrency(item.unitPrice)} × {item.quantity}</p>
                  </div>
                  <p className="text-sm font-bold text-gray-900 tracking-tight">{formatCurrency(item.unitPrice * item.quantity)}</p>
                </div>
              ))}
            </div>
            <div className="bg-gray-50/80 px-6 py-6 border-t">
              <div className="max-w-xs ml-auto space-y-3">
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>Subtotal</span>
                  <span>{formatCurrency(order.total)}</span>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>Shipping</span>
                  <span>Calculated at checkout</span>
                </div>
                <div className="flex items-center justify-between text-lg font-bold text-gray-900 border-t pt-3 mt-3">
                  <span>Total Paid</span>
                  <span className="tracking-tight">{formatCurrency(order.total)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Timeline / Notes */}
          <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
            <div className="border-b px-6 py-4 bg-gray-50/50">
              <h3 className="text-sm font-bold uppercase tracking-widest text-gray-900">Activity Timeline</h3>
            </div>
            <div className="p-8">
              <div className="relative space-y-8 pl-8">
                <div className="absolute left-[1.05rem] top-2 bottom-2 w-px bg-gray-100" />

                <div className="relative">
                  <div className="absolute left-[-2.15rem] mt-1.5 h-4 w-4 rounded-full border-2 border-white bg-green-500 shadow-sm" />
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-gray-900">Payment captured</p>
                    <span className="text-xs font-medium text-gray-400 uppercase">{formatShortDate(order.createdAt)}</span>
                  </div>
                  <p className="text-xs text-gray-500 font-medium mt-1">Transaction ID: {order.paymentTransactionId || 'pi_3Kj9X...'}</p>
                </div>

                <div className="relative">
                  <div className="absolute left-[-2.15rem] mt-1.5 h-4 w-4 rounded-full border-2 border-white bg-blue-500 shadow-sm" />
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-gray-900">Order placed</p>
                    <span className="text-xs font-medium text-gray-400 uppercase">{formatShortDate(order.createdAt)}</span>
                  </div>
                </div>

                {order.notes.map((note) => (
                  <div key={note.id} className="relative animate-in slide-in-from-left-2 duration-300">
                    <div className="absolute left-[-2.15rem] mt-1.5 h-4 w-4 rounded-full border-2 border-white bg-gray-400 shadow-sm" />
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold text-gray-900">Note by {note.authorEmail}</p>
                      <span className="text-xs font-medium text-gray-400 uppercase">{formatRelativeTime(new Date(note.createdAt))}</span>
                    </div>
                    <div className="mt-2 rounded-xl bg-amber-50/50 p-4 text-sm text-amber-900 italic leading-relaxed border border-amber-100/50 shadow-xs">
                      {note.text}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-10 flex gap-3">
                <input
                  value={noteInput}
                  onChange={(e) => setNoteInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handlePostNote()}
                  placeholder="Add a comment or note to the timeline…"
                  className="flex-1 rounded-xl border bg-gray-50 px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-primary-500 transition"
                />
                <button
                  onClick={handlePostNote}
                  disabled={!noteInput.trim()}
                  className="rounded-xl bg-gray-900 px-6 py-3 text-sm font-bold text-white transition hover:bg-gray-800 disabled:opacity-30 active:scale-95"
                >
                  Comment
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Status & Actions Card */}
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400">Order Status</h3>
              <AdminStatusBadge status={order.status} type="order" />
            </div>

            {NEXT_STATUSES[order.status].length > 1 ? (
              <div className="space-y-4">
                <button
                  disabled={updating}
                  className="w-full rounded-xl bg-primary-600 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-primary-700 active:scale-95 disabled:opacity-50"
                  onClick={() => {
                    const next = NEXT_STATUSES[order.status].find(s => s !== order.status);
                    if (next) handleStatusChange(next);
                  }}
                >
                  {updating ? 'Updating...' : nextOrderActionLabel(order.status)}
                </button>
                <div className="relative">
                  <select
                    disabled={updating}
                    value={order.status}
                    onChange={(e) => handleStatusChange(e.target.value as OrderStatus)}
                    className="w-full appearance-none rounded-xl border bg-white px-4 py-3 pr-10 text-sm font-bold text-gray-700 shadow-sm outline-none focus:ring-2 focus:ring-primary-500 transition"
                  >
                    {NEXT_STATUSES[order.status].map((status) => (
                      <option key={status} value={status}>{humanizeOrderStatus(status)}</option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                </div>
              </div>
            ) : (
              <div className="rounded-xl bg-green-50 border border-green-100 p-4">
                <p className="text-sm font-bold text-green-800 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Order completed
                </p>
                <p className="text-xs text-green-700 mt-1">This order has reached its final status.</p>
              </div>
            )}
          </div>

          {/* Fulfillment Card */}
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Truck className="h-4 w-4 text-primary-500" />
              <h3 className="text-xs font-bold uppercase tracking-widest text-gray-900">Logistics & Tracking</h3>
            </div>
            <form onSubmit={handleUpdateFulfillment} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Shipping Carrier</label>
                <select 
                  name="shippingCarrier"
                  defaultValue={order.shippingCarrier || ''}
                  className="w-full rounded-xl border bg-gray-50 px-3 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-primary-500 transition"
                >
                  <option value="">Select Carrier</option>
                  <option value="USPS">USPS</option>
                  <option value="UPS">UPS</option>
                  <option value="FedEx">FedEx</option>
                  <option value="DHL">DHL</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tracking Number</label>
                <input 
                  name="trackingNumber"
                  type="text"
                  defaultValue={order.trackingNumber || ''}
                  placeholder="e.g. 1Z999..."
                  className="w-full rounded-xl border bg-gray-50 px-3 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-primary-500 transition"
                />
              </div>
              <button 
                type="submit"
                className="w-full rounded-xl border bg-white px-4 py-2 text-xs font-bold text-gray-700 shadow-sm transition hover:bg-gray-50 active:scale-95"
              >
                Update Logistics
              </button>
            </form>
          </div>

          {/* Risk Card */}
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary-500" />
                <h3 className="text-xs font-bold uppercase tracking-widest text-gray-900">Fraud Analysis</h3>
              </div>
              <span className={`flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full ${
                order.riskScore > 60 ? 'bg-red-50 text-red-600' : 
                order.riskScore > 30 ? 'bg-amber-50 text-amber-600' : 
                'bg-green-50 text-green-600'
              }`}>
                {order.riskScore > 60 ? 'High Risk' : order.riskScore > 30 ? 'Elevated Risk' : 'Normal Risk'}
              </span>
            </div>
            <div className="space-y-3">
               <div className="flex items-center justify-between text-xs">
                 <span className="text-gray-500 font-medium">Card verification (CVC)</span>
                 <span className="text-gray-900 font-bold">Passed</span>
               </div>
               <div className="flex items-center justify-between text-xs">
                 <span className="text-gray-500 font-medium">Zip code verification</span>
                 <span className="text-gray-900 font-bold">Match</span>
               </div>
            </div>
          </div>

          {/* Customer & Shipping Cards */}
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-gray-400">Customer</h3>
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-600 font-bold text-sm uppercase">
                {(order.customerName || 'U').split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-gray-900 truncate">{order.customerName || 'Anonymous User'}</p>
                <p className="text-xs font-medium text-gray-500 truncate">{order.customerEmail}</p>
              </div>
            </div>
            <button 
              onClick={() => router.push(`/admin/customers/${order.userId}`)}
              className="mt-6 w-full rounded-xl border px-4 py-2.5 text-xs font-bold text-gray-700 shadow-sm transition hover:bg-gray-50"
            >
              View Customer Profile
            </button>
          </div>

          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-gray-400">Shipping Address</h3>
            <div className="space-y-1 text-sm text-gray-700 font-medium">
              <p>{order.shippingAddress.street}</p>
              <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zip}</p>
            </div>
            <div className="mt-6 flex items-center gap-2 text-xs font-bold text-primary-600 cursor-pointer hover:underline">
              <MapPin className="h-3.5 w-3.5" />
              View on Google Maps
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
