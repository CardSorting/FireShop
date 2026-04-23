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

// BroccoliQ Level 9: Final Sovereign Flush (Graceful Shutdown Registry)
const shutdownHooks: (() => Promise<void>)[] = [];

export function registerShutdownHook(hook: () => Promise<void>) {
  shutdownHooks.push(hook);
}

let hooksRegistered = false;
function ensureHooksRegistered() {
  if (hooksRegistered) return;
  hooksRegistered = true;

  // Node.js graceful shutdown
  if (typeof process !== 'undefined' && process.on) {
    const handleShutdown = async () => {
      console.log('[Hive] Initiating Level 9 Final Sovereign Flush (Shutdown)...');
      for (const hook of shutdownHooks) {
        try {
          await hook();
        } catch (e) {
          console.error('[Hive] Shutdown hook failed:', e);
        }
      }
      process.exit(0);
    };
    process.on('SIGTERM', handleShutdown);
    process.on('SIGINT', handleShutdown);
  }

  // Browser graceful shutdown fallback
  if (typeof window !== 'undefined' && window.addEventListener) {
    window.addEventListener('beforeunload', () => {
      shutdownHooks.forEach(hook => hook().catch(() => {}));
    });
  }
}

import { IntegrityWorker } from './sqlite/IntegrityWorker';

/**
 * Initialize the selected database if necessary
 */
export async function initializeSelectedDB() {
  const provider = getSelectedProvider();
  if (provider === 'sqlite') {
    ensureHooksRegistered();
    await initDatabase();
    
    // BroccoliQ Learning: Start the background integrity worker
    const worker = new IntegrityWorker();
    worker.start(60000); // run every 60 seconds
    
    // Register worker shutdown hook
    registerShutdownHook(async () => {
      worker.stop();
    });
  }
}
