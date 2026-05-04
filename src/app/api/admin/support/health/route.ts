import { NextResponse } from 'next/server';
import { ticketRepository } from '@infrastructure/repositories/firestore/FirestoreTicketRepository';
import { jsonError, requireAdminSession } from '@infrastructure/server/apiGuards';

export async function GET() {
  try {
    await requireAdminSession();
    const metrics = await ticketRepository.getTicketHealthMetrics();
    return NextResponse.json(metrics);
  } catch (err) {
    return jsonError(err, 'Failed to fetch health metrics');
  }
}
