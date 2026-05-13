/**
 * [LAYER: CORE]
 * Lifecycle marketing playbooks for concierge-managed recapture campaigns.
 */
import type {
  CampaignChannel,
  CampaignLifecycleStage,
  CampaignOfferStrategy,
  CampaignType,
  MarketingCampaign,
  MarketingCampaignDraft,
} from '@domain/models';

export interface LifecyclePlaybookStep {
  delayHours: number;
  channel: CampaignChannel;
  objective: NonNullable<MarketingCampaign['steps'][number]['objective']>;
  offerStrategy: CampaignOfferStrategy;
  subjectTemplate: string;
  bodyTemplate: string;
}

export interface LifecyclePlaybook {
  id: string;
  name: string;
  type: CampaignType;
  lifecycleStage: CampaignLifecycleStage;
  description: string;
  triggerSummary: string;
  audience: string;
  offerStrategy: CampaignOfferStrategy;
  priority: number;
  frequencyCapDays: number;
  conversionWindowDays: number;
  expectedOutcome: string;
  conciergeAutonomy: string;
  successMetrics?: string[];
  segmentationSplits?: string[];
  frequencyGuidance?: string;
  steps: LifecyclePlaybookStep[];
}

export interface ConciergeMarketingStrategy {
  summary: string;
  guardrails: string[];
  industryPatterns: string[];
  playbooks: LifecyclePlaybook[];
  automationControls: Array<{
    id: string;
    label: string;
    description: string;
    scope: 'strategy' | 'playbook' | 'customer';
    risk: 'low' | 'medium' | 'high';
  }>;
  operatingModel: {
    decisioning: string[];
    frequencyPolicy: string[];
    suppressionPolicy: string[];
    experimentation: string[];
    lifecycleHealthChecks: string[];
  };
  coverage: Array<{
    playbookId: string;
    name: string;
    status: 'active' | 'draft' | 'missing';
    campaignId?: string;
    health: 'ready' | 'needs_review' | 'missing';
    recommendation: string;
  }>;
  funnelMap: Array<{
    stage: CampaignLifecycleStage;
    goal: string;
    conciergeAction: string;
  }>;
}

