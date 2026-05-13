# Concierge Lifecycle Marketing & Campaign Automation

This page documents the autonomous lifecycle marketing layer that lets the DreamBees Concierge plan, draft, activate, optimize, and govern customer recapture campaigns from the admin backend.

The system is designed around familiar lifecycle marketing patterns used by ecommerce platforms and customer engagement tools: welcome, cart recovery, browse assist, post-purchase care, review/referral, replenishment, win-back, VIP loyalty, and sunset suppression. The Concierge can use these patterns as playbooks, but every send still runs through customer-level evidence, consent, frequency, suppression, and journey-conflict checks.

## Goals

- Give admins a full lifecycle campaign strategy that the Concierge can manage.
- Create personalized recapture paths for abandoned cart, comeback, browse abandonment, VIP, post-purchase, review, replenishment, and sunset scenarios.
- Improve "dig deeper" investigation into a customer-level marketing decision brief.
- Let the Concierge reason from RFM, churn risk, CLV, cart state, support sentiment, campaign history, offer sensitivity, and recent message pressure.
- Use help-first messaging before incentives, with dynamic offer depth only when the evidence supports it.
- Protect trust and deliverability through consent, support-risk suppression, global frequency caps, holdouts, and sunset rules.

## Key Files

| Layer | File | Responsibility |
| --- | --- | --- |
| Domain | `src/domain/models.ts` | Campaign, event, segment, lifecycle-stage, offer-strategy, and step contracts. |
| Domain | `src/domain/repositories.ts` | `ICampaignRepository`, `ICampaignEventRepository`, `ICustomerSegmentRepository`. |
| Core | `src/core/marketing/MarketingStrategy.ts` | Lifecycle playbook catalog and concierge strategy map. |
| Core | `src/core/marketing/MarketingIntelligence.ts` | Deep customer investigation, RFM/churn/CLV, next-best action, risk, and lifecycle planning evidence. |
| Core | `src/core/marketing/MarketingPersonalization.ts` | AI copy personalization using customer evidence and campaign context. |
| Core | `src/core/marketing/CampaignService.ts` | Campaign orchestration, automation pulse, playbook management, attribution, and enrollment. |
| Infra | `src/infrastructure/repositories/firestore/FirestoreCampaignRepository.ts` | Firestore `marketingCampaigns` persistence. |
| Infra | `src/infrastructure/repositories/firestore/FirestoreCampaignEventRepository.ts` | Firestore `campaignEvents` persistence and scheduled-step queries. |
| Infra | `src/infrastructure/repositories/firestore/FirestoreCustomerSegmentRepository.ts` | Firestore `customerSegments` persistence. |
| API | `src/app/api/admin/concierge/marketing-strategy/route.ts` | Admin strategy endpoint for coverage, drafting, activation, optimization, planning, and enrollment. |
| Concierge API | `src/app/api/concierge/chat/route.ts` | Parses and executes lifecycle tool tokens from Concierge responses. |
| Prompt | `src/domain/concierge/systemPrompt.ts` | Tool contract and governance rules for the Concierge. |
| Admin UI | `src/ui/pages/admin/AdminConciergeInsights.tsx` | Recovery Funnels tab and lifecycle strategy controls. |

## Domain Model

Campaign types live in `CampaignType`:

- `welcome_series`
- `abandoned_cart`
- `browse_abandonment`
- `site_abandonment`
- `post_purchase`
- `replenishment`
- `review_request`
- `comeback_offer`
- `product_upsell`
- `loyalty_reward`
- `cross_sell`
- `win_back`
- `sunset`

Lifecycle stages live in `CampaignLifecycleStage`:

- `reach`
- `acquisition`
- `intent_capture`
- `consideration`
- `conversion`
- `retention`
- `winback`
- `loyalty`
- `sunset`

Offer strategies live in `CampaignOfferStrategy`:

- `none`
- `social_proof`
- `help_first`
- `free_shipping`
- `tiered_discount`
- `bundle_value`
- `vip_access`

`MarketingCampaign` includes:

- `triggerType` and `triggerConfig`
- `channels`
- `aiPersonalizationEnabled`
- `goalType` and `conversionWindowDays`
- `lifecycleStage`
- `offerStrategy`
- `suppressionRules`
- `learningObjective`
- sequence `steps`
- `frequencyCapDays`
- `priority`
- `dynamicIncentivesEnabled`
- `incentiveRules`
- denormalized metrics: sent, clicked, converted, revenue

