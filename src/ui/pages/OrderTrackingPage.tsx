'use client';

import { useState } from 'react';
import { Search, Package, Truck, CheckCircle2, Calendar, MapPin, ArrowRight, ShieldCheck, LifeBuoy } from 'lucide-react';
import Link from 'next/link';

export function OrderTrackingPage() {
  const [orderId, setOrderId] = useState('');
  const [tracking, setTracking] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleTrack = () => {
    if (!orderId.trim()) return;
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setTracking({
        id: orderId.toUpperCase(),
        status: 'In Transit',
        carrier: 'FedEx',
        trackingNumber: '774920193847',
        estimatedDelivery: 'Thursday, May 23',
        events: [
          { status: 'Out for Delivery', location: 'San Francisco, CA', time: 'May 22, 8:45 AM', current: true },
          { status: 'Arrived at Facility', location: 'Oakland, CA', time: 'May 21, 11:20 PM' },
          { status: 'In Transit', location: 'Memphis, TN', time: 'May 20, 4:30 AM' },
          { status: 'Order Picked Up', location: 'New York, NY', time: 'May 19, 2:15 PM' },
          { status: 'Label Created', location: 'DreamBees Art Warehouse', time: 'May 18, 10:00 AM' }
        ]
      });
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-20">
        <div className="text-center mb-16">
           <h1 className="text-5xl font-black text-gray-900 tracking-tighter mb-4">Track Your Order</h1>
           <p className="text-gray-500 font-medium max-w-md mx-auto leading-relaxed">Enter your order ID or tracking number to see the real-time status of your collector's items.</p>
        </div>

        {/* Search Input */}
        <div className="relative max-w-xl mx-auto mb-20 group">
           <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400 group-focus-within:text-primary-600 transition-colors" />
           <input 
             type="text" 
             value={orderId}
             onChange={(e) => setOrderId(e.target.value)}
             placeholder="Order ID (e.g. ORD-12345)"
             className="w-full pl-16 pr-40 py-6 bg-gray-50 border-2 border-transparent rounded-4xl text-lg font-bold focus:bg-white focus:border-primary-500 transition-all outline-none shadow-xl shadow-gray-100"
           />
           <button 
             onClick={handleTrack}
             disabled={loading || !orderId.trim()}
             className="absolute right-2 top-2 bottom-2 px-8 bg-gray-900 text-white rounded-3xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all disabled:opacity-50"
           >
             {loading ? 'Searching...' : 'Track Now'}
           </button>
        </div>

        {tracking ? (
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-500">
             {/* Status Header */}
             <div className="bg-gray-900 rounded-[3rem] p-10 text-white flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="flex items-center gap-6 text-center md:text-left">
                   <div className="w-16 h-16 rounded-2xl bg-primary-500/20 border border-primary-500/30 flex items-center justify-center">
                      <Truck className="w-8 h-8 text-primary-400" />
                   </div>
                   <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary-400 mb-1">Status: {tracking.status}</p>
                      <h2 className="text-3xl font-black tracking-tight">On its way to you</h2>
                   </div>
                </div>
                <div className="text-center md:text-right">
                   <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-1">Estimated Delivery</p>
                   <p className="text-2xl font-black text-primary-400">{tracking.estimatedDelivery}</p>
                </div>
             </div>

             {/* Tracking Timeline */}
             <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                <div className="lg:col-span-8 bg-white rounded-[3rem] border border-gray-100 shadow-xl p-10">
                   <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-10">Tracking Timeline</h3>
                   <div className="space-y-0">
                      {tracking.events.map((event: any, i: number) => (
                        <div key={i} className="flex gap-8 relative group pb-10 last:pb-0">
                           {/* Line */}
                           {i !== tracking.events.length - 1 && (
                             <div className="absolute left-4 top-8 bottom-0 w-0.5 bg-gray-100 group-hover:bg-primary-100 transition-colors" />
                           )}
                           
                           {/* Icon */}
                           <div className={`relative z-10 w-8 h-8 rounded-full border-4 border-white flex items-center justify-center shrink-0 shadow-sm ${event.current ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                              {event.current ? <CheckCircle2 className="w-4 h-4" /> : <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />}
                           </div>

                           <div className="flex-1 pb-2">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                                 <h4 className={`text-lg font-black tracking-tight ${event.current ? 'text-gray-900' : 'text-gray-400'}`}>{event.status}</h4>
                                 <p className="text-xs font-bold text-gray-400">{event.time}</p>
                              </div>
                              <p className="text-sm font-medium text-gray-500 flex items-center gap-2">
                                 <MapPin className="w-3.5 h-3.5" /> {event.location}
                              </p>
                           </div>
                        </div>
                      ))}
                   </div>
                </div>

                <div className="lg:col-span-4 space-y-8">
                   <div className="bg-gray-50 rounded-[2.5rem] p-8 border border-gray-100">
                      <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-6">Order Details</h4>
                      <div className="space-y-4">
                         <div className="flex justify-between">
                            <span className="text-xs font-bold text-gray-500">Order ID</span>
                            <span className="text-xs font-black text-gray-900">{tracking.id}</span>
                         </div>
                         <div className="flex justify-between">
                            <span className="text-xs font-bold text-gray-500">Carrier</span>
                            <span className="text-xs font-black text-gray-900">{tracking.carrier}</span>
                         </div>
                         <div className="flex justify-between">
                            <span className="text-xs font-bold text-gray-500">Tracking #</span>
                            <span className="text-xs font-black text-primary-600 underline cursor-pointer">{tracking.trackingNumber}</span>
                         </div>
                      </div>
                      <Link href={`/orders/${tracking.id}`} className="mt-8 w-full py-4 bg-white border border-gray-100 rounded-xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-900 hover:bg-gray-900 hover:text-white transition-all">
                         View Receipt <ArrowRight className="w-4 h-4" />
                      </Link>
                   </div>

                   <div className="bg-primary-50 rounded-[2.5rem] p-8 border border-primary-100">
                      <LifeBuoy className="w-6 h-6 text-primary-600 mb-4" />
                      <h4 className="text-lg font-black text-gray-900 mb-2 tracking-tight">Need Assistance?</h4>
                      <p className="text-xs font-medium text-gray-600 leading-relaxed mb-6">Our support experts are available 24/7 to help with any delivery questions.</p>
                      <Link href="/support?contact=true" className="text-xs font-black text-primary-600 uppercase tracking-widest hover:underline">Contact Support</Link>
                   </div>
                </div>
             </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20">
             <div className="p-8 rounded-4xl bg-gray-50 border border-gray-100 flex flex-col items-center text-center">
                <ShieldCheck className="w-10 h-10 text-primary-600 mb-4" />
                <h4 className="text-lg font-black text-gray-900 mb-2">Secure Transit</h4>
                <p className="text-xs text-gray-500 font-medium">Every order is insured and tracked with signature-required delivery for high-value items.</p>
             </div>
             <div className="p-8 rounded-4xl bg-gray-50 border border-gray-100 flex flex-col items-center text-center">
                <Package className="w-10 h-10 text-primary-600 mb-4" />
                <h4 className="text-lg font-black text-gray-900 mb-2">Protected Packing</h4>
                <p className="text-xs text-gray-500 font-medium">Double-sleeved and top-loaded cards inside rigid stay-flat mailers for maximum safety.</p>
             </div>
             <div className="p-8 rounded-4xl bg-gray-50 border border-gray-100 flex flex-col items-center text-center">
                <Truck className="w-10 h-10 text-primary-600 mb-4" />
                <h4 className="text-lg font-black text-gray-900 mb-2">Global Shipping</h4>
                <p className="text-xs text-gray-500 font-medium">We ship to over 50 countries with dedicated collectors logistics partners.</p>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
