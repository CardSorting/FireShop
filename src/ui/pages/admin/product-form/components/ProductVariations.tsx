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
  DollarSign
} from 'lucide-react';
import type { ProductOption, ProductVariant } from '@domain/models';
import { TextInput, MoneyInput } from './FormInputs';
import { centsFromInput } from '../utils';
import { formatCurrency } from '@utils/formatters';

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

  // --- GENERATION LOGIC ---
  const generateVariants = (currentOptions: ProductOption[]) => {
    const activeOptions = currentOptions.filter(o => o.name && o.values.length > 0);
    if (activeOptions.length === 0) return [];

    const cartesian = (...a: string[][]) => a.reduce((acc, val) => acc.flatMap(d => val.map(e => [...d, e])), [[]] as string[][]);
    
    const combinations = cartesian(...activeOptions.map(o => o.values));
    
    return combinations.map((combo: string | string[]) => {
      const vals = Array.isArray(combo) ? combo : [combo];
      const title = vals.join(' / ');
      
      // Try to find existing variant to preserve data
      const existing = variants.find(v => 
        v.option1 === vals[0] && 
        (vals.length < 2 || v.option2 === vals[1]) && 
        (vals.length < 3 || v.option3 === vals[2])
      );

      if (existing) return existing;

      return {
        id: crypto.randomUUID(),
        productId: '',
        title,
        price: centsFromInput(basePrice) || 0,
        stock: parseInt(baseStock) || 0,
        sku: baseSku ? `${baseSku}-${vals.join('-').toUpperCase().replace(/\s+/g, '')}` : '',
        option1: vals[0],
        option2: vals[1],
        option3: vals[2],
        createdAt: new Date(),
        updatedAt: new Date()
      } as ProductVariant;
    });
  };

  const handleToggleVariants = (checked: boolean) => {
    if (checked && options.length === 0) {
      // Initialize with a default option
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
    
    // Total stock should be sum of variants
    const totalStock = newVariants.reduce((sum, v) => sum + v.stock, 0);
    
    onChange({ 
      variants: newVariants,
      stock: String(totalStock)
    });
    setIsEditingOptions(false);
  };

  const updateVariant = (id: string, updates: Partial<ProductVariant>) => {
    const newVariants = variants.map(v => v.id === id ? { ...v, ...updates, updatedAt: new Date() } : v);
    
    // If stock changed, update total stock
    if (updates.stock !== undefined) {
      const totalStock = newVariants.reduce((sum, v) => sum + v.stock, 0);
      onChange({ variants: newVariants, stock: String(totalStock) });
    } else {
      onChange({ variants: newVariants });
    }
  };

  return (
    <section className="rounded-xl border bg-white shadow-sm overflow-hidden transition-all duration-300">
      <div className="p-5 border-b bg-gray-50/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-100 text-primary-600">
              <Package className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Variations</h2>
              <p className="text-sm font-bold text-gray-900">Options & Variants</p>
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
        <div className="p-10 flex flex-col items-center justify-center text-center space-y-3">
          <div className="h-12 w-12 rounded-full bg-gray-50 flex items-center justify-center border-2 border-dashed border-gray-200">
            <Plus className="h-6 w-6 text-gray-300" />
          </div>
          <div className="max-w-[300px]">
            <p className="text-sm font-bold text-gray-700">Add options like size or color</p>
            <p className="mt-1 text-xs text-gray-500">This product has multiple options, like different sizes or colors</p>
          </div>
          <button 
            type="button" 
            onClick={() => handleToggleVariants(true)}
            className="mt-2 text-xs font-bold text-primary-600 hover:text-primary-700 transition"
          >
            + Add variations
          </button>
        </div>
      ) : (
        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
          {/* Options Editor */}
          <div className="p-5 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Options</h3>
              {!isEditingOptions && (
                <button 
                  type="button" 
                  onClick={() => setIsEditingOptions(true)}
                  className="text-xs font-bold text-primary-600 hover:underline"
                >
                  Edit options
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
                          <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Values</label>
                          <div className="mt-1.5 flex flex-wrap gap-2">
                            {option.values.map((val, vIdx) => (
                              <span key={vIdx} className="inline-flex items-center gap-1 rounded-lg bg-primary-50 px-2 py-1 text-xs font-bold text-primary-700 ring-1 ring-primary-100 transition hover:bg-primary-100">
                                {val}
                                <button 
                                  type="button" 
                                  onClick={() => updateOption(idx, { values: option.values.filter((_, i) => i !== vIdx) })}
                                  className="rounded-full p-0.5 hover:bg-primary-200"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </span>
                            ))}
                            <input 
                              placeholder="Add value..."
                              className="text-xs font-medium outline-none bg-transparent min-w-[100px]"
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
                          </div>
                        </div>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => removeOption(idx)}
                        className="text-gray-400 hover:text-red-600 transition"
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
                    className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed py-3 text-xs font-bold text-gray-400 hover:bg-white hover:text-primary-600 hover:border-primary-200 transition"
                  >
                    <Plus className="h-4 w-4" /> Add another option
                  </button>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <button 
                    type="button" 
                    onClick={() => setIsEditingOptions(false)}
                    className="rounded-lg px-4 py-2 text-xs font-bold text-gray-500 hover:text-gray-700"
                  >
                    Discard
                  </button>
                  <button 
                    type="button" 
                    onClick={handleOptionsSave}
                    className="rounded-lg bg-gray-900 px-6 py-2 text-xs font-bold text-white shadow-sm hover:bg-gray-800 transition"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-4">
                {options.map((option) => (
                  <div key={option.id} className="rounded-xl border bg-gray-50 px-4 py-3 min-w-[120px]">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{option.name || 'Untitled'}</p>
                    <p className="mt-1 text-sm font-bold text-gray-700">{option.values.length} values</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Variants Table */}
          {!isEditingOptions && variants.length > 0 && (
            <div className="border-t">
              <div className="p-5 border-b bg-gray-50/30">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Previews ({variants.length})</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b bg-gray-50/50 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                      <th className="px-5 py-3 font-bold">Variant</th>
                      <th className="px-5 py-3 font-bold">Price</th>
                      <th className="px-5 py-3 font-bold">SKU</th>
                      <th className="px-5 py-3 font-bold">Inventory</th>
                      <th className="px-5 py-3 font-bold"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {variants.map((variant) => (
                      <tr key={variant.id} className="group hover:bg-primary-50/30 transition-colors">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-gray-100 border flex items-center justify-center overflow-hidden">
                              {variant.imageUrl ? (
                                <img src={variant.imageUrl} alt={variant.title} className="h-full w-full object-cover" />
                              ) : (
                                <Package className="h-5 w-5 text-gray-300" />
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-gray-900">{variant.title}</p>
                              <p className="text-[10px] font-medium text-gray-500 uppercase tracking-tight">
                                {variant.option1}{variant.option2 ? ` / ${variant.option2}` : ''}{variant.option3 ? ` / ${variant.option3}` : ''}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="relative max-w-[120px]">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
                            <input 
                              className="w-full rounded-lg border bg-white px-6 py-1.5 text-sm font-bold outline-none focus:ring-2 focus:ring-primary-500"
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
                            className="w-full rounded-lg border bg-white px-3 py-1.5 text-xs font-medium outline-none focus:ring-2 focus:ring-primary-500"
                            value={variant.sku || ''}
                            placeholder="SKU"
                            onChange={(e) => updateVariant(variant.id, { sku: e.target.value })}
                          />
                        </td>
                        <td className="px-5 py-4">
                          <input 
                            type="number"
                            className="w-20 rounded-lg border bg-white px-3 py-1.5 text-sm font-bold outline-none focus:ring-2 focus:ring-primary-500 text-center"
                            value={variant.stock}
                            onChange={(e) => updateVariant(variant.id, { stock: parseInt(e.target.value) || 0 })}
                          />
                        </td>
                        <td className="px-5 py-4 text-right">
                          <button 
                            type="button"
                            className="p-2 text-gray-400 hover:text-gray-900 rounded-lg hover:bg-white transition"
                          >
                            <Settings2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
