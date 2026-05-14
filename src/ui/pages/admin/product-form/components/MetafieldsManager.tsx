'use client';
import React from 'react';
import { Plus, X, Type, Hash, ToggleLeft } from 'lucide-react';

interface MetafieldsManagerProps {
  metafields: Record<string, string | number | boolean | null>;
  onChange: (metafields: Record<string, string | number | boolean | null>) => void;
}

export function MetafieldsManager({ metafields, onChange }: MetafieldsManagerProps) {
  const entries = Object.entries(metafields);

  const addMetafield = () => {
    const key = `custom_field_${entries.length + 1}`;
    onChange({ ...metafields, [key]: '' });
  };

  const removeMetafield = (key: string) => {
    const next = { ...metafields };
    delete next[key];
    onChange(next);
  };

  const updateKey = (oldKey: string, newKey: string) => {
    if (oldKey === newKey) return;
    const next: Record<string, any> = {};
    Object.entries(metafields).forEach(([k, v]) => {
      if (k === oldKey) {
        next[newKey] = v;
      } else {
        next[k] = v;
      }
    });
    onChange(next);
  };

  const updateValue = (key: string, value: any) => {
    onChange({ ...metafields, [key]: value });
  };

  return (
    <section className="rounded-xl border bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Custom Attributes (Metafields)</h2>
        <span className="rounded-full bg-primary-100 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-primary-600">Extensible</span>
      </div>

      {entries.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed bg-gray-50 p-8 text-center">
          <p className="text-xs font-medium text-gray-500">
            No custom attributes defined. Use these for technical specs, internal IDs, or specialized display data.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map(([key, value]) => {
            const isNumber = typeof value === 'number';
            const isBoolean = typeof value === 'boolean';

            return (
              <div key={key} className="flex flex-col gap-2 rounded-xl border bg-gray-50 p-3 sm:flex-row sm:items-center">
                <div className="flex flex-1 items-center gap-2">
                  <input
                    type="text"
                    value={key}
                    onChange={(e) => updateKey(key, e.target.value.toLowerCase().replace(/\s+/g, '_'))}
                    placeholder="field_key"
                    className="w-1/3 rounded-lg border bg-white px-3 py-2 text-xs font-bold outline-none focus:ring-1 focus:ring-primary-500"
                  />
                  <div className="flex-1 flex items-center gap-2">
                    {isBoolean ? (
                      <button
                        type="button"
                        onClick={() => updateValue(key, !value)}
                        className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold transition ${value ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-600'}`}
                      >
                        <ToggleLeft className="h-4 w-4" />
                        {value ? 'True' : 'False'}
                      </button>
                    ) : (
                      <input
                        type={isNumber ? 'number' : 'text'}
                        value={String(value ?? '')}
                        onChange={(e) => updateValue(key, isNumber ? Number(e.target.value) : e.target.value)}
                        placeholder="Value"
                        className="flex-1 rounded-lg border bg-white px-3 py-2 text-xs font-medium outline-none focus:ring-1 focus:ring-primary-500"
                      />
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 border-t pt-2 sm:border-t-0 sm:pt-0 sm:pl-2">
                  <button
                    type="button"
                    onClick={() => updateValue(key, isNumber ? '' : 0)}
                    className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition"
                    title={isNumber ? 'Switch to Text' : 'Switch to Number'}
                  >
                    {isNumber ? <Type className="h-3.5 w-3.5" /> : <Hash className="h-3.5 w-3.5" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => updateValue(key, isBoolean ? '' : true)}
                    className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition"
                    title={isBoolean ? 'Switch to Text' : 'Switch to Boolean'}
                  >
                    <ToggleLeft className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeMetafield(key)}
                    className="rounded-lg p-1.5 text-red-400 hover:bg-red-50 hover:text-red-600 transition"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-4 flex justify-center">
        <button
          type="button"
          onClick={addMetafield}
          className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-primary-600 hover:text-primary-700 transition"
        >
          <Plus className="h-3.5 w-3.5" />
          Add custom attribute
        </button>
      </div>
    </section>
  );
}
