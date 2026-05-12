import { NextResponse } from 'next/server';
import { getInitialServices } from '@core/container';
import { jsonError, requireAdminSession } from '@infrastructure/server/apiGuards';

export async function GET(req: Request) {
  try {
    await requireAdminSession(req);
    const services = getInitialServices();
    const comments = await services.knowledgebaseRepository.getAllComments();
    return NextResponse.json(comments);
  } catch (err) {
    return jsonError(err, 'Failed to load blog comments');
  }
}
