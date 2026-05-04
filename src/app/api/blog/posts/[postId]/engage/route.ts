import { NextResponse } from 'next/server';
import { knowledgebaseRepository } from '@infrastructure/repositories/firestore/FirestoreKnowledgebaseRepository';

export async function POST(req: Request, { params }: { params: { postId: string } }) {
  try {
    const body = await req.json();
    const { type, userId } = body;
    
    if (!['view', 'share'].includes(type)) {
      return NextResponse.json({ error: 'Invalid engagement type' }, { status: 400 });
    }

    await knowledgebaseRepository.trackEngagement(params.postId, type, userId);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
