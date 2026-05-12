import { NextResponse } from 'next/server';
import { ticketRepository } from '@infrastructure/repositories/firestore/FirestoreTicketRepository';
import { jsonError, requireSessionUser } from '@infrastructure/server/apiGuards';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await requireSessionUser();

    const ticket = user.role === 'admin'
      ? await ticketRepository.getTicketById(id)
      : await ticketRepository.getTicketForCustomer(id, user.id);
    
    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    return NextResponse.json(ticket);
  } catch (err) {
    return jsonError(err, 'Failed to load support ticket');
  }
}
