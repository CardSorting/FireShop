import { requireAdminSession, jsonError, readJsonObject } from '@infrastructure/server/apiGuards';
import { ticketRepository } from '@infrastructure/repositories/firestore/FirestoreTicketRepository';
import { getInitialServices } from '@core/container';

export async function PATCH(request: Request) {
  try {
    const session = await requireAdminSession(request);
    const { ids, updates } = await readJsonObject(request);
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return jsonError(new Error('IDs are required'));
    }
    
    await ticketRepository.batchUpdateTickets(ids as string[], updates as any);

    // PRODUCTION HARDENING: Forensic Auditing
    const { auditService } = getInitialServices();
    await auditService.record({
      userId: session.id,
      userEmail: session.email,
      action: 'ticket_batch_updated',
      targetId: 'batch',
      details: { ids, updates }
    });

    return Response.json({ success: true });
  } catch (err) {
    return jsonError(err, 'Failed to batch update tickets');
  }
}
