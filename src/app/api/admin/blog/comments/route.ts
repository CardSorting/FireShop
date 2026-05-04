import { NextResponse } from 'next/server';
import { getInitialServices } from '@core/container';

export async function GET() {
  try {
    const services = getInitialServices();
    const comments = await services.knowledgebaseRepository.getAllComments();
    return NextResponse.json(comments);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
