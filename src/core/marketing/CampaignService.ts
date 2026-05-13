/**
 * [LAYER: CORE]
 * Campaign Service Orchestrator
 * Manages the autonomous marketing funnel lifecycle and campaign execution.
 */
import { 
  MarketingCampaign, 
  Order,
  Cart
} from '@domain/models';
import { 
  ICampaignRepository, 
  ICampaignEventRepository, 
  ICustomerSegmentRepository,
  IEmailService,
  IOrderRepository,
  ICartRepository,
  IProductRepository
} from '@domain/repositories';
import { logger } from '@utils/logger';
import { AuditService } from '../AuditService';
import { MarketingIntelligence } from './MarketingIntelligence';
import { MarketingPersonalization } from './MarketingPersonalization';
import {
  buildCampaignDraftFromPlaybook,
  buildConciergeMarketingStrategy,
  LIFECYCLE_PLAYBOOKS,
} from './MarketingStrategy';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  getUnifiedDb,
  limit,
  orderBy,
  query,
  where,
} from '@infrastructure/firebase/bridge';

export class CampaignService {
  private intelligence: MarketingIntelligence;
  private personalization: MarketingPersonalization;

  constructor(
    private campaignRepo: ICampaignRepository,
    private eventRepo: ICampaignEventRepository,
    private segmentRepo: ICustomerSegmentRepository,
    private emailService: IEmailService,
    private audit: AuditService,
    private orderRepo: IOrderRepository,
    private cartRepo: ICartRepository,
    private productRepo: IProductRepository
  ) {
    this.intelligence = new MarketingIntelligence(orderRepo, cartRepo, eventRepo);
    this.personalization = new MarketingPersonalization(this.intelligence);
  }

  /**
   * Evaluates and triggers active campaigns.
   */
  async runAutomationPulse() {
    try {
      logger.info('Starting Marketing Automation Pulse...');
      const activeCampaigns = await this.campaignRepo.getAll({ status: 'active' });
      
      for (const campaign of activeCampaigns) {
        await this.processCampaign(campaign);
      }
      
      await this.processScheduledSteps();
      logger.info('Marketing Automation Pulse completed.');
    } catch (error) {
      logger.error('Failed to run automation pulse', error);
    }
  }

  private async processCampaign(campaign: MarketingCampaign) {
    logger.info(`Processing campaign: ${campaign.name}`);
    const targetUserIds = await this.evaluateTrigger(campaign);
    
    for (const userId of targetUserIds) {
      const previousEvents = await this.eventRepo.getByUserId(userId);
      if (previousEvents.some(e => e.campaignId === campaign.id)) continue;

      const nba = await this.determineNextBestAction(userId, campaign);
      await this.executeCampaignForUser(campaign, userId, nba, 0);
    }
  }

  private async processScheduledSteps() {
    const pendingEvents = await this.eventRepo.getScheduledStepsDue(100); 
    const now = new Date();

    for (const event of pendingEvents) {
      if (event.nextStepDueAt && event.nextStepDueAt <= now && event.stepIndex !== undefined) {
        const campaign = await this.campaignRepo.getById(event.campaignId);
        if (campaign && campaign.status === 'active' && campaign.isSequence) {
          const nextStepIndex = event.stepIndex + 1;
          if (campaign.steps && campaign.steps[nextStepIndex]) {
            const userEvents = await this.eventRepo.getByUserId(event.userId, 50);
            if (userEvents.some(e => e.campaignId === campaign.id && e.stepIndex === nextStepIndex)) continue;
            await this.executeCampaignForUser(campaign, event.userId, 'proceed', nextStepIndex);
          }
        }
      }
    }
  }

  private async determineNextBestAction(userId: string, campaign: MarketingCampaign): Promise<string> {
    const previousEvents = await this.eventRepo.getByUserId(userId, 50);
    const rfm = await this.intelligence.calculateRFM(userId);
    const customer = await this.getCustomerProfile(userId);

    if (customer.marketingSuppressed) return 'skip_marketing_suppressed';
    if (campaign.suppressionRules?.requireConsent && customer.marketingConsent === false) return 'skip_missing_consent';

    const capDays = campaign.frequencyCapDays || 3;
    const lastSent = previousEvents.find(e => e.status === 'sent');
    if (lastSent && lastSent.sentAt) {
      const daysSinceLast = (new Date().getTime() - lastSent.sentAt.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceLast < capDays) return 'skip_frequency_cap';
    }
    
    if (previousEvents.some(e => e.nextStepDueAt && e.nextStepDueAt > new Date())) return 'skip_active_sequence';
    if (rfm.recencyScore <= 2 && campaign.type !== 'win_back' && campaign.type !== 'comeback_offer') return 'skip_for_winback';
    if (rfm.monetaryScore >= 4) return 'escalate_to_vip_personalization';

    return 'proceed';
  }

