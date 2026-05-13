import { NextRequest, NextResponse } from 'next/server';
import { conciergeService } from '@core/ConciergeService';
import { logger } from '@utils/logger';
import { getUnifiedDb, doc, getDoc } from '@infrastructure/firebase/bridge';
// import { doc, getDoc } from 'firebase/firestore';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { sessionId } = await req.json();

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    const db = getUnifiedDb();
    const sessionDoc = await getDoc(doc(db, 'conciergeSessions', sessionId));

    if (!sessionDoc.exists()) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const sessionData = sessionDoc.data();
    const transcript = sessionData.transcript || [];

    const result = await conciergeService.analyzeSession(sessionId, transcript);

    return NextResponse.json(result);
  } catch (error: any) {
    logger.error('Failed to trigger session analysis', { error: error.message });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
