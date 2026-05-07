/**
 * [LAYER: INFRASTRUCTURE]
 */
import React from 'react';
import { getInitialServices } from '@core/container';
import AdminBlogForm from '@ui/components/AdminBlogForm';
import { notFound } from 'next/navigation';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditBlogPostPage({ params }: Props) {
  const { id } = await params;
  const services = getInitialServices();
  let post;

  try {
    post = await services.knowledgebaseRepository.getArticleById(id);
  } catch (err) {
    console.error('Error loading post for edit:', err);
    notFound();
  }

  if (!post) {
    notFound();
  }

  return (
    <div className="p-8">
      <AdminBlogForm initialData={JSON.parse(JSON.stringify(post))} />
    </div>
  );
}
