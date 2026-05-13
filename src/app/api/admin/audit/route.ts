import { NextResponse } from 'next/server';
import { getServerServices } from '@infrastructure/server/services';
import { logger } from '@utils/logger';
import { jsonError, requireAdminSession } from '@infrastructure/server/apiGuards';

export async function GET() {
    try {
        await requireAdminSession();
        const services = await getServerServices();
        const logs = await services.auditService.getRecentLogs({ limit: 50 });
        return NextResponse.json(logs);
    } catch (error) {
        return jsonError(error, 'Failed to load audit logs');
    }
}

export async function POST() {
    try {
        // Verification is resource intensive, require step-up session
        await requireAdminSession(); // In a full app, this might be requireStepUpAdminSession
        const services = await getServerServices();
        
        logger.info('[Forensic] Admin-initiated audit chain verification starting...');
        const result = await services.auditService.verifyChain();
        
        return NextResponse.json(result);
    } catch (error) {
        return jsonError(error, 'Forensic verification failed');
    }
}
