import { NextResponse } from 'next/server';
import { ticketRepository } from '@infrastructure/repositories/firestore/FirestoreTicketRepository';

export async function GET() {
  try {
    const metrics = await ticketRepository.getTicketHealthMetrics();
    return NextResponse.json(metrics);
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch health metrics' }, { status: 500 });
  }
}
