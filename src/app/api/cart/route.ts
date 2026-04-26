import { NextResponse } from 'next/server';
import { getServerServices } from '@infrastructure/server/services';
import { jsonError, requireSessionUser } from '@infrastructure/server/apiGuards';

export async function GET() {
    try {
        const user = await requireSessionUser();
        const services = await getServerServices();
        return NextResponse.json(await services.cartService.getCart(user.id));
    } catch (error) {
        return jsonError(error, 'Failed to load cart');
    }
}

export async function DELETE() {
    try {
        const user = await requireSessionUser();
        const services = await getServerServices();
        await services.cartService.clearCart(user.id);
        return NextResponse.json({ ok: true });
    } catch (error) {
        return jsonError(error, 'Failed to clear cart');
    }
}
