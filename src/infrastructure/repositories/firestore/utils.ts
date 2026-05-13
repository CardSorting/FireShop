/**
 * [LAYER: INFRASTRUCTURE]
 * Firestore Repository Utilities
 */
import { Timestamp } from '../../firebase/bridge';

/**
 * Robustly converts a Firestore value (Timestamp, Date, String, or Object) to a JS Date.
 * Handles mismatches between Web SDK and Admin SDK Timestamp implementations.
 */
export function mapTimestamp(ts: any): Date {
  if (!ts) return new Date();
  
  // 1. Check for .toDate() method (standard for all Firestore Timestamp versions)
  if (typeof ts.toDate === 'function') {
    try {
      return ts.toDate();
    } catch (e) {
      // Fall through if toDate fails for some reason
    }
  }

  // 2. Handle Admin SDK Timestamp shape: { _seconds, _nanoseconds }
  if (ts && typeof ts === 'object' && ts._seconds !== undefined) {
    return new Date(ts._seconds * 1000 + (ts._nanoseconds || 0) / 1000000);
  }

  // 3. Handle standard JS Date instances
  if (ts instanceof Date) {
    return ts;
  }

  // 4. Handle ISO strings or numeric timestamps
  if (typeof ts === 'string' || typeof ts === 'number') {
    const d = new Date(ts);
    return isNaN(d.getTime()) ? new Date() : d;
  }

  // 5. Ultimate Fallback
  return new Date();
}

/**
 * Common document mapper for Firestore entities
 */
export function mapDoc<T>(id: string, data: any): T {
  const result: any = { ...data, id };
  
  // Recursively revive common date fields
  const dateFields = ['createdAt', 'updatedAt', 'joined', 'lastOrder', 'startsAt', 'endsAt', 'expectedAt', 'estimatedDeliveryDate', 'at'];
  
  for (const field of dateFields) {
    if (result[field]) {
      result[field] = mapTimestamp(result[field]);
    }
  }

  // Handle nested arrays recursively
  if (Array.isArray(result.variants)) {
    result.variants = result.variants.map((v: any) => mapDoc(v.id || '', v));
  }
  if (Array.isArray(result.media)) {
    result.media = result.media.map((m: any) => mapDoc(m.id || '', m));
  }
  if (Array.isArray(result.items)) {
    result.items = result.items.map((i: any) => mapDoc(i.id || '', i));
  }
  if (Array.isArray(result.digitalAssets)) {
    result.digitalAssets = result.digitalAssets.map((a: any) => mapDoc(a.id || '', a));
  }

  return result as T;
}
