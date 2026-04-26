import { NextResponse } from 'next/server';
import { getServerServices } from '@infrastructure/server/services';
import { jsonError, parseProductUpdate, readJsonObject, requireAdminSession } from '@infrastructure/server/apiGuards';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const services = await getServerServices();
        return NextResponse.json(await services.productService.getProduct(id));
    } catch (error) {
        return jsonError(error, 'Product not found');
    }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        await requireAdminSession();
        const { id } = await params;
        const services = await getServerServices();
        return NextResponse.json(await services.productService.updateProduct(id, parseProductUpdate(await readJsonObject(request))));
    } catch (error) {
        return jsonError(error, 'Failed to update product');
    }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        await requireAdminSession();
        const { id } = await params;
        const services = await getServerServices();
        await services.productService.deleteProduct(id);
        return NextResponse.json({ ok: true });
    } catch (error) {
        return jsonError(error, 'Failed to delete product');
    }
}