  async executeCampaignForUser(campaign: MarketingCampaign, userId: string, nba: string = 'proceed', stepIndex: number = 0) {
    try {
      if (nba.startsWith('skip')) return;

      const step = campaign.isSequence && campaign.steps ? campaign.steps[stepIndex] : null;
      let variantId: string | undefined;
      
      let subject = step?.subjectTemplate || campaign.subjectTemplate || 'A special offer';
      let body = step?.bodyTemplate || campaign.bodyTemplate || 'Check this out!';
      
      if (step?.isSplitTest && step.variants && step.variants.length > 0) {
        const variant = this.personalization.selectVariant(step.variants);
        subject = variant.subjectTemplate;
        body = variant.bodyTemplate;
        variantId = variant.id;
      }

      const rfm = await this.intelligence.calculateRFM(userId);
      const discountCode = step?.discountCode || campaign.discountCode;
      
      if (campaign.aiPersonalizationEnabled || nba === 'escalate_to_vip_personalization') {
        const personalization = await this.personalization.generateAIPersonalization(campaign, userId);
        subject = personalization.subject || subject;
        body = personalization.body || body;
      }

      const now = new Date();
      const channel = step?.channel || campaign.channels[0] || 'email';
      const customer = await this.getCustomerProfile(userId);
      if (channel === 'email' && customer.email === 'unknown@dreambees.art') {
        logger.warn('Skipping campaign email because customer email is unavailable', { campaignId: campaign.id, userId });
        return;
      }
      let nextStepDueAt: Date | undefined;
      if (campaign.isSequence && campaign.steps && campaign.steps[stepIndex + 1]) {
        nextStepDueAt = new Date(now.getTime() + campaign.steps[stepIndex + 1].delayHours * 60 * 60 * 1000);
      }

      const event = await this.eventRepo.create({
        campaignId: campaign.id,
        userId,
        customerEmail: customer.email,
        channel,
        status: 'pending',
        subject,
        body,
        stepIndex,
        variantId,
        nextStepDueAt,
        sentAt: now,
        personalizedMetadata: { discountCode, rfmScore: rfm.recencyScore + rfm.frequencyScore + rfm.monetaryScore }
      });

      if (channel === 'email') {
        await this.emailService.sendEmail({ to: event.customerEmail, subject, html: body, idempotencyKey: `c_${campaign.id}_${userId}_s${stepIndex}` });
      }

      await this.eventRepo.updateStatus(event.id, 'sent');
      await this.campaignRepo.incrementMetrics(campaign.id, { sent: 1 });
      await this.audit.record({
        userId: 'system',
        userEmail: 'system@dreambees.art',
        action: 'campaign_executed',
        targetId: campaign.id,
        details: { userId, channel, stepIndex },
      });
    } catch (error) {
      logger.error(`Execution failed for ${userId}`, error);
    }
  }

  private async evaluateTrigger(campaign: MarketingCampaign): Promise<string[]> {
    if (campaign.triggerType === 'segment' && campaign.type === 'welcome_series') {
      return this.findWelcomeSeriesUsers(campaign);
    }
    if (campaign.triggerType === 'event' && campaign.type === 'abandoned_cart') {
      return this.findAbandonedCartUsers(campaign);
    }
    if (campaign.triggerType === 'event' && campaign.type === 'browse_abandonment') {
      return this.findBrowseAbandonmentUsers(campaign);
    }
    if (campaign.triggerType === 'segment' && ['comeback_offer', 'win_back', 'sunset'].includes(campaign.type)) {
      return this.findLapsedCustomerUsers(campaign);
    }
    if (campaign.triggerType === 'segment' && ['replenishment', 'cross_sell', 'loyalty_reward', 'review_request'].includes(campaign.type)) {
      return this.findRetentionOpportunityUsers(campaign);
    }
    return [];
  }

  async getConciergeMarketingStrategy() {
    const campaigns = await this.campaignRepo.getAll();
    return buildConciergeMarketingStrategy(campaigns);
  }

