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
  runTransaction,
  writeBatch,
  getUnifiedDb,
  serverTimestamp,
  type DocumentData,
  type QueryDocumentSnapshot,
  type Transaction
} from '../../firebase/bridge';
import { logger } from '@utils/logger';
import type { SupportTicket, TicketMessage, TicketStatus, TicketPriority } from '@domain/models';
import { mapDoc } from './utils';

export class FirestoreTicketRepository {
  private readonly ticketCollection = 'support_tickets';
  private readonly messageCollection = 'ticket_messages';
  private readonly macroCollection = 'support_macros';
  private readonly claimCollection = 'hive_claims';

  private mapDocToTicket(id: string, data: DocumentData): SupportTicket {
    return mapDoc<SupportTicket>(id, data);
  }

  private mapDocToMessage(id: string, data: DocumentData): TicketMessage {
    return mapDoc<TicketMessage>(id, data);
  }

  async getTickets(options?: { status?: string; userId?: string; assigneeId?: string; limit?: number }) {
    let q = query(collection(getUnifiedDb(), this.ticketCollection), orderBy('createdAt', 'desc'));
    
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
    return snapshot.docs.map((d: QueryDocumentSnapshot) => this.mapDocToTicket(d.id, d.data() as any));
  }

  async getTicketById(id: string) {
    const docSnap = await getDoc(doc(getUnifiedDb(), this.ticketCollection, id));
    if (!docSnap.exists()) return null;

    const messagesQ = query(collection(getUnifiedDb(), this.messageCollection), where('ticketId', '==', id), orderBy('createdAt', 'asc'));
    const messagesSnap = await getDocs(messagesQ);
    
    const ticket = this.mapDocToTicket(docSnap.id, docSnap.data());
    ticket.messages = messagesSnap.docs.map((d: QueryDocumentSnapshot) => this.mapDocToMessage(d.id, d.data() as any));
    return ticket;
  }

  async getTicketForCustomer(id: string, userId: string) {
    const ticket = await this.getTicketById(id);
    if (!ticket || ticket.userId !== userId) return null;
    ticket.messages = ticket.messages.filter(m => m.visibility === 'public');
    return ticket;
  }

  async createTicket(ticket: SupportTicket) {
    const now = serverTimestamp();
    const ticketData = {
      ...ticket,
      messages: [], // Don't store messages in the ticket doc
      createdAt: now,
      updatedAt: now,
      slaDeadline: ticket.slaDeadline ? Timestamp.fromDate(new Date(ticket.slaDeadline)) : null,
    };

    const db = getUnifiedDb();
    await runTransaction(db, async (transaction: any) => {
      transaction.set(doc(db, this.ticketCollection, ticket.id), ticketData);

      if (ticket.messages && ticket.messages.length > 0) {
        for (const m of ticket.messages) {
          transaction.set(doc(db, this.messageCollection, m.id), {
            ...m,
            createdAt: m.createdAt ? Timestamp.fromDate(new Date(m.createdAt)) : now
          });
        }
      }
    });
  }

  async updateTicketProperties(id: string, updates: Partial<SupportTicket>) {
    const db = getUnifiedDb();
    
    await runTransaction(db, async (transaction: any) => {
      const firestoreUpdates: any = { ...updates, updatedAt: serverTimestamp() };
      if (updates.slaDeadline) firestoreUpdates.slaDeadline = Timestamp.fromDate(new Date(updates.slaDeadline));
      
      transaction.update(doc(db, this.ticketCollection, id), firestoreUpdates);

      // Audit log as an internal message
      const auditEntries = Object.entries(updates)
        .filter(([key]) => key !== 'updatedAt')
        .map(([key, val]) => `Ticket ${key} changed to "${val}"`);
      
      if (auditEntries.length > 0) {
        const messageId = crypto.randomUUID();
        transaction.set(doc(db, this.messageCollection, messageId), {
          id: messageId,
          ticketId: id,
          senderId: 'system',
          senderType: 'system',
          visibility: 'internal',
          content: `Audit: ${auditEntries.join(', ')}`,
          createdAt: serverTimestamp()
        });
      }
    });
  }

  async updateTicketStatus(id: string, status: string) {
    return this.updateTicketProperties(id, { status: status as any });
  }

  async updateTicketPriority(id: string, priority: string) {
    return this.updateTicketProperties(id, { priority: priority as any });
  }

  async addMessage(message: TicketMessage) {
    const db = getUnifiedDb();
    await runTransaction(db, async (transaction: any) => {
      const now = serverTimestamp();
      transaction.set(doc(db, this.messageCollection, message.id), {
        ...message,
        createdAt: message.createdAt ? Timestamp.fromDate(new Date(message.createdAt)) : now
      });
      transaction.update(doc(db, this.ticketCollection, message.ticketId), { updatedAt: now });
    });
  }

