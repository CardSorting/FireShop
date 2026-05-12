/**
 * [LAYER: INFRASTRUCTURE]
 * Firebase Admin SDK Initialization
 */
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, initializeFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getStorage } from 'firebase-admin/storage';
import { logger } from '@utils/logger';

const PROD_PROJECT_ID = "shopmore-1e34b";
const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || PROD_PROJECT_ID;

// Internal lazy instances
let _app: any;
let _db: any;
let _auth: any;
let _storage: any;

const TRANSIENT_ADMIN_CODES = new Set<any>([
  1,
  2,
  4,
  8,
  10,
  13,
  14,
  'cancelled',
  'unknown',
  'deadline-exceeded',
  'resource-exhausted',
  'aborted',
  'internal',
  'unavailable',
]);

function isTransientAdminFirestoreError(error: any): boolean {
  const code = error?.code ?? error?.status;
  const message = typeof error?.message === 'string' ? error.message : '';

  return TRANSIENT_ADMIN_CODES.has(code) || /ECONNRESET|ETIMEDOUT|EAI_AGAIN|ENOTFOUND|socket hang up|RST_STREAM|GOAWAY|UNAVAILABLE|DEADLINE_EXCEEDED/i.test(message);
}

function retryDelayMs(attempt: number): number {
  const base = Math.min(300 * 2 ** attempt, 5000);
  return base + Math.floor(Math.random() * Math.min(base, 500));
}

export async function withAdminFirestoreRetry<T>(
  operation: () => Promise<T>,
  options: { operationName?: string; maxAttempts?: number } = {}
): Promise<T> {
  const maxAttempts = options.maxAttempts ?? 5;
  let lastError: any;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      if (!isTransientAdminFirestoreError(error) || attempt === maxAttempts - 1) {
        throw error;
      }

      const delay = retryDelayMs(attempt);
      logger.warn('Transient Admin Firestore error; retrying operation', {
        operationName: options.operationName,
        code: error?.code ?? error?.status,
        attempt: attempt + 1,
        maxAttempts,
        delay,
      });
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

function shouldPreferRestTransport(): boolean {
  return process.env.FIRESTORE_PREFER_REST !== 'false';
}

function getAdminApp() {
  if (!_app) {
    const apps = getApps();
    if (apps.length > 0) {
      _app = apps[0];
    } else {
      try {
        const saJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
        if (saJson && saJson !== 'undefined' && saJson.trim() !== '') {
          const serviceAccount = JSON.parse(saJson);
          
          // Fix PEM formatting: some environments escape newlines
          if (serviceAccount.private_key) {
            serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
          }

          _app = initializeApp({
            credential: cert(serviceAccount),
            // IMPORTANT: Force the project ID to the one where the data actually resides.
            // Your service account already has 'Firebase Admin' roles in shopmore-1e34b.
            projectId: projectId,
            storageBucket: `${projectId}.firebasestorage.app`
          });
        } else {
          // Fallback to Application Default Credentials (ADC)
          // Use this for local development by running:
          // gcloud auth application-default login
          _app = initializeApp({
            projectId,
            storageBucket: `${projectId}.firebasestorage.app`
          });
        }
      } catch (err: any) {
        // If we hit a race condition where another request initialized it first
        if (err.code === 'app/duplicate-app') {
          _app = getApps()[0];
        } else {
          throw err;
        }
      }
    }
  }
  return _app;
}

export const adminDb = new Proxy({} as any, {
  get(_, prop) {
    if (!_db) {
      try {
        _db = initializeFirestore(getAdminApp(), {
          ignoreUndefinedProperties: true,
          preferRest: shouldPreferRestTransport(),
        } as any);
      } catch (err: any) {
        if (err?.message?.includes('already been called')) {
          _db = getFirestore(getAdminApp());
        } else {
          throw err;
        }
      }
    }
    const value = (Reflect as any).get(_db, prop);
    return typeof value === 'function' ? value.bind(_db) : value;
  }
});

export const adminAuth = new Proxy({} as any, {
  get(_, prop) {
    if (!_auth) _auth = getAuth(getAdminApp());
    const value = (Reflect as any).get(_auth, prop);
    return typeof value === 'function' ? value.bind(_auth) : value;
  }
});

export const adminStorage = new Proxy({} as any, {
  get(_, prop) {
    if (!_storage) _storage = getStorage(getAdminApp());
    const value = (Reflect as any).get(_storage, prop);
    return typeof value === 'function' ? value.bind(_storage) : value;
  }
});

export { Timestamp, FieldValue } from 'firebase-admin/firestore';
