import { requireAdminSession, jsonError, readJsonObject } from '@infrastructure/server/apiGuards';
import { ticketRepository } from '@infrastructure/repositories/firestore/FirestoreTicketRepository';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminSession(request);
    const { id: ticketId } = await params;
    const { userId, userName } = await readJsonObject(request);
    
    await ticketRepository.markHeartbeat(ticketId, userId as string, userName as string);
    const viewers = await ticketRepository.getActiveViewers(ticketId, userId as string);
    
    return Response.json({ viewers });
  } catch (err) {
    return jsonError(err);
  }
}
