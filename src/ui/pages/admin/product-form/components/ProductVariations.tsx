'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  X, 
  ChevronDown, 
  GripVertical, 
  Trash2, 
  Settings2, 
  AlertCircle,
  Copy,
  ArrowRight,
  Package,
  DollarSign,
  Check,
  MoreVertical,
  Layers,
  Image as ImageIcon
} from 'lucide-react';
import type { ProductOption, ProductVariant } from '@domain/models';
import { TextInput, MoneyInput } from './FormInputs';
import { centsFromInput } from '../utils';
import { formatCurrency } from '@utils/formatters';
import Image from 'next/image';
import { sanitizeImageUrl } from '@utils/sanitizer';

interface ProductVariationsProps {
  hasVariants: boolean;
  options: ProductOption[];
  variants: ProductVariant[];
  basePrice: string;
  baseSku: string;
  baseStock: string;
  onChange: (updates: { 
    hasVariants?: boolean; 
    options?: ProductOption[]; 
    variants?: ProductVariant[];
    stock?: string;
  }) => void;
}

export function ProductVariations({ 
  hasVariants, 
  options, 
  variants, 
  basePrice, 
  baseSku, 
  baseStock,
  onChange 
}: ProductVariationsProps) {
  const [isEditingOptions, setIsEditingOptions] = useState(false);
  const [selectedVariants, setSelectedVariants] = useState<string[]>([]);
  const [showBulkMenu, setShowBulkMenu] = useState(false);

  // --- GENERATION LOGIC ---
  const generateVariants = (currentOptions: ProductOption[]) => {
    const activeOptions = currentOptions.filter(o => o.name && o.values.length > 0);
    if (activeOptions.length === 0) return [];

    const cartesian = (...a: string[][]) => a.reduce((acc, val) => acc.flatMap(d => val.map(e => [...d, e])), [[]] as string[][]);
    
    const combinations = cartesian(...activeOptions.map(o => o.values));
    
    return combinations.map((combo: string[]) => {
      const title = combo.join(' / ');
      
      // Try to find existing variant to preserve data (ID and custom fields)
      const existing = variants.find(v => 
        v.option1 === combo[0] && 
        (combo.length < 2 || v.option2 === combo[1]) && 
        (combo.length < 3 || v.option3 === combo[2])
      );

      if (existing) return existing;

      return {
        id: crypto.randomUUID(),
        productId: '',
        title,
        price: centsFromInput(basePrice) || 0,
        stock: parseInt(baseStock) || 0,
        sku: baseSku ? `${baseSku}-${combo.join('-').toUpperCase().replace(/\s+/g, '')}` : '',
        option1: combo[0],
        option2: combo[1] || undefined,
        option3: combo[2] || undefined,
        createdAt: new Date(),
        updatedAt: new Date()
      } as ProductVariant;
    });
  };

  const handleToggleVariants = (checked: boolean) => {
    if (checked && options.length === 0) {
      const initialOptions: ProductOption[] = [
        { id: crypto.randomUUID(), productId: '', name: 'Size', position: 0, values: [] }
      ];
      onChange({ hasVariants: true, options: initialOptions, variants: [] });
      setIsEditingOptions(true);
    } else {
      onChange({ hasVariants: checked });
    }
  };

  const addOption = () => {
    if (options.length >= 3) return;
    const newOptions = [
      ...options,
      { id: crypto.randomUUID(), productId: '', name: '', position: options.length, values: [] }
    ];
    onChange({ options: newOptions });
  };

  const updateOption = (index: number, updates: Partial<ProductOption>) => {
    const newOptions = [...options];
    newOptions[index] = { ...newOptions[index], ...updates };
    onChange({ options: newOptions });
  };

  const removeOption = (index: number) => {
    const newOptions = options.filter((_, i) => i !== index).map((o, i) => ({ ...o, position: i }));
    onChange({ options: newOptions });
  };

  const handleOptionsSave = () => {
    const newVariants = generateVariants(options);
    const totalStock = newVariants.reduce((sum, v) => sum + v.stock, 0);
    onChange({ 
      variants: newVariants,
      stock: String(totalStock)
    });
    setIsEditingOptions(false);
  };

  const updateVariant = (id: string, updates: Partial<ProductVariant>) => {
    const newVariants = variants.map(v => v.id === id ? { ...v, ...updates, updatedAt: new Date() } : v);
    if (updates.stock !== undefined) {
      const totalStock = newVariants.reduce((sum, v) => sum + v.stock, 0);
      onChange({ variants: newVariants, stock: String(totalStock) });
    } else {
      onChange({ variants: newVariants });
    }
  };

  // --- BULK ACTIONS ---
  const toggleSelectAll = () => {
    if (selectedVariants.length === variants.length) {
      setSelectedVariants([]);
    } else {
      setSelectedVariants(variants.map(v => v.id));
    }
  };

  const toggleSelectVariant = (id: string) => {
    setSelectedVariants(prev => 
      prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id]
    );
  };

  const bulkUpdate = (updates: Partial<ProductVariant>) => {
    const targetIds = selectedVariants.length > 0 ? selectedVariants : variants.map(v => v.id);
    const newVariants = variants.map(v => 
      targetIds.includes(v.id) ? { ...v, ...updates, updatedAt: new Date() } : v
    );
    
    if (updates.stock !== undefined) {
      const totalStock = newVariants.reduce((sum, v) => sum + v.stock, 0);
      onChange({ variants: newVariants, stock: String(totalStock) });
    } else {
      onChange({ variants: newVariants });
    }
    setShowBulkMenu(false);
  };

  const applyBasePriceToSelected = () => bulkUpdate({ price: centsFromInput(basePrice) || 0 });
  const applyBaseSkuToSelected = () => bulkUpdate({ sku: baseSku });

  return (
    <section className="rounded-xl border bg-white shadow-sm overflow-hidden transition-all duration-300">
      <div className="p-5 border-b bg-gray-50/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-100 text-primary-600">
              <Layers className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Variations</h2>
              <p className="text-sm font-bold text-gray-900">Manage SKU variations</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-bold text-gray-500 uppercase">Multiple options?</span>
            <button 
              type="button"
              onClick={() => handleToggleVariants(!hasVariants)}
              className={`
                relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
                ${hasVariants ? 'bg-primary-600' : 'bg-gray-200'}
              `}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${hasVariants ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
        </div>
      </div>

      {!hasVariants ? (
        <div className="p-10 flex flex-col items-center justify-center text-center space-y-4">
          <div className="h-16 w-16 rounded-full bg-gray-50 flex items-center justify-center border-2 border-dashed border-gray-200 group-hover:border-primary-200 transition-colors">
            <Plus className="h-8 w-8 text-gray-300 group-hover:text-primary-400" />
          </div>
          <div className="max-w-[340px]">
            <p className="text-sm font-bold text-gray-700">Add options like size or color</p>
            <p className="mt-1 text-xs text-gray-500 leading-relaxed">This product has multiple options, like different sizes or colors. Each combination creates a unique variant you can track.</p>
          </div>
          <button 
            type="button" 
            onClick={() => handleToggleVariants(true)}
            className="rounded-lg bg-white px-4 py-2 text-xs font-bold text-primary-600 ring-1 ring-primary-100 shadow-sm hover:bg-primary-50 transition"
          >
            + Create variations
          </button>
        </div>
      ) : (
        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
          {/* Options Editor */}
          <div className="p-5 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Option Definitions</h3>
              {!isEditingOptions && (
                <button 
                  type="button" 
                  onClick={() => setIsEditingOptions(true)}
                  className="flex items-center gap-1.5 text-xs font-bold text-primary-600 hover:underline"
                >
                  <Settings2 className="h-3.5 w-3.5" /> Edit options
                </button>
              )}
            </div>

            {isEditingOptions ? (
              <div className="space-y-4 rounded-xl border bg-gray-50/50 p-4">
                {options.map((option, idx) => (
                  <div key={option.id} className="relative group rounded-lg bg-white border p-4 shadow-sm animate-in zoom-in-95 duration-150">
                    <div className="flex items-start gap-4">
                      <div className="pt-2 text-gray-300 cursor-grab active:cursor-grabbing">
                        <GripVertical className="h-4 w-4" />
                      </div>
                      <div className="flex-1 space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                          <TextInput 
                            label="Option Name" 
                            value={option.name} 
                            onChange={(e) => updateOption(idx, { name: e.target.value })}
                            placeholder="e.g. Size, Color, Material"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Option Values</label>
                          <div className="mt-1.5 flex flex-wrap gap-2">
                            {option.values.map((val, vIdx) => (
                              <span key={vIdx} className="inline-flex items-center gap-1 rounded-lg bg-primary-50 px-2.5 py-1.5 text-xs font-bold text-primary-700 ring-1 ring-primary-100 transition hover:bg-primary-100">
                                {val}
                                <button 
                                  type="button" 
                                  onClick={() => updateOption(idx, { values: option.values.filter((_, i) => i !== vIdx) })}
                                  className="rounded-full p-0.5 hover:bg-primary-200 transition-colors"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </span>
                            ))}
                            <div className="flex-1 min-w-[120px] relative">
                              <input 
                                placeholder="Add value..."
                                className="w-full text-xs font-medium outline-none bg-transparent py-1.5"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    const val = e.currentTarget.value.trim();
                                    if (val && !option.values.includes(val)) {
                                      updateOption(idx, { values: [...option.values, val] });
                                      e.currentTarget.value = '';
                                    }
                                  }
                                }}
                              />
                              <p className="text-[8px] text-gray-400 uppercase font-bold tracking-tighter">Press Enter to add</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => removeOption(idx)}
                        className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}

                {options.length < 3 && (
                  <button 
                    type="button" 
                    onClick={addOption}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed py-4 text-xs font-bold text-gray-400 hover:bg-white hover:text-primary-600 hover:border-primary-200 transition-all"
                  >
                    <Plus className="h-4 w-4" /> Add another option (Max 3)
                  </button>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <button 
                    type="button" 
                    onClick={() => setIsEditingOptions(false)}
                    className="rounded-lg px-4 py-2 text-xs font-bold text-gray-500 hover:text-gray-700 transition"
                  >
                    Cancel
                  </button>
                  <button 
                    type="button" 
                    onClick={handleOptionsSave}
                    className="flex items-center gap-2 rounded-lg bg-primary-600 px-6 py-2 text-xs font-bold text-white shadow-lg shadow-primary-500/20 hover:bg-primary-700 transition-all active:scale-95"
                  >
                    Save Options
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-4">
                {options.map((option) => (
                  <div key={option.id} className="rounded-xl border bg-gray-50 px-5 py-4 min-w-[160px] relative group overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-primary-200 group-hover:bg-primary-500 transition-colors" />
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{option.name || 'Unnamed Option'}</p>
                    <div className="mt-1 flex items-center justify-between">
                      <p className="text-sm font-bold text-gray-900">{option.values.length} Values</p>
                      <span className="text-[10px] font-medium text-gray-500 truncate max-w-[80px]">{option.values.slice(0, 2).join(', ')}{option.values.length > 2 ? '...' : ''}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Variants Table */}
          {!isEditingOptions && variants.length > 0 && (
            <div className="border-t">
              <div className="p-5 border-b bg-gray-50/30 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500" 
                      checked={selectedVariants.length === variants.length && variants.length > 0}
                      onChange={toggleSelectAll}
                    />
                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Variants ({variants.length})</h3>
                  </div>
                  {selectedVariants.length > 0 && (
                    <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2">
                      <span className="text-[10px] font-bold bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full">{selectedVariants.length} selected</span>
                      <div className="relative">
                        <button 
                          onClick={() => setShowBulkMenu(!showBulkMenu)}
                          className="flex items-center gap-1 text-[10px] font-bold text-primary-600 hover:underline uppercase"
                        >
                          Bulk actions <ChevronDown className="h-3 w-3" />
                        </button>
                        {showBulkMenu && (
                          <div className="absolute left-0 top-full z-50 mt-2 w-48 rounded-xl border bg-white shadow-2xl p-1 animate-in zoom-in-95">
                            <button onClick={applyBasePriceToSelected} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[10px] font-bold uppercase text-gray-700 hover:bg-gray-50 transition">
                              <DollarSign className="h-3.5 w-3.5 text-gray-400" /> Apply base price
                            </button>
                            <button onClick={applyBaseSkuToSelected} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[10px] font-bold uppercase text-gray-700 hover:bg-gray-50 transition">
                              <Copy className="h-3.5 w-3.5 text-gray-400" /> Apply base SKU
                            </button>
                            <div className="h-px bg-gray-100 my-1" />
                            <button onClick={() => setShowBulkMenu(false)} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[10px] font-bold uppercase text-red-600 hover:bg-red-50 transition">
                              <Trash2 className="h-3.5 w-3.5" /> Delete selected
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400">
                  <AlertCircle className="h-3.5 w-3.5" /> Price & Stock per variant
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="border-b bg-gray-50/50 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                      <th className="w-12 px-5 py-3"></th>
                      <th className="px-5 py-3 font-bold">Variant Title</th>
                      <th className="px-5 py-3 font-bold">Price</th>
                      <th className="px-5 py-3 font-bold">SKU</th>
                      <th className="px-5 py-3 font-bold">Stock</th>
                      <th className="px-5 py-3 font-bold"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {variants.map((variant) => (
                      <tr key={variant.id} className={`group hover:bg-primary-50/30 transition-colors ${selectedVariants.includes(variant.id) ? 'bg-primary-50/50' : ''}`}>
                        <td className="px-5 py-4">
                          <input 
                            type="checkbox" 
                            className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500" 
                            checked={selectedVariants.includes(variant.id)}
                            onChange={() => toggleSelectVariant(variant.id)}
                          />
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <button className="h-10 w-10 rounded-lg bg-white border-2 border-dashed flex items-center justify-center overflow-hidden hover:border-primary-300 transition-colors relative">
                              {variant.imageUrl ? (
                                <Image 
                                  src={sanitizeImageUrl(variant.imageUrl)} 
                                  alt={variant.title} 
                                  fill 
                                  className="object-cover" 
                                  sizes="40px"
                                />
                              ) : (
                                <ImageIcon className="h-4 w-4 text-gray-300" />
                              )}
                            </button>
                            <div>
                              <p className="text-sm font-bold text-gray-900">{variant.title}</p>
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                                {[variant.option1, variant.option2, variant.option3].filter(Boolean).join(' • ')}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="relative group/input max-w-[120px]">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">$</span>
                            <input 
                              className="w-full rounded-lg border bg-white px-7 py-2 text-sm font-bold outline-none ring-primary-500 focus:ring-2 focus:border-transparent transition-all"
                              value={(variant.price / 100).toFixed(2)}
                              onChange={(e) => {
                                const cents = centsFromInput(e.target.value);
                                if (cents !== undefined) updateVariant(variant.id, { price: cents });
                              }}
                            />
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <input 
                            className="w-full max-w-[140px] rounded-lg border bg-white px-3 py-2 text-xs font-bold uppercase outline-none ring-primary-500 focus:ring-2 focus:border-transparent transition-all"
                            value={variant.sku || ''}
                            placeholder="Variant SKU"
                            onChange={(e) => updateVariant(variant.id, { sku: e.target.value })}
                          />
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <input 
                              type="number"
                              className="w-20 rounded-lg border bg-white px-3 py-2 text-sm font-bold outline-none ring-primary-500 focus:ring-2 focus:border-transparent text-center transition-all"
                              value={variant.stock}
                              onChange={(e) => updateVariant(variant.id, { stock: parseInt(e.target.value) || 0 })}
                            />
                            <span className={`h-2 w-2 rounded-full ${variant.stock > 0 ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`} />
                          </div>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <button 
                            type="button"
                            className="p-2 text-gray-400 hover:text-gray-900 rounded-lg hover:bg-white transition-all active:bg-gray-100"
                          >
                            <Settings2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="p-4 bg-gray-50 border-t flex items-center justify-between">
                <p className="text-[10px] font-bold text-gray-500 uppercase">Total Inventory: {variants.reduce((sum, v) => sum + v.stock, 0)} units</p>
                <button type="button" onClick={() => setIsEditingOptions(true)} className="text-[10px] font-bold text-primary-600 hover:underline uppercase">Add/Remove Options</button>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
