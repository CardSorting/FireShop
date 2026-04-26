import { NextResponse } from 'next/server';
import { getServerServices } from '@infrastructure/server/services';
import { jsonError, requireAdminSession } from '@infrastructure/server/apiGuards';

export async function POST(request: Request) {
    try {
        await requireAdminSession();
        const { users } = await request.json();
        const services = await getServerServices();
        const summaries = await services.orderService.getCustomerSummaries(users);
        return NextResponse.json(summaries);
    } catch (error) {
        return jsonError(error, 'Failed to fetch customer summaries');
    }
}
