/**
 * [LAYER: INFRASTRUCTURE]
 * Firestore Implementation of Campaign Repository
 */
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  limit,
  serverTimestamp,
  getUnifiedDb,
  increment,
  runTransaction
} from '../../firebase/bridge';
import { logger } from '@utils/logger';
import type { ICampaignRepository } from '@domain/repositories';
import type { 
  MarketingCampaign, 
  MarketingCampaignDraft, 
  MarketingCampaignUpdate,
  CampaignStatus,
  CampaignType,
  MarketingOverview
} from '@domain/models';
import { mapDoc } from './utils';

export class FirestoreCampaignRepository implements ICampaignRepository {
  private readonly collectionName = 'marketingCampaigns';

  async getAll(options: { status?: CampaignStatus; type?: CampaignType; limit?: number } = {}): Promise<MarketingCampaign[]> {
    try {
      const db = getUnifiedDb();
      const baseColl = collection(db, this.collectionName);
      const constraints: any[] = [];

      if (options.status) constraints.push(where('status', '==', options.status));
      if (options.type) constraints.push(where('type', '==', options.type));
      
      constraints.push(orderBy('createdAt', 'desc'));
      if (options.limit) constraints.push(limit(options.limit));

      const snapshot = await getDocs(query(baseColl, ...constraints));
      return snapshot.docs.map((d: any) => mapDoc<MarketingCampaign>(d.id, d.data()));
    } catch (err) {
      logger.error('Failed to fetch campaigns', err);
      return [];
    }
  }

  async getById(id: string): Promise<MarketingCampaign | null> {
    const docRef = doc(getUnifiedDb(), this.collectionName, id);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    return mapDoc<MarketingCampaign>(snap.id, snap.data());
  }

  async create(campaign: MarketingCampaignDraft): Promise<MarketingCampaign> {
    const id = crypto.randomUUID();
    const now = serverTimestamp();
    const data = {
      ...campaign,
      sentCount: 0,
      clickCount: 0,
      conversionCount: 0,
      revenueGenerated: 0,
      createdAt: now,
      updatedAt: now
    };
    await setDoc(doc(getUnifiedDb(), this.collectionName, id), data);
    return { ...data, id, createdAt: new Date(), updatedAt: new Date() } as any;
  }

  async update(id: string, updates: MarketingCampaignUpdate): Promise<MarketingCampaign> {
    const docRef = doc(getUnifiedDb(), this.collectionName, id);
    const data = { ...updates, updatedAt: serverTimestamp() };
    await updateDoc(docRef, data);
    return (await this.getById(id))!;
  }

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(getUnifiedDb(), this.collectionName, id));
  }

  async incrementMetrics(id: string, metrics: { sent?: number; clicked?: number; converted?: number; revenue?: number }): Promise<void> {
    const docRef = doc(getUnifiedDb(), this.collectionName, id);
    const updates: any = {};
    if (metrics.sent) updates.sentCount = increment(metrics.sent);
    if (metrics.clicked) updates.clickCount = increment(metrics.clicked);
    if (metrics.converted) updates.conversionCount = increment(metrics.converted);
    if (metrics.revenue) updates.revenueGenerated = increment(metrics.revenue);
    
    await updateDoc(docRef, updates);
  }

  async getOverview(): Promise<MarketingOverview> {
    const campaigns = await this.getAll();
    const activeCampaigns = campaigns.filter(c => c.status === 'active').length;
    const totalRevenue = campaigns.reduce((sum, c) => sum + (c.revenueGenerated || 0), 0);
    const totalSent = campaigns.reduce((sum, c) => sum + (c.sentCount || 0), 0);
    const totalConverted = campaigns.reduce((sum, c) => sum + (c.conversionCount || 0), 0);
    
    return {
      activeCampaigns,
      totalCampaignRevenue: totalRevenue,
      avgConversionRate: totalSent > 0 ? (totalConverted / totalSent) * 100 : 0,
      topPerformingCampaigns: [...campaigns].sort((a, b) => b.revenueGenerated - a.revenueGenerated).slice(0, 5),
      recentCampaignEvents: [] // Fetched separately in service if needed
    };
  }
}
