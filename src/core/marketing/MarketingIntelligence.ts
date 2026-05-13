/**
 * [LAYER: CORE]
 * Marketing Intelligence Engine
 * Handles RFM analysis, churn prediction, and forensic customer deep-dives.
 */
import { 
  Order, 
  Cart, 
  CampaignEvent 
} from '@domain/models';
import { 
  IOrderRepository, 
  ICartRepository, 
  ICampaignEventRepository 
} from '@domain/repositories';
import { logger } from '@utils/logger';
import { 
  query, 
  collection, 
  where, 
  orderBy, 
  limit, 
  getDocs,
  getUnifiedDb
} from '@infrastructure/firebase/bridge';

export class MarketingIntelligence {
  constructor(
    private orderRepo: IOrderRepository,
    private cartRepo: ICartRepository,
    private eventRepo: ICampaignEventRepository
  ) {}

  /**
   * RFM Analysis: Recency, Frequency, Monetary.
   */
  async calculateRFM(userId: string) {
    const orders = await this.orderRepo.getByUserId(userId, { limit: 100 });
    const now = new Date();
    
    if (orders.orders.length === 0) {
      return { recencyScore: 1, frequencyScore: 1, monetaryScore: 1, totalSpent: 0, recencyDays: 999 };
    }

    const lastOrder = orders.orders[0];
    const recencyDays = Math.floor((now.getTime() - lastOrder.createdAt.getTime()) / (1000 * 60 * 60 * 24));
    
    const recencyScore = recencyDays < 30 ? 5 : recencyDays < 90 ? 4 : recencyDays < 180 ? 3 : recencyDays < 365 ? 2 : 1;
    const frequencyScore = orders.orders.length >= 10 ? 5 : orders.orders.length >= 5 ? 4 : orders.orders.length >= 3 ? 3 : orders.orders.length >= 2 ? 2 : 1;
    
    const totalSpent = orders.orders.reduce((sum, o) => sum + o.total, 0);
    const monetaryScore = totalSpent > 100000 ? 5 : totalSpent > 50000 ? 4 : totalSpent > 25000 ? 3 : totalSpent > 10000 ? 2 : 1;

    return { recencyScore, frequencyScore, monetaryScore, totalSpent, recencyDays };
  }

  private scoreBand(score: number): 'low' | 'medium' | 'high' {
    if (score >= 75) return 'high';
    if (score >= 40) return 'medium';
    return 'low';
  }

