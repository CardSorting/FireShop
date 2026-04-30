'use client';

/**
 * [LAYER: UI]
 * SEO Settings component — Industrial-grade search engine listing manager.
 * Modeled after Shopify's "Search engine listing preview" for non-technical merchants.
 */
import React, { useState } from 'react';
import { Search, Globe, ChevronDown, ChevronUp, AlertCircle, Info, ExternalLink, Sparkles, Check } from 'lucide-react';
import { HelpTooltip } from './AdminComponents';

interface SeoSettingsProps {
  name: string;
  description: string;
  seoTitle: string;
  seoDescription: string;
  handle: string;
  onChange: (name: string, value: string) => void;
  baseUrl?: string;
  isEdit?: boolean;
}

export function SeoSettings({
  name,
  description,
  seoTitle,
  seoDescription,
  handle,
  onChange,
  baseUrl = 'shopmore.io',
  isEdit = false
}: SeoSettingsProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<'google' | 'social'>('google');

  const displayTitle = seoTitle || name || '';
  const displayDescription = seoDescription || description || '';
  const displayHandle = handle || (name || 'product-handle')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'product-handle';

  const titleLength = displayTitle.length;
  const descLength = displayDescription.length;

  const getLengthColor = (length: number, max: number) => {
    if (length === 0) return 'text-gray-400';
    if (length > max) return 'text-red-600 font-bold';
    if (length > max * 0.8) return 'text-amber-600 font-bold';
    return 'text-green-600 font-bold';
  };

  const calculateScore = () => {
    let score = 0;
    if (seoTitle) score += 30;
    else if (name) score += 15;
    
    if (seoDescription) score += 30;
    else if (description) score += 15;

    if (titleLength >= 30 && titleLength <= 60) score += 20;
    if (descLength >= 120 && descLength <= 160) score += 20;

    return score;
  };

  const score = calculateScore();

  const handleGenerateSeo = () => {
    if (!seoTitle) onChange('seoTitle', name.slice(0, 60));
    if (!seoDescription) onChange('seoDescription', description.slice(0, 160));
  };

  const checklist = [
    { label: 'Page title is present', done: !!seoTitle || !!name },
    { label: 'Page title length (30-60 chars)', done: titleLength >= 30 && titleLength <= 60 },
    { label: 'Meta description is present', done: !!seoDescription || !!description },
    { label: 'Meta description length (120-160 chars)', done: descLength >= 120 && descLength <= 160 },
    { label: 'Custom handle defined', done: !!handle },
  ];

  return (
    <section className="overflow-hidden rounded-xl border bg-white shadow-sm transition-all hover:shadow-md">
      {/* Header */}
      <div className="flex items-center justify-between border-b bg-gray-50/50 px-5 py-4">
        <div className="flex items-center gap-3">
          <Search className="h-4 w-4 text-gray-400" />
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h2 className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Search engine listing</h2>
              <HelpTooltip text="This is how your product will appear in search results like Google. Optimized listings can significantly increase your store traffic." />
            </div>
            <div className="mt-1 flex items-center gap-2">
              <div className="h-1 w-24 overflow-hidden rounded-full bg-gray-200">
                <div 
                  className={`h-full transition-all duration-500 ${score > 80 ? 'bg-green-500' : score > 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                  style={{ width: `${score}%` }}
                />
              </div>
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">SEO Score: {score}/100</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {!seoTitle && !seoDescription && (
            <button
              type="button"
              onClick={handleGenerateSeo}
              className="flex items-center gap-1.5 text-xs font-bold text-primary-600 hover:text-primary-700 transition"
            >
              <Sparkles className="h-3 w-3" />
              Auto-generate
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsEditing(!isEditing)}
            className="text-xs font-bold text-primary-600 hover:text-primary-700 transition"
          >
            {isEditing ? 'Collapse' : 'Edit SEO listing'}
          </button>
        </div>
      </div>

      <div className="p-5">
        {/* Preview Container */}
        <div className="mb-6 rounded-xl border bg-white p-6 shadow-xs ring-1 ring-black/5">
          <div className="mb-4 flex items-center justify-between border-b pb-3">
            <div className="flex gap-4">
              <button 
                type="button"
                onClick={() => setActiveTab('google')}
                className={`text-[10px] font-bold uppercase tracking-widest transition ${activeTab === 'google' ? 'text-primary-600' : 'text-gray-400 hover:text-gray-600'}`}
              >
                Google Search
              </button>
              <button 
                type="button"
                onClick={() => setActiveTab('social')}
                className={`text-[10px] font-bold uppercase tracking-widest transition ${activeTab === 'social' ? 'text-primary-600' : 'text-gray-400 hover:text-gray-600'}`}
              >
                Social Sharing
              </button>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400">
              <Globe className="h-3 w-3" />
              Live Preview
            </div>
          </div>

          {activeTab === 'google' ? (
            <div className="space-y-1">
              <p className="flex items-center gap-1 text-[13px] text-[#202124]">
                <span className="font-medium text-gray-600">{baseUrl}</span>
                <span className="text-gray-400">› products › {displayHandle}</span>
              </p>
              <h3 className="text-xl font-medium text-[#1a0dab] hover:underline cursor-pointer leading-tight">
                {displayTitle || 'Your Product Title'} | ShopMore
              </h3>
              <p className="max-w-xl text-sm leading-relaxed text-[#4d5156] line-clamp-2">
                {displayDescription || 'Add a meta description to help customers find this product in search results.'}
              </p>
            </div>
          ) : (
            <div className="max-w-md overflow-hidden rounded-xl border bg-gray-50 shadow-sm">
              <div className="aspect-video bg-gray-200 flex items-center justify-center text-gray-400">
                <Globe className="h-8 w-8" />
              </div>
              <div className="p-4 bg-white">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">{baseUrl}</p>
                <h3 className="text-sm font-bold text-gray-900 mb-1">{displayTitle || 'Your Product Title'}</h3>
                <p className="text-xs text-gray-500 line-clamp-2">{displayDescription || 'Social preview description.'}</p>
              </div>
            </div>
          )}
        </div>

        {/* Form Fields - Expanded on Edit */}
        {isEditing ? (
          <div className="space-y-6 animate-in slide-in-from-top-2 duration-300">
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2 space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between items-end">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Page title</label>
                    <span className={`text-[10px] ${getLengthColor(titleLength, 60)}`}>{titleLength} / 60</span>
                  </div>
                  <input
                    name="seoTitle"
                    value={seoTitle}
                    onChange={(e) => onChange('seoTitle', e.target.value)}
                    placeholder={name}
                    className="w-full rounded-lg border bg-gray-50 px-4 py-2.5 text-sm font-bold outline-none transition focus:ring-2 focus:ring-primary-500"
                  />
                  <p className="text-[10px] text-gray-400">Include your primary keyword. Ideally under 60 characters.</p>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">URL handle</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 opacity-50">/products/</span>
                    <input
                      name="handle"
                      value={handle}
                      onChange={(e) => onChange('handle', e.target.value)}
                      placeholder={displayHandle}
                      className="w-full rounded-lg border bg-gray-50 py-2.5 pl-[72px] pr-4 text-sm font-bold outline-none transition focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  {isEdit && handle && handle !== displayHandle && (
                    <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-[10px] font-bold text-red-700">
                      <AlertCircle className="h-3 w-3" />
                      Warning: Changing the URL handle will break existing links to this product.
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-end">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Meta description</label>
                    <span className={`text-[10px] ${getLengthColor(descLength, 160)}`}>{descLength} / 160</span>
                  </div>
                  <textarea
                    name="seoDescription"
                    value={seoDescription}
                    onChange={(e) => onChange('seoDescription', e.target.value)}
                    rows={4}
                    placeholder={description}
                    className="w-full rounded-lg border bg-gray-50 px-4 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-primary-500"
                  />
                  <p className="text-[10px] text-gray-400">Aim for 120-160 characters. This summary appears in search results.</p>
                </div>
              </div>

              {/* Sidebar Checklist */}
              <div className="rounded-xl border bg-gray-50 p-5">
                <h4 className="mb-4 text-[10px] font-bold uppercase tracking-widest text-gray-500">SEO Health Checklist</h4>
                <div className="space-y-3">
                  {checklist.map((item, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className={`flex h-4 w-4 items-center justify-center rounded-full border ${item.done ? 'bg-green-100 border-green-200 text-green-600' : 'bg-white border-gray-200 text-gray-300'}`}>
                        {item.done && <Check className="h-2.5 w-2.5" />}
                      </div>
                      <span className={`text-[11px] font-medium ${item.done ? 'text-gray-900' : 'text-gray-400'}`}>{item.label}</span>
                    </div>
                  ))}
                </div>
                
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <p className="text-[10px] leading-relaxed text-gray-500 italic">
                    "Search Engine Optimization is about building trust with your audience. High-quality content always ranks better."
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between text-xs font-medium text-gray-500">
            <div className="flex items-center gap-2">
              <Info className="h-3.5 w-3.5" />
              Showing the search engine listing. Click "Edit SEO listing" to customize.
            </div>
            <div className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest ${score > 80 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
              Health: {score > 80 ? 'Excellent' : score > 50 ? 'Good' : 'Needs Work'}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
