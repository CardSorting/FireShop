import { NextResponse } from 'next/server';
import { ticketRepository } from '@infrastructure/repositories/firestore/FirestoreTicketRepository';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const properties = await req.json();
    const { id } = await params;
    
    await ticketRepository.updateTicketProperties(id, properties);
    const updatedTicket = await ticketRepository.getTicketById(id);
    
    return NextResponse.json(updatedTicket);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
