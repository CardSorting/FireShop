import { requireAdminSession, jsonError, readJsonObject, requireString } from '@infrastructure/server/apiGuards';
import { ticketRepository } from '@infrastructure/repositories/firestore/FirestoreTicketRepository';
import { getInitialServices } from '@core/container';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAdminSession(req);
    const { id } = await params;
    const { status } = await readJsonObject(req);
    
    const oldTicket = await ticketRepository.getTicketById(id);
    await ticketRepository.updateTicketStatus(id, requireString(status, 'status'));
    const updated = await ticketRepository.getTicketById(id);

    // PRODUCTION HARDENING: Forensic Auditing
    const { auditService } = getInitialServices();
    await auditService.record({
      userId: session.id,
      userEmail: session.email,
      action: 'ticket_status_changed',
      targetId: id,
      details: { from: oldTicket?.status, to: status }
    });

    return Response.json(updated);
  } catch (err) {
    return jsonError(err);
  }
}
