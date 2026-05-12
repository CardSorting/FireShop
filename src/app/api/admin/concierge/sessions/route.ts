import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@infrastructure/firebase/firebase';
import { collection, query, orderBy, limit, getDocs, doc, getDoc } from 'firebase/firestore';
import { logger } from '@utils/logger';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (id) {
      const docRef = doc(db, 'conciergeSessions', id);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        return NextResponse.json({ error: 'Session not found' }, { status: 404 });
      }
      return NextResponse.json({
        id: docSnap.id,
        ...docSnap.data(),
        createdAt: docSnap.data().createdAt?.toDate()?.toISOString(),
        updatedAt: docSnap.data().updatedAt?.toDate()?.toISOString(),
      });
    }

    const sessionsRef = collection(db, 'conciergeSessions');
    const q = query(sessionsRef, orderBy('createdAt', 'desc'), limit(50));
    const querySnapshot = await getDocs(q);

    const sessions = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate()?.toISOString(),
      updatedAt: doc.data().updatedAt?.toDate()?.toISOString(),
    }));

    return NextResponse.json(sessions);
  } catch (error: any) {
    logger.error('Failed to fetch Concierge sessions', { error: error.message });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
