import { NextResponse } from 'next/server';
import { ticketRepository } from '@infrastructure/repositories/firestore/FirestoreTicketRepository';
import { jsonError, requireAdminSession } from '@infrastructure/server/apiGuards';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminSession();
    const { id } = await params;
    const ticket = await ticketRepository.getTicketById(id);
    if (!ticket) return jsonError(new Error('Ticket not found'), 'Not found');
    return NextResponse.json(ticket);
  } catch (err: any) {
    return jsonError(err, 'Failed to fetch ticket');
  }
}
