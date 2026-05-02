import { getSQLiteDB } from '../sqlite/database';
import type { SupportTicket, TicketMessage, TicketStatus, TicketPriority } from '@domain/models';

function mapTicket(row: any): SupportTicket {
  return {
    id: row.id,
    userId: row.userId,
    customerEmail: row.customerEmail,
    customerName: row.customerName || undefined,
    orderId: row.orderId || undefined,
    productId: row.productId || undefined,
    subject: row.subject,
    status: row.status as TicketStatus,
    priority: row.priority as TicketPriority,
    messages: [],
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
  };
}

function mapMessage(row: any): TicketMessage {
  return {
    id: row.id,
    ticketId: row.ticketId,
    senderId: row.senderId,
    senderType: row.senderType as 'customer' | 'agent' | 'system',
    visibility: (row.visibility || 'public') as 'public' | 'internal',
    content: row.content,
    createdAt: new Date(row.createdAt),
  };
}

export const ticketRepository = {
  async getTickets(options?: { status?: string; userId?: string; limit?: number }) {
    const db = getSQLiteDB();
    let query = db.selectFrom('support_tickets').selectAll();
    
    if (options?.status && options.status !== 'all') {
      query = query.where('status', '=', options.status);
    }

    if (options?.userId) {
      query = query.where('userId', '=', options.userId);
    }
    
    query = query.orderBy('createdAt', 'desc');
    
    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const rows = await query.execute();
    return rows.map(mapTicket);
  },

  async getTicketById(id: string) {
    const db = getSQLiteDB();
    const row = await db.selectFrom('support_tickets').selectAll().where('id', '=', id).executeTakeFirst();
    if (!row) return null;

    const messagesRow = await db.selectFrom('ticket_messages').selectAll().where('ticketId', '=', id).orderBy('createdAt', 'asc').execute();
    
    const ticket = mapTicket(row);
    ticket.messages = messagesRow.map(mapMessage);
    return ticket;
  },

  async getTicketForCustomer(id: string, userId: string) {
    const ticket = await this.getTicketById(id);
    if (!ticket || ticket.userId !== userId) return null;
    
    // Security: Filter out internal messages from customer view
    ticket.messages = ticket.messages.filter(m => m.visibility === 'public');
    return ticket;
  },

  async createTicket(ticket: SupportTicket) {
    const db = getSQLiteDB();
    await db.insertInto('support_tickets').values({
      id: ticket.id,
      userId: ticket.userId,
      customerEmail: ticket.customerEmail,
      customerName: ticket.customerName || null,
      orderId: ticket.orderId || null,
      productId: ticket.productId || null,
      subject: ticket.subject,
      status: ticket.status,
      priority: ticket.priority,
      createdAt: ticket.createdAt.toISOString(),
      updatedAt: ticket.updatedAt.toISOString(),
    }).execute();

    if (ticket.messages && ticket.messages.length > 0) {
      const messagesToInsert = ticket.messages.map(m => ({
        id: m.id,
        ticketId: ticket.id,
        senderId: m.senderId,
        senderType: m.senderType,
        visibility: m.visibility || 'public',
        content: m.content,
        createdAt: m.createdAt.toISOString(),
      }));
      await db.insertInto('ticket_messages').values(messagesToInsert).execute();
    }
  },

  async updateTicketStatus(id: string, status: string) {
    const db = getSQLiteDB();
    await db.updateTable('support_tickets')
      .set({ status, updatedAt: new Date().toISOString() })
      .where('id', '=', id)
      .execute();
  },

  async addMessage(message: TicketMessage) {
    const db = getSQLiteDB();
    await db.insertInto('ticket_messages').values({
      id: message.id,
      ticketId: message.ticketId,
      senderId: message.senderId,
      senderType: message.senderType,
      visibility: message.visibility || 'public',
      content: message.content,
      createdAt: message.createdAt.toISOString(),
    }).execute();

    await db.updateTable('support_tickets')
      .set({ updatedAt: new Date().toISOString() })
      .where('id', '=', message.ticketId)
      .execute();
  }
};
