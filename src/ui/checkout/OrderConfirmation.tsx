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

export function OrderConfirmation({ order, userEmail, userName, context = 'confirmation' }: OrderConfirmationProps) {
  const { addItem, openCart } = useCart();
  const [reordering, setReordering] = useState(false);
  const subtotal = order.items.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);
  const shipping = Math.max(0, order.total - subtotal);
  const currentStep = statusStepIndex(order.status);
  const displayEmail = order.customerEmail || userEmail;
  const orderNumber = order.id.toUpperCase().slice(0, 12);

  const handleReorder = async () => {
    setReordering(true);
    try {
      for (const item of order.items) {
        await addItem(item.productId, item.quantity);
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
    <div className="min-h-screen bg-[#f6f7f9] px-4 py-8 md:py-14">
      <div className="mx-auto max-w-6xl">
        <div className={`mb-8 flex flex-col gap-4 rounded-[2rem] border p-6 shadow-sm md:flex-row md:items-center md:justify-between ${context === 'detail' ? 'border-gray-100 bg-white' : 'border-green-100 bg-green-50/30'}`}>
          <div className="flex items-start gap-4">
            <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-white shadow-lg ${context === 'detail' ? 'bg-gray-900 shadow-gray-200' : 'bg-green-500 shadow-green-200'}`}>
              {context === 'detail' ? <Package className="h-7 w-7" /> : <CheckCircle className="h-8 w-8" />}
            </div>
            <div>
              <p className={`text-xs font-black uppercase tracking-[0.2em] ${context === 'detail' ? 'text-gray-400' : 'text-green-700'}`}>{context === 'detail' ? `Order #${orderNumber}` : 'Order confirmed'}</p>
              <h1 className="mt-1 text-3xl font-black tracking-tight text-gray-900 md:text-5xl">{context === 'detail' ? statusContent.title : `Thank you${userName ? `, ${userName}` : ''}.`}</h1>
              <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-gray-600">
                {context === 'detail' ? statusContent.description : 'We received your order and sent a receipt to'} <span className="font-black text-gray-900">{context === 'detail' ? '' : displayEmail || 'your email'}</span>{context === 'detail' ? '' : '. You can track progress from your account at any time.'}
              </p>
            </div>
          </div>
          <div className="rounded-2xl bg-gray-50 p-4 text-left md:text-right">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Status updated</p>
            <p className="mt-1 text-lg font-black text-gray-900">{formatDate(order.updatedAt || order.createdAt)}</p>
            <p className="mt-1 text-xs font-bold text-gray-500">Placed {formatDate(order.createdAt)}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <main className="space-y-8 lg:col-span-8">
            <section className="overflow-hidden rounded-[2rem] border border-gray-100 bg-white shadow-sm">
              <div className="border-b border-gray-100 px-6 py-5 md:px-8">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-gray-400">Fulfillment</p>
                    <h2 className="mt-1 text-xl font-black text-gray-900">{order.status === 'delivered' ? 'Your cards have arrived' : 'Collector-safe shipping'}</h2>
                  </div>
                  {order.status !== 'cancelled' && <span className="rounded-full bg-blue-50 px-4 py-2 text-xs font-black text-blue-700">{order.status === 'delivered' ? 'Delivered' : `Estimated delivery ${estimateDelivery(order.createdAt)}`}</span>}
                </div>
              </div>
              <div className="p-6 md:p-8">
                {order.status === 'cancelled' ? (
                  <div className="rounded-2xl bg-red-50 p-5 text-sm font-bold text-red-700">This order was cancelled. Contact support if you need help with refund timing.</div>
                ) : (
                  <div>
                    <div className="relative mb-10">
                      <div className="absolute left-0 top-5 h-1 w-full rounded-full bg-gray-100" />
                      <div className="absolute left-0 top-5 h-1 rounded-full bg-green-500 transition-all" style={{ width: `${Math.max(0, ((currentStep - 1) / 3) * 100)}%` }} />
                      <div className="relative flex justify-between">
                        {STATUS_STEPS.map((item, index) => {
                          const stepNumber = index + 1;
                          const active = stepNumber <= currentStep;
                          const Icon = item.icon;
                          return (
                            <div key={item.label} className="flex max-w-[90px] flex-col items-center text-center">
                              <div className={`z-10 flex h-11 w-11 items-center justify-center rounded-full border-4 bg-white ${active ? 'border-green-500 text-green-600 shadow-md' : 'border-gray-100 text-gray-300'}`}>
                                <Icon className="h-5 w-5" />
                              </div>
                              <p className={`mt-3 text-[10px] font-black uppercase tracking-widest ${active ? 'text-gray-900' : 'text-gray-400'}`}>{item.label}</p>
                              <p className="mt-1 hidden text-[10px] font-bold text-gray-400 sm:block">{item.helper}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      <NextStep icon={<Mail className="h-5 w-5" />} title="Check your inbox" text="Receipt and order details are sent automatically." />
                      <NextStep icon={<Package className="h-5 w-5" />} title="We pack carefully" text="Cards are protected before leaving our shop." />
                      <NextStep icon={<Truck className="h-5 w-5" />} title="Track delivery" text="Tracking appears here when the order ships." />
                    </div>
                  </div>
                )}
              </div>
            </section>

            <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <InfoCard icon={<MapPin className="h-4 w-4" />} title="Shipping address">
                <address className="not-italic text-sm font-bold leading-7 text-gray-700">
                  <p className="text-gray-950">{order.customerName || userName || 'Customer'}</p>
                  <p>{order.shippingAddress.street}</p>
                  <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zip}</p>
                  <p className="mt-1 text-xs uppercase tracking-widest text-gray-400">{order.shippingAddress.country}</p>
                </address>
              </InfoCard>
              <InfoCard icon={<Truck className="h-4 w-4" />} title="Delivery method">
                <p className="text-sm font-black text-gray-900">Standard insured shipping</p>
                <p className="mt-2 text-sm font-medium text-gray-500">Tracked package • estimated 3–5 business days</p>
                {order.trackingNumber ? <p className="mt-3 text-xs font-black text-primary-600">Tracking: {order.trackingNumber}</p> : <p className="mt-3 rounded-xl bg-gray-50 px-3 py-2 text-xs font-bold text-gray-500">Tracking appears here as soon as the label is created.</p>}
              </InfoCard>
            </section>

            <section className="rounded-[2rem] border border-blue-100 bg-blue-50 p-6 shadow-sm">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-base font-black text-blue-950">Tracking and delivery updates</h2>
                  <p className="mt-2 text-sm font-medium leading-6 text-blue-800">
                    {order.trackingNumber ? `Your ${order.shippingCarrier || 'carrier'} tracking number is ${order.trackingNumber}.` : 'We will add the tracking number after your order is packed and handed to the carrier.'}
                  </p>
                </div>
                <Link href="/orders" className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-xs font-black uppercase tracking-widest text-blue-700 shadow-sm hover:bg-blue-700 hover:text-white">
                  Track orders <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </section>

            <section className="overflow-hidden rounded-[2rem] border border-gray-100 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5 md:px-8">
                <h2 className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-gray-400"><ShoppingBag className="h-4 w-4" /> Items in this order</h2>
                <span className="text-xs font-bold text-gray-500">{order.items.length} item{order.items.length === 1 ? '' : 's'}</span>
              </div>
              <div className="divide-y divide-gray-100 px-6 md:px-8">
                {order.items.map((item) => (
                  <div key={item.productId} className="flex items-center gap-4 py-5 md:gap-6">
                    <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl border bg-gray-50 shadow-sm"><img src={item.imageUrl || 'https://via.placeholder.com/150'} alt={item.name} className="h-full w-full object-cover" /></div>
                    <div className="min-w-0 flex-1"><h3 className="truncate text-base font-black text-gray-900">{item.name}</h3><p className="mt-1 text-sm font-medium text-gray-500">Qty {item.quantity} • {formatMoney(item.unitPrice)} each</p></div>
                    <p className="text-sm font-black text-gray-900 md:text-base">{formatMoney(item.unitPrice * item.quantity)}</p>
                  </div>
                ))}
              </div>
            </section>
          </main>

          <aside className="space-y-6 lg:col-span-4">
            <section className="rounded-[2rem] border border-gray-100 bg-white p-6 shadow-xl shadow-gray-200/40 md:p-8">
              <h2 className="mb-6 flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-gray-400"><ReceiptText className="h-4 w-4" /> Receipt summary</h2>
              <div className="space-y-4">
                <SummaryRow label="Subtotal" value={formatMoney(subtotal)} />
                <SummaryRow label="Shipping" value={shipping === 0 ? 'Free' : formatMoney(shipping)} />
                <SummaryRow label="Taxes" value="$0.00" />
                <div className="flex items-end justify-between border-t border-gray-100 pt-5"><span className="text-lg font-black text-gray-900">Total paid</span><span className="text-3xl font-black tracking-tighter text-primary-600">{formatMoney(order.total)}</span></div>
              </div>
              <div className="mt-6 rounded-2xl bg-green-50 p-4 text-xs font-black uppercase tracking-widest text-green-700"><ShieldCheck className="mb-2 h-4 w-4" /> Secure transaction</div>
            </section>

            <section className="space-y-3">
              {order.trackingNumber && (
                <a href={`https://google.com/search?q=track+package+${order.trackingNumber}`} target="_blank" rel="noopener noreferrer" className="flex w-full items-center justify-between rounded-2xl bg-primary-600 px-6 py-4 text-sm font-black text-white shadow-lg transition hover:bg-primary-700">
                  Track package <Truck className="h-4 w-4" />
                </a>
              )}
              <button onClick={handleReorder} disabled={reordering} className="flex w-full items-center justify-between rounded-2xl bg-gray-900 px-6 py-4 text-sm font-black text-white shadow-lg transition hover:bg-black disabled:opacity-50">
                {reordering ? 'Adding to cart...' : 'Buy again'} <RotateCcw className={`h-4 w-4 ${reordering ? 'animate-spin' : ''}`} />
              </button>
              {context === 'confirmation' && <Link href={`/orders/${order.id}`} className="flex w-full items-center justify-between rounded-2xl border-2 border-gray-100 bg-white px-6 py-4 text-sm font-black text-gray-800 transition hover:bg-gray-50">View order details <ArrowRight className="h-4 w-4" /></Link>}
              <Link href="/orders" className="flex w-full items-center justify-between rounded-2xl border-2 border-gray-100 bg-white px-6 py-4 text-sm font-black text-gray-800 transition hover:bg-gray-50">Track all orders <Package className="h-4 w-4" /></Link>
              <Link href="/products" className="flex w-full items-center justify-between rounded-2xl border-2 border-gray-100 bg-white px-6 py-4 text-sm font-black text-gray-800 transition hover:bg-gray-50">Continue shopping <ShoppingBag className="h-4 w-4" /></Link>
              <div className="grid grid-cols-2 gap-3">
                <button type="button" onClick={() => window.print()} className="flex items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:bg-gray-50"><Printer className="h-3.5 w-3.5" /> Print receipt</button>
                <Link href="/contact" className="flex items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:bg-gray-50"><ExternalLink className="h-3.5 w-3.5" /> Support</Link>
              </div>
            </section>

            <section className="rounded-[2rem] border border-primary-100 bg-primary-50 p-6">
              <h3 className="flex items-center gap-2 text-sm font-black text-primary-950"><HelpCircle className="h-4 w-4" /> Need help?</h3>
              <p className="mt-2 text-xs font-medium leading-5 text-primary-800">Have a delivery question or need to update your order? Contact support with order #{orderNumber}.</p>
              <div className="mt-5 flex flex-wrap gap-3 text-xs font-black text-primary-700">
                <Link href="/shipping-policy" className="hover:underline">Shipping policy</Link>
                <Link href="/refund-policy" className="hover:underline">Returns & refunds</Link>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}

function NextStep({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return <div className="rounded-2xl bg-gray-50 p-4"><div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white text-primary-600 shadow-sm">{icon}</div><p className="text-sm font-black text-gray-900">{title}</p><p className="mt-1 text-xs font-medium leading-5 text-gray-500">{text}</p></div>;
}

function InfoCard({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return <div className="rounded-[2rem] border border-gray-100 bg-white p-6 shadow-sm"><h2 className="mb-5 flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-gray-400">{icon} {title}</h2>{children}</div>;
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between text-sm font-bold text-gray-500"><span>{label}</span><span className="text-gray-900">{value}</span></div>;
}
