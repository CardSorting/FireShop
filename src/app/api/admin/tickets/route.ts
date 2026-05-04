import { NextResponse } from 'next/server';
import { ticketRepository } from '@infrastructure/repositories/firestore/FirestoreTicketRepository';
import { jsonError, requireAdminSession } from '@infrastructure/server/apiGuards';

export async function GET(req: Request) {
  try {
    await requireAdminSession();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || undefined;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit') as string, 10) : undefined;
    
    const tickets = await ticketRepository.getTickets({ status, limit });
    return NextResponse.json(tickets);
  } catch (err: any) {
    return jsonError(err, 'Failed to fetch tickets');
  }
}
