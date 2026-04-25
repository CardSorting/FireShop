/**
 * [LAYER: INFRASTRUCTURE]
 * 
 * Firebase Configuration
 * 
 * SECURITY NOTES:
 * - Never commit real Firebase configuration to version control
 * - .env files are gitignored for security
 * - Override this file with .env.local for local development with your credentials
 * - This file should only contain environment variables or public configuration
 */

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, enableMultiTabIndexedDbPersistence } from 'firebase/firestore';
import { logger } from '@utils/logger';

// Firebase configuration accessed from environment variables
// These variables are populated from .env (or .env.local for development)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
};

// Validate configuration before initialization
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  logger.error('Firebase configuration is missing. Please check your .env file.');
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Enable offline persistence
enableMultiTabIndexedDbPersistence(db).catch((err) => {
  if (err.code !== 'failed-precondition') {
    logger.warn('Firestore persistence error.', err);
  }
});