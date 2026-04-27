import { NextResponse } from 'next/server';
import { getServerServices } from '@infrastructure/server/services';
import { jsonError, requireAdminSession } from '@infrastructure/server/apiGuards';

export async function GET() {
    try {
        await requireAdminSession();
        const services = await getServerServices();
        const discounts = await services.discountService.getAllDiscounts();
        return NextResponse.json(discounts);
    } catch (error) {
        return jsonError(error, 'Failed to fetch discounts');
    }
}

export async function POST(request: Request) {
    try {
        const user = await requireAdminSession();
        const data = await request.json();
        const services = await getServerServices();
        
        // Convert ISO strings back to Date objects
        if (data.startsAt) data.startsAt = new Date(data.startsAt);
        if (data.endsAt) data.endsAt = new Date(data.endsAt);
        
        const discount = await services.discountService.createDiscount(data, { id: user.id, email: user.email });
        return NextResponse.json(discount);
    } catch (error) {
        return jsonError(error, 'Failed to create discount');
    }
}
