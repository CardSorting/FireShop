import { NextResponse } from 'next/server';
import { getServerServices } from '@infrastructure/server/services';
import { jsonError, readJsonObject, requireSessionUser, requireString } from '@infrastructure/server/apiGuards';

export async function GET() {
    try {
        const user = await requireSessionUser();
        const services = await getServerServices();
        const wishlists = await services.wishlistService.getWishlists(user.id);
        return NextResponse.json(wishlists);
    } catch (error) {
        return jsonError(error, 'Failed to load wishlists');
    }
}

export async function POST(request: Request) {
    try {
        const user = await requireSessionUser();
        const body = await readJsonObject(request);
        const name = requireString(body.name, 'name');
        
        const services = await getServerServices();
        const wishlist = await services.wishlistService.createWishlist(user.id, user.email, name);
        return NextResponse.json(wishlist);
    } catch (error) {
        return jsonError(error, 'Failed to create wishlist');
    }
}