  async optimizeLifecycleStrategy() {
    const campaigns = await this.campaignRepo.getAll();
    const strategy = buildConciergeMarketingStrategy(campaigns);
    const recommendations: Array<{
      priority: 'critical' | 'high' | 'medium' | 'low';
      action: string;
      reason: string;
      playbookId?: string;
      campaignId?: string;
    }> = [];

    for (const item of strategy.coverage) {
      if (item.status === 'missing') {
        recommendations.push({
          priority: item.playbookId.includes('cart') || item.playbookId.includes('welcome') || item.playbookId.includes('comeback') ? 'critical' : 'high',
          action: 'create_playbook',
          reason: item.recommendation,
          playbookId: item.playbookId,
        });
      } else if (item.status === 'draft') {
        recommendations.push({
          priority: 'medium',
          action: 'review_and_activate',
          reason: item.recommendation,
          playbookId: item.playbookId,
          campaignId: item.campaignId,
        });
      }
    }

    for (const campaign of campaigns) {
      const sent = campaign.sentCount || 0;
      const conversions = campaign.conversionCount || 0;
      const conversionRate = sent > 0 ? conversions / sent : 0;
      const revenuePerRecipient = sent > 0 ? (campaign.revenueGenerated || 0) / sent : 0;

      if (campaign.status === 'active' && sent >= 25 && conversionRate < 0.01) {
        recommendations.push({
          priority: 'high',
          action: 'optimize_low_conversion_flow',
          reason: `${campaign.name} is active but converting below 1%. Review offer depth, message angle, timing, and audience splits.`,
          campaignId: campaign.id,
        });
      }

      if (campaign.status === 'active' && sent >= 25 && revenuePerRecipient < 100) {
        recommendations.push({
          priority: 'medium',
          action: 'review_revenue_per_recipient',
          reason: `${campaign.name} has low revenue per recipient. Compare performance against flow benchmarks by AOV and lifecycle type.`,
          campaignId: campaign.id,
        });
      }

      if (campaign.dynamicIncentivesEnabled && !campaign.incentiveRules?.length) {
        recommendations.push({
          priority: 'medium',
          action: 'add_incentive_rules',
          reason: `${campaign.name} enables dynamic incentives but has no incentive ladder configured.`,
          campaignId: campaign.id,
        });
      }
    }

    const activeCampaigns = campaigns.filter((campaign) => campaign.status === 'active');
    const totalSent = campaigns.reduce((sum, campaign) => sum + (campaign.sentCount || 0), 0);
    const totalConversions = campaigns.reduce((sum, campaign) => sum + (campaign.conversionCount || 0), 0);
    const totalRevenue = campaigns.reduce((sum, campaign) => sum + (campaign.revenueGenerated || 0), 0);
    const coverageScore = Math.round((strategy.coverage.filter((item) => item.status !== 'missing').length / Math.max(strategy.coverage.length, 1)) * 100);
    const activationScore = Math.round((strategy.coverage.filter((item) => item.status === 'active').length / Math.max(strategy.coverage.length, 1)) * 100);

    return {
      generatedAt: new Date().toISOString(),
      scorecard: {
        coverageScore,
        activationScore,
        activeCampaigns: activeCampaigns.length,
        totalCampaigns: campaigns.length,
        totalSent,
        totalConversions,
        totalRevenue,
        aggregateConversionRate: totalSent > 0 ? totalConversions / totalSent : 0,
        revenuePerRecipient: totalSent > 0 ? totalRevenue / totalSent : 0,
      },
      recommendations: recommendations.sort((a, b) => {
        const weight = { critical: 4, high: 3, medium: 2, low: 1 };
        return weight[b.priority] - weight[a.priority];
      }),
      operatingModel: strategy.operatingModel,
      guardrails: strategy.guardrails,
    };
  }

  async createCampaignFromPlaybook(playbookId: string) {
    const draft = buildCampaignDraftFromPlaybook(playbookId);
    return this.campaignRepo.create(draft);
  }

  async activatePlaybook(playbookId: string) {
    const campaign = await this.findOrCreateCampaignForPlaybook(playbookId);
    if (campaign.status === 'active') return campaign;
    return this.campaignRepo.update(campaign.id, { status: 'active' });
  }

  async pausePlaybook(playbookId: string) {
    const campaign = await this.findCampaignForPlaybook(playbookId);
    if (!campaign) throw new Error(`Cannot pause missing lifecycle playbook: ${playbookId}`);
    return this.campaignRepo.update(campaign.id, { status: 'paused' });
  }

