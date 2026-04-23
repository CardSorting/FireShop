/**
 * [LAYER: UI]
 */
import { useEffect, useState } from 'react';
import { useServices } from '../../hooks/useServices';
import type { Order, OrderStatus } from '@domain/models';
import { ChevronDown } from 'lucide-react';

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  shipped: 'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

export function AdminOrders() {
  const services = useServices();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    loadOrders();
  }, []);

  async function loadOrders() {
    setLoading(true);
    const result = await services.orderService.getAllOrders({ limit: 100 });
    setOrders(result.orders);
    setLoading(false);
  }

  async function handleStatusChange(id: string, status: OrderStatus) {
    setUpdating(id);
    await services.orderService.updateOrderStatus(id, status);
    setUpdating(null);
    await loadOrders();
  }

  if (loading) return <div className="p-4">Loading...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Orders</h1>

      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Order ID</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Items</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Total</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Date</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-b last:border-0 hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-xs">{o.id.slice(0, 12)}...</td>
                <td className="px-4 py-3">
                  <ul className="space-y-0.5">
                    {o.items.map((item) => (
                      <li key={item.productId} className="text-xs text-gray-600">
                        {item.name} x{item.quantity}
                      </li>
                    ))}
                  </ul>
                </td>
                <td className="px-4 py-3 font-medium">${(o.total / 100).toFixed(2)}</td>
                <td className="px-4 py-3">
                  <div className="relative inline-block">
                    <select
                      value={o.status}
                      onChange={(e) => handleStatusChange(o.id, e.target.value as OrderStatus)}
                      disabled={updating === o.id}
                      className={`appearance-none px-3 py-1 pr-8 rounded-full text-xs font-medium border-0 cursor-pointer ${STATUS_COLORS[o.status]}`}
                    >
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                    <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500" />
                  </div>
                </td>
                <td className="px-4 py-3 text-xs text-gray-500">
                  {o.createdAt.toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {orders.length === 0 && (
          <div className="p-8 text-center text-gray-400 text-sm">No orders yet</div>
        )}
      </div>
    </div>
  );
}