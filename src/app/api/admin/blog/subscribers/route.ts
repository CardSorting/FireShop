import { NextResponse } from 'next/server';
import { getInitialServices } from '@core/container';

export async function GET() {
  try {
    const services = getInitialServices();
    const subscribers = await services.knowledgebaseRepository.getSubscribers();
    return NextResponse.json(subscribers);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
