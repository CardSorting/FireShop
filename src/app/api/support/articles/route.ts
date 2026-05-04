import { NextResponse } from 'next/server';
import { knowledgebaseRepository } from '@infrastructure/repositories/firestore/FirestoreKnowledgebaseRepository';

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

    const articles = await knowledgebaseRepository.getArticles({
      categoryId: categoryId || undefined,
      type: type || undefined,
      status: status || undefined
    });

    return NextResponse.json(articles);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