  async activateAllLifecyclePlaybooks() {
    const activated = [];
    for (const playbook of LIFECYCLE_PLAYBOOKS) {
      activated.push(await this.activatePlaybook(playbook.id));
    }
    return activated;
  }

  async pauseAllLifecyclePlaybooks() {
    const paused = [];
    const campaigns = await this.campaignRepo.getAll();
    for (const playbook of LIFECYCLE_PLAYBOOKS) {
      const campaign = campaigns.find((item) => item.type === playbook.type && item.lifecycleStage === playbook.lifecycleStage);
      if (campaign && campaign.status === 'active') {
        paused.push(await this.campaignRepo.update(campaign.id, { status: 'paused' }));
      }
    }
    return paused;
  }

  async createMissingLifecyclePlaybooks() {
    const campaigns = await this.campaignRepo.getAll();
    const created = [];

    for (const playbook of LIFECYCLE_PLAYBOOKS) {
      const exists = campaigns.some((campaign) => (
        campaign.type === playbook.type &&
        campaign.lifecycleStage === playbook.lifecycleStage
      ));
      if (!exists) {
        created.push(await this.createCampaignFromPlaybook(playbook.id));
      }
    }

    return created;
  }

  async deepInvestigateCustomer(userId: string) {
    return this.intelligence.deepInvestigate(userId);
  }

  async planCustomerLifecycle(userId: string) {
    const investigation = await this.deepInvestigateCustomer(userId);
    const strategy = await this.getConciergeMarketingStrategy();
    const recommendedPlaybookId = investigation.nextBestCampaign?.playbookId;
    const coverage = strategy.coverage.find((item) => item.playbookId === recommendedPlaybookId);

    return {
      userId,
      investigation,
      recommendedPlaybookId,
      coverage,
      decisionBrief: {
        scorecard: investigation.lifecycleScorecard,
        campaignBrief: investigation.campaignBrief,
        frequencyPolicy: investigation.frequencyPolicy,
        experimentationPlan: investigation.experimentationPlan,
      },
      actions: [
        {
          id: 'enroll_recommended',
          label: 'Enroll in recommended lifecycle flow',
          enabled: Boolean(recommendedPlaybookId && investigation.automationAuthority?.canEnrollCustomer && coverage?.status === 'active'),
          reason: coverage?.status !== 'active'
            ? 'Recommended playbook is not active.'
            : investigation.automationAuthority?.reason,
        },
        {
          id: 'activate_recommended',
          label: 'Activate recommended playbook',
          enabled: Boolean(recommendedPlaybookId && coverage?.status !== 'active'),
          reason: coverage?.recommendation || 'Recommended campaign needs review before activation.',
        },
        {
          id: 'service_recovery',
          label: 'Suppress marketing and resolve service risk',
          enabled: Boolean(investigation.automationAuthority?.requiresHumanReview),
          reason: investigation.automationAuthority?.reason,
        },
      ],
    };
  }

  async enrollCustomerInLifecycle(userId: string, playbookId?: string) {
    const plan = await this.planCustomerLifecycle(userId);
    const targetPlaybookId = playbookId || plan.recommendedPlaybookId;
    if (!targetPlaybookId) {
      return { status: 'no_recommendation' as const, plan };
    }
    if (!plan.investigation.automationAuthority?.canEnrollCustomer && !playbookId) {
      return { status: 'suppressed' as const, plan };
    }

    const campaign = await this.findCampaignForPlaybook(targetPlaybookId);
    if (!campaign) {
      return { status: 'missing_campaign' as const, plan };
    }
    if (campaign.status !== 'active') {
      return { status: 'needs_activation' as const, campaign, plan };
    }

    const nba = await this.determineNextBestAction(userId, campaign);
    if (nba.startsWith('skip')) {
      return { status: nba, campaign, plan };
    }

    await this.executeCampaignForUser(campaign, userId, nba, 0);
    return { status: 'enrolled' as const, campaign, plan };
  }

  private getPlaybookDefinition(playbookId: string) {
    const playbook = LIFECYCLE_PLAYBOOKS.find((item) => item.id === playbookId);
    if (!playbook) throw new Error(`Unknown lifecycle playbook: ${playbookId}`);
    return playbook;
  }

  private async findCampaignForPlaybook(playbookId: string): Promise<MarketingCampaign | null> {
    const playbook = this.getPlaybookDefinition(playbookId);
    const campaigns = await this.campaignRepo.getAll({ type: playbook.type });
    return campaigns.find((campaign) => campaign.lifecycleStage === playbook.lifecycleStage) || null;
  }

