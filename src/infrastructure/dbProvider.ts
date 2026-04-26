/**
 * [LAYER: INFRASTRUCTURE]
 * Database Provider Selection Logic
 */

export type DBProvider = 'sqlite';

import { logger } from '@utils/logger';

export function getSelectedProvider(): DBProvider {
  return 'sqlite';
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
      logger.info('[Hive] Initiating Level 9 Final Sovereign Flush (Shutdown)...');
      for (const hook of shutdownHooks) {
        try {
          await hook();
        } catch (e) {
          logger.error('[Hive] Shutdown hook failed.', e);
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
      shutdownHooks.forEach(hook => hook().catch(() => { }));
    });
  }
}

/**
 * Initialize the selected database if necessary
 */
export async function initializeSelectedDB() {
  const provider = getSelectedProvider();
  if (provider === 'sqlite') {
    const [{ initDatabase }, { IntegrityWorker }] = await Promise.all([
      import('./sqlite/database'),
      import('./sqlite/IntegrityWorker'),
    ]);
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
