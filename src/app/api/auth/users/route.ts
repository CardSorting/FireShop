import { NextResponse } from 'next/server';
import { getServerServices } from '@infrastructure/server/services';
import { jsonError, requireAdminSession } from '@infrastructure/server/apiGuards';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        await requireAdminSession(request);
        const services = await getServerServices();
        const users = await services.authService.getAllUsers();
        return Response.json(users);
    } catch (error) {
        return jsonError(error, 'Failed to fetch users');
    }
}
