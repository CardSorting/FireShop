/**
 * [LAYER: INFRASTRUCTURE]
 * Firebase & Firestore Initialization
 * 
 * Includes robust fallbacks for production environment variables.
 */
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

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

// Initialize Firebase
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

export { app, db, auth, storage };
