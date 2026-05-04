import { requireAdminSession, jsonError } from '@infrastructure/server/apiGuards';
import { ticketRepository } from '@infrastructure/repositories/firestore/FirestoreTicketRepository';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminSession();
    const { id: ticketId } = await params;
    const { userId, userName } = await request.json();
    
    await ticketRepository.markHeartbeat(ticketId, userId, userName);
    const viewers = await ticketRepository.getActiveViewers(ticketId, userId);
    
    return Response.json({ viewers });
  } catch (err) {
    return jsonError(err);
  }
}
