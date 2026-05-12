import { NextResponse } from 'next/server';
import { getServerServices } from '@infrastructure/server/services';
import { assertRateLimit, jsonError, parseCartItemMutation, parseProductIdMutation, readJsonObject, requireSessionUser } from '@infrastructure/server/apiGuards';
import { DomainError } from '@domain/errors';

export async function POST(request: Request) {
    try {
        const user = await requireSessionUser();
        await assertRateLimit(request, 'cart:add', 30, 60_000); // 30 adds/min
        const { productId, quantity, variantId } = parseCartItemMutation(await readJsonObject(request));
        if (quantity <= 0 || quantity > 99) throw new DomainError('Quantity must be between 1 and 99.');
        const services = await getServerServices();
        return NextResponse.json(await services.cartService.addToCart(user.id, productId, quantity, variantId));
    } catch (error) {
        return jsonError(error, 'Failed to add item to cart');
    }
}

export async function PATCH(request: Request) {
    try {
        const user = await requireSessionUser();
        await assertRateLimit(request, 'cart:update', 30, 60_000);
        const { productId, quantity, variantId } = parseCartItemMutation(await readJsonObject(request));
        if (quantity < 0 || quantity > 99) throw new DomainError('Quantity must be between 0 and 99.');
        const services = await getServerServices();
        return NextResponse.json(await services.cartService.updateQuantity(user.id, productId, quantity, variantId));
    } catch (error) {
        return jsonError(error, 'Failed to update cart item');
    }
}

export async function DELETE(request: Request) {
    try {
        const user = await requireSessionUser();
        await assertRateLimit(request, 'cart:remove', 30, 60_000);
        const { productId, variantId } = parseProductIdMutation(await readJsonObject(request));
        const services = await getServerServices();
        return NextResponse.json(await services.cartService.removeFromCart(user.id, productId, variantId));
    } catch (error) {
        return jsonError(error, 'Failed to remove cart item');
    }
}

