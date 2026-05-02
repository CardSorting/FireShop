'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useServices } from '@ui/hooks/useServices';
import { KnowledgebaseArticleList } from '@ui/components/SupportComponents';
import type { KnowledgebaseArticle, KnowledgebaseCategory } from '@domain/models';
import { Loader2, ArrowLeft } from 'lucide-react';

export default function CategoryPage() {
  const { slug } = useParams() as { slug: string };
  const [category, setCategory] = useState<KnowledgebaseCategory | null>(null);
  const [articles, setArticles] = useState<KnowledgebaseArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const services = useServices();
  const router = useRouter();

  useEffect(() => {
    async function load() {
      try {
        const cats = await services.knowledgebaseService.getCategories();
        const cat = cats.find((c: KnowledgebaseCategory) => c.slug === slug || c.id === slug);
        if (cat) {
          setCategory(cat);
          const data = await services.knowledgebaseService.getArticles({ categoryId: cat.id });
          setArticles(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [slug, services.knowledgebaseService]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50/50">
        <Loader2 className="h-10 w-10 animate-spin text-primary-600" />
      </div>
    );
  }

  if (!category) return <div>Category not found</div>;

  return (
    <div className="min-h-screen bg-gray-50/30">
      <div className="max-w-6xl mx-auto px-4 py-12 md:py-16">
        <button 
          onClick={() => router.push('/support')}
          className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-900 mb-8 transition-colors group"
        >
          <ArrowLeft className="h-3 w-3 transition-transform group-hover:-translate-x-1" />
          Back to Help Center
        </button>
        <KnowledgebaseArticleList 
          articles={articles}
          categoryName={category.name}
          onBack={() => router.push('/support')}
          onArticleClick={(a: KnowledgebaseArticle) => router.push(`/support/articles/${a.slug}`)}
        />
      </div>
    </div>
  );
}
