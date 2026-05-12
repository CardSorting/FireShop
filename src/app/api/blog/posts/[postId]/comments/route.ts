import { NextResponse } from 'next/server';
import { knowledgebaseRepository } from '@infrastructure/repositories/firestore/FirestoreKnowledgebaseRepository';
import { assertRateLimit, jsonError, readJsonObject, requireSessionUser, requireString } from '@infrastructure/server/apiGuards';

export async function GET(req: Request, { params }: { params: Promise<{ postId: string }> }) {
  try {
    const { postId } = await params;
    const comments = await knowledgebaseRepository.getComments(postId);
    return NextResponse.json(comments);
  } catch (err) {
    return jsonError(err, 'Failed to load comments');
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ postId: string }> }) {
  try {
    const user = await requireSessionUser();
    await assertRateLimit(req, 'blog_comment', 10, 60_000);
    const { postId } = await params;
    const body = await readJsonObject(req);
    const comment = await knowledgebaseRepository.addComment({
      postId,
      userId: user.id,
      userName: user.displayName || 'User',
      userAvatar: typeof body.userAvatar === 'string' ? body.userAvatar : undefined,
      content: requireString(body.content, 'content'),
      status: 'published',
    });
    return NextResponse.json(comment);
  } catch (err) {
    return jsonError(err, 'Failed to add comment');
  }
}
