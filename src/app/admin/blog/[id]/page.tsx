/**
 * [LAYER: INFRASTRUCTURE]
 */
import React from 'react';
import { getInitialServices } from '@core/container';
import AdminBlogForm from '@ui/components/AdminBlogForm';
import { notFound } from 'next/navigation';

interface Props {
  params: { id: string };
}

export default async function EditBlogPostPage({ params }: Props) {
  const services = getInitialServices();
  let post;

  try {
    post = await services.knowledgebaseRepository.getArticleById(params.id);
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
