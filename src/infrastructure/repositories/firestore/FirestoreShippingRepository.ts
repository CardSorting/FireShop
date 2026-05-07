/**
 * [LAYER: INFRASTRUCTURE]
 */
import { 
  getUnifiedDb,
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  query, 
  where,
  serverTimestamp,
  type QueryDocumentSnapshot 
} from '../../firebase/bridge';
import type { IShippingRepository } from '@domain/repositories';
import type { ShippingClass, ShippingZone, ShippingRate } from '@domain/models';
import { mapDoc } from './utils';

export class FirestoreShippingRepository implements IShippingRepository {
  private classesCollection = 'shippingClasses';
  private zonesCollection = 'shippingZones';
  private ratesCollection = 'shippingRates';

  private get classesColl() { return collection(getUnifiedDb(), this.classesCollection); }
  private get zonesColl() { return collection(getUnifiedDb(), this.zonesCollection); }
  private get ratesColl() { return collection(getUnifiedDb(), this.ratesCollection); }

  // Classes
  async getAllClasses(): Promise<ShippingClass[]> {
    const snapshot = await getDocs(collection(getUnifiedDb(), this.classesCollection));
    return snapshot.docs.map((d: QueryDocumentSnapshot) => mapDoc<ShippingClass>(d.id, d.data()));
  }

  async getClassById(id: string): Promise<ShippingClass | null> {
    const d = await getDoc(doc(getUnifiedDb(), this.classesCollection, id));
    return d.exists() ? mapDoc<ShippingClass>(d.id, d.data()) : null;
  }

  async saveClass(shippingClass: ShippingClass): Promise<ShippingClass> {
    const data = {
      ...shippingClass,
      updatedAt: serverTimestamp()
    };
    await setDoc(doc(this.classesColl, shippingClass.id), data);
    return shippingClass;
  }

  async deleteClass(id: string): Promise<void> {
    await deleteDoc(doc(this.classesColl, id));
  }

  // Zones
  async getAllZones(): Promise<ShippingZone[]> {
    const snapshot = await getDocs(collection(getUnifiedDb(), this.zonesCollection));
    return snapshot.docs.map((d: QueryDocumentSnapshot) => mapDoc<ShippingZone>(d.id, d.data()));
  }

  async getZoneById(id: string): Promise<ShippingZone | null> {
    const d = await getDoc(doc(getUnifiedDb(), this.zonesCollection, id));
    return d.exists() ? mapDoc<ShippingZone>(d.id, d.data()) : null;
  }

  async saveZone(zone: ShippingZone): Promise<ShippingZone> {
    const data = {
      ...zone,
      updatedAt: serverTimestamp()
    };
    await setDoc(doc(this.zonesColl, zone.id), data);
    return zone;
  }

  async deleteZone(id: string): Promise<void> {
    await deleteDoc(doc(this.zonesColl, id));
  }

  // Rates
  async getRatesByZone(zoneId: string): Promise<ShippingRate[]> {
    const q = query(this.ratesColl, where('shippingZoneId', '==', zoneId));
    const snap = await getDocs(q);
    return snap.docs.map((d: QueryDocumentSnapshot) => mapDoc<ShippingRate>(d.id, d.data()));
  }

  async getRatesByClass(classId: string): Promise<ShippingRate[]> {
    const q = query(this.ratesColl, where('shippingClassId', '==', classId));
    const snap = await getDocs(q);
    return snap.docs.map((d: QueryDocumentSnapshot) => mapDoc<ShippingRate>(d.id, d.data()));
  }

  async saveRate(rate: ShippingRate): Promise<ShippingRate> {
    const data = {
      ...rate,
      updatedAt: serverTimestamp()
    };
    await setDoc(doc(this.ratesColl, rate.id), data);
    return rate;
  }

  async deleteRate(id: string): Promise<void> {
    await deleteDoc(doc(this.ratesColl, id));
  }

  async getAllRates(): Promise<ShippingRate[]> {
    const snapshot = await getDocs(collection(getUnifiedDb(), this.ratesCollection));
    return snapshot.docs.map((d: QueryDocumentSnapshot) => mapDoc<ShippingRate>(d.id, d.data()));
  }
}
