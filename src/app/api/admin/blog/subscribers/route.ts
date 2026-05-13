import { NextResponse } from 'next/server';
import { getInitialServices } from '@core/container';
import { jsonError, requireAdminSession } from '@infrastructure/server/apiGuards';

export async function GET(req: Request) {
  try {
    await requireAdminSession(req);
    const services = getInitialServices();
    const subscribers = await services.knowledgebaseRepository.getSubscribers();
    
    return NextResponse.json(subscribers);
  } catch (err) {
    return jsonError(err, 'Failed to fetch subscribers');
  }
}
