import { NextResponse } from 'next/server';
import { getServerServices } from '@infrastructure/server/services';
import { jsonError, requireAdminSession } from '@infrastructure/server/apiGuards';

async function getCustomerSummariesResponse() {
    const services = await getServerServices();
    const users = await services.authService.getAllUsers();
    const summaries = await services.orderService.getCustomerSummaries(users);
    return NextResponse.json(summaries);
}

export async function GET() {
    try {
        await requireAdminSession();
        return await getCustomerSummariesResponse();
    } catch (error) {
        return jsonError(error, 'Failed to fetch customer summaries');
    }
}

export async function POST(request: Request) {
    try {
        await requireAdminSession(request);
        return await getCustomerSummariesResponse();
    } catch (error) {
        return jsonError(error, 'Failed to fetch customer summaries');
    }
}
