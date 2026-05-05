import { NextResponse } from 'next/server';
import { knowledgebaseRepository } from '@infrastructure/repositories/firestore/FirestoreKnowledgebaseRepository';

export async function GET(req: Request, { params }: { params: Promise<{ postId: string }> }) {
  try {
    const { postId } = await params;
    const comments = await knowledgebaseRepository.getComments(postId);
    return NextResponse.json(comments);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ postId: string }> }) {
  try {
    const { postId } = await params;
    const body = await req.json();
    const comment = await knowledgebaseRepository.addComment({
      postId,
      userId: body.userId,
      userName: body.userName,
      userAvatar: body.userAvatar,
      content: body.content,
      status: 'published', // In a real app, this might be 'pending' for moderation
    });
    return NextResponse.json(comment);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
