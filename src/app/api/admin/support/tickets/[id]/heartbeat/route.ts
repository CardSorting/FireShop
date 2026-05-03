import { NextResponse } from 'next/server';
import { ticketRepository } from '@infrastructure/repositories/firestore/FirestoreTicketRepository';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: ticketId } = await params;
    const { userId, userName } = await request.json();
    
    await ticketRepository.markHeartbeat(ticketId, userId, userName);
    const viewers = await ticketRepository.getActiveViewers(ticketId, userId);
    
    return NextResponse.json({ viewers });
  } catch (err) {
    return NextResponse.json({ error: 'Heartbeat failed' }, { status: 500 });
  }
}
