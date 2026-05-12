import { NextResponse } from 'next/server';
import { ticketRepository } from '@infrastructure/repositories/firestore/FirestoreTicketRepository';
import { jsonError, readJsonObject, requireSessionUser } from '@infrastructure/server/apiGuards';
import { DomainError } from '@domain/errors';
import type { TicketPriority, TicketType } from '@domain/models';

const TICKET_TYPES = new Set<TicketType>(['question', 'incident', 'problem', 'task']);
const TICKET_PRIORITIES = new Set<TicketPriority>(['low', 'medium', 'high', 'urgent']);
const MAX_TEXT_LENGTH = 5_000;

function requiredText(value: unknown, field: string, maxLength = MAX_TEXT_LENGTH): string {
  if (typeof value !== 'string' || !value.trim()) throw new DomainError(`${field} is required.`);
  const trimmed = value.trim();
  if (trimmed.length > maxLength) throw new DomainError(`${field} is too long.`);
  return trimmed;
}

function optionalText(value: unknown, field: string, maxLength = 200): string | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  return requiredText(value, field, maxLength);
}

export async function GET(req: Request) {
  try {
    const user = await requireSessionUser();
    
    const tickets = await ticketRepository.getTickets({ userId: user.id });
    return NextResponse.json(tickets);
  } catch (err) {
    return jsonError(err, 'Failed to load support tickets');
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireSessionUser();
    const data = await readJsonObject(req);
    const ticketId = crypto.randomUUID();
    const requestedType = optionalText(data.type, 'type', 30) as TicketType | undefined;
    const requestedPriority = optionalText(data.priority, 'priority', 30) as TicketPriority | undefined;
    const initialMessage = Array.isArray(data.messages) && data.messages[0]
      ? requiredText((data.messages[0] as Record<string, unknown>).content, 'message')
      : requiredText(data.message ?? data.content, 'message');
    const type = requestedType && TICKET_TYPES.has(requestedType) ? requestedType : 'question';
    const priority = requestedPriority && TICKET_PRIORITIES.has(requestedPriority) ? requestedPriority : 'medium';
    const ticket = {
      id: ticketId,
      userId: user.id,
      customerEmail: user.email,
      customerName: user.displayName || undefined,
      orderId: optionalText(data.orderId, 'orderId'),
      productId: optionalText(data.productId, 'productId'),
      subject: requiredText(data.subject, 'subject', 200),
      type,
      tags: [type],
      priority,
      status: 'new' as const,
      messages: [
        {
          id: crypto.randomUUID(),
          ticketId,
          senderId: user.id,
          senderType: 'customer' as const,
          visibility: 'public' as const,
          content: initialMessage,
          createdAt: new Date()
        }
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await ticketRepository.createTicket(ticket);
    return NextResponse.json(ticket);
  } catch (err) {
    return jsonError(err, 'Failed to create support ticket');
  }
}
