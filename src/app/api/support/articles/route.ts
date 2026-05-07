import { NextResponse } from 'next/server';
import { knowledgebaseRepository } from '@infrastructure/repositories/firestore/FirestoreKnowledgebaseRepository';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get('categoryId');
    const queryStr = searchParams.get('query');
    const type = searchParams.get('type') as 'article' | 'blog' | null;
    const status = searchParams.get('status') as 'published' | 'draft' | 'all' | null;

    if (queryStr) {
      const results = await knowledgebaseRepository.searchArticles(queryStr);
      return NextResponse.json(results);
    }

    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;
    const cursor = searchParams.get('cursor') || undefined;

    const result = await knowledgebaseRepository.getArticles({
      categoryId: categoryId || undefined,
      type: type || undefined,
      status: status || undefined,
      limit,
      cursor
    });

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