`CampaignStep` includes:

- `delayHours`
- `channel`
- `objective`
- `offerStrategy`
- subject/body templates
- split-test variants

`CampaignEvent` stores the actual send snapshot, sequence state, conversion attribution, and `personalizedMetadata`.

## Firestore Collections

### `marketingCampaigns`

Stores campaign definitions created from lifecycle playbooks or later admin edits.

Important fields:

- `type`
- `status`
- `lifecycleStage`
- `offerStrategy`
- `triggerConfig`
- `suppressionRules`
- `steps`
- `frequencyCapDays`
- `priority`
- `sentCount`
- `clickCount`
- `conversionCount`
- `revenueGenerated`

### `campaignEvents`

Stores every campaign execution event and future sequence step marker.

Important fields:

- `campaignId`
- `userId`
- `customerEmail`
- `channel`
- `status`
- `stepIndex`
- `variantId`
- `nextStepDueAt`
- `subject`
- `body`
- `personalizedMetadata`
- `relatedOrderId`
- `conversionValue`
- `sentAt`
- `clickedAt`
- `convertedAt`

### `customerSegments`

Stores dynamic or manual segment definitions for future campaign expansion.

## Lifecycle Playbook Catalog

Defined in `MarketingStrategy.ts` as `LIFECYCLE_PLAYBOOKS`.

| Playbook ID | Stage | Type | Purpose |
| --- | --- | --- | --- |
| `welcome_series_foundation` | acquisition | `welcome_series` | Convert new subscribers into first-time buyers with trust, category guidance, and measured first-purchase nudges. |
| `cart_recovery_three_touch` | conversion | `abandoned_cart` | Recover high-intent carts through reminder, objection handling, and last-call incentive. |
| `post_purchase_care` | retention | `post_purchase` | Reduce buyer anxiety, support delivery confidence, and create a next purchase path. |
| `review_and_referral_request` | loyalty | `review_request` | Ask satisfied customers for proof and route unhappy customers to service recovery. |
| `replenishment_or_next_best_cross_sell` | retention | `replenishment` | Trigger restock, complement, bundle, or collection-completion messaging from buying-cycle evidence. |
| `browse_abandonment_light_touch` | consideration | `browse_abandonment` | Bring product researchers back with guidance and social proof before discounts. |
| `comeback_offer_segmented` | winback | `comeback_offer` | Reactivate lapsed customers with RFM-aware remembered preferences. |
| `vip_loyalty_reactivation` | loyalty | `loyalty_reward` | Protect high-value customers with recognition, early access, and service-first outreach. |
| `sunset_deliverability_protection` | sunset | `sunset` | Protect deliverability and trust by preference-resetting or suppressing chronically inactive profiles. |

Each playbook defines:

- `triggerSummary`
- `audience`
- `offerStrategy`
- `priority`
- `frequencyCapDays`
- `conversionWindowDays`
- `expectedOutcome`
- `conciergeAutonomy`
- sequence `steps`
- success metrics
- segmentation splits
- frequency guidance

## Strategy Map

`buildConciergeMarketingStrategy(campaigns)` returns the admin-facing strategy object:

- `summary`
- `guardrails`
- `industryPatterns`
- `playbooks`
- `automationControls`
- `operatingModel`
- `coverage`
- `funnelMap`

Coverage is calculated by matching existing campaigns by `type` and `lifecycleStage`.

Coverage statuses:

- `missing`: no campaign exists for the playbook.
- `draft`: campaign exists but is not active.
- `active`: campaign exists and is active.

Health statuses:

- `missing`
- `needs_review`
- `ready`

## Operating Model

The lifecycle strategy includes these governance groups:

- `decisioning`
- `frequencyPolicy`
- `suppressionPolicy`
- `journeyConflictPolicy`
- `measurementPolicy`
- `experimentation`
- `lifecycleHealthChecks`

The important rule is that the Concierge should manage a customer's total lifecycle relationship, not isolated campaigns. Cart recovery, win-back, browse abandonment, VIP retention, and service recovery can conflict. The system ranks journey priority and only allows the highest-priority eligible path to advance.

Journey priority:

1. service recovery
2. abandoned cart
3. post-purchase
4. VIP loyalty/reactivation
5. comeback/win-back
6. replenishment/cross-sell
7. browse abandonment
8. welcome
9. sunset

