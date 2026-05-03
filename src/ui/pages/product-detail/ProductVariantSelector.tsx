'use client';

/**
 * Variant Selector: option buttons for product variants.
 * Pattern: Shopify — labeled options with selected state, shows current selection.
 */
import type { ProductOption } from '@domain/models';

interface ProductVariantSelectorProps {
  options: ProductOption[];
  selectedOptions: Record<string, string>;
  onSelect: (optionName: string, value: string) => void;
}

const COLOR_MAP: Record<string, string> = {
  black: '#171717',
  white: '#ffffff',
  red: '#ef4444',
  blue: '#3b82f6',
  green: '#22c55e',
  yellow: '#eab308',
  purple: '#a855f7',
  pink: '#ec4899',
  orange: '#f97316',
  gray: '#737373',
  gold: '#fbbf24',
  silver: '#d4d4d4',
};

export function ProductVariantSelector({ options, selectedOptions, onSelect }: ProductVariantSelectorProps) {
  return (
    <section className="space-y-8">
      {options.map((opt) => {
        const isColor = opt.name.toLowerCase().includes('color');

        return (
          <div key={opt.id}>
            <div className="flex items-center justify-between mb-4">
              <p className="text-[11px] font-black uppercase tracking-widest text-gray-400">
                {opt.name}: <span className="text-gray-900">{selectedOptions[opt.name]}</span>
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              {opt.values.map(val => {
                const isSelected = selectedOptions[opt.name] === val;

                if (isColor) {
                  const colorCode = COLOR_MAP[val.toLowerCase()] || val;
                  return (
                    <button
                      key={val}
                      onClick={() => onSelect(opt.name, val)}
                      title={val}
                      aria-label={`Select ${opt.name} ${val}`}
                      aria-pressed={isSelected}
                      className={`
                        group relative h-10 w-10 rounded-full border-2 transition-all p-0.5
                        ${isSelected ? 'border-gray-900' : 'border-transparent hover:border-gray-200'}
                        focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 outline-none
                      `}
                    >
                      <div 
                        className="w-full h-full rounded-full border border-black/5 shadow-inner"
                        style={{ backgroundColor: colorCode }}
                      />
                      {isSelected && (
                        <div className="absolute -top-1 -right-1 h-4 w-4 bg-gray-900 text-white rounded-full flex items-center justify-center border-2 border-white">
                          <div className="h-1.5 w-1.5 bg-white rounded-full" />
                        </div>
                      )}
                    </button>
                  );
                }

                return (
                  <button
                    key={val}
                    onClick={() => onSelect(opt.name, val)}
                    aria-label={`Select ${opt.name} ${val}`}
                    aria-pressed={isSelected}
                    className={`
                      px-6 py-2.5 rounded-xl text-sm font-bold transition-all border-2
                      focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 outline-none
                      ${isSelected
                        ? 'bg-gray-900 border-gray-900 text-white shadow-xl shadow-gray-200'
                        : 'bg-white border-gray-100 text-gray-600 hover:border-gray-300'
                      }
                    `}
                  >
                    {val}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </section>
  );
}
