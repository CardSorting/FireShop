import { NextResponse } from 'next/server';
import { ticketRepository } from '@infrastructure/repositories/firestore/FirestoreTicketRepository';
import { jsonError, readJsonObject, requireAdminSession, requireString } from '@infrastructure/server/apiGuards';
import { sanitizeHtml } from '@utils/sanitizer';

export async function GET(req: Request) {
  try {
    await requireAdminSession(req);
    const macros = await ticketRepository.getMacros();
    return NextResponse.json(macros);
  } catch (err) {
    return jsonError(err, 'Failed to load support macros');
  }
}

export async function POST(req: Request) {
  try {
    await requireAdminSession(req);
    const data = await readJsonObject(req);
    await ticketRepository.addMacro({
      name: requireString(data.name, 'name'),
      content: sanitizeHtml(requireString(data.content, 'content')),
      category: requireString(data.category, 'category'),
      slug: typeof data.slug === 'string' && data.slug.trim() ? data.slug.trim() : undefined,
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    return jsonError(err, 'Failed to save support macro');
  }
}
