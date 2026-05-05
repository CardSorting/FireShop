import { NextResponse } from 'next/server';
import { knowledgebaseRepository } from '@infrastructure/repositories/firestore/FirestoreKnowledgebaseRepository';

export async function POST(req: Request, { params }: { params: Promise<{ postId: string }> }) {
  try {
    const { postId } = await params;
    const body = await req.json();
    const { type, userId } = body;
    
    if (!['view', 'share'].includes(type)) {
      return NextResponse.json({ error: 'Invalid engagement type' }, { status: 400 });
    }

    await knowledgebaseRepository.trackEngagement(postId, type, userId);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
