import { NextResponse } from 'next/server';
import { getSessionUser } from '@infrastructure/server/session';

export async function GET() {
    return NextResponse.json(await getSessionUser());
}
