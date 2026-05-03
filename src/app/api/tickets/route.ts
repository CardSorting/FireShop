import { NextResponse } from 'next/server';
import { ticketRepository } from '@infrastructure/repositories/firestore/FirestoreTicketRepository';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    if (!userId) return NextResponse.json({ error: 'UserId required' }, { status: 400 });
    
    const tickets = await ticketRepository.getTickets({ userId });
    return NextResponse.json(tickets);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const ticketId = crypto.randomUUID();
    data.id = ticketId;
    if (data.messages && data.messages.length > 0) {
      data.messages[0].ticketId = ticketId;
      data.messages[0].visibility = 'public'; // Force public for initial message
    }
    await ticketRepository.createTicket(data);
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
