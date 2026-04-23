/**
 * [LAYER: UI]
 */
import { useEffect, useState } from 'react';
import { useServices } from '../../hooks/useServices';
import type { Product, Order } from '@domain/models';
import { Package, ShoppingBag, AlertTriangle, DollarSign } from 'lucide-react';
import { DatabaseMigration } from '../../components/admin/DatabaseMigration';

export function AdminDashboard() {
  const services = useServices();
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [prodResult, orderResult] = await Promise.all([
        services.productService.getProducts({ limit: 100 }),
        services.orderService.getAllOrders({ limit: 100 }),
      ]);
      setProducts(prodResult.products);
      setOrders(orderResult.orders);
      setLoading(false);
    }
    load();
  }, [services]);

  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
  const lowStock = products.filter((p) => p.stock < 5);
  const pendingOrders = orders.filter((o) => o.status === 'pending');

  if (loading) return <div className="p-4">Loading...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center gap-3">
            <Package className="w-8 h-8 text-primary-600" />
            <div>
              <p className="text-sm text-gray-500">Products</p>
              <p className="text-2xl font-bold">{products.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center gap-3">
            <DollarSign className="w-8 h-8 text-green-600" />
            <div>
              <p className="text-sm text-gray-500">Revenue</p>
              <p className="text-2xl font-bold">${(totalRevenue / 100).toFixed(2)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center gap-3">
            <ShoppingBag className="w-8 h-8 text-orange-600" />
            <div>
              <p className="text-sm text-gray-500">Pending Orders</p>
              <p className="text-2xl font-bold">{pendingOrders.length}</p>
            </div>
          </div>
        </div>
      </div>

      {lowStock.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
          <h2 className="flex items-center gap-2 text-amber-800 font-semibold mb-2">
            <AlertTriangle className="w-5 h-5" />
            Low Stock Alert
          </h2>
          <ul className="space-y-1 text-sm text-amber-700">
            {lowStock.map((p) => (
              <li key={p.id}>{p.name} — only {p.stock} left</li>
            ))}
          </ul>
        </div>
      )}

      <DatabaseMigration />
    </div>
  );
}