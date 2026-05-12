import { NextResponse } from 'next/server';
import { getInitialServices } from '@core/container';
import { jsonError, requireAdminSession } from '@infrastructure/server/apiGuards';

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminSession(req);
    const { id } = await params;
    const services = getInitialServices();
    await services.knowledgebaseRepository.deleteComment(id);
    return NextResponse.json({ success: true });
  } catch (err) {
    return jsonError(err, 'Failed to delete comment');
  }
}
