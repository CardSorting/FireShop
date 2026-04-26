import { NextResponse } from 'next/server';
import { getServerServices } from '@infrastructure/server/services';
import { jsonError, requireAdminSession } from '@infrastructure/server/apiGuards';

export async function GET() {
    try {
        await requireAdminSession();
        const services = await getServerServices();
        const logs = await services.auditService.getRecentLogs(50);
        return NextResponse.json(logs);
    } catch (error) {
        return jsonError(error, 'Failed to load audit logs');
    }
}
