'use client';

/**
 * [LAYER: UI]
 */
import Link from 'next/link';
import {
  ArrowRight,
  CheckCircle,
  ExternalLink,
  HelpCircle,
  Mail,
  MapPin,
  Package,
  Printer,
  ReceiptText,
  ShieldCheck,
  ShoppingBag,
  Trash2,
  Truck,
  RotateCcw,
  Download,
  FileText,
} from 'lucide-react';
import type { Order } from '@domain/models';
import { formatDate, formatMoney, estimateDelivery } from '@utils/formatters';
import { useCart } from '../hooks/useCart';
import { logger } from '@utils/logger';
import { useState } from 'react';

interface OrderConfirmationProps {
  order: Order;
  userEmail: string;
  userName?: string;
  context?: 'confirmation' | 'detail';
}

const STATUS_STEPS = [
  { label: 'Confirmed', helper: 'Order received', icon: CheckCircle },
  { label: 'Processing', helper: 'Picking & packing', icon: Package },
  { label: 'Shipped', helper: 'Tracking active', icon: Truck },
  { label: 'Delivered', helper: 'Arrived safely', icon: MapPin },
];


function statusStepIndex(status: Order['status']): number {
  if (status === 'delivered') return 4;
  if (status === 'shipped') return 3;
  if (status === 'confirmed') return 2;
  if (status === 'cancelled') return 0;
  return 1;
}

const STATUS_CONTENT: Record<Order['status'], { title: string; description: string }> = {
  pending: { title: 'We’re preparing your order', description: 'Your order is in queue and will be processed shortly.' },
  confirmed: { title: 'Order confirmed & processing', description: 'Your payment is confirmed. We are picking and packing your items.' },
  shipped: { title: 'Your package is on the way', description: 'Your collector-safe shipment has been handed to the carrier.' },
  delivered: { title: 'Delivered', description: 'Your package has arrived. We hope you enjoy your new cards!' },
  cancelled: { title: 'Cancelled', description: 'This order was cancelled. Please check your email for refund details.' },
};

import { OrderTimeline } from '../components/OrderTimeline';
import { useAuth } from '../hooks/useAuth';

