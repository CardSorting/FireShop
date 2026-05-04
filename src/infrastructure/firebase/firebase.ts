/**
 * [LAYER: INFRASTRUCTURE]
 * Firebase & Firestore Initialization
 * 
 * Includes robust fallbacks for production environment variables.
 */
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, initializeFirestore } from 'firebase/firestore';
import { getAuth as getAuthSDK } from 'firebase/auth';
import { getStorage as getStorageSDK } from 'firebase/storage';

// Production constants for robust fallback
const PROD_CONFIG = {
  apiKey: "AIzaSyA8EX2LF37WFAd6T6wHVveksfiwosJtpxg",
  authDomain: "shopmore-1e34b.firebaseapp.com",
  projectId: "shopmore-1e34b",
  storageBucket: "shopmore-1e34b.firebasestorage.app",
  messagingSenderId: "816473359074",
  appId: "1:816473359074:web:cc920bbf1fba7b46cf54bb"
};

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || PROD_CONFIG.apiKey,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || PROD_CONFIG.authDomain,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || PROD_CONFIG.projectId,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || PROD_CONFIG.storageBucket,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || PROD_CONFIG.messagingSenderId,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || PROD_CONFIG.appId,
};

// Internal lazy instances
let _app: any;
let _db: any;
let _auth: any;
let _storage: any;

function getFirebaseApp() {
  if (!_app) {
    _app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  }
  return _app;
}

export function getDb() {
  if (!_db) {
    const app = getFirebaseApp();
    if (typeof window === 'undefined') {
      // Force long polling on the server to prevent gRPC connection issues
      _db = initializeFirestore(app, {
        experimentalForceLongPolling: true,
      });
    } else {
      _db = getFirestore(app);
    }
  }
  return _db;
}

export function getAuth() {
  if (!_auth) _auth = getAuthSDK(getFirebaseApp());
  return _auth;
}

export function getStorage() {
  if (!_storage) _storage = getStorageSDK(getFirebaseApp());
  return _storage;
}

// Keep the old exports for compatibility but they are now EAGER to avoid Proxy issues
// However, we should gradually migrate to the getters.
// For now, to fix the build, we make them getters where possible or just keep them as is
// but we will update the repositories to use getDb().
export const db = typeof window !== 'undefined' ? getDb() : {} as any;
export const auth = typeof window !== 'undefined' ? getAuth() : {} as any;
export const storage = typeof window !== 'undefined' ? getStorage() : {} as any;

export { getFirebaseApp as app };