  private async findOrCreateCampaignForPlaybook(playbookId: string): Promise<MarketingCampaign> {
    return (await this.findCampaignForPlaybook(playbookId)) || this.createCampaignFromPlaybook(playbookId);
  }

  private toDate(value: any): Date {
    if (!value) return new Date(0);
    if (value instanceof Date) return value;
    if (typeof value.toDate === 'function') return value.toDate();
    if (typeof value === 'string' || typeof value === 'number') return new Date(value);
    if (typeof value === 'object' && value._seconds !== undefined) {
      return new Date(value._seconds * 1000 + (value._nanoseconds || 0) / 1000000);
    }
    return new Date(0);
  }

  private async getCustomerProfile(userId: string): Promise<{ email: string; name?: string; marketingConsent?: boolean; marketingSuppressed?: boolean }> {
    try {
      const snap = await getDoc(doc(getUnifiedDb(), 'users', userId));
      const data = snap.exists() ? snap.data() : null;
      return {
        email: data?.email || 'unknown@dreambees.art',
        name: data?.displayName,
        marketingConsent: data?.marketingConsent,
        marketingSuppressed: data?.marketingSuppressed,
      };
    } catch (error) {
      logger.warn('Failed to load customer profile for campaign execution', { userId, error });
      return { email: 'unknown@dreambees.art' };
    }
  }

  private async findAbandonedCartUsers(campaign: MarketingCampaign): Promise<string[]> {
    const delayHours = campaign.triggerConfig.delayHours ?? 1;
    const cutoff = new Date(Date.now() - delayHours * 60 * 60 * 1000);
    const minimumCartValue = campaign.triggerConfig.minimumCartValue ?? 0;

    try {
      const q = query(
        collection(getUnifiedDb(), 'carts'),
        where('updatedAt', '<=', cutoff),
        orderBy('updatedAt', 'asc'),
        limit(100)
      );
      const snap = await getDocs(q);
      const candidates: string[] = [];

      for (const cartDoc of snap.docs) {
        const cart = { ...cartDoc.data(), id: cartDoc.id, updatedAt: this.toDate(cartDoc.data().updatedAt) } as Cart;
        const cartValue = cart.items?.reduce((sum, item) => sum + item.priceSnapshot * item.quantity, 0) || 0;
        if (!cart.userId || !cart.items?.length || cartValue < minimumCartValue) continue;
        if (await this.hasRecentPurchase(cart.userId, campaign.suppressionRules?.excludeRecentPurchasersDays ?? 1)) continue;
        candidates.push(cart.userId);
      }

      return candidates;
    } catch (error) {
      logger.error('Failed to evaluate abandoned cart trigger', { campaignId: campaign.id, error });
      return [];
    }
  }

  private async findWelcomeSeriesUsers(campaign: MarketingCampaign): Promise<string[]> {
    const delayHours = campaign.triggerConfig.delayHours ?? 0;
    const cutoff = new Date(Date.now() - delayHours * 60 * 60 * 1000);

    try {
      const q = query(
        collection(getUnifiedDb(), 'users'),
        where('createdAt', '<=', cutoff),
        orderBy('createdAt', 'desc'),
        limit(100)
      );
      const snap = await getDocs(q);
      const candidates: string[] = [];

      for (const userDoc of snap.docs) {
        const data = userDoc.data();
        if (data.role === 'admin') continue;
        if (!data.email || data.marketingConsent === false) continue;
        if (await this.hasAnyPurchase(userDoc.id)) continue;
        candidates.push(userDoc.id);
      }

      return candidates;
    } catch (error) {
      logger.error('Failed to evaluate welcome series trigger', { campaignId: campaign.id, error });
      return [];
    }
  }

  private async findLapsedCustomerUsers(campaign: MarketingCampaign): Promise<string[]> {
    const inactivityDays = campaign.triggerConfig.inactivityDays ?? 60;
    const cutoff = new Date(Date.now() - inactivityDays * 24 * 60 * 60 * 1000);

    try {
      const q = query(
        collection(getUnifiedDb(), 'orders'),
        where('createdAt', '<=', cutoff),
        orderBy('createdAt', 'desc'),
        limit(150)
      );
      const snap = await getDocs(q);
      const seen = new Set<string>();

      for (const orderDoc of snap.docs) {
        const data = orderDoc.data();
        if (!data.userId || seen.has(data.userId)) continue;
        if (await this.hasRecentPurchase(data.userId, inactivityDays)) continue;
        seen.add(data.userId);
      }

      return Array.from(seen).slice(0, 100);
    } catch (error) {
      logger.error('Failed to evaluate lapsed customer trigger', { campaignId: campaign.id, error });
      return [];
    }
  }

