import { NextResponse } from 'next/server';
import { ticketRepository } from '@infrastructure/repositories/ticketRepository';

export async function GET() {
  try {
    const macros = await ticketRepository.getMacros();
    return NextResponse.json(macros);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    await ticketRepository.addMacro(data);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
