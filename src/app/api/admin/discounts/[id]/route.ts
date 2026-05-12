import { NextResponse } from 'next/server';
import { getServerServices } from '@infrastructure/server/services';
import { jsonError, readJsonObject, requireAdminSession } from '@infrastructure/server/apiGuards';

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await requireAdminSession(request);
        const { id } = await params;
        const services = await getServerServices();
        await services.discountService.deleteDiscount(id, { id: user.id, email: user.email });
        return NextResponse.json({ success: true });
    } catch (error) {
        return jsonError(error, 'Failed to delete discount');
    }
}

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await requireAdminSession(request);
        const { id } = await params;
        const data = await readJsonObject(request) as any;
        const services = await getServerServices();
        
        if (data.startsAt) data.startsAt = new Date(data.startsAt);
        if (data.endsAt) data.endsAt = new Date(data.endsAt);
        
        const updated = await services.discountService.updateDiscount(id, data, { id: user.id, email: user.email });
        return NextResponse.json(updated);
    } catch (error) {
        return jsonError(error, 'Failed to update discount');
    }
}
