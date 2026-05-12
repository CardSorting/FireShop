import { NextResponse } from 'next/server';
import { getServerServices } from '@infrastructure/server/services';
import { jsonError, parseProductUpdate, readJsonObject, requireAdminSession, requireString } from '@infrastructure/server/apiGuards';

export async function POST(request: Request) {
    try {
        const user = await requireAdminSession(request);
        const body = await readJsonObject(request);
        const { updates } = body;

        if (!Array.isArray(updates)) {
            throw new Error('Updates must be an array');
        }

        const validatedUpdates = updates.map((u: any, i: number) => ({
            id: requireString(u.id, `updates[${i}].id`),
            updates: parseProductUpdate(u.updates || {})
        }));

        const services = await getServerServices();
        const results = await services.productService.batchUpdateProducts(
            validatedUpdates, 
            { id: user.id, email: user.email }
        );

        return NextResponse.json(results);
    } catch (error) {
        return jsonError(error, 'Failed to perform batch update');
    }
}

export async function DELETE(request: Request) {
    try {
        const user = await requireAdminSession(request);
        const body = await readJsonObject(request);
        const { ids } = body;

        if (!Array.isArray(ids)) {
            throw new Error('IDs must be an array');
        }

        const validatedIds = ids.map((id, i) => requireString(id, `ids[${i}]`));

        const services = await getServerServices();
        await services.productService.batchDeleteProducts(
            validatedIds, 
            { id: user.id, email: user.email }
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        return jsonError(error, 'Failed to perform batch deletion');
    }
}