export const LIFECYCLE_PLAYBOOKS: LifecyclePlaybook[] = [
  {
    id: 'welcome_series_foundation',
    name: 'Welcome Series Foundation',
    type: 'welcome_series',
    lifecycleStage: 'acquisition',
    description: 'Convert new subscribers into first-time buyers with brand trust, category guidance, and a measured first-purchase nudge.',
    triggerSummary: 'New subscriber, account creation, or first identified visitor with marketing consent.',
    audience: 'New leads and customers with no completed orders.',
    offerStrategy: 'help_first',
    priority: 8,
    frequencyCapDays: 1,
    conversionWindowDays: 14,
    expectedOutcome: 'Build trust, collect preference signals, and guide first purchase without immediate over-discounting.',
    conciergeAutonomy: 'Concierge can ask preference questions, recommend starter collections, and offer a small first-order incentive only after engagement.',
    steps: [
      {
        delayHours: 0,
        channel: 'email',
        objective: 'concierge_assist',
        offerStrategy: 'help_first',
        subjectTemplate: 'Welcome to DreamBees',
        bodyTemplate: '<p>Hi {{firstName}}, welcome in. I can help you find the best starting point based on what you collect, gift, or display.</p>',
      },
      {
        delayHours: 24,
        channel: 'email',
        objective: 'social_proof',
        offerStrategy: 'social_proof',
        subjectTemplate: 'A quick guide to our studio favorites',
        bodyTemplate: '<p>Here are the collections customers usually start with, plus why each one works for a different kind of collector.</p>',
      },
      {
        delayHours: 72,
        channel: 'email',
        objective: 'incentive',
        offerStrategy: 'tiered_discount',
        subjectTemplate: 'A small welcome gesture',
        bodyTemplate: '<p>If you found something you like, I added a modest first-order gesture you can use before the week ends.</p>',
      },
    ],
  },
  {
    id: 'cart_recovery_three_touch',
    name: 'Three-Touch Cart Recovery',
    type: 'abandoned_cart',
    lifecycleStage: 'conversion',
    description: 'Recover carts with a reminder, objection handling, then a controlled last-call incentive.',
    triggerSummary: 'Cart has items and no purchase after the configured delay.',
    audience: 'Known shoppers with active carts, excluding recent purchasers and people already inside this flow.',
    offerStrategy: 'tiered_discount',
    priority: 9,
    frequencyCapDays: 2,
    conversionWindowDays: 7,
    expectedOutcome: 'Recover high-intent shoppers without training every customer to wait for a coupon.',
    conciergeAutonomy: 'Concierge can personalize the reason to return, offer help, and apply the smallest eligible incentive.',
    steps: [
      {
        delayHours: 1,
        channel: 'email',
        objective: 'reminder',
        offerStrategy: 'help_first',
        subjectTemplate: 'Still thinking it over?',
        bodyTemplate: '<p>Hi {{firstName}}, I saved the pieces you were looking at so you can pick up where you left off.</p><p>If shipping, fit, or timing was the blocker, reply and I can help.</p>',
      },
      {
        delayHours: 24,
        channel: 'email',
        objective: 'objection_handling',
        offerStrategy: 'social_proof',
        subjectTemplate: 'A quick note about your cart',
        bodyTemplate: '<p>Your cart is still here. These picks line up with your recent interest in {{topCollection}}.</p><p>Customers usually ask about delivery timing at this stage, so I can check that for you before you order.</p>',
      },
      {
        delayHours: 72,
        channel: 'email',
        objective: 'last_call',
        offerStrategy: 'tiered_discount',
        subjectTemplate: 'Last call on your saved cart',
        bodyTemplate: '<p>I can hold this recommendation a little longer. If a small nudge helps, use the offer shown at checkout before it expires.</p>',
      },
    ],
  },
  {
    id: 'post_purchase_care',
    name: 'Post-Purchase Care',
    type: 'post_purchase',
    lifecycleStage: 'retention',
    description: 'Turn a first purchase into a relationship with thank-you, care guidance, delivery reassurance, and next-best education.',
    triggerSummary: 'Placed order, split by first-time versus returning customer and product category.',
    audience: 'Customers with a recently placed order, excluding active fulfillment issues.',
    offerStrategy: 'help_first',
    priority: 8,
    frequencyCapDays: 2,
    conversionWindowDays: 21,
    expectedOutcome: 'Reduce buyer anxiety, increase satisfaction, and create the next purchase path.',
    conciergeAutonomy: 'Concierge can send care instructions, answer shipping questions, and recommend usage or pairing ideas after delivery.',
    steps: [
      {
        delayHours: 0,
        channel: 'email',
        objective: 'concierge_assist',
        offerStrategy: 'help_first',
        subjectTemplate: 'Your DreamBees order is in the studio queue',
        bodyTemplate: '<p>Thank you for your order. I will keep an eye on the details and can help if anything needs a closer look before it ships.</p>',
      },
      {
        delayHours: 96,
        channel: 'email',
        objective: 'objection_handling',
        offerStrategy: 'help_first',
        subjectTemplate: 'A few notes for when your order arrives',
        bodyTemplate: '<p>Here are the care and display notes that match what you ordered, plus how to reach me if anything feels off.</p>',
      },
    ],
  },
  {
    id: 'review_and_referral_request',
    name: 'Review and Referral Request',
    type: 'review_request',
    lifecycleStage: 'loyalty',
    description: 'Ask satisfied customers for proof, feedback, and referrals after delivery confidence is high.',
    triggerSummary: 'Order delivered or estimated delivery window has passed without support risk.',
    audience: 'Delivered customers with neutral or positive support sentiment.',
    offerStrategy: 'social_proof',
    priority: 5,
    frequencyCapDays: 14,
    conversionWindowDays: 30,
    expectedOutcome: 'Collect social proof while catching service issues before they become public complaints.',
    conciergeAutonomy: 'Concierge can route happy customers to review/referral and unhappy customers to service recovery.',
    steps: [
      {
        delayHours: 168,
        channel: 'email',
        objective: 'social_proof',
        offerStrategy: 'social_proof',
        subjectTemplate: 'How did your DreamBees piece land?',
        bodyTemplate: '<p>If everything arrived beautifully, your review helps other collectors choose with confidence. If not, reply here and I will help first.</p>',
      },
    ],
  },
  {
    id: 'replenishment_or_next_best_cross_sell',
    name: 'Replenishment / Next-Best Cross-Sell',
    type: 'replenishment',
    lifecycleStage: 'retention',
    description: 'Predict the next useful purchase window from order cadence, category affinity, and cart behavior.',
    triggerSummary: 'Expected reorder/pairing window opens based on product category or average time between orders.',
    audience: 'Customers with at least one completed order and no active cart recovery sequence.',
    offerStrategy: 'bundle_value',
    priority: 6,
    frequencyCapDays: 10,
    conversionWindowDays: 21,
    expectedOutcome: 'Drive repeat purchase through useful pairings, restocks, and collection completion.',
    conciergeAutonomy: 'Concierge can choose restock, complement, or bundle messaging from the customer investigation.',
    steps: [
      {
        delayHours: 720,
        channel: 'email',
        objective: 'concierge_assist',
        offerStrategy: 'bundle_value',
        subjectTemplate: 'A few next picks for {{topCollection}}',
        bodyTemplate: '<p>Based on your last order, these are the most natural next pieces to pair, refill, or complete the set.</p>',
      },
      {
        delayHours: 888,
        channel: 'email',
        objective: 'incentive',
        offerStrategy: 'bundle_value',
        subjectTemplate: 'Bundle the next piece',
        bodyTemplate: '<p>If you are building out this collection, the bundle path gives you the cleanest value without guessing.</p>',
      },
    ],
  },
  {
    id: 'browse_abandonment_light_touch',
    name: 'Browse Abandonment Assist',
    type: 'browse_abandonment',
    lifecycleStage: 'consideration',
    description: 'Bring product viewers back with a lighter, helpful touch before discounting.',
    triggerSummary: 'Product viewed without cart add, checkout start, or purchase.',
    audience: 'Known visitors with product interest but lower intent than cart abandoners.',
    offerStrategy: 'help_first',
    priority: 6,
    frequencyCapDays: 7,
    conversionWindowDays: 5,
    expectedOutcome: 'Convert research behavior into a cart add while avoiding over-messaging.',
    conciergeAutonomy: 'Concierge recommends buying guides, collection context, and adjacent products.',
    steps: [
      {
        delayHours: 3,
        channel: 'email',
        objective: 'concierge_assist',
        offerStrategy: 'help_first',
        subjectTemplate: 'Want help choosing?',
        bodyTemplate: '<p>I noticed you were comparing pieces in {{topCollection}}. I can point you toward the best fit for your use case.</p>',
      },
      {
        delayHours: 48,
        channel: 'email',
        objective: 'social_proof',
        offerStrategy: 'social_proof',
        subjectTemplate: 'A few favorites from {{topCollection}}',
        bodyTemplate: '<p>Here are a few collection notes and pairings customers come back to most often.</p>',
      },
    ],
  },
  {
    id: 'comeback_offer_segmented',
    name: 'Segmented Comeback Offer',
    type: 'comeback_offer',
    lifecycleStage: 'winback',
    description: 'Win back lapsed customers with RFM-aware messaging and incentives matched to margin risk.',
    triggerSummary: 'No purchase for 45-90 days, adjusted by previous purchase cadence.',
    audience: 'Customers whose expected reorder window has passed and who are not in an open support issue.',
    offerStrategy: 'bundle_value',
    priority: 7,
    frequencyCapDays: 14,
    conversionWindowDays: 14,
    expectedOutcome: 'Reactivate customers through remembered preferences instead of generic blasts.',
    conciergeAutonomy: 'Concierge chooses between early access, bundle value, or a modest comeback code based on sensitivity.',
    steps: [
      {
        delayHours: 0,
        channel: 'email',
        objective: 'concierge_assist',
        offerStrategy: 'vip_access',
        subjectTemplate: 'I found a few pieces that match your taste',
        bodyTemplate: '<p>Hi {{firstName}}, based on your past interest in {{topCollection}}, I pulled together a small comeback edit.</p>',
      },
      {
        delayHours: 168,
        channel: 'email',
        objective: 'incentive',
        offerStrategy: 'bundle_value',
        subjectTemplate: 'A comeback bundle for {{topCollection}}',
        bodyTemplate: '<p>If you are restocking or pairing with your last order, this bundle is the best value path.</p>',
      },
    ],
  },
  {
    id: 'vip_loyalty_reactivation',
    name: 'VIP Loyalty Reactivation',
    type: 'loyalty_reward',
    lifecycleStage: 'loyalty',
    description: 'Protect high-value customers with concierge-first outreach before discounting.',
    triggerSummary: 'High RFM monetary score with falling recency or declining engagement.',
    audience: 'Top spenders, collectors, and repeat customers showing signs of cooling.',
    offerStrategy: 'vip_access',
    priority: 10,
    frequencyCapDays: 21,
    conversionWindowDays: 21,
    expectedOutcome: 'Preserve lifetime value through recognition, early access, and service recovery.',
    conciergeAutonomy: 'Concierge sends a personal check-in, early access preview, or service recovery path.',
    steps: [
      {
        delayHours: 0,
        channel: 'email',
        objective: 'concierge_assist',
        offerStrategy: 'vip_access',
        subjectTemplate: 'A private note from DreamBees',
        bodyTemplate: '<p>You have been one of our most consistent collectors. I set aside a few recommendations before they hit the broader list.</p>',
      },
    ],
  },
  {
    id: 'sunset_deliverability_protection',
    name: 'Sunset and Preference Reset',
    type: 'sunset',
    lifecycleStage: 'sunset',
    description: 'Protect deliverability and trust by reducing or ending outreach to chronically inactive subscribers.',
    triggerSummary: 'Long-term email inactivity with no purchases, no clicks, and no support activity.',
    audience: 'Dormant subscribers beyond the normal win-back window.',
    offerStrategy: 'none',
    priority: 3,
    frequencyCapDays: 30,
    conversionWindowDays: 7,
    expectedOutcome: 'Preserve sender reputation while giving customers a clear final preference choice.',
    conciergeAutonomy: 'Concierge can ask for updated preferences, reduce cadence, or suppress future marketing.',
    steps: [
      {
        delayHours: 0,
        channel: 'email',
        objective: 'last_call',
        offerStrategy: 'none',
        subjectTemplate: 'Should I keep sending these?',
        bodyTemplate: '<p>If DreamBees is still useful to you, choose what you want to hear about. Otherwise I will quiet things down.</p>',
      },
    ],
  },
];

