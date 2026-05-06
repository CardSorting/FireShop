'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useServices } from '@ui/hooks/useServices';
import { KnowledgebaseArticleView } from '@ui/components/SupportComponents';
import type { KnowledgebaseArticle } from '@domain/models';
import { Loader2, ArrowLeft, Search } from 'lucide-react';
import Link from 'next/link';

export default function ArticlePage() {
  const { slug } = useParams() as { slug: string };
  const [article, setArticle] = useState<KnowledgebaseArticle | null>(null);
  const [related, setRelated] = useState<KnowledgebaseArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const services = useServices();
  const router = useRouter();

  useEffect(() => {
    async function load() {
      try {
        const data = await services.knowledgebaseService.getArticle(slug);
        if (data) {
          setArticle(data);
          const data_articles = await services.knowledgebaseService.getArticles({ categoryId: data.categoryId });
          setRelated(data_articles.articles.filter((a: KnowledgebaseArticle) => a.id !== data.id).slice(0, 3));
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
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary-600" />
          <p className="text-sm font-bold text-gray-400 animate-pulse">Loading article...</p>
        </div>
      </div>
    );
  }

  if (!article) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50/50">
      <div className="text-center space-y-6 max-w-sm px-6">
        <div className="h-20 w-20 rounded-4xl bg-red-50 flex items-center justify-center mx-auto text-red-500 shadow-xl shadow-red-500/10">
          <Search className="h-10 w-10" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-gray-900">Article not found</h2>
          <p className="text-sm font-medium text-gray-500 mt-2">The article you're looking for might have been moved or deleted.</p>
        </div>
        <Link 
          href="/support"
          className="inline-flex items-center gap-2 bg-gray-900 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-black transition-all shadow-xl"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Help Center
        </Link>
      </div>
    </div>
  );

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
        <KnowledgebaseArticleView 
          article={article} 
          relatedArticles={related} 
          onBack={() => router.push('/support')}
          onArticleClick={(a: KnowledgebaseArticle) => router.push(`/support/articles/${a.slug}`)}
        />
      </div>
    </div>
  );
}
