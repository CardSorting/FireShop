import { NextResponse } from 'next/server';
import { getInitialServices } from '@core/container';

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const services = getInitialServices();
    await services.knowledgebaseRepository.deleteComment(id);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
