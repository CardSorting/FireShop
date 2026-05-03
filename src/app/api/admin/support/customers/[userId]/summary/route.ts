import { NextResponse } from 'next/server';
import { ticketRepository } from '@infrastructure/repositories/firestore/FirestoreTicketRepository';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const summary = await ticketRepository.getCustomerSupportSummary(userId);
    return NextResponse.json(summary);
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch customer summary' }, { status: 500 });
  }
}
