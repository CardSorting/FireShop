import { requireAdminSession, jsonError, readJsonObject } from '@infrastructure/server/apiGuards';
import { ticketRepository } from '@infrastructure/repositories/firestore/FirestoreTicketRepository';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminSession(req);
    const properties = await readJsonObject(req);
    const { id } = await params;
    
    await ticketRepository.updateTicketProperties(id, properties);
    const updatedTicket = await ticketRepository.getTicketById(id);
    
    return Response.json(updatedTicket);
  } catch (err) {
    return jsonError(err);
  }
}
