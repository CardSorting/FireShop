/**
 * [LAYER: INFRASTRUCTURE]
 * Database Provider Selection Logic
 */
import { initDatabase } from './sqlite/database';

export type DBProvider = 'firebase' | 'sqlite';

export function getSelectedProvider(): DBProvider {
  // Explicit override via environment variable takes precedence
  const override = import.meta.env.VITE_DB_PROVIDER as DBProvider;
  if (override === 'firebase' || override === 'sqlite') {
    return override;
  }

  // Fallback to checking if Firebase is configured
  const hasFirebase = 
    import.meta.env.VITE_FIREBASE_API_KEY && 
    import.meta.env.VITE_FIREBASE_PROJECT_ID;

  return hasFirebase ? 'firebase' : 'sqlite';
}

/**
 * Initialize the selected database if necessary
 */
export async function initializeSelectedDB() {
  const provider = getSelectedProvider();
  if (provider === 'sqlite') {
    await initDatabase();
  }
}
