"use client";

/**
 * [LAYER: UI]
 * Admin Taxonomy Manager — Managing categories and product types.
 * Gives merchants full control over their store's organizational structure.
 */
'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useServices } from '../../hooks/useServices';
import type { ProductCategory, ProductType } from '@domain/models';
import { 
  Plus, 
  Trash2, 
  ListTree, 
  Tag, 
  Search, 
  Save, 
  ChevronRight,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { 
  AdminActionPanel, 
  SkeletonPage, 
  useAdminPageTitle, 
  useToast 
} from '../../components/admin/AdminComponents';
import { SeoSettings } from '../../components/admin/SeoSettings';

export function AdminTaxonomy() {
  useAdminPageTitle('Product Organization');
  const services = useServices();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<'categories' | 'types'>('categories');
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [types, setTypes] = useState<ProductType[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const controllerRef = useRef<AbortController | null>(null);

  // Form states
  const [editItem, setEditItem] = useState<{ id?: string, name: string, slug?: string, description?: string | null } | null>(null);

  const loadTaxonomy = useCallback(async () => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    setLoading(true);
    try {
      const [cats, typs] = await Promise.all([
        services.taxonomyService.getCategories(controller.signal),
        services.taxonomyService.getTypes() // Assuming getTypes doesn't need signal yet but good to add if possible
      ]);
      
      if (!controller.signal.aborted) {
        setCategories(cats);
        setTypes(typs);
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      toast('error', 'Failed to load organization data');
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, [services.taxonomyService, toast]);

  useEffect(() => {
    void loadTaxonomy();
    return () => controllerRef.current?.abort();
  }, [loadTaxonomy]);

  async function handleSave() {
    if (!editItem || !editItem.name.trim()) return;
    setSaving(true);
    try {
      const user = await services.authService.getCurrentUser();
      const actor = { id: user?.id || 'unknown', email: user?.email || 'system' };
      
      if (activeTab === 'categories') {
        await services.taxonomyService.saveCategory({
          id: editItem.id,
          name: editItem.name,
          slug: editItem.slug,
          description: editItem.description
        }, actor);
        toast('success', 'Category saved');
      } else {
        await services.taxonomyService.saveType({
          id: editItem.id,
          name: editItem.name
        }, actor);
        toast('success', 'Product type saved');
      }
      
      setEditItem(null);
      await loadTaxonomy();
    } catch (err) {
      toast('error', 'Failed to save item');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure? This may affect products using this organization.')) return;
    try {
      const user = await services.authService.getCurrentUser();
      const actor = { id: user?.id || 'unknown', email: user?.email || 'system' };
      
      if (activeTab === 'categories') {
        await services.taxonomyService.deleteCategory(id, actor);
      } else {
        await services.taxonomyService.deleteType(id, actor);
      }
      
      toast('success', 'Item deleted');
      await loadTaxonomy();
    } catch (err) {
      toast('error', 'Failed to delete item');
    }
  }

  if (loading) return <SkeletonPage />;

  const filteredCategories = categories.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.slug.toLowerCase().includes(search.toLowerCase())
  );

  const filteredTypes = types.filter(t => 
    t.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex flex-col gap-6 lg:flex-row">
        {/* ── Sidebar: Navigation & Search ── */}
        <aside className="w-full lg:w-80 shrink-0 space-y-4">
          <div className="rounded-xl border bg-white p-2 shadow-xs">
            <button 
              onClick={() => setActiveTab('categories')}
              className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-bold transition ${activeTab === 'categories' ? 'bg-primary-50 text-primary-700 shadow-xs' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              <ListTree className="h-4 w-4" />
              Categories
              <span className="ml-auto text-[10px] font-bold opacity-60">{categories.length}</span>
            </button>
            <button 
              onClick={() => setActiveTab('types')}
              className={`mt-1 flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-bold transition ${activeTab === 'types' ? 'bg-primary-50 text-primary-700 shadow-xs' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              <Tag className="h-4 w-4" />
              Product Types
              <span className="ml-auto text-[10px] font-bold opacity-60">{types.length}</span>
            </button>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input 
              type="text" 
              placeholder={`Search ${activeTab}...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border bg-white pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-500 shadow-xs"
            />
          </div>

          <AdminActionPanel 
            title="Taxonomy Control" 
            description="Categories organize your store navigation, while types define product classifications."
            buttonLabel="View Guide"
            href="/admin/settings"
          />
        </aside>

        {/* ── Main Content: List & Editor ── */}
        <main className="flex-1 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900 tracking-tight">
                {activeTab === 'categories' ? 'Product Categories' : 'Product Types'}
              </h2>
              <p className="text-sm font-medium text-gray-500">
                {activeTab === 'categories' 
                  ? 'Manage high-level navigation and grouping.' 
                  : 'Manage specific product classifications.'}
              </p>
            </div>
            <button 
              onClick={() => setEditItem({ name: '', slug: '', description: '' })}
              className="flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-gray-800"
            >
              <Plus className="h-3.5 w-3.5" />
              Add {activeTab === 'categories' ? 'Category' : 'Type'}
            </button>
          </div>

          {/* Editor Overlay/Form */}
          {editItem && (
            <div className="rounded-xl border-2 border-primary-100 bg-linear-to-br from-primary-50/30 to-white p-6 shadow-md animate-in slide-in-from-top-4">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-4">
                {editItem.id ? 'Edit' : 'New'} {activeTab === 'categories' ? 'Category' : 'Type'}
              </h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Name</label>
                  <input 
                    autoFocus
                    value={editItem.name}
                    onChange={(e) => setEditItem({ ...editItem, name: e.target.value })}
                    placeholder="e.g. Trading Cards"
                    className="w-full rounded-lg border bg-white px-4 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                {activeTab === 'categories' && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">URL Slug</label>
                    <input 
                      value={editItem.slug}
                      onChange={(e) => setEditItem({ ...editItem, slug: e.target.value })}
                      placeholder="e.g. trading-cards"
                      className="w-full rounded-lg border bg-white px-4 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                )}
                {activeTab === 'categories' && (
                  <div className="md:col-span-2 space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Description</label>
                    <textarea 
                      value={editItem.description ?? ''}
                      onChange={(e) => setEditItem({ ...editItem, description: e.target.value })}
                      rows={2}
                      className="w-full rounded-lg border bg-white px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                )}
              </div>
              
              {activeTab === 'categories' && (
                <div className="mt-6 border-t pt-6">
                  <SeoSettings 
                    name={editItem.name}
                    description={editItem.description ?? ''}
                    handle={editItem.slug ?? ''}
                    seoTitle=""
                    seoDescription=""
                    onChange={(name, value) => {
                      if (name === 'handle') setEditItem(prev => ({ ...prev!, slug: value }));
                      else if (name === 'seoDescription') setEditItem(prev => ({ ...prev!, description: value }));
                      // Note: seoTitle is not supported yet for categories in the model, but we show it in preview
                    }}
                    baseUrl="dreambeesart.com/collections"
                  />
                </div>
              )}

              <div className="mt-6 flex items-center justify-end gap-3">
                <button 
                  onClick={() => setEditItem(null)}
                  className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-gray-900"
                >
                  Cancel
                </button>
                <button 
                  disabled={saving}
                  onClick={handleSave}
                  className="flex items-center gap-2 rounded-lg bg-primary-600 px-6 py-2 text-xs font-bold text-white shadow-sm hover:bg-primary-700 disabled:opacity-50"
                >
                  {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                  Save {activeTab === 'categories' ? 'Category' : 'Type'}
                </button>
              </div>
            </div>
          )}

          {/* Data List */}
          <div className="rounded-xl border bg-white overflow-hidden shadow-sm">
            <div className="divide-y">
              {activeTab === 'categories' ? (
                filteredCategories.length > 0 ? (
                  filteredCategories.map(cat => (
                    <div key={cat.id} className="group flex items-center justify-between px-6 py-4 transition hover:bg-gray-50/50">
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-gray-500 group-hover:bg-primary-50 group-hover:text-primary-600 transition">
                          <ListTree className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">{cat.name}</p>
                          <p className="text-[10px] font-bold text-gray-400 tracking-wide">{cat.slug}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition">
                        <button 
                          onClick={() => setEditItem(cat)}
                          className="p-2 text-gray-400 hover:text-primary-600"
                        >
                          <ChevronRight className="h-5 w-5" />
                        </button>
                        <button 
                          onClick={() => handleDelete(cat.id)}
                          className="p-2 text-gray-400 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <EmptyState tab="categories" onAdd={() => setEditItem({ name: '', slug: '', description: '' })} />
                )
              ) : (
                filteredTypes.length > 0 ? (
                  filteredTypes.map(t => (
                    <div key={t.id} className="group flex items-center justify-between px-6 py-4 transition hover:bg-gray-50/50">
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-gray-500 group-hover:bg-primary-50 group-hover:text-primary-600 transition">
                          <Tag className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">{t.name}</p>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Product Type</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition">
                        <button 
                          onClick={() => setEditItem(t)}
                          className="p-2 text-gray-400 hover:text-primary-600"
                        >
                          <ChevronRight className="h-5 w-5" />
                        </button>
                        <button 
                          onClick={() => handleDelete(t.id)}
                          className="p-2 text-gray-400 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <EmptyState tab="types" onAdd={() => setEditItem({ name: '' })} />
                )
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-100 p-4 text-xs font-medium text-amber-800">
            <AlertCircle className="h-4 w-4 shrink-0" />
            Changing category names or product types will not automatically update existing products that use the old values.
          </div>
        </main>
      </div>
    </div>
  );
}

function EmptyState({ tab, onAdd }: { tab: string, onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-50 text-gray-300">
        <ListTree className="h-8 w-8" />
      </div>
      <h3 className="mt-4 text-sm font-bold text-gray-900">No {tab} found</h3>
      <p className="mt-1 text-xs text-gray-500 max-w-[200px]">Create your first {tab === 'categories' ? 'category' : 'product type'} to start organizing your catalog.</p>
      <button 
        onClick={onAdd}
        className="mt-6 flex items-center gap-2 rounded-lg border border-primary-200 bg-primary-50 px-4 py-2 text-xs font-bold text-primary-700 shadow-xs transition hover:bg-primary-100"
      >
        <Plus className="h-3.5 w-3.5" />
        Create {tab === 'categories' ? 'Category' : 'Type'}
      </button>
    </div>
  );
}
