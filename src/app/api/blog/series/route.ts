import { NextResponse } from 'next/server';
import { knowledgebaseRepository } from '@infrastructure/repositories/firestore/FirestoreKnowledgebaseRepository';

export async function GET() {
  try {
    const series = await knowledgebaseRepository.getSeries();
    return NextResponse.json(series);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