const PLAYBOOK_OPERATING_DETAILS: Record<string, Pick<LifecyclePlaybook, 'successMetrics' | 'segmentationSplits' | 'frequencyGuidance'>> = {
  welcome_series_foundation: {
    successMetrics: ['first_purchase_rate', 'preference_capture_rate', 'welcome_click_rate', 'unsubscribe_rate'],
    segmentationSplits: ['no_purchase_vs_prior_customer', 'category_interest', 'engaged_vs_unengaged', 'discount_sensitive_vs_full_price'],
    frequencyGuidance: 'Start immediately, then space follow-ups by at least 1 day unless the customer replies.',
  },
  cart_recovery_three_touch: {
    successMetrics: ['cart_recovery_rate', 'revenue_per_recipient', 'click_to_order_rate', 'discount_margin_impact'],
    segmentationSplits: ['first_time_vs_returning', 'cart_value_band', 'checkout_started_vs_cart_only', 'discount_sensitivity'],
    frequencyGuidance: 'Use 2-3 touches with the first message within hours, then 1-day spacing and a final last-call only when appropriate.',
  },
  browse_abandonment_light_touch: {
    successMetrics: ['browse_to_cart_rate', 'product_click_rate', 'assisted_reply_rate', 'unsubscribe_rate'],
    segmentationSplits: ['category_interest', 'repeat_views', 'known_customer_vs_subscriber', 'recent_campaign_touch_count'],
    frequencyGuidance: 'Keep browse abandonment lighter than cart recovery; stop if a cart or purchase appears.',
  },
  post_purchase_care: {
    successMetrics: ['repeat_purchase_rate', 'support_deflection_rate', 'delivery_satisfaction', 'cross_sell_click_rate'],
    segmentationSplits: ['first_order_vs_repeat', 'physical_vs_digital', 'category', 'delivery_risk'],
    frequencyGuidance: 'Send immediately for reassurance, then after fulfillment/delivery windows so it does not collide with transactional updates.',
  },
  review_and_referral_request: {
    successMetrics: ['review_rate', 'referral_click_rate', 'negative_feedback_capture', 'support_recovery_rate'],
    segmentationSplits: ['delivered_no_ticket', 'positive_sentiment', 'repeat_customer', 'high_value_order'],
    frequencyGuidance: 'Wait until delivery confidence is high; suppress if there is any active support issue.',
  },
  replenishment_or_next_best_cross_sell: {
    successMetrics: ['repeat_purchase_rate', 'next_best_product_click_rate', 'bundle_attach_rate', 'revenue_per_recipient'],
    segmentationSplits: ['refill_vs_complement', 'time_between_orders', 'top_collection', 'price_sensitivity'],
    frequencyGuidance: 'Base timing on buying cycle, not a generic date; suppress active cart recovery and win-back overlap.',
  },
  comeback_offer_segmented: {
    successMetrics: ['reactivation_rate', 'revenue_per_recipient', 'discount_usage_rate', 'unsubscribe_rate'],
    segmentationSplits: ['days_since_last_order', 'rfm_band', 'discount_sensitivity', 'last_category'],
    frequencyGuidance: 'Start after the expected buying cycle passes; use 2-month and 3-month style reactivation windows as starting points.',
  },
  vip_loyalty_reactivation: {
    successMetrics: ['vip_repeat_rate', 'early_access_click_rate', 'retention_rate_90d', 'assisted_revenue'],
    segmentationSplits: ['monetary_score', 'purchase_frequency', 'cooling_engagement', 'support_sentiment'],
    frequencyGuidance: 'Use lower volume and higher relevance; recognition and access should come before discounts.',
  },
  sunset_deliverability_protection: {
    successMetrics: ['preference_update_rate', 'suppression_rate', 'spam_complaint_rate', 'deliverability_health'],
    segmentationSplits: ['no_clicks', 'no_opens', 'no_purchase', 'high_frequency_low_engagement'],
    frequencyGuidance: 'Use a short final sequence, then suppress inactive profiles that do not re-engage.',
  },
};

