'use client';

/**
 * [LAYER: UI]
 * Admin product editor — Shopify-style two-column form with live preview.
 */
import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useServices } from '../../hooks/useServices';
import type { Product, ProductCategory, CardRarity } from '@domain/models';
import { 
  Save, 
  ArrowLeft, 
  Eye, 
  Package, 
  Settings, 
  Image as ImageIcon, 
  AlertTriangle, 
  Plus, 
  Copy,
  ChevronDown,
  Globe,
  Archive,
  BarChart3,
  Tag
} from 'lucide-react';
import { validatePriceCents, validateStock } from '@utils/validators';
import { formatCurrency, humanizeCategory } from '@utils/formatters';
import { SkeletonPage, useToast } from '../../components/admin/AdminComponents';

const CATEGORIES: ProductCategory[] = ['booster', 'single', 'deck', 'accessory', 'box'];
const RARITIES: CardRarity[] = ['common', 'uncommon', 'rare', 'holo', 'secret'];

export function AdminProductForm() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const services = useServices();
  const { toast } = useToast();
  const isEdit = Boolean(id);

  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    category: 'booster' as ProductCategory,
    stock: '',
    imageUrl: '',
    set: '',
    rarity: '' as CardRarity | '',
    status: 'active' as 'active' | 'draft' | 'archived',
  });
  const [saving, setSaving] = useState(false);
  const [loadingProduct, setLoadingProduct] = useState(!!id);
  const [error, setError] = useState<string | null>(null);
  const [unsaved, setUnsaved] = useState(false);
  const [duplicating, setDuplicating] = useState(false);

  // Dynamic page title
  useEffect(() => {
    const title = isEdit 
      ? `${form.name || 'Edit product'} · PlayMoreTCG Admin`
      : 'Add product · PlayMoreTCG Admin';
    document.title = title;
    return () => { document.title = 'PlayMoreTCG'; };
  }, [isEdit, form.name]);

  const loadProduct = useCallback(async () => {
    if (!id) return;
    setLoadingProduct(true);
    try {
      const p: Product = await services.productService.getProduct(id);
      setForm({
        name: p.name,
        description: p.description,
        price: (p.price / 100).toFixed(2),
        category: p.category,
        stock: String(p.stock),
        imageUrl: p.imageUrl,
        set: p.set ?? '',
        rarity: p.rarity ?? '',
        status: 'active', // Mock status
      });
    } catch {
      setError('Failed to load product for editing.');
    } finally {
      setLoadingProduct(false);
    }
  }, [id, services.productService]);

  useEffect(() => {
    void loadProduct();
  }, [loadProduct]);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setUnsaved(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    const parsedPrice = Number(form.price);
    const price = Number.isFinite(parsedPrice) ? Math.round(parsedPrice * 100) : NaN;
    const stock = Number(form.stock);
    const priceValidation = validatePriceCents(price);
    const stockValidation = validateStock(stock);

    if (!priceValidation.valid || !stockValidation.valid) {
      setError(priceValidation.message ?? stockValidation.message ?? 'Product values are invalid');
      setSaving(false);
      return;
    }

    const data = {
      name: form.name,
      description: form.description,
      price,
      category: form.category,
      stock,
      imageUrl: form.imageUrl || 'https://images.unsplash.com/photo-1606167668584-78701c57f13d?w=400',
      set: form.set || undefined,
      rarity: (form.rarity as CardRarity) || undefined,
    };

    try {
      if (isEdit && id) {
        await services.productService.updateProduct(id, data);
        toast('success', 'Product updated successfully');
      } else {
        await services.productService.createProduct(data);
        toast('success', 'Product created successfully');
      }
      setUnsaved(false);
      router.push('/admin/products');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save product');
    } finally {
      setSaving(false);
    }
  }

  if (loadingProduct) return <SkeletonPage />;

  return (
    <div className="animate-in fade-in duration-500 pb-20">
      {/* ── Top Nav ── */}
      <div className="mb-6 flex items-center justify-between border-b pb-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/admin/products')}
            className="flex h-8 w-8 items-center justify-center rounded-lg border bg-white text-gray-500 hover:text-gray-900 transition shadow-sm"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900 leading-none">
              {isEdit ? form.name : 'New Product'}
            </h1>
            <div className="mt-1 flex items-center gap-2">
              <span className={`h-1.5 w-1.5 rounded-full ${form.status === 'active' ? 'bg-green-500' : 'bg-gray-400'}`} />
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{form.status}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {unsaved && (
            <span className="hidden sm:flex items-center gap-1.5 mr-2 text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-md">
              Unsaved
            </span>
          )}
          <button
            onClick={() => router.push('/admin/products')}
            className="rounded-lg border bg-white px-4 py-2 text-xs font-bold text-gray-700 shadow-sm transition hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            form="product-form"
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-primary-600 px-6 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-primary-700 active:scale-95 disabled:opacity-50"
          >
            {saving ? <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <Save className="h-4 w-4" />}
            Save Product
          </button>
        </div>
      </div>

      <form id="product-form" onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[1fr_340px]">
        {/* ── Left Column: Primary Details ── */}
        <div className="space-y-6">
          {error && (
            <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 font-medium">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Core Info */}
          <section className="rounded-xl border bg-white p-5 shadow-sm space-y-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">Title</label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                placeholder="Short Sleeve T-Shirt"
                className="w-full rounded-lg border bg-gray-50 px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-primary-500 outline-none transition"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">Description</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                required
                rows={6}
                placeholder="Tell your story..."
                className="w-full rounded-lg border bg-gray-50 px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-primary-500 outline-none transition resize-none"
              />
            </div>
          </section>

          {/* Media */}
          <section className="rounded-xl border bg-white p-5 shadow-sm">
            <h2 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-4">Media</h2>
            <div className="grid grid-cols-4 gap-4">
              <div className="col-span-2 row-span-2 relative aspect-square overflow-hidden rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center text-gray-400 hover:border-primary-500 transition cursor-pointer">
                {form.imageUrl ? (
                  <img src={form.imageUrl} alt="Primary" className="h-full w-full object-cover" />
                ) : (
                  <>
                    <ImageIcon className="h-8 w-8 mb-2" />
                    <span className="text-[10px] font-bold uppercase">Add Image</span>
                  </>
                )}
              </div>
              {[1, 2, 3].map((i) => (
                <div key={i} className="aspect-square rounded-xl border-2 border-dashed border-gray-100 bg-gray-50/50 flex items-center justify-center text-gray-300 hover:border-gray-200 transition cursor-pointer">
                  <Plus className="h-5 w-5" />
                </div>
              ))}
            </div>
            <div className="mt-4">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">Image URL</label>
              <input
                name="imageUrl"
                value={form.imageUrl}
                onChange={handleChange}
                placeholder="https://..."
                className="w-full rounded-lg border bg-gray-50 px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-primary-500 outline-none transition"
              />
            </div>
          </section>

          {/* Pricing */}
          <section className="rounded-xl border bg-white p-5 shadow-sm">
            <h2 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-4">Pricing</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">Price</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">$</span>
                  <input
                    name="price"
                    type="number"
                    step="0.01"
                    value={form.price}
                    onChange={handleChange}
                    required
                    className="w-full rounded-lg border bg-gray-50 pl-8 pr-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-primary-500 outline-none transition"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">Compare at price</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">$</span>
                  <input
                    type="number"
                    disabled
                    placeholder="0.00"
                    className="w-full rounded-lg border bg-gray-100 pl-8 pr-4 py-2.5 text-sm font-bold text-gray-400 outline-none"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Inventory & Shipping */}
          <section className="rounded-xl border bg-white p-5 shadow-sm">
            <h2 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-4">Inventory & Shipping</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">Quantity Available</label>
                <input
                  name="stock"
                  type="number"
                  value={form.stock}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border bg-gray-50 px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-primary-500 outline-none transition"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">SKU (Stock Keeping Unit)</label>
                <input
                  name="sku"
                  placeholder="PM-1024-BS"
                  className="w-full rounded-lg border bg-gray-50 px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-primary-500 outline-none transition"
                />
              </div>
            </div>
            <div className="mt-4 pt-4 border-t">
               <label className="flex items-center gap-2 cursor-pointer">
                 <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                 <span className="text-xs font-bold text-gray-700">Track quantity</span>
               </label>
            </div>
          </section>

          {/* Variants */}
          <section className="rounded-xl border bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Variants</h2>
              <button type="button" className="text-[10px] font-bold text-primary-600 uppercase hover:underline">Add Options</button>
            </div>
            <div className="rounded-lg border-2 border-dashed bg-gray-50/50 p-6 text-center">
              <Plus className="h-6 w-6 text-gray-300 mx-auto mb-2" />
              <p className="text-xs text-gray-500 font-medium">Add variants if this product has multiple options like condition or language.</p>
            </div>
          </section>

          {/* Search Engine Listing Preview (SEO) */}
          <section className="rounded-xl border bg-white overflow-hidden shadow-sm">
            <div className="flex items-center justify-between border-b bg-gray-50/50 px-5 py-4">
              <h2 className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Search engine listing preview</h2>
              <button type="button" className="text-[10px] font-bold text-primary-600 uppercase hover:underline">Edit SEO</button>
            </div>
            <div className="p-5 space-y-2">
              <p className="text-sm font-medium text-[#1a0dab] hover:underline cursor-pointer truncate max-w-full">
                {form.name || 'Your Product Title'} | PlayMoreTCG
              </p>
              <p className="text-xs text-[#006621] truncate">
                https://playmoretcg.com/products/{(form.name || 'product-handle').toLowerCase().replace(/\s+/g, '-')}
              </p>
              <p className="text-xs text-[#4d5156] line-clamp-2 leading-relaxed">
                {form.description || 'Add a description to see how this product might appear in search engine listings.'}
              </p>
            </div>
          </section>
        </div>

        {/* ── Right Column: Settings & Status ── */}
        <div className="space-y-6">
          {/* Status Widget */}
          <section className="rounded-xl border bg-white p-5 shadow-sm">
            <h2 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-4">Status</h2>
            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              className="w-full rounded-lg border bg-gray-50 px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-primary-500 outline-none appearance-none transition"
            >
              <option value="active">Active</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
            <p className="mt-3 text-[10px] text-gray-500 leading-relaxed">
              This product will be {form.status === 'active' ? 'visible' : 'hidden'} on your online store.
            </p>
          </section>

          {/* Organization Widget */}
          <section className="rounded-xl border bg-white p-5 shadow-sm">
            <h2 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-4">Organization</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1.5">Category</label>
                <select
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  className="w-full rounded-lg border bg-gray-50 px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-primary-500 outline-none transition"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{humanizeCategory(c)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1.5">Set / Collection</label>
                <input
                  name="set"
                  value={form.set}
                  onChange={handleChange}
                  placeholder="e.g. Base Set"
                  className="w-full rounded-lg border bg-gray-50 px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-primary-500 outline-none transition"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1.5">Rarity</label>
                <select
                  name="rarity"
                  value={form.rarity}
                  onChange={handleChange}
                  className="w-full rounded-lg border bg-gray-50 px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-primary-500 outline-none transition"
                >
                  <option value="">None</option>
                  {RARITIES.map((r) => (
                    <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1.5">Tags</label>
                <input
                  placeholder="Vintage, Holo, Charizard..."
                  className="w-full rounded-lg border bg-gray-50 px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-primary-500 outline-none transition"
                />
              </div>
            </div>
          </section>

          {/* Quick Actions */}
          <section className="rounded-xl border bg-white p-5 shadow-sm space-y-2">
            <h2 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Insights</h2>
            <div className="flex items-center justify-between text-xs font-bold text-gray-900">
              <span className="flex items-center gap-2 text-gray-500 font-medium">
                <BarChart3 className="h-3.5 w-3.5" />
                Views (30d)
              </span>
              <span>0</span>
            </div>
            <div className="flex items-center justify-between text-xs font-bold text-gray-900">
              <span className="flex items-center gap-2 text-gray-500 font-medium">
                <Tag className="h-3.5 w-3.5" />
                Conversion
              </span>
              <span>0%</span>
            </div>
          </section>
        </div>
      </form>
    </div>
  );
}
