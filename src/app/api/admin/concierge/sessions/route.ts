import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@infrastructure/firebase/firebase';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { logger } from '@utils/logger';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    const sessionsRef = collection(db, 'conciergeSessions');
    const q = query(sessionsRef, orderBy('createdAt', 'desc'), limit(50));
    const querySnapshot = await getDocs(q);

    const sessions = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      // Convert Firestore Timestamps to ISO strings for JSON serialization
      createdAt: doc.data().createdAt?.toDate()?.toISOString(),
      updatedAt: doc.data().updatedAt?.toDate()?.toISOString(),
    }));

    return NextResponse.json(sessions);
  } catch (error: any) {
    logger.error('Failed to fetch Concierge sessions', { error: error.message });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
