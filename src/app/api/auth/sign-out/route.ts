import { NextResponse } from 'next/server';
import { clearSessionUser } from '@infrastructure/server/session';

export async function POST() {
    await clearSessionUser();
    return NextResponse.json({ ok: true });
}
