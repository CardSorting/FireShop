/**
 * [LAYER: INFRASTRUCTURE]
 * 
 * Firebase Initialization Singleton
 * 
 * DESIGN PRINCIPLES:
 * - Centralized database connection management
 * - Singleton pattern prevents multiple Firebase instances
 * - Lazy initialization (created on first use)
 * - Shared across all infrastructure adapters
 * - Eliminates NOISE imports between infrastructure files
 * 
 * ARCHITECTURAL PURPOSE:
 * - Provides single source of truth for Firebase instances
 * - Prevents duplicate database connections
 * - Makes testing easier (can mock this module)
 * - Reduces memory footprint
 */

import {
  Firestore,
} from 'firebase/firestore';
import { collection } from 'firebase/firestore';
import { ensureFirebaseInitialized } from './services/AuthAdapter';

// Singleton instances
// These are created lazily on first use
let _dbInstance: Firestore | null = null;

/**
 * Get the singleton Database instance
 * 
 * IMPORTANT: This should be called once per repository/adapter
 * to ensure we don't create multiple Firebase connections.
 * 
 * @returns {Promise<Firestore>} The initialized Firestore instance
 * @throws {Error} If Firebase is not configured or initialization fails
 */
export async function getDB(): Promise<Firestore> {
  if (_dbInstance) {
    return _dbInstance;
  }

  const { db } = await ensureFirebaseInitialized();
  _dbInstance = db;
  return _dbInstance!;
}

/**
 * Get the singleton Auth instance
 * 
 * This is useful if you need to access Firebase Auth directly
 * without going through AuthAdapter.
 * 
 * @returns {Promise<Auth>} The initialized Auth instance
 */
export async function getAuthClient(): Promise<any> {
  return ensureFirebaseInitialized();
}

/**
 * Clear cached instances (useful for testing)
 * This destroys the singleton and will force re-initialization
 * 
 * WARNING: Only use in testing scenarios. Not safe for production.
 */
export function clearInstances(): void {
  _dbInstance = null;
  // Note: AuthAdapter handles its own cache, separate from this
}

/**
 * Create a Firestore collection reference
 * Helper function to avoid importing Firestore directly
 * 
 * @param {string} path - Collection path (e.g., 'users', 'products')
 * @returns {Promise<CollectionReference>} Collection reference
 */
export async function getCollections(path: string): Promise<any> {
  const db = await getDB();
  return collection(db, path);
}

/**
 * Firestore Data Converter
 * Standard conversion between Firestore and Domain models
 * 
 * Usage in repositories:
 * ```typescript
 * const collectionRef = db.collection('products');
 * const snapshot = await getDocs(collectionRef);
 * snapshot.docs.map((doc) => {
 *   const data = doc.data();
 *   return {
 *     id: doc.id,
 *     ...data,
 *   };
 * });
 * ```
 */
export const convertToFirestore = (
  obj: any
): Record<string, unknown> | any => {
  return obj;
};

export const convertFromFirestore = (
  doc: any
): Record<string, unknown> => doc.data();