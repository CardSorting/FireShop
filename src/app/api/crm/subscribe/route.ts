import { NextResponse } from 'next/server';
import { knowledgebaseRepository } from '@infrastructure/repositories/firestore/FirestoreKnowledgebaseRepository';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, source } = body;
    
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    await knowledgebaseRepository.subscribe(email, source || 'direct');
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
