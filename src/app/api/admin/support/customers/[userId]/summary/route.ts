import { NextResponse } from 'next/server';
import { ticketRepository } from '@infrastructure/repositories/firestore/FirestoreTicketRepository';
import { jsonError, requireAdminSession } from '@infrastructure/server/apiGuards';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    await requireAdminSession();
    const { userId } = await params;
    const summary = await ticketRepository.getCustomerSupportSummary(userId);
    return NextResponse.json(summary);
  } catch (err) {
    return jsonError(err, 'Failed to fetch customer summary');
  }
}
