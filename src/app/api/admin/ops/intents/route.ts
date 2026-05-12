import { NextResponse } from 'next/server';
import { getServerServices } from '@infrastructure/server/services';
import { jsonError, requireAdminSession } from '@infrastructure/server/apiGuards';

export async function GET(request: Request) {
  try {
    await requireAdminSession(request);
    const services = await getServerServices();
    return NextResponse.json(services.operationsRuntimeService.getIntentCards());
  } catch (error) {
    return jsonError(error, 'Failed to load operational intents');
  }
}