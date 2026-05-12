import { NextResponse } from 'next/server';
import { knowledgebaseRepository } from '@infrastructure/repositories/firestore/FirestoreKnowledgebaseRepository';
import { assertRateLimit, jsonError, readJsonObject, requireString } from '@infrastructure/server/apiGuards';
import { getSessionUser } from '@infrastructure/server/session';
import { DomainError } from '@domain/errors';

export async function POST(req: Request) {
  try {
    await assertRateLimit(req, 'support_feedback', 20, 60_000);
    const body = await readJsonObject(req);
    const articleId = requireString(body.articleId, 'articleId');
    if (typeof body.isHelpful !== 'boolean') throw new DomainError('isHelpful must be true or false.');
    const user = await getSessionUser();
    await knowledgebaseRepository.addFeedback(articleId, body.isHelpful, user?.id);
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    return jsonError(err, 'Failed to record feedback');
  }
}