export function OrderConfirmation({ order, userEmail, userName, context = 'confirmation' }: OrderConfirmationProps) {
  const { addItem, openCart } = useCart();
  const { user } = useAuth();
  const [reordering, setReordering] = useState(false);
  const subtotal = order.items.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);
  const shipping = Math.max(0, order.total - subtotal);
  const displayEmail = order.customerEmail || userEmail;
  const orderNumber = order.id.toUpperCase().slice(0, 12);
  const digitalItems = order.items.filter(item => item.digitalAssets && item.digitalAssets.length > 0);
  const hasDigitalItems = digitalItems.length > 0;

  const handleReorder = async () => {
    setReordering(true);
    try {
      for (const item of order.items) {
        await addItem(item.productId, item.quantity, item.variantId);
      }
      openCart();
    } catch (err) {
      logger.error('Failed to reorder items', err);
    } finally {
      setReordering(false);
    }
  };

  const statusContent = STATUS_CONTENT[order.status];

  return (
    <div className="relative min-h-screen bg-white px-4 py-10 md:py-20">
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -left-1/4 -top-1/4 h-1/2 w-1/2 rounded-full bg-primary-100/20 blur-[120px]" />
        <div className="absolute -bottom-1/4 -right-1/4 h-1/2 w-1/2 rounded-full bg-blue-50/30 blur-[120px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl">
        <div className={`group relative mb-12 flex flex-col gap-8 overflow-hidden rounded-[3rem] border p-10 shadow-2xl backdrop-blur-3xl md:flex-row md:items-center md:justify-between ${context === 'detail' ? 'border-gray-100 bg-white/60 shadow-gray-200/40' : 'border-green-100/50 bg-green-50/40 shadow-green-200/30'}`}>
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/20 blur-3xl transition-transform duration-1000 group-hover:scale-150" />
          
          <div className="relative flex flex-col md:flex-row items-start md:items-center gap-8">
            <div className={`relative flex h-24 w-24 shrink-0 items-center justify-center rounded-4xl text-white shadow-2xl transition-transform group-hover:rotate-6 ${context === 'detail' ? 'bg-gray-900 shadow-gray-400/50' : 'bg-green-500 shadow-green-300/50'}`}>
              {context === 'detail' ? <Package className="h-12 w-12" /> : <CheckCircle className="h-12 w-12" />}
              {!['cancelled', 'delivered'].includes(order.status) && (
                <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-white text-gray-900 shadow-lg">
                   <span className="h-2 w-2 animate-ping rounded-full bg-current" />
                </span>
              )}
            </div>
            <div>
              <p className={`text-[10px] font-black uppercase tracking-[0.3em] ${context === 'detail' ? 'text-gray-400' : 'text-green-700'}`}>{context === 'detail' ? `Receipt for #${orderNumber}` : 'Success'}</p>
              <h1 className="mt-2 text-4xl font-black tracking-tight text-gray-900 md:text-6xl">{context === 'detail' ? statusContent.title : `Thank you${userName ? `, ${userName}` : ''}.`}</h1>
              <p className="mt-4 max-w-2xl text-lg font-medium leading-relaxed text-gray-600">
                {context === 'detail' ? statusContent.description : 'Your order is confirmed and we’ve sent a digital receipt to'} <span className="font-black text-gray-900 underline decoration-primary-300 underline-offset-4">{context === 'detail' ? '' : displayEmail || 'your inbox'}</span>.
              </p>
            </div>
          </div>
          <div className="relative rounded-[2.5rem] bg-white px-8 py-6 text-left shadow-sm border border-gray-100/50 md:text-right">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Order Placed</p>
            <p className="mt-1 text-2xl font-black text-gray-900">{formatDate(order.createdAt)}</p>
            <p className="mt-2 inline-flex items-center gap-2 rounded-full bg-gray-900 px-3 py-1 text-[10px] font-black text-white">ID: {orderNumber}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <main className="space-y-8 lg:col-span-8">
            <section className="overflow-hidden rounded-[3rem] border border-gray-100 bg-white shadow-xl shadow-gray-200/20">
              <div className="border-b border-gray-100 px-8 py-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Live Status</p>
                    <h2 className="mt-1 text-2xl font-black text-gray-900">Shipment tracking</h2>
                  </div>
                  {order.status !== 'cancelled' && <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-5 py-2 text-xs font-black text-blue-700 border border-blue-100 shadow-sm">{order.status === 'delivered' ? 'Package Delivered' : `Arrival expected by ${estimateDelivery(order.createdAt)}`}</span>}
                </div>
              </div>
              <div className="p-8 md:p-12">
                {order.status === 'cancelled' ? (
                  <div className="rounded-3xl bg-red-50 p-8 text-center border border-red-100">
                    <Trash2 className="mx-auto h-12 w-12 text-red-300 mb-4" />
                    <h3 className="text-xl font-black text-red-900">Order Voided</h3>
                    <p className="mt-2 text-sm font-medium text-red-700">This order has been cancelled and a refund is being processed.</p>
                  </div>
                ) : (
                  <div>
                    <div className="mb-12">
                      <OrderTimeline order={order} />
                    </div>
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                      <NextStep icon={<Mail className="h-6 w-6" />} title="Check Inbox" text="Receipt and order details are waiting for you." />
                      <NextStep icon={<Package className="h-6 w-6" />} title="Expert Packing" text="Cards are double-sleeved and top-loaded." />
                      <NextStep icon={<Truck className="h-6 w-6" />} title="On the Way" text="Tracking numbers update automatically here." />
                    </div>
                  </div>
                )}
              </div>
            </section>

            <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <InfoCard icon={<MapPin className="h-5 w-5" />} title="Delivery Hub">
                <address className="not-italic text-base font-bold leading-relaxed text-gray-700">
                  <p className="text-xl font-black text-gray-900 mb-2">{order.customerName || userName || 'Valued Collector'}</p>
                  <p>{order.shippingAddress.street}</p>
                  <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zip}</p>
                  <div className="mt-4 inline-block rounded-lg bg-gray-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-gray-400 border border-gray-100">{order.shippingAddress.country}</div>
                </address>
              </InfoCard>
              <InfoCard icon={<Truck className="h-5 w-5" />} title="Shipping Service">
                <p className="text-lg font-black text-gray-900">Standard Insured Courier</p>
                <p className="mt-2 text-sm font-medium text-gray-500 leading-relaxed">Your collection is protected against loss or damage during transit.</p>
                <div className="mt-6">
                  {order.trackingNumber ? (
                    <div className="rounded-2xl bg-gray-900 p-4 text-white shadow-lg">
                      <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Carrier ID</p>
                      <p className="font-mono text-sm font-black">{order.trackingNumber}</p>
                    </div>
                  ) : (
                    <div className="rounded-2xl border-2 border-dashed border-gray-100 p-4 text-center">
                      <p className="text-xs font-bold text-gray-400">Tracking ID will appear once dispatched.</p>
                    </div>
                  )}
                </div>
              </InfoCard>
            </section>

            {hasDigitalItems && (
              <section className="overflow-hidden rounded-[3rem] border border-primary-100 bg-primary-50/30 shadow-xl shadow-primary-200/20 backdrop-blur-xl">
                <div className="border-b border-primary-100/50 px-8 py-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary-600">Digital Assets</p>
                      <h2 className="mt-1 text-2xl font-black text-gray-900">Your Downloads</h2>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-600 text-white shadow-lg">
                      <Download className="h-6 w-6" />
                    </div>
                  </div>
                </div>
                <div className="p-8 space-y-6">
                  <div className="rounded-2xl bg-white/50 p-4 text-sm text-primary-800 border border-primary-100/50 flex gap-4 items-center">
                    <ShieldCheck className="h-5 w-5 shrink-0 text-primary-600" />
                    <p className="font-medium">These links are exclusive to your account. Do not share them.</p>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4">
                    {digitalItems.map((item) => (
                      <div key={item.productId} className="space-y-4">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-gray-100 bg-white">
                            <img src={item.imageUrl} alt="" className="h-full w-full object-cover" />
                          </div>
                          <h3 className="text-sm font-black text-gray-900">{item.name}</h3>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-4 border-l-2 border-primary-100">
                          {item.digitalAssets?.map((asset) => (
                            <a 
                              key={asset.id} 
                              href={`/api/downloads/${asset.id}?userId=${user?.id || order.userId}`} 
                              download
                              rel="noopener noreferrer"
                              className="group flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm border border-gray-100 transition-all hover:border-primary-500 hover:shadow-md hover:-translate-y-0.5"
                            >
                              <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-50 text-gray-400 group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors">
                                  <FileText className="h-5 w-5" />
                                </div>
                                <div className="min-w-0">
                                  <p className="truncate text-xs font-black text-gray-900">{asset.name}</p>
                                  <p className="text-[10px] font-bold text-gray-400">{(asset.size / 1024 / 1024).toFixed(2)} MB • {asset.mimeType.split('/')[1].toUpperCase()}</p>
                                </div>
                              </div>
                              <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-primary-600 group-hover:translate-x-1 transition-all" />
                            </a>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}

            <section className="overflow-hidden rounded-[3rem] border border-gray-100 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-gray-100 px-8 py-6">
                <h2 className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400"><ShoppingBag className="h-5 w-5" /> Itemized List</h2>
                <span className="rounded-full bg-gray-50 px-4 py-1.5 text-xs font-black text-gray-600">{order.items.length} Position{order.items.length === 1 ? '' : 's'}</span>
              </div>
              <div className="divide-y divide-gray-100 px-8">
                {order.items.map((item) => (
                  <div key={item.productId} className="flex items-center gap-6 py-6 group">
                    <div className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl border border-gray-100 bg-gray-50 flex items-center justify-center shadow-sm transition-transform group-hover:scale-105 group-hover:shadow-md">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
                      ) : (
                        <Package className="h-8 w-8 text-gray-300" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-lg font-black text-gray-900">{item.name}</h3>
                      {item.variantTitle && (
                        <p className="text-[10px] font-black uppercase tracking-widest text-primary-600 mt-0.5">
                          {item.variantTitle}
                        </p>
                      )}
                      <p className="mt-1 text-sm font-bold text-gray-400">Qty: {item.quantity} • {formatMoney(item.unitPrice)} / unit</p>
                    </div>
                    <p className="text-lg font-black text-gray-900">{formatMoney(item.unitPrice * item.quantity)}</p>
                  </div>
                ))}
              </div>
            </section>
          </main>

          <aside className="space-y-6 lg:col-span-4">
            <section className="rounded-[3rem] border border-gray-100 bg-white p-8 shadow-2xl shadow-gray-200/50">
              <h2 className="mb-8 flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400"><ReceiptText className="h-5 w-5" /> Summary</h2>
              <div className="space-y-4">
                <SummaryRow label="Items Subtotal" value={formatMoney(subtotal)} />
                <SummaryRow label="Courier & Insurance" value={shipping === 0 ? 'Free' : formatMoney(shipping)} />
                {order.discountAmount && order.discountAmount > 0 && (
                  <div className="flex justify-between text-sm font-bold text-green-600">
                    <span>Discount {order.discountCode ? `(${order.discountCode})` : ''}</span>
                    <span>-{formatMoney(order.discountAmount)}</span>
                  </div>
                )}
                <div className="flex items-end justify-between border-t border-gray-100 pt-8 mt-4">
                  <span className="text-lg font-black text-gray-900">Total Paid</span>
                  <span className="text-4xl font-black tracking-tighter text-primary-600">{formatMoney(order.total)}</span>
                </div>
              </div>
              <div className="mt-10 flex items-center gap-3 rounded-2xl bg-green-50 px-5 py-4 text-[10px] font-black uppercase tracking-widest text-green-700">
                <ShieldCheck className="h-5 w-5" /> 
                Verified Secure Transaction
              </div>
            </section>

            {!user && context === 'confirmation' && (
              <section className="relative overflow-hidden rounded-[3rem] border border-primary-200 bg-primary-600 p-8 text-white shadow-xl shadow-primary-200/50">
                <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
                <h2 className="relative z-10 text-xl font-black tracking-tight">Save your details for next time</h2>
                <p className="relative z-10 mt-3 text-sm font-medium leading-relaxed text-primary-100">Create a collector account to track this order, manage your collection, and speed through checkout next time.</p>
                <Link href={`/register?email=${encodeURIComponent(userEmail)}`} className="relative z-10 mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-6 py-4 text-sm font-black text-primary-700 shadow-lg transition-transform hover:-translate-y-1">
                  Create Collector Account <ArrowRight className="h-4 w-4" />
                </Link>
              </section>
            )}

            <section className="grid grid-cols-1 gap-3">
              {order.trackingNumber && (
                <a href={`https://google.com/search?q=track+package+${order.trackingNumber}`} target="_blank" rel="noopener noreferrer" className="group flex w-full items-center justify-between rounded-2xl bg-primary-600 px-6 py-5 text-sm font-black text-white shadow-xl transition hover:bg-primary-700 hover:-translate-y-1">
                  Track Package <Truck className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </a>
              )}
              <button 
                onClick={handleReorder} 
                disabled={reordering} 
                className="group flex w-full items-center justify-between rounded-2xl bg-gray-900 px-6 py-5 text-sm font-black text-white shadow-xl transition hover:bg-black hover:-translate-y-1 disabled:opacity-50"
              >
                {reordering ? 'Adding to cart...' : 'Order again'} <RotateCcw className={`h-5 w-5 ${reordering ? 'animate-spin' : ''}`} />
              </button>
              <Link href="/products" className="group flex w-full items-center justify-between rounded-2xl border-2 border-gray-100 bg-white px-6 py-5 text-sm font-black text-gray-800 transition hover:bg-gray-50 hover:border-gray-200">
                Keep Shopping <ShoppingBag className="h-5 w-5 transition-transform group-hover:scale-110" />
              </Link>
              <div className="grid grid-cols-2 gap-3">
                <button type="button" onClick={() => window.print()} className="flex items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:bg-gray-50 hover:text-gray-900 transition-colors"><Printer className="h-4 w-4" /> Print</button>
                <Link href={`/support?orderId=${order.id}`} className="flex items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:bg-gray-50 hover:text-gray-900 transition-colors"><HelpCircle className="h-4 w-4" /> Help</Link>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}

function NextStep({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return <div className="group rounded-3xl bg-gray-50 p-6 transition hover:bg-white hover:shadow-md border border-transparent hover:border-gray-100"><div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-primary-600 shadow-sm transition-transform group-hover:scale-110 group-hover:rotate-3">{icon}</div><p className="text-base font-black text-gray-900">{title}</p><p className="mt-2 text-xs font-medium leading-relaxed text-gray-500">{text}</p></div>;
}

function InfoCard({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return <div className="rounded-[3rem] border border-gray-100 bg-white p-8 shadow-sm transition hover:shadow-md"><h2 className="mb-6 flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">{icon} {title}</h2>{children}</div>;
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between text-base font-bold text-gray-500"><span>{label}</span><span className="text-gray-900">{value}</span></div>;
}
