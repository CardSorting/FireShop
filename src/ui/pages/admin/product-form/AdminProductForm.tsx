'use client';
"use client";

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  BarChart3,
  Check,
  CheckCircle2,
  ExternalLink,
  Globe,
  Image as ImageIcon,
  Save,
  Settings,
  Truck,
  AlertCircle,
  AlertTriangle,
  FileText,
  FileUp,
  Download,
} from 'lucide-react';
import type { DigitalAsset } from '@domain/models';
import { formatCurrency } from '@utils/formatters';
import { SkeletonPage, AdminConfirmDialog } from '../../../components/admin/AdminComponents';
import { CategorySelect, TagInput } from '../../../components/admin/AdminInputs';
import { SeoSettings } from '../../../components/admin/SeoSettings';
import { AdminMediaManager } from '../../../components/admin/AdminMediaManager';
import { DigitalAssetManager } from '@ui/components/admin/DigitalAssetManager';

import { useProductForm } from './hooks/useProductForm';
import { TextInput, MoneyInput, Checkbox } from './components/FormInputs';
import { ProductVariations } from './components/ProductVariations';
import { CLASSIFICATIONS, SALES_CHANNELS } from './types';
import { centsFromInput, csvToList } from './utils';

export function AdminProductForm() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const isEdit = Boolean(id);

  const {
    form,
    categories,
    productTypes,
    shippingClasses,
    newTypeName,
    setNewTypeName,
    showAddType,
    setShowAddType,
    saving,
    loadingProduct,
    error,
    unsaved,
    handleChange,
    handleCheckbox,
    toggleSalesChannel,
    setFieldValue,
    handleSubmit,
    handleAddType,
    handleDuplicate,
    generateHandle,
  } = useProductForm(id);

  const [showConfirmDuplicate, setShowConfirmDuplicate] = useState(false);

  // --- NAVIGATION GUARD ---
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (unsaved) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [unsaved]);

  useEffect(() => {
    const title = isEdit ? `${form.name || 'Edit product'} · DreamBees Art Admin` : 'Add product · DreamBees Art Admin';
    document.title = title;
    return () => { document.title = 'DreamBees Art'; };
  }, [isEdit, form.name]);

  const priceCents = centsFromInput(form.price) ?? 0;
  const costCents = centsFromInput(form.cost);
  const marginPercent = useMemo(() => {
    if (!costCents || priceCents <= 0) return null;
    return Math.round(((priceCents - costCents) / priceCents) * 1000) / 10;
  }, [costCents, priceCents]);

  const setupChecklist = [
    { label: 'Has image', done: Boolean(form.imageUrl.trim()) },
    { label: 'Has SKU', done: Boolean(form.sku.trim()) },
    { label: 'Has price', done: priceCents > 0 },
    { label: 'Has cost', done: costCents !== undefined },
    { label: 'Published to online store', done: form.status === 'active' && form.salesChannels.includes('online_store') },
    { label: 'Digital assets configured', done: !form.isDigital || (form.isDigital && form.digitalAssets.length > 0) },
  ];

  if (loadingProduct) return <SkeletonPage />;

  return (
    <div className="animate-in fade-in duration-500 pb-20">
      <div className="sticky top-[-32px] z-30 mb-6 flex items-center justify-between border-b bg-[#F6F6F7]/80 pb-4 pt-8 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/admin/products')} className="flex h-8 w-8 items-center justify-center rounded-lg border bg-white text-gray-500 shadow-sm transition hover:text-gray-900">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900 leading-none">{isEdit ? form.name || 'Edit product' : 'New product'}</h1>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-gray-500">Guided merchant setup</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {unsaved && <span className="hidden rounded-md bg-amber-50 px-2 py-1 text-xs font-bold text-amber-600 sm:inline-flex">Unsaved Changes</span>}
          
          {isEdit && (
            <button 
              type="button"
              onClick={() => setShowConfirmDuplicate(true)}
              className="hidden rounded-lg border bg-white px-4 py-2 text-xs font-bold text-gray-700 shadow-sm transition hover:bg-gray-50 sm:block"
            >
              Duplicate
            </button>
          )}

          <button onClick={() => router.push('/admin/products')} className="rounded-lg border bg-white px-4 py-2 text-xs font-bold text-gray-700 shadow-sm transition hover:bg-gray-50">Cancel</button>
          <button form="product-form" data-testid="save-product" type="submit" disabled={saving} className="flex items-center gap-2 rounded-lg bg-primary-600 px-6 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-primary-700 disabled:opacity-50">
            <Save className="h-4 w-4" /> {saving ? 'Saving…' : 'Save product'}
          </button>
          
          {isEdit && form.status === 'active' && (
            <Link href={`/products/${form.handle || id}`} target="_blank" className="flex items-center gap-2 rounded-lg border bg-white px-4 py-2 text-xs font-bold text-gray-700 shadow-sm transition hover:bg-gray-50">
              <ExternalLink className="h-4 w-4 text-gray-400" /> View
            </Link>
          )}
        </div>
      </div>

      {error && <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700 flex items-center gap-2"><AlertCircle className="h-4 w-4" /> {error}</div>}

      <form id="product-form" onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <section className="rounded-xl border bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Title + description</h2>
              <span className={`text-[10px] font-bold ${form.description.length > 500 ? 'text-amber-600' : 'text-gray-400'}`}>
                {form.description.length} / 500+
              </span>
            </div>
            <div className="space-y-4">
              <input name="name" data-testid="product-name" value={form.name} onChange={handleChange} required placeholder="Product title" className="w-full rounded-lg border bg-gray-50 px-4 py-3 text-lg font-bold outline-none transition focus:ring-2 focus:ring-primary-500" />
              <textarea name="description" data-testid="product-description" value={form.description} onChange={handleChange} required rows={6} placeholder="Describe condition, edition, contents, and sales details." className="w-full rounded-lg border bg-gray-50 px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-primary-500" />
            </div>
          </section>

          <AdminMediaManager
            media={form.media}
            onChange={(media) => {
              setFieldValue('media', media);
              if (media.length > 0) {
                setFieldValue('imageUrl', media[0].url);
              } else {
                setFieldValue('imageUrl', '');
              }
            }}
            folder="products"
          />

          <section className="rounded-xl border bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">Pricing</h2>
            <div className="grid gap-4 md:grid-cols-3">
              <MoneyInput label="Price" id="product-price" name="price" value={form.price} onChange={handleChange} required />
              <MoneyInput label="Compare-at price" id="product-compare-price" name="compareAtPrice" value={form.compareAtPrice} onChange={handleChange} />
              <MoneyInput label="Unit cost" id="product-cost" name="cost" value={form.cost} onChange={handleChange} />
            </div>
            <div className="mt-4 flex items-center justify-between rounded-lg bg-gray-50 p-4 text-sm">
              <div>
                <span className="font-bold text-gray-900">Margin preview: </span>
                <span className={marginPercent !== null && marginPercent < 15 ? 'font-bold text-red-600' : 'font-bold text-green-700'}>{marginPercent === null ? 'Add cost to calculate margin' : `${marginPercent}% gross margin`}</span>
              </div>
              {marginPercent !== null && marginPercent < 15 && (
                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-red-600">
                  <AlertTriangle className="h-3 w-3" /> Low Margin
                </div>
              )}
            </div>
          </section>

          <section className="rounded-xl border bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">Inventory</h2>
            <div className="grid gap-4 md:grid-cols-3">
              <TextInput 
                label="SKU" 
                id="product-sku" 
                name="sku" 
                value={form.sku} 
                onChange={handleChange} 
                placeholder="SKU-12345" 
                disabled={form.hasVariants}
              />
              <TextInput 
                label="Barcode / UPC" 
                id="product-barcode" 
                name="barcode" 
                value={form.barcode} 
                onChange={handleChange} 
                disabled={form.hasVariants}
              />
              <TextInput 
                label="Quantity available" 
                id="product-stock" 
                name="stock" 
                value={form.stock} 
                onChange={handleChange} 
                type="number" 
                required 
                disabled={form.hasVariants}
              />
              <TextInput label="Reorder point" id="product-reorder-point" name="reorderPoint" value={form.reorderPoint} onChange={handleChange} type="number" />
              <TextInput label="Reorder quantity" id="product-reorder-qty" name="reorderQuantity" value={form.reorderQuantity} onChange={handleChange} type="number" />
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <Checkbox label="Track quantity" checked={form.trackQuantity} onChange={(checked) => handleCheckbox('trackQuantity', checked)} />
              <Checkbox label="Continue selling when out of stock" checked={form.continueSellingWhenOutOfStock} onChange={(checked) => handleCheckbox('continueSellingWhenOutOfStock', checked)} />
            </div>
            {form.hasVariants && (
              <div className="mt-3 flex items-start gap-2 rounded-lg bg-blue-50 p-3 text-[10px] font-bold text-blue-700 uppercase tracking-tight">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                <span>Inventory for this product is managed by individual variants below.</span>
              </div>
            )}
          </section>

          <ProductVariations 
            hasVariants={form.hasVariants}
            options={form.options}
            variants={form.variants}
            basePrice={form.price}
            baseSku={form.sku}
            baseStock={form.stock}
            onChange={(updates) => {
              Object.entries(updates).forEach(([key, value]) => {
                setFieldValue(key as any, value);
              });
            }}
          />

          <section className="rounded-xl border bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                <FileText className="h-4 w-4" /> Digital Downloads
              </h2>
              <Checkbox label="This is a digital product" checked={form.isDigital} onChange={(checked) => handleCheckbox('isDigital', checked)} />
            </div>
            
            {form.isDigital ? (
              <div className="space-y-4">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Digital Assets</p>
                <DigitalAssetManager 
                  assets={form.digitalAssets} 
                  onChange={(assets: DigitalAsset[]) => setFieldValue('digitalAssets', assets)} 
                />
                <div className="rounded-lg bg-primary-50 p-4 text-xs font-medium text-primary-700">
                  Customers will receive download links for these assets after their order is paid.
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed bg-gray-50/50 p-8 text-center">
                <FileText className="mb-2 h-8 w-8 text-gray-300" />
                <p className="text-xs font-bold text-gray-400">Not a digital product</p>
                <p className="mt-1 text-[10px] text-gray-400 max-w-[200px]">Enable the toggle above to attach files for customers to download after purchase.</p>
              </div>
            )}
          </section>

          <section className="rounded-xl border bg-white p-5 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-400"><Truck className="h-4 w-4" /> Shipping / physical item</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <Checkbox label="This is a physical item" checked={form.physicalItem} onChange={(checked) => handleCheckbox('physicalItem', checked)} />
              <TextInput label="Weight (grams)" name="weightGrams" value={form.weightGrams} onChange={handleChange} type="number" disabled={!form.physicalItem} />
            </div>
            {form.isDigital && form.physicalItem && (
              <div className="mt-3 flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-[10px] font-bold text-amber-700 uppercase tracking-tight">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                <span>Note: This product is marked as both Digital and Physical. Shipping will be calculated for the physical component.</span>
              </div>
            )}
          </section>

          <section className="rounded-xl border bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">Supplier & intake</h2>
            <div className="grid gap-4 md:grid-cols-3">
              <TextInput label="Manufacturer / Brand" name="manufacturer" value={form.manufacturer} onChange={handleChange} placeholder="Vendor name" />
              <TextInput label="Supplier / wholesaler" name="supplier" value={form.supplier} onChange={handleChange} />
              <TextInput label="Manufacturer SKU" name="manufacturerSku" value={form.manufacturerSku} onChange={handleChange} />
            </div>
            <textarea name="adminNotes" value={form.adminNotes} onChange={handleChange} rows={3} placeholder="Admin notes/history placeholder: invoice notes, supplier terms, receiving context…" className="mt-4 w-full rounded-lg border bg-gray-50 px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-primary-500" />
          </section>

          <section className="rounded-xl border bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Custom Attributes (Metafields)</h2>
              <span className="rounded-full bg-primary-100 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-primary-600">Extensible</span>
            </div>
            <p className="rounded-lg border-2 border-dashed bg-gray-50 p-6 text-center text-xs font-medium text-gray-500">
              Define custom fields like "Material", "Color", or "Internal ID" using the Metafields engine.
            </p>
            <div className="mt-4 flex justify-center">
              <button type="button" className="text-[10px] font-bold uppercase tracking-widest text-primary-600 hover:underline">Add custom field</button>
            </div>
          </section>

          <SeoSettings
            name={form.name}
            description={form.description}
            seoTitle={form.seoTitle}
            seoDescription={form.seoDescription}
            handle={form.handle}
            isEdit={isEdit}
            onChange={(name, value) => {
              setFieldValue(name as any, value);
            }}
          />
        </div>

        <aside className="space-y-6">
          <section className="rounded-xl border bg-white p-5 shadow-sm overflow-hidden relative">
            <div className="absolute top-0 left-0 w-1 h-full bg-primary-500" />
            <h2 className="mb-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-400"><CheckCircle2 className="h-4 w-4" /> Setup checklist</h2>
            <div className="space-y-4">
              <div className="relative h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="absolute top-0 left-0 h-full bg-green-500 transition-all duration-700" 
                  style={{ width: `${(setupChecklist.filter(i => i.done).length / setupChecklist.length) * 100}%` }} 
                />
              </div>
              <div className="space-y-3">
                {setupChecklist.map((item) => (
                  <div key={item.label} className="flex items-center justify-between text-xs font-bold">
                    <span className={item.done ? 'text-gray-900' : 'text-gray-400'}>{item.label}</span>
                    <span className={item.done ? 'text-green-600' : 'text-amber-600'}>
                      {item.done ? <Check className="h-3 w-3 inline mr-1" /> : null}
                      {item.done ? 'Done' : 'Needs work'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="rounded-xl border bg-white p-5 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-400"><Settings className="h-4 w-4" /> Product organization</h2>
            <div className="space-y-5">
              <CategorySelect 
                label="Category" 
                value={form.category} 
                onChange={(val) => setFieldValue('category', val)}
                categories={['general', ...categories.map(c => c.slug)]}
              />

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Product type</label>
                  <button type="button" onClick={() => setShowAddType(!showAddType)} className="text-[10px] font-bold text-primary-600 hover:underline">
                    {showAddType ? 'Cancel' : '+ Add new'}
                  </button>
                </div>
                {showAddType ? (
                  <div className="flex gap-2">
                    <input 
                      value={newTypeName} 
                      onChange={(e) => setNewTypeName(e.target.value)}
                      placeholder="New type name"
                      className="flex-1 rounded-lg border bg-white px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-primary-500"
                    />
                    <button type="button" onClick={handleAddType} className="rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-bold text-white">Add</button>
                  </div>
                ) : (
                  <select 
                    name="productType" 
                    id="product-type"
                    data-testid="product-type"
                    value={form.productType} 
                    onChange={handleChange}
                    className="w-full rounded-lg border bg-gray-50 px-4 py-2.5 text-sm font-bold outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">None</option>
                    {productTypes.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                  </select>
                )}
              </div>
              <TextInput label="Vendor / brand" name="vendor" value={form.vendor} onChange={handleChange} placeholder="Pokémon" />
              
              <TagInput 
                label="Collections" 
                tags={csvToList(form.collections)} 
                onChange={(tags) => setFieldValue('collections', tags.join(', '))}
                placeholder="Featured, Scarlet & Violet..."
              />
              <TagInput 
                label="Tags" 
                tags={csvToList(form.tags)} 
                onChange={(tags) => setFieldValue('tags', tags.join(', '))}
                placeholder="Vintage, holo, sealed..."
                suggestions={['New Release', 'Pre-order', 'Best Seller', 'Limited Edition', 'Bargain Bin']}
              />
              <TextInput label="Collection / Series" name="set" value={form.set} onChange={handleChange} placeholder="Summer 2026, Core..." />
              <div>
                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-gray-500">Classification</label>
                <select name="rarity" value={form.rarity} onChange={handleChange} className="w-full rounded-lg border bg-gray-50 px-4 py-2.5 text-sm font-bold outline-none focus:ring-2 focus:ring-primary-500">
                  <option value="">None</option>
                  {CLASSIFICATIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Shipping Class</label>
                <select 
                  name="shippingClassId" 
                  value={form.shippingClassId} 
                  onChange={handleChange}
                  className="w-full rounded-lg border bg-gray-50 px-4 py-2.5 text-sm font-bold outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Default (Flat Rate)</option>
                  {shippingClasses.map(sc => (
                    <option key={sc.id} value={sc.id}>{sc.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          <section className="rounded-xl border bg-white p-5 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-400"><Globe className="h-4 w-4" /> Publishing</h2>
            <select name="status" value={form.status} onChange={handleChange} className="w-full rounded-lg border bg-gray-50 px-4 py-2.5 text-sm font-bold outline-none transition focus:ring-2 focus:ring-primary-500">
              <option value="active">Active</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
            <div className="mt-4 space-y-2">
              {SALES_CHANNELS.map((channel) => <Checkbox key={channel.value} label={channel.label} checked={form.salesChannels.includes(channel.value)} onChange={() => toggleSalesChannel(channel.value)} />)}
            </div>
          </section>

          <section className="rounded-xl border bg-white p-5 shadow-sm space-y-2">
            <div className="flex items-center justify-between mb-3">
              <h2 className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-400"><BarChart3 className="h-4 w-4" /> Pricing insight</h2>
              <button type="button" onClick={generateHandle} className="text-[10px] font-bold uppercase text-primary-600 hover:underline">Regen Handle</button>
            </div>
            <div className="flex items-center justify-between text-xs font-bold"><span className="text-gray-500">Price</span><span>{formatCurrency(priceCents)}</span></div>
            <div className="flex items-center justify-between text-xs font-bold"><span className="text-gray-500">Cost</span><span>{costCents !== undefined ? formatCurrency(costCents) : '—'}</span></div>
            <div className="flex items-center justify-between text-xs font-bold"><span className="text-gray-500">Margin</span><span>{marginPercent === null ? 'Unknown' : `${marginPercent}%`}</span></div>
          </section>
        </aside>
      </form>

      <AdminConfirmDialog 
        open={showConfirmDuplicate}
        onClose={() => setShowConfirmDuplicate(false)}
        onConfirm={() => {
          setShowConfirmDuplicate(false);
          handleDuplicate();
        }}
        title="Duplicate product?"
        description="This will create a new draft product with the same details, but a different handle and '(Copy)' appended to the name."
        confirmLabel="Duplicate as draft"
        variant="primary"
      />
    </div>
  );
}
