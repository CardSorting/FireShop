import { NextResponse } from 'next/server';
import { getServerServices } from '@infrastructure/server/services';
import { assertRateLimit, jsonError, readJsonObject, requireSessionUser } from '@infrastructure/server/apiGuards';

export async function POST(request: Request) {
    try {
        const user = await requireSessionUser();
        await assertRateLimit(request, 'cart:note', 30, 60_000);
        const payload = await readJsonObject(request);
        const note = String(payload.note ?? '');
        const services = await getServerServices();
        return NextResponse.json(await services.cartService.updateNote(user.id, note));
    } catch (error) {
        return jsonError(error, 'Failed to update cart note');
    }
}
