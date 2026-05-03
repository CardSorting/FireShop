'use client';

import { useAuth } from '../hooks/useAuth';
import { useServices } from '../hooks/useServices';
import { Package, Heart, MapPin, Settings, Star, ChevronRight, LogOut, ShieldCheck, Clock, Tag, HardDrive, Download } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { formatCurrency, formatDate } from '@utils/formatters';
import type { Order } from '@domain/models';
import { logger } from '@utils/logger';
import { OrderTimeline } from '../components/OrderTimeline';

export function AccountPage() {
  const { user, signOut } = useAuth();
  const services = useServices();
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [digitalAssetsCount, setDigitalAssetsCount] = useState(0);
  const [loadingOrders, setLoadingOrders] = useState(true);

  useEffect(() => {
    if (!user) return;
    const loadDashboardData = async () => {
      try {
        const [orders, assets] = await Promise.all([
          services.orderService.getOrders(user.id, { sort: 'newest' }),
          services.orderService.getDigitalAssets(user.id)
        ]);
        setRecentOrders(orders.slice(0, 2));
        setDigitalAssetsCount(assets.length);
      } catch (err) {
        logger.error('Failed to load dashboard data', err);
      } finally {
        setLoadingOrders(false);
      }
    };
    void loadDashboardData();
  }, [user, services]);

  if (!user) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-5xl p-12 text-center shadow-xl border border-gray-100">
        <h1 className="text-3xl font-black text-gray-900 mb-4 tracking-tighter">Welcome Back</h1>
        <p className="text-gray-500 mb-10 font-medium leading-relaxed">Sign in to track your orders, view your wishlist, and manage your collection vault.</p>
        <Link href="/login" className="block w-full py-5 bg-gray-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-gray-200">
          Sign In to Account
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-20">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-20">
          <div>
            <h1 className="text-5xl font-black text-gray-900 tracking-tighter mb-4">Account Dashboard</h1>
            <p className="text-gray-500 font-medium">Manage your vault, track shipments, and view rewards.</p>
          </div>
          <div className="flex items-center gap-4">
             <div className="flex -space-x-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="w-10 h-10 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-xs font-black text-gray-400">
                    {i}
                  </div>
                ))}
             </div>
             <p className="text-xs font-bold text-gray-400"><span className="text-gray-900 font-black">Level 3</span> Collector</p>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Sidebar */}
          <aside className="lg:col-span-3 space-y-4">
            <AccountNavLink href="/account" icon={Settings} label="Overview" active />
            <AccountNavLink href="/orders" icon={Package} label="Order History" />
            <AccountNavLink href="/account/vault" icon={HardDrive} label="Digital Vault" />
            <AccountNavLink href="/wishlist" icon={Heart} label="My Wishlist" />

            <button 
              onClick={() => signOut()}
              className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-red-500 hover:bg-red-50 transition-all font-black text-[10px] uppercase tracking-widest"
            >
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </aside>

          {/* Main Content */}
          <main className="lg:col-span-9 space-y-12">


            {/* Digital Library Widget */}
            {digitalAssetsCount > 0 && (
               <div className="bg-white rounded-[3rem] border border-primary-100 p-8 shadow-xl shadow-primary-200/20 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8 group">
                  <div className="flex items-center gap-6">
                     <div className="w-20 h-20 bg-primary-600 rounded-3xl flex items-center justify-center text-white shadow-lg transition-transform group-hover:rotate-6">
                        <HardDrive className="w-10 h-10" />
                     </div>
                     <div>
                        <h3 className="text-2xl font-black text-gray-900 tracking-tight">Your Digital Vault</h3>
                        <p className="text-gray-500 font-medium mt-1">You have <span className="text-primary-600 font-bold">{digitalAssetsCount}</span> asset{digitalAssetsCount === 1 ? '' : 's'} ready for download.</p>
                     </div>
                  </div>
                  <Link href="/account/vault" className="flex items-center gap-2 px-8 py-4 bg-gray-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all shadow-lg">
                     Open Library <ChevronRight className="w-4 h-4" />
                  </Link>
                  <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-primary-500/5 rounded-full blur-3xl" />
               </div>
            )}

            {/* Recent Activity */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
               <section>
                  <div className="flex items-center justify-between mb-8">
                     <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Recent Orders</h3>
                     <Link href="/orders" className="text-xs font-black text-primary-600 hover:underline">View All</Link>
                  </div>
                  <div className="space-y-4">
                     {loadingOrders ? (
                       <div className="p-8 text-center text-xs font-bold text-gray-400 animate-pulse bg-gray-50 rounded-[2.5rem]">
                         Loading orders...
                       </div>
                     ) : recentOrders.length > 0 ? (
                       recentOrders.map(order => <OrderCard key={order.id} order={order} />)
                     ) : (
                       <div className="p-8 text-center text-sm font-bold text-gray-500 bg-gray-50 rounded-[2.5rem]">
                         No recent orders found.
                       </div>
                     )}
                  </div>
               </section>

               <section>
                  <div className="flex items-center justify-between mb-8">
                     <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Personal Details</h3>

                  </div>
                  <div className="bg-gray-50 rounded-[3rem] p-8 border border-gray-100 space-y-6">
                     <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Full Name</p>
                        <p className="text-lg font-black text-gray-900">{user.displayName || 'Collector Player'}</p>
                     </div>
                     <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Email Address</p>
                        <p className="text-lg font-black text-gray-900">{user.email}</p>
                     </div>
                     <div className="pt-4 border-t border-gray-200">
                        <div className="flex items-center gap-3 text-green-600 bg-green-50/50 p-4 rounded-2xl">
                           <ShieldCheck className="w-5 h-5" />
                           <p className="text-xs font-black uppercase tracking-widest">Verified Account</p>
                        </div>
                     </div>
                  </div>
               </section>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

function AccountNavLink({ href, icon: Icon, label, active = false }: { href: string, icon: any, label: string, active?: boolean }) {
  return (
    <Link 
      href={href}
      className={`flex items-center justify-between w-full px-6 py-4 rounded-2xl transition-all group ${active ? 'bg-primary-50 text-primary-700 shadow-sm' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}
    >
      <div className="flex items-center gap-4">
        <Icon className={`w-5 h-5 ${active ? 'text-primary-600' : 'text-gray-400 group-hover:text-primary-600 transition-colors'}`} />
        <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
      </div>
      <ChevronRight className={`w-4 h-4 transition-transform ${active ? 'translate-x-0' : '-translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100'}`} />
    </Link>
  );
}

function OrderCard({ order }: { order: Order }) {
  const firstItem = order.items[0];
  const itemLimit = order.items.length;

  return (
    <Link href={`/orders/${order.id}`} className="block bg-white rounded-4xl border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all group overflow-hidden">
      <div className="bg-gray-50 border-b border-gray-100 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
         <div className="flex items-center gap-6">
            <div>
               <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Order Placed</p>
               <p className="text-xs font-black text-gray-900">{formatDate(order.createdAt)}</p>
            </div>
            <div>
               <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Total</p>
               <p className="text-xs font-black text-gray-900">{formatCurrency(order.total)}</p>
            </div>
         </div>
         <div className="text-right">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Order # {order.id.slice(0, 8)}</p>
            <span className="text-xs font-bold text-primary-600 hover:underline">View details</span>
         </div>
      </div>
      
      <div className="p-6">
        <div className="mb-6">
          <OrderTimeline order={order} variant="compact" />
        </div>
        
        {firstItem && (
          <div className="flex items-center gap-4 mt-2 mb-6 bg-white border border-gray-100 shadow-sm p-4 rounded-2xl group-hover:border-gray-200 transition-colors">
            <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-gray-50 border border-gray-100">
              <img src={firstItem.imageUrl} alt={firstItem.name} className="h-full w-full object-cover" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-black text-gray-900">{firstItem.name}</p>
              <p className="text-[10px] font-bold text-gray-400 mt-1">
                 Qty: {firstItem.quantity} {itemLimit > 1 ? ` • +${itemLimit - 1} more items` : ''}
              </p>
            </div>
            <div className="shrink-0 text-gray-400 group-hover:text-primary-600 group-hover:translate-x-1 transition-all">
               <ChevronRight className="w-5 h-5" />
            </div>
          </div>
        )}


      </div>
    </Link>
  );
}
