import { NextResponse } from 'next/server';
import { getServerServices } from '@infrastructure/server/services';
import { jsonError, parseBoundedLimit, parseOrderStatus, requireAdminSession } from '@infrastructure/server/apiGuards';

export async function GET(request: Request) {
    try {
        await requireAdminSession(request);
        const { searchParams } = new URL(request.url);
        const services = await getServerServices();
        
        if (searchParams.get('overview') === 'true') {
            return NextResponse.json(await services.orderService.getAdminOverview());
        }

        return NextResponse.json(await services.orderService.getAllOrders({
            status: parseOrderStatus(searchParams.get('status')),
            limit: parseBoundedLimit(searchParams.get('limit')),
            cursor: searchParams.get('cursor') ?? undefined,
        }));
    } catch (error) {
        return jsonError(error, 'Failed to load admin orders');
    }
}
