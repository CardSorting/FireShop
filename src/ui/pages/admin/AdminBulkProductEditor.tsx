'use client';

/**
 * [LAYER: UI]
 * Admin bulk product editor — Full-width spreadsheet-style interface.
 */
import { useCallback, useEffect, useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useServices } from '../../hooks/useServices';
import type { Product } from '@domain/models';
import { 
  ArrowLeft,
  Save,
  X,
  Package,
  DollarSign,
  Boxes,
  RotateCcw,
  AlertCircle
} from 'lucide-react';
import { formatCurrency } from '@utils/formatters';
import { 
  AdminPageHeader, 
  useToast, 
  useAdminPageTitle
} from '../../components/admin/AdminComponents';

export function AdminBulkProductEditor() {
  useAdminPageTitle('Bulk Edit Products');
  const services = useServices();
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [bulkChanges, setBulkChanges] = useState<Record<string, { price?: number; stock?: number }>>({});
  const [saving, setSaving] = useState(false);

  const selectedIds = useMemo(() => {
    const ids = searchParams.get('ids');
    return ids ? ids.split(',') : [];
  }, [searchParams]);

  const loadProducts = useCallback(async () => {
    if (selectedIds.length === 0) {
      toast('info', 'No products selected for bulk editing');
      router.push('/admin/products');
      return;
    }

    setLoading(true);
    try {
      const result = await services.productService.getProducts({ limit: 1000 });
      const filtered = result.products.filter(p => selectedIds.includes(p.id));
      setProducts(filtered);
    } catch (err) {
      toast('error', 'Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [selectedIds, services.productService, router, toast]);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  async function handleSave() {
    setSaving(true);
    try {
      const entries = Object.entries(bulkChanges);
      if (entries.length === 0) {
        router.push('/admin/products');
        return;
      }

      const user = await services.authService.getCurrentUser();
      const actor = { id: user?.id || 'unknown', email: user?.email || 'system' };
      
      await Promise.all(entries.map(([id, changes]) => 
        services.productService.updateProduct(id, changes, actor)
      ));

      toast('success', `Updated ${entries.length} products`);
      router.push('/admin/products');
    } catch (err) {
      toast('error', 'Bulk update failed');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  const hasChanges = Object.keys(bulkChanges).length > 0;

  return (
    <div className="space-y-8 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => router.push('/admin/products')}
          className="group flex h-10 w-10 items-center justify-center rounded-full border bg-white shadow-sm transition hover:bg-gray-50"
        >
          <ArrowLeft className="h-5 w-5 text-gray-500 transition-transform group-hover:-translate-x-0.5" />
        </button>
        <AdminPageHeader
          title="Bulk Product Editor"
          subtitle={`Modifying ${products.length} selected items`}
        />
      </div>

      <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-widest text-gray-400">Product</th>
                <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-widest text-gray-400 w-48">Price</th>
                <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-widest text-gray-400 w-48">Stock</th>
                <th className="px-6 py-4 text-right text-[10px] font-bold uppercase tracking-widest text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.map((p) => {
                const changes = bulkChanges[p.id] || {};
                const currentPrice = changes.price !== undefined ? changes.price : p.price;
                const currentStock = changes.stock !== undefined ? changes.stock : p.stock;
                const isPriceChanged = changes.price !== undefined;
                const isStockChanged = changes.stock !== undefined;

                return (
                  <tr key={p.id} className="group hover:bg-gray-50/50 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <img src={p.imageUrl} alt="" className="h-12 w-12 rounded-lg border object-cover shadow-sm bg-gray-50" />
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-gray-900 truncate">{p.name}</p>
                          <p className="text-[10px] font-medium text-gray-500 uppercase tracking-widest">{p.category}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                        <input 
                          type="number"
                          step="0.01"
                          value={currentPrice}
                          onChange={(e) => setBulkChanges({
                            ...bulkChanges,
                            [p.id]: { ...changes, price: parseFloat(e.target.value) || 0 }
                          })}
                          className={`w-full rounded-xl border bg-gray-50 py-2.5 pl-8 pr-4 text-sm font-bold focus:bg-white focus:ring-2 focus:ring-primary-500 outline-none transition ${isPriceChanged ? 'border-primary-500 ring-1 ring-primary-500' : ''}`}
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="relative">
                        <Boxes className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input 
                          type="number"
                          value={currentStock}
                          onChange={(e) => setBulkChanges({
                            ...bulkChanges,
                            [p.id]: { ...changes, stock: parseInt(e.target.value) || 0 }
                          })}
                          className={`w-full rounded-xl border bg-gray-50 py-2.5 pl-10 pr-4 text-sm font-bold focus:bg-white focus:ring-2 focus:ring-primary-500 outline-none transition ${isStockChanged ? 'border-primary-500 ring-1 ring-primary-500' : ''}`}
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {(isPriceChanged || isStockChanged) && (
                        <button 
                          onClick={() => {
                            const next = { ...bulkChanges };
                            delete next[p.id];
                            setBulkChanges(next);
                          }}
                          className="p-2 text-gray-400 hover:text-primary-600 transition"
                        >
                          <RotateCcw className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="sticky bottom-0 bg-gray-50/95 backdrop-blur-sm border-t px-8 py-6 flex items-center justify-between">
           <div className="flex items-center gap-2 text-sm font-bold text-gray-500 uppercase tracking-widest">
              <AlertCircle className="h-4 w-4 text-primary-500" />
              {Object.keys(bulkChanges).length} products modified
           </div>
           <div className="flex gap-4">
             <button 
              onClick={() => router.push('/admin/products')}
              className="rounded-xl border bg-white px-6 py-3 text-sm font-bold text-gray-700 shadow-sm transition hover:bg-gray-50 active:scale-95"
             >
               Discard Changes
             </button>
             <button 
                onClick={handleSave}
                disabled={saving || !hasChanges}
                className="flex items-center gap-3 rounded-xl bg-primary-600 px-10 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-primary-700 active:scale-95 disabled:opacity-50"
              >
               <Save className="h-4 w-4" />
               {saving ? 'Saving...' : 'Save Changes'}
             </button>
           </div>
        </div>
      </div>
    </div>
  );
}