  /**
   * Forensic 360-degree customer deep-dive.
   */
  async deepInvestigate(userId: string) {
    logger.info(`Forensic investigation: Deep-diving customer ${userId}...`);
    
    const orders = await this.orderRepo.getByUserId(userId, { limit: 50 });
    const cart = await this.cartRepo.getByUserId(userId);
    const campaignEvents = await this.eventRepo.getByUserId(userId, 20);
    
    // 1. Fetch Concierge memory, unresolved support risk, and behavioral evidence
    const db = getUnifiedDb();
    let historicalSentiment: string[] = [];
    let recentSupportCategories: string[] = [];
    let recentNeeds: string[] = [];
    let activeSupportRisk = false;
    if (db) {
      const q = query(collection(db, 'conciergeSessions'), where('userId', '==', userId), orderBy('createdAt', 'desc'), limit(5));
      const snap = await getDocs(q);
      const sessions = snap.docs.map((d: any) => d.data());
      historicalSentiment = sessions.map((session: any) => session.sentiment || 'neutral').reverse();
      recentSupportCategories = sessions.map((session: any) => session.category).filter(Boolean);
      recentNeeds = sessions.map((session: any) => session.customerNeed || session.summary).filter(Boolean).slice(0, 3);
      activeSupportRisk = sessions.some((session: any) => (
        session.escalationNeeded &&
        !['resolved', 'completed'].includes(session.status) &&
        session.customerOutcome !== 'resolved'
      ));
    }

    const frictionPoints: string[] = [];
    const collectionCounts: Record<string, number> = {};
    const productCounts: Record<string, number> = {};
    const orderDates: number[] = [];
    let discountedOrders = 0;
    
    for (const order of orders.orders) {
      orderDates.push(order.createdAt.getTime());
      if ((order.discountAmount && order.discountAmount > 0) || order.discountCode) discountedOrders++;

      order.items.forEach(item => {
        const collectionMatch = item.name.match(/\[(.*?)\]/) || [null, 'General Collection'];
        const collName = collectionMatch[1] || 'General Collection';
        collectionCounts[collName] = (collectionCounts[collName] || 0) + 1;
        productCounts[item.name] = (productCounts[item.name] || 0) + item.quantity;
      });
      
      if (order.status === 'cancelled' || order.refundedAmount) {
        frictionPoints.push(`${order.status === 'cancelled' ? 'Cancellation' : 'Refund'} on ${order.createdAt.toLocaleDateString()}`);
      }
    }

    // 2. Churn Probability & CLV
    let churnProbability = 50;
    let avgOrderValue = 0;
    let avgPurchaseGapDays: number | null = null;
    let daysSinceLastPurchase: number | null = null;
    if (orderDates.length >= 1) {
      avgOrderValue = orders.orders.reduce((sum, o) => sum + o.total, 0) / orders.orders.length;
      daysSinceLastPurchase = (Date.now() - orderDates[0]) / (1000 * 60 * 60 * 24);
    }

    if (orderDates.length >= 2) {
      const gaps = [];
      for (let i = 0; i < orderDates.length - 1; i++) {
        gaps.push((orderDates[i] - orderDates[i+1]) / (1000 * 60 * 60 * 24));
      }
      avgPurchaseGapDays = gaps.reduce((a, b) => a + b, 0) / gaps.length;
      churnProbability = Math.min(100, Math.max(0, Math.round(((daysSinceLastPurchase || 0) / (avgPurchaseGapDays * 1.5)) * 100)));
    }

    const clv = Math.round((avgOrderValue * (orders.orders.length / 1)) * (1 - churnProbability / 100));
    const priceSensitivity = discountedOrders / (orders.orders.length || 1) > 0.5 ? 'High Sensitivity' : 'Low Sensitivity';
    const discountAffinity = orders.orders.length > 0 ? discountedOrders / orders.orders.length : 0;
    
    // 3. Engagement & Psychographics
    const totalSent = campaignEvents.filter(e => e.status === 'sent').length;
    const totalEngaged = campaignEvents.filter(e => e.status === 'clicked' || e.status === 'converted').length;
    const engagementRate = totalSent > 0 ? (totalEngaged / totalSent) : 0.5;
    const recentCampaignTouches = campaignEvents.filter((event) => {
      const sentAt = event.sentAt || event.createdAt;
      return sentAt && (Date.now() - sentAt.getTime()) < 7 * 24 * 60 * 60 * 1000;
    }).length;

    let psychographic = 'Window Shopper';
    if (engagementRate > 0.7 && churnProbability < 30) psychographic = 'Impulsive / Brand Fan';
    else if (engagementRate > 0.3) psychographic = 'Deliberative / Researcher';

    // 4. Intent & Collaborative Filtering
    let pathToPurchase = 'Steady Interest';
    if (db) {
      const q = query(collection(db, 'conciergeSessions'), where('userId', '==', userId), orderBy('createdAt', 'desc'), limit(3));
      const sessions = await getDocs(q);
      const recentSession = sessions.docs[0]?.data();
      if (recentSession?.lastPage === 'checkout') pathToPurchase = 'High Intent / Abandoned at Checkout';
    }

    const topCollection = Object.entries(collectionCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'DreamBees Classics';
    const topProducts = Object.entries(productCounts).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([name]) => name);
    const cohortStanding = clv > 100000 ? 'Top 1% of Collectors' : 'Valued Collector';
    const lifecycleType = topCollection.includes('Sticker') ? 'Refill' : 'Complement';
    const cartValue = cart?.items.reduce((sum, item) => sum + item.priceSnapshot * item.quantity, 0) || 0;
    const cartAgeHours = cart?.updatedAt
      ? Math.max(0, Math.round((Date.now() - cart.updatedAt.getTime()) / (1000 * 60 * 60)))
      : null;
    const cartCategories = cart?.items.map((item) => {
      const collectionMatch = item.name.match(/\[(.*?)\]/) || [null, 'General Collection'];
      return collectionMatch[1] || 'General Collection';
    }) || [];
    const currentCartSignal = cart && cart.items.length > 0
      ? `${cart.items.length} cart item${cart.items.length === 1 ? '' : 's'} worth $${(cartValue / 100).toFixed(2)}${cartAgeHours !== null ? ` last updated ${cartAgeHours}h ago` : ''}`
      : 'No active cart';

    const intentSignals: string[] = [];
    if (cart && cart.items.length > 0) intentSignals.push('Active cart');
    if (pathToPurchase.includes('Checkout')) intentSignals.push('Checkout hesitation');
    if (engagementRate > 0.3) intentSignals.push('Prior campaign engagement');
    if (orders.orders.length > 1) intentSignals.push('Repeat purchase history');
    if (recentNeeds.length > 0) intentSignals.push('Recent concierge need captured');

    const suppressionReasons: string[] = [];
    if (activeSupportRisk) suppressionReasons.push('Active unresolved support risk');
    if (recentCampaignTouches >= 2) suppressionReasons.push('Recent marketing frequency cap risk');
    if (historicalSentiment.includes('angry')) suppressionReasons.push('Prior angry sentiment requires service-first tone');

    const rfm = await this.calculateRFM(userId);
    const lifecycleSegment = orders.orders.length === 0
      ? cart && cart.items.length > 0 ? 'New high-intent cart abandoner' : 'New prospect'
      : churnProbability >= 70
        ? 'At-risk / win-back'
        : rfm.monetaryScore >= 4
          ? 'VIP retention'
          : cart && cart.items.length > 0
            ? 'Returning cart abandoner'
            : 'Active customer';

    const nextBestCampaign = (() => {
      if (activeSupportRisk) return {
        type: 'service_recovery',
        playbookId: 'support_resolution_first',
        rationale: 'Resolve the support blocker before sending marketing automation.',
      };
      if (cart && cart.items.length > 0) return {
        type: 'abandoned_cart',
        playbookId: 'cart_recovery_three_touch',
        rationale: 'Active cart is the highest-intent recovery opportunity.',
      };
      if (rfm.monetaryScore >= 4 && churnProbability >= 40) return {
        type: 'loyalty_reward',
        playbookId: 'vip_loyalty_reactivation',
        rationale: 'High-value customer is cooling and should receive concierge-first outreach.',
      };
      if (churnProbability >= 60 || rfm.recencyScore <= 2) return {
        type: 'comeback_offer',
        playbookId: 'comeback_offer_segmented',
        rationale: 'Customer is outside the healthy reorder window.',
      };
      return {
        type: 'browse_abandonment',
        playbookId: 'browse_abandonment_light_touch',
        rationale: 'Use a lighter recommendation flow until stronger purchase intent appears.',
      };
    })();

    const recommendedOffer = (() => {
      if (suppressionReasons.length > 0) return 'Service-first follow-up; do not discount yet.';
      if (priceSensitivity === 'High Sensitivity' && cartValue >= 5000) return 'Small tiered discount or bundle value after reminder touch.';
      if (rfm.monetaryScore >= 4) return 'VIP access or concierge-held recommendation before couponing.';
      if (cartValue > 0) return 'Help-first reminder, then last-call incentive only if no click.';
      return 'Personalized recommendation edit with no initial discount.';
    })();

    const evidenceScore = Math.min(100, Math.round(
      (orders.orders.length > 0 ? 20 : 0) +
      (cart && cart.items.length > 0 ? 25 : 0) +
      (campaignEvents.length > 0 ? 15 : 0) +
      (historicalSentiment.length > 0 ? 15 : 0) +
      (topProducts.length > 0 ? 10 : 0) +
      (pathToPurchase.includes('Checkout') ? 15 : 0)
    ));

    const lifecycleTimeline = [
      {
        stage: 'acquisition',
        fit: orders.orders.length === 0 ? 'active' : 'completed',
        automation: 'welcome_series_foundation',
        conciergeMove: orders.orders.length === 0 ? 'Collect preferences and guide first purchase.' : 'Skip; customer already converted.',
      },
      {
        stage: 'conversion',
        fit: cart && cart.items.length > 0 ? 'active' : 'watch',
        automation: 'cart_recovery_three_touch',
        conciergeMove: cart && cart.items.length > 0 ? 'Recover the exact cart and answer the likely objection.' : 'Wait for stronger cart or checkout intent.',
      },
      {
        stage: 'retention',
        fit: orders.orders.length > 0 && churnProbability < 60 ? 'active' : 'watch',
        automation: lifecycleType === 'Refill' ? 'replenishment_or_next_best_cross_sell' : 'post_purchase_care',
        conciergeMove: orders.orders.length > 0 ? 'Use last order, category affinity, and support tone to recommend the next useful step.' : 'No purchase history yet.',
      },
      {
        stage: 'winback',
        fit: churnProbability >= 60 || rfm.recencyScore <= 2 ? 'active' : 'watch',
        automation: 'comeback_offer_segmented',
        conciergeMove: churnProbability >= 60 ? 'Use remembered preferences and a measured comeback path.' : 'Do not send yet; customer is still inside normal cadence.',
      },
      {
        stage: 'loyalty',
        fit: rfm.monetaryScore >= 4 ? 'active' : 'watch',
        automation: 'vip_loyalty_reactivation',
        conciergeMove: rfm.monetaryScore >= 4 ? 'Lead with recognition, early access, and service recovery before discounts.' : 'Earn more repeat behavior before VIP treatment.',
      },
      {
        stage: 'sunset',
        fit: recentCampaignTouches >= 3 && engagementRate === 0 ? 'active' : 'watch',
        automation: 'sunset_deliverability_protection',
        conciergeMove: recentCampaignTouches >= 3 && engagementRate === 0 ? 'Ask for preferences or suppress future promotional outreach.' : 'Keep normal frequency caps.',
      },
    ];

    const automationAuthority = {
      canCreateCampaignDrafts: true,
      canEnrollCustomer: suppressionReasons.length === 0,
      canSendDiscount: suppressionReasons.length === 0 && (priceSensitivity === 'High Sensitivity' || churnProbability >= 60),
      requiresHumanReview: activeSupportRisk || historicalSentiment.includes('angry') || evidenceScore < 40,
      reason: activeSupportRisk
        ? 'Open support risk should be resolved before promotional automation.'
        : evidenceScore < 40
          ? 'Not enough evidence for autonomous personalization.'
          : 'Lifecycle evidence is sufficient for concierge-managed automation.',
    };

    const lifecycleScorecard = {
      dataCompleteness: evidenceScore,
      lifecycleFit: this.scoreBand(
        (cart && cart.items.length > 0 ? 35 : 0) +
        (orders.orders.length > 0 ? 25 : 0) +
        (engagementRate > 0.3 ? 20 : 0) +
        (recentNeeds.length > 0 ? 20 : 0)
      ),
      churnRisk: this.scoreBand(churnProbability),
      valueTier: rfm.monetaryScore >= 4 ? 'vip' : rfm.monetaryScore >= 2 ? 'standard' : 'low_data',
      messageTolerance: recentCampaignTouches >= 3 ? 'low' : engagementRate > 0.5 ? 'high' : 'medium',
      serviceRisk: activeSupportRisk ? 'high' : historicalSentiment.includes('frustrated') || historicalSentiment.includes('angry') ? 'medium' : 'low',
    };

    const campaignBrief = {
      playbookId: nextBestCampaign.playbookId,
      objective: nextBestCampaign.rationale,
      audienceReason: lifecycleSegment,
      messageAngle: suppressionReasons.length > 0
        ? 'Lead with apology, clarity, and support resolution before any sales message.'
        : cart && cart.items.length > 0
          ? `Recover saved cart with ${topCollection} context and a single checkout CTA.`
          : `Use ${topCollection} affinity to make the message feel remembered and useful.`,
      proofPoints: [
        currentCartSignal,
        topProducts.length > 0 ? `Top products: ${topProducts.join(', ')}` : '',
        recentNeeds.length > 0 ? `Recent needs: ${recentNeeds.join('; ')}` : '',
        `RFM ${rfm.recencyScore}/${rfm.frequencyScore}/${rfm.monetaryScore}`,
      ].filter(Boolean),
      offer: recommendedOffer,
      cta: cart && cart.items.length > 0 ? 'Return to saved cart' : activeSupportRisk ? 'Let us help first' : 'View recommendations',
    };

    const experimentationPlan = [
      {
        test: 'message_angle',
        hypothesis: 'Concierge-assist copy will outperform generic promotional copy for hesitant shoppers.',
        metric: 'click_to_order_rate',
      },
      {
        test: 'timing',
        hypothesis: 'Spacing follow-ups based on engagement lowers fatigue while preserving revenue per recipient.',
        metric: 'revenue_per_recipient_and_unsubscribe_rate',
      },
      {
        test: 'offer_depth',
        hypothesis: 'Help-first plus smaller incentives protects margin for customers without high price sensitivity.',
        metric: 'conversion_margin',
      },
    ];

    const frequencyPolicy = {
      cap: lifecycleScorecard.messageTolerance === 'low' ? '1 lifecycle message / 7 days' : lifecycleScorecard.messageTolerance === 'high' ? '3 lifecycle messages / 7 days' : '2 lifecycle messages / 7 days',
      channelPriority: activeSupportRisk ? ['email_service_recovery'] : ['email', 'concierge_push', 'store_notice'],
      suppression: suppressionReasons,
      reason: 'Customer-level capping should manage total brand contact across all active campaigns, not each campaign in isolation.',
    };

    const buyingCycle = {
      avgPurchaseGapDays: avgPurchaseGapDays ? Math.round(avgPurchaseGapDays) : null,
      daysSinceLastPurchase: daysSinceLastPurchase ? Math.round(daysSinceLastPurchase) : null,
      nextExpectedPurchaseInDays: avgPurchaseGapDays && daysSinceLastPurchase !== null
        ? Math.round(avgPurchaseGapDays - daysSinceLastPurchase)
        : null,
      confidence: orders.orders.length >= 3 ? 'high' : orders.orders.length >= 2 ? 'medium' : 'low',
      recommendation: avgPurchaseGapDays && daysSinceLastPurchase !== null && daysSinceLastPurchase > avgPurchaseGapDays * 1.25
        ? 'Customer is beyond their expected buying cycle; prioritize win-back or replenishment.'
        : avgPurchaseGapDays
          ? 'Customer is still inside expected buying cycle; use lighter retention or value-add messaging.'
          : 'Not enough repeat-purchase history; rely on cart, browse, and concierge intent signals.',
    };

    const riskRegister = [
      {
        risk: 'message_fatigue',
        level: lifecycleScorecard.messageTolerance === 'low' ? 'high' : recentCampaignTouches >= 2 ? 'medium' : 'low',
        mitigation: 'Use global frequency caps and only allow the highest-priority lifecycle message through.',
      },
      {
        risk: 'discount_dependency',
        level: discountAffinity > 0.5 ? 'high' : discountAffinity > 0 ? 'medium' : 'low',
        mitigation: 'Lead with service, access, bundling, or recommendations before deeper discounts.',
      },
      {
        risk: 'service_trust',
        level: lifecycleScorecard.serviceRisk,
        mitigation: activeSupportRisk ? 'Suppress promotional outreach until support is resolved.' : 'Keep support-aware tone and invite replies.',
      },
    ];

    // 5. Synthesis
    const narrativeParts = [
      `Customer is a ${psychographic}.`,
      `Primarily attracted to the "${topCollection}".`,
      `CLV: $${(clv / 100).toFixed(2)}.`,
      `Lifecycle segment: ${lifecycleSegment}.`,
      `Current cart signal: ${currentCartSignal}.`,
      `Recommended offer path: ${recommendedOffer}`,
      pathToPurchase.includes('Checkout') ? 'URGENT: Abandoned at checkout.' : '',
      historicalSentiment.includes('frustrated') ? 'Historical frustration detected.' : '',
      suppressionReasons.length > 0 ? `Suppressions: ${suppressionReasons.join(', ')}.` : ''
    ].filter(Boolean);

    return {
      clv,
      priceSensitivity,
      discountAffinity,
      psychographic,
      churnProbability,
      pathToPurchase,
      cohortStanding,
      lifecycleType,
      lifecycleSegment,
      topCollection,
      topProducts,
      cartValue,
      cartAgeHours,
      cartCategories,
      currentCartSignal,
      rfm,
      historicalSentiment,
      recentSupportCategories,
      recentNeeds,
      activeSupportRisk,
      suppressionReasons,
      intentSignals,
      nextBestCampaign,
      recommendedOffer,
      lifecycleTimeline,
      automationAuthority,
      lifecycleScorecard,
      campaignBrief,
      experimentationPlan,
      frequencyPolicy,
      buyingCycle,
      riskRegister,
      evidenceScore,
      confidenceBand: this.scoreBand(evidenceScore),
      recentCampaignTouches,
      engagementScore: Math.round(engagementRate * 100),
      narrative: narrativeParts.join(' '),
      summary: `CLV: $${(clv/100).toFixed(2)}. Segment: ${lifecycleSegment}. Next best campaign: ${nextBestCampaign.type}.`
    };
  }
}
