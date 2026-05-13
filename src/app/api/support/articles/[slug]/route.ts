import { jsonError, requireAdminSession } from '@infrastructure/server/apiGuards';
import { knowledgebaseRepository } from '@infrastructure/repositories/firestore/FirestoreKnowledgebaseRepository';
import { NextResponse } from 'next/server';

export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const article = await knowledgebaseRepository.getArticleBySlug(slug);
    if (!article) return NextResponse.json({ error: 'Article not found' }, { status: 404 });

    // PRODUCTION HARDENING: Mandatory visibility substrate check
    if (article.status !== 'published') {
      try {
        await requireAdminSession(req);
      } catch (e) {
        return NextResponse.json({ error: 'Article not found' }, { status: 404 });
      }
    }

    return NextResponse.json(article);
  } catch (err: any) {
    return jsonError(err, 'Failed to load article');
  }
}
