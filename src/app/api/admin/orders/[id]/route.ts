import { NextResponse } from 'next/server';
import { getServerServices } from '@infrastructure/server/services';
import { jsonError, parseOrderStatus, readJsonObject, requireAdminSession, requireStepUpAdminSession } from '@infrastructure/server/apiGuards';
import { DomainError, OrderNotFoundError } from '@domain/errors';
import type { User } from '@domain/models';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        await requireAdminSession(request);
        const { id } = await params;
        const services = await getServerServices();
        const order = await services.orderService.getOrder(id);
        if (!order) throw new OrderNotFoundError(id);
        return NextResponse.json(order);
    } catch (error) {
        return jsonError(error, 'Failed to load order details');
    }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const { status } = await readJsonObject(request);
        const parsedStatus = parseOrderStatus(status);
        if (!parsedStatus) throw new DomainError('status is required.');

        let user: User;
        // Step-up auth for destructive actions
        if (parsedStatus === 'cancelled' || parsedStatus === 'refunded') {
            user = await requireStepUpAdminSession(request);
        } else {
            user = await requireAdminSession(request);
        }

        const services = await getServerServices();
        await services.orderService.updateOrderStatus(id, parsedStatus, { id: user.id, email: user.email });
        return NextResponse.json({ ok: true });
    } catch (error) {
        return jsonError(error, 'Failed to update order status');
    }
}
