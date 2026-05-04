import { requireAdminSession, jsonError } from '@infrastructure/server/apiGuards';
import { ticketRepository } from '@infrastructure/repositories/firestore/FirestoreTicketRepository';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminSession();
    const properties = await req.json();
    const { id } = await params;
    
    await ticketRepository.updateTicketProperties(id, properties);
    const updatedTicket = await ticketRepository.getTicketById(id);
    
    return Response.json(updatedTicket);
  } catch (err) {
    return jsonError(err);
  }
}
