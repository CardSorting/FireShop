import { requireAdminSession, jsonError, readJsonObject } from '@infrastructure/server/apiGuards';
import { ticketRepository } from '@infrastructure/repositories/firestore/FirestoreTicketRepository';

export async function PATCH(request: Request) {
  try {
    await requireAdminSession();
    const { ids, updates } = await readJsonObject(request);
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return jsonError(new Error('IDs are required'));
    }
    
    await ticketRepository.batchUpdateTickets(ids as string[], updates as any);
    return Response.json({ success: true });
  } catch (err) {
    return jsonError(err, 'Failed to batch update tickets');
  }
}