## Deep Customer Investigation

`MarketingIntelligence.deepInvestigate(userId)` is the forensic customer lifecycle analysis engine.

It loads:

- recent orders
- active cart
- campaign events
- concierge session memory
- recent sentiment
- recent support categories
- recent needs
- active support risk

It calculates:

- RFM score
- total spend
- recency days
- CLV-like estimate
- churn probability
- average order value
- average purchase gap
- price sensitivity
- discount affinity
- engagement score
- recent campaign touches
- top collection
- top products
- cart value
- cart age
- cart categories
- current cart signal

It returns:

- `lifecycleSegment`
- `nextBestCampaign`
- `recommendedOffer`
- `lifecycleTimeline`
- `automationAuthority`
- `lifecycleScorecard`
- `campaignBrief`
- `experimentationPlan`
- `holdoutPlan`
- `channelMix`
- `frequencyPolicy`
- `buyingCycle`
- `riskRegister`
- `decisioningReasons`
- `nextBestActionQueue`
- `journeyConflictResolution`
- `lifecycleCalendar`
- `evidenceScore`
- `confidenceBand`
- `narrative`
- `summary`

### Next-Best Campaign Logic

Current priority logic:

1. Active support risk -> `service_recovery`.
2. Active cart -> `abandoned_cart` via `cart_recovery_three_touch`.
3. VIP customer with cooling engagement -> `loyalty_reward` via `vip_loyalty_reactivation`.
4. High churn or low recency -> `comeback_offer` via `comeback_offer_segmented`.
5. Default lighter path -> `browse_abandonment` via `browse_abandonment_light_touch`.

### Automation Authority

The investigation returns whether the Concierge may:

- create campaign drafts
- enroll the customer
- send discounts
- proceed autonomously
- require human review

Suppressions are raised for:

- active unresolved support risk
- recent marketing over-frequency
- angry historical sentiment
- low evidence confidence

### Holdout Plan

The system assigns a stable customer/playbook bucket:

- 10% holdout
- 90% treatment

This is intentionally deterministic so the same customer/playbook pair stays in the same measurement group. The purpose is incremental lift measurement rather than pure last-click attribution.

### Journey Conflict Resolution

The investigation detects active sequence locks from `campaignEvents.nextStepDueAt`.

Possible decisions:

- `eligible`
- `hold_lower_priority_journeys`
- `suppress_or_service_first`

## Customer Lifecycle Plan

`CampaignService.planCustomerLifecycle(userId)` wraps the investigation with live strategy coverage.

It returns:

- `userId`
- full `investigation`
- `recommendedPlaybookId`
- `coverage`
- `decisionBrief`
- actionable `actions`

The decision brief includes:

- scorecard
- campaign brief
- frequency policy
- channel mix
- holdout plan
- journey conflict resolution
- ranked next-best action queue
- lifecycle calendar
- experimentation plan

Actions include:

- enroll in recommended lifecycle flow
- activate recommended playbook
- suppress marketing and resolve service risk
- hold lower-priority journeys

## Enrollment

`CampaignService.enrollCustomerInLifecycle(userId, playbookId?)`:

1. Builds a lifecycle plan.
2. Chooses the supplied playbook or the recommended playbook.
3. Rejects enrollment if `automationAuthority.canEnrollCustomer` is false.
4. Requires the campaign to exist.
5. Requires the campaign to be active.
6. Runs `determineNextBestAction`.
7. Executes the first campaign step.

Important: explicit playbook selection does not bypass suppression. A human or Concierge can select a playbook, but the customer must still be eligible.

Possible statuses:

- `no_recommendation`
- `suppressed`
- `missing_campaign`
- `needs_activation`
- `skip_marketing_suppressed`
- `skip_missing_consent`
- `skip_frequency_cap`
- `skip_active_sequence`
- `skip_for_winback`
- `enrolled`

## Campaign Execution

`CampaignService.runAutomationPulse()`:

1. Loads all active campaigns.
2. Evaluates triggers by campaign type.
3. Skips customers who already have events for that campaign.
4. Runs next-best-action checks.
5. Executes eligible first steps.
6. Processes scheduled sequence steps due from `campaignEvents.nextStepDueAt`.

Trigger evaluators:

- `findWelcomeSeriesUsers`
- `findAbandonedCartUsers`
- `findBrowseAbandonmentUsers`
- `findLapsedCustomerUsers`
- `findRetentionOpportunityUsers`

