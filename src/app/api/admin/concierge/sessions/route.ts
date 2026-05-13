import { NextRequest, NextResponse } from 'next/server';
import { getUnifiedDb, collection, query, orderBy, limit, getDocs, doc, getDoc } from '@infrastructure/firebase/bridge';
import { logger } from '@utils/logger';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const db = getUnifiedDb();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (id) {
      const docRef = doc(db, 'conciergeSessions', id);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        return NextResponse.json({ error: 'Session not found' }, { status: 404 });
      }
      const data = docSnap.data();
      return NextResponse.json({
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
      });
    }

    const sessionsRef = collection(db, 'conciergeSessions');
    const q = query(sessionsRef, orderBy('createdAt', 'desc'), limit(50));
    const querySnapshot = await getDocs(q);

    const sessions = querySnapshot.docs.map((d: any) => {
      const data = d.data();
      return {
        id: d.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
      };
    });

    return NextResponse.json(sessions);
  } catch (error: any) {
    logger.error('Failed to fetch Concierge sessions', { error: error.message });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
