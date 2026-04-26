import { NextResponse } from 'next/server';
import { getServerServices } from '@infrastructure/server/services';
import { jsonError, parseCartItemMutation, parseProductIdMutation, readJsonObject, requireSessionUser } from '@infrastructure/server/apiGuards';

export async function POST(request: Request) {
    try {
        const user = await requireSessionUser();
        const { productId, quantity } = parseCartItemMutation(await readJsonObject(request));
        const services = await getServerServices();
        return NextResponse.json(await services.cartService.addToCart(user.id, productId, quantity));
    } catch (error) {
        return jsonError(error, 'Failed to add item to cart');
    }
}

export async function PATCH(request: Request) {
    try {
        const user = await requireSessionUser();
        const { productId, quantity } = parseCartItemMutation(await readJsonObject(request));
        const services = await getServerServices();
        return NextResponse.json(await services.cartService.updateQuantity(user.id, productId, quantity));
    } catch (error) {
        return jsonError(error, 'Failed to update cart item');
    }
}

export async function DELETE(request: Request) {
    try {
        const user = await requireSessionUser();
        const { productId } = parseProductIdMutation(await readJsonObject(request));
        const services = await getServerServices();
        return NextResponse.json(await services.cartService.removeFromCart(user.id, productId));
    } catch (error) {
        return jsonError(error, 'Failed to remove cart item');
    }
}
