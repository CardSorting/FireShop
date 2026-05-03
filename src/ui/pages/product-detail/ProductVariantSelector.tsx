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

export function ProductVariantSelector({ options, selectedOptions, onSelect }: ProductVariantSelectorProps) {
  return (
    <section className="space-y-6">
      {options.map((opt) => (
        <div key={opt.id}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold text-gray-700">
              {opt.name}: <span className="text-gray-900 font-black">{selectedOptions[opt.name]}</span>
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {opt.values.map(val => (
              <button
                key={val}
                onClick={() => onSelect(opt.name, val)}
                className={`
                  px-5 py-2.5 rounded-xl text-sm font-bold transition-all border
                  ${selectedOptions[opt.name] === val
                    ? 'bg-gray-900 border-gray-900 text-white shadow-lg'
                    : 'bg-white border-gray-200 text-gray-600 hover:border-gray-400'
                  }
                `}
              >
                {val}
              </button>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}
