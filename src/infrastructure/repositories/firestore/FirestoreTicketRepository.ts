/**
 * [LAYER: INFRASTRUCTURE]
 * Firestore Implementation of Ticket Repository
 */
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  Timestamp,
  type DocumentData,
  writeBatch
} from 'firebase/firestore';
import { getDb } from '../../firebase/firebase';
import type { SupportTicket, TicketMessage, TicketStatus, TicketPriority } from '@domain/models';

export class FirestoreTicketRepository {
  private readonly ticketCollection = 'support_tickets';
  private readonly messageCollection = 'ticket_messages';
  private readonly macroCollection = 'support_macros';
  private readonly claimCollection = 'hive_claims';

  private mapDocToTicket(id: string, data: DocumentData): SupportTicket {
    return {
      ...data,
      id,
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
      updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(data.updatedAt),
      slaDeadline: data.slaDeadline instanceof Timestamp ? data.slaDeadline.toDate() : (data.slaDeadline ? new Date(data.slaDeadline) : undefined),
    } as SupportTicket;
  }

  private mapDocToMessage(id: string, data: DocumentData): TicketMessage {
    return {
      ...data,
      id,
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
    } as TicketMessage;
  }

  async getTickets(options?: { status?: string; userId?: string; assigneeId?: string; limit?: number }) {
    let q = query(collection(getDb(), this.ticketCollection), orderBy('createdAt', 'desc'));
    
    if (options?.status && options.status !== 'all') {
      q = query(q, where('status', '==', options.status));
    }
    if (options?.userId) {
      q = query(q, where('userId', '==', options.userId));
    }
    if (options?.assigneeId) {
      q = query(q, where('assigneeId', '==', options.assigneeId));
    }
    if (options?.limit) {
      q = query(q, limit(options.limit));
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => this.mapDocToTicket(d.id, d.data()));
  }

  async getTicketById(id: string) {
    const docSnap = await getDoc(doc(getDb(), this.ticketCollection, id));
    if (!docSnap.exists()) return null;

    const messagesQ = query(collection(getDb(), this.messageCollection), where('ticketId', '==', id), orderBy('createdAt', 'asc'));
    const messagesSnap = await getDocs(messagesQ);
    
    const ticket = this.mapDocToTicket(docSnap.id, docSnap.data());
    ticket.messages = messagesSnap.docs.map(d => this.mapDocToMessage(d.id, d.data()));
    return ticket;
  }

  async getTicketForCustomer(id: string, userId: string) {
    const ticket = await this.getTicketById(id);
    if (!ticket || ticket.userId !== userId) return null;
    ticket.messages = ticket.messages.filter(m => m.visibility === 'public');
    return ticket;
  }

  async createTicket(ticket: SupportTicket) {
    const now = Timestamp.now();
    const ticketData = {
      ...ticket,
      messages: [], // Don't store messages in the ticket doc
      createdAt: now,
      updatedAt: now,
      slaDeadline: ticket.slaDeadline ? Timestamp.fromDate(new Date(ticket.slaDeadline)) : null,
    };
    await setDoc(doc(getDb(), this.ticketCollection, ticket.id), ticketData);

    if (ticket.messages && ticket.messages.length > 0) {
      const batch = writeBatch(getDb());
      for (const m of ticket.messages) {
        batch.set(doc(getDb(), this.messageCollection, m.id), {
          ...m,
          createdAt: m.createdAt ? Timestamp.fromDate(new Date(m.createdAt)) : now
        });
      }
      await batch.commit();
    }
  }

  async updateTicketProperties(id: string, updates: Partial<SupportTicket>) {
    const firestoreUpdates: any = { ...updates, updatedAt: Timestamp.now() };
    if (updates.slaDeadline) firestoreUpdates.slaDeadline = Timestamp.fromDate(new Date(updates.slaDeadline));
    
    await updateDoc(doc(getDb(), this.ticketCollection, id), firestoreUpdates);

    // Audit log
    const auditEntries = Object.entries(updates)
      .filter(([key]) => key !== 'updatedAt')
      .map(([key, val]) => `Ticket ${key} changed to "${val}"`);
    
    if (auditEntries.length > 0) {
      await this.addMessage({
        id: crypto.randomUUID(),
        ticketId: id,
        senderId: 'system',
        senderType: 'system',
        visibility: 'internal',
        content: `Audit: ${auditEntries.join(', ')}`,
        createdAt: new Date()
      });
    }
  }

  async updateTicketStatus(id: string, status: string) {
    return this.updateTicketProperties(id, { status: status as any });
  }

  async updateTicketPriority(id: string, priority: string) {
    return this.updateTicketProperties(id, { priority: priority as any });
  }

