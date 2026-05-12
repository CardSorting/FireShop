import { NextResponse } from 'next/server';
import { DEFAULT_CONCIERGE_SETTINGS } from '@domain/concierge/settings';

import { getDb } from '@infrastructure/firebase/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export async function GET() {
  try {
    const db = getDb();
    const settingsRef = doc(db, 'storeSettings', 'concierge');
    const settingsSnap = await getDoc(settingsRef);

    if (settingsSnap.exists()) {
      return NextResponse.json(settingsSnap.data());
    }

    return NextResponse.json(DEFAULT_CONCIERGE_SETTINGS);
  } catch (error) {
    return NextResponse.json(DEFAULT_CONCIERGE_SETTINGS);
  }
}

export async function POST(req: Request) {
  try {
    const db = getDb();
    const settings = await req.json();
    const settingsRef = doc(db, 'storeSettings', 'concierge');
    
    await setDoc(settingsRef, {
      ...settings,
      updatedAt: new Date().toISOString()
    }, { merge: true });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
