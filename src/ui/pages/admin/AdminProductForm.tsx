'use client';

/**
 * [LAYER: UI]
 * Admin product editor — Shopify-style two-column form with live preview.
 */
import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useServices } from '../../hooks/useServices';
import type { Product, ProductCategory, CardRarity } from '@domain/models';
import { Save, ArrowLeft, Eye, Package, Settings, Image as ImageIcon, AlertTriangle, Plus } from 'lucide-react';
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
  });
  const [saving, setSaving] = useState(false);
  const [loadingProduct, setLoadingProduct] = useState(!!id);
  const [error, setError] = useState<string | null>(null);
  const [unsaved, setUnsaved] = useState(false);

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
    <div className="animate-in fade-in duration-300">
      {/* ── Top bar ── */}
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={() => router.push('/admin/products')}
          className="flex items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Products
        </button>
        <div className="flex items-center gap-3">
          {unsaved && (
            <span className="text-xs font-medium text-amber-600">Unsaved changes</span>
          )}
          <button
            type="button"
            onClick={() => router.push('/admin/products')}
            className="rounded-xl border bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            Discard
          </button>
          <button
            form="product-form"
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-primary-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700 active:scale-95 disabled:opacity-50"
          >
            {saving ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <Save className="h-4 w-4" />}
            {isEdit ? 'Save' : 'Create product'}
          </button>
        </div>
      </div>

      {/* ── Page title ── */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          {isEdit ? 'Edit product' : 'Add product'}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          {isEdit ? 'Update product details, pricing, and media.' : 'Fill in the details to list a new product.'}
        </p>
      </div>

      <form id="product-form" onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-[1fr_340px]">
        {/* ── Left column ── */}
        <div className="space-y-6">
          {error && (
            <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              {error}
            </div>
          )}

          {/* Core details */}
          <section className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-2">
              <Settings className="h-4 w-4 text-gray-400" />
              <h2 className="text-sm font-semibold text-gray-900">Product details</h2>
            </div>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700">Title</label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  placeholder="e.g. Charizard GX — Hidden Fates"
                  className="mt-1.5 w-full rounded-xl border bg-white px-4 py-2.5 text-sm transition focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  required
                  rows={4}
                  placeholder="Tell customers about the condition, rarity, or gameplay value…"
                  className="mt-1.5 w-full rounded-xl border bg-white px-4 py-2.5 text-sm transition focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                />
                <p className="mt-1 text-xs text-gray-400">{form.description.length} / 2000 characters</p>
              </div>
            </div>
          </section>

          {/* Media */}
          <section className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-gray-400" />
              <h2 className="text-sm font-semibold text-gray-900">Media</h2>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-3">
                <div className="col-span-2 row-span-2 relative aspect-square overflow-hidden rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 transition hover:border-primary-300">
                  {form.imageUrl ? (
                    <>
                      <img src={form.imageUrl} alt="Primary" className="h-full w-full object-cover" />
                      <span className="absolute left-2 top-2 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">Primary</span>
                    </>
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center gap-2 text-gray-400">
                      <ImageIcon className="h-8 w-8" />
                      <span className="text-[10px] font-semibold uppercase tracking-wider">Main photo</span>
                    </div>
                  )}
                </div>
                {[1, 2, 3].map((i) => (
                  <div key={i} className="relative aspect-square overflow-hidden rounded-xl border-2 border-dashed border-gray-100 bg-gray-50/30 transition hover:border-gray-300">
                    <div className="flex h-full flex-col items-center justify-center gap-1 text-gray-300">
                      <Plus className="h-4 w-4" />
                    </div>
                  </div>
                ))}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Image URL</label>
                <div className="mt-1.5 flex gap-2">
                  <input
                    name="imageUrl"
                    value={form.imageUrl}
                    onChange={handleChange}
                    placeholder="https://example.com/image.jpg"
                    className="flex-1 rounded-xl border bg-white px-4 py-2.5 text-sm transition focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-400">Paste a direct link to your product image.</p>
              </div>
            </div>
          </section>

          {/* Pricing & inventory */}
          <section className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-2">
              <Package className="h-4 w-4 text-gray-400" />
              <h2 className="text-sm font-semibold text-gray-900">Pricing & inventory</h2>
            </div>
            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700">Price (USD)</label>
                <div className="relative mt-1.5">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-gray-400">$</span>
                  <input
                    name="price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.price}
                    onChange={handleChange}
                    required
                    className="w-full rounded-xl border bg-white pl-7 pr-4 py-2.5 text-sm transition focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Stock quantity</label>
                <input
                  name="stock"
                  type="number"
                  min="0"
                  value={form.stock}
                  onChange={handleChange}
                  required
                  className="mt-1.5 w-full rounded-xl border bg-white px-4 py-2.5 text-sm transition focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>
          </section>

          {/* Organization */}
          <section className="rounded-2xl border bg-white p-6 shadow-sm">
            <h2 className="mb-5 text-sm font-semibold text-gray-900">Organization</h2>
            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700">Category</label>
                <select
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  className="mt-1.5 w-full rounded-xl border bg-white px-4 py-2.5 text-sm transition focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {humanizeCategory(c)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Rarity</label>
                <select
                  name="rarity"
                  value={form.rarity}
                  onChange={handleChange}
                  className="mt-1.5 w-full rounded-xl border bg-white px-4 py-2.5 text-sm transition focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">None</option>
                  {RARITIES.map((r) => (
                    <option key={r} value={r}>
                      {r.charAt(0).toUpperCase() + r.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700">Set / Collection</label>
                <input
                  name="set"
                  value={form.set}
                  onChange={handleChange}
                  placeholder="e.g. Sword & Shield: Base Set"
                  className="mt-1.5 w-full rounded-xl border bg-white px-4 py-2.5 text-sm transition focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>
          </section>
        </div>

        {/* ── Right sidebar — Live preview ── */}
        <aside className="space-y-6">
          <div className="sticky top-20">
            {/* Preview card */}
            <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
              <div className="flex items-center justify-between border-b px-5 py-3">
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4 text-gray-400" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Preview</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.4)]" />
                  <span className="text-[10px] font-medium text-gray-400">Live</span>
                </div>
              </div>
              <div>
                <div className="group relative aspect-4/5 overflow-hidden bg-gray-100">
                  <img 
                    src={form.imageUrl || 'https://images.unsplash.com/photo-1606167668584-78701c57f13d?w=400'} 
                    alt="Preview" 
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105" 
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-black/10 to-transparent" />
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-primary-50 px-2 py-0.5 text-[10px] font-semibold text-primary-700 uppercase">
                      {form.category}
                    </span>
                    {form.rarity && (
                      <span className="rounded-md bg-purple-50 px-2 py-0.5 text-[10px] font-semibold text-purple-700 uppercase">
                        {form.rarity}
                      </span>
                    )}
                  </div>
                  <h3 className="mt-3 text-lg font-bold text-gray-900 leading-tight">
                    {form.name || 'Untitled Product'}
                  </h3>
                  <p className="mt-0.5 text-xs text-gray-400">
                    {form.set || 'No collection'}
                  </p>
                  <div className="mt-5 flex items-end justify-between border-t pt-4">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Price</p>
                      <p className="text-2xl font-bold text-primary-600">
                        {formatCurrency(Number.isFinite(Number(form.price)) ? Math.round(Number(form.price) * 100) : 0)}
                      </p>
                    </div>
                    <p className="text-xs font-medium text-gray-500">{form.stock || 0} in stock</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Tips */}
            <div className="mt-4 rounded-2xl border bg-gray-50 p-5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Tips</h3>
              <ul className="mt-3 space-y-2 text-xs text-gray-500 leading-relaxed">
                <li>• Keep titles under 60 characters for better search results.</li>
                <li>• Set stock to 0 to hide from the storefront without deleting.</li>
                <li>• High-quality images improve conversion by up to 40%.</li>
              </ul>
            </div>
          </div>
        </aside>
      </form>
    </div>
  );
}