Execution:

- selects campaign step
- applies split-test variant if configured
- loads customer profile
- generates AI personalization when enabled
- skips unavailable email addresses
- creates a `campaignEvents` record
- sends email through `IEmailService`
- marks the event sent
- increments campaign metrics
- writes audit action `campaign_executed`

## Order Attribution

`CampaignService.handleOrderPlaced(order)`:

1. Loads recent campaign events for the user.
2. Finds a non-converted event inside the attribution window.
3. Marks it converted with order id and order value.
4. Increments campaign conversion and revenue metrics.
5. Triggers active post-purchase lifecycle campaigns.

## Admin API

Endpoint: `src/app/api/admin/concierge/marketing-strategy/route.ts`

All calls require the current user to be admin.

### `GET /api/admin/concierge/marketing-strategy`

Returns `getConciergeMarketingStrategy()`.

### `POST /api/admin/concierge/marketing-strategy`

Supported actions:

| Action | Body | Result |
| --- | --- | --- |
| `create_missing_lifecycle_playbooks` | `{ "action": "create_missing_lifecycle_playbooks" }` | Creates all missing playbook drafts. |
| `run_lifecycle_automation_pulse` | `{ "action": "run_lifecycle_automation_pulse" }` | Processes active campaigns and due sequence steps. |
| `optimize_lifecycle_strategy` | `{ "action": "optimize_lifecycle_strategy" }` | Returns strategy scorecard and recommendations. |
| `activate_all_lifecycle_playbooks` | `{ "action": "activate_all_lifecycle_playbooks" }` | Creates/activates all lifecycle playbooks. |
| `pause_all_lifecycle_playbooks` | `{ "action": "pause_all_lifecycle_playbooks" }` | Pauses active lifecycle playbooks. |
| `activate_playbook` | `{ "action": "activate_playbook", "playbookId": "..." }` | Activates or creates then activates one playbook. |
| `pause_playbook` | `{ "action": "pause_playbook", "playbookId": "..." }` | Pauses one existing playbook. |
| `plan_customer_lifecycle` | `{ "action": "plan_customer_lifecycle", "userId": "..." }` | Returns customer lifecycle decision plan. |
| `enroll_customer_lifecycle` | `{ "action": "enroll_customer_lifecycle", "userId": "...", "playbookId": "..." }` | Attempts customer enrollment. |
| default create | `{ "playbookId": "..." }` | Creates one campaign draft from a playbook. |

Audit actions:

- `campaign_created`
- `campaign_executed`
- `campaign_converted`

## Admin UI

The admin support workspace includes a `Recovery Funnels` tab rendered by `AdminConciergeInsights.tsx`.

The tab includes:

- lifecycle strategy summary
- funnel map
- guardrails
- playbook coverage cards
- create draft / activate / pause controls per playbook
- create missing lifecycle drafts
- run automation pulse
- optimize strategy
- activate all
- pause all
- industry-pattern panel
- autonomous operating model panel
- optimization report

The UI intentionally keeps bulk activation behind explicit admin action because activating all playbooks can start automated outreach for eligible customers during the next pulse.

## Concierge Tool Tokens

Defined in `systemPrompt.ts` and executed in `src/app/api/concierge/chat/route.ts`.

| Token | Purpose |
| --- | --- |
| `[GET_LIFECYCLE_STRATEGY]` | Inspect full lifecycle map, missing playbooks, guardrails, and coverage. |
| `[DEEP_CUSTOMER_LIFECYCLE: "userId"]` | Build customer-level lifecycle investigation. |
| `[PLAN_CUSTOMER_LIFECYCLE: "userId"]` | Build enrollment decision brief and action plan. |
| `[CREATE_LIFECYCLE_PLAYBOOK: "playbookId"]` | Draft one playbook campaign. |
| `[CREATE_ALL_LIFECYCLE_PLAYBOOKS]` | Draft every missing core lifecycle campaign. |
| `[RUN_LIFECYCLE_AUTOMATION_PULSE]` | Immediately evaluate active campaigns and eligible triggers. |
| `[OPTIMIZE_LIFECYCLE_STRATEGY]` | Generate coverage, activation, conversion, revenue, and recommendations report. |
| `[ACTIVATE_ALL_LIFECYCLE_PLAYBOOKS]` | Activate all lifecycle playbooks. |
| `[PAUSE_ALL_LIFECYCLE_PLAYBOOKS]` | Pause active lifecycle playbooks. |
| `[ACTIVATE_LIFECYCLE_PLAYBOOK: "playbookId"]` | Activate one reviewed playbook. |
| `[PAUSE_LIFECYCLE_PLAYBOOK: "playbookId"]` | Pause one playbook. |
| `[ENROLL_CUSTOMER_LIFECYCLE: "userId", "playbookId"]` | Attempt to enroll an eligible customer. |
| `[SUPPRESS_CUSTOMER_MARKETING: "userId", "reason"]` | Mark a customer as marketing suppressed. |

