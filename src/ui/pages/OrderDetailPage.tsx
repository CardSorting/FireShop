'use client';

import { useEffect, useState, use } from 'react';
import { useServices } from '../hooks/useServices';
import { useAuth } from '../hooks/useAuth';
import type { Order } from '@domain/models';
import { OrderConfirmation } from '../checkout/OrderConfirmation';
import { logger } from '@utils/logger';
import { Loader2, AlertCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface OrderDetailPageProps {
  params: Promise<{ id: string }>;
}

export function OrderDetailPage({ params }: OrderDetailPageProps) {
  const { id } = use(params);
  const { user, loading: authLoading } = useAuth();
  const services = useServices();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadOrder() {
      if (authLoading) return;
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const result = await services.orderService.getOrder(id);
        if (result) {
          setOrder(result);
        } else {
          setError('Order not found');
        }
      } catch (err) {
        logger.error('Failed to load order', err);
        setError('We couldn’t find this order. It might belong to a different account or have been archived.');
      } finally {
        setLoading(false);
      }
    }
    loadOrder();
  }, [id, services.orderService, user, authLoading]);

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary-600 mx-auto mb-4" />
          <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Verifying order access...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-[2.5rem] p-10 shadow-xl text-center border border-gray-100">
          <AlertCircle className="h-16 w-16 text-amber-500 mx-auto mb-6" />
          <h2 className="text-2xl font-black text-gray-900 mb-2">Sign in to view order</h2>
          <p className="text-gray-500 mb-8 font-medium">To protect your privacy, you must be signed in to the account that placed this order.</p>
          <div className="space-y-4">
            <Link href="/login" className="flex items-center justify-center w-full rounded-2xl bg-gray-900 px-8 py-4 text-sm font-black text-white shadow-xl transition hover:bg-black">
              Sign in
            </Link>
            <Link href="/support?contact=true" className="block text-xs font-black text-primary-600 hover:underline uppercase tracking-widest">
              Contact support if you need help
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-[2.5rem] p-10 shadow-xl text-center border border-gray-100">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-6" />
          <h2 className="text-2xl font-black text-gray-900 mb-2">Order not found</h2>
          <p className="text-gray-500 mb-8 font-medium">{error || "We couldn't find the order you're looking for."}</p>
          <div className="flex flex-col gap-4">
            <Link href="/orders" className="flex items-center justify-center w-full rounded-2xl bg-gray-900 px-8 py-4 text-sm font-black text-white shadow-xl transition hover:bg-black">
              Back to my orders
            </Link>
            <Link href="/support?contact=true" className="text-xs font-black text-primary-600 hover:underline uppercase tracking-widest">
              Need help? Contact support
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <OrderConfirmation order={order} userEmail={user?.email || ''} userName={user?.displayName} context="detail" />;
}

