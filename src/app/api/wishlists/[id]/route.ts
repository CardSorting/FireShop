import { NextResponse } from 'next/server';
import { getServerServices } from '@infrastructure/server/services';
import { jsonError, readJsonObject, requireSessionUser, requireString } from '@infrastructure/server/apiGuards';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const user = await requireSessionUser();
        const services = await getServerServices();
        const wishlist = await services.wishlistService.getWishlist(id);
        
        if (!wishlist || wishlist.userId !== user.id) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }
        
        const items = await services.wishlistService.getItems(id);
        return NextResponse.json({ ...wishlist, items });
    } catch (error) {
        return jsonError(error, 'Failed to load wishlist');
    }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const user = await requireSessionUser();
        const body = await readJsonObject(request);
        const name = requireString(body.name, 'name');
        
        const services = await getServerServices();
        const wishlist = await services.wishlistService.getWishlist(id);
        if (!wishlist || wishlist.userId !== user.id) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }
        
        const updated = await services.wishlistService.updateWishlist(user.id, user.email, id, name);
        return NextResponse.json(updated);
    } catch (error) {
        return jsonError(error, 'Failed to update wishlist');
    }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const user = await requireSessionUser();
        const services = await getServerServices();
        await services.wishlistService.deleteWishlist(user.id, user.email, id);
        return new Response(null, { status: 204 });
    } catch (error) {
        return jsonError(error, 'Failed to delete wishlist');
    }
}
