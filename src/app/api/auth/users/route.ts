import { NextResponse } from 'next/server';
import { getServerServices } from '@infrastructure/server/services';
import { jsonError, requireAdminSession } from '@infrastructure/server/apiGuards';

export async function GET() {
    try {
        await requireAdminSession();
        const services = await getServerServices();
        const users = await services.authService.getAllUsers();
        return NextResponse.json(users);
    } catch (error) {
        return jsonError(error, 'Failed to fetch users');
    }
}
