import { NextResponse } from 'next/server';
import { ticketRepository } from '@infrastructure/repositories/firestore/FirestoreTicketRepository';
import { jsonError, readJsonObject, requireSessionUser } from '@infrastructure/server/apiGuards';
import { DomainError, UnauthorizedError } from '@domain/errors';

function requireMessageContent(value: unknown): string {
  if (typeof value !== 'string' || !value.trim()) throw new DomainError('content is required.');
  const trimmed = value.trim();
  if (trimmed.length > 5_000) throw new DomainError('content is too long.');
  return trimmed;
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await requireSessionUser();
    const ticket = await ticketRepository.getTicketById(id);
    if (!ticket) return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    if (user.role !== 'admin' && ticket.userId !== user.id) {
      throw new UnauthorizedError();
    }

    const data = await readJsonObject(req);
    const isAdmin = user.role === 'admin';
    const requestedVisibility: 'internal' | 'public' = data.visibility === 'internal' ? 'internal' : 'public';
    const message = {
      id: crypto.randomUUID(),
      ticketId: id,
      senderId: user.id,
      senderType: isAdmin ? 'agent' as const : 'customer' as const,
      visibility: isAdmin ? requestedVisibility : 'public',
      content: requireMessageContent(data.content),
      createdAt: new Date(),
    };
    await ticketRepository.addMessage(message);
    return NextResponse.json(message);
  } catch (err) {
    return jsonError(err, 'Failed to add support message');
  }
}
