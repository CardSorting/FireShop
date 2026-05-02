import { NextResponse } from 'next/server';
import { ticketRepository } from '@infrastructure/repositories/ticketRepository';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const data = await req.json();
    const message = {
      id: crypto.randomUUID(),
      ticketId: id,
      senderId: data.senderId || 'customer',
      senderType: data.senderType || 'customer',
      visibility: data.visibility || 'public',
      content: data.content,
      createdAt: new Date(),
    };
    await ticketRepository.addMessage(message);
    return NextResponse.json(message);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
