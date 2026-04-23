/**
 * [LAYER: INFRASTRUCTURE]
 * BroccoliQ Level 5: Sovereign Locking Implementation
 * 
 * Provides global, cross-process mutual exclusion via direct database locking.
 */
import { Kysely } from 'kysely';
import { AsyncLocalStorage } from 'node:async_hooks';
import * as crypto from 'node:crypto';
import { getSQLiteDB } from './database';
import type { Database } from './schema';

// BroccoliDB Level 5: Re-entrant Memory Mutex (0ms IO Overhead)
const mutexLocalStorage = new AsyncLocalStorage<string>();

class Mutex {
  private queue: { resolve: (release: () => void) => void; holderId: string; timestamp: number }[] = [];
  private locked = false;
  private currentHolderId: string | null = null;

  constructor(public name: string, private timeoutMs: number = 30000) {}

  async acquire(): Promise<() => void> {
    const callerId = mutexLocalStorage.getStore() || crypto.randomUUID();
    const timestamp = Date.now();

    if (this.locked && this.currentHolderId === callerId) {
      return () => {}; // Re-entrant no-op
    }

    if (!this.locked) {
      this.locked = true;
      this.currentHolderId = callerId;
      return () => this.release();
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        const idx = this.queue.findIndex(i => i.resolve === resolve);
        if (idx !== undefined && idx >= 0) {
            this.queue.splice(idx, 1);
            reject(new Error(`[Hive] Mutex ${this.name} acquisition timeout. Possible deadlock.`));
        }
      }, this.timeoutMs);

      this.queue.push({ 
          resolve: (releaseFn) => {
              clearTimeout(timeout);
              resolve(releaseFn);
          }, 
          holderId: callerId,
          timestamp 
      });
    });
  }

  private release() {
    const next = this.queue.shift();
    if (next) {
      this.currentHolderId = next.holderId;
      next.resolve(() => this.release());
    } else {
      this.locked = false;
      this.currentHolderId = null;
    }
  }

  async runLocked<T>(callback: () => Promise<T>): Promise<T> {
    const release = await this.acquire();
    try {
      return await mutexLocalStorage.run(this.currentHolderId!, callback);
    } finally {
      release();
    }
  }
}

export class SovereignLocker {
  private db: Kysely<Database>;
  private memoryLocks = new Map<string, Mutex>();
  private activeReleases = new Map<string, () => void>();

  constructor() {
    this.db = getSQLiteDB();
  }

  /**
   * Attempt to acquire a global lock on a specific resource.
   * Utilizes a fast memory-first Mutex queue to prevent DB spam, 
   * followed by physical DB verification.
   * 
   * @param resourceId The ID of the resource to lock
   * @param owner The agent/process claiming the lock
   * @param ttlMs Time to live in milliseconds before the lock expires
   * @returns true if lock acquired, false if already locked by another process
   */
  async acquireLock(resourceId: string, owner: string, ttlMs: number = 30000): Promise<boolean> {
    // 1. Acquire RAM-speed Mutex (queues requests from same process)
    let mutex = this.memoryLocks.get(resourceId);
    if (!mutex) {
      mutex = new Mutex(resourceId, ttlMs);
      this.memoryLocks.set(resourceId, mutex);
    }
    
    let releaseFn: (() => void) | null = null;
    try {
      releaseFn = await mutex.acquire(); // Blocks if another request in this process is holding it
    } catch (err) {
      return false; // Timeout
    }
    const nowMs = Date.now();
    const nowIso = new Date(nowMs).toISOString();
    const expiresAtIso = new Date(nowMs + ttlMs).toISOString();

    // Clear expired lock if it exists
    await this.db
      .deleteFrom('hive_claims')
      .where('id', '=', resourceId)
      .where('expiresAt', '<', nowIso)
      .execute();

    try {
      // Attempt to insert the lock. If it fails, someone else owns it and it hasn't expired.
      // SQLite will throw a constraint error if the id already exists.
      await this.db
        .insertInto('hive_claims')
        .values({
          id: resourceId,
          owner: owner,
          expiresAt: expiresAtIso,
          createdAt: nowIso,
        })
        .execute();
        
      this.activeReleases.set(`${resourceId}:${owner}`, releaseFn);
      return true;
    } catch (err: any) {
      if (releaseFn) releaseFn(); // Release RAM lock if DB lock fails
      
      // UNIQUE constraint failed
      if (err.message && err.message.includes('UNIQUE')) {
        return false;
      }
      throw err;
    }
  }

  /**
   * Release a previously acquired lock, both in DB and RAM.
   */
  async releaseLock(resourceId: string, owner: string): Promise<void> {
    // 1. Release physical DB lock
    await this.db
      .deleteFrom('hive_claims')
      .where('id', '=', resourceId)
      .where('owner', '=', owner)
      .execute();
      
    // 2. Release RAM Mutex
    const releaseKey = `${resourceId}:${owner}`;
    const releaseFn = this.activeReleases.get(releaseKey);
    if (releaseFn) {
      releaseFn();
      this.activeReleases.delete(releaseKey);
    }
  }
}
