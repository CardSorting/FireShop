'use client';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Tag, Plus, Search, MoreVertical, Trash2, Edit2, ChevronRight,
  MessageSquare, LayoutGrid, List, Filter, Save, X, Sparkles, RotateCw
} from 'lucide-react';
import { useServices } from '../../hooks/useServices';
import type { SupportMacro } from '@domain/models';
import { 
  AdminPageHeader, 
  AdminEmptyState, 
  SkeletonRow, 
  useToast, 
  useAdminPageTitle 
} from '../../components/admin/AdminComponents';

export function AdminSupportMacros() {
  useAdminPageTitle('Support Macros');
  const services = useServices();
  const { toast } = useToast();
  
  const [macros, setMacros] = useState<SupportMacro[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [editingMacro, setEditingMacro] = useState<Partial<SupportMacro> | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const loadMacros = useCallback(async () => {
    setLoading(true);
    try {
      const result = await services.ticketService.getMacros();
      setMacros(result || []);
    } catch (err) {
      toast('error', 'Failed to load macros');
    } finally {
      setLoading(false);
    }
  }, [services.ticketService, toast]);

  useEffect(() => {
    void loadMacros();
  }, [loadMacros]);

  const filteredMacros = useMemo(() => {
    if (!query) return macros;
    const needle = query.toLowerCase();
    return macros.filter(m => 
      m.name.toLowerCase().includes(needle) || 
      m.content.toLowerCase().includes(needle) ||
      m.category.toLowerCase().includes(needle)
    );
  }, [macros, query]);

  const categories = useMemo(() => {
    const cats = new Set(macros.map(m => m.category));
    return Array.from(cats).sort();
  }, [macros]);

  const handleSave = async () => {
    if (!editingMacro?.name || !editingMacro?.content || !editingMacro?.category) {
      toast('error', 'Please fill in all required fields');
      return;
    }

    setIsSaving(true);
    try {
      if (editingMacro.id) {
        await services.ticketService.updateMacro(editingMacro.id, editingMacro);
        toast('success', 'Macro updated successfully');
      } else {
        await services.ticketService.saveMacro(editingMacro);
        toast('success', 'Macro created successfully');
      }
      setEditingMacro(null);
      await loadMacros();
    } catch (err) {
      toast('error', 'Failed to save macro');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this macro?')) return;
    try {
      await services.ticketService.deleteMacro(id);
      toast('success', 'Macro deleted');
      await loadMacros();
    } catch (err) {
      toast('error', 'Failed to delete macro');
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] animate-in fade-in duration-500">
      <AdminPageHeader
        title="Support Macros"
        subtitle="Manage saved replies to improve agent efficiency"
        actions={
          <button 
            onClick={() => setEditingMacro({ name: '', content: '', category: 'General' })}
            className="flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-white transition hover:bg-black"
          >
            <Plus className="h-4 w-4" />
            New Macro
          </button>
        }
      />

      <div className="mt-8 flex flex-1 gap-8 overflow-hidden">
        {/* List View */}
        <div className="flex-1 flex flex-col bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-2xl shadow-gray-200/50">
          <div className="flex items-center justify-between p-4 border-b bg-gray-50/50">
            <div className="relative flex-1 max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search macros..."
                className="w-full rounded-xl border bg-white py-2 pl-9 pr-3 text-xs focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{filteredMacros.length} Macros</span>
            </div>
          </div>

          <div className="flex-1 overflow-auto scrollbar-hide p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {loading && [1, 2, 3, 4].map(i => (
                <div key={i} className="h-32 rounded-2xl bg-gray-50 animate-pulse" />
              ))}
              {!loading && filteredMacros.map(macro => (
                <div 
                  key={macro.id}
                  className="group relative flex flex-col p-5 border border-gray-100 rounded-2xl hover:border-primary-200 hover:shadow-lg hover:shadow-primary-500/5 transition-all bg-white"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <span className="text-[9px] font-black uppercase tracking-widest text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full mb-2 inline-block">
                        {macro.category}
                      </span>
                      <h4 className="text-sm font-black text-gray-900 group-hover:text-primary-700 transition-colors">{macro.name}</h4>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => setEditingMacro(macro)}
                        className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-900 transition-colors"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button 
                        onClick={() => handleDelete(macro.id)}
                        className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 font-medium line-clamp-3 flex-1 leading-relaxed">
                    {macro.content}
                  </p>
                </div>
              ))}
            </div>
            {!loading && filteredMacros.length === 0 && (
              <AdminEmptyState
                title="No macros found"
                description="Create your first macro to speed up support responses"
                icon={Tag}
              />
            )}
          </div>
        </div>

        {/* Edit Panel (Conditional) */}
        {editingMacro && (
          <aside className="w-96 bg-white border border-gray-100 rounded-3xl shadow-2xl flex flex-col animate-in slide-in-from-right-8">
            <div className="p-6 border-b flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-widest text-gray-900">
                {editingMacro.id ? 'Edit Macro' : 'New Macro'}
              </h3>
              <button onClick={() => setEditingMacro(null)} className="p-2 hover:bg-gray-100 rounded-xl text-gray-400 transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <div className="p-6 flex-1 overflow-y-auto space-y-6">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Macro Name</label>
                <input 
                  value={editingMacro.name}
                  onChange={e => setEditingMacro({...editingMacro, name: e.target.value})}
                  placeholder="e.g. Refund Approved"
                  className="w-full rounded-xl border-2 border-gray-50 bg-gray-50 px-4 py-2.5 text-xs font-bold focus:border-primary-500 focus:bg-white focus:ring-4 focus:ring-primary-500/10 outline-none transition"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Category</label>
                <div className="relative">
                  <input 
                    list="categories"
                    value={editingMacro.category}
                    onChange={e => setEditingMacro({...editingMacro, category: e.target.value})}
                    placeholder="e.g. Shipping, Billing..."
                    className="w-full rounded-xl border-2 border-gray-50 bg-gray-50 px-4 py-2.5 text-xs font-bold focus:border-primary-500 focus:bg-white focus:ring-4 focus:ring-primary-500/10 outline-none transition"
                  />
                  <datalist id="categories">
                    {categories.map(c => <option key={c} value={c} />)}
                  </datalist>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Reply Content</label>
                <textarea 
                  value={editingMacro.content}
                  onChange={e => setEditingMacro({...editingMacro, content: e.target.value})}
                  placeholder="The message to be inserted into the reply..."
                  rows={10}
                  className="w-full rounded-xl border-2 border-gray-50 bg-gray-50 px-4 py-2.5 text-xs font-medium focus:border-primary-500 focus:bg-white focus:ring-4 focus:ring-primary-500/10 outline-none transition resize-none leading-relaxed"
                />
                <p className="mt-2 text-[10px] text-gray-400 font-medium leading-relaxed">
                  Supported placeholders: <code className="text-primary-600">{"{{customer.first_name}}"}</code>, <code className="text-primary-600">{"{{ticket.id}}"}</code>, <code className="text-primary-600">{"{{order.id}}"}</code>, <code className="text-primary-600">{"{{agent.name}}"}</code>
                </p>
              </div>
            </div>

            <div className="p-6 border-t bg-gray-50/50">
              <button 
                onClick={handleSave}
                disabled={isSaving}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-white transition hover:bg-primary-700 shadow-lg shadow-primary-500/20 disabled:opacity-50"
              >
                {isSaving ? <RotateCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save Macro
              </button>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