  async batchUpdateTickets(ids: string[], updates: Partial<SupportTicket>) {
    const db = getUnifiedDb();
    // Use transaction for bulk update to ensure all tickets and audit messages are consistent
    await runTransaction(db, async (transaction: any) => {
      const now = serverTimestamp();
      const auditContent = `Bulk update performed on ${ids.length} tickets: ${Object.entries(updates).map(([k, v]) => `${k}=${v}`).join(', ')}`;
      
      for (const id of ids) {
        const firestoreUpdates: any = { ...updates, updatedAt: now };
        if (updates.slaDeadline) firestoreUpdates.slaDeadline = Timestamp.fromDate(new Date(updates.slaDeadline));
        transaction.update(doc(db, this.ticketCollection, id), firestoreUpdates);
        
        const messageId = crypto.randomUUID();
        transaction.set(doc(db, this.messageCollection, messageId), {
          id: messageId,
          ticketId: id,
          senderId: 'system',
          senderType: 'system',
          visibility: 'internal',
          content: auditContent,
          createdAt: now
        });
      }
    });
  }

  async getTicketHealthMetrics() {
    // Production Hardening: Fetch only unresolved tickets for health metrics to avoid O(N) scan of history
    const q = query(
      collection(getUnifiedDb(), this.ticketCollection), 
      where('status', 'in', ['new', 'open', 'pending', 'on_hold'])
    );
    const snapshot = await getDocs(q);
    const tickets = snapshot.docs.map((d: QueryDocumentSnapshot) => d.data() as any);
    const total = tickets.length;
    if (total === 0) return { slaCompliance: 100, unassignedRate: 0, totalActive: 0 };

    const unresolved = tickets.filter((t: any) => t.status !== 'solved' && t.status !== 'closed');
    const unassigned = unresolved.filter((t: any) => !t.assigneeId);
    
    const breached = unresolved.filter((t: any) => {
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
    const ticketsSnapshot = await getDocs(query(collection(getUnifiedDb(), this.ticketCollection), where('userId', '==', userId)));
    const ordersSnapshot = await getDocs(query(collection(getUnifiedDb(), 'orders'), where('userId', '==', userId)));

    const tickets = ticketsSnapshot.docs.map((d: QueryDocumentSnapshot) => d.data() as any);
    const orders = ordersSnapshot.docs.map((d: QueryDocumentSnapshot) => d.data() as any);

    const totalSpend = orders.reduce((sum: number, o: any) => sum + (o.total || 0), 0);
    const resolvedCount = tickets.filter((t: any) => t.status === 'solved' || t.status === 'closed').length;

    return {
      totalTickets: tickets.length,
      resolvedCount,
      totalSpend: totalSpend / 100,
      recentOrders: orders.slice(0, 3).map((o: any) => ({
        id: o.id,
        total: (o.total || 0) / 100,
        status: o.status,
        createdAt: o.createdAt.toDate()
      }))
    };
  }

  async getMacros() {
    const snapshot = await getDocs(collection(getUnifiedDb(), this.macroCollection));
    return snapshot.docs.map((d: QueryDocumentSnapshot) => ({ ...d.data() as any, id: d.id }));
  }

  async addMacro(macro: { name: string; content: string; category: string; slug?: string }) {
    const id = crypto.randomUUID();
    await setDoc(doc(getUnifiedDb(), this.macroCollection, id), { ...macro, id });
  }

  async updateMacro(id: string, updates: Partial<{ name: string; content: string; category: string; slug: string }>) {
    await updateDoc(doc(getUnifiedDb(), this.macroCollection, id), updates);
  }

  async deleteMacro(id: string) {
    await deleteDoc(doc(getUnifiedDb(), this.macroCollection, id));
  }

  async markHeartbeat(ticketId: string, userId: string, userName: string) {
    // Production Hardening: Use a dedicated heartbeat collection to support multiple concurrent viewers
    // instead of a single document per ticket.
    const id = `${ticketId}_${userId}`;
    const expiresAt = Timestamp.fromDate(new Date(Date.now() + 15000));
    await setDoc(doc(getUnifiedDb(), this.claimCollection, id), {
      id,
      ticketId,
      userId,
      userName,
      expiresAt,
      updatedAt: serverTimestamp()
    });
  }

  async getActiveViewers(ticketId: string, currentUserId: string) {
    const q = query(
      collection(getUnifiedDb(), this.claimCollection), 
      where('ticketId', '==', ticketId)
    );
    const snapshot = await getDocs(q);
    const now = Date.now();
    
    return snapshot.docs
      .map((d: QueryDocumentSnapshot) => d.data() as any)
      .filter((d: any) => d.userId !== currentUserId && d.expiresAt.toDate().getTime() > now)
      .map((d: any) => ({ id: d.userId, name: d.userName }));
  }
}

export const ticketRepository = new FirestoreTicketRepository();
