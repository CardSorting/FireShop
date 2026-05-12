import { NextResponse } from 'next/server';
import { ticketRepository } from '@infrastructure/repositories/firestore/FirestoreTicketRepository';
import { jsonError, readJsonObject, requireAdminSession, requireString } from '@infrastructure/server/apiGuards';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminSession(request);
    const { id } = await params;
    const data = await readJsonObject(request);
    await ticketRepository.updateMacro(id, {
      ...(data.name !== undefined ? { name: requireString(data.name, 'name') } : {}),
      ...(data.content !== undefined ? { content: requireString(data.content, 'content') } : {}),
      ...(data.category !== undefined ? { category: requireString(data.category, 'category') } : {}),
      ...(data.slug !== undefined ? { slug: typeof data.slug === 'string' ? data.slug.trim() : undefined } : {}),
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    return jsonError(err, 'Failed to update support macro');
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminSession(request);
    const { id } = await params;
    await ticketRepository.deleteMacro(id);
    return NextResponse.json({ success: true });
  } catch (err) {
    return jsonError(err, 'Failed to delete support macro');
  }
}