  private async findRetentionOpportunityUsers(campaign: MarketingCampaign): Promise<string[]> {
    const inactivityDays = campaign.triggerConfig.inactivityDays ?? 30;
    const cutoff = new Date(Date.now() - inactivityDays * 24 * 60 * 60 * 1000);

    try {
      const q = query(
        collection(getUnifiedDb(), 'orders'),
        where('createdAt', '<=', cutoff),
        orderBy('createdAt', 'desc'),
        limit(150)
      );
      const snap = await getDocs(q);
      const seen = new Set<string>();

      for (const orderDoc of snap.docs) {
        const data = orderDoc.data();
        if (!data.userId || seen.has(data.userId)) continue;
        const rfm = await this.intelligence.calculateRFM(data.userId);
        if (campaign.type === 'loyalty_reward' && rfm.monetaryScore < 4) continue;
        if (campaign.type !== 'loyalty_reward' && rfm.recencyScore <= 1) continue;
        seen.add(data.userId);
      }

      return Array.from(seen).slice(0, 100);
    } catch (error) {
      logger.error('Failed to evaluate retention opportunity trigger', { campaignId: campaign.id, error });
      return [];
    }
  }

  private async findBrowseAbandonmentUsers(campaign: MarketingCampaign): Promise<string[]> {
    const delayHours = campaign.triggerConfig.delayHours ?? 3;
    const cutoff = new Date(Date.now() - delayHours * 60 * 60 * 1000);

    try {
      const q = query(
        collection(getUnifiedDb(), 'conciergeSessions'),
        where('updatedAt', '<=', cutoff),
        orderBy('updatedAt', 'desc'),
        limit(100)
      );
      const snap = await getDocs(q);
      const candidates: string[] = [];

      for (const sessionDoc of snap.docs) {
        const data = sessionDoc.data();
        const hasProductIntent = data.category === 'product_question' || Boolean(data.relatedProductIds?.length);
        if (!data.userId || data.userId === 'anonymous' || !hasProductIntent) continue;
        if (await this.cartRepo.getByUserId(data.userId)) continue;
        if (await this.hasRecentPurchase(data.userId, campaign.suppressionRules?.excludeRecentPurchasersDays ?? 3)) continue;
        candidates.push(data.userId);
      }

      return Array.from(new Set(candidates));
    } catch (error) {
      logger.error('Failed to evaluate browse abandonment trigger', { campaignId: campaign.id, error });
      return [];
    }
  }

  private async hasRecentPurchase(userId: string, days: number): Promise<boolean> {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const recent = await this.orderRepo.getByUserId(userId, { from: since, limit: 1 });
    return recent.orders.length > 0;
  }

  private async hasAnyPurchase(userId: string): Promise<boolean> {
    const recent = await this.orderRepo.getByUserId(userId, { limit: 1 });
    return recent.orders.length > 0;
  }

  async handleOrderPlaced(order: Order) {
    const events = await this.eventRepo.getByUserId(order.userId, 10);
    const windowInMs = 7 * 24 * 60 * 60 * 1000;
    const attributionEvent = events.find(e => e.status !== 'converted' && e.sentAt && (Date.now() - e.sentAt.getTime()) < windowInMs);

    if (attributionEvent) {
      await this.eventRepo.recordConversion(attributionEvent.id, order.id, order.total);
      await this.campaignRepo.incrementMetrics(attributionEvent.campaignId, { converted: 1, revenue: order.total });
    }

    await this.triggerOrderLifecycleCampaigns(order);
  }

  private async triggerOrderLifecycleCampaigns(order: Order) {
    const campaigns = await this.campaignRepo.getAll({ status: 'active' });
    const orderTriggeredTypes = new Set(['post_purchase']);
    const eligible = campaigns
      .filter((campaign) => orderTriggeredTypes.has(campaign.type))
      .sort((a, b) => b.priority - a.priority);

    for (const campaign of eligible) {
      const previousEvents = await this.eventRepo.getByUserId(order.userId, 50);
      const alreadyInCampaign = previousEvents.some((event) => event.campaignId === campaign.id && event.relatedOrderId === order.id);
      if (alreadyInCampaign) continue;

      const nba = await this.determineNextBestAction(order.userId, campaign);
      await this.executeCampaignForUser(campaign, order.userId, nba, 0);
    }
  }
}
