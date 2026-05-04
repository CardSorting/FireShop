/**
 * [LAYER: INFRASTRUCTURE]
 * Unified Firebase Bridge
 * 
 * Automatically switches between Client SDK (Browser) and Admin SDK (Server).
 * Resolves gRPC "Listen" stream errors and connectivity issues in Node.js environments.
 */
import * as client from 'firebase/firestore';
import { adminDb } from './admin';
import { getDb as getClientDb } from './firebase';

const isServer = typeof window === 'undefined';

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
  if (isServer) {
    const snapshot = await docRef.get();
    return {
      id: snapshot.id,
      exists: () => snapshot.exists,
      data: () => snapshot.data() as any,
    };
  }
  const snap = await client.getDoc(docRef);
  return {
    id: snap.id,
    exists: () => snap.exists(),
    data: () => snap.data() as any,
  };
}

/**
 * Environment-aware 'getDocs' helper
 */
export async function getDocs(query: any) {
  if (isServer) {
    const snapshot = await query.get();
    const docs = snapshot.docs.map((d: any) => ({
      id: d.id,
      data: () => d.data() as any,
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
  }));
  return {
    docs,
    empty: snapshot.empty,
    size: snapshot.size,
    forEach: (callback: (d: any) => void) => docs.forEach(callback),
  };
}

/**
 * Environment-aware 'setDoc' helper
 */
export async function setDoc(docRef: any, data: any, options?: any) {
  if (isServer) {
    return docRef.set(data, options);
  }
  return client.setDoc(docRef, data, options);
}

/**
 * Environment-aware 'updateDoc' helper
 */
export async function updateDoc(docRef: any, data: any) {
  if (isServer) {
    return docRef.update(data);
  }
  return client.updateDoc(docRef, data);
}

/**
 * Environment-aware 'deleteDoc' helper
 */
export async function deleteDoc(docRef: any) {
  if (isServer) {
    return docRef.delete();
  }
  return client.deleteDoc(docRef);
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
    return (q: any) => q.startAfter(snapshot);
  }
  return client.startAfter(snapshot);
}

/**
 * Environment-aware 'runTransaction' helper
 */
export async function runTransaction(db: any, updateFunction: (transaction: any) => Promise<any>) {
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
      commit: () => batch.commit(),
    };
  }
  return client.writeBatch(db);
}

export const Timestamp = client.Timestamp;
export type DocumentData = client.DocumentData;
export type QueryDocumentSnapshot = client.QueryDocumentSnapshot;
export type Transaction = client.Transaction;
