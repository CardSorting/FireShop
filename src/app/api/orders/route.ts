import { NextResponse } from 'next/server';
import { getServerServices } from '@infrastructure/server/services';
import { assertRateLimit, jsonError, parseCheckoutRequest, readJsonObject, requireSessionUser } from '@infrastructure/server/apiGuards';

export async function GET(request: Request) {
    try {
        const user = await requireSessionUser();
        const services = await getServerServices();
        const { searchParams } = new URL(request.url);
        const statusParam = searchParams.get('status');
        const query = searchParams.get('query') ?? undefined;
        const from = searchParams.get('from');
        const to = searchParams.get('to');
        const sort = searchParams.get('sort');

        const orders = await services.orderService.getOrdersForCustomerView(user.id, {
            status: statusParam === 'all' || statusParam === 'pending' || statusParam === 'confirmed' || statusParam === 'shipped' || statusParam === 'delivered' || statusParam === 'cancelled'
                ? statusParam
                : undefined,
            query,
            from: from ? new Date(from) : undefined,
            to: to ? new Date(to) : undefined,
            sort: sort === 'newest' || sort === 'oldest' || sort === 'total_desc' || sort === 'total_asc' || sort === 'status'
                ? sort
                : undefined,
        });

        return NextResponse.json(orders);
    } catch (error) {
        return jsonError(error, 'Failed to load orders');
    }
}

export async function POST(request: Request) {
    try {
        assertRateLimit(request, 'checkout:place-order', 12, 60_000);
        const user = await requireSessionUser();
        const { shippingAddress, paymentMethodId, idempotencyKey, discountCode } = parseCheckoutRequest(await readJsonObject(request));
        const services = await getServerServices();
        const order = await services.orderService.placeOrder(user.id, shippingAddress, paymentMethodId, idempotencyKey, discountCode);
        return NextResponse.json(order);
    } catch (error) {
        return jsonError(error, 'Failed to place order');
    }
}