function enrichPlaybook(playbook: LifecyclePlaybook): LifecyclePlaybook {
  return {
    ...playbook,
    ...PLAYBOOK_OPERATING_DETAILS[playbook.id],
  };
}

export function buildCampaignDraftFromPlaybook(playbookId: string): MarketingCampaignDraft {
  const basePlaybook = LIFECYCLE_PLAYBOOKS.find((p) => p.id === playbookId);
  if (!basePlaybook) throw new Error(`Unknown lifecycle playbook: ${playbookId}`);
  const playbook = enrichPlaybook(basePlaybook);

  return {
    name: playbook.name,
    description: playbook.description,
    type: playbook.type,
    status: 'draft',
    channels: Array.from(new Set(playbook.steps.map((step) => step.channel))),
    triggerType: ['abandoned_cart', 'browse_abandonment', 'post_purchase'].includes(playbook.type) ? 'event' : 'segment',
    triggerConfig: {
      delayHours: playbook.steps[0]?.delayHours ?? 0,
      inactivityDays: playbook.type === 'comeback_offer' ? 45 : playbook.type === 'sunset' ? 180 : undefined,
      minimumCartValue: playbook.type === 'abandoned_cart' ? 2500 : undefined,
    },
    aiPersonalizationEnabled: true,
    subjectTemplate: playbook.steps[0]?.subjectTemplate,
    bodyTemplate: playbook.steps[0]?.bodyTemplate,
    goalType: 'purchase',
    conversionWindowDays: playbook.conversionWindowDays,
    lifecycleStage: playbook.lifecycleStage,
    offerStrategy: playbook.offerStrategy,
    suppressionRules: {
      excludeRecentPurchasersDays: playbook.type === 'abandoned_cart' ? 1 : 14,
      excludeActiveTicket: true,
      excludeRecentCampaignDays: playbook.frequencyCapDays,
      requireConsent: true,
    },
    learningObjective: `${playbook.expectedOutcome} Metrics: ${(playbook.successMetrics || []).join(', ')}.`,
    isSequence: playbook.steps.length > 1,
    steps: playbook.steps.map((step, index) => ({
      id: `${playbook.id}_step_${index + 1}`,
      delayHours: step.delayHours,
      subjectTemplate: step.subjectTemplate,
      bodyTemplate: step.bodyTemplate,
      channel: step.channel,
      objective: step.objective,
      offerStrategy: step.offerStrategy,
      isSplitTest: index === 0,
      variants: index === 0 ? [
        {
          id: `${playbook.id}_control`,
          weight: 50,
          subjectTemplate: step.subjectTemplate,
          bodyTemplate: step.bodyTemplate,
          sentCount: 0,
          conversionCount: 0,
        },
        {
          id: `${playbook.id}_assist`,
          weight: 50,
          subjectTemplate: step.subjectTemplate.replace('?', ''),
          bodyTemplate: `${step.bodyTemplate}<p>Reply to this note if you want the concierge to check availability or timing.</p>`,
          sentCount: 0,
          conversionCount: 0,
        },
      ] : undefined,
    })),
    frequencyCapDays: playbook.frequencyCapDays,
    priority: playbook.priority,
    dynamicIncentivesEnabled: playbook.offerStrategy === 'tiered_discount' || playbook.offerStrategy === 'bundle_value',
    incentiveRules: playbook.offerStrategy === 'tiered_discount' ? [
      { minRfmScore: 3, discountCode: 'COMEBACK5' },
      { minRfmScore: 8, discountCode: 'VIP10' },
    ] : playbook.offerStrategy === 'bundle_value' ? [
      { minRfmScore: 4, discountCode: 'BUNDLEVALUE' },
      { minRfmScore: 9, discountCode: 'VIPBUNDLE' },
    ] : undefined,
  };
}

