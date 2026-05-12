/**
 * [LAYER: API — ADMIN]
 * POST /api/admin/orders/[id]/reconcile
 *
 * Forensic Recovery Workflow: Step-up admins may resolve a `reconciling` order
 * by providing a resolution action, a mandatory reason, and supporting evidence.
 *
 * Security guarantees:
 *  - requireStepUpAdminSession: fresh auth < 2 min required
 *  - reason + evidence are mandatory (no silent resolutions)
 *  - all resolutions are written to the audit log via OrderService
 *  - automated jobs CANNOT call this route (requires human session + step-up)
 */
import { NextResponse } from 'next/server';
import { getServerServices } from '@infrastructure/server/services';
import {
    jsonError,
    parseOrderStatus,
    readJsonObject,
    requireStepUpAdminSession,
    requireString,
} from '@infrastructure/server/apiGuards';
import { DomainError } from '@domain/errors';

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // Point 1: Only step-up admins can resolve reconciliation
        const user = await requireStepUpAdminSession(request);
        const { id } = await params;

        const body = await readJsonObject(request);

        // Point 1: Every resolution MUST include reason AND evidence
        const resolutionAction = parseOrderStatus(body.resolutionAction);
        if (!resolutionAction) throw new DomainError('resolutionAction is required.');

        const reason = requireString(body.reason, 'reason');
        const evidence = requireString(body.evidence, 'evidence');

        // Guard: resolution action must be a terminal or stable state, not 'reconciling'
        const ALLOWED_RESOLUTION_STATUSES = new Set([
            'confirmed', 'processing', 'shipped', 'delivered', 
            'cancelled', 'refunded', 'partially_refunded'
        ]);
        if (!ALLOWED_RESOLUTION_STATUSES.has(resolutionAction)) {
            throw new DomainError(`Cannot resolve to status: ${resolutionAction}. Must be a stable terminal state.`);
        }

        const services = await getServerServices();

        // Point 1: No automated job can call this — requires human step-up session
        await services.orderService.resolveReconciliation(
            id,
            resolutionAction,
            reason,
            evidence,
            { id: user.id, email: user.email }
        );

        return NextResponse.json({
            ok: true,
            message: `Order ${id} reconciliation resolved as '${resolutionAction}' by ${user.email}.`
        });
    } catch (error) {
        return jsonError(error, 'Failed to resolve order reconciliation');
    }
}
