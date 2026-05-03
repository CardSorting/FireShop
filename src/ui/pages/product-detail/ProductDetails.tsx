'use client';

/**
 * Product Details: description, specifications, and shipping info in accordion.
 * Pattern: Shopify/Etsy — collapsible accordion sections for clean vertical space.
 */
import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { Product } from '@domain/models';

interface ProductDetailsProps {
  product: Product;
}

interface AccordionItemProps {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function AccordionItem({ title, isOpen, onToggle, children }: AccordionItemProps) {
  return (
    <div className="border-b border-gray-100 last:border-b-0">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between py-5 text-left group"
        aria-expanded={isOpen}
      >
        <span className="text-sm font-bold text-gray-900 group-hover:text-primary-600 transition-colors">{title}</span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-96 pb-6' : 'max-h-0'}`}>
        {children}
      </div>
    </div>
  );
}

export function ProductDetails({ product }: ProductDetailsProps) {
  const [openSection, setOpenSection] = useState<string>('description');

  function toggle(section: string) {
    setOpenSection(prev => prev === section ? '' : section);
  }

  return (
    <section className="border-t border-gray-100 mt-2">
      <AccordionItem
        title="Description"
        isOpen={openSection === 'description'}
        onToggle={() => toggle('description')}
      >
        <p className="text-sm text-gray-600 leading-relaxed">
          {product.description || 'No description available.'}
        </p>
      </AccordionItem>

      <AccordionItem
        title="Details & Specifications"
        isOpen={openSection === 'specs'}
        onToggle={() => toggle('specs')}
      >
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: 'Category', value: product.category },
            { label: 'Type', value: product.productType || 'Standard' },
            { label: 'Artist', value: product.vendor || 'DreamBees' },
            { label: 'Weight', value: product.weightGrams ? `${product.weightGrams}g` : '—' },
            ...(product.set ? [{ label: 'Collection', value: product.set }] : []),
            ...(product.sku ? [{ label: 'SKU', value: product.sku }] : []),
          ].map(spec => (
            <div key={spec.label}>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">{spec.label}</p>
              <p className="text-sm font-bold text-gray-900">{spec.value}</p>
            </div>
          ))}
        </div>
      </AccordionItem>

      <AccordionItem
        title="Shipping & Returns"
        isOpen={openSection === 'shipping'}
        onToggle={() => toggle('shipping')}
      >
        <div className="space-y-3 text-sm text-gray-600 leading-relaxed">
          <p><span className="font-bold text-gray-900">Free shipping</span> on all orders over $50. Standard shipping is calculated at checkout.</p>
          <p><span className="font-bold text-gray-900">Returns:</span> We accept returns within 30 days of delivery. Items must be in original condition.</p>
          <p><span className="font-bold text-gray-900">Processing time:</span> Most orders ship within 1–3 business days.</p>
        </div>
      </AccordionItem>
    </section>
  );
}
