import { NextResponse } from 'next/server';
import { knowledgebaseRepository } from '@infrastructure/repositories/knowledgebaseRepository';

export async function POST(req: Request) {
  try {
    const { articleId, isHelpful, userId } = await req.json();
    await knowledgebaseRepository.addFeedback(articleId, isHelpful, userId);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
