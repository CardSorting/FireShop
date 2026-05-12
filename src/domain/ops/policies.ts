/** [LAYER: DOMAIN] Policy semantics for governed operational plans. */
import type { OperationRiskLevel, OperationalTarget, ProposedOperation } from './types';

export type PolicyEffect = 'allow' | 'require_approval' | 'require_step_up_auth' | 'deny' | 'require_simulation';

export interface OperationalPolicy {
  id: string;
  appliesTo: ProposedOperation['tool'] | '*';
  target?: OperationalTarget;
  minRisk?: OperationRiskLevel;
  effect: PolicyEffect;
  reason: string;
}

export const RISK_ORDER: Record<OperationRiskLevel, number> = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

export const DEFAULT_OPERATIONAL_POLICIES: OperationalPolicy[] = [
  {
    id: 'mutations-require-business-pr-approval',
    appliesTo: '*',
    minRisk: 'medium',
    effect: 'require_approval',
    reason: 'Medium-or-higher operational changes must be reviewed as a business pull request.',
  },
  {
    id: 'discounts-require-simulation',
    appliesTo: 'discount.draft',
    effect: 'require_simulation',
    reason: 'Discounts can compress margins and increase fulfillment pressure.',
  },
  {
    id: 'purchase-order-submission-approval',
    appliesTo: 'purchase_order.draft',
    effect: 'require_approval',
    reason: 'Procurement commitments should remain human-approved until supplier rules are configured.',
  },
  {
    id: 'storefront-merchandising-approval',
    appliesTo: 'storefront.draft_featured_collection',
    effect: 'require_approval',
    reason: 'Homepage and merchandising changes affect customer-facing presentation.',
  },
  {
    id: 'critical-risk-step-up',
    appliesTo: '*',
    minRisk: 'critical',
    effect: 'require_step_up_auth',
    reason: 'Critical operations require fresh admin verification before execution.',
  },
];