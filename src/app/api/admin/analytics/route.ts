import { NextResponse } from 'next/server';
import { getServerServices } from '@infrastructure/server/services';
import { jsonError, requireAdminSession } from '@infrastructure/server/apiGuards';

export async function GET() {
    try {
        await requireAdminSession();
        const services = await getServerServices();
        const analytics = await services.orderService.getAnalyticsData();
        return NextResponse.json(analytics);
    } catch (error) {
        return jsonError(error, 'Failed to load analytics data');
    }
}
