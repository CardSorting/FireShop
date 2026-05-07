import React from 'react';
import type { KnowledgebaseArticle } from '@domain/models';

export const SocialPreview: React.FC<{ formData: Partial<KnowledgebaseArticle> }> = ({ formData }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
      <div className="space-y-6">
          <h4 className="text-xs font-black uppercase tracking-widest text-gray-900">Facebook / Open Graph</h4>
          <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm">
            {formData.featuredImageUrl && (
              <img src={formData.featuredImageUrl} alt="Preview" className="w-full aspect-[1.91/1] object-cover" />
            )}
            <div className="p-6 bg-[#f0f2f5]">
              <p className="text-[10px] text-gray-500 uppercase font-bold tracking-tight">dreambeesart.com</p>
              <h3 className="text-lg font-bold text-gray-900 mt-1 line-clamp-2">{formData.metaTitle || formData.title || 'Post Title'}</h3>
              <p className="text-sm text-gray-600 mt-2 line-clamp-3">{formData.metaDescription || formData.excerpt || 'Add a meta description to see how it looks on Facebook...'}</p>
            </div>
          </div>
      </div>

      <div className="space-y-6">
          <h4 className="text-xs font-black uppercase tracking-widest text-gray-900">Twitter Card</h4>
          <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm p-4 flex gap-4">
            <div className="w-24 h-24 rounded-2xl overflow-hidden shrink-0">
              <img src={formData.featuredImageUrl || '/assets/generated/generic_tcg_strategy_1778177431609.png} alt="" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0 py-2">
              <h3 className="text-sm font-bold text-gray-900 line-clamp-2">{formData.metaTitle || formData.title || 'Post Title'}</h3>
              <p className="text-[11px] text-gray-500 mt-1 line-clamp-2">{formData.metaDescription || formData.excerpt || 'Add content to preview...'}</p>
              <p className="text-[10px] text-primary-600 font-bold mt-2">dreambeesart.com</p>
            </div>
          </div>
      </div>
    </div>
  );
};
