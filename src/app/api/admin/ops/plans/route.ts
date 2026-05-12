import { NextResponse } from 'next/server';
import { getServerServices } from '@infrastructure/server/services';
import { DomainError } from '@domain/errors';
import { OPERATIONAL_INTENT_CARDS } from '@domain/ops/intents';
import type { OperationalIntentType } from '@domain/ops/types';
import { jsonError, readJsonObject, requireAdminSession, requireString } from '@infrastructure/server/apiGuards';

const INTENT_TYPES = new Set(OPERATIONAL_INTENT_CARDS.map((card) => card.type));

function requireIntentType(value: unknown): OperationalIntentType {
  const intentType = requireString(value, 'intentType') as OperationalIntentType;
  if (!INTENT_TYPES.has(intentType)) throw new DomainError('Unknown operational intent type.');
  return intentType;
}

export async function POST(request: Request) {
  try {
    const user = await requireAdminSession(request);
    const body = await readJsonObject(request);
    const intentType = requireIntentType(body.intentType);
    const services = await getServerServices();
    const plan = await services.operationsRuntimeService.compilePlan(intentType, {
      userId: user.id,
      email: user.email,
    });
    return NextResponse.json(plan, { status: 201 });
  } catch (error) {
    return jsonError(error, 'Failed to compile operational plan');
  }
}