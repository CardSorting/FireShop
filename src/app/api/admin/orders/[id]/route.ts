import { NextResponse } from 'next/server';
import { getServerServices } from '@infrastructure/server/services';
import { jsonError, parseOrderStatus, readJsonObject, requireAdminSession } from '@infrastructure/server/apiGuards';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        await requireAdminSession();
        const { id } = await params;
        const { status } = await readJsonObject(request);
        const parsedStatus = parseOrderStatus(status);
        if (!parsedStatus) throw new Error('status is required.');
        const services = await getServerServices();
        await services.orderService.updateOrderStatus(id, parsedStatus);
        return NextResponse.json({ ok: true });
    } catch (error) {
        return jsonError(error, 'Failed to update order status');
    }
}
