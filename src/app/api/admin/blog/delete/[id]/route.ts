import { NextResponse } from 'next/server';
import { getInitialServices } from '@core/container';

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const services = getInitialServices();
    await services.knowledgebaseRepository.deleteArticle(params.id);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
