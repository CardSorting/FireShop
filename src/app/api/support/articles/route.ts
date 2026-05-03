import { NextResponse } from 'next/server';
import { knowledgebaseRepository } from '@infrastructure/repositories/firestore/FirestoreKnowledgebaseRepository';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get('categoryId');
    const query = searchParams.get('query');

    if (query) {
      const results = await knowledgebaseRepository.searchArticles(query);
      return NextResponse.json(results);
    }

    const articles = await knowledgebaseRepository.getArticles(categoryId || undefined);
    return NextResponse.json(articles);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
