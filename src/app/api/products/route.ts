import { NextResponse } from 'next/server';
import { getServerServices } from '@infrastructure/server/services';
import { jsonError, parseBoundedLimit, parseProductDraft, readJsonObject, requireAdminSession } from '@infrastructure/server/apiGuards';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const services = await getServerServices();
        const result = await services.productService.getProducts({
            category: searchParams.get('category') ?? undefined,
            limit: parseBoundedLimit(searchParams.get('limit')),
            cursor: searchParams.get('cursor') ?? undefined,
        });
        return NextResponse.json(result);
    } catch (error) {
        return jsonError(error, 'Failed to load products');
    }
}

export async function POST(request: Request) {
    try {
        const user = await requireAdminSession();
        const services = await getServerServices();
        const product = await services.productService.createProduct(
            parseProductDraft(await readJsonObject(request)),
            { id: user.id, email: user.email }
        );
        return NextResponse.json(product);
    } catch (error) {
        return jsonError(error, 'Failed to create product');
    }
}
