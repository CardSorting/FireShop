import type { ApprovalRequirement, PolicyRisk, ProposedOperation } from '@domain/ops/types';
import { DEFAULT_OPERATIONAL_POLICIES, RISK_ORDER } from '@domain/ops/policies';
import { AuditService } from './AuditService';

export class PolicyEngineService {
  constructor(private audit: AuditService) {}

  evaluateOperations(operations: ProposedOperation[]): {
    operations: ProposedOperation[];
    risks: PolicyRisk[];
    approvals: ApprovalRequirement[];
  } {
    const risks: PolicyRisk[] = [];
    const approvals: ApprovalRequirement[] = [];

    const governed = operations.map((operation) => {
      let requiresApproval = operation.requiresApproval;

      for (const policy of DEFAULT_OPERATIONAL_POLICIES) {
        const appliesToTool = policy.appliesTo === '*' || policy.appliesTo === operation.tool;
        const appliesToTarget = !policy.target || policy.target === operation.target;
        const appliesToRisk = !policy.minRisk || RISK_ORDER[operation.riskLevel] >= RISK_ORDER[policy.minRisk];
        if (!appliesToTool || !appliesToTarget || !appliesToRisk) continue;

        risks.push({
          id: `${policy.id}:${operation.id}`,
          operationId: operation.id,
          target: operation.target,
          severity: policy.effect === 'require_step_up_auth' ? 'critical' : operation.riskLevel,
          effect: policy.effect,
          reason: policy.reason,
        });

        if (policy.effect === 'require_approval' || policy.effect === 'require_step_up_auth') {
          requiresApproval = true;
          approvals.push({
            id: `approval:${policy.id}:${operation.id}`,
            operationId: operation.id,
            level: policy.effect === 'require_step_up_auth' ? 'step_up' : 'standard',
            reason: policy.reason,
            status: 'required',
          });
        }
      }

      if (requiresApproval) {
        // Forensic: Record policy intervention
        this.audit.record({
          userId: 'system',
          userEmail: 'policy-engine@dreambees.art',
          action: 'settings_updated', // We can use a more specific action if we add it to AuditAction
          targetId: operation.id,
          details: { type: 'policy_intervention', tool: operation.tool, target: operation.target, risks: risks.filter(r => r.operationId === operation.id) }
        });
      }

      return { ...operation, requiresApproval };
    });

    const dedupedApprovals = Array.from(new Map(approvals.map((approval) => [approval.id, approval])).values());
    const dedupedRisks = Array.from(new Map(risks.map((risk) => [risk.id, risk])).values());

    return { operations: governed, risks: dedupedRisks, approvals: dedupedApprovals };
  }
}