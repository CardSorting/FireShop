import { getServerServices } from '@infrastructure/server/services';
import { jsonError, readJsonObject, requireString } from '@infrastructure/server/apiGuards';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await readJsonObject(request);
        const code = requireString(body.code, 'code');
        const cartTotal = Number(body.cartTotal);

        if (isNaN(cartTotal)) {
            return NextResponse.json({ error: 'Invalid cart total' }, { status: 400 });
        }

        const services = await getServerServices();
        const result = await services.discountService.validateDiscount(code, cartTotal);

        return NextResponse.json(result);
    } catch (error) {
        return jsonError(error, 'Failed to validate discount');
    }
}
