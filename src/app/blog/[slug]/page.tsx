import React from 'react';
import { getInitialServices } from '@core/container';
import PostContent from './PostContent';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { absoluteUrl, seoDescription } from '@utils/seo';
import { sanitizeHtml } from '@utils/sanitizer';
import type { Author, BlogComment, KnowledgebaseArticle, Product } from '@domain/models';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const services = getInitialServices();
  const post = await services.knowledgebaseRepository.getArticleBySlug(slug);
  
  if (!post) return { title: 'Post Not Found' };

  const description = seoDescription(post.metaDescription, post.excerpt);
  const image = post.ogImage || post.featuredImageUrl;
  
  return {
    title: post.metaTitle || `${post.title} | DreamBees Art Journal`,
    description,
    alternates: {
      canonical: post.canonicalUrl || `/blog/${post.slug}`,
    },
    openGraph: {
      title: post.ogTitle || post.metaTitle || post.title,
      description: seoDescription(post.ogDescription, description),
      images: image ? [{ url: absoluteUrl(image) }] : [],
      type: 'article',
      publishedTime: post.publishedAt?.toISOString(),
      authors: post.authorName ? [post.authorName] : [],
      tags: post.tags,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.ogTitle || post.metaTitle || post.title,
      description: seoDescription(post.ogDescription, description),
      images: image ? [absoluteUrl(image)] : [],
    }
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const services = getInitialServices();
  const post = await services.knowledgebaseRepository.getArticleBySlug(slug);
  
  if (!post) {
    notFound();
  }

  // Production Hardening: Sanitize post content on the server to prevent XSS
  if (post.content) {
    post.content = sanitizeHtml(post.content);
  }
  
  let comments: BlogComment[];
  let author: Author | null;
  let relatedProducts: Product[];
  let filteredLatest: KnowledgebaseArticle[];
  
  try {
    const [commentsData, authorData, relatedProductsData, latestPosts] = await Promise.all([
      services.knowledgebaseRepository.getComments(post.id),
      post.authorId ? services.knowledgebaseRepository.getAuthorById(post.authorId) : Promise.resolve(null),
      post.relatedProductIds?.length 
        ? Promise.all(post.relatedProductIds.map((id: string) => services.productService.getProduct(id))) 
        : Promise.resolve([]),
      services.knowledgebaseRepository.getArticles({ type: 'blog', status: 'published' })
    ]);

    comments = commentsData;
    author = authorData;
    relatedProducts = relatedProductsData;
    filteredLatest = latestPosts.articles.filter((p: any) => p.id !== post.id).slice(0, 3);
  } catch (err) {
    console.error('Error loading blog post metadata:', err);
    // Even if comments or related products fail, we might still want to show the post
    comments = [];
    author = null;
    relatedProducts = [];
    filteredLatest = [];
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    image: post.featuredImageUrl || post.ogImage,
    datePublished: post.publishedAt?.toISOString(),
    dateModified: post.updatedAt?.toISOString() || post.publishedAt?.toISOString(),
    author: {
      '@type': 'Person',
      name: post.authorName || 'DreamBeesArt Team',
    },
    publisher: {
      '@type': 'Organization',
      name: 'DreamBeesArt',
      logo: {
        '@type': 'ImageObject',
        url: absoluteUrl('/logo.png'),
      },
    },
    description: seoDescription(post.metaDescription, post.excerpt),
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': absoluteUrl(`/blog/${post.slug}`),
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PostContent 
        post={JSON.parse(JSON.stringify(post))} 
        initialComments={JSON.parse(JSON.stringify(comments))} 
        initialAuthor={JSON.parse(JSON.stringify(author))}
        initialRelatedProducts={JSON.parse(JSON.stringify(relatedProducts))}
        latestPosts={JSON.parse(JSON.stringify(filteredLatest))}
      />
    </>
  );
}
