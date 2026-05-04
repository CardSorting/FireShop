import { NextResponse } from 'next/server';
import { getInitialServices } from '@core/container';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const services = getInitialServices();
    const { status } = await req.json();
    
    if (!['published', 'spam'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    await services.knowledgebaseRepository.updateCommentStatus(params.id, status);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
