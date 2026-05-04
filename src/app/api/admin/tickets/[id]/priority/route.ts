import { requireAdminSession, jsonError } from '@infrastructure/server/apiGuards';
import { ticketRepository } from '@infrastructure/repositories/firestore/FirestoreTicketRepository';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminSession();
    const { id } = await params;
    const { priority } = await req.json();
    await ticketRepository.updateTicketPriority(id, priority);
    const updated = await ticketRepository.getTicketById(id);
    return Response.json(updated);
  } catch (err) {
    return jsonError(err);
  }
}
