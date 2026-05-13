import { requireAdminSession, jsonError, readJsonObject } from '@infrastructure/server/apiGuards';
import { ticketRepository } from '@infrastructure/repositories/firestore/FirestoreTicketRepository';
import { getInitialServices } from '@core/container';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdminSession(req);
    const properties = await readJsonObject(req);
    const { id } = await params;
    
    const oldTicket = await ticketRepository.getTicketById(id);
    await ticketRepository.updateTicketProperties(id, properties);
    const updatedTicket = await ticketRepository.getTicketById(id);
    
    // PRODUCTION HARDENING: Forensic Auditing
    const { auditService } = getInitialServices();
    await auditService.record({
      userId: session.id,
      userEmail: session.email,
      action: 'ticket_updated',
      targetId: id,
      details: { properties, previousTags: oldTicket?.tags }
    });

    return Response.json(updatedTicket);
  } catch (err) {
    return jsonError(err);
  }
}
