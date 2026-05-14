
'use client';

/**
 * [LAYER: UI]
 * ProductDetails — Reimagined Industry-Standard Navigation
 * 
 * Replaces the confusing accordion with a high-fidelity Tabbed Interface.
 * Pattern: High-end Boutique (Apple/Glossier) with clear, icon-driven navigation.
 */
import { useState } from 'react';
import { FileText, Settings, Truck, CheckCircle2 } from 'lucide-react';
import type { Product } from '@domain/models';

interface ProductDetailsProps {
  product: Product;
}

type TabId = 'description' | 'specs' | 'shipping';

export function ProductDetails({ product }: ProductDetailsProps) {
  const [activeTab, setActiveTab] = useState<TabId>('description');

  const tabs = [
    { id: 'description', label: 'Overview', icon: FileText },
    { id: 'specs', label: 'Specifications', icon: Settings },
    { id: 'shipping', label: 'Shipping & Returns', icon: Truck },
  ] as const;

  return (
    <section className="w-full">
      {/* Navigation Bar */}
      <div className="flex flex-wrap border-b border-gray-100 gap-8 md:gap-12 mb-12">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                group flex items-center gap-3 pb-6 border-b-2 transition-all duration-300 relative
                ${isActive 
                  ? 'border-primary-500 text-gray-900' 
                  : 'border-transparent text-gray-400 hover:text-gray-600'
                }
              `}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-primary-500' : 'text-gray-300 group-hover:text-gray-400'}`} />
              <span className="text-sm font-black uppercase tracking-widest">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Content Area */}
      <div className="min-h-[300px] reveal-up">
        {activeTab === 'description' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            <div className="lg:col-span-8">
              <h3 className="text-2xl font-black text-gray-900 mb-6">Product Story</h3>
              <div 
                className="text-lg text-gray-600 leading-relaxed space-y-6 
                  [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-3
                  [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:space-y-3
                  [&_li]:marker:text-primary-500
                  [&_strong]:text-gray-900 [&_strong]:font-black"
                dangerouslySetInnerHTML={{ __html: product.description || 'No description available.' }}
              />
            </div>
            <div className="lg:col-span-4 bg-gray-50 rounded-4xl p-8 border border-gray-100">
              <h4 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-6">Quick Highlights</h4>
              <ul className="space-y-4">
                {[
                  'Boutique Quality Guaranteed',
                  'Collector-Grade Packaging',
                  'Authenticated Merchandise',
                  'Limited Edition Series'
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary-500 shrink-0" />
                    <span className="text-sm font-bold text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'specs' && (
          <div className="max-w-4xl">
            <h3 className="text-2xl font-black text-gray-900 mb-8">Technical Specifications</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
              {[
                { label: 'Merchant Vendor', value: product.vendor || 'DreamBees' },
                { label: 'Category', value: product.category },
                { label: 'Product Type', value: product.productType || 'Standard' },
                { label: 'Weight (Metric)', value: product.weightGrams ? `${product.weightGrams}g` : '—' },
                { label: 'SKU / Identifier', value: product.sku || '—' },
                { label: 'Availability', value: product.stock > 0 ? 'In Stock' : 'Out of Stock' },
              ].map((spec) => (
                <div key={spec.label} className="flex justify-between items-end border-b border-gray-50 pb-4">
                  <span className="text-xs font-black uppercase tracking-widest text-gray-400">{spec.label}</span>
                  <span className="text-sm font-bold text-gray-900">{spec.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'shipping' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 bg-primary-50 rounded-4xl border border-primary-100">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                <Truck className="w-6 h-6 text-primary-600" />
              </div>
              <h4 className="text-lg font-black text-gray-900 mb-3">Fast Delivery</h4>
              <p className="text-sm text-gray-600 leading-relaxed">
                Most orders are processed within 1-3 business days. We offer global shipping with real-time tracking.
              </p>
            </div>
            
            <div className="p-8 bg-gray-50 rounded-4xl border border-gray-100">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                <CheckCircle2 className="w-6 h-6 text-gray-900" />
              </div>
              <h4 className="text-lg font-black text-gray-900 mb-3">Secure Packing</h4>
              <p className="text-sm text-gray-600 leading-relaxed">
                All collectibles are shipped in museum-grade, bubble-wrapped containers to ensure perfect condition.
              </p>
            </div>

            <div className="p-8 bg-gray-50 rounded-4xl border border-gray-100">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                <Settings className="w-6 h-6 text-gray-900" />
              </div>
              <h4 className="text-lg font-black text-gray-900 mb-3">Easy Returns</h4>
              <p className="text-sm text-gray-600 leading-relaxed">
                Unopened items can be returned within 30 days. Contact our concierge for a seamless return process.
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
