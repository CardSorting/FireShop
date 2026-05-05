/**
 * [LAYER: INFRASTRUCTURE]
 * Firebase Admin SDK Initialization
 */
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getStorage } from 'firebase-admin/storage';

const PROD_PROJECT_ID = "shopmore-1e34b";
const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || PROD_PROJECT_ID;

// Internal lazy instances
let _app: any;
let _db: any;
let _auth: any;
let _storage: any;

function getAdminApp() {
  if (!_app) {
    if (getApps().length > 0) {
      _app = getApps()[0];
    } else {
      if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
        _app = initializeApp({
          credential: cert(serviceAccount),
          projectId,
          storageBucket: `${projectId}.firebasestorage.app`
        });
      } else {
        _app = initializeApp({
          projectId,
          storageBucket: `${projectId}.firebasestorage.app`
        });
      }
    }
  }
  return _app;
}

export const adminDb = new Proxy({} as any, {
  get(_, prop) {
    if (!_db) _db = getFirestore(getAdminApp());
    return (Reflect as any).get(_db, prop);
  }
});

export const adminAuth = new Proxy({} as any, {
  get(_, prop) {
    if (!_auth) _auth = getAuth(getAdminApp());
    return (Reflect as any).get(_auth, prop);
  }
});

export const adminStorage = new Proxy({} as any, {
  get(_, prop) {
    if (!_storage) _storage = getStorage(getAdminApp());
    return (Reflect as any).get(_storage, prop);
  }
});

export { Timestamp, FieldValue } from 'firebase-admin/firestore';