export function buildConciergeMarketingStrategy(campaigns: MarketingCampaign[]): ConciergeMarketingStrategy {
  const coverage = LIFECYCLE_PLAYBOOKS.map((playbook) => {
    const campaign = campaigns.find((c) => c.type === playbook.type && c.lifecycleStage === playbook.lifecycleStage);
    const status: 'active' | 'draft' | 'missing' = campaign?.status === 'active' ? 'active' : campaign ? 'draft' : 'missing';
    const health: 'ready' | 'needs_review' | 'missing' = status === 'active' ? 'ready' : status === 'draft' ? 'needs_review' : 'missing';
    return {
      playbookId: playbook.id,
      name: playbook.name,
      status,
      campaignId: campaign?.id,
      health,
      recommendation: status === 'active'
        ? 'Monitor conversion rate, revenue per recipient, and assisted replies weekly.'
        : status === 'draft'
          ? 'Review copy, consent rules, incentive limits, then activate.'
          : 'Create this playbook to close a lifecycle coverage gap.',
    };
  });

  const activeCoverage = coverage.filter((item) => item.status === 'active').length;
  const enrichedPlaybooks = LIFECYCLE_PLAYBOOKS.map(enrichPlaybook);

  return {
    summary: `${activeCoverage}/${LIFECYCLE_PLAYBOOKS.length} lifecycle playbooks are active. A complete concierge strategy should cover welcome, cart recovery, browse assist, post-purchase care, review/referral, cross-sell or replenishment, win-back, VIP protection, and sunset suppression.`,
    guardrails: [
      'Suppress recent purchasers, active support escalations, unsubscribed profiles, and shoppers already inside another sequence.',
      'Use help-first messaging before discounts; reserve incentives for later steps or high churn risk.',
      'Keep abandoned cart focused on the exact cart and use browse abandonment as a lighter recommendation flow.',
      'Cap marketing frequency across campaigns so autonomous concierge outreach feels personal, not noisy.',
      'Attribute purchases inside each campaign conversion window and keep A/B tests tied to one learning objective.',
      'Advance lifecycle stages based on behavior and consent; never move a customer backward unless the automation is explicitly a reactivation or suppression flow.',
    ],
    industryPatterns: [
      'Foundation flows: welcome series, abandoned cart, and customer win-back are the baseline lifecycle automations.',
      'Expansion flows: browse abandonment, post-purchase care, review request, cross-sell, replenishment, and sunset flows increase lifetime value and protect deliverability.',
      'Post-purchase automation should split first-time and returning customers, then branch into care, review, cross-sell, and support recovery.',
      'Win-back timing should follow the store buying cycle rather than a fixed generic date for every category.',
      'Lifecycle segmentation should include new, active, VIP, at-risk, dormant, and suppressed customers.',
    ],
    playbooks: enrichedPlaybooks,
    automationControls: [
      {
        id: 'create_missing_lifecycle_playbooks',
        label: 'Create Missing Lifecycle Drafts',
        description: 'Generate every missing core lifecycle campaign as a draft using the concierge playbook catalog.',
        scope: 'strategy',
        risk: 'medium',
      },
      {
        id: 'deep_investigate_customer_lifecycle',
        label: 'Deep Investigate Customer Lifecycle',
        description: 'Build a customer-level lifecycle diagnosis with next-best campaign, offer, suppressions, and evidence score.',
        scope: 'customer',
        risk: 'low',
      },
      {
        id: 'pause_or_suppress_customer_marketing',
        label: 'Suppress Risky Outreach',
        description: 'Route unresolved support, angry sentiment, or over-frequency into service recovery instead of promotional messaging.',
        scope: 'customer',
        risk: 'medium',
      },
      {
        id: 'run_lifecycle_automation_pulse',
        label: 'Run Lifecycle Automation Pulse',
        description: 'Evaluate active playbooks now and let the concierge process eligible customers.',
        scope: 'strategy',
        risk: 'medium',
      },
      {
        id: 'activate_all_reviewed_playbooks',
        label: 'Activate Reviewed Lifecycle Playbooks',
        description: 'Turn reviewed lifecycle drafts active so the concierge can manage the full strategy.',
        scope: 'strategy',
        risk: 'high',
      },
    ],
    operatingModel: {
      decisioning: [
        'Choose the next-best lifecycle path by intent, RFM, churn risk, support sentiment, cart state, and recent message volume.',
        'Prioritize service recovery over promotions when trust is damaged.',
        'Prefer the smallest useful incentive and lead with helpful context before discounting.',
      ],
      frequencyPolicy: [
        'Apply global customer-level caps across campaigns and channels, not only per campaign.',
        'Tighten caps for low engagement and loosen carefully for high engagement or transactional utility.',
        'Keep at least 1 day between most lifecycle emails unless the message is immediate welcome, cart, or post-purchase reassurance.',
      ],
      suppressionPolicy: [
        'Suppress unsubscribed, marketing-suppressed, angry, unresolved support, recent purchaser, and active sequence customers.',
        'Suppress browse abandonment when a cart exists; suppress cart recovery after purchase.',
        'Route sunset and inactive customers to preference reset before permanent promotional suppression.',
      ],
      experimentation: [
        'Test one variable at a time: delay, subject, offer, CTA, or channel.',
        'Tie each split test to a named learning objective and conversion window.',
        'Use revenue per recipient, unsubscribe rate, and long-term retention together instead of optimizing only opens.',
      ],
      lifecycleHealthChecks: [
        'Weekly: coverage gaps, paused flows, conversion rate, revenue per recipient, unsubscribe/spam risk.',
        'Monthly: buying-cycle assumptions, RFM thresholds, discount margin impact, VIP retention, win-back timing.',
        'Quarterly: sunset rules, preference taxonomy, deliverability, and lifecycle stage definitions.',
      ],
    },
    coverage,
    funnelMap: [
      {
        stage: 'reach',
        goal: 'Turn anonymous or low-context visitors into known, consented contacts.',
        conciergeAction: 'Capture preferences, answer first questions, and avoid pressure before intent exists.',
      },
      {
        stage: 'acquisition',
        goal: 'Welcome new subscribers and guide first purchase.',
        conciergeAction: 'Use the welcome series to explain the studio, collect category interests, and recommend starter collections.',
      },
      {
        stage: 'intent_capture',
        goal: 'Identify high-intent sessions from chat, cart, checkout, and product-view behavior.',
        conciergeAction: 'Classify intent, detect objections, and avoid outreach when support risk is unresolved.',
      },
      {
        stage: 'consideration',
        goal: 'Move product researchers toward a cart add.',
        conciergeAction: 'Offer collection guidance, comparisons, availability checks, and social proof.',
      },
      {
        stage: 'conversion',
        goal: 'Recover abandoned carts and checkout hesitation.',
        conciergeAction: 'Remind, handle objections, then apply the smallest eligible offer if needed.',
      },
      {
        stage: 'retention',
        goal: 'Turn first purchases into repeat purchases and lower post-purchase anxiety.',
        conciergeAction: 'Send care guidance, delivery reassurance, review routing, and next-best product recommendations.',
      },
      {
        stage: 'winback',
        goal: 'Bring lapsed customers back with remembered preferences.',
        conciergeAction: 'Generate tailored comeback edits and incentive paths by RFM and price sensitivity.',
      },
      {
        stage: 'loyalty',
        goal: 'Protect high-value customers before churn.',
        conciergeAction: 'Send recognition-led outreach, early access, and proactive service recovery.',
      },
      {
        stage: 'sunset',
        goal: 'Protect deliverability and trust when engagement disappears.',
        conciergeAction: 'Ask for preference updates, reduce cadence, or suppress future promotion.',
      },
    ],
  };
}
