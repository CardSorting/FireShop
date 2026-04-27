import { NextResponse } from 'next/server';
import { getServerServices } from '@infrastructure/server/services';
import { jsonError, readJsonObject, requireAdminSession, requireOrderStatus, requireString } from '@infrastructure/server/apiGuards';

export async function PATCH(request: Request) {
    try {
        const user = await requireAdminSession();
        const body = await readJsonObject(request);
        const { ids } = body;
        const status = requireOrderStatus(body.status);

        if (!Array.isArray(ids)) {
            throw new Error('IDs must be an array');
        }

        const validatedIds = ids.map((id, i) => requireString(id, `ids[${i}]`));

        const services = await getServerServices();
        await services.orderService.batchUpdateOrderStatus(
            validatedIds, 
            status, 
            { id: user.id, email: user.email }
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        return jsonError(error, 'Failed to perform batch order update');
    }
}
