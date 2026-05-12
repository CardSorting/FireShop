/**
 * [LAYER: INFRASTRUCTURE]
 * Unified Firebase Bridge
 * 
 * Automatically switches between Client SDK (Browser) and Admin SDK (Server).
 * Resolves gRPC "Listen" stream errors and connectivity issues in Node.js environments.
 */
import * as client from 'firebase/firestore';
import { adminDb, Timestamp as AdminTimestamp, FieldValue as AdminFieldValue } from './admin';
import { getDb as getClientDb } from './firebase';
import { logger } from '@utils/logger';

const isServer = typeof window === 'undefined';
const DEFAULT_RETRY_OPTIONS = {
  maxAttempts: 5,
  initialDelayMs: 300,
  maxDelayMs: 5000,
};

const READ_RETRY_OPTIONS = {
  ...DEFAULT_RETRY_OPTIONS,
  timeoutMs: 15000,
};

const TRANSIENT_FIRESTORE_CODES = new Set<any>([
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
  'firestore/cancelled',
  'firestore/deadline-exceeded',
  'firestore/resource-exhausted',
  'firestore/aborted',
  'firestore/internal',
  'firestore/unavailable',
]);

type RetryOptions = {
  maxAttempts: number;
  initialDelayMs: number;
  maxDelayMs: number;
  timeoutMs?: number;
  operationName?: string;
};

/**
 * Returns the appropriate Firestore instance based on the environment.
 */
export function getUnifiedDb() {
  return isServer ? adminDb : getClientDb();
}

/**
 * Environment-aware 'collection' helper
 */
export function collection(db: any, path: string) {
  return isServer ? db.collection(path) : client.collection(db, path);
}

/**
 * Environment-aware 'doc' helper
 */
export function doc(db: any, path: string, ...pathSegments: string[]) {
  if (isServer) {
    return db.doc(path + (pathSegments.length > 0 ? '/' + pathSegments.join('/') : ''));
  }
  return client.doc(db, path, ...pathSegments);
}

/**
 * Environment-aware 'getDoc' helper
 */
export async function getDoc(docRef: any) {
  return withRetry(async () => {
    if (isServer) {
      const snapshot = await docRef.get();
      return {
        id: snapshot.id,
        exists: () => snapshot.exists,
        data: () => snapshot.data() as any,
        __native: snapshot
      };
    }
    const snap = await client.getDoc(docRef);
    return {
      id: snap.id,
      exists: () => snap.exists(),
      data: () => snap.data() as any,
      __native: snap
    };
  }, { ...READ_RETRY_OPTIONS, operationName: 'getDoc' });
}

/**
 * Exponential backoff retry helper for transient network failures.
 */
export function isTransientFirestoreError(err: any): boolean {
  const code = err?.code || err?.status;
  const message = typeof err?.message === 'string' ? err.message : '';
  return TRANSIENT_FIRESTORE_CODES.has(code) || /ECONNRESET|ETIMEDOUT|EAI_AGAIN|ENOTFOUND|socket hang up|RST_STREAM|GOAWAY|UNAVAILABLE|DEADLINE_EXCEEDED|Listen stream/i.test(message);
}

function getRetryDelayMs(attempt: number, options: RetryOptions): number {
  const exponentialDelay = Math.min(options.initialDelayMs * 2 ** attempt, options.maxDelayMs);
  return exponentialDelay + Math.floor(Math.random() * Math.min(500, exponentialDelay));
}

function withDeadline<T>(promise: Promise<T>, timeoutMs: number, operationName?: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;

  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      const error = new Error(`Firestore operation timed out after ${timeoutMs}ms`);
      (error as any).code = 'deadline-exceeded';
      (error as any).operationName = operationName;
      reject(error);
    }, timeoutMs);
  });

  return Promise.race([promise, timeout]).finally(() => {
    if (timer) clearTimeout(timer);
  });
}

async function recoverClientNetwork(operationName?: string): Promise<void> {
  if (isServer) return;
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return;

  try {
    await client.enableNetwork(getClientDb());
  } catch (error: any) {
    logger.warn('Firestore client network recovery failed', {
      operationName,
      code: error?.code,
      message: error?.message,
    });
  }
}

