import { NextResponse } from 'next/server';
import { knowledgebaseRepository } from '@infrastructure/repositories/firestore/FirestoreKnowledgebaseRepository';
import { assertRateLimit, jsonError, optionalString, readJsonObject, requireString } from '@infrastructure/server/apiGuards';
import { DomainError } from '@domain/errors';

export async function POST(req: Request) {
  try {
    await assertRateLimit(req, 'crm_subscribe', 10, 60_000);
    const body = await readJsonObject(req);
    if (body.website || body.companyUrl) throw new DomainError('Invalid subscription request.');
    const email = requireString(body.email, 'email').toLowerCase();
    const source = optionalString(body.source, 'source') || 'direct';

    await knowledgebaseRepository.subscribe(email, source);
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    return jsonError(err, 'Failed to subscribe');
  }
}
