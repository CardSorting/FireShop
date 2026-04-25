/**
 * [LAYER: INFRASTRUCTURE]
 * 
 * Firebase Authentication Adapter
 * 
 * DESIGN PRINCIPLES:
 * - Lazy initializes Firebase only on first use
 * - Implements Domain interface IAuthProvider cleanly
 * - Eliminates NOISE imports between infrastructure layers
 * - Timeout protection for network operations
 * - Graceful degradation for development/testing
 */

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  updateProfile,
  getIdTokenResult,
  type User as FirebaseUser,
  getAuth,
} from 'firebase/auth';
import { initializeApp } from 'firebase/app';
import {
  initializeFirestore,
  getFirestore,
  enableMultiTabIndexedDbPersistence,
} from 'firebase/firestore';
import type { IAuthProvider } from '@domain/repositories';
import type { User } from '@domain/models';
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';
import { logger } from '@utils/logger';

// Lazy-initialized Firebase instances
// These are created only when AuthService calls them
let _firebaseApp: ReturnType<typeof initializeApp> | null = null;
let _authInstance: ReturnType<typeof getAuth> | null = null;
let _dbInstance: ReturnType<typeof getFirestore> | null = null;

/**
 * Initialize Firebase lazily - only when first needed
 * This prevents app from blocking during module load
 */
export function ensureFirebaseInitialized(): Promise<{ auth: Auth, db: Firestore }> {
  return new Promise((resolve, reject) => {
    // If already initialized, return immediately
    if (_authInstance && _dbInstance) {
      resolve({ auth: _authInstance, db: _dbInstance });
      return;
    }

    // If initializing, wait for promise
    if (_firebaseApp) {
      const checkInterval = setInterval(() => {
        if (_authInstance && _dbInstance) {
          clearInterval(checkInterval);
          resolve({ auth: _authInstance, db: _dbInstance });
        }
      }, 100);

      // Timeout after 10 seconds
      setTimeout(() => {
        clearInterval(checkInterval);
        reject(new Error('Firebase initialization timeout'));
      }, 10000);
      return;
    }

    // Initialize Firebase now
    try {
      const firebaseConfig = {
        apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
        authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
        databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || '',
        projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
        storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
        messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
        appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
      };

      if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
        reject(new Error('Firebase configuration missing - check .env file'));
        return;
      }

      _firebaseApp = initializeApp(firebaseConfig);
      _authInstance = getAuth(_firebaseApp);
      _dbInstance = initializeFirestore(_firebaseApp, {
        ignoreUndefinedProperties: true,
      });

      // Enable offline persistence
      enableMultiTabIndexedDbPersistence(_dbInstance).catch((err) => {
        if (err.code !== 'failed-precondition') {
          logger.warn('Firestore persistence error.', err);
        }
      });

      resolve({ auth: _authInstance, db: _dbInstance });
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Convert Firebase user to Domain model
 */
function firebaseUserToDomain(user: FirebaseUser, isAdmin: boolean = false): User {
  return {
    id: user.uid,
    email: user.email ?? '',
    displayName: user.displayName ?? '',
    role: isAdmin ? 'admin' : 'customer',
    createdAt: new Date(user.metadata.creationTime ?? Date.now()),
  };
}

/**
 * Authentication Adapter
 * Implements IAuthProvider while keeping all Firebase dependencies internal
 */
export class AuthAdapter implements IAuthProvider {
  async getCurrentUser(): Promise<User | null> {
    try {
      const { auth } = await ensureFirebaseInitialized();
      const user = auth.currentUser;
      
      if (!user) return null;
      
      const token = await getIdTokenResult(user, true);
      const isAdmin = token.claims.admin === true;
      return firebaseUserToDomain(user, isAdmin);
    } catch (error) {
      logger.error('Error getting current user.', error);
      throw new Error('Failed to authenticate user');
    }
  }

  async signIn(email: string, password: string): Promise<User> {
    try {
      const { auth } = await ensureFirebaseInitialized();
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const token = await getIdTokenResult(cred.user, true);
      const isAdmin = token.claims.admin === true;
      return firebaseUserToDomain(cred.user, isAdmin);
    } catch (error) {
      logger.error('Error signing in.', error);
      throw new Error('Failed to sign in');
    }
  }

  async signUp(email: string, password: string, displayName: string): Promise<User> {
    try {
      const { auth } = await ensureFirebaseInitialized();
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName });
      return firebaseUserToDomain(cred.user, false);
    } catch (error) {
      logger.error('Error signing up.', error);
      throw new Error('Failed to create account');
    }
  }

  async signOut(): Promise<void> {
    try {
      const { auth } = await ensureFirebaseInitialized();
      await firebaseSignOut(auth!);
    } catch (error) {
      logger.error('Error signing out.', error);
      throw new Error('Failed to sign out');
    }
  }

  onAuthStateChanged(callback: (user: User | null) => void): () => void {
    ensureFirebaseInitialized().then(({ auth }) => {
      return firebaseOnAuthStateChanged(auth!, async (fbUser) => {
        if (!fbUser) {
          callback(null);
          return;
        }
        try {
          const token = await getIdTokenResult(fbUser, true);
          const isAdmin = token.claims.admin === true;
          callback(firebaseUserToDomain(fbUser, isAdmin));
        } catch (error) {
          logger.error('Error in auth state change.', error);
          callback(null);
        }
      });
    }).catch((error) => {
      logger.error('Firebase not ready, auth state changes unavailable.', error);
      callback(null);
    });

    // Return cleanup function
    return async () => {
      // Firestore/onAuthStateChanged cleanup is handled by Firebase
      // leaving empty signature to match onAuthStateChanged return type
    };
  }
}