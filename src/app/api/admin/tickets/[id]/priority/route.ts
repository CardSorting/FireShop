import { requireAdminSession, jsonError, readJsonObject, requireString } from '@infrastructure/server/apiGuards';
import { ticketRepository } from '@infrastructure/repositories/firestore/FirestoreTicketRepository';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminSession(req);
    const { id } = await params;
    const { priority } = await readJsonObject(req);
    await ticketRepository.updateTicketPriority(id, requireString(priority, 'priority'));
    const updated = await ticketRepository.getTicketById(id);
    return Response.json(updated);
  } catch (err) {
    return jsonError(err);
  }
}
