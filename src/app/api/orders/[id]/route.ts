import { NextResponse } from 'next/server';
import { OrderNotFoundError } from '@domain/errors';
import { getServerServices } from '@infrastructure/server/services';
import { jsonError, requireSessionUser } from '@infrastructure/server/apiGuards';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const user = await requireSessionUser();
        const { id } = await params;
        const services = await getServerServices();
        const order = await services.orderService.getOrder(id);
        if (!order || order.userId !== user.id) {
            throw new OrderNotFoundError(id);
        }
        return NextResponse.json(order);
    } catch (error) {
        return jsonError(error, 'Failed to load order');
    }
}