Governance rule: the Concierge should run `DEEP_CUSTOMER_LIFECYCLE` and `PLAN_CUSTOMER_LIFECYCLE` before recommending enrollment for a customer. It should run `GET_LIFECYCLE_STRATEGY` before creating or changing global campaign strategy.

## Concierge Suppression Tool

`[SUPPRESS_CUSTOMER_MARKETING: "userId", "reason"]` updates the customer profile:

- `marketingSuppressed: true`
- `marketingSuppressionReason`
- `marketingSuppressedAt`
- `updatedAt`

The suppression is checked during campaign next-best-action decisions and blocks marketing execution.

## AI Personalization

`MarketingPersonalization.generateAIPersonalization(campaign, userId)` gives the model:

- lifecycle stage
- campaign offer strategy
- step objective
- evidence confidence
- lifecycle segment
- current cart
- recent needs
- suppressions
- next-best campaign
- service-first requirements

The prompt requires JSON output and strips Markdown code fences before parsing. If AI generation fails, campaign templates remain the fallback.

## Guardrails

The campaign system must not send promotional outreach when any of these are true:

- marketing consent is missing when campaign requires it
- customer is marketing-suppressed
- customer has active unresolved support risk
- customer has angry sentiment that needs service recovery
- customer is inside a recent global frequency cap
- customer is already inside another active sequence
- customer recently purchased and the campaign excludes recent purchasers
- browse abandonment exists but a cart now exists
- cart recovery exists but a purchase now exists

Operational guidance:

- Lead with help and context before discounting.
- Use the smallest useful incentive.
- Protect VIPs with recognition and early access before coupons.
- Use win-back timing based on buying cycle whenever possible.
- Use sunset suppression to protect deliverability.
- Keep split tests tied to a named learning objective.
- Measure revenue per recipient, unsubscribe risk, conversion margin, and retention together.

## Optimization

`CampaignService.optimizeLifecycleStrategy()` returns:

- coverage score
- activation score
- active campaign count
- total campaign count
- total sent
- total conversions
- total revenue
- aggregate conversion rate
- revenue per recipient
- sorted recommendations
- operating model
- guardrails

Recommendation types include:

- create missing playbook
- review and activate draft
- optimize low-conversion flow
- review revenue per recipient
- add missing incentive rules

## Verification

Focused lint command used for this feature surface:

```bash
npx eslint src/core/marketing/CampaignService.ts src/core/marketing/MarketingIntelligence.ts src/core/marketing/MarketingStrategy.ts src/app/api/admin/concierge/marketing-strategy/route.ts src/ui/pages/admin/AdminConciergeInsights.tsx src/domain/concierge/systemPrompt.ts src/app/api/concierge/chat/route.ts
```

Repo-wide typecheck command:

```bash
npm run typecheck
```

Known current caveat: repo-wide typecheck currently fails on older unrelated `TS2554 Expected 1 arguments, but got 0` errors in existing admin/API routes. The focused lifecycle marketing files lint cleanly.

## External Pattern References

These are conceptual references for the lifecycle strategy shape, not runtime dependencies:

- Klaviyo flow best practices: welcome series, abandoned cart, customer winback, timing, and testing.
  - `https://academy.klaviyo.com/en-us/best-practices/best-practices-for-flows`
- Klaviyo abandoned cart flow practices: 2-3 message structure, cart-specific products, urgency, and customization.
  - `https://help.klaviyo.com/hc/en-us/articles/115002779411`
- Braze lifecycle management: behavioral segmentation, lifecycle phases, and real-time journey orchestration.
  - `https://www.braze.com/resources/articles/customer-lifecycle-management`
  - `https://www.braze.com/resources/articles/omnichannel-customer-engagement`

