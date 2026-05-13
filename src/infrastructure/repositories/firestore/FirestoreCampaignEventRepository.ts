/**
 * [LAYER: INFRASTRUCTURE]
 * Firestore Implementation of Campaign Event Repository
 */
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy,
  limit,
  serverTimestamp,
  getUnifiedDb,
  Timestamp
} from '../../firebase/bridge';
import { logger } from '@utils/logger';
import type { ICampaignEventRepository } from '@domain/repositories';
import type { CampaignEvent } from '@domain/models';
import { mapDoc } from './utils';

export class FirestoreCampaignEventRepository implements ICampaignEventRepository {
  private readonly collectionName = 'campaignEvents';

  async create(event: Omit<CampaignEvent, 'id' | 'createdAt'>): Promise<CampaignEvent> {
    const id = crypto.randomUUID();
    const data = {
      ...event,
      createdAt: serverTimestamp()
    };
    await setDoc(doc(getUnifiedDb(), this.collectionName, id), data);
    return { ...data, id, createdAt: new Date() } as any;
  }

  async getById(id: string): Promise<CampaignEvent | null> {
    const snap = await getDoc(doc(getUnifiedDb(), this.collectionName, id));
    if (!snap.exists()) return null;
    return mapDoc<CampaignEvent>(snap.id, snap.data());
  }

  async getByUserId(userId: string, limitVal: number = 20): Promise<CampaignEvent[]> {
    const q = query(
      collection(getUnifiedDb(), this.collectionName),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(limitVal)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d: any) => mapDoc<CampaignEvent>(d.id, d.data()));
  }

  async getByCampaignId(campaignId: string, limitVal: number = 50): Promise<CampaignEvent[]> {
    const q = query(
      collection(getUnifiedDb(), this.collectionName),
      where('campaignId', '==', campaignId),
      orderBy('createdAt', 'desc'),
      limit(limitVal)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d: any) => mapDoc<CampaignEvent>(d.id, d.data()));
  }

  async updateStatus(id: string, status: CampaignEvent['status'], metadata?: Record<string, any>): Promise<void> {
    const updates: any = { status };
    if (status === 'sent') updates.sentAt = serverTimestamp();
    if (status === 'clicked') updates.clickedAt = serverTimestamp();
    if (metadata) updates.personalizedMetadata = metadata;
    
    await updateDoc(doc(getUnifiedDb(), this.collectionName, id), updates);
  }

  async recordConversion(id: string, orderId: string, value: number): Promise<void> {
    await updateDoc(doc(getUnifiedDb(), this.collectionName, id), {
      status: 'converted',
      convertedAt: serverTimestamp(),
      relatedOrderId: orderId,
      conversionValue: value
    });
  }

  async getPendingEvents(limitVal: number = 50): Promise<CampaignEvent[]> {
    const q = query(
      collection(getUnifiedDb(), this.collectionName),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'asc'),
      limit(limitVal)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d: any) => mapDoc<CampaignEvent>(d.id, d.data()));
  }

  async getScheduledStepsDue(limitVal: number = 50): Promise<CampaignEvent[]> {
    const now = new Date();
    const q = query(
      collection(getUnifiedDb(), this.collectionName),
      where('status', '==', 'sent'), // Only sent events can have a "next step"
      where('nextStepDueAt', '<=', now),
      orderBy('nextStepDueAt', 'asc'),
      limit(limitVal)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d: any) => mapDoc<CampaignEvent>(d.id, d.data()));
  }
}
