import { NextResponse } from 'next/server';
import { knowledgebaseRepository } from '@infrastructure/repositories/firestore/FirestoreKnowledgebaseRepository';
import { jsonError, parseBoundedLimit, requireAdminSession } from '@infrastructure/server/apiGuards';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get('categoryId');
    const queryStr = searchParams.get('query');
    const type = searchParams.get('type') as 'article' | 'blog' | null;
    const requestedStatus = searchParams.get('status') as 'published' | 'draft' | 'all' | null;
    const isAdminStatus = requestedStatus === 'draft' || requestedStatus === 'all';
    if (isAdminStatus) {
      await requireAdminSession(req);
    }
    const status = isAdminStatus ? requestedStatus : 'published';

    if (queryStr) {
      const results = await knowledgebaseRepository.searchArticles(queryStr, 20, status);
      return NextResponse.json(results);
    }

    const limit = parseBoundedLimit(searchParams.get('limit'), 20, 50);
    const cursor = searchParams.get('cursor') || undefined;

    const result = await knowledgebaseRepository.getArticles({
      categoryId: categoryId || undefined,
      type: type || undefined,
      status: status || undefined,
      limit,
      cursor
    });

    return NextResponse.json(result);
  } catch (err: unknown) {
    return jsonError(err, 'Failed to load support articles');
  }
}