async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = DEFAULT_RETRY_OPTIONS
): Promise<T> {
  let lastError: any;
  for (let i = 0; i < options.maxAttempts; i++) {
    try {
      const promise = fn();
      return await (options.timeoutMs ? withDeadline(promise, options.timeoutMs, options.operationName) : promise);
    } catch (err: any) {
      lastError = err;
      const code = err.code || err.status;
      const isTransient = isTransientFirestoreError(err);
      
      if (!isTransient || i === options.maxAttempts - 1) throw err;

      await recoverClientNetwork(options.operationName);
      const delay = getRetryDelayMs(i, options);
      logger.warn('Transient Firestore error; retrying operation', {
        operationName: options.operationName,
        code,
        attempt: i + 1,
        maxAttempts: options.maxAttempts,
        delay,
      });
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw lastError;
}

/**
 * Environment-aware 'getDocs' helper
 */
export async function getDocs(query: any) {
  return withRetry(async () => {
    if (isServer) {
      const snapshot = await query.get();
      const docs = snapshot.docs.map((d: any) => ({
        id: d.id,
        data: () => d.data() as any,
        __native: d
      }));
      return {
        docs,
        empty: snapshot.empty,
        size: snapshot.size,
        forEach: (callback: (d: any) => void) => docs.forEach(callback),
      };
    }
    const snapshot = await client.getDocs(query);
    const docs = snapshot.docs.map((d: any) => ({
      id: d.id,
      data: () => d.data() as any,
      __native: d
    }));
    return {
      docs,
      empty: snapshot.empty,
      size: snapshot.size,
      forEach: (callback: (d: any) => void) => docs.forEach(callback),
    };
  }, { ...READ_RETRY_OPTIONS, operationName: 'getDocs' });
}

/**
 * Environment-aware 'getCount' helper (Aggregations)
 */
export async function getCount(query: any) {
  return withRetry(async () => {
    if (isServer) {
      const snapshot = await query.count().get();
      return snapshot.data().count;
    }
    const snapshot = await client.getCountFromServer(query);
    return snapshot.data().count;
  }, { ...READ_RETRY_OPTIONS, operationName: 'getCount' });
}

/**
 * Environment-aware 'setDoc' helper
 */
export async function setDoc(docRef: any, data: any, options?: any) {
  return withRetry(() => {
    if (isServer) {
      return docRef.set(data, options);
    }
    return client.setDoc(docRef, data, options);
  }, { ...DEFAULT_RETRY_OPTIONS, operationName: 'setDoc' });
}

/**
 * Environment-aware 'updateDoc' helper
 */
export async function updateDoc(docRef: any, data: any) {
  return withRetry(() => {
    if (isServer) {
      return docRef.update(data);
    }
    return client.updateDoc(docRef, data);
  }, { ...DEFAULT_RETRY_OPTIONS, operationName: 'updateDoc' });
}

/**
 * Environment-aware 'deleteDoc' helper
 */
export async function deleteDoc(docRef: any) {
  return withRetry(() => {
    if (isServer) {
      return docRef.delete();
    }
    return client.deleteDoc(docRef);
  }, { ...DEFAULT_RETRY_OPTIONS, operationName: 'deleteDoc' });
}

/**
 * Environment-aware 'query' helper
 */
export function query(collectionRef: any, ...queryConstraints: any[]) {
  if (isServer) {
    let q = collectionRef;
    for (const constraint of queryConstraints) {
      q = constraint(q);
    }
    return q;
  }
  return client.query(collectionRef, ...queryConstraints);
}

/**
 * Environment-aware 'where' helper
 */
export function where(field: string, op: any, value: any) {
  if (isServer) {
    return (q: any) => q.where(field, op, value);
  }
  return client.where(field, op, value);
}

/**
 * Environment-aware 'orderBy' helper
 */
export function orderBy(field: string, direction: 'asc' | 'desc' = 'asc') {
  if (isServer) {
    return (q: any) => q.orderBy(field, direction);
  }
  return client.orderBy(field, direction);
}

/**
 * Environment-aware 'limit' helper
 */
export function limit(n: number) {
  if (isServer) {
    return (q: any) => q.limit(n);
  }
  return client.limit(n);
}

/**
 * Environment-aware 'startAfter' helper
 */
export function startAfter(snapshot: any) {
  if (isServer) {
    return (q: any) => q.startAfter(snapshot.__native || snapshot);
  }
  return client.startAfter(snapshot.__native || snapshot);
}

/**
 * Environment-aware 'runTransaction' helper
 */
export async function runTransaction(db: any, updateFunction: (transaction: any) => Promise<any>) {
  return withRetry(async () => {
    if (isServer) {
      return db.runTransaction(async (t: any) => {
        const transactionShim = {
          get: async (ref: any) => {
            const snapshot = await t.get(ref);
            return {
              id: snapshot.id,
              exists: () => snapshot.exists,
              data: () => snapshot.data() as any,
            };
          },
          set: (ref: any, data: any) => t.set(ref, data),
          update: (ref: any, data: any) => t.update(ref, data),
          delete: (ref: any) => t.delete(ref),
        };
        return updateFunction(transactionShim);
      });
    }
    return client.runTransaction(db, async (t) => {
      const transactionShim = {
        get: async (ref: any) => {
          const snap = await t.get(ref);
          return {
            id: snap.id,
            exists: () => snap.exists(),
            data: () => snap.data() as any,
          };
        },
        set: (ref: any, data: any) => t.set(ref, data),
        update: (ref: any, data: any) => t.update(ref, data),
        delete: (ref: any) => t.delete(ref),
      };
      return updateFunction(transactionShim);
    });
  }, { ...DEFAULT_RETRY_OPTIONS, operationName: 'runTransaction' });
}

/**
 * Environment-aware 'writeBatch' helper
 */
export function writeBatch(db: any) {
  if (isServer) {
    const batch = db.batch();
    return {
      set: (ref: any, data: any) => batch.set(ref, data),
      update: (ref: any, data: any) => batch.update(ref, data),
      delete: (ref: any) => batch.delete(ref),
      commit: () => withRetry(() => batch.commit(), { ...DEFAULT_RETRY_OPTIONS, operationName: 'writeBatch.commit' }),
    };
  }
  const batch = client.writeBatch(db);
  return {
    set: (ref: any, data: any) => batch.set(ref, data),
    update: (ref: any, data: any) => batch.update(ref, data),
    delete: (ref: any) => batch.delete(ref),
    commit: () => withRetry(() => batch.commit(), { ...DEFAULT_RETRY_OPTIONS, operationName: 'writeBatch.commit' }),
  };
}

/**
 * Environment-aware 'increment' helper
 */
export function increment(n: number) {
  if (isServer) {
    return AdminFieldValue.increment(n);
  }
  return client.increment(n);
}

/**
 * Environment-aware 'arrayUnion' helper
 */
export function arrayUnion(...elements: any[]) {
  if (isServer) {
    return AdminFieldValue.arrayUnion(...elements);
  }
  return client.arrayUnion(...elements);
}

/**
 * Environment-aware 'arrayRemove' helper
 */
export function arrayRemove(...elements: any[]) {
  if (isServer) {
    return AdminFieldValue.arrayRemove(...elements);
  }
  return client.arrayRemove(...elements);
}

/**
 * Environment-aware 'serverTimestamp' helper
 */
export function serverTimestamp() {
  if (isServer) {
    return AdminFieldValue.serverTimestamp();
  }
  return client.serverTimestamp();
}

export const Timestamp = isServer 
  ? AdminTimestamp
  : client.Timestamp;

export type Timestamp = InstanceType<typeof AdminTimestamp> | client.Timestamp;
export type DocumentData = client.DocumentData;
export type QueryDocumentSnapshot = client.QueryDocumentSnapshot;
export type Transaction = client.Transaction;
