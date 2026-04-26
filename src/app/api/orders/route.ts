import { NextResponse } from 'next/server';
import { getServerServices } from '@infrastructure/server/services';
import { jsonError, parseCheckoutRequest, readJsonObject, requireSessionUser } from '@infrastructure/server/apiGuards';

export async function GET() {
    try {
        const user = await requireSessionUser();
        const services = await getServerServices();
        return NextResponse.json(await services.orderService.getOrders(user.id));
    } catch (error) {
        return jsonError(error, 'Failed to load orders');
    }
}

export async function POST(request: Request) {
    try {
        const user = await requireSessionUser();
        const { shippingAddress, paymentMethodId, idempotencyKey } = parseCheckoutRequest(await readJsonObject(request));
        const services = await getServerServices();
        const order = await services.orderService.placeOrder(user.id, shippingAddress, paymentMethodId, idempotencyKey);
        return NextResponse.json(order);
    } catch (error) {
        return jsonError(error, 'Failed to place order');
    }
}
