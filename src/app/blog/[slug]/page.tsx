import React from 'react';
import { getInitialServices } from '@core/container';
import PostContent from './PostContent';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const services = getInitialServices();
  const post = await services.knowledgebaseRepository.getArticleBySlug(params.slug);
  
  if (!post) return { title: 'Post Not Found' };
  
  return {
    title: post.metaTitle || `${post.title} | DreamBees Art Journal`,
    description: post.metaDescription || post.excerpt,
    alternates: {
      canonical: post.canonicalUrl,
    },
    openGraph: {
      title: post.ogTitle || post.metaTitle || post.title,
      description: post.ogDescription || post.metaDescription || post.excerpt,
      images: (post.ogImage || post.featuredImageUrl) ? [{ url: post.ogImage || post.featuredImageUrl || '' }] : [],
      type: 'article',
      publishedTime: post.publishedAt?.toISOString(),
      authors: post.authorName ? [post.authorName] : [],
      tags: post.tags,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.ogTitle || post.metaTitle || post.title,
      description: post.ogDescription || post.metaDescription || post.excerpt,
      images: (post.ogImage || post.featuredImageUrl) ? [post.ogImage || post.featuredImageUrl || ''] : [],
    }
  };
}

export default async function BlogPostPage({ params }: Props) {
  const services = getInitialServices();
  
  try {
    const post = await services.knowledgebaseRepository.getArticleBySlug(params.slug);
    
    if (!post) {
      notFound();
    }
    
    const [comments, author, relatedProducts, latestPosts] = await Promise.all([
      services.knowledgebaseRepository.getComments(post.id),
      post.authorId ? services.knowledgebaseRepository.getAuthorById(post.authorId) : Promise.resolve(null),
      post.relatedProductIds?.length 
        ? Promise.all(post.relatedProductIds.map((id: string) => services.productService.getProduct(id))) 
        : Promise.resolve([]),
      services.knowledgebaseRepository.getArticles({ type: 'blog', status: 'published' })
    ]);

    const filteredLatest = latestPosts.filter((p: any) => p.id !== post.id).slice(0, 3);

    
    return (
      <PostContent 
        post={JSON.parse(JSON.stringify(post))} 
        initialComments={JSON.parse(JSON.stringify(comments))} 
        initialAuthor={JSON.parse(JSON.stringify(author))}
        initialRelatedProducts={JSON.parse(JSON.stringify(relatedProducts))}
        latestPosts={JSON.parse(JSON.stringify(filteredLatest))}
      />
    );
  } catch (err) {
    console.error('Error loading blog post:', err);
    notFound();
  }
}
