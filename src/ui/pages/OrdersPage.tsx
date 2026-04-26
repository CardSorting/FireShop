'use client';

/**
 * [LAYER: UI]
 */
import { useCallback, useEffect, useState } from 'react';
import { useServices } from '../hooks/useServices';
import { useAuth } from '../hooks/useAuth';
import type { Order } from '@domain/models';
import { Package } from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  shipped: 'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

export function OrdersPage() {
  const { user } = useAuth();
  const services = useServices();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const loadOrders = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const result = await services.orderService.getOrders(user.id);
      setOrders(result);
    } finally {
      setLoading(false);
    }
  }, [services.orderService, user]);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  if (loading) return <div className="max-w-7xl mx-auto p-8 text-center">Loading...</div>;

  if (orders.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">No orders yet</h2>
        <p className="text-gray-500">Start shopping to see your orders here.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Orders</h1>
      <div className="space-y-4">
        {orders.map((o) => (
          <div key={o.id} className="bg-white rounded-lg border p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm text-gray-500">Order #{o.id.slice(0, 16)}</p>
                <p className="text-xs text-gray-400">{o.createdAt.toLocaleDateString()}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[o.status]}`}>
                {o.status.charAt(0).toUpperCase() + o.status.slice(1)}
              </span>
            </div>
            <div className="space-y-2 mb-3">
              {o.items.map((item) => (
                <div key={item.productId} className="flex justify-between text-sm">
                  <span className="text-gray-700">
                    {item.name} x{item.quantity}
                  </span>
                  <span className="text-gray-500">
                    ${((item.unitPrice * item.quantity) / 100).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
            <div className="border-t pt-3 flex justify-between items-center">
              <span className="text-sm text-gray-500">
                {o.shippingAddress.city}, {o.shippingAddress.state}
              </span>
              <span className="font-bold text-gray-900">${(o.total / 100).toFixed(2)}</span>
            </div>
            {o.paymentTransactionId && (
              <p className="text-xs text-gray-400 mt-2">TX: {o.paymentTransactionId}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}