import { NextResponse } from 'next/server';
import { knowledgebaseRepository } from '@infrastructure/repositories/firestore/FirestoreKnowledgebaseRepository';

export async function GET() {
  try {
    const authors = await knowledgebaseRepository.getAuthors();
    return NextResponse.json(authors);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