  async addMessage(message: TicketMessage) {
    const now = Timestamp.now();
    await setDoc(doc(getDb(), this.messageCollection, message.id), {
      ...message,
      createdAt: message.createdAt ? Timestamp.fromDate(new Date(message.createdAt)) : now
    });
    await updateDoc(doc(getDb(), this.ticketCollection, message.ticketId), { updatedAt: now });
  }

  async batchUpdateTickets(ids: string[], updates: Partial<SupportTicket>) {
    const batch = writeBatch(getDb());
    const now = Timestamp.now();
    const auditContent = `Bulk update performed on ${ids.length} tickets: ${Object.entries(updates).map(([k, v]) => `${k}=${v}`).join(', ')}`;
    
    for (const id of ids) {
      const firestoreUpdates: any = { ...updates, updatedAt: now };
      if (updates.slaDeadline) firestoreUpdates.slaDeadline = Timestamp.fromDate(new Date(updates.slaDeadline));
      batch.update(doc(getDb(), this.ticketCollection, id), firestoreUpdates);
      
      const messageId = crypto.randomUUID();
      batch.set(doc(getDb(), this.messageCollection, messageId), {
        id: messageId,
        ticketId: id,
        senderId: 'system',
        senderType: 'system',
        visibility: 'internal',
        content: auditContent,
        createdAt: now
      });
    }
    await batch.commit();
  }

  async getTicketHealthMetrics() {
    const snapshot = await getDocs(collection(getDb(), this.ticketCollection));
    const tickets = snapshot.docs.map(d => d.data());
    const total = tickets.length;
    if (total === 0) return { slaCompliance: 100, unassignedRate: 0, totalActive: 0 };

    const unresolved = tickets.filter(t => t.status !== 'solved' && t.status !== 'closed');
    const unassigned = unresolved.filter(t => !t.assigneeId);
    
    const breached = unresolved.filter(t => {
      const deadline = t.slaDeadline ? t.slaDeadline.toDate() : new Date(t.createdAt.toDate().getTime() + (24 * 60 * 60 * 1000));
      return deadline.getTime() < Date.now();
    });

    return {
      slaCompliance: Math.round(((unresolved.length - breached.length) / (unresolved.length || 1)) * 100),
      unassignedRate: Math.round((unassigned.length / (unresolved.length || 1)) * 100),
      totalActive: unresolved.length
    };
  }

  async getCustomerSupportSummary(userId: string) {
    const ticketsSnapshot = await getDocs(query(collection(getDb(), this.ticketCollection), where('userId', '==', userId)));
    const ordersSnapshot = await getDocs(query(collection(getDb(), 'orders'), where('userId', '==', userId)));

    const tickets = ticketsSnapshot.docs.map(d => d.data());
    const orders = ordersSnapshot.docs.map(d => d.data());

    const totalSpend = orders.reduce((sum, o) => sum + (o.total || 0), 0);
    const resolvedCount = tickets.filter(t => t.status === 'solved' || t.status === 'closed').length;

    return {
      totalTickets: tickets.length,
      resolvedCount,
      totalSpend: totalSpend / 100,
      recentOrders: orders.slice(0, 3).map(o => ({
        id: o.id,
        total: (o.total || 0) / 100,
        status: o.status,
        createdAt: o.createdAt.toDate()
      }))
    };
  }

  async getMacros() {
    const snapshot = await getDocs(collection(getDb(), this.macroCollection));
    return snapshot.docs.map(d => ({ ...d.data(), id: d.id }));
  }

  async addMacro(macro: { name: string; content: string; category: string; slug?: string }) {
    const id = crypto.randomUUID();
    await setDoc(doc(getDb(), this.macroCollection, id), { ...macro, id });
  }

  async updateMacro(id: string, updates: Partial<{ name: string; content: string; category: string; slug: string }>) {
    await updateDoc(doc(getDb(), this.macroCollection, id), updates);
  }

  async deleteMacro(id: string) {
    await deleteDoc(doc(getDb(), this.macroCollection, id));
  }

  async markHeartbeat(ticketId: string, userId: string, userName: string) {
    const id = `ticket_view_${ticketId}`;
    const expiresAt = Timestamp.fromDate(new Date(Date.now() + 15000));
    await setDoc(doc(getDb(), this.claimCollection, id), {
      id,
      owner: `${userId}:${userName}`,
      expiresAt,
      createdAt: Timestamp.now()
    });
  }

  async getActiveViewers(ticketId: string, currentUserId: string) {
    const id = `ticket_view_${ticketId}`;
    const docSnap = await getDoc(doc(getDb(), this.claimCollection, id));
    if (!docSnap.exists()) return [];
    
    const data = docSnap.data();
    if (data.expiresAt.toDate().getTime() < Date.now()) return [];
    
    const [ownerId, ownerName] = data.owner.split(':');
    if (ownerId === currentUserId) return [];
    return [{ id: ownerId, name: ownerName }];
  }
}

export const ticketRepository = new FirestoreTicketRepository();
