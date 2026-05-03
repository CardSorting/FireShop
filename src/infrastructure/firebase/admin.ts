/**
 * [LAYER: INFRASTRUCTURE]
 * Firebase Admin SDK Initialization
 */
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getStorage } from 'firebase-admin/storage';

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

// If we have a service account in environment variables, use it.
// Otherwise, try to use default application credentials.
let app;
if (getApps().length === 0) {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    app = initializeApp({
      credential: cert(serviceAccount),
      projectId,
      storageBucket: `${projectId}.firebasestorage.app`
    });
  } else {
    app = initializeApp({
      projectId,
      storageBucket: `${projectId}.firebasestorage.app`
    });
  }
} else {
  app = getApps()[0];
}

const adminDb = getFirestore(app);
const adminAuth = getAuth(app);
const adminStorage = getStorage(app);

export { adminDb, adminAuth, adminStorage };
