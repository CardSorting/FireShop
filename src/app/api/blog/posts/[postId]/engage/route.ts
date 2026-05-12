import { NextResponse } from 'next/server';
import { knowledgebaseRepository } from '@infrastructure/repositories/firestore/FirestoreKnowledgebaseRepository';
import { assertRateLimit, jsonError, readJsonObject } from '@infrastructure/server/apiGuards';
import { getSessionUser } from '@infrastructure/server/session';

export async function POST(req: Request, { params }: { params: Promise<{ postId: string }> }) {
  try {
    await assertRateLimit(req, 'blog_engagement', 60, 60_000);
    const { postId } = await params;
    const body = await readJsonObject(req);
    const type = body.type;
    
    if (type !== 'view' && type !== 'share') {
      return NextResponse.json({ error: 'Invalid engagement type' }, { status: 400 });
    }

    const user = await getSessionUser();
    await knowledgebaseRepository.trackEngagement(postId, type, user?.id);
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    return jsonError(err, 'Failed to track engagement');
  }
}